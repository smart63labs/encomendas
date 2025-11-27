import { Request, Response } from 'express';
import { DatabaseService } from '../config/database';

export interface LdapConfigRequest {
  ldapAtivo: boolean;
  servidor: string;
  porta: number;
  baseDN: string;
  filtroConexao: string;
  usarBind: boolean;
  rootDN: string;
  senhaRootDN: string;
  campoLogin: string;
  nomeServidor: string;
  servidorPadrao: boolean;
}

export class LdapConfigController {
  /**
   * Salva configurações LDAP na tabela CONFIGURACOES_AUTENTICACAO
   */
  async salvar(req: Request, res: Response): Promise<void> {
    try {
      const dados: LdapConfigRequest = req.body;
      const usuarioId = (req as any).user?.id || 1;

      // Validar dados obrigatórios
      if (!dados.servidor || !dados.baseDN || !dados.campoLogin) {
        res.status(400).json({
          success: false,
          message: 'Servidor, BaseDN e Campo de Login são obrigatórios'
        });
        return;
      }

      // Montar objeto de configuração JSON
      const configuracaoJson = {
        enabled: dados.ldapAtivo,
        server: dados.servidor,
        port: dados.porta,
        baseDN: dados.baseDN,
        userFilter: dados.filtroConexao,
        useBind: dados.usarBind,
        userDN: dados.rootDN,
        password: dados.senhaRootDN,
        loginField: dados.campoLogin,
        serverName: dados.nomeServidor,
        defaultServer: dados.servidorPadrao
      };

      // Verificar se já existe configuração LDAP
      const sqlVerificar = `
        SELECT ID FROM CONFIGURACOES_AUTENTICACAO 
        WHERE TIPO_AUTH = 'LDAP'
      `;
      
      const resultVerificar = await DatabaseService.executeQuery(sqlVerificar);
      
      let sql: string;
      let params: any[];
      
      if (resultVerificar.rows && resultVerificar.rows.length > 0) {
        // Atualizar registro existente
        const id = resultVerificar.rows[0].ID;
        sql = `
          UPDATE CONFIGURACOES_AUTENTICACAO SET
            ATIVO = :1,
            CONFIGURACAO = :2,
            DATA_ATUALIZACAO = SYSDATE,
            USUARIO_ATUALIZACAO = :3
          WHERE ID = :4
        `;
        params = [
          dados.ldapAtivo ? 1 : 0,
          JSON.stringify(configuracaoJson),
          usuarioId,
          id
        ];
      } else {
        // Criar novo registro
        sql = `
          INSERT INTO CONFIGURACOES_AUTENTICACAO (
            TIPO_AUTH,
            ATIVO,
            CONFIGURACAO,
            DATA_CRIACAO,
            USUARIO_CRIACAO
          ) VALUES (:1, :2, :3, SYSDATE, :4)
        `;
        params = [
          'LDAP',
          dados.ldapAtivo ? 1 : 0,
          JSON.stringify(configuracaoJson),
          usuarioId
        ];
      }

      await DatabaseService.executeQuery(sql, params);

      res.json({
        success: true,
        message: 'Configurações LDAP salvas com sucesso'
      });

    } catch (error) {
      console.error('Erro ao salvar configurações LDAP:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao salvar configurações LDAP'
      });
    }
  }

  /**
   * Busca configurações LDAP da tabela CONFIGURACOES_AUTENTICACAO
   */
  async buscar(req: Request, res: Response): Promise<void> {
    try {
      const sql = `
        SELECT ID, TIPO_AUTH, ATIVO, CONFIGURACAO
        FROM CONFIGURACOES_AUTENTICACAO
        WHERE TIPO_AUTH = 'LDAP'
      `;

      const result = await DatabaseService.executeQuery(sql);
      
      if (!result.rows || result.rows.length === 0) {
        res.json({
          success: true,
          data: null,
          message: 'Nenhuma configuração LDAP encontrada'
        });
        return;
      }

      const row = result.rows[0];
      const configuracaoJson = row.CONFIGURACAO;
      const ativo = row.ATIVO === 1;

      // Parse do JSON de configuração
      let configData: any = {};
      if (configuracaoJson) {
        try {
          configData = JSON.parse(configuracaoJson);
        } catch (parseError) {
          console.error('Erro ao fazer parse da configuração LDAP JSON:', parseError);
          res.status(500).json({
            success: false,
            message: 'Erro ao processar configuração LDAP'
          });
          return;
        }
      }

      // Mapear os campos do JSON para o formato esperado pelo frontend
      const config = {
        ldapAtivo: ativo, // Usar apenas a flag ATIVO da tabela para sistema híbrido
        servidor: configData.server || '',
        porta: parseInt(configData.port) || 389,
        baseDN: configData.baseDN || '',
        filtroConexao: configData.userFilter || '(uid={username})',
        usarBind: configData.useBind === true,
        rootDN: configData.userDN || '',
        senhaRootDN: configData.password || '',
        campoLogin: configData.loginField || 'uid',
        nomeServidor: configData.serverName || '',
        servidorPadrao: configData.defaultServer === true,
      };

      res.json({
        success: true,
        data: config
      });

    } catch (error) {
      console.error('Erro ao buscar configurações LDAP:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar configurações LDAP'
      });
    }
  }
}

export default new LdapConfigController();