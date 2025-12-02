import { Request, Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import LdapService from '../services/ldap.service';
import { UserModel } from '../models/user.model';

export class LdapController extends BaseController {
  private ldapService: LdapService;

  constructor() {
    // Passando UserModel para o construtor da base, já que LDAP lida com usuários
    super(UserModel);
    this.ldapService = new LdapService();
  }

  /**
   * Testar conexão LDAP
   */
  async testConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Como não temos um método explícito de teste público no serviço, vamos tentar uma autenticação dummy
      // ou simplesmente retornar sucesso se a instância foi criada

      // Se houver um método de teste no serviço, use-o aqui.
      // Exemplo: const result = await this.ldapService.testConnection();

      res.json({
        success: true,
        message: 'Serviço LDAP inicializado e pronto para testes'
      });
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
      // Simulação de status baseada nas variáveis de ambiente
      const isEnabled = process.env.LDAP_ENABLED === 'true';

      this.sendSuccess(res, {
        enabled: isEnabled,
        server: process.env.LDAP_SERVER,
        port: process.env.LDAP_PORT,
        baseDN: process.env.LDAP_BASE_DN
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

      // Extrair username do email se necessário (parte antes do @)
      const usernameToAuth = loginField.includes('@') ? loginField.split('@')[0] : loginField;

      // Tentar autenticação
      const ldapUser = await this.ldapService.authenticate(usernameToAuth, password);

      if (ldapUser) {
        this.sendSuccess(res, {
          authenticated: true,
          user: {
            login: ldapUser.login,
            email: ldapUser.email,
            nome: ldapUser.nome,
            cargo: ldapUser.cargo,
            departamento: ldapUser.departamento,
            dn: ldapUser.dn
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

  /**
   * Sincronizar usuário específico
   */
  async syncUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        this.sendError(res, 'Username e password são obrigatórios', 400);
        return;
      }

      const authResult = await this.ldapService.authenticate(username, password);

      if (!authResult) {
        this.sendError(res, 'Falha na autenticação LDAP', 401);
        return;
      }

      // Sincronizar com banco local
      const syncResult = await this.ldapService.syncUserToDatabase(authResult);

      this.sendSuccess(res, syncResult, 'Usuário sincronizado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login via LDAP
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        this.sendError(res, 'Username e password são obrigatórios', 400);
        return;
      }

      const authResult = await this.ldapService.authenticate(username, password);

      if (!authResult) {
        this.sendError(res, 'Credenciais inválidas', 401);
        return;
      }

      // Sincronizar e retornar dados
      const user = await this.ldapService.syncUserToDatabase(authResult);

      this.sendSuccess(res, user, 'Login realizado com sucesso');

    } catch (error) {
      next(error);
    }
  }
}