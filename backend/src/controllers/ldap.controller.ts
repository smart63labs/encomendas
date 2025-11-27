import { Request, Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import { LdapService } from '../services/ldap.service';

export class LdapController extends BaseController {
  
  /**
   * Testar conexão LDAP
   */
  async testConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ldapService = LdapService.getInstance();
      
      // Testar conexão com as configurações atuais
      const result = await ldapService.testConnection();
      
      if (result.success) {
        this.sendSuccess(res, { connected: true }, 'Conexão LDAP estabelecida com sucesso');
      } else {
        this.sendError(res, `Falha na conexão LDAP: ${result.error}`, 400);
      }
      
    } catch (error: any) {
      console.error('Erro ao testar conexão LDAP:', error);
      this.sendError(res, `Erro interno: ${error.message}`, 500);
    }
  }

  /**
   * Verificar status do LDAP
   */
  async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ldapService = LdapService.getInstance();
      
      const isEnabled = await ldapService.isLdapEnabled();
      const config = await ldapService.loadConfig();
      
      this.sendSuccess(res, {
        enabled: isEnabled,
        configured: !!config,
        config: config ? {
          servidor: config.servidor,
          porta: config.porta,
          baseDN: config.baseDN,
          nomeServidor: config.nomeServidor,
          servidorPadrao: config.servidorPadrao
        } : null
      }, 'Status LDAP obtido com sucesso');
      
    } catch (error: any) {
      console.error('Erro ao obter status LDAP:', error);
      this.sendError(res, `Erro interno: ${error.message}`, 500);
    }
  }

  /**
   * Testar autenticação de um usuário específico
   */
  async testUserAuthentication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password, email } = req.body;
      
      // Aceitar tanto username quanto email
      const loginField = username || email;
      
      if (!loginField || !password) {
        this.sendError(res, 'Username/email e password são obrigatórios', 400);
        return;
      }

      const ldapService = LdapService.getInstance();
      
      // Verificar se LDAP está habilitado
      const isEnabled = await ldapService.isLdapEnabled();
      if (!isEnabled) {
        this.sendError(res, 'LDAP não está habilitado', 400);
        return;
      }

      // Extrair username do email se necessário (parte antes do @)
      const usernameToAuth = loginField.includes('@') ? loginField.split('@')[0] : loginField;

      // Tentar autenticação
      const ldapUser = await ldapService.authenticate(usernameToAuth, password);
      
      if (ldapUser) {
        this.sendSuccess(res, {
          authenticated: true,
          user: {
            login: ldapUser.login,
            email: ldapUser.email,
            nome: ldapUser.nome,
            cargo: ldapUser.cargo
          }
        }, 'Autenticação LDAP bem-sucedida');
      } else {
        this.sendError(res, 'Falha na autenticação LDAP', 401);
      }
      
    } catch (error: any) {
      console.error('Erro ao testar autenticação LDAP:', error);
      this.sendError(res, `Erro interno: ${error.message}`, 500);
    }
  }
}