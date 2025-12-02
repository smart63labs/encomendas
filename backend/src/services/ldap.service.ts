import ldap from 'ldapjs';
import { DatabaseService } from '../config/database';

interface LdapConfig {
  servidor: string;
  porta: number;
  baseDN: string;
  bindDN: string;
  bindCredentials?: string;
}

interface LdapUser {
  nome: string;
  email: string;
  dn: string;
  cargo?: string;
  departamento?: string;
}

class LdapService {
  private config: LdapConfig;

  constructor() {
    this.config = {
      servidor: process.env.LDAP_SERVER || 'localhost',
      porta: parseInt(process.env.LDAP_PORT || '389'),
      baseDN: process.env.LDAP_BASE_DN || 'dc=sefaz,dc=to,dc=gov,dc=br',
      bindDN: process.env.LDAP_BIND_DN || '',
      bindCredentials: process.env.LDAP_BIND_PASSWORD || ''
    };
  }

  /**
   * Autentica um usuário no AD/LDAP
   * @param username Nome de usuário (sAMAccountName)
   * @param password Senha
   */
  async authenticate(username: string, password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // Em ambiente de desenvolvimento sem LDAP real, simular sucesso para usuários de teste
      if (process.env.NODE_ENV === 'development' && process.env.LDAP_MOCK === 'true') {
        console.log(`[DEV] Simulando autenticação LDAP para ${username}`);

        // Simular delay de rede
        setTimeout(() => {
          if (password === '123456' || password === 'NovoProtocolo2025!') {
            resolve({
              dn: `CN=${username},OU=Users,DC=sefaz,DC=to,DC=gov,DC=br`,
              email: `${username}@sefaz.to.gov.br`,
              nome: username.toUpperCase(),
              login: username,
              departamento: 'TI',
              cargo: 'Desenvolvedor'
            });
          } else {
            resolve(null);
          }
        }, 500);
        return;
      }

      const client = ldap.createClient({
        url: `ldap://${this.config.servidor}:${this.config.porta}`,
        timeout: 10000,
        connectTimeout: 10000
      });

      // Tratamento de erros do cliente
      client.on('error', (err) => {
        console.error('Erro de conexão LDAP:', err.message);
        client.destroy();
        resolve(null);
      });

      // Timeout para evitar travamento
      const timeoutId = setTimeout(() => {
        console.error('Timeout na conexão LDAP');
        client.destroy();
        resolve(null);
      }, 15000);

      // 1. Bind com usuário de serviço (ou anônimo se não configurado)
      // Se tiver credenciais de serviço, usa elas. Se não, tenta bind direto com o usuário (menos comum mas possível)
      const bindDN = this.config.bindDN;
      const bindPass = this.config.bindCredentials;

      if (bindDN && bindPass) {
        console.log('Realizando bind inicial com usuário de serviço...');
        client.bind(bindDN, bindPass, (err) => {
          if (err) {
            console.error('Erro no bind inicial LDAP:', err.message);
            clearTimeout(timeoutId);
            client.destroy();
            resolve(null);
            return;
          }

          console.log('Bind inicial bem-sucedido, buscando usuário...');
          this.searchAndAuthUser(client, username, password, this.config, timeoutId, resolve);
        });
      } else {
        // Tentar busca direta (pode falhar dependendo da config do AD)
        console.log('Sem credenciais de serviço, tentando busca direta...');
        this.searchAndAuthUser(client, username, password, this.config, timeoutId, resolve);
      }
    });
  }

  /**
   * Busca o DN do usuário e tenta autenticar
   */
  private searchAndAuthUser(
    client: any,
    username: string,
    password: string,
    config: any,
    timeoutId: NodeJS.Timeout,
    resolve: (value: any) => void
  ): void {
    // Testar conectividade básica primeiro (opcional, mas ajuda no debug)
    this.testConnectivity(client, username, password, config, timeoutId, resolve);
  }

  /**
   * Testa conectividade básica com o LDAP
   */
  private testConnectivity(
    client: any,
    username: string,
    password: string,
    config: any,
    timeoutId: NodeJS.Timeout,
    resolve: (value: any) => void
  ): void {
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
          { dir: require('oracledb').BIND_OUT, type: require('oracledb').NUMBER }
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