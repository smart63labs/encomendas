import BaseModel, { PaginationOptions, PaginatedResult, SearchFilters } from './base.model';

/**
 * Modelo de Malote
 * Gerencia registros na tabela MALOTE
 */
export class MaloteModel extends BaseModel {
  protected static override tableName = 'MALOTE';
  protected static override primaryKey = 'ID';
  protected static override fillable = [
    'numeroContrato',
    'numeroPercurso',
    'codigoEmissao',
    'dataEmissao',
    'dataValidade',
    'numeroMalote',
    'cepOrigem',
    'cepDestino',
    'ida',
    'tamanho',
    'diasServico',
    'estacao',
    'distritos',
    'ativo',
    'setorOrigemId',
    'setorDestinoId'
  ];
  // A tabela usa DATA_CRIACAO/DATA_ATUALIZACAO em vez de created_at/updated_at
  protected static override timestamps = false;

  /**
   * Sobrescrever findAll para incluir JOIN com SETORES
   * Retorna resultado paginado compatível com BaseController
   */
  static override async findAll<T = any>(
    filters: SearchFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<T>> {
    // Construir SQL base com JOIN dos setores
    let sql = `
      SELECT 
        m.*,
        so.NOME_SETOR as SETOR_ORIGEM_NOME,
        sd.NOME_SETOR as SETOR_DESTINO_NOME
      FROM ${this.tableName} m
      LEFT JOIN SETORES so ON m.SETOR_ORIGEM_ID = so.ID
      LEFT JOIN SETORES sd ON m.SETOR_DESTINO_ID = sd.ID
    `;

    const binds: any = {};
    const conditions: string[] = [];

    // Aplicar filtros dinamicamente (sempre prefixando com alias "m")
    Object.keys(filters).forEach((key, index) => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        const column = `m.${key}`;
        if (typeof value === 'string' && value.includes('%')) {
          conditions.push(`UPPER(${column}) LIKE UPPER(:filter${index})`);
        } else if (Array.isArray(value)) {
          const placeholders = value.map((_, i) => `:filter${index}_${i}`).join(', ');
          conditions.push(`${column} IN (${placeholders})`);
          value.forEach((val: any, i: number) => {
            binds[`filter${index}_${i}`] = val;
          });
          return; // evita atribuição do bind padrão abaixo
        } else {
          conditions.push(`${column} = :filter${index}`);
        }
        binds[`filter${index}`] = value;
      }
    });

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Ordenação (já mapeada em MaloteController.extractPagination)
    const { orderBy = this.primaryKey, orderDirection = 'DESC' } = pagination;
    sql += ` ORDER BY m.${orderBy} ${orderDirection}`;

