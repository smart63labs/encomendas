import { Request, Response } from 'express';
import { DatabaseService } from '../services/database.service';

interface Configuracao {
  id: number;
  categoria: string;
  chave: string;
  valor: string;
  tipo: string;
  descricao: string;
  ativo: string;
  ordem_exibicao: number;
  data_criacao: Date;
  data_atualizacao: Date;
}

export class ConfiguracoesController {
  private db: DatabaseService;

  constructor() {
    this.db = new DatabaseService();
  }

  /**
   * Busca todas as configurações ativas
   */
  async buscarTodas(req: Request, res: Response) {
    try {
      const query = `
        SELECT 
          ID,
          CATEGORIA,
          CHAVE,
          VALOR,
          TIPO,
          DESCRICAO,
          ATIVO,
          ORDEM_EXIBICAO,
          DATA_CRIACAO,
          DATA_ATUALIZACAO
        FROM CONFIGURACOES 
        WHERE ATIVO = 'S'
        ORDER BY CATEGORIA, ORDEM_EXIBICAO, CHAVE
      `;

      const result = await this.db.executeQuery(query);
      
      if (result.success) {
        const configuracoes: Configuracao[] = result.data.map((row: any) => ({
          id: row.ID,
          categoria: row.CATEGORIA,
          chave: row.CHAVE,
          valor: row.VALOR,
          tipo: row.TIPO,
          descricao: row.DESCRICAO,
          ativo: row.ATIVO,
          ordem_exibicao: row.ORDEM_EXIBICAO,
          data_criacao: row.DATA_CRIACAO,
          data_atualizacao: row.DATA_ATUALIZACAO
        }));

        res.json({
          success: true,
          data: configuracoes,
          message: 'Configurações carregadas com sucesso'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erro ao buscar configurações',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Busca configurações por categoria
   */
  async buscarPorCategoria(req: Request, res: Response) {
    try {
      const { categoria } = req.params;

      if (!categoria) {
        return res.status(400).json({
          success: false,
          message: 'Categoria é obrigatória'
        });
      }

      const query = `
        SELECT 
          ID,
          CATEGORIA,
          CHAVE,
          VALOR,
          TIPO,
          DESCRICAO,
          ATIVO,
          ORDEM_EXIBICAO,
          DATA_CRIACAO,
          DATA_ATUALIZACAO
        FROM CONFIGURACOES 
        WHERE CATEGORIA = ? AND ATIVO = 'S'
        ORDER BY ORDEM_EXIBICAO, CHAVE
      `;

      const result = await this.db.executeQuery(query, [categoria]);
      
      if (result.success) {
        const configuracoes: Configuracao[] = result.data.map((row: any) => ({
          id: row.ID,
          categoria: row.CATEGORIA,
          chave: row.CHAVE,
          valor: row.VALOR,
          tipo: row.TIPO,
          descricao: row.DESCRICAO,
          ativo: row.ATIVO,
          ordem_exibicao: row.ORDEM_EXIBICAO,
          data_criacao: row.DATA_CRIACAO,
          data_atualizacao: row.DATA_ATUALIZACAO
        }));

        res.json({
          success: true,
          data: configuracoes,
          message: `Configurações da categoria '${categoria}' carregadas com sucesso`
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erro ao buscar configurações por categoria',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Erro ao buscar configurações por categoria:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Atualiza uma configuração específica
   */
  async atualizar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { valor } = req.body;

      if (!id || valor === undefined) {
        return res.status(400).json({
          success: false,
          message: 'ID e valor são obrigatórios'
        });
      }

      const query = `
        UPDATE CONFIGURACOES 
        SET VALOR = ?, DATA_ATUALIZACAO = SYSDATE 
        WHERE ID = ? AND ATIVO = 'S'
      `;

      const result = await this.db.executeQuery(query, [valor, id]);
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Configuração atualizada com sucesso'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Erro ao atualizar configuração',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
}