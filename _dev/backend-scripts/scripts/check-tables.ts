import oracledb from 'oracledb';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

async function checkTables() {
  let connection: oracledb.Connection | undefined;
  
  try {
    console.log('🔍 Verificando tabelas existentes no banco protocolo_user...');
    
    // Configuração da conexão
    const config = {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    };
    
    console.log(`📋 Conectando como: ${config.user}@${config.connectString}`);
    
    // Conectar ao banco
    connection = await oracledb.getConnection(config);
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Verificar tabelas existentes
    const result = await connection.execute(
      `SELECT table_name, num_rows 
       FROM user_tables 
       ORDER BY table_name`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    console.log('\n📊 Tabelas encontradas:');
    if (result.rows && result.rows.length > 0) {
      result.rows.forEach((row: any) => {
        console.log(`   📋 ${row.TABLE_NAME} (${row.NUM_ROWS || 0} registros)`);
      });
    } else {
      console.log('   ❌ Nenhuma tabela encontrada no schema protocolo_user');
    }
    
    // Verificar sequências
    const seqResult = await connection.execute(
      `SELECT sequence_name FROM user_sequences ORDER BY sequence_name`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    console.log('\n🔢 Sequências encontradas:');
    if (seqResult.rows && seqResult.rows.length > 0) {
      seqResult.rows.forEach((row: any) => {
        console.log(`   🔢 ${row.SEQUENCE_NAME}`);
      });
    } else {
      console.log('   ❌ Nenhuma sequência encontrada');
    }
    
    console.log('\n✅ Verificação concluída!');
    
  } catch (error: any) {
    console.error('❌ Erro ao verificar tabelas:', error.message);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('🔌 Conexão fechada');
      } catch (error: any) {
        console.error('❌ Erro ao fechar conexão:', error.message);
      }
    }
  }
}

// Executar verificação
checkTables().catch(console.error);