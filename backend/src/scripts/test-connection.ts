import oracledb from 'oracledb';
import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function testConnection() {
  let connection;
  
  try {
    console.log('🔍 Testando conexão com Oracle Database...');
    console.log(`📍 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`🗄️  Service: ${process.env.DB_SERVICE_NAME}`);
    console.log(`👤 Usuário: ${process.env.DB_USER}`);
    
    const connectionConfig = {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    };
    
    connection = await oracledb.getConnection(connectionConfig);
    
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Teste básico de query
    const result = await connection.execute('SELECT SYSDATE FROM DUAL');
    console.log('📅 Data do servidor:', (result.rows as any)?.[0]?.[0]);
    
    // Verifica se o usuário tem as permissões necessárias
    try {
      const userInfo = await connection.execute(`
        SELECT USERNAME, ACCOUNT_STATUS, CREATED 
        FROM USER_USERS
      `);
      
      if (userInfo.rows && userInfo.rows.length > 0) {
        console.log('👤 Informações do usuário:', userInfo.rows[0]);
      }
    } catch (userError) {
      console.log('ℹ️  Não foi possível obter informações detalhadas do usuário (normal para usuários não-DBA)');
    }
    
    console.log('🎉 Teste de conexão concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na conexão com Oracle Database:');
    console.error('Detalhes do erro:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('ORA-12541')) {
        console.error('💡 Solução: Verifique se o Oracle Database está rodando');
      } else if (error.message.includes('ORA-01017')) {
        console.error('💡 Solução: Verifique usuário e senha no arquivo .env');
      } else if (error.message.includes('ORA-12514')) {
        console.error('💡 Solução: Verifique o service name no arquivo .env');
      }
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('🔐 Conexão fechada');
      } catch (error) {
        console.error('Erro ao fechar conexão:', error);
      }
    }
  }
}

// Executa o teste
testConnection().catch(console.error);