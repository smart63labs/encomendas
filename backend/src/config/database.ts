import oracledb from 'oracledb';
import { config } from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
config();

/**
 * Interface para configuração do banco Oracle
 */
interface DatabaseConfig {
  user: string;
  password: string;
  connectString: string;
  poolMin: number;
  poolMax: number;
  poolIncrement: number;
  poolTimeout: number;
  queueTimeout: number;
  edition?: string;
  events?: boolean;
  externalAuth?: boolean;
  homogeneous?: boolean;
}

/**
 * Configuração do banco de dados Oracle
 * Baseada na configuração do .env: protocolo_user/NovoProtocolo2025!@localhost:1521/xe
 */
const dbConfig: DatabaseConfig = {
  user: process.env.DB_USER || 'protocolo_user',
  password: process.env.DB_PASSWORD || 'Protocolo@2025',
  connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/XEPDB1',
  poolMin: parseInt(process.env.DB_POOL_MIN || '2'),
  poolMax: parseInt(process.env.DB_POOL_MAX || '10'),
  poolIncrement: parseInt(process.env.DB_POOL_INCREMENT || '1'),
  poolTimeout: parseInt(process.env.DB_POOL_TIMEOUT || '60'),
  queueTimeout: parseInt(process.env.DB_QUEUE_TIMEOUT || '60000'),
  ...(process.env.DB_EDITION && { edition: process.env.DB_EDITION }),
  events: process.env.DB_EVENTS === 'true',
  externalAuth: process.env.DB_EXTERNAL_AUTH === 'true',
  homogeneous: process.env.DB_HOMOGENEOUS !== 'false'
};

// Compatibilidade com variáveis antigas (para evitar erros)
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '1521';
process.env.DB_SERVICE_NAME = process.env.DB_SERVICE_NAME || 'xe';

/**
 * Classe para gerenciamento da conexão Oracle
 */
export class DatabaseService {
  private static pool: oracledb.Pool;
  private static isInitialized = false;