    // Usar utilitário de paginação da BaseModel
    return await this.queryWithPagination<T>(sql, binds, pagination);
  }

  /**
   * Busca textual com JOINs preservando campos esperados pelo frontend
   */
  static override async search<T = any>(
    searchTerm: string,
    searchFields: string[],
    filters: SearchFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<T>> {
    let sql = `
      SELECT 
        m.*,
        so.NOME_SETOR as SETOR_ORIGEM_NOME,
        sd.NOME_SETOR as SETOR_DESTINO_NOME
      FROM ${this.tableName} m
      LEFT JOIN SETORES so ON m.SETOR_ORIGEM_ID = so.ID
      LEFT JOIN SETORES sd ON m.SETOR_DESTINO_ID = sd.ID
    `;

    const binds: any = {};
    const conditions: string[] = [];

    // Condições de busca textual
    const term = (searchTerm || '').trim();
    if (term.length > 0 && searchFields.length > 0) {
      searchFields.forEach((field, index) => {
        binds[`search${index}`] = `%${term}%`;
      });
      const whereLike = searchFields
        .map((field, index) => `UPPER(m.${field}) LIKE UPPER(:search${index})`)
        .join(' OR ');
      conditions.push(`(${whereLike})`);
    }

    // Aplicar filtros dinamicamente (prefixando com alias "m")
    const filterBaseIndex = searchFields.length;
    Object.keys(filters).forEach((key, index) => {
      const value = (filters as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        const column = `m.${key}`;
        const i = filterBaseIndex + index;
        if (typeof value === 'string' && value.includes('%')) {
          conditions.push(`UPPER(${column}) LIKE UPPER(:filter${i})`);
          binds[`filter${i}`] = value;
        } else if (Array.isArray(value)) {
          const placeholders = value.map((_: any, j: number) => `:filter${i}_${j}`).join(', ');
          conditions.push(`${column} IN (${placeholders})`);
          value.forEach((val: any, j: number) => {
            binds[`filter${i}_${j}`] = val;
          });
        } else {
          conditions.push(`${column} = :filter${i}`);
          binds[`filter${i}`] = value;
        }
      }
    });

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    const { orderBy = this.primaryKey, orderDirection = 'DESC' } = pagination;
    sql += ` ORDER BY m.${orderBy} ${orderDirection}`;

    return await this.queryWithPagination<T>(sql, binds, pagination);
  }

  protected static override async beforeCreate(data: any): Promise<any> {
    return { ...data, DATA_CRIACAO: new Date(), DATA_ATUALIZACAO: new Date() };
  }

  protected static override async beforeUpdate(_id: number | string, data: any): Promise<any> {
    return { ...data, DATA_ATUALIZACAO: new Date() };
  }

  /**
   * Atualização customizada para mapear campos camelCase para colunas Oracle (UPPER_SNAKE_CASE)
   */
  static override async update<T = any>(id: number | string, data: any): Promise<T | null> {
    // Filtrar campos permitidos
    const filteredData = this.filterFillable(data);

    // Normalizar valores (boolean -> '1'/'0')
    const normalizedData: any = {};
    Object.keys(filteredData).forEach((key) => {
      const val = (filteredData as any)[key];
      if (typeof val === 'boolean') {
        normalizedData[key] = val ? '1' : '0';
      } else {
        normalizedData[key] = val;
      }
    });

    // Normalizar campo 'tamanho' para códigos aceitos (P, M, G)
    if (
      normalizedData.tamanho !== undefined &&
      normalizedData.tamanho !== null &&
      normalizedData.tamanho !== ''
    ) {
      const rawTam = normalizedData.tamanho;
      if (typeof rawTam === 'string') {
        const v = rawTam.trim().toLowerCase();
        let code: string | null = null;
        if (['g', 'grande'].includes(v)) code = 'G';
        else if (['m', 'medio', 'médio'].includes(v)) code = 'M';
        else if (['p', 'pequeno'].includes(v)) code = 'P';
        else if (v.length === 1 && ['p', 'm', 'g'].includes(v)) code = v.toUpperCase();
        // Se não reconhecido e for string descritiva longa, evitar erro de comprimento
        normalizedData.tamanho = code ?? null;
      } else if (typeof rawTam === 'number') {
        // Alguns sistemas podem enviar 1/2/3; mapear opcionalmente
        const map: Record<number, string> = { 1: 'P', 2: 'M', 3: 'G' };
        normalizedData.tamanho = map[rawTam] ?? null;
      } else {
        normalizedData.tamanho = null;
      }
    }

    // Converter campos de data aceitando formatos comuns (ISO e dd/MM/yyyy)
    const dateFields = ['dataEmissao', 'dataValidade'];
    dateFields.forEach((df) => {
      if (normalizedData[df] !== undefined && normalizedData[df] !== null && normalizedData[df] !== '') {
        const raw = normalizedData[df];
        let parsed: Date | null = null;
        if (raw instanceof Date) {
          parsed = raw;
        } else if (typeof raw === 'string') {
          const s = raw.trim();
          // dd/MM/yyyy
          const m = s.match(/^([0-3]?\d)\/([0-1]?\d)\/(\d{4})$/);
          if (m) {
            const d = Number(m[1]);
            const mo = Number(m[2]) - 1; // mês 0-11
            const y = Number(m[3]);
            parsed = new Date(y, mo, d, 0, 0, 0, 0);
          } else {
            // Tentar ISO 8601 ou variantes reconhecidas pelo JS
            const iso = new Date(s);
            if (!isNaN(iso.getTime())) {
              parsed = iso;
            } else {
              // yyyy-MM-dd
              const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
              if (m2) {
                const y = Number(m2[1]);
                const mo2 = Number(m2[2]) - 1;
                const d2 = Number(m2[3]);
                parsed = new Date(y, mo2, d2, 0, 0, 0, 0);
              }
            }
          }
        }
        // Se conseguimos fazer parse, substituir por Date; caso contrário, manter ou setar null
        if (parsed && !isNaN(parsed.getTime())) {
          normalizedData[df] = parsed;
        } else if (typeof raw === 'string') {
          // Evitar erro ORA-01861: se não parseou, não enviar string inválida
          normalizedData[df] = null;
        }
      }
    });

    // Adicionar timestamp de atualização específico da tabela
    normalizedData.DATA_ATUALIZACAO = new Date();

    const fields = Object.keys(normalizedData);
    if (fields.length === 0) {
      return await this.findById<T>(id);
    }

    // Converter camelCase -> SNAKE_UPPER. Se já estiver em SNAKE_UPPER, manter como está.
    const toOracleColumn = (field: string) => {
      // Já está em SNAKE_UPPER (somente A-Z, 0-9 e _)? Mantém.
      if (/^[A-Z0-9_]+$/.test(field)) {
        return field;
      }
      // Caso contrário, converte camelCase para SNAKE_UPPER
      return field
        .replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`)
        .toUpperCase();
    };
    const setClause = fields.map((field) => `${toOracleColumn(field)} = :${field}`).join(', ');

    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${this.primaryKey} = :id`;
    const binds: any = { id, ...normalizedData };

    const result = await (await import('../config/database')).DatabaseService.executeQuery(sql, binds);
    if (!result.rowsAffected || result.rowsAffected === 0) {
      return null;
    }

    return await this.findById<T>(id);
  }
}

export default MaloteModel;