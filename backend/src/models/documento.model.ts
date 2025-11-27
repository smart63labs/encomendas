import { BaseModel, SearchFilters, PaginationOptions, PaginatedResult } from './base.model';

/**
 * Interface para dados do documento
 */
export interface IDocumento {
  id?: number;
  nome: string;
  tipo: string;
  extensao: string;
  tamanho: number;
  categoria: string;
  descricao?: string;
  tags?: string;
  pasta: string;
  nivelAcesso: 'publico' | 'restrito' | 'confidencial';
  dataUpload: Date;
  dataModificacao?: Date;
  uploadedBy: string;
  modificadoPor?: string;
  url?: string;
  versao: number;
  status: 'ativo' | 'arquivado' | 'excluido';
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Interface para filtros de documento
 */
export interface IDocumentoFilters extends SearchFilters {
  nome?: string;
  tipo?: string;
  categoria?: string;
  pasta?: string;
  nivelAcesso?: string;
  status?: string;
  uploadedBy?: string;
  tags?: string;
}

/**
 * Modelo de Documento
 * Gerencia documentos e arquivos
 */
export class DocumentoModel extends BaseModel {
  protected static override tableName = 'documentos';
  protected static override primaryKey = 'id';
  protected static override fillable = [
    'nome', 'tipo', 'extensao', 'tamanho', 'categoria', 'descricao',
    'tags', 'pasta', 'nivel_acesso', 'data_upload', 'data_modificacao',
    'uploaded_by', 'modificado_por', 'url', 'versao', 'status'
  ];
  protected static override timestamps = true;

  /**
   * Buscar documentos por categoria
   */
  static async findByCategory(
    categoria: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IDocumento>> {
    return await this.findAll({ categoria }, pagination);
  }

  /**
   * Buscar documentos por pasta
   */
  static async findByFolder(
    pasta: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IDocumento>> {
    return await this.findAll({ pasta }, pagination);
  }

  /**
   * Buscar documentos por nível de acesso
   */
  static async findByAccessLevel(
    nivelAcesso: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IDocumento>> {
    return await this.findAll({ nivel_acesso: nivelAcesso }, pagination);
  }

  /**
   * Buscar documentos por usuário que fez upload
   */
  static async findByUploader(
    uploadedBy: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IDocumento>> {
    return await this.findAll({ uploaded_by: uploadedBy }, pagination);
  }

  /**
   * Buscar documentos por tags
   */
  static async findByTags(
    tags: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IDocumento>> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE UPPER(tags) LIKE UPPER(:tags)
      AND status = 'ativo'
      ORDER BY data_upload DESC
    `;
    
    return await this.queryWithPagination(sql, { tags: `%${tags}%` }, pagination);
  }

  /**
   * Buscar documentos por tipo
   */
  static async findByType(
    tipo: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IDocumento>> {
    return await this.findAll({ tipo }, pagination);
  }

  /**
   * Atualizar versão do documento
   */
  static async updateVersion(
    id: number,
    novaVersao: number,
    modificadoPor: string,
    observacoes?: string
  ): Promise<boolean> {
    const updateData = {
      versao: novaVersao,
      modificado_por: modificadoPor,
      data_modificacao: new Date()
    };
    
    const result = await this.update(id, updateData);
    return result !== null;
  }

  /**
   * Arquivar documento
   */
  static async archive(id: number, modificadoPor: string): Promise<boolean> {
    const result = await this.update(id, {
      status: 'arquivado',
      modificado_por: modificadoPor,
      data_modificacao: new Date()
    });
    return result !== null;
  }

  /**
   * Excluir documento (soft delete)
   */
  static async softDelete(id: number, modificadoPor: string): Promise<IDocumento | null> {
    const result = await this.update(id, {
      status: 'excluido',
      modificado_por: modificadoPor,
      data_modificacao: new Date()
    });
    
    if (result) {
      return await this.findById(id);
    }
    
    return null;
  }

  /**
   * Buscar documentos recentes
   */
  static async findRecent(
    days: number = 7,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IDocumento>> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE data_upload >= SYSDATE - :days
      AND status = 'ativo'
      ORDER BY data_upload DESC
    `;
    
    return await this.queryWithPagination(sql, { days }, pagination);
  }

  /**
   * Buscar documentos por tamanho
   */
  static async findBySize(
    minSize: number,
    maxSize: number,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IDocumento>> {
    const sql = `
      SELECT * FROM ${this.tableName} 
      WHERE tamanho BETWEEN :minSize AND :maxSize
      AND status = 'ativo'
      ORDER BY tamanho DESC
    `;
    
    return await this.queryWithPagination(sql, { minSize, maxSize }, pagination);
  }
}

export default DocumentoModel;