  /**
   * Inicializar o pool de conexões Oracle
   */
  static async initialize(): Promise<void> {
    // Verificar se o pool já foi inicializado
    if (this.isInitialized && this.pool) {
      console.log('ℹ️  Pool de conexões Oracle já inicializado');
      return;
    }

    // Verificar se já existe um pool com o alias 'default'
    try {
      const existingPool = oracledb.getPool('default');
      if (existingPool) {
        console.log('ℹ️  Reutilizando pool de conexões Oracle existente');
        this.pool = existingPool;
        this.isInitialized = true;
        return;
      }
    } catch (error) {
      // Pool não existe, continuar com a criação
    }

    try {
      // Configurar Oracle Instant Client se necessário
      const oracleClientPath = process.env.ORACLE_CLIENT_LIB_DIR;
      if (oracleClientPath) {
        try {
          oracledb.initOracleClient({ libDir: oracleClientPath });
        } catch (clientError) {
          // Ignorar erro se o cliente já foi inicializado
          if (!(clientError as Error).message.includes('already been initialized')) {
            throw clientError;
          }
        }
      }

      // Configurações globais do OracleDB (apenas se ainda não configuradas)
      if (oracledb.outFormat !== oracledb.OUT_FORMAT_OBJECT) {
        oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
        oracledb.autoCommit = false; // Controle manual de transações
        oracledb.fetchArraySize = parseInt(process.env.ORACLE_PREFETCH_ROWS || '100');
        oracledb.maxRows = parseInt(process.env.ORACLE_MAX_ROWS || '1000');
      }
      // Garantir que CLOB seja retornado como string (evitar objetos Lob/streams)
      oracledb.fetchAsString = [oracledb.CLOB];

      // Criar pool de conexões
      this.pool = await oracledb.createPool({
        ...dbConfig,
        poolAlias: 'default',
        enableStatistics: true
      });

      this.isInitialized = true;
      
      console.log('✅ Pool de conexões Oracle criado com sucesso');
      console.log(`📊 Pool configurado: Min=${dbConfig.poolMin}, Max=${dbConfig.poolMax}`);
      
      // Testar conexão inicial
      await this.testConnection();

      // Configurar timezone se especificado (erro de timezone não deve impedir a inicialização)
      const timezone = process.env.ORACLE_SESSION_TIMEZONE;
      if (timezone) {
        try {
          await this.setSessionTimezone(timezone);
        } catch (tzError) {
          const msg = (tzError as Error).message || String(tzError);
          // Ignorar erro de timezone (ORA-01804) mas avisar o desenvolvedor
          if (msg.includes('ORA-01804') || msg.includes('ORA-00604') || msg.toLowerCase().includes('timezone')) {
            console.warn('⚠️  Não foi possível configurar o timezone da sessão (ignorando):', msg);
            console.warn('    -> Verifique se o Oracle Instant Client está instalado e se as variáveis de ambiente (ORACLE_CLIENT_LIB_DIR, ORACLE_HOME, ORA_SDTZ) estão corretas.');
            console.warn('    -> Consulte docs/guia-implementacao-oracle.md para instruções de instalação.');
          } else {
            throw tzError;
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao criar pool de conexões Oracle:', error);
      this.isInitialized = false;
      
      // Se o erro for de pool já existente, tentar reutilizar
      if ((error as Error).message && (error as Error).message.includes('pool alias "default" already exists')) {
        try {
          console.log('🔄 Tentando reutilizar pool existente...');
          this.pool = oracledb.getPool('default');
          this.isInitialized = true;
          console.log('✅ Pool existente reutilizado com sucesso');
          return;
        } catch (reuseError) {
          console.error('❌ Erro ao reutilizar pool existente:', reuseError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Testar conexão com o banco
   */
  static async testConnection(): Promise<void> {
    const connection = await this.getConnection();
    try {
      const result = await connection.execute(
        'SELECT SYSDATE as current_date, USER as current_user, SYS_CONTEXT(\'USERENV\', \'DB_NAME\') as db_name FROM DUAL'
      );
      
      const row = result.rows?.[0] as any;
      console.log('✅ Teste de conexão Oracle bem-sucedido:');
      console.log(`   📅 Data: ${row?.CURRENT_DATE}`);
      console.log(`   👤 Usuário: ${row?.CURRENT_USER}`);
      console.log(`   🗄️  Database: ${row?.DB_NAME}`);
      
    } finally {
      await connection.close();
    }
  }

  /**
   * Configurar timezone da sessão
   */
  static async setSessionTimezone(timezone: string): Promise<void> {
    const connection = await this.getConnection();
    try {
      await connection.execute(`ALTER SESSION SET TIME_ZONE = '${timezone}'`);
      console.log(`🌍 Timezone configurado para: ${timezone}`);
    } finally {
      await connection.close();
    }
  }

  /**
   * Obter conexão do pool
   */
  static async getConnection(): Promise<oracledb.Connection> {
    if (!this.isInitialized || !this.pool) {
      throw new Error('Pool de conexões não inicializado. Execute DatabaseService.initialize() primeiro.');
    }
    
    try {
      return await this.pool.getConnection();
    } catch (error) {
      console.error('❌ Erro ao obter conexão do pool:', error);
      throw error;
    }
  }

  /**
   * Executar query com tratamento de erro e log
   */
  static async executeQuery(
    sql: string, 
    binds: any = {}, 
    options: oracledb.ExecuteOptions = {}
  ): Promise<oracledb.Result<any>> {
    const connection = await this.getConnection();
    const startTime = Date.now();
    
    try {
      const result = await connection.execute(sql, binds, {
        autoCommit: options.autoCommit ?? true,
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        ...options
      });
      
      const duration = Date.now() - startTime;
      
      // Log da query (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 Query executada em ${duration}ms:`, {
          sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
          binds: Object.keys(binds).length > 0 ? binds : undefined,
          rowsAffected: result.rowsAffected
        });
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Erro na execução da query:', {
        sql: sql.substring(0, 200),
        binds,
        error: error instanceof Error ? error.message : error
      });
      throw error;
    } finally {
      await connection.close();
    }
  }

  /**
   * Executar múltiplas queries em uma transação
   */
  static async executeTransaction(
    queries: Array<{ sql: string; binds?: any; options?: oracledb.ExecuteOptions }>
  ): Promise<oracledb.Result<any>[]> {
    const connection = await this.getConnection();
    const results: oracledb.Result<any>[] = [];
    
    try {
      // Iniciar transação
      for (const query of queries) {
        const result = await connection.execute(
          query.sql, 
          query.binds || {}, 
          {
            autoCommit: false,
            outFormat: oracledb.OUT_FORMAT_OBJECT,
            ...query.options
          }
        );
        results.push(result);
      }
      
      // Commit da transação
      await connection.commit();
      console.log(`✅ Transação executada com sucesso (${queries.length} queries)`);
      
      return results;
      
    } catch (error) {
      // Rollback em caso de erro
      await connection.rollback();
      console.error('❌ Erro na transação, rollback executado:', error);
      throw error;
    } finally {
      await connection.close();
    }
  }

  /**
   * Executar query com paginação
   */
  static async executeWithPagination(
    sql: string,
    binds: any = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: any[]; total: number; page: number; limit: number; pages: number }> {
    const offset = (page - 1) * limit;
    
    // Query para contar total de registros
    const countSql = `SELECT COUNT(*) as total FROM (${sql})`;
    const countResult = await this.executeQuery(countSql, binds);
    const total = (countResult.rows?.[0] as any)?.TOTAL || 0;
    
    // Query com paginação
    const paginatedSql = `
      SELECT * FROM (
        SELECT a.*, ROWNUM rnum FROM (
          ${sql}
        ) a WHERE ROWNUM <= :maxRow
      ) WHERE rnum > :minRow
    `;
    
    const paginatedBinds = {
      ...binds,
      minRow: offset,
      maxRow: offset + limit
    };
    
    const dataResult = await this.executeQuery(paginatedSql, paginatedBinds);
    
    return {
      data: dataResult.rows || [],
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Obter estatísticas do pool
   */
  static getPoolStatistics(): any | null {
    if (!this.pool) return null;
    return this.pool.getStatistics();
  }

  /**
   * Verificar status da conexão
   */
  static getStatus(): { initialized: boolean; poolOpen: boolean } {
    return {
      initialized: this.isInitialized,
      poolOpen: this.pool?.status === oracledb.POOL_STATUS_OPEN
    };
  }

  /**
   * Fechar pool de conexões
   */
  static async close(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.close(10); // 10 segundos de timeout
        console.log('✅ Pool de conexões Oracle fechado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao fechar pool de conexões:', error);
      } finally {
        this.pool = null as any;
        this.isInitialized = false;
      }
    }
  }

  /**
   * Reconectar em caso de falha
   */
  static async reconnect(): Promise<void> {
    console.log('🔄 Tentando reconectar ao Oracle...');
    await this.close();
    await this.initialize();
  }

  /**
   * Garantir que o pool está inicializado (método seguro)
   */
  static async ensureInitialized(): Promise<void> {
    if (!this.isInitialized || !this.pool) {
      await this.initialize();
    }
  }

  /**
   * Verificar se o pool está ativo e funcionando
   */
  static isPoolActive(): boolean {
    try {
      return this.isInitialized && 
             this.pool && 
             this.pool.status === oracledb.POOL_STATUS_OPEN;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Configuração de tipos Oracle para TypeScript
 */
export const OracleTypes = {
  STRING: oracledb.STRING,
  NUMBER: oracledb.NUMBER,
  DATE: oracledb.DATE,
  CURSOR: oracledb.CURSOR,
  BUFFER: oracledb.BUFFER,
  CLOB: oracledb.CLOB,
  BLOB: oracledb.BLOB,
  BIND_IN: oracledb.BIND_IN,
  BIND_OUT: oracledb.BIND_OUT,
  BIND_INOUT: oracledb.BIND_INOUT
};

/**
 * Utilitários para formatação de dados Oracle
 */
export class OracleUtils {
  /**
   * Formatar data para Oracle
   */
  static formatDate(date: Date): string {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }

  /**
   * Converter resultado Oracle para camelCase
   */
  static toCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.toCamelCase(item));
    }
    
    // Preservar tipos especiais (Date, null, undefined, primitivos)
    if (obj === null || obj === undefined || obj instanceof Date || typeof obj !== 'object') {
      return obj;
    }
    
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      converted[camelKey] = this.toCamelCase(value);
    }
    return converted;
  }

  /**
   * Converter camelCase para snake_case (Oracle)
   */
  static toSnakeCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.toSnakeCase(item));
    }
    
    if (obj && typeof obj === 'object') {
      const converted: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        converted[snakeKey] = this.toSnakeCase(value);
      }
      return converted;
    }
    
    return obj;
  }
}

export default DatabaseService;
export { dbConfig as config };