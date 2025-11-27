import { Request, Response } from 'express';
import { DatabaseService } from '../config/database';

export interface ConfiguracaoSistema {
  id?: number;
  configuracaoId: number;
  backupAutomatico: boolean;
  frequenciaBackup: string;
  retencaoLogs: number;
  tamanhoMaxArquivo: number;
  timeoutSessao: number;
  modoManutencao: boolean;
  dataCriacao?: Date;
  dataAlteracao?: Date;
  usuarioCriacaoId?: number;
  usuarioAlteracaoId?: number;
  ativo?: boolean;
}

export class ConfiguracaoSistemaController {
  /**
   * Busca configurações de sistema por configuração ID
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
          BACKUP_AUTOMATICO as "backupAutomatico",
          FREQUENCIA_BACKUP as "frequenciaBackup",
          RETENCAO_LOGS as "retencaoLogs",
          TAMANHO_MAX_ARQUIVO as "tamanhoMaxArquivo",
          TIMEOUT_SESSAO as "timeoutSessao",
          MODO_MANUTENCAO as "modoManutencao",
          DATA_CRIACAO as "dataCriacao",
          DATA_ALTERACAO as "dataAlteracao",
          USUARIO_CRIACAO_ID as "usuarioCriacaoId",
          USUARIO_ALTERACAO_ID as "usuarioAlteracaoId",
          ATIVO
        FROM CONFIGURACOES_SISTEMA
        WHERE CONFIGURACAO_ID = :1 AND ATIVO = 'S'
      `;

      const result = await DatabaseService.executeQuery(sql, [configId]);

      if (!result.rows || result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Configurações de sistema não encontradas'
        });
        return;
      }

      const row = result.rows[0];
      const configuracao: ConfiguracaoSistema = {
        id: row.ID,
        configuracaoId: row.configuracaoId,
        backupAutomatico: row.backupAutomatico === 'S',
        frequenciaBackup: row.frequenciaBackup,
        retencaoLogs: row.retencaoLogs,
        tamanhoMaxArquivo: row.tamanhoMaxArquivo,
        timeoutSessao: row.timeoutSessao,
        modoManutencao: row.modoManutencao === 'S',
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
      console.error('Erro ao buscar configurações de sistema:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar configurações de sistema'
      });
    }
  }

  /**
   * Cria ou atualiza configurações de sistema
   */
  async salvar(req: Request, res: Response): Promise<void> {
    try {
      const { configuracaoId } = req.params;
      const {
        backupAutomatico,
        frequenciaBackup,
        retencaoLogs,
        tamanhoMaxArquivo,
        timeoutSessao,
        modoManutencao
      } = req.body;

      const configId = parseInt(configuracaoId, 10);
      if (isNaN(configId)) {
        res.status(400).json({
          success: false,
          message: 'ID de configuração inválido'
        });
        return;
      }

      // Verificar se já existe configuração de sistema para este ID
      const sqlVerificar = `
        SELECT ID FROM CONFIGURACOES_SISTEMA 
        WHERE CONFIGURACAO_ID = :1 AND ATIVO = 'S'
      `;
      
      const resultVerificar = await DatabaseService.executeQuery(sqlVerificar, [configId]);
      
      let sql: string;
      let params: any[];
      
      if (resultVerificar.rows && resultVerificar.rows.length > 0) {
        // Atualizar registro existente
        const id = resultVerificar.rows[0].ID;
        sql = `
          UPDATE CONFIGURACOES_SISTEMA SET
            BACKUP_AUTOMATICO = :1,
            FREQUENCIA_BACKUP = :2,
            RETENCAO_LOGS = :3,
            TAMANHO_MAX_ARQUIVO = :4,
            TIMEOUT_SESSAO = :5,
            MODO_MANUTENCAO = :6,
            DATA_ALTERACAO = SYSDATE,
            USUARIO_ALTERACAO_ID = :7
          WHERE ID = :8
        `;
        params = [
          backupAutomatico ? 'S' : 'N',
          frequenciaBackup,
          retencaoLogs,
          tamanhoMaxArquivo,
          timeoutSessao,
          modoManutencao ? 'S' : 'N',
          req.user?.id || null,
          id
        ];
      } else {
        // Criar novo registro
        sql = `
          INSERT INTO CONFIGURACOES_SISTEMA (
            CONFIGURACAO_ID,
            BACKUP_AUTOMATICO,
            FREQUENCIA_BACKUP,
            RETENCAO_LOGS,
            TAMANHO_MAX_ARQUIVO,
            TIMEOUT_SESSAO,
            MODO_MANUTENCAO,
            USUARIO_CRIACAO_ID
          ) VALUES (:1, :2, :3, :4, :5, :6, :7, :8)
        `;
        params = [
          configId,
          backupAutomatico ? 'S' : 'N',
          frequenciaBackup,
          retencaoLogs,
          tamanhoMaxArquivo,
          timeoutSessao,
          modoManutencao ? 'S' : 'N',
          req.user?.id || null
        ];
      }

      await DatabaseService.executeQuery(sql, params);

      res.json({
        success: true,
        message: 'Configurações de sistema salvas com sucesso'
      });

    } catch (error) {
      console.error('Erro ao salvar configurações de sistema:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao salvar configurações de sistema'
      });
    }
  }
}