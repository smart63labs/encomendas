import { Request, Response } from 'express';
import { DatabaseService } from '../config/database';

export interface ConfiguracaoApis {
  id?: number;
  configuracaoId: number;
  googleMapsApiKey: string;
  googleMapsAtivo: boolean;
  cepApiUrl: string;
  cepApiAtivo: boolean;
  timeoutApi: number;
  openRouteServiceApiKey: string;
  dataCriacao?: Date;
  dataAlteracao?: Date;
  usuarioCriacaoId?: number;
  usuarioAlteracaoId?: number;
  ativo?: boolean;
}

export class ConfiguracaoApisController {
  /**
   * Busca configurações de APIs por configuração ID
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
          GOOGLE_MAPS_API_KEY as "googleMapsApiKey",
          GOOGLE_MAPS_ATIVO as "googleMapsAtivo",
          CEP_API_URL as "cepApiUrl",
          CEP_API_ATIVO as "cepApiAtivo",
          TIMEOUT_API as "timeoutApi",
          OPENROUTESERVICE_API_KEY as "openRouteServiceApiKey",
          DATA_CRIACAO as "dataCriacao",
          DATA_ALTERACAO as "dataAlteracao",
          USUARIO_CRIACAO_ID as "usuarioCriacaoId",
          USUARIO_ALTERACAO_ID as "usuarioAlteracaoId",
          ATIVO
        FROM CONFIGURACOES_APIS
        WHERE CONFIGURACAO_ID = :1 AND ATIVO = 'S'
      `;

      const result = await DatabaseService.executeQuery(sql, [configId]);

      if (!result.rows || result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Configurações de APIs não encontradas'
        });
        return;
      }

      const row = result.rows[0];
      const configuracao: ConfiguracaoApis = {
        id: row.ID,
        configuracaoId: row.configuracaoId,
        googleMapsApiKey: row.googleMapsApiKey || '',
        googleMapsAtivo: row.googleMapsAtivo === 'S',
        cepApiUrl: row.cepApiUrl || '',
        cepApiAtivo: row.cepApiAtivo === 'S',
        timeoutApi: row.timeoutApi,
        openRouteServiceApiKey: row.openRouteServiceApiKey || '',
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
      console.error('Erro ao buscar configurações de APIs:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar configurações de APIs'
      });
    }
  }

  /**
   * Cria ou atualiza configurações de APIs
   */
  async salvar(req: Request, res: Response): Promise<void> {
    try {
      const { configuracaoId } = req.params;
      const {
        googleMapsApiKey,
        googleMapsAtivo,
        cepApiUrl,
        cepApiAtivo,
        timeoutApi,
        openRouteServiceApiKey
      } = req.body;

      const configId = parseInt(configuracaoId, 10);
      if (isNaN(configId)) {
        res.status(400).json({
          success: false,
          message: 'ID de configuração inválido'
        });
        return;
      }

      // Verificar se já existe configuração de APIs para este ID
      const sqlVerificar = `
        SELECT ID FROM CONFIGURACOES_APIS 
        WHERE CONFIGURACAO_ID = :1 AND ATIVO = 'S'
      `;
      
      const resultVerificar = await DatabaseService.executeQuery(sqlVerificar, [configId]);
      
      let sql: string;
      let params: any[];
      
      if (resultVerificar.rows && resultVerificar.rows.length > 0) {
        // Atualizar registro existente
        const id = resultVerificar.rows[0].ID;
        sql = `
          UPDATE CONFIGURACOES_APIS SET
            GOOGLE_MAPS_API_KEY = :1,
            GOOGLE_MAPS_ATIVO = :2,
            CEP_API_URL = :3,
            CEP_API_ATIVO = :4,
            TIMEOUT_API = :5,
            OPENROUTESERVICE_API_KEY = :6,
            DATA_ALTERACAO = SYSDATE,
            USUARIO_ALTERACAO_ID = :7
          WHERE ID = :8
        `;
        params = [
          googleMapsApiKey || null,
          googleMapsAtivo ? 'S' : 'N',
          cepApiUrl || null,
          cepApiAtivo ? 'S' : 'N',
          timeoutApi,
          openRouteServiceApiKey || null,
          req.user?.id || null,
          id
        ];
      } else {
        // Criar novo registro
        sql = `
          INSERT INTO CONFIGURACOES_APIS (
            CONFIGURACAO_ID,
            GOOGLE_MAPS_API_KEY,
            GOOGLE_MAPS_ATIVO,
            CEP_API_URL,
            CEP_API_ATIVO,
            TIMEOUT_API,
            OPENROUTESERVICE_API_KEY,
            USUARIO_CRIACAO_ID
          ) VALUES (:1, :2, :3, :4, :5, :6, :7, :8)
        `;
        params = [
          configId,
          googleMapsApiKey || null,
          googleMapsAtivo ? 'S' : 'N',
          cepApiUrl || null,
          cepApiAtivo ? 'S' : 'N',
          timeoutApi,
          openRouteServiceApiKey || null,
          req.user?.id || null
        ];
      }

      await DatabaseService.executeQuery(sql, params);

      res.json({
        success: true,
        message: 'Configurações de APIs salvas com sucesso'
      });

    } catch (error) {
      console.error('Erro ao salvar configurações de APIs:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao salvar configurações de APIs'
      });
    }
  }
}