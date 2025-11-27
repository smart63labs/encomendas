import oracledb from 'oracledb';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

async function dropAllTables() {
  let connection: oracledb.Connection | undefined;
  
  try {
    console.log('🗑️  Removendo todas as tabelas existentes...');
    
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
    
    // Listar todas as tabelas existentes
    const tablesResult = await connection.execute(
      `SELECT table_name FROM user_tables ORDER BY table_name`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (tablesResult.rows && tablesResult.rows.length > 0) {
      console.log('\n📋 Tabelas encontradas para remoção:');
      
      // Primeiro, remover constraints de foreign key
      console.log('\n🔗 Removendo constraints de foreign key...');
      const constraintsResult = await connection.execute(
        `SELECT constraint_name, table_name 
         FROM user_constraints 
         WHERE constraint_type = 'R' 
         ORDER BY table_name`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      
      if (constraintsResult.rows && constraintsResult.rows.length > 0) {
        for (const row of constraintsResult.rows as any[]) {
          try {
            await connection.execute(
              `ALTER TABLE ${row.TABLE_NAME} DROP CONSTRAINT ${row.CONSTRAINT_NAME}`
            );
            console.log(`   ✅ Constraint ${row.CONSTRAINT_NAME} removida de ${row.TABLE_NAME}`);
          } catch (error: any) {
            console.log(`   ⚠️  Erro ao remover constraint ${row.CONSTRAINT_NAME}: ${error.message}`);
          }
        }
      }
      
      // Depois, remover as tabelas
      console.log('\n🗑️  Removendo tabelas...');
      for (const row of tablesResult.rows as any[]) {
        try {
          await connection.execute(`DROP TABLE ${row.TABLE_NAME} CASCADE CONSTRAINTS`);
          console.log(`   ✅ Tabela ${row.TABLE_NAME} removida`);
        } catch (error: any) {
          console.log(`   ⚠️  Erro ao remover tabela ${row.TABLE_NAME}: ${error.message}`);
        }
      }
    } else {
      console.log('\n✅ Nenhuma tabela encontrada para remover');
    }
    
    // Remover sequências
    const sequencesResult = await connection.execute(
      `SELECT sequence_name FROM user_sequences ORDER BY sequence_name`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (sequencesResult.rows && sequencesResult.rows.length > 0) {
      console.log('\n🔢 Removendo sequências...');
      for (const row of sequencesResult.rows as any[]) {
        try {
          await connection.execute(`DROP SEQUENCE ${row.SEQUENCE_NAME}`);
          console.log(`   ✅ Sequência ${row.SEQUENCE_NAME} removida`);
        } catch (error: any) {
          console.log(`   ⚠️  Erro ao remover sequência ${row.SEQUENCE_NAME}: ${error.message}`);
        }
      }
    }
    
    // Commit das transações
    await connection.commit();
    console.log('\n💾 Todas as alterações foram salvas no banco');
    
    console.log('\n✅ Limpeza do banco concluída com sucesso!');
    
  } catch (error: any) {
    console.error('❌ Erro ao limpar banco:', error.message);
    if (connection) {
      try {
        await connection.rollback();
        console.log('🔄 Rollback executado');
      } catch (rollbackError: any) {
        console.error('❌ Erro no rollback:', rollbackError.message);
      }
    }
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

// Executar limpeza
dropAllTables().catch(console.error);