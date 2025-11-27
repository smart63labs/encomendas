import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './base.controller';
import oracledb from 'oracledb';
import { BaseController, AuthenticatedRequest } from './base.controller';
import { DocumentoModel, IDocumento } from '../models/documento.model';
import { DatabaseService } from '../config/database';

/**
 * Controller de Documentos
 * Gerencia operações CRUD de documentos
 */
export class DocumentoController extends BaseController {
  constructor() {
    super(DocumentoModel);
  }
  /**
   * Listar documentos com paginação e filtros
   */
  override async index(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        categoria,
        pasta,
        nivelAcesso,
        status = 'ativo'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      let whereConditions = ['d.STATUS = :status'];
      const binds: any = { status };
      let bindIndex = 1;

      // Adicionar filtros
      if (search) {
        whereConditions.push(`(UPPER(d.NOME) LIKE :search${bindIndex} OR UPPER(d.DESCRICAO) LIKE :search${bindIndex})`);
        binds[`search${bindIndex}`] = `%${String(search).toUpperCase()}%`;
        bindIndex++;
      }

      if (categoria) {
        whereConditions.push(`UPPER(d.CATEGORIA) = :categoria${bindIndex}`);
        binds[`categoria${bindIndex}`] = String(categoria).toUpperCase();
        bindIndex++;
      }

      if (pasta) {
        whereConditions.push(`UPPER(d.PASTA) = :pasta${bindIndex}`);
        binds[`pasta${bindIndex}`] = String(pasta).toUpperCase();
        bindIndex++;
      }

      if (nivelAcesso) {
        whereConditions.push(`d.NIVEL_ACESSO = :nivelAcesso${bindIndex}`);
        binds[`nivelAcesso${bindIndex}`] = nivelAcesso;
        bindIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Query para contar total de registros
      const countQuery = `
        SELECT COUNT(*) as TOTAL
        FROM DOCUMENTOS d
        WHERE ${whereClause}
      `;

      // Query principal com paginação
      const query = `
        SELECT * FROM (
          SELECT d.*, ROW_NUMBER() OVER (ORDER BY d.DATA_UPLOAD DESC) as RN
          FROM DOCUMENTOS d
          WHERE ${whereClause}
        ) WHERE RN BETWEEN :offset + 1 AND :offset + :limit
      `;

      binds.offset = offset;
      binds.limit = Number(limit);

      const connection = await DatabaseService.getConnection();
      
      try {
        // Executar contagem
        const countResult = await connection.execute(countQuery, binds);
        const total = (countResult.rows?.[0] as any)?.TOTAL || 0;

        // Executar query principal
        const result = await connection.execute(query, binds, {
          outFormat: oracledb.OUT_FORMAT_OBJECT
        });

        const documentos = (result.rows as any[])?.map(row => ({
          id: row.ID,
          nome: row.NOME,
          tipo: row.TIPO,
          extensao: row.EXTENSAO,
          tamanho: row.TAMANHO,
          categoria: row.CATEGORIA,
          descricao: row.DESCRICAO,
          tags: row.TAGS,
          pasta: row.PASTA,
          nivelAcesso: row.NIVEL_ACESSO,
          dataUpload: row.DATA_UPLOAD,
          dataModificacao: row.DATA_MODIFICACAO,
          uploadedBy: row.UPLOADED_BY,
          modificadoPor: row.MODIFICADO_POR,
          url: row.URL,
          versao: row.VERSAO,
          status: row.STATUS,
          createdAt: row.CREATED_AT,
          updatedAt: row.UPDATED_AT
        })) || [];

        this.sendSuccess(res, {
          documentos,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }, 'Documentos listados com sucesso');
      } finally {
        await connection.close();
      }
    } catch (error) {
      this.sendError(res, 'Erro ao listar documentos', 500);
    }
  }

