import { Request, Response, NextFunction } from 'express';
import { BaseController, AuthenticatedRequest } from './base.controller';
import { PrazoModel, IPrazo } from '../models/prazo.model';
import { DatabaseService } from '../config/database';

/**
 * Controller de Prazos
 * Gerencia operações CRUD de prazos e vencimentos
 */
export class PrazoController extends BaseController {
  constructor() {
    super(PrazoModel);
  }

  private tableName = 'PRAZOS';

  override async index(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const query = `
        SELECT * FROM (
          SELECT p.*, ROW_NUMBER() OVER (ORDER BY p.DATA_VENCIMENTO ASC) as rn
          FROM ${this.tableName} p
        ) WHERE rn BETWEEN :offset + 1 AND :offset + :limit
      `;

      const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName}`;

      const [result, countResult] = await Promise.all([
        DatabaseService.executeQuery(query, { offset, limit }),
        DatabaseService.executeQuery(countQuery)
      ]);

      const prazos = result.rows?.map(row => this.mapRowToPrazo(row)) || [];
      const total = countResult.rows?.[0]?.TOTAL || 0;

      this.sendSuccess(res, {
        data: prazos,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      this.sendError(res, 'Erro ao listar prazos', 500);
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
        WHERE UPPER(TITULO) LIKE UPPER(:search)
           OR UPPER(DESCRICAO) LIKE UPPER(:search)
           OR UPPER(RESPONSAVEL) LIKE UPPER(:search)
        ORDER BY DATA_VENCIMENTO ASC
      `;

      const result = await DatabaseService.executeQuery(query, {
        search: `%${q}%`
      });

      const prazos = result.rows?.map(row => this.mapRowToPrazo(row)) || [];
      this.sendSuccess(res, { data: prazos });
    } catch (error) {
      this.sendError(res, 'Erro ao buscar prazos', 500);
    }
  }

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN STATUS = 'pendente' THEN 1 END) as pendentes,
          COUNT(CASE WHEN STATUS = 'em_andamento' THEN 1 END) as em_andamento,
          COUNT(CASE WHEN STATUS = 'concluido' THEN 1 END) as concluidos,
          COUNT(CASE WHEN STATUS = 'vencido' THEN 1 END) as vencidos
        FROM ${this.tableName}
      `;

      const result = await DatabaseService.executeQuery(query);
      const stats = result.rows?.[0] || {};

      this.sendSuccess(res, { data: stats });
    } catch (error) {
      this.sendError(res, 'Erro ao obter estatísticas', 500);
    }
  }

  async getVencidos(req: Request, res: Response): Promise<void> {
    try {
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE DATA_VENCIMENTO < SYSDATE AND STATUS != 'concluido'
        ORDER BY DATA_VENCIMENTO ASC
      `;

      const result = await DatabaseService.executeQuery(query);
      const prazos = result.rows?.map(row => this.mapRowToPrazo(row)) || [];

      this.sendSuccess(res, { data: prazos });
    } catch (error) {
      this.sendError(res, 'Erro ao buscar prazos vencidos', 500);
    }
  }

  async getProximos(req: Request, res: Response): Promise<void> {
    try {
      const dias = parseInt(req.query.dias as string) || 7;
      
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE DATA_VENCIMENTO BETWEEN SYSDATE AND SYSDATE + :dias
          AND STATUS != 'concluido'
        ORDER BY DATA_VENCIMENTO ASC
      `;

      const result = await DatabaseService.executeQuery(query, { dias });
      const prazos = result.rows?.map(row => this.mapRowToPrazo(row)) || [];

      this.sendSuccess(res, { data: prazos });
    } catch (error) {
      this.sendError(res, 'Erro ao buscar próximos prazos', 500);
    }
  }

  override async show(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const query = `SELECT * FROM ${this.tableName} WHERE ID = :id`;
      
      const result = await DatabaseService.executeQuery(query, { id });
      
      if (!result.rows || result.rows.length === 0) {
        this.sendError(res, 'Prazo não encontrado', 404);
        return;
      }

      const prazo = this.mapRowToPrazo(result.rows[0]);
      this.sendSuccess(res, { data: prazo });
    } catch (error) {
      this.sendError(res, 'Erro ao buscar prazo', 500);
    }
  }

  override async store(req: Request, res: Response): Promise<void> {
    try {
      const prazo: IPrazo = req.body;
      
      const query = `
        INSERT INTO ${this.tableName} (
          TITULO, DESCRICAO, DATA_VENCIMENTO, STATUS, PRIORIDADE,
          RESPONSAVEL, DATA_CONCLUSAO, OBSERVACOES
        ) VALUES (
          :titulo, :descricao, TO_DATE(:dataVencimento, 'YYYY-MM-DD HH24:MI:SS'),
          :status, :prioridade, :responsavel,
          TO_DATE(:dataConclusao, 'YYYY-MM-DD HH24:MI:SS'), :observacoes
        ) RETURNING ID INTO :id
      `;

      const binds = {
        ...prazo,
        dataConclusao: prazo.dataConclusao || null,
        id: { dir: 'BIND_OUT', type: 'NUMBER' }
      };

      const result = await DatabaseService.executeQuery(query, binds);
      const newId = result.outBinds?.id;

      this.sendSuccess(res, { id: newId, ...prazo }, 'Prazo criado com sucesso', {}, 201);
    } catch (error) {
      this.sendError(res, 'Erro ao criar prazo', 500);
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
      this.sendSuccess(res, { message: 'Prazo atualizado com sucesso' });
    } catch (error) {
      this.sendError(res, 'Erro ao atualizar prazo', 500);
    }
  }

  override async destroy(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Verificar autenticação e permissão (Admin-only)
      const role = req.user?.role?.toUpperCase() || '';
      const isAdmin = role === 'ADMIN' || role === 'ADMINISTRADOR';
      if (!req.user || !isAdmin) {
        return this.sendError(res, 'Apenas administradores podem excluir prazos', 403);
      }

      const { id } = req.params;
      const query = `DELETE FROM ${this.tableName} WHERE ID = :id`;
      
      await DatabaseService.executeQuery(query, { id });
      this.sendSuccess(res, { message: 'Prazo excluído com sucesso' });
    } catch (error) {
      this.sendError(res, 'Erro ao excluir prazo', 500);
    }
  }

  private mapRowToPrazo(row: any): IPrazo {
    return {
      id: row.ID,
      titulo: row.TITULO,
      descricao: row.DESCRICAO,
      dataVencimento: row.DATA_VENCIMENTO,
      status: row.STATUS,
      prioridade: row.PRIORIDADE,
      responsavel: row.RESPONSAVEL,
      dataConclusao: row.DATA_CONCLUSAO,
      observacoes: row.OBSERVACOES,
      created_at: row.CREATED_AT,
      updated_at: row.UPDATED_AT
    };
  }

  private mapFieldToDb(field: string): string {
    const fieldMap: { [key: string]: string } = {
      titulo: 'TITULO',
      descricao: 'DESCRICAO',
      dataVencimento: 'DATA_VENCIMENTO',
      status: 'STATUS',
      prioridade: 'PRIORIDADE',
      responsavel: 'RESPONSAVEL',
      dataConclusao: 'DATA_CONCLUSAO',
      observacoes: 'OBSERVACOES'
    };
    return fieldMap[field] || field.toUpperCase();
  }
}