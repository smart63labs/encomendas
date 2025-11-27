import ldap from 'ldapjs';
import { DatabaseService } from '../config/database';

export interface LdapConfig {
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

export interface LdapUser {
  dn: string;
  email: string;
  nome: string;
  login: string;
  departamento?: string;
  cargo?: string;
}

export class LdapService {
  private static instance: LdapService;
  private config: LdapConfig | null = null;

  private constructor() {}

  public static getInstance(): LdapService {
    if (!LdapService.instance) {
      LdapService.instance = new LdapService();
    }
    return LdapService.instance;
  }

  /**
   * Carrega configurações LDAP do banco de dados
   */
  async loadConfig(): Promise<LdapConfig | null> {
    try {
      const sql = `
        SELECT ID, TIPO_AUTH, ATIVO, CONFIGURACAO
        FROM CONFIGURACOES_AUTENTICACAO
        WHERE TIPO_AUTH = 'LDAP'
      `;

      const result = await DatabaseService.executeQuery(sql);
      
      if (!result.rows || result.rows.length === 0) {
        console.log('Nenhuma configuração LDAP encontrada');
        return null;
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
          return null;
        }
      }

      // Mapear os campos do JSON para a interface LdapConfig
      const config: LdapConfig = {
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

      this.config = config;
      return this.config;
    } catch (error) {
      console.error('Erro ao carregar configurações LDAP:', error);
      return null;
    }
  }

  /**
   * Verifica se LDAP está ativo e configurado
   */
  async isLdapEnabled(): Promise<boolean> {
    if (!this.config) {
      await this.loadConfig();
    }
    
    return this.config?.ldapAtivo === true && 
           !!this.config?.servidor && 
           !!this.config?.baseDN;
  }

  /**
   * Testa conexão com o servidor LDAP
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.config) {
        await this.loadConfig();
      }

      if (!this.config) {
        return { success: false, message: 'Configurações LDAP não encontradas' };
      }

      const client = ldap.createClient({
        url: `ldap://${this.config.servidor}:${this.config.porta}`,
        timeout: 5000,
        connectTimeout: 5000,
      });

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          client.destroy();
          resolve({ success: false, message: 'Timeout na conexão LDAP' });
        }, 10000);

        client.on('connect', () => {
          clearTimeout(timeout);
          client.destroy();
          resolve({ success: true, message: 'Conexão LDAP estabelecida com sucesso' });
        });

        client.on('error', (error) => {
          clearTimeout(timeout);
          client.destroy();
          resolve({ 
            success: false, 
            message: `Erro na conexão LDAP: ${error.message}` 
          });
        });
      });
    } catch (error: any) {
      return { 
        success: false, 
        message: `Erro ao testar conexão LDAP: ${error.message}` 
      };
    }
  }

  /**
   * Autentica usuário via LDAP
   */
  async authenticate(email: string, password: string): Promise<any> {
    console.log('=== LDAP AUTHENTICATE START ===');
    console.log('Email recebido:', email);
    console.log('Password length:', password ? password.length : 0);
    
    try {
      // Verificar se LDAP está habilitado
      const isEnabled = await this.isLdapEnabled();
      console.log('LDAP habilitado:', isEnabled);
      
      if (!isEnabled) {
        console.log('LDAP não está habilitado');
        return null;
      }

      // Carregar configuração LDAP
      const config = await this.loadConfig();
      console.log('Configuração LDAP carregada:', {
        servidor: config?.servidor,
        porta: config?.porta,
        baseDN: config?.baseDN,
        campoLogin: config?.campoLogin,
        usarBind: config?.usarBind,
        rootDN: config?.rootDN ? 'PRESENTE' : 'AUSENTE'
      });
      
      if (!config) {
        console.log('Configuração LDAP não encontrada');
        return null;
      }

      // Criar cliente LDAP
      const client = ldap.createClient({
        url: `ldap://${config.servidor}:${config.porta}`,
        timeout: 30000,
        connectTimeout: 30000,
        reconnect: false,
        tlsOptions: {
          rejectUnauthorized: false
        }
      });

      console.log('Cliente LDAP criado para:', `ldap://${config.servidor}:${config.porta}`);

      return new Promise((resolve, reject) => {
        // Configurar timeout
        const timeoutId = setTimeout(() => {
          console.log('Timeout na autenticação LDAP');
          client.destroy();
          resolve(null);
        }, 15000);

        // Configurar handlers de erro
        client.on('error', (err) => {
          console.error('Erro no cliente LDAP:', err.message);
          console.error('Código do erro do cliente:', err.code);
          clearTimeout(timeoutId);
          client.destroy();
          resolve(null);
        });

        // Fazer bind administrativo se necessário
        if (config.usarBind && config.rootDN && config.senhaRootDN) {
          console.log('Fazendo bind administrativo com:', config.rootDN);
          
          client.bind(config.rootDN, config.senhaRootDN, (bindErr) => {
            if (bindErr) {
              console.error('Erro no bind administrativo:', bindErr.message);
              clearTimeout(timeoutId);
              client.destroy();
              resolve(null);
              return;
            }

            console.log('Bind administrativo realizado com sucesso');
            this.searchAndAuthenticateUser(client, email, password, config, timeoutId, resolve);
          });
        } else {
          // Tentar bind anônimo primeiro para testar conectividade
          console.log('Tentando bind anônimo para testar conectividade...');
          client.bind('', '', (bindErr) => {
            if (bindErr) {
              console.error('Falha no bind anônimo:', bindErr.message);
              console.error('Código do erro bind:', bindErr.code);
              clearTimeout(timeoutId);
              client.destroy();
              resolve(null);
              return;
            }

            console.log('Bind anônimo bem-sucedido, prosseguindo com busca...');
            this.searchAndAuthenticateUser(client, email, password, config, timeoutId, resolve);
          });
        }
      });

    } catch (error) {
      console.error('Erro geral na autenticação LDAP:', error);
      return null;
    }
  }