  /**
   * Buscar documentos
   */
  override async search(req: Request, res: Response): Promise<void> {
    try {
      const { q, page = 1, limit = 10 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const query = `
        SELECT * FROM (
          SELECT d.*, ROW_NUMBER() OVER (ORDER BY d.DATA_UPLOAD DESC) as RN
          FROM DOCUMENTOS d
          WHERE d.STATUS = 'ativo'
            AND (UPPER(d.NOME) LIKE :search 
                 OR UPPER(d.DESCRICAO) LIKE :search
                 OR UPPER(d.CATEGORIA) LIKE :search
                 OR UPPER(d.TAGS) LIKE :search)
        ) WHERE RN BETWEEN :offset + 1 AND :offset + :limit
      `;

      const binds = {
        search: `%${String(q).toUpperCase()}%`,
        offset,
        limit: Number(limit)
      };

      const connection = await DatabaseService.getConnection();
      
      try {
        const result = await connection.execute(query, binds, {
          outFormat: oracledb.OUT_FORMAT_OBJECT
        });

        const documentos = (result.rows as any[])?.map(row => ({
          id: row.ID,
          nome: row.NOME,
          tipo: row.TIPO,
          extensao: row.EXTENSAO,
          tamanho: row.TAMANHO,
          categoria: row.CATEGORIA,
          descricao: row.DESCRICAO,
          tags: row.TAGS,
          pasta: row.PASTA,
          nivelAcesso: row.NIVEL_ACESSO,
          dataUpload: row.DATA_UPLOAD,
          dataModificacao: row.DATA_MODIFICACAO,
          uploadedBy: row.UPLOADED_BY,
          modificadoPor: row.MODIFICADO_POR,
          url: row.URL,
          versao: row.VERSAO,
          status: row.STATUS,
          createdAt: row.CREATED_AT,
          updatedAt: row.UPDATED_AT
        })) || [];

        this.sendSuccess(res, { documentos }, 'Busca realizada com sucesso');
      } finally {
        await connection.close();
      }
    } catch (error) {
      this.sendError(res, 'Erro ao buscar documentos', 500);
    }
  }

  /**
   * Obter estatísticas dos documentos
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const query = `
        SELECT 
          COUNT(*) as TOTAL,
          COUNT(CASE WHEN STATUS = 'ativo' THEN 1 END) as ATIVOS,
          COUNT(CASE WHEN STATUS = 'arquivado' THEN 1 END) as ARQUIVADOS,
          COUNT(CASE WHEN NIVEL_ACESSO = 'publico' THEN 1 END) as PUBLICOS,
          COUNT(CASE WHEN NIVEL_ACESSO = 'restrito' THEN 1 END) as RESTRITOS,
          COUNT(CASE WHEN NIVEL_ACESSO = 'confidencial' THEN 1 END) as CONFIDENCIAIS,
          SUM(TAMANHO) as TAMANHO_TOTAL
        FROM DOCUMENTOS
        WHERE STATUS != 'excluido'
      `;

      const connection = await DatabaseService.getConnection();
      
      try {
        const result = await connection.execute(query, {}, {
          outFormat: oracledb.OUT_FORMAT_OBJECT
        });

        const stats = result.rows?.[0] as any;

        this.sendSuccess(res, {
          total: stats?.TOTAL || 0,
          ativos: stats?.ATIVOS || 0,
          arquivados: stats?.ARQUIVADOS || 0,
          publicos: stats?.PUBLICOS || 0,
          restritos: stats?.RESTRITOS || 0,
          confidenciais: stats?.CONFIDENCIAIS || 0,
          tamanhoTotal: stats?.TAMANHO_TOTAL || 0
        }, 'Estatísticas obtidas com sucesso');
      } finally {
        await connection.close();
      }
    } catch (error) {
      this.sendError(res, 'Erro ao obter estatísticas', 500);
    }
  }

  /**
   * Obter documento por ID
   */
  override async show(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const query = `
        SELECT * FROM DOCUMENTOS
        WHERE ID = :id AND STATUS != 'excluido'
      `;

      const connection = await DatabaseService.getConnection();
      
      try {
        const result = await connection.execute(query, { id }, {
          outFormat: oracledb.OUT_FORMAT_OBJECT
        });

        const row = result.rows?.[0] as any;
        
        if (!row) {
          this.sendError(res, 'Documento não encontrado', 404);
          return;
        }

        const documento = {
          id: row.ID,
          nome: row.NOME,
          tipo: row.TIPO,
          extensao: row.EXTENSAO,
          tamanho: row.TAMANHO,
          categoria: row.CATEGORIA,
          descricao: row.DESCRICAO,
          tags: row.TAGS,
          pasta: row.PASTA,
          nivelAcesso: row.NIVEL_ACESSO,
          dataUpload: row.DATA_UPLOAD,
          dataModificacao: row.DATA_MODIFICACAO,
          uploadedBy: row.UPLOADED_BY,
          modificadoPor: row.MODIFICADO_POR,
          url: row.URL,
          versao: row.VERSAO,
          status: row.STATUS,
          createdAt: row.CREATED_AT,
          updatedAt: row.UPDATED_AT
        };

        this.sendSuccess(res, { documento }, 'Documento encontrado');
      } finally {
        await connection.close();
      }
    } catch (error) {
      this.sendError(res, 'Erro ao buscar documento', 500);
    }
  }

