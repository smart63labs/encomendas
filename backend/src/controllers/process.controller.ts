import { Request, Response, NextFunction } from 'express';
import { BaseController, AuthenticatedRequest, QueryParams } from './base.controller';
import { ProcessModel, IProcess, IProcessFilters } from '../models/process.model';
import { SearchFilters } from '../models/base.model';

/**
 * Interface para dados de criação de processo
 */
interface CreateProcessData {
  numero_processo?: string;
  assunto: string;
  descricao?: string;
  tipo_processo: string;
  prioridade?: IProcess['prioridade'];
  origem: string;
  destino?: string;
  setor_atual?: string;
  data_prazo?: Date;
  observacoes?: string;
  confidencial?: boolean;
  valor_estimado?: number;
  tags?: string;
  status?: IProcess['status'];
}

/**
 * Interface para dados de atualização de processo
 */
interface UpdateProcessData {
  assunto?: string;
  descricao?: string;
  tipo_processo?: string;
  prioridade?: IProcess['prioridade'];
  destino?: string;
  setor_atual?: string;
  data_prazo?: Date;
  observacoes?: string;
  confidencial?: boolean;
  valor_estimado?: number;
  tags?: string;
}

/**
 * Interface para tramitação de processo
 */
interface TramitarProcessData {
  setorDestino: string;
  observacoes?: string;
}

/**
 * Interface para mudança de status
 */
interface ChangeStatusData {
  status: IProcess['status'];
  observacoes?: string;
}

/**
 * Interface para mudança de prioridade
 */
interface ChangePriorityData {
  prioridade: IProcess['prioridade'];
  observacoes?: string;
}

/**
 * Interface para atribuição de responsável
 */
interface AssignResponsibleData {
  responsavelId: number;
  observacoes?: string;
}

/**
 * Controller de Processos
 * Gerencia operações CRUD e tramitação de processos administrativos
 */
export class ProcessController extends BaseController {
  constructor() {
    super(ProcessModel);
  }

  /**
   * Criar novo processo
   */
  override async store(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        this.sendError(res, 'Usuário não autenticado', 401);
        return;
      }

      const data: CreateProcessData = this.sanitizeInput(req.body);
      
      const validation = await this.validateStoreData(data, req);
      if (!validation.valid) {
        this.sendError(res, validation.errors.join(', '), 400);
        return;
      }

      // Preparar dados do processo removendo campos undefined
      const processData: any = {
        usuario_criador: req.user.userId,
        data_abertura: new Date(),
        confidencial: data.confidencial ?? false,
        assunto: data.assunto,
        tipo_processo: data.tipo_processo,
        origem: data.origem
      };

      // Adicionar campos opcionais apenas se definidos
      if (data.numero_processo) processData.numero_processo = data.numero_processo;
      if (data.descricao) processData.descricao = data.descricao;
      if (data.prioridade) processData.prioridade = data.prioridade;
      if (data.destino) processData.destino = data.destino;
      if (data.setor_atual) processData.setor_atual = data.setor_atual;
      if (data.data_prazo) processData.data_prazo = data.data_prazo;
      if (data.observacoes) processData.observacoes = data.observacoes;
      if (data.valor_estimado !== undefined) processData.valor_estimado = data.valor_estimado;
      if (data.tags) processData.tags = data.tags;
      if (data.status) processData.status = data.status;

      const newProcess = await ProcessModel.createProcess(processData);
      
      // Log de auditoria
      await this.logAudit('CREATE_PROCESS', 'process', newProcess.id!, req.user.userId, {
        numero_processo: newProcess.numero_processo,
        assunto: newProcess.assunto
      });
      
      this.sendSuccess(res, newProcess, 'Processo criado com sucesso', {}, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar processo
   */
  override async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        this.sendError(res, 'Usuário não autenticado', 401);
        return;
      }

      const { id } = req.params;
      const processId = Number(id);
      
      if (!id || isNaN(processId)) {
        this.sendError(res, 'ID inválido', 400);
        return;
      }

      // Verificar se processo existe
      const existingProcess = await ProcessModel.findById<IProcess>(processId);
      if (!existingProcess) {
        this.sendError(res, 'Processo não encontrado', 404);
        return;
      }

      // Verificar permissões
      const canEdit = await this.canEditProcess(existingProcess, req.user);
      if (!canEdit.allowed) {
        this.sendError(res, canEdit.reason || 'Sem permissão para editar este processo', 403);
        return;
      }

      const data: UpdateProcessData = this.sanitizeInput(req.body);
      
      const validation = await this.validateUpdateData(data, processId, req);
      if (!validation.valid) {
        this.sendError(res, validation.errors.join(', '), 400);
        return;
      }

      const updatedProcess = await ProcessModel.updateProcess(processId, data);
      
      // Log de auditoria
      await this.logAudit('UPDATE_PROCESS', 'process', processId, req.user.userId, data);
      
      this.sendSuccess(res, updatedProcess, 'Processo atualizado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Tramitar processo
   */
  async tramitar(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        this.sendError(res, 'Usuário não autenticado', 401);
        return;
      }

      const { id } = req.params;
      const { setorDestino, observacoes }: TramitarProcessData = req.body;
      
      if (!id || isNaN(Number(id))) {
        this.sendError(res, 'ID inválido', 400);
        return;
      }

      if (!setorDestino) {
        this.sendError(res, 'Setor de destino é obrigatório', 400);
        return;
      }

      // Verificar se processo existe
      const process = await ProcessModel.findById<IProcess>(Number(id));
      if (!process) {
        this.sendError(res, 'Processo não encontrado', 404);
        return;
      }

      // Verificar permissões
      const canTramitar = await this.canTramitarProcess(process, req.user);
      if (!canTramitar.allowed) {
        this.sendError(res, canTramitar.reason || 'Sem permissão para tramitar este processo', 403);
        return;
      }

      const updatedProcess = await ProcessModel.tramitarProcess(
        Number(id),
        req.user.userId,
        setorDestino,
        observacoes
      );
      
      // Log de auditoria
      await this.logAudit('TRAMITAR_PROCESS', 'process', Number(id), req.user.userId, {
        setorOrigem: process.setor_atual,
        setorDestino,
        observacoes
      });
      
      this.sendSuccess(res, updatedProcess, 'Processo tramitado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Alterar status do processo
   */
  async changeStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        this.sendError(res, 'Usuário não autenticado', 401);
        return;
      }

      const { id } = req.params;
      const { status, observacoes }: ChangeStatusData = req.body;
      
      if (!id || isNaN(Number(id))) {
        this.sendError(res, 'ID inválido', 400);
        return;
      }

      if (!status) {
        this.sendError(res, 'Status é obrigatório', 400);
        return;
      }

      const validStatuses = ['ABERTO', 'EM_ANDAMENTO', 'SUSPENSO', 'CONCLUIDO', 'ARQUIVADO'];
      if (!validStatuses.includes(status)) {
        this.sendError(res, 'Status inválido', 400);
        return;
      }

      // Verificar se processo existe
      const process = await ProcessModel.findById<IProcess>(Number(id));
      if (!process) {
        this.sendError(res, 'Processo não encontrado', 404);
        return;
      }

      // Verificar permissões
      const canChangeStatus = await this.canChangeProcessStatus(process, req.user, status);
      if (!canChangeStatus.allowed) {
        this.sendError(res, canChangeStatus.reason || 'Sem permissão para alterar status', 403);
        return;
      }

      const updatedProcess = await ProcessModel.changeStatus(
        Number(id),
        req.user.userId,
        status,
        observacoes
      );
      
      // Log de auditoria
      await this.logAudit('CHANGE_STATUS', 'process', Number(id), req.user.userId, {
        statusAnterior: process.status,
        novoStatus: status,
        observacoes
      });
      
      this.sendSuccess(res, updatedProcess, 'Status do processo alterado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Alterar prioridade do processo
   */
  async changePriority(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        this.sendError(res, 'Usuário não autenticado', 401);
        return;
      }

      const { id } = req.params;
      const { prioridade, observacoes }: ChangePriorityData = req.body;
      
      if (!id || isNaN(Number(id))) {
        this.sendError(res, 'ID inválido', 400);
        return;
      }

      if (!prioridade) {
        this.sendError(res, 'Prioridade é obrigatória', 400);
        return;
      }

      const validPriorities = ['BAIXA', 'NORMAL', 'ALTA', 'URGENTE'];
      if (!validPriorities.includes(prioridade)) {
        this.sendError(res, 'Prioridade inválida', 400);
        return;
      }

      // Verificar se processo existe
      const process = await ProcessModel.findById<IProcess>(Number(id));
      if (!process) {
        this.sendError(res, 'Processo não encontrado', 404);
        return;
      }

      // Verificar permissões
      const canChangePriority = await this.canChangePriority(process, req.user, prioridade);
      if (!canChangePriority.allowed) {
        this.sendError(res, canChangePriority.reason || 'Sem permissão para alterar prioridade', 403);
        return;
      }

      const updatedProcess = await ProcessModel.changePriority(
        Number(id),
        req.user.userId,
        prioridade,
        observacoes
      );
      
      // Log de auditoria
      await this.logAudit('CHANGE_PRIORITY', 'process', Number(id), req.user.userId, {
        prioridadeAnterior: process.prioridade,
        novaPrioridade: prioridade,
        observacoes
      });
      
      this.sendSuccess(res, updatedProcess, 'Prioridade do processo alterada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atribuir responsável ao processo
   */
  async assignResponsible(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        this.sendError(res, 'Usuário não autenticado', 401);
        return;
      }

      const { id } = req.params;
      const { responsavelId, observacoes }: AssignResponsibleData = req.body;
      
      if (!id || isNaN(Number(id))) {
        this.sendError(res, 'ID inválido', 400);
        return;
      }

      if (!responsavelId || isNaN(Number(responsavelId))) {
        this.sendError(res, 'ID do responsável é obrigatório e deve ser válido', 400);
        return;
      }

      // Verificar se processo existe
      const process = await ProcessModel.findById<IProcess>(Number(id));
      if (!process) {
        this.sendError(res, 'Processo não encontrado', 404);
        return;
      }

      // Verificar permissões
      const canAssign = await this.canAssignResponsible(process, req.user);
      if (!canAssign.allowed) {
        this.sendError(res, canAssign.reason || 'Sem permissão para atribuir responsável', 403);
        return;
      }

      const updatedProcess = await ProcessModel.assignResponsible(
        Number(id),
        req.user.userId,
        Number(responsavelId),
        observacoes
      );
      
      // Log de auditoria
      await this.logAudit('ASSIGN_RESPONSIBLE', 'process', Number(id), req.user.userId, {
        responsavelAnterior: process.usuario_responsavel,
        novoResponsavel: responsavelId,
        observacoes
      });
      
      this.sendSuccess(res, updatedProcess, 'Responsável atribuído com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar processos por número
   */
  async findByNumber(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { numero } = req.params;
      
      if (!numero) {
        this.sendError(res, 'Número do processo é obrigatório', 400);
        return;
      }

      const process = await ProcessModel.findByNumber(numero);
      
      if (!process) {
        this.sendError(res, 'Processo não encontrado', 404);
        return;
      }

      // Verificar se pode visualizar processo confidencial
      if (process.confidencial && !await this.canViewConfidentialProcess(process, req.user)) {
        this.sendError(res, 'Sem permissão para visualizar este processo', 403);
        return;
      }

      this.sendSuccess(res, process, 'Processo encontrado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar processos do usuário (criados por ele)
   */
  async myProcesses(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        this.sendError(res, 'Usuário não autenticado', 401);
        return;
      }

      const pagination = this.extractPagination(req.query as QueryParams);
      const result = await ProcessModel.findByCreator(req.user.userId, pagination);
      
      this.sendSuccess(res, result.data, 'Processos recuperados com sucesso', {
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar processos sob responsabilidade do usuário
   */
  async myResponsibilities(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        this.sendError(res, 'Usuário não autenticado', 401);
        return;
      }

      const pagination = this.extractPagination(req.query as QueryParams);
      const result = await ProcessModel.findByResponsible(req.user.userId, pagination);
      
      this.sendSuccess(res, result.data, 'Processos sob sua responsabilidade recuperados com sucesso', {
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar processos em atraso
   */
  async overdue(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = this.extractPagination(req.query as QueryParams);
      const result = await ProcessModel.findOverdue(pagination);
      
      this.sendSuccess(res, result.data, 'Processos em atraso recuperados com sucesso', {
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar processos vencendo hoje
   */
  async dueToday(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = this.extractPagination(req.query as QueryParams);
      const result = await ProcessModel.findDueToday(pagination);
      
      this.sendSuccess(res, result.data, 'Processos vencendo hoje recuperados com sucesso', {
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar processos vencendo esta semana
   */
  async dueThisWeek(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const pagination = this.extractPagination(req.query as QueryParams);
      const result = await ProcessModel.findDueThisWeek(pagination);
      
      this.sendSuccess(res, result.data, 'Processos vencendo esta semana recuperados com sucesso', {
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter estatísticas de processos
   */
  async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        this.sendError(res, 'Usuário não autenticado', 401);
        return;
      }

      if (!this.hasPermission(req.user, 'view_process_stats')) {
        this.sendError(res, 'Sem permissão para visualizar estatísticas', 403);
        return;
      }

      const stats = await ProcessModel.getProcessStats();
      
      this.sendSuccess(res, stats, 'Estatísticas recuperadas com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter histórico de tramitação do processo
   */
  async getHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        this.sendError(res, 'ID inválido', 400);
        return;
      }

      // Verificar se processo existe
      const process = await ProcessModel.findById<IProcess>(Number(id));
      if (!process) {
        this.sendError(res, 'Processo não encontrado', 404);
        return;
      }

      // Verificar permissões
      if (process.confidencial && !await this.canViewConfidentialProcess(process, req.user)) {
        this.sendError(res, 'Sem permissão para visualizar histórico deste processo', 403);
        return;
      }

      const pagination = this.extractPagination(req.query as QueryParams);
      const result = await ProcessModel.getProcessHistory(Number(id), pagination);
      
      this.sendSuccess(res, result.data, 'Histórico recuperado com sucesso', {
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Extrair filtros específicos de processo
   */
  protected override extractFilters(query: QueryParams): IProcessFilters {
    const baseFilters = super.extractFilters(query);
    const processFilters: IProcessFilters = { ...baseFilters };

    // Filtros específicos de processo
    if (query.numero_processo) {
      processFilters.numero_processo = `%${query.numero_processo}%`;
    }
    if (query.assunto) {
      processFilters.assunto = `%${query.assunto}%`;
    }
    if (query.tipo_processo) {
      processFilters.tipo_processo = query.tipo_processo;
    }
    if (query.prioridade) {
      processFilters.prioridade = query.prioridade;
    }
    if (query.status) {
      processFilters.status = query.status;
    }
    if (query.origem) {
      processFilters.origem = query.origem;
    }
    if (query.destino) {
      processFilters.destino = query.destino;
    }
    if (query.setor_atual) {
      processFilters.setor_atual = query.setor_atual;
    }
    if (query.usuario_criador) {
      processFilters.usuario_criador = Number(query.usuario_criador);
    }
    if (query.usuario_responsavel) {
      processFilters.usuario_responsavel = Number(query.usuario_responsavel);
    }
    if (query.confidencial !== undefined) {
      processFilters.confidencial = query.confidencial === 'true';
    }
    if (query.tags) {
      processFilters.tags = `%${query.tags}%`;
    }

    // Filtros de data
    if (query.data_abertura_inicio) {
      processFilters.data_abertura_inicio = new Date(query.data_abertura_inicio);
    }
    if (query.data_abertura_fim) {
      processFilters.data_abertura_fim = new Date(query.data_abertura_fim);
    }
    if (query.data_prazo_inicio) {
      processFilters.data_prazo_inicio = new Date(query.data_prazo_inicio);
    }
    if (query.data_prazo_fim) {
      processFilters.data_prazo_fim = new Date(query.data_prazo_fim);
    }

    return processFilters;
  }

  /**
   * Campos para busca de texto livre
   */
  protected override getSearchFields(): string[] {
    return ['numero_processo', 'assunto', 'descricao', 'observacoes', 'tags'];
  }

  /**
   * Validar dados para criação de processo
   */
  protected override async validateStoreData(
    data: CreateProcessData,
    req: AuthenticatedRequest
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validações básicas
    if (!data.assunto || data.assunto.trim().length < 5) {
      errors.push('Assunto deve ter pelo menos 5 caracteres');
    }

    if (!data.tipo_processo || data.tipo_processo.trim().length < 2) {
      errors.push('Tipo de processo é obrigatório');
    }

    if (!data.origem || data.origem.trim().length < 2) {
      errors.push('Origem é obrigatória');
    }

    if (data.prioridade && !['BAIXA', 'NORMAL', 'ALTA', 'URGENTE'].includes(data.prioridade)) {
      errors.push('Prioridade inválida');
    }

    if (data.valor_estimado !== undefined && data.valor_estimado < 0) {
      errors.push('Valor estimado não pode ser negativo');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validar dados para atualização de processo
   */
  protected override async validateUpdateData(
    data: UpdateProcessData,
    id: number,
    req: AuthenticatedRequest
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validar assunto se fornecido
    if (data.assunto !== undefined && (!data.assunto || data.assunto.trim().length < 5)) {
      errors.push('Assunto deve ter pelo menos 5 caracteres');
    }

    // Validar tipo de processo se fornecido
    if (data.tipo_processo !== undefined && (!data.tipo_processo || data.tipo_processo.trim().length < 2)) {
      errors.push('Tipo de processo deve ter pelo menos 2 caracteres');
    }

    // Validar prioridade se fornecida
    if (data.prioridade && !['BAIXA', 'NORMAL', 'ALTA', 'URGENTE'].includes(data.prioridade)) {
      errors.push('Prioridade inválida');
    }

    // Validar valor estimado se fornecido
    if (data.valor_estimado !== undefined && data.valor_estimado < 0) {
      errors.push('Valor estimado não pode ser negativo');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Verificar se pode excluir processo
   */
  protected override async canDelete(
    id: number,
    req: AuthenticatedRequest
  ): Promise<{ allowed: boolean; reason?: string }> {
    if (!req.user) {
      return { allowed: false, reason: 'Usuário não autenticado' };
    }

    // Regra de ouro: somente Admin pode excluir
    const role = req.user.role?.toUpperCase() || '';
    const isAdmin = role === 'ADMIN' || role === 'ADMINISTRADOR';
    if (!isAdmin) {
      return { allowed: false, reason: 'Apenas administradores (Admin) podem excluir processos' };
    }

    const process = await ProcessModel.findById<IProcess>(id);
    if (!process) {
      return { allowed: false, reason: 'Processo não encontrado' };
    }

    // Não permitir excluir processos concluídos ou arquivados
    if (process.status === 'CONCLUIDO' || process.status === 'ARQUIVADO') {
      return { allowed: false, reason: 'Não é possível excluir processo concluído ou arquivado' };
    }

    // Se chegou aqui, é Admin. Mantém restrições de negócio (ex.: não excluir concluídos/arquivados) já tratadas acima.

    return { allowed: true };
  }

  /**
   * Verificar se pode editar processo
   */
  private async canEditProcess(
    process: IProcess,
    user: any
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Não permitir editar processos concluídos ou arquivados
    if (process.status === 'CONCLUIDO' || process.status === 'ARQUIVADO') {
      return { allowed: false, reason: 'Não é possível editar processo concluído ou arquivado' };
    }

    // Verificar se é o criador, responsável ou tem permissão de administrador
    const isCreator = process.usuario_criador === user.userId;
    const isResponsible = process.usuario_responsavel === user.userId;
    const hasAdminPermission = this.hasPermission(user, 'edit_any_process');
    
    if (!isCreator && !isResponsible && !hasAdminPermission) {
      return { allowed: false, reason: 'Apenas o criador, responsável ou administradores podem editar processos' };
    }

    return { allowed: true };
  }

  /**
   * Verificar se pode tramitar processo
   */
  private async canTramitarProcess(
    process: IProcess,
    user: any
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Não permitir tramitar processos concluídos ou arquivados
    if (process.status === 'CONCLUIDO' || process.status === 'ARQUIVADO') {
      return { allowed: false, reason: 'Não é possível tramitar processo concluído ou arquivado' };
    }

    // Verificar permissões básicas
    const canEdit = await this.canEditProcess(process, user);
    if (!canEdit.allowed) {
      return canEdit;
    }

    return { allowed: true };
  }

  /**
   * Verificar se pode alterar status do processo
   */
  private async canChangeProcessStatus(
    process: IProcess,
    user: any,
    newStatus: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Verificar permissões básicas
    const canEdit = await this.canEditProcess(process, user);
    if (!canEdit.allowed) {
      return canEdit;
    }

    // Regras específicas para mudança de status
    if (newStatus === 'ARQUIVADO' && !this.hasPermission(user, 'archive_process')) {
      return { allowed: false, reason: 'Sem permissão para arquivar processos' };
    }

    return { allowed: true };
  }

  /**
   * Verificar se pode alterar prioridade
   */
  private async canChangePriority(
    process: IProcess,
    user: any,
    newPriority: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Verificar permissões básicas
    const canEdit = await this.canEditProcess(process, user);
    if (!canEdit.allowed) {
      return canEdit;
    }

    // Regras específicas para prioridade URGENTE
    if (newPriority === 'URGENTE' && !this.hasPermission(user, 'set_urgent_priority')) {
      return { allowed: false, reason: 'Sem permissão para definir prioridade urgente' };
    }

    return { allowed: true };
  }

  /**
   * Verificar se pode atribuir responsável
   */
  private async canAssignResponsible(
    process: IProcess,
    user: any
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Verificar permissões básicas
    const canEdit = await this.canEditProcess(process, user);
    if (!canEdit.allowed) {
      return canEdit;
    }

    return { allowed: true };
  }

  /**
   * Verificar se pode visualizar processo confidencial
   */
  private async canViewConfidentialProcess(
    process: IProcess,
    user: any
  ): Promise<boolean> {
    if (!user) return false;
    if (!process.confidencial) return true;

    // Criador, responsável ou administrador podem ver
    const isCreator = process.usuario_criador === user.userId;
    const isResponsible = process.usuario_responsavel === user.userId;
    const hasAdminPermission = this.hasPermission(user, 'view_confidential_process');
    
    return isCreator || isResponsible || hasAdminPermission;
  }

  /**
   * Excluir múltiplos processos
   */
  async destroyMultiple(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        this.sendError(res, 'IDs não fornecidos ou inválidos', 400);
        return;
      }

      const results = [];
      const errors = [];

      for (const id of ids) {
        try {
          // Verificar se pode excluir
          const canDelete = await this.canDelete(id, req);
          if (!canDelete.allowed) {
            errors.push({ id, error: canDelete.reason });
            continue;
          }

          // Excluir processo
          const deleted = await ProcessModel.delete(id);
          if (deleted) {
            results.push({ id, success: true });
            
            // Log de auditoria
            await this.logAudit('DELETE', 'process', Number(id), req.user?.userId || 0, {
              operacao: 'exclusao_multipla'
            });
          } else {
            errors.push({ id, error: 'Processo não encontrado' });
          }
        } catch (error) {
          errors.push({ id, error: 'Erro ao excluir processo' });
        }
      }

      this.sendSuccess(res, {
        deleted: results,
        errors: errors,
        total: ids.length,
        success: results.length,
        failed: errors.length
      }, `${results.length} processo(s) excluído(s) com sucesso`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verificar permissões específicas do processo
   */
  protected override hasPermission(user: any, permission: string): boolean {
    if (!user) return false;
    
    // Implementação básica baseada no cargo
    const adminRoles = ['ADMINISTRADOR', 'ADMIN', 'GERENTE'];
    const supervisorRoles = [...adminRoles, 'SUPERVISOR', 'COORDENADOR'];
    const isAdmin = adminRoles.includes(user.role?.toUpperCase() || '');
    const isSupervisor = supervisorRoles.includes(user.role?.toUpperCase() || '');
    
    switch (permission) {
      case 'delete_any_process':
      case 'edit_any_process':
      case 'archive_process':
      case 'view_process_stats':
      case 'view_confidential_process':
        return isAdmin;
      case 'set_urgent_priority':
        return isSupervisor;
      default:
        return true;
    }
  }
}

export default ProcessController;