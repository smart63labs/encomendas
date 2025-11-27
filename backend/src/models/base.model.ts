import { DatabaseService, OracleUtils } from '../config/database';
import oracledb from 'oracledb';

/**
 * Interface para filtros de busca
 */
export interface SearchFilters {
  [key: string]: any;
}

/**
 * Interface para opções de paginação
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

/**
 * Interface para resultado paginado
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Classe base para todos os modelos
 * Fornece operações CRUD básicas e utilitários comuns
 */
export abstract class BaseModel {
  protected static tableName: string;
  protected static primaryKey: string = 'id';
  protected static fillable: string[] = [];
  protected static hidden: string[] = ['senha', 'password'];
  protected static timestamps: boolean = true;

  /**
   * Buscar todos os registros com filtros e paginação
   */
  static async findAll<T = any>(
    filters: SearchFilters = {}, 
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 10, orderBy = 'created_at', orderDirection = 'DESC' } = pagination;
    const offset = (page - 1) * limit;

    // Construir query base
    let sql = `SELECT * FROM ${this.tableName}`;
    const binds: any = {};
    const conditions: string[] = [];

    // Aplicar filtros dinamicamente
    Object.keys(filters).forEach((key, index) => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'string' && value.includes('%')) {
          // Busca com LIKE
          conditions.push(`UPPER(${key}) LIKE UPPER(:filter${index})`);
        } else if (Array.isArray(value)) {
          // Busca com IN
          const placeholders = value.map((_, i) => `:filter${index}_${i}`).join(', ');
          conditions.push(`${key} IN (${placeholders})`);
          value.forEach((val, i) => {
            binds[`filter${index}_${i}`] = val;
          });
          return; // Pular a atribuição normal do bind
        } else {
          // Busca exata
          conditions.push(`${key} = :filter${index}`);
        }
        binds[`filter${index}`] = value;
      }
    });

    // Adicionar condições WHERE
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Contar total de registros
    const countSql = `SELECT COUNT(*) as total FROM (${sql})`;
    const countResult = await DatabaseService.executeQuery(countSql, binds);
    const total = (countResult.rows?.[0] as any)?.TOTAL || 0;

    // Resolver coluna de ordenação de forma segura e compatível com o schema real
    // 1) Obter colunas disponíveis da tabela
    const colsResult = await DatabaseService.executeQuery(
      `SELECT COLUMN_NAME FROM USER_TAB_COLUMNS WHERE TABLE_NAME = :tname`,
      { tname: this.tableName?.toUpperCase() }
    );
    const cols = new Set<string>((colsResult.rows || []).map((r: any) => r.COLUMN_NAME));

    // 2) Mapear chaves canônicas para colunas existentes
    const createdCandidates = ['DATA_CRIACAO', 'CREATED_AT', 'DATA_EMISSAO'];
    const updatedCandidates = ['DATA_ATUALIZACAO', 'UPDATED_AT', 'DATA_VALIDADE'];
    const orderKeyUpper = (orderBy || '').toUpperCase();

    let effectiveOrderBy = orderKeyUpper;
    if (!effectiveOrderBy || effectiveOrderBy === 'CREATED_AT') {
      effectiveOrderBy = createdCandidates.find(c => cols.has(c)) || this.primaryKey?.toUpperCase() || 'ID';
    } else if (effectiveOrderBy === 'UPDATED_AT') {
      effectiveOrderBy = updatedCandidates.find(c => cols.has(c)) || this.primaryKey?.toUpperCase() || 'ID';
    } else if (!cols.has(effectiveOrderBy)) {
      // Se a coluna solicitada não existe, fazer fallback seguro
      effectiveOrderBy = createdCandidates.find(c => cols.has(c))
        || updatedCandidates.find(c => cols.has(c))
        || this.primaryKey?.toUpperCase()
        || 'ID';
    }

    const safeDirection = (orderDirection || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    // 3) Adicionar ordenação e paginação
    sql += ` ORDER BY ${effectiveOrderBy} ${safeDirection}`;
    sql += ` OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
    
    // Adicionar offset e limit aos binds
    binds.offset = offset;
    binds.limit = limit;

    const result = await DatabaseService.executeQuery(sql, binds);
    const data = this.processResults(result.rows || []);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Buscar registro por ID
   */
  static async findById<T = any>(id: number | string): Promise<T | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = :id`;
    const result = await DatabaseService.executeQuery(sql, { id });
    const row = result.rows?.[0];
    
    return row ? this.processResult(row) : null;
  }

  /**
   * Buscar um registro com condições personalizadas
   */
  static async findOne<T = any>(conditions: SearchFilters): Promise<T | null> {
    const result = await this.findAll<T>(conditions, { limit: 1 });
    return result.data[0] || null;
  }

  /**
   * Verificar se registro existe
   */
  static async exists(conditions: SearchFilters): Promise<boolean> {
    const binds: any = {};
    const whereConditions: string[] = [];

    Object.keys(conditions).forEach((key, index) => {
      if (conditions[key] !== undefined && conditions[key] !== null) {
        whereConditions.push(`${key} = :condition${index}`);
        binds[`condition${index}`] = conditions[key];
      }
    });

    const sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${whereConditions.join(' AND ')}`;
    const result = await DatabaseService.executeQuery(sql, binds);
    const count = (result.rows?.[0] as any)?.COUNT || 0;
    
    return count > 0;
  }

  /**
   * Criar novo registro
   */
  static async create<T = any>(data: Partial<T>): Promise<T> {
    // Filtrar apenas campos permitidos
    const filteredData = this.filterFillable(data);
    // Normalizar valores para Oracle (ex.: boolean -> '1'/'0')
    let normalizedData: any = {};
    Object.keys(filteredData).forEach((key) => {
      const val = (filteredData as any)[key];
      if (typeof val === 'boolean') {
        normalizedData[key] = val ? '1' : '0';
      } else {
        normalizedData[key] = val;
      }
    });

    // Executar hook beforeCreate para permitir ajustes (ex.: DATA_CRIACAO/DATA_ATUALIZACAO)
    normalizedData = await this.beforeCreate(normalizedData);
    
    // Adicionar timestamps se habilitado
    if (this.timestamps) {
      normalizedData.created_at = new Date();
      normalizedData.updated_at = new Date();
    }

    const fields = Object.keys(normalizedData);
    // Converter nomes dos campos para UPPER_SNAKE_CASE quando necessário
    const oracleFields = fields.map(field => {
      // Se já estiver em formato de coluna Oracle (MAIÚSCULO/underscore), manter
      if (/^[A-Z0-9_]+$/.test(field)) return field;
      // Converter camelCase para snake_case e depois para MAIÚSCULAS
      const snakeCase = field.replace(/([A-Z])/g, '_$1').toUpperCase();
      return snakeCase;
    });
    const values = fields.map(field => `:${field}`);
    
    const sql = `
      INSERT INTO ${this.tableName} (${oracleFields.join(', ')}) 
      VALUES (${values.join(', ')}) 
      RETURNING ${this.primaryKey.toUpperCase()} INTO :newId
    `;

    const binds = {
      ...normalizedData,
      newId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    };

    const result = await DatabaseService.executeQuery(sql, binds);
    const newId = result.outBinds?.newId?.[0];
    
    if (!newId) {
      throw new Error('Falha ao criar registro: ID não retornado');
    }

    const createdRecord = await this.findById<T>(newId);
    if (!createdRecord) {
      throw new Error('Falha ao recuperar registro criado');
    }
    // Executar hook afterCreate
    await this.afterCreate(createdRecord);

    return createdRecord as T;
  }

  /**
   * Atualizar registro por ID
   */
  static async update<T = any>(id: number | string, data: any): Promise<T | null> {
    console.log('🔍 [BASE MODEL] Iniciando update - ID:', id, 'Tabela:', this.tableName);
    
    // Filtrar apenas campos permitidos
    console.log('🔍 [BASE MODEL] Filtrando campos permitidos');
    const filteredData = this.filterFillable(data);
    console.log('🔍 [BASE MODEL] Campos filtrados:', Object.keys(filteredData));

    // Normalizar valores para Oracle (ex.: boolean -> '1'/'0')
    let normalizedData: any = {};
    Object.keys(filteredData).forEach((key) => {
      const val = (filteredData as any)[key];
      if (typeof val === 'boolean') {
        normalizedData[key] = val ? '1' : '0';
      } else {
        normalizedData[key] = val;
      }
    });
    
    // Executar hook beforeUpdate para permitir ajustes (ex.: DATA_ATUALIZACAO)
    normalizedData = await this.beforeUpdate(id, normalizedData);
    
    // Adicionar timestamp de atualização
    if (this.timestamps) {
      console.log('🔍 [BASE MODEL] Adicionando timestamp de atualização');
      (normalizedData as any).updated_at = new Date();
    }

    const fields = Object.keys(normalizedData);
    if (fields.length === 0) {
      console.log('🔍 [BASE MODEL] Nenhum campo para atualizar, retornando registro atual');
      // Nenhum campo para atualizar; retornar registro atual (se existir)
      return await this.findById<T>(id);
    }

    console.log('🔍 [BASE MODEL] Construindo query SQL');
    // Converte nome de campo para coluna Oracle, citando quando necessário
    const toOracleColumn = (field: string): string => {
      const isUpper = field === field.toUpperCase();
      if (isUpper) {
        // Já parece ser nome de coluna do banco
        if (/^[A-Z0-9_]+$/.test(field)) {
          return field; // identificador simples
        }
        // Contém caracteres especiais: precisa de aspas duplas
        return `"${field}"`;
      }
      // Campo em camelCase: converter para UPPER_SNAKE
      return field.replace(/([A-Z])/g, '_$1').toUpperCase();
    };

    const setClause = fields.map(field => {
      const oracleColumn = toOracleColumn(field);
      // Parâmetro de bind seguro (apenas letras/números/underscore)
      const bindParam = field.replace(/[^a-zA-Z0-9_]/g, '_');
      return `${oracleColumn} = :${bindParam}`;
    }).join(', ');
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${this.primaryKey} = :id`;
    
    // Criar objeto binds com nomes de parâmetros válidos
    const binds: any = { id };
    fields.forEach(field => {
      const bindParam = field.replace(/[^a-zA-Z0-9_]/g, '_');
      binds[bindParam] = normalizedData[field];
    });
    
    console.log('🔍 [BASE MODEL] SQL:', sql);
    console.log('🔍 [BASE MODEL] Binds:', Object.keys(binds));

    // Executa UPDATE e usa rowsAffected para verificar existência
    console.log('🔍 [BASE MODEL] Executando query UPDATE');
    const result = await DatabaseService.executeQuery(sql, binds);
    console.log('🔍 [BASE MODEL] Query UPDATE executada, rowsAffected:', result.rowsAffected);
    
    if (!result.rowsAffected || result.rowsAffected === 0) {
      console.log('🔍 [BASE MODEL] Nenhuma linha atualizada - registro não encontrado');
      // Nenhuma linha atualizada: registro não encontrado
      return null;
    }

    // Buscar e retornar o registro atualizado
    console.log('🔍 [BASE MODEL] Buscando registro atualizado');
    const updatedRecord = await this.findById<T>(id);
    console.log('🔍 [BASE MODEL] Registro atualizado encontrado');
    // Executar hook afterUpdate
    await this.afterUpdate(id, normalizedData);
    return updatedRecord;
  }

  /**
   * Excluir registro por ID
   */
  static async delete(id: number | string): Promise<boolean> {
    const sql = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} = :id`;
    const result = await DatabaseService.executeQuery(sql, { id });
    return (result.rowsAffected || 0) > 0;
  }

  /**
   * Excluir múltiplos registros
   */
  static async deleteMany(ids: (number | string)[]): Promise<number> {
    if (ids.length === 0) return 0;

    const placeholders = ids.map((_, index) => `:id${index}`).join(', ');
    const binds: any = {};
    ids.forEach((id, index) => {
      binds[`id${index}`] = id;
    });

    const sql = `DELETE FROM ${this.tableName} WHERE ${this.primaryKey} IN (${placeholders})`;
    const result = await DatabaseService.executeQuery(sql, binds);
    return result.rowsAffected || 0;
  }

  /**
   * Contar registros com filtros
   */
  static async count(filters: SearchFilters = {}): Promise<number> {
    let sql = `SELECT COUNT(*) as total FROM ${this.tableName}`;
    const binds: any = {};
    const conditions: string[] = [];

    Object.keys(filters).forEach((key, index) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        conditions.push(`${key} = :filter${index}`);
        binds[`filter${index}`] = filters[key];
      }
    });

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    const result = await DatabaseService.executeQuery(sql, binds);
    return (result.rows?.[0] as any)?.TOTAL || 0;
  }

  /**
   * Executar query SQL personalizada
   */
  static async query<T = any>(sql: string, binds: any = {}): Promise<T[]> {
    const result = await DatabaseService.executeQuery(sql, binds);
    return this.processResults(result.rows || []);
  }

  /**
   * Executar query SQL personalizada com paginação
   */
  static async queryWithPagination<T = any>(
    sql: string,
    binds: any = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 10 } = pagination;
    
    const result = await DatabaseService.executeWithPagination(sql, binds, page, limit);
    
    return {
      data: this.processResults(result.data),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages
      }
    };
  }

  /**
   * Busca com texto livre (full-text search)
   */
  static async search<T = any>(
    searchTerm: string,
    searchFields: string[],
    filters: SearchFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<T>> {
    const searchConditions = searchFields.map((field, index) => 
      `UPPER(${field}) LIKE UPPER(:search${index})`
    ).join(' OR ');

    const searchBinds: any = {};
    searchFields.forEach((_, index) => {
      searchBinds[`search${index}`] = `%${searchTerm}%`;
    });

    // Combinar filtros de busca com filtros normais
    const combinedFilters = { ...filters };
    const extraConditions = searchConditions;

    let sql = `SELECT * FROM ${this.tableName}`;
    const binds: any = { ...searchBinds };
    const conditions: string[] = [];

    // Adicionar condição de busca
    if (searchTerm.trim()) {
      conditions.push(`(${extraConditions})`);
    }

    // Adicionar filtros normais
    Object.keys(combinedFilters).forEach((key, index) => {
      if (combinedFilters[key] !== undefined && combinedFilters[key] !== null) {
        conditions.push(`${key} = :filter${index}`);
        binds[`filter${index}`] = combinedFilters[key];
      }
    });

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    return await this.queryWithPagination<T>(sql, binds, pagination);
  }

  /**
   * Filtrar apenas campos permitidos (fillable)
   */
  protected static filterFillable(data: any): any {
    if (this.fillable.length === 0) {
      return data; // Se não há restrições, permitir todos os campos
    }

    // Aceitar tanto campos declarados em fillable (frontend) quanto colunas já mapeadas (MAIÚSCULAS)
    const filtered: any = {};
    Object.keys(data).forEach((key) => {
      const isDbColumn = key === key.toUpperCase(); // colunas mapeadas geralmente estão em MAIÚSCULAS
      if (isDbColumn || this.fillable.includes(key)) {
        filtered[key] = data[key];
      }
    });

    return filtered;
  }

  /**
   * Processar resultado único (remover campos hidden, converter para camelCase)
   */
  protected static processResult(row: any): any {
    if (!row) return null;

    // Converter para camelCase
    const processed = OracleUtils.toCamelCase(row);

    // Remover campos hidden
    this.hidden.forEach(field => {
      delete processed[field];
    });

    return processed;
  }

  /**
   * Processar múltiplos resultados
   */
  protected static processResults(rows: any[]): any[] {
    return rows.map(row => this.processResult(row));
  }

  /**
   * Validar dados antes de salvar
   */
  protected static validate(_data: any): { valid: boolean; errors: string[] } {
    // Implementação básica de validação
    // Pode ser sobrescrita nas classes filhas
    return { valid: true, errors: [] };
  }

  /**
   * Hook executado antes de criar
   */
  protected static async beforeCreate(data: any): Promise<any> {
    return data;
  }

  /**
   * Hook executado após criar
   */
  protected static async afterCreate(_data: any): Promise<void> {
    // Implementação vazia - pode ser sobrescrita
  }

  /**
   * Hook executado antes de atualizar
   */
  protected static async beforeUpdate(_id: number | string, data: any): Promise<any> {
    return data;
  }

  /**
   * Hook executado após atualizar
   */
  protected static async afterUpdate(_id: number | string, _data: any): Promise<void> {
    // Implementação vazia - pode ser sobrescrita
  }

  /**
   * Hook executado antes de excluir
   */
  protected static async beforeDelete(_id: number | string): Promise<boolean> {
    return true; // Permitir exclusão por padrão
  }

  /**
   * Hook executado após excluir
   */
  protected static async afterDelete(_id: number | string): Promise<void> {
    // Implementação vazia - pode ser sobrescrita
  }
}

export default BaseModel;