  /**
   * Criar novo documento
   */
  override async store(req: Request, res: Response): Promise<void> {
    try {
      const documento: IDocumento = req.body;

      const query = `
        INSERT INTO DOCUMENTOS (
          NOME, TIPO, EXTENSAO, TAMANHO, CATEGORIA, DESCRICAO, TAGS,
          PASTA, NIVEL_ACESSO, DATA_UPLOAD, UPLOADED_BY, URL, VERSAO, STATUS
        ) VALUES (
          :nome, :tipo, :extensao, :tamanho, :categoria, :descricao, :tags,
          :pasta, :nivelAcesso, TO_DATE(:dataUpload, 'YYYY-MM-DD'), :uploadedBy, :url, :versao, :status
        ) RETURNING ID INTO :id
      `;

      const binds = {
        nome: documento.nome,
        tipo: documento.tipo,
        extensao: documento.extensao,
        tamanho: documento.tamanho,
        categoria: documento.categoria,
        descricao: documento.descricao || null,
        tags: documento.tags || null,
        pasta: documento.pasta,
        nivelAcesso: documento.nivelAcesso,
        dataUpload: documento.dataUpload || new Date().toISOString().split('T')[0],
        uploadedBy: documento.uploadedBy,
        url: documento.url || null,
        versao: documento.versao || 1,
        status: documento.status || 'ativo',
        id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      };

      const connection = await DatabaseService.getConnection();
      
      try {
        const result = await connection.execute(query, binds, { autoCommit: true });
        const novoId = (result.outBinds as any)?.id?.[0];

        this.sendSuccess(res, { 
          id: novoId,
          ...documento 
        }, 'Documento criado com sucesso', 201);
      } finally {
        await connection.close();
      }
    } catch (error) {
      this.sendError(res, 'Erro ao criar documento', 500);
    }
  }

  /**
   * Atualizar documento
   */
  override async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Construir query de atualização dinamicamente
      const setClauses = [];
      const binds: any = { id };
      let bindIndex = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          const dbColumn = this.mapFieldToColumn(key);
          if (dbColumn) {
            setClauses.push(`${dbColumn} = :${key}${bindIndex}`);
            binds[`${key}${bindIndex}`] = value;
            bindIndex++;
          }
        }
      }

      if (setClauses.length === 0) {
        this.sendError(res, 'Nenhum campo para atualizar', 400);
        return;
      }

      setClauses.push('UPDATED_AT = CURRENT_TIMESTAMP');
      setClauses.push('DATA_MODIFICACAO = CURRENT_DATE');

      const query = `
        UPDATE DOCUMENTOS 
        SET ${setClauses.join(', ')}
        WHERE ID = :id AND STATUS != 'excluido'
      `;

      const connection = await DatabaseService.getConnection();
      
      try {
        const result = await connection.execute(query, binds, { autoCommit: true });
        
        if (result.rowsAffected === 0) {
          this.sendError(res, 'Documento não encontrado', 404);
          return;
        }

        this.sendSuccess(res, { id, ...updates }, 'Documento atualizado com sucesso');
      } finally {
        await connection.close();
      }
    } catch (error) {
      this.sendError(res, 'Erro ao atualizar documento', 500);
    }
  }

  /**
   * Excluir documento (soft delete)
   */
  override async destroy(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Verificar autenticação e permissão (Admin-only)
      const role = req.user?.role?.toUpperCase() || '';
      const isAdmin = role === 'ADMIN' || role === 'ADMINISTRADOR';
      if (!req.user || !isAdmin) {
        return this.sendError(res, 'Apenas administradores podem excluir documentos', 403);
      }

      const { id } = req.params;

      const query = `
        UPDATE DOCUMENTOS 
        SET STATUS = 'excluido', UPDATED_AT = CURRENT_TIMESTAMP
        WHERE ID = :id AND STATUS != 'excluido'
      `;

      const connection = await DatabaseService.getConnection();
      
      try {
        const result = await connection.execute(query, { id }, { autoCommit: true });
        
        if (result.rowsAffected === 0) {
          this.sendError(res, 'Documento não encontrado', 404);
          return;
        }

        this.sendSuccess(res, null, 'Documento excluído com sucesso');
      } finally {
        await connection.close();
      }
    } catch (error) {
      this.sendError(res, 'Erro ao excluir documento', 500);
    }
  }

  /**
   * Mapear campos do frontend para colunas do banco
   */
  private mapFieldToColumn(field: string): string | null {
    const mapping: { [key: string]: string } = {
      nome: 'NOME',
      tipo: 'TIPO',
      extensao: 'EXTENSAO',
      tamanho: 'TAMANHO',
      categoria: 'CATEGORIA',
      descricao: 'DESCRICAO',
      tags: 'TAGS',
      pasta: 'PASTA',
      nivelAcesso: 'NIVEL_ACESSO',
      dataUpload: 'DATA_UPLOAD',
      uploadedBy: 'UPLOADED_BY',
      modificadoPor: 'MODIFICADO_POR',
      url: 'URL',
      versao: 'VERSAO',
      status: 'STATUS'
    };

    return mapping[field] || null;
  }
}