  /**
   * Busca e autentica usuário no LDAP
   */
  private searchAndAuthenticateUser(
    client: any,
    email: string,
    password: string,
    config: any,
    timeoutId: NodeJS.Timeout,
    resolve: (value: any) => void
  ): void {
    console.log('=== SEARCH AND AUTHENTICATE USER START ===');
    console.log('Email para busca:', email);
    
    // Extrair username do email se necessário
    let username = email;
    if (email.includes('@')) {
      username = email.split('@')[0];
      console.log('Username extraído do email:', username);
    }

    // Tentar primeiro uma busca muito simples no root
    console.log('Tentando busca simples no root para testar conectividade...');
    
    const testSearchOptions = {
      filter: '(objectClass=*)',
      scope: 'base',
      attributes: ['dn'],
      timeLimit: 5,
      sizeLimit: 1
    };

    console.log('Testando busca no BaseDN:', config.baseDN);
    
    client.search(config.baseDN, testSearchOptions, (testErr: any, testRes: any) => {
      if (testErr) {
        console.error('Erro na busca de teste:', testErr.message);
        console.error('Código do erro de teste:', testErr.code);
        
        // Se falhar, tentar busca direta no usuário
        console.log('Busca de teste falhou, tentando busca direta do usuário...');
        this.performUserSearch(client, username, password, config, timeoutId, resolve);
        return;
      }

      console.log('Busca de teste bem-sucedida, prosseguindo com busca do usuário...');
      
      testRes.on('searchEntry', (entry: any) => {
        console.log('BaseDN acessível:', entry.dn.toString());
      });

      testRes.on('end', () => {
        console.log('Teste de conectividade concluído, iniciando busca do usuário...');
        this.performUserSearch(client, username, password, config, timeoutId, resolve);
      });

      testRes.on('error', (err: any) => {
        console.error('Erro no teste de busca:', err.message);
        this.performUserSearch(client, username, password, config, timeoutId, resolve);
      });
    });
  }

