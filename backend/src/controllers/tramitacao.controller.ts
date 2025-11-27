import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './base.controller';
import { BaseController, AuthenticatedRequest } from './base.controller';
import { DatabaseService } from '../config/database';
import TramitacaoModel, { ITramitacao } from '../models/tramitacao.model';

export class TramitacaoController extends BaseController {
  constructor() {
    super(TramitacaoModel);
  }
  private tableName = 'TRAMITACOES';

  override async index(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const query = `
        SELECT * FROM (
          SELECT t.*, ROW_NUMBER() OVER (ORDER BY t.DATA_INICIO DESC) as rn
          FROM ${this.tableName} t
        ) WHERE rn BETWEEN :offset + 1 AND :offset + :limit
      `;

      const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName}`;

      const [result, countResult] = await Promise.all([
        DatabaseService.executeQuery(query, { offset, limit }),
        DatabaseService.executeQuery(countQuery)
      ]);

      const tramitacoes = result.rows?.map(row => this.mapRowToTramitacao(row)) || [];
      const total = countResult.rows?.[0]?.TOTAL || 0;

      this.sendSuccess(res, {
        data: tramitacoes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      this.sendError(res, 'Erro ao listar tramitações', 500);
    }
  }

  override async search(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;
      if (!q) {
        return this.sendError(res, 'Parâmetro de busca é obrigatório', 400);
      }

      const query = `
        SELECT * FROM ${this.tableName}
        WHERE UPPER(NUMERO_PROTOCOLO) LIKE UPPER(:search)
           OR UPPER(ASSUNTO) LIKE UPPER(:search)
           OR UPPER(REMETENTE) LIKE UPPER(:search)
           OR UPPER(DESTINATARIO) LIKE UPPER(:search)
        ORDER BY DATA_INICIO DESC
      `;

      const result = await DatabaseService.executeQuery(query, {
        search: `%${q}%`
      });

      const tramitacoes = result.rows?.map(row => this.mapRowToTramitacao(row)) || [];
      this.sendSuccess(res, { data: tramitacoes });
    } catch (error) {
      this.sendError(res, 'Erro ao buscar tramitações', 500);
    }
  }

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN STATUS = 'pendente' THEN 1 END) as pendentes,
          COUNT(CASE WHEN STATUS = 'em_andamento' THEN 1 END) as em_andamento,
          COUNT(CASE WHEN STATUS = 'concluida' THEN 1 END) as concluidas,
          COUNT(CASE WHEN STATUS = 'cancelada' THEN 1 END) as canceladas
        FROM ${this.tableName}
      `;

      const result = await DatabaseService.executeQuery(query);
      const stats = result.rows?.[0] || {};

      this.sendSuccess(res, { data: stats });
    } catch (error) {
      this.sendError(res, 'Erro ao obter estatísticas', 500);
    }
  }

  override async show(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const query = `SELECT * FROM ${this.tableName} WHERE ID = :id`;
      
      const result = await DatabaseService.executeQuery(query, { id: parseInt(id) });
      
      if (!result.rows || result.rows.length === 0) {
        this.sendError(res, 'Tramitação não encontrada', 404);
        return;
      }

      const tramitacao = this.mapRowToTramitacao(result.rows[0]);
      this.sendSuccess(res, { data: tramitacao });
    } catch (error) {
      this.sendError(res, 'Erro ao buscar tramitação', 500);
    }
  }

  override async store(req: Request, res: Response): Promise<void> {
    try {
      const tramitacao: ITramitacao = req.body;
      
      const query = `
        INSERT INTO ${this.tableName} (
          NUMERO_PROTOCOLO, ASSUNTO, REMETENTE, DESTINATARIO, 
          STATUS, PRIORIDADE, DATA_INICIO, DATA_FIM, OBSERVACOES
        ) VALUES (
          :numeroProtocolo, :assunto, :remetente, :destinatario,
          :status, :prioridade, TO_DATE(:dataInicio, 'YYYY-MM-DD HH24:MI:SS'),
          TO_DATE(:dataFim, 'YYYY-MM-DD HH24:MI:SS'), :observacoes
        ) RETURNING ID INTO :id
      `;

      const binds = {
        ...tramitacao,
        dataFim: tramitacao.dataFim || null,
        id: { dir: 'BIND_OUT', type: 'STRING' }
      };

      const result = await DatabaseService.executeQuery(query, binds);
      const newId = result.outBinds?.id as string;

      this.sendSuccess(res, {
        message: 'Tramitação criada com sucesso',
        data: { id: newId, ...tramitacao }
      });
    } catch (error) {
      this.sendError(res, 'Erro ao criar tramitação', 500);
    }
  }

  override async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const setParts: string[] = [];
      const binds: any = { id };

      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          const dbField = this.mapFieldToDb(key);
          if (key.includes('data') || key.includes('Data')) {
            setParts.push(`${dbField} = TO_DATE(:${key}, 'YYYY-MM-DD HH24:MI:SS')`);
          } else {
            setParts.push(`${dbField} = :${key}`);
          }
          binds[key] = updates[key];
        }
      });

      if (setParts.length === 0) {
        this.sendError(res, 'Nenhum campo para atualizar', 400);
        return;
      }

      const query = `
        UPDATE ${this.tableName} 
        SET ${setParts.join(', ')}
        WHERE ID = :id
      `;

      await DatabaseService.executeQuery(query, binds);
      this.sendSuccess(res, { message: 'Tramitação atualizada com sucesso' });
    } catch (error) {
      this.sendError(res, 'Erro ao atualizar tramitação', 500);
    }
  }

  override async destroy(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Verificar autenticação e permissão (Admin-only)
      const role = req.user?.role?.toUpperCase() || '';
      const isAdmin = role === 'ADMIN' || role === 'ADMINISTRADOR';
      if (!req.user || !isAdmin) {
        return this.sendError(res, 'Apenas administradores podem excluir tramitações', 403);
      }

      const { id } = req.params;
      const query = `DELETE FROM ${this.tableName} WHERE ID = :id`;
      
      await DatabaseService.executeQuery(query, { id });
      this.sendSuccess(res, { message: 'Tramitação excluída com sucesso' });
    } catch (error) {
      this.sendError(res, 'Erro ao excluir tramitação', 500);
    }
  }

  private mapRowToTramitacao(row: any): ITramitacao {
    return {
      id: row.ID,
      numeroProtocolo: row.NUMERO_PROTOCOLO,
      assunto: row.ASSUNTO,
      remetente: row.REMETENTE,
      destinatario: row.DESTINATARIO,
      status: row.STATUS,
      prioridade: row.PRIORIDADE,
      dataInicio: row.DATA_INICIO,
      dataFim: row.DATA_FIM,
      observacoes: row.OBSERVACOES,
      created_at: row.CREATED_AT,
      updated_at: row.UPDATED_AT
    };
  }

  private mapFieldToDb(field: string): string {
    const fieldMap: { [key: string]: string } = {
      numeroProtocolo: 'NUMERO_PROTOCOLO',
      assunto: 'ASSUNTO',
      remetente: 'REMETENTE',
      destinatario: 'DESTINATARIO',
      status: 'STATUS',
      prioridade: 'PRIORIDADE',
      dataInicio: 'DATA_INICIO',
      dataFim: 'DATA_FIM',
      observacoes: 'OBSERVACOES'
    };
    return fieldMap[field] || field.toUpperCase();
  }
}