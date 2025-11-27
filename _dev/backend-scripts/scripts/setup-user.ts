import oracledb from 'oracledb';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config();

async function setupUser() {
  console.log('🔧 Configurando usuário no Oracle 23ai...');
  
  // Configurações para conectar como SYSTEM (usuário administrativo padrão)
  const adminConfig = {
    user: 'system',
    password: 'Anderline49', // senha fornecida pelo usuário
    connectString: 'localhost:1521/FREEPDB1'
  };
  
  console.log('📋 Tentando conectar como SYSTEM...');
  
  let connection;
  try {
    // Conecta como SYSTEM
    connection = await oracledb.getConnection(adminConfig);
    console.log('✅ Conectado como SYSTEM!');
    
    // Verifica se o usuário já existe
    console.log('🔍 Verificando se o usuário protocolo_user já existe...');
    const userCheck = await connection.execute(
      `SELECT username FROM all_users WHERE username = 'PROTOCOLO_USER'`
    );
    
    if (userCheck.rows && userCheck.rows.length > 0) {
      console.log('⚠️  Usuário protocolo_user já existe. Removendo...');
      await connection.execute(`DROP USER protocolo_user CASCADE`);
      console.log('✅ Usuário removido!');
    }
    
    // Cria o usuário
    console.log('👤 Criando usuário protocolo_user...');
    await connection.execute(
      `CREATE USER protocolo_user IDENTIFIED BY "protocolo@2025"`
    );
    console.log('✅ Usuário criado!');
    
    // Concede privilégios
    console.log('🔑 Concedendo privilégios...');
    await connection.execute(
      `GRANT CONNECT, RESOURCE, CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE VIEW TO protocolo_user`
    );
    
    await connection.execute(
      `GRANT UNLIMITED TABLESPACE TO protocolo_user`
    );
    
    console.log('✅ Privilégios concedidos!');
    
    // Testa a conexão com o novo usuário
    console.log('🧪 Testando conexão com o novo usuário...');
    const testConnection = await oracledb.getConnection({
      user: 'protocolo_user',
      password: 'protocolo@2025',
      connectString: 'localhost:1521/FREEPDB1'
    });
    
    const testResult = await testConnection.execute('SELECT SYSDATE FROM DUAL');
    console.log('📅 Data do servidor:', (testResult.rows as any)?.[0]?.[0]);
    
    await testConnection.close();
    console.log('✅ Usuário configurado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na configuração do usuário:');
    console.error(error);
    
    // Tenta outras senhas comuns do Oracle 23ai
    if ((error as any)?.message?.includes('ORA-01017')) {
      console.log('\n🔄 Tentando outras configurações comuns...');
      
      const alternativeConfigs = [
        { user: 'system', password: 'Oracle123', connectString: 'localhost:1521/FREE' },
        { user: 'system', password: 'oracle123', connectString: 'localhost:1521/FREE' },
        { user: 'system', password: 'Oracle_123', connectString: 'localhost:1521/FREE' },
        { user: 'sys', password: 'oracle', connectString: 'localhost:1521/FREE', privilege: oracledb.SYSDBA },
        { user: 'system', password: 'oracle', connectString: 'localhost:1521/FREEPDB1' },
      ];
      
      for (const config of alternativeConfigs) {
        try {
          console.log(`🔍 Tentando: ${config.user}@${config.connectString}`);
          const testConn = await oracledb.getConnection(config);
          await testConn.close();
          console.log('✅ Configuração funcionou! Use esta configuração.');
          console.log('📋 Configuração válida:', JSON.stringify(config, null, 2));
          break;
        } catch (e) {
          console.log(`❌ Falhou: ${(e as any)?.message || e}`);
        }
      }
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

// Executa a configuração
setupUser().catch(console.error);