  /**
   * Realiza a busca efetiva do usuário
   */
  private performUserSearch(
    client: any,
    username: string,
    password: string,
    config: any,
    timeoutId: NodeJS.Timeout,
    resolve: (value: any) => void
  ): void {
    // Construir filtro de busca - simplificado para teste
    const searchFilter = `(sAMAccountName=${username})`;
    
    console.log('Filtro de busca do usuário:', searchFilter);
    console.log('BaseDN para busca:', config.baseDN);

    const searchOptions = {
      filter: searchFilter,
      scope: 'sub',
      attributes: [
        'dn',
        'cn', 
        'mail',
        'displayName',
        'sAMAccountName',
        'userPrincipalName'
      ],
      timeLimit: 10,
      sizeLimit: 10
    };

    console.log('Opções de busca do usuário:', JSON.stringify(searchOptions, null, 2));
    console.log('Iniciando busca do usuário...');

    client.search(config.baseDN, searchOptions, (err: any, res: any) => {
      if (err) {
        console.error('Erro durante a busca do usuário:', err.message);
        console.error('Código do erro:', err.code);
        console.error('Detalhes do erro:', err);
        clearTimeout(timeoutId);
        client.destroy();
        resolve(null);
        return;
      }

      console.log('Busca do usuário iniciada com sucesso');
      let userFound = false;
      let userDN = '';

      res.on('searchEntry', (entry: any) => {
        console.log('Usuário encontrado no LDAP');
        console.log('DN do usuário:', entry.dn.toString());
        
        userFound = true;
        userDN = entry.dn.toString();
        
        // Tentar autenticar com as credenciais do usuário
        const userClient = ldap.createClient({
          url: `ldap://${config.servidor}:${config.porta}`,
          timeout: 10000,
          connectTimeout: 10000
        });

        userClient.bind(userDN, password, (bindErr: any) => {
          if (bindErr) {
            console.error('Falha na autenticação do usuário:', bindErr.message);
            clearTimeout(timeoutId);
            client.destroy();
            userClient.destroy();
            resolve(null);
            return;
          }

          console.log('Autenticação do usuário bem-sucedida');
          
          // Extrair informações do usuário
          const userInfo = {
            dn: entry.dn.toString(),
            email: entry.object.mail || username + '@sefaz.to.gov.br',
            nome: entry.object.displayName || entry.object.cn || username,
            login: entry.object.sAMAccountName || username,
            departamento: entry.object.department || '',
            cargo: entry.object.title || ''
          };

          console.log('Informações do usuário extraídas:', userInfo);
          
          clearTimeout(timeoutId);
          client.destroy();
          userClient.destroy();
          resolve(userInfo);
        });
      });

      res.on('searchReference', (referral: any) => {
        console.log('Referência LDAP:', referral.uris);
      });

      res.on('error', (err: any) => {
        console.error('Erro na busca do usuário:', err.message);
        console.error('Código do erro da busca:', err.code);
        clearTimeout(timeoutId);
        client.destroy();
        resolve(null);
      });

      res.on('end', (result: any) => {
        console.log('Busca do usuário finalizada');
        console.log('Status da busca:', result?.status);
        
        if (!userFound) {
          console.log('Usuário não encontrado no LDAP');
          clearTimeout(timeoutId);
          client.destroy();
          resolve(null);
        }
      });
    });
  }

  /**
   * Extrai valor de atributo LDAP
   */
  private getAttributeValue(attributes: any[], attributeName: string): string | undefined {
    const attribute = attributes.find(attr => attr.type.toLowerCase() === attributeName.toLowerCase());
    return attribute?.values?.[0];
  }

  /**
   * Sincroniza usuário LDAP com banco local
   */
  async syncUserToDatabase(ldapUser: LdapUser): Promise<any> {
    try {
      // Verificar se usuário já existe no banco
      const checkUserSql = `
        SELECT ID, EMAIL, NOME, ATIVO, LDAP_DN
        FROM USUARIOS
        WHERE EMAIL = :1 OR LDAP_DN = :2
      `;

      const existingUser = await DatabaseService.executeQuery(checkUserSql, [
        ldapUser.email,
        ldapUser.dn
      ]);

      if (existingUser.rows && existingUser.rows.length > 0) {
        // Atualizar usuário existente
        const userId = existingUser.rows[0].ID;
        const updateSql = `
          UPDATE USUARIOS SET
            NOME = :1,
            EMAIL = :2,
            CARGO = :3,
            DEPARTAMENTO = :4,
            LDAP_DN = :5,
            LDAP_SYNC = SYSDATE,
            DATA_ALTERACAO = SYSDATE
          WHERE ID = :6
        `;

        await DatabaseService.executeQuery(updateSql, [
          ldapUser.nome,
          ldapUser.email,
          ldapUser.cargo || null,
          ldapUser.departamento || null,
          ldapUser.dn,
          userId
        ]);

        return {
          id: userId,
          email: ldapUser.email,
          nome: ldapUser.nome,
          cargo: ldapUser.cargo,
          departamento: ldapUser.departamento,
          ativo: true,
          isLdapUser: true
        };
      } else {
        // Criar novo usuário
        const insertSql = `
          INSERT INTO USUARIOS (
            NOME, E_MAIL, CARGO, ROLE, USUARIO_ATIVO, DATA_CRIACAO, DATA_ATUALIZACAO
          ) VALUES (
            :1, :2, :3, :4, 1, SYSDATE, SYSDATE
          ) RETURNING ID INTO :5
        `;

        const result = await DatabaseService.executeQuery(insertSql, [
          ldapUser.nome,
          ldapUser.email,
          ldapUser.cargo || 'USER',
          ldapUser.cargo || 'USER',
          { dir: DatabaseService.oracledb.BIND_OUT, type: DatabaseService.oracledb.NUMBER }
        ]);

        const newUserId = result.outBinds?.[0];

        return {
          id: newUserId,
          email: ldapUser.email,
          nome: ldapUser.nome,
          cargo: ldapUser.cargo,
          departamento: ldapUser.departamento,
          ativo: true,
          isLdapUser: true
        };
      }
    } catch (error) {
      console.error('Erro ao sincronizar usuário LDAP:', error);
      throw error;
    }
  }
}

export default LdapService;