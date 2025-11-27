import { BaseModel, SearchFilters, PaginationOptions, PaginatedResult } from './base.model';

/**
 * Interface para dados do prazo
 */
export interface IPrazo {
  id?: number;
  titulo: string;
  descricao: string;
  dataVencimento: Date;
  status: 'pendente' | 'em_andamento' | 'concluido' | 'vencido';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  responsavel: string;
  dataConclusao?: Date;
  observacoes?: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Interface para filtros de prazo
 */
export interface IPrazoFilters extends SearchFilters {
  titulo?: string;
  status?: string;
  prioridade?: string;
  responsavel?: string;
  dataVencimento?: Date;
  dataConclusao?: Date;
}

/**
 * Modelo de Prazo
 * Gerencia prazos e vencimentos
 */
export class PrazoModel extends BaseModel {
  protected static override tableName = 'prazos';
  protected static override primaryKey = 'id';
  protected static override fillable = [
    'titulo', 'descricao', 'data_vencimento', 'status', 'prioridade',
    'responsavel', 'data_conclusao', 'observacoes'
  ];
  protected static override timestamps = true;

  /**
   * Buscar prazos vencidos
   */
  static async findOverdue(
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IPrazo>> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE data_vencimento < SYSDATE 
      AND status NOT IN ('concluido', 'vencido')
      ORDER BY data_vencimento ASC
    `;
    
    return await this.queryWithPagination(sql, {}, pagination);
  }

  /**
   * Buscar prazos próximos ao vencimento
   */
  static async findUpcoming(
    days: number = 7,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IPrazo>> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE data_vencimento BETWEEN SYSDATE AND SYSDATE + :days
      AND status NOT IN ('concluido', 'vencido')
      ORDER BY data_vencimento ASC
    `;
    
    return await this.queryWithPagination(sql, { days }, pagination);
  }

  /**
   * Atualizar status do prazo
   */
  static async updateStatus(
    id: number, 
    status: string, 
    observacoes?: string
  ): Promise<IPrazo | null> {
    const updateData: any = { status };
    if (observacoes) {
      updateData.observacoes = observacoes;
    }
    if (status === 'concluido') {
      updateData.data_conclusao = new Date();
    }
    
    return await this.update(id, updateData);
  }

  /**
   * Buscar prazos por responsável
   */
  static async findByResponsible(
    responsavel: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IPrazo>> {
    return await this.findAll({ responsavel: `%${responsavel}%` }, pagination);
  }

  /**
   * Buscar prazos por status
   */
  static async findByStatus(
    status: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IPrazo>> {
    return await this.findAll({ status }, pagination);
  }

  /**
   * Buscar prazos por prioridade
   */
  static async findByPriority(
    prioridade: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IPrazo>> {
    return await this.findAll({ prioridade }, pagination);
  }

  /**
   * Marcar prazos vencidos automaticamente
   */
  static async markOverdueItems(): Promise<number> {
    const sql = `
      UPDATE ${this.tableName} 
      SET status = 'vencido', updated_at = SYSDATE
      WHERE data_vencimento < SYSDATE 
      AND status NOT IN ('concluido', 'vencido')
    `;
    
    const result = await this.query(sql);
    return result.length || 0;
  }
}

export default PrazoModel;