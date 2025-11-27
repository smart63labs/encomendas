import oracledb from 'oracledb';
import dotenv from 'dotenv';
import { DatabaseService } from '../config/database';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Script para verificar a estrutura atual da tabela USUARIOS
 */
async function checkUsuariosStructure() {
  let connection: oracledb.Connection | null = null;
  
  try {
    console.log('🔍 Verificando estrutura da tabela USUARIOS...');
    
    // Inicializar conexão com o banco
    await DatabaseService.initialize();
    connection = await DatabaseService.getConnection();
    
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // 1. Verificar se a tabela USUARIOS existe
    console.log('\n📋 Verificando se a tabela USUARIOS existe...');
    
    const checkTableQuery = `
      SELECT COUNT(*) as table_exists
      FROM USER_TABLES
      WHERE TABLE_NAME = 'USUARIOS'
    `;
    
    const tableResult = await connection.execute(checkTableQuery);
    const tableExists = (tableResult.rows as any)?.[0]?.TABLE_EXISTS > 0;
    
    if (!tableExists) {
      console.log('❌ Tabela USUARIOS não existe!');
      return;
    }
    
    console.log('✅ Tabela USUARIOS existe.');
    
    // 2. Verificar estrutura da tabela USUARIOS
    console.log('\n📊 Estrutura atual da tabela USUARIOS:');
    
    const structureQuery = `
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        DATA_LENGTH,
        NULLABLE,
        DATA_DEFAULT,
        COLUMN_ID
      FROM USER_TAB_COLUMNS
      WHERE TABLE_NAME = 'USUARIOS'
      ORDER BY COLUMN_ID
    `;
    
    const structureResult = await connection.execute(structureQuery);
    console.table(structureResult.rows);
    
    // 3. Verificar constraints da tabela
    console.log('\n🔗 Constraints da tabela USUARIOS:');
    
    const constraintsQuery = `
      SELECT 
        CONSTRAINT_NAME,
        CONSTRAINT_TYPE,
        SEARCH_CONDITION,
        R_CONSTRAINT_NAME,
        STATUS
      FROM USER_CONSTRAINTS
      WHERE TABLE_NAME = 'USUARIOS'
      ORDER BY CONSTRAINT_TYPE, CONSTRAINT_NAME
    `;
    
    const constraintsResult = await connection.execute(constraintsQuery);
    console.table(constraintsResult.rows);
    
    // 4. Verificar índices da tabela
    console.log('\n🔍 Índices da tabela USUARIOS:');
    
    const indexesQuery = `
      SELECT 
        INDEX_NAME,
        COLUMN_NAME,
        COLUMN_POSITION,
        DESCEND
      FROM USER_IND_COLUMNS
      WHERE TABLE_NAME = 'USUARIOS'
      ORDER BY INDEX_NAME, COLUMN_POSITION
    `;
    
    const indexesResult = await connection.execute(indexesQuery);
    console.table(indexesResult.rows);
    
    // 5. Verificar dados de exemplo
    console.log('\n📄 Primeiros 5 registros da tabela USUARIOS:');
    
    const dataQuery = `
      SELECT *
      FROM USUARIOS
      WHERE ROWNUM <= 5
    `;
    
    const dataResult = await connection.execute(dataQuery);
    console.table(dataResult.rows);
    
    // 6. Verificar se existe tabela SETORES
    console.log('\n🏢 Verificando se a tabela SETORES existe...');
    
    const checkSetoresQuery = `
      SELECT COUNT(*) as table_exists
      FROM USER_TABLES
      WHERE TABLE_NAME = 'SETORES'
    `;
    
    const setoresResult = await connection.execute(checkSetoresQuery);
    const setoresExists = (setoresResult.rows as any)?.[0]?.TABLE_EXISTS > 0;
    
    if (setoresExists) {
      console.log('✅ Tabela SETORES existe.');
      
      // Verificar estrutura da tabela SETORES
      console.log('\n📊 Estrutura da tabela SETORES:');
      
      const setoresStructureQuery = `
        SELECT 
          COLUMN_NAME,
          DATA_TYPE,
          DATA_LENGTH,
          NULLABLE,
          COLUMN_ID
        FROM USER_TAB_COLUMNS
        WHERE TABLE_NAME = 'SETORES'
        ORDER BY COLUMN_ID
      `;
      
      const setoresStructureResult = await connection.execute(setoresStructureQuery);
      console.table(setoresStructureResult.rows);
      
      // Verificar dados de exemplo da tabela SETORES
      console.log('\n📄 Primeiros 5 registros da tabela SETORES:');
      
      const setoresDataQuery = `
        SELECT *
        FROM SETORES
        WHERE ROWNUM <= 5
      `;
      
      const setoresDataResult = await connection.execute(setoresDataQuery);
      console.table(setoresDataResult.rows);
    } else {
      console.log('❌ Tabela SETORES não existe!');
    }
    
    console.log('\n✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('🔌 Conexão fechada.');
      } catch (closeError) {
        console.error('❌ Erro ao fechar conexão:', closeError);
      }
    }
    
    try {
      await DatabaseService.close();
    } catch (closeError) {
      console.error('❌ Erro ao fechar pool de conexões:', closeError);
    }
  }
}

// Executar o script
if (require.main === module) {
  checkUsuariosStructure()
    .then(() => {
      console.log('\n✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro na execução do script:', error);
      process.exit(1);
    });
}

export { checkUsuariosStructure };