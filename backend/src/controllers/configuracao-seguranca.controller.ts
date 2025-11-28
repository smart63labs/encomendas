import { Request, Response } from 'express';
import { DatabaseService } from '../config/database';
import { AuthenticatedRequest } from './base.controller';

export interface ConfiguracaoSeguranca {
  id?: number;
  configuracaoId: number;
  autenticacaoDuasEtapas: boolean;
  senhaComplexidade: string;
  senhaMinCaracteres: number;
  senhaExpiracaoDias: number;
  tentativasMaxLogin: number;
  bloqueioTempoDias: number;
  sessaoExpiracaoMinutos: number;
  dataCriacao?: Date;
  dataAlteracao?: Date;
  usuarioCriacaoId?: number;
  usuarioAlteracaoId?: number;
  ativo?: boolean;
}

export class ConfiguracaoSegurancaController {
  /**
   * Busca configurações de segurança por configuração ID
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
          AUTENTICACAO_DUAS_ETAPAS as "autenticacaoDuasEtapas",
          SENHA_COMPLEXIDADE as "senhaComplexidade",
          SENHA_MIN_CARACTERES as "senhaMinCaracteres",
          SENHA_EXPIRACAO_DIAS as "senhaExpiracaoDias",
          TENTATIVAS_MAX_LOGIN as "tentativasMaxLogin",
          BLOQUEIO_TEMPO_DIAS as "bloqueioTempoDias",
          SESSAO_EXPIRACAO_MINUTOS as "sessaoExpiracaoMinutos",
          DATA_CRIACAO as "dataCriacao",
          DATA_ALTERACAO as "dataAlteracao",
          USUARIO_CRIACAO_ID as "usuarioCriacaoId",
          USUARIO_ALTERACAO_ID as "usuarioAlteracaoId",
          ATIVO
        FROM CONFIGURACOES_SEGURANCA
        WHERE CONFIGURACAO_ID = :1 AND ATIVO = 'S'
      `;

      const result = await DatabaseService.executeQuery(sql, [configId]);

      if (!result.rows || result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Configurações de segurança não encontradas'
        });
        return;
      }

      const row = result.rows[0];
      const configuracao: ConfiguracaoSeguranca = {
        id: row.ID,
        configuracaoId: row.configuracaoId,
        autenticacaoDuasEtapas: row.autenticacaoDuasEtapas === 'S',
        senhaComplexidade: row.senhaComplexidade,
        senhaMinCaracteres: row.senhaMinCaracteres,
        senhaExpiracaoDias: row.senhaExpiracaoDias,
        tentativasMaxLogin: row.tentativasMaxLogin,
        bloqueioTempoDias: row.bloqueioTempoDias,
        sessaoExpiracaoMinutos: row.sessaoExpiracaoMinutos,
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
      console.error('Erro ao buscar configurações de segurança:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar configurações de segurança'
      });
    }
  }

  /**
   * Cria ou atualiza configurações de segurança
   */
  async salvar(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { configuracaoId } = req.params;
      const {
        autenticacaoDuasEtapas,
        senhaComplexidade,
        senhaMinCaracteres,
        senhaExpiracaoDias,
        tentativasMaxLogin,
        bloqueioTempoDias,
        sessaoExpiracaoMinutos
      } = req.body;

      const configId = parseInt(configuracaoId, 10);
      if (isNaN(configId)) {
        res.status(400).json({
          success: false,
          message: 'ID de configuração inválido'
        });
        return;
      }

      // Verificar se já existe configuração de segurança para este ID
      const sqlVerificar = `
        SELECT ID FROM CONFIGURACOES_SEGURANCA 
        WHERE CONFIGURACAO_ID = :1 AND ATIVO = 'S'
      `;
      
      const resultVerificar = await DatabaseService.executeQuery(sqlVerificar, [configId]);
      
      let sql: string;
      let params: any[];
      
      if (resultVerificar.rows && resultVerificar.rows.length > 0) {
        // Atualizar registro existente
        const id = resultVerificar.rows[0].ID;
        sql = `
          UPDATE CONFIGURACOES_SEGURANCA SET
            AUTENTICACAO_DUAS_ETAPAS = :1,
            SENHA_COMPLEXIDADE = :2,
            SENHA_MIN_CARACTERES = :3,
            SENHA_EXPIRACAO_DIAS = :4,
            TENTATIVAS_MAX_LOGIN = :5,
            BLOQUEIO_TEMPO_DIAS = :6,
            SESSAO_EXPIRACAO_MINUTOS = :7,
            DATA_ALTERACAO = SYSDATE,
            USUARIO_ALTERACAO_ID = :8
          WHERE ID = :9
        `;
        params = [
          autenticacaoDuasEtapas ? 'S' : 'N',
          senhaComplexidade,
          senhaMinCaracteres,
          senhaExpiracaoDias,
          tentativasMaxLogin,
          bloqueioTempoDias,
          sessaoExpiracaoMinutos,
          req.user?.id || null,
          id
        ];
      } else {
        // Criar novo registro
        sql = `
          INSERT INTO CONFIGURACOES_SEGURANCA (
            CONFIGURACAO_ID,
            AUTENTICACAO_DUAS_ETAPAS,
            SENHA_COMPLEXIDADE,
            SENHA_MIN_CARACTERES,
            SENHA_EXPIRACAO_DIAS,
            TENTATIVAS_MAX_LOGIN,
            BLOQUEIO_TEMPO_DIAS,
            SESSAO_EXPIRACAO_MINUTOS,
            USUARIO_CRIACAO_ID
          ) VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9)
        `;
        params = [
          configId,
          autenticacaoDuasEtapas ? 'S' : 'N',
          senhaComplexidade,
          senhaMinCaracteres,
          senhaExpiracaoDias,
          tentativasMaxLogin,
          bloqueioTempoDias,
          sessaoExpiracaoMinutos,
          req.user?.id || null
        ];
      }

      await DatabaseService.executeQuery(sql, params);

      res.json({
        success: true,
        message: 'Configurações de segurança salvas com sucesso'
      });

    } catch (error) {
      console.error('Erro ao salvar configurações de segurança:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao salvar configurações de segurança'
      });
    }
  }
}