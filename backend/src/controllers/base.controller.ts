import { Request, Response, NextFunction } from 'express';
import { BaseModel, PaginationOptions, SearchFilters } from '../models/base.model';
import { DatabaseService } from '../config/database';

/**
 * Interface para resposta da API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  timestamp: string;
}

/**
 * Interface para parâmetros de query
 */
export interface QueryParams {
  page?: string;
  pagina?: string; // Parâmetro em português
  limit?: string;
  limite?: string; // Parâmetro em português
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  search?: string;
  [key: string]: any;
}

/**
 * Interface para usuário autenticado
 */
export interface AuthenticatedUser {
  id: number;
  userId: number;
  email: string;
  nome: string;
  role: string;
  isActive: boolean;
  setorId?: number;
}

/**
 * Interface estendida do Request com usuário autenticado
 */
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Classe base para todos os controllers
 * Fornece métodos utilitários e padronização de respostas
 */
export abstract class BaseController {
  protected model: typeof BaseModel;

  constructor(model: typeof BaseModel) {
    this.model = model;
  }

  /**
   * Listar registros com paginação e filtros
   */
  async index(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = this.extractPagination(req.query as QueryParams);
      const filters = this.extractFilters(req.query as QueryParams);

      const result = await this.model.findAll(filters, pagination);

      this.sendSuccess(res, result.data, 'Registros recuperados com sucesso', {
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar registro por ID
   */
  async show(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        this.sendError(res, 'ID inválido', 400);
        return;
      }

      const record = await this.model.findById(Number(id));

      if (!record) {
        this.sendError(res, 'Registro não encontrado', 404);
        return;
      }

      this.sendSuccess(res, record, 'Registro recuperado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Criar novo registro
   */
  async store(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body;

      // Validar dados de entrada
      const validation = await this.validateStoreData(data, req);
      if (!validation.valid) {
        this.sendError(res, validation.errors.join(', '), 400);
        return;
      }

      // Processar dados antes de criar
      const processedData = await this.beforeStore(data, req);

      const newRecord = await this.model.create(processedData);

      // Processar dados após criar
      await this.afterStore(newRecord, req);

      this.sendSuccess(res, newRecord, 'Registro criado com sucesso', {}, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar registro
   */
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body;

      if (!id || isNaN(Number(id))) {
        this.sendError(res, 'ID inválido', 400);
        return;
      }

      // Verificar se registro existe
      const existingRecord = await this.model.findById(Number(id));
      if (!existingRecord) {
        this.sendError(res, 'Registro não encontrado', 404);
        return;
      }

      // Validar dados de entrada
      const validation = await this.validateUpdateData(data, Number(id), req);
      if (!validation.valid) {
        this.sendError(res, validation.errors.join(', '), 400);
        return;
      }

      // Processar dados antes de atualizar
      const processedData = await this.beforeUpdate(data, Number(id), req);

      const updatedRecord = await this.model.update(Number(id), processedData);

      // Processar dados após atualizar
      await this.afterUpdate(updatedRecord, Number(id), req);

      this.sendSuccess(res, updatedRecord, 'Registro atualizado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Excluir registro
   */
  async destroy(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        this.sendError(res, 'ID inválido', 400);
        return;
      }

      // Verificar se registro existe
      const existingRecord = await this.model.findById(Number(id));
      if (!existingRecord) {
        this.sendError(res, 'Registro não encontrado', 404);
        return;
      }

      // Verificar se pode excluir
      const canDelete = await this.canDelete(Number(id), req);
      if (!canDelete.allowed) {
        this.sendError(res, canDelete.reason || 'Não é possível excluir este registro', 400);
        return;
      }

      // Processar antes de excluir
      await this.beforeDelete(Number(id), req);

      const deleted = await this.model.delete(Number(id));

      if (!deleted) {
        this.sendError(res, 'Falha ao excluir registro', 500);
        return;
      }

      // Processar após excluir
      await this.afterDelete(Number(id), req);

      this.sendSuccess(res, null, 'Registro excluído com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Busca com texto livre
   */
  async search(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q: searchTerm } = req.query as { q?: string };

      if (!searchTerm || searchTerm.trim().length < 2) {
        this.sendError(res, 'Termo de busca deve ter pelo menos 2 caracteres', 400);
        return;
      }

      const pagination = this.extractPagination(req.query as QueryParams);
      const filters = this.extractFilters(req.query as QueryParams);
      const searchFields = this.getSearchFields();

      const result = await this.model.search(
        searchTerm.trim(),
        searchFields,
        filters,
        pagination
      );

      this.sendSuccess(res, result.data, 'Busca realizada com sucesso', {
        pagination: result.pagination,
        searchTerm
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Contar registros
   */
  async count(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = this.extractFilters(req.query as QueryParams);
      const total = await this.model.count(filters);

      this.sendSuccess(res, { total }, 'Contagem realizada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Excluir múltiplos registros
   */
  async destroyMany(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        this.sendError(res, 'Lista de IDs é obrigatória', 400);
        return;
      }

      // Validar IDs
      const validIds = ids.filter(id => !isNaN(Number(id))).map(id => Number(id));
      if (validIds.length === 0) {
        this.sendError(res, 'Nenhum ID válido fornecido', 400);
        return;
      }

      // Verificar se todos os registros existem
      const existingRecords = await Promise.all(
        validIds.map(id => this.model.findById(id))
      );
      const existingIds = existingRecords
        .filter(record => record !== null)
        .map((record: any) => record.id);

      if (existingIds.length === 0) {
        this.sendError(res, 'Nenhum registro encontrado', 404);
        return;
      }

      // Verificar permissões para cada registro
      const canDeleteResults = await Promise.all(
        existingIds.map(id => this.canDelete(id, req))
      );

      const allowedIds = existingIds.filter((id, index) => canDeleteResults[index].allowed);

      if (allowedIds.length === 0) {
        this.sendError(res, 'Nenhum registro pode ser excluído', 400);
        return;
      }

      // Processar antes de excluir
      await Promise.all(allowedIds.map(id => this.beforeDelete(id, req)));

      const deletedCount = await this.model.deleteMany(allowedIds);

      // Processar após excluir
      await Promise.all(allowedIds.map(id => this.afterDelete(id, req)));

      this.sendSuccess(res, {
        deletedCount,
        requestedCount: validIds.length,
        skippedCount: validIds.length - deletedCount
      }, `${deletedCount} registro(s) excluído(s) com sucesso`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Extrair parâmetros de paginação da query
   */
  protected extractPagination(query: QueryParams): PaginationOptions {
    // Aceitar parâmetros em português (limite/pagina) ou inglês (limit/page)
    const pageStr = query.page || query.pagina || '1';
    const limitStr = query.limit || query.limite || '10';

    const page = Math.max(1, parseInt(pageStr as string, 10));
    const limit = Math.min(100, Math.max(1, parseInt(limitStr as string, 10)));
    const orderBy = query.orderBy || 'created_at';
    const orderDirection = query.orderDirection === 'ASC' ? 'ASC' : 'DESC';

    return { page, limit, orderBy, orderDirection };
  }

  /**
   * Extrair filtros da query (deve ser sobrescrito nas classes filhas)
   */
  protected extractFilters(query: QueryParams): SearchFilters {
    const filters: SearchFilters = {};

    // Filtros básicos que podem ser aplicados a qualquer modelo
    const excludeParams = ['page', 'limit', 'orderBy', 'orderDirection', 'search', 'q', 'pagina', 'limite'];

    Object.keys(query).forEach(key => {
      if (!excludeParams.includes(key) && query[key] !== undefined && query[key] !== '') {
        filters[key] = query[key];
      }
    });

    return filters;
  }

  /**
   * Obter campos para busca de texto livre (deve ser sobrescrito nas classes filhas)
   */
  protected getSearchFields(): string[] {
    return ['nome', 'descricao', 'observacoes'];
  }

  /**
   * Validar dados para criação (pode ser sobrescrito nas classes filhas)
   */
  protected async validateStoreData(
    data: any,
    req: AuthenticatedRequest
  ): Promise<{ valid: boolean; errors: string[] }> {
    return { valid: true, errors: [] };
  }

  /**
   * Validar dados para atualização (pode ser sobrescrito nas classes filhas)
   */
  protected async validateUpdateData(
    data: any,
    id: number,
    req: AuthenticatedRequest
  ): Promise<{ valid: boolean; errors: string[] }> {
    return { valid: true, errors: [] };
  }

  /**
   * Verificar se pode excluir (pode ser sobrescrito nas classes filhas)
   */
  protected async canDelete(
    id: number,
    req: AuthenticatedRequest
  ): Promise<{ allowed: boolean; reason?: string }> {
    const role = req.user?.role?.toUpperCase() || '';
    const isAdmin = role === 'ADMIN' || role === 'ADMINISTRADOR';
    if (!isAdmin) {
      return { allowed: false, reason: 'Apenas usuários com perfil Admin podem excluir registros' };
    }
    return { allowed: true };
  }

  /**
   * Hook executado antes de criar
   */
  protected async beforeStore(data: any, req: AuthenticatedRequest): Promise<any> {
    return data;
  }

  /**
   * Hook executado após criar
   */
  protected async afterStore(record: any, req: AuthenticatedRequest): Promise<void> {
    // Implementação vazia - pode ser sobrescrita
  }

  /**
   * Hook executado antes de atualizar
   */
  protected async beforeUpdate(data: any, id: number, req: AuthenticatedRequest): Promise<any> {
    return data;
  }

  /**
   * Hook executado após atualizar
   */
  protected async afterUpdate(record: any, id: number, req: AuthenticatedRequest): Promise<void> {
    // Implementação vazia - pode ser sobrescrita
  }

  /**
   * Hook executado antes de excluir
   */
  protected async beforeDelete(id: number, req: AuthenticatedRequest): Promise<void> {
    // Implementação vazia - pode ser sobrescrita
  }

  /**
   * Hook executado após excluir
   */
  protected async afterDelete(id: number, req: AuthenticatedRequest): Promise<void> {
    // Implementação vazia - pode ser sobrescrita
  }

  /**
   * Enviar resposta de sucesso
   */
  protected sendSuccess(
    res: Response,
    data: any = null,
    message: string = 'Operação realizada com sucesso',
    extra: any = {},
    statusCode: number = 200
  ): void {
    const response: ApiResponse = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      ...extra
    };

    res.status(statusCode).json(response);
  }

  /**
   * Enviar resposta de erro
   */
  protected sendError(
    res: Response,
    error: string,
    statusCode: number = 500,
    data: any = null
  ): void {
    const response: ApiResponse = {
      success: false,
      error,
      data,
      timestamp: new Date().toISOString()
    };

    res.status(statusCode).json(response);
  }

  /**
   * Extrai o código ORA-XXXX da mensagem de erro Oracle
   */
  protected extractOracleCode(message: string | null | undefined): number | null {
    if (!message) return null;
    const match = String(message).match(/ORA-(\d{5}|\d{4})/);
    if (!match) return null;
    const codeStr = match[1];
    const codeNum = Number(codeStr);
    return Number.isFinite(codeNum) ? codeNum : null;
  }

  /**
   * Mapeia dicas amigáveis para erros Oracle comuns
   */
  protected mapOracleErrorHint(code: number | null, message: string): string {
    const msg = String(message || '').toUpperCase();
    switch (code) {
      case 12899:
        return 'Valor excede o tamanho da coluna. Verifique VARCHAR2 com semântica CHAR (ex.: VARCHAR2(n CHAR)) ou ajuste o valor enviado.';
      case 4088:
        return 'Erro durante execução de trigger. Verifique a trigger referenciada e suas operações internas.';
      case 6512:
        return 'Erro em bloco PL/SQL; confira a linha informada no stack para a origem.';
      case 1:
        return 'Violação de chave única. O valor já existe; ajuste o dado ou a constraint.';
      case 2290:
        return 'Violação de constraint CHECK. O valor não atende às regras definidas.';
      case 1400:
        return 'Inserção de NULL não permitida. Preencha os campos obrigatórios.';
      case 17008:
        return 'Conexão com o banco fechada. Reestabeleça a conexão/pool antes de executar a operação.';
      default:
        if (msg.includes('TRIGGER')) {
          return 'Erro relacionado a trigger. Verifique lógica e efeitos colaterais da trigger envolvida.';
        }
        if (msg.includes('CONSTRAINT')) {
          return 'Erro de constraint. Consulte as constraints da tabela para ajustar o dado.';
        }
        return 'Erro Oracle genérico. Consulte os logs detalhados e o código ORA para diagnóstico.';
    }
  }

  /**
   * Executar operação em transação
   */
  protected async executeInTransaction<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    const connection = await DatabaseService.getConnection();

    try {
      await connection.execute('BEGIN');
      const result = await operation();
      await connection.execute('COMMIT');
      return result;
    } catch (error) {
      await connection.execute('ROLLBACK');
      throw error;
    } finally {
      await connection.close();
    }
  }

  /**
   * Log de auditoria
   */
  protected async logAudit(
    action: string,
    resourceType: string,
    resourceId: number | string,
    userId: number,
    details?: any
  ): Promise<void> {
    try {
      console.log('🔍 Iniciando log de auditoria:', { action, resourceType, resourceId, userId });

      const sql = `
        INSERT INTO AUDITORIA (OPERACAO, TABELA, REGISTRO_ID, USUARIO_ID, OBSERVACOES, DATA_OPERACAO)
        VALUES (:operacao, :tabela, :registro_id, :usuario_id, :observacoes, SYSDATE)
      `;

      const params = {
        operacao: action,
        tabela: resourceType,
        registro_id: resourceId,
        usuario_id: userId,
        observacoes: details ? JSON.stringify(details) : null
      };

      console.log('📝 Parâmetros do log de auditoria:', params);
      console.log('📝 SQL do log de auditoria:', sql);

      const result = await DatabaseService.executeQuery(sql, params);

      console.log('✅ Log de auditoria registrado com sucesso. Resultado:', result);
    } catch (error) {
      // Log de auditoria não deve quebrar a operação principal
      console.error('❌ Erro ao registrar log de auditoria:', error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
    }
  }

  /**
   * Validar permissões do usuário
   */
  protected hasPermission(
    user: AuthenticatedUser | undefined,
    permission: string
  ): boolean {
    if (!user) return false;

    // Implementação básica - pode ser expandida com sistema de permissões mais complexo
    // Por enquanto, apenas verifica se o usuário está autenticado
    return true;
  }

  /**
   * Verificar se usuário é proprietário do recurso
   */
  protected async isOwner(
    userId: number,
    resourceId: number,
    ownerField: string = 'usuario_id'
  ): Promise<boolean> {
    try {
      const record = await this.model.findById(resourceId);
      return record && (record as any)[ownerField] === userId;
    } catch (error) {
      return false;
    }
  }

  /**
   * Sanitizar dados de entrada
   */
  protected sanitizeInput(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized: any = {};

    Object.keys(data).forEach(key => {
      const value = data[key];

      if (typeof value === 'string') {
        // Remover scripts e tags HTML básicas
        sanitized[key] = value
          .replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/<[^>]*>/g, '')
          .trim();
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => this.sanitizeInput(item));
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeInput(value);
      } else {
        sanitized[key] = value;
      }
    });

    return sanitized;
  }
}

export default BaseController;