import { BaseModel, SearchFilters, PaginationOptions, PaginatedResult } from './base.model';

/**
 * Interface para dados da encomenda
 */
export interface IEncomenda {
  id?: number;
  numeroEncomenda?: string;
  codigoRastreamento?: string;
  remetente?: string;
  destinatario?: string;
  enderecoDestino?: string;
  descricao?: string;
  status?: 'pendente' | 'postado' | 'em_transito' | 'entregue' | 'devolvido';
  dataPostagem?: Date;
  dataCriacao?: Date;
  dataAtualizacao?: Date;
  dataEntrega?: Date;
  valorDeclarado?: number;
  peso?: number;
  observacoes?: string;
  usuarioOrigemId?: number | undefined;
  usuarioDestinoId?: number | undefined;
  setorOrigemId?: number | undefined;
  setorDestinoId?: number | undefined;
  setorOrigem?: string;
  setorDestino?: string;
  codigoLacreMalote?: string;
  qrCode?: string;
  codigoBarras?: string;
  urgente?: boolean;
  prioridade?: 'normal' | 'urgente';
  encomendaPaiId?: number | null;
  setorHub?: 'SIM' | null;
  setorHubId?: number | null;
  // Dados de matrícula e vínculo do remetente e destinatário
  remetenteMatricula?: string | null;
  remetenteVinculo?: string | null;
  destinatarioMatricula?: string | null;
  destinatarioVinculo?: string | null;
  // Identificadores adicionais
  numeroMalote?: string | undefined;
  numeroLacre?: string | undefined;
  numeroAR?: string | undefined;
  // Coordenadas dos setores
  setorOrigemCoordenadas?: {
    latitude: number | null;
    longitude: number | null;
  };
  setorDestinoCoordenadas?: {
    latitude: number | null;
    longitude: number | null;
  };
  // Endereços dos setores
  setorOrigemEndereco?: {
    logradouro?: string | undefined;
    numero?: string | undefined;
    complemento?: string | undefined;
    bairro?: string | undefined;
    cidade?: string | undefined;
    estado?: string | undefined;
    cep?: string | undefined;
  };
  setorDestinoEndereco?: {
    logradouro?: string | undefined;
    numero?: string | undefined;
    complemento?: string | undefined;
    bairro?: string | undefined;
    cidade?: string | undefined;
    estado?: string | undefined;
    cep?: string | undefined;
  };
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Interface para filtros de encomenda
 */
export interface IEncomendaFilters extends SearchFilters {
  codigoRastreamento?: string;
  remetente?: string;
  destinatario?: string;
  status?: string;
  dataPostagem?: Date;
  dataEntrega?: Date;
}

/**
 * Modelo de Encomenda
 * Gerencia encomendas e rastreamento
 */
export class EncomendaModel extends BaseModel {
  protected static override tableName = 'encomendas';
  protected static override primaryKey = 'id';
  protected static override fillable = [
    'codigo_rastreamento', 'remetente', 'destinatario', 'endereco_destino',
    'status', 'data_postagem', 'data_entrega', 'valor_declarado',
    'peso', 'observacoes'
  ];
  protected static override timestamps = true;

  /**
   * Buscar encomenda por código de rastreamento
   */
  static async findByTrackingCode(codigo: string): Promise<IEncomenda | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE codigo_rastreamento = :codigo`;
    const result = await this.query(sql, { codigo });
    return result[0] || null;
  }

  /**
   * Atualizar status da encomenda
   */
  static async updateStatus(id: number, status: string, observacoes?: string): Promise<IEncomenda | null> {
    const updateData: any = { status };
    if (observacoes) {
      updateData.observacoes = observacoes;
    }
    if (status === 'entregue') {
      updateData.data_entrega = new Date();
    }
    
    return await this.update(id, updateData);
  }

  /**
   * Buscar encomendas por status
   */
  static async findByStatus(
    status: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IEncomenda>> {
    return await this.findAll({ status }, pagination);
  }

  /**
   * Buscar encomendas por remetente
   */
  static async findBySender(
    remetente: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IEncomenda>> {
    return await this.findAll({ remetente: `%${remetente}%` }, pagination);
  }

  /**
   * Buscar encomendas por destinatário
   */
  static async findByRecipient(
    destinatario: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IEncomenda>> {
    return await this.findAll({ destinatario: `%${destinatario}%` }, pagination);
  }
}

export default EncomendaModel;
