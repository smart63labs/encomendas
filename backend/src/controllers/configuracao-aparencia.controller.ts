import { Request, Response } from 'express';
import { DatabaseService } from '../config/database';
import { AuthenticatedRequest } from './base.controller';

export interface ConfiguracaoAparencia {
  id?: number;
  configuracaoId: number;
  tema: string;
  idioma: string;
  formatoData: string;
  densidade: string;
  corPrimaria: string;
  animacoes: boolean;
  sidebarCompacta: boolean;
  dataCriacao?: Date;
  dataAlteracao?: Date;
  usuarioCriacaoId?: number;
  usuarioAlteracaoId?: number;
  ativo?: boolean;
}

export class ConfiguracaoAparenciaController {
  /**
   * Busca configurações de aparência por configuração ID
   */
  async buscarPorConfiguracaoId(req: Request, res: Response): Promise<void> {
    try {
      const { configuracaoId } = req.params;

      const configId = parseInt(configuracaoId, 10);
      if (isNaN(configId)) {
        res.status(400).json({
          success: false,
          message: 'ID de configuração inválido'
        });
        return;
      }

      const sql = `
        SELECT 
          ID,
          CONFIGURACAO_ID as "configuracaoId",
          TEMA,
          IDIOMA,
          FORMATO_DATA as "formatoData",
          DENSIDADE,
          COR_PRIMARIA as "corPrimaria",
          ANIMACOES,
          SIDEBAR_COMPACTA as "sidebarCompacta",
          DATA_CRIACAO as "dataCriacao",
          DATA_ALTERACAO as "dataAlteracao",
          USUARIO_CRIACAO_ID as "usuarioCriacaoId",
          USUARIO_ALTERACAO_ID as "usuarioAlteracaoId",
          ATIVO
        FROM CONFIGURACOES_APARENCIA
        WHERE CONFIGURACAO_ID = :1 AND ATIVO = 'S'
      `;

      const result = await DatabaseService.executeQuery(sql, [configId]);

      if (!result.rows || result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Configurações de aparência não encontradas'
        });
        return;
      }

      const row = result.rows[0];
      const configuracao: ConfiguracaoAparencia = {
        id: row.ID,
        configuracaoId: row.configuracaoId,
        tema: row.TEMA,
        idioma: row.IDIOMA,
        formatoData: row.formatoData,
        densidade: row.DENSIDADE,
        corPrimaria: row.corPrimaria,
        animacoes: row.ANIMACOES === 'S',
        sidebarCompacta: row.sidebarCompacta === 'S',
        dataCriacao: row.dataCriacao,
        dataAlteracao: row.dataAlteracao,
        usuarioCriacaoId: row.usuarioCriacaoId,
        usuarioAlteracaoId: row.usuarioAlteracaoId,
        ativo: row.ATIVO === 'S'
      };

      res.json({
        success: true,
        data: configuracao
      });

    } catch (error) {
      console.error('Erro ao buscar configurações de aparência:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar configurações de aparência'
      });
    }
  }

  /**
   * Cria ou atualiza configurações de aparência
   */
  async salvar(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { configuracaoId } = req.params;
      const {
        tema,
        idioma,
        formatoData,
        densidade,
        corPrimaria,
        animacoes,
        sidebarCompacta
      } = req.body;

      const configId = parseInt(configuracaoId, 10);
      if (isNaN(configId)) {
        res.status(400).json({
          success: false,
          message: 'ID de configuração inválido'
        });
        return;
      }

      // Verificar se já existe configuração de aparência para este ID
      const sqlVerificar = `
        SELECT ID FROM CONFIGURACOES_APARENCIA 
        WHERE CONFIGURACAO_ID = :1 AND ATIVO = 'S'
      `;
      
      const resultVerificar = await DatabaseService.executeQuery(sqlVerificar, [configId]);
      
      let sql: string;
      let params: any[];
      
      if (resultVerificar.rows && resultVerificar.rows.length > 0) {
        // Atualizar registro existente
        const id = resultVerificar.rows[0].ID;
        sql = `
          UPDATE CONFIGURACOES_APARENCIA SET
            TEMA = :1,
            IDIOMA = :2,
            FORMATO_DATA = :3,
            DENSIDADE = :4,
            COR_PRIMARIA = :5,
            ANIMACOES = :6,
            SIDEBAR_COMPACTA = :7,
            DATA_ALTERACAO = SYSDATE,
            USUARIO_ALTERACAO_ID = :8
          WHERE ID = :9
        `;
        params = [
          tema,
          idioma,
          formatoData,
          densidade,
          corPrimaria,
          animacoes ? 'S' : 'N',
          sidebarCompacta ? 'S' : 'N',
          req.user?.id || null,
          id
        ];
      } else {
        // Criar novo registro
        sql = `
          INSERT INTO CONFIGURACOES_APARENCIA (
            CONFIGURACAO_ID,
            TEMA,
            IDIOMA,
            FORMATO_DATA,
            DENSIDADE,
            COR_PRIMARIA,
            ANIMACOES,
            SIDEBAR_COMPACTA,
            USUARIO_CRIACAO_ID
          ) VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9)
        `;
        params = [
          configId,
          tema,
          idioma,
          formatoData,
          densidade,
          corPrimaria,
          animacoes ? 'S' : 'N',
          sidebarCompacta ? 'S' : 'N',
          req.user?.id || null
        ];
      }

      await DatabaseService.executeQuery(sql, params);

      res.json({
        success: true,
        message: 'Configurações de aparência salvas com sucesso'
      });

    } catch (error) {
      console.error('Erro ao salvar configurações de aparência:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao salvar configurações de aparência'
      });
    }
  }
}