import { BaseModel, SearchFilters, PaginationOptions, PaginatedResult } from './base.model';

/**
 * Interface para dados da tramitação
 */
export interface ITramitacao {
  id?: number;
  numeroProtocolo: string;
  assunto: string;
  remetente: string;
  destinatario: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  dataInicio: Date;
  dataFim?: Date;
  observacoes?: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Interface para filtros de tramitação
 */
export interface ITramitacaoFilters extends SearchFilters {
  numeroProtocolo?: string;
  assunto?: string;
  remetente?: string;
  destinatario?: string;
  status?: string;
  prioridade?: string;
  dataInicio?: string;
  dataFim?: string;
}

/**
 * Modelo para tramitações
 */
export class TramitacaoModel extends BaseModel {
  protected static override tableName = 'TRAMITACOES';
  protected static override primaryKey = 'id';
  protected static override fillable = [
    'numeroProtocolo', 'assunto', 'remetente', 'destinatario',
    'status', 'prioridade', 'dataInicio', 'dataFim', 'observacoes'
  ];

  /**
   * Buscar tramitações por protocolo
   */
  static async findByProtocol(
    numeroProtocolo: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<ITramitacao>> {
    return await this.findAll({ numeroProtocolo: `%${numeroProtocolo}%` }, pagination);
  }

  /**
   * Buscar tramitações por status
   */
  static async findByStatus(
    status: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<ITramitacao>> {
    return await this.findAll({ status }, pagination);
  }

  /**
   * Buscar tramitações por prioridade
   */
  static async findByPriority(
    prioridade: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<ITramitacao>> {
    return await this.findAll({ prioridade }, pagination);
  }

  /**
   * Buscar tramitações por remetente
   */
  static async findBySender(
    remetente: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<ITramitacao>> {
    return await this.findAll({ remetente: `%${remetente}%` }, pagination);
  }

  /**
   * Buscar tramitações por destinatário
   */
  static async findByRecipient(
    destinatario: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<ITramitacao>> {
    return await this.findAll({ destinatario: `%${destinatario}%` }, pagination);
  }

  /**
   * Buscar tramitações pendentes
   */
  static async findPending(
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<ITramitacao>> {
    return await this.findAll({ status: 'pendente' }, pagination);
  }

  /**
   * Buscar tramitações em andamento
   */
  static async findInProgress(
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<ITramitacao>> {
    return await this.findAll({ status: 'em_andamento' }, pagination);
  }
}

export default TramitacaoModel;