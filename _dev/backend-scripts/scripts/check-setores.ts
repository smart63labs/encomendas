import oracledb from 'oracledb';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
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

async function checkSetoresTable(): Promise<void> {
  let connection: oracledb.Connection | undefined;
  
  try {
    console.log('Conectando ao banco de dados...');
    connection = await oracledb.getConnection(dbConfig);
    console.log('Conectado com sucesso!');
    
    // Verificar se a tabela SETORES existe
    console.log('\n=== VERIFICANDO TABELA SETORES ===');
    const tableExists = await connection.execute(
      `SELECT COUNT(*) as count FROM user_tables WHERE table_name = 'SETORES'`
    );
    
    if (tableExists.rows && tableExists.rows[0] && (tableExists.rows[0] as any[])[0] > 0) {
      console.log('✅ Tabela SETORES existe');
      
      // Verificar estrutura da tabela
      console.log('\n=== ESTRUTURA DA TABELA SETORES ===');
      const columns = await connection.execute(
        `SELECT column_name, data_type, nullable, data_default 
         FROM user_tab_columns 
         WHERE table_name = 'SETORES' 
         ORDER BY column_id`
      );
      
      if (columns.rows) {
        columns.rows.forEach((row: any) => {
          console.log(`- ${row[0]}: ${row[1]} (Nullable: ${row[2]})`);
        });
      }
      
      // Verificar chaves estrangeiras
      console.log('\n=== CHAVES ESTRANGEIRAS DA TABELA SETORES ===');
      const foreignKeys = await connection.execute(
        `SELECT 
           ucc.constraint_name,
           ucc.column_name,
           uc.r_constraint_name,
           uc.status
         FROM user_cons_columns ucc
         JOIN user_constraints uc ON ucc.constraint_name = uc.constraint_name
         WHERE uc.constraint_type = 'R'
         AND ucc.table_name = 'SETORES'
         ORDER BY ucc.constraint_name`
      );
      
      if (foreignKeys.rows && foreignKeys.rows.length > 0) {
        foreignKeys.rows.forEach((row: any) => {
          console.log(`- ${row[0]}: ${row[1]} -> ${row[2]} (Status: ${row[3]})`);
        });
      } else {
        console.log('❌ Nenhuma chave estrangeira encontrada na tabela SETORES');
      }
      
      // Verificar índices
      console.log('\n=== ÍNDICES DA TABELA SETORES ===');
      const indexes = await connection.execute(
        `SELECT index_name, column_name, column_position
         FROM user_ind_columns
         WHERE table_name = 'SETORES'
         ORDER BY index_name, column_position`
      );
      
      if (indexes.rows && indexes.rows.length > 0) {
        indexes.rows.forEach((row: any) => {
          console.log(`- ${row[0]}: ${row[1]} (Posição: ${row[2]})`);
        });
      } else {
        console.log('❌ Nenhum índice encontrado na tabela SETORES');
      }
      
      // Contar registros
      console.log('\n=== DADOS NA TABELA SETORES ===');
      const count = await connection.execute('SELECT COUNT(*) as total FROM SETORES');
      if (count.rows) {
        console.log(`Total de registros: ${(count.rows[0] as any[])[0]}`);
      }
      
      // Mostrar alguns registros de exemplo
      const sample = await connection.execute(
        'SELECT ID, CODIGO_SETOR, ORGAO, SETOR, LOTACAO FROM SETORES WHERE ROWNUM <= 5'
      );
      
      if (sample.rows && sample.rows.length > 0) {
        console.log('\nExemplos de registros:');
        sample.rows.forEach((row: any, index: number) => {
          console.log(`${index + 1}. ID: ${row[0]}, Código: ${row[1]}`);
          console.log(`   Órgão: ${row[2]}, Setor: ${row[3]}, Lotação: ${row[4]}`);
        });
      }
      
    } else {
      console.log('❌ Tabela SETORES não existe');
    }
    
    // Verificar relacionamentos com outras tabelas
    console.log('\n=== RELACIONAMENTOS COM OUTRAS TABELAS ===');
    
    // Verificar se USERS tem referência para SETORES
    const usuariosFK = await connection.execute(`SELECT ucc.constraint_name, ucc.column_name, uc.r_constraint_name
       FROM user_cons_columns ucc
       JOIN user_constraints uc ON ucc.constraint_name = uc.constraint_name
       WHERE uc.constraint_type = 'R'
       AND ucc.table_name = 'USERS'
       AND ucc.column_name LIKE '%SETOR%'`
    );
    
    if (usuariosFK.rows && usuariosFK.rows.length > 0) {
      console.log('✅ USERS tem relacionamento com SETORES:');
      usuariosFK.rows.forEach((row: any) => {
        console.log(`- ${row[0]}: ${row[1]} -> ${row[2]}`);
      });
    } else {
      console.log('❌ USERS não tem relacionamento com SETORES');
    }
    
    // Verificar se ENCOMENDAS tem referência para SETORES
    const encomendasFK = await connection.execute(
      `SELECT ucc.constraint_name, ucc.column_name, uc.r_constraint_name
       FROM user_cons_columns ucc
       JOIN user_constraints uc ON ucc.constraint_name = uc.constraint_name
       WHERE uc.constraint_type = 'R'
       AND ucc.table_name = 'ENCOMENDAS'
       AND ucc.column_name LIKE '%SETOR%'`
    );
    
    if (encomendasFK.rows && encomendasFK.rows.length > 0) {
      console.log('✅ ENCOMENDAS tem relacionamento com SETORES:');
      encomendasFK.rows.forEach((row: any) => {
        console.log(`- ${row[0]}: ${row[1]} -> ${row[2]}`);
      });
    } else {
      console.log('❌ ENCOMENDAS não tem relacionamento com SETORES');
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
  checkSetoresTable().catch(console.error);
}

export { checkSetoresTable };