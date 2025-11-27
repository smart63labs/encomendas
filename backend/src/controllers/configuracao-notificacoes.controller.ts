import { Request, Response } from 'express';
import { DatabaseService } from '../config/database';

export interface ConfiguracaoNotificacoes {
  id?: number;
  configuracaoId: number;
  notificacoesEmail: boolean;
  notificacoesPush: boolean;
  emailProcessos: boolean;
  emailPrazos: boolean;
  emailDocumentos: boolean;
  frequenciaResumo: string;
  dataCriacao?: Date;
  dataAlteracao?: Date;
  usuarioCriacaoId?: number;
  usuarioAlteracaoId?: number;
  ativo?: boolean;
}

export class ConfiguracaoNotificacoesController {
  /**
   * Busca configurações de notificações por configuração ID
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
          NOTIFICACOES_EMAIL as "notificacoesEmail",
          NOTIFICACOES_PUSH as "notificacoesPush",
          EMAIL_PROCESSOS as "emailProcessos",
          EMAIL_PRAZOS as "emailPrazos",
          EMAIL_DOCUMENTOS as "emailDocumentos",
          FREQUENCIA_RESUMO as "frequenciaResumo",
          DATA_CRIACAO as "dataCriacao",
          DATA_ALTERACAO as "dataAlteracao",
          USUARIO_CRIACAO_ID as "usuarioCriacaoId",
          USUARIO_ALTERACAO_ID as "usuarioAlteracaoId",
          ATIVO
        FROM CONFIGURACOES_NOTIFICACOES
        WHERE CONFIGURACAO_ID = :1 AND ATIVO = 'S'
      `;

      const result = await DatabaseService.executeQuery(sql, [configId]);

      if (!result.rows || result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Configurações de notificações não encontradas'
        });
        return;
      }

      const row = result.rows[0];
      const configuracao: ConfiguracaoNotificacoes = {
        id: row.ID,
        configuracaoId: row.configuracaoId,
        notificacoesEmail: row.notificacoesEmail === 'S',
        notificacoesPush: row.notificacoesPush === 'S',
        emailProcessos: row.emailProcessos === 'S',
        emailPrazos: row.emailPrazos === 'S',
        emailDocumentos: row.emailDocumentos === 'S',
        frequenciaResumo: row.frequenciaResumo,
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
      console.error('Erro ao buscar configurações de notificações:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar configurações de notificações'
      });
    }
  }

  /**
   * Cria ou atualiza configurações de notificações
   */
  async salvar(req: Request, res: Response): Promise<void> {
    try {
      const { configuracaoId } = req.params;
      const {
        notificacoesEmail,
        notificacoesPush,
        emailProcessos,
        emailPrazos,
        emailDocumentos,
        frequenciaResumo
      } = req.body;

      const configId = parseInt(configuracaoId, 10);
      if (isNaN(configId)) {
        res.status(400).json({
          success: false,
          message: 'ID de configuração inválido'
        });
        return;
      }

      // Verificar se já existe configuração de notificações para este ID
      const sqlVerificar = `
        SELECT ID FROM CONFIGURACOES_NOTIFICACOES 
        WHERE CONFIGURACAO_ID = :1 AND ATIVO = 'S'
      `;
      
      const resultVerificar = await DatabaseService.executeQuery(sqlVerificar, [configId]);
      
      let sql: string;
      let params: any[];
      
      if (resultVerificar.rows && resultVerificar.rows.length > 0) {
        // Atualizar registro existente
        const id = resultVerificar.rows[0].ID;
        sql = `
          UPDATE CONFIGURACOES_NOTIFICACOES SET
            NOTIFICACOES_EMAIL = :1,
            NOTIFICACOES_PUSH = :2,
            EMAIL_PROCESSOS = :3,
            EMAIL_PRAZOS = :4,
            EMAIL_DOCUMENTOS = :5,
            FREQUENCIA_RESUMO = :6,
            DATA_ALTERACAO = SYSDATE,
            USUARIO_ALTERACAO_ID = :7
          WHERE ID = :8
        `;
        params = [
          notificacoesEmail ? 'S' : 'N',
          notificacoesPush ? 'S' : 'N',
          emailProcessos ? 'S' : 'N',
          emailPrazos ? 'S' : 'N',
          emailDocumentos ? 'S' : 'N',
          frequenciaResumo,
          req.user?.id || null,
          id
        ];
      } else {
        // Criar novo registro
        sql = `
          INSERT INTO CONFIGURACOES_NOTIFICACOES (
            CONFIGURACAO_ID,
            NOTIFICACOES_EMAIL,
            NOTIFICACOES_PUSH,
            EMAIL_PROCESSOS,
            EMAIL_PRAZOS,
            EMAIL_DOCUMENTOS,
            FREQUENCIA_RESUMO,
            USUARIO_CRIACAO_ID
          ) VALUES (:1, :2, :3, :4, :5, :6, :7, :8)
        `;
        params = [
          configId,
          notificacoesEmail ? 'S' : 'N',
          notificacoesPush ? 'S' : 'N',
          emailProcessos ? 'S' : 'N',
          emailPrazos ? 'S' : 'N',
          emailDocumentos ? 'S' : 'N',
          frequenciaResumo,
          req.user?.id || null
        ];
      }

      await DatabaseService.executeQuery(sql, params);

      res.json({
        success: true,
        message: 'Configurações de notificações salvas com sucesso'
      });

    } catch (error) {
      console.error('Erro ao salvar configurações de notificações:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao salvar configurações de notificações'
      });
    }
  }
}