import oracledb from 'oracledb';
import dotenv from 'dotenv';

dotenv.config();

interface DatabaseConfig {
  user: string;
  password: string;
  connectString: string;
}

const dbConfig: DatabaseConfig = {
  user: process.env.DB_USER || 'protocolo_user',
  password: process.env.DB_PASSWORD || 'Protocolo@2025',
  connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/XEPDB1'
};

async function checkColumns(): Promise<void> {
  let connection: oracledb.Connection | undefined;
  
  try {
    console.log('Conectando ao banco de dados...');
    connection = await oracledb.getConnection(dbConfig);
    console.log('Conectado com sucesso!');
    
    // Verificar colunas da tabela USERS
    console.log('\n=== COLUNAS DA TABELA USERS ===');
    const usuariosCols = await connection.execute(
      'SELECT column_name, data_type FROM user_tab_columns WHERE table_name = \'USERS\' ORDER BY column_name'
    );
    
    if (usuariosCols.rows && usuariosCols.rows.length > 0) {
      usuariosCols.rows.forEach((row: any) => {
        console.log(`- ${row[0]}: ${row[1]}`);
      });
    } else {
      console.log('❌ Tabela USERS não encontrada');
    }
    
    // Verificar colunas da tabela ENCOMENDAS
    console.log('\n=== COLUNAS DA TABELA ENCOMENDAS ===');
    const encomendasCols = await connection.execute(
      'SELECT column_name, data_type FROM user_tab_columns WHERE table_name = \'ENCOMENDAS\' ORDER BY column_name'
    );
    
    if (encomendasCols.rows && encomendasCols.rows.length > 0) {
      encomendasCols.rows.forEach((row: any) => {
        console.log(`- ${row[0]}: ${row[1]}`);
      });
    } else {
      console.log('❌ Tabela ENCOMENDAS não encontrada');
    }
    
  } catch (error: any) {
    console.error('Erro durante a verificação:', error.message);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('\nConexão fechada.');
      } catch (error: any) {
        console.error('Erro ao fechar conexão:', error.message);
      }
    }
  }
}

// Executar verificação se este arquivo for executado diretamente
if (require.main === module) {
  checkColumns().catch(console.error);
}

export { checkColumns };