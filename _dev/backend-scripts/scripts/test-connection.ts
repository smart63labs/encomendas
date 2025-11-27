import DatabaseService from '../config/database';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config();

async function testConnection() {
  console.log('🔍 Testando conexão com o banco Oracle 23ai...');
  console.log('📋 Configurações:');
  console.log(`   - Usuário: ${process.env.DB_USER}`);
  console.log(`   - Host: ${process.env.DB_CONNECT_STRING}`);
  console.log(`   - Service: ${process.env.DB_SERVICE_NAME}`);
  
  try {
    // Inicializa o serviço de banco
    await DatabaseService.initialize();
    
    // Testa a conexão
    await DatabaseService.testConnection();
    
    console.log('✅ Conexão com o banco estabelecida com sucesso!');
    
    // Testa uma query simples
    console.log('🔍 Testando query simples...');
    const result = await DatabaseService.executeQuery('SELECT SYSDATE FROM DUAL');
    console.log('📅 Data do servidor:', result.rows?.[0]?.[0]);
    
    console.log('✅ Teste de conexão concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na conexão com o banco:');
    console.error(error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Executa o teste
testConnection().catch(console.error);