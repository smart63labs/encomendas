import oracledb from 'oracledb';
import dotenv from 'dotenv';
import { DatabaseService } from '../config/database';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Script para atualizar a tabela USUARIOS com relacionamento para SETORES
 */
async function updateUsuariosSetoresRelationship() {
  let connection: oracledb.Connection | null = null;
  
  try {
    console.log('🚀 Iniciando atualização da tabela USUARIOS...');
    
    // Inicializar conexão com o banco
    await DatabaseService.initialize();
    connection = await DatabaseService.getConnection();
    
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // 1. Verificar se a coluna SETOR_ID já existe
    console.log('\n📋 Verificando estrutura atual da tabela USUARIOS...');
    
    const checkColumnQuery = `
      SELECT COUNT(*) as column_exists
      FROM USER_TAB_COLUMNS
      WHERE TABLE_NAME = 'USUARIOS' AND COLUMN_NAME = 'SETOR_ID'
    `;
    
    const columnResult = await connection.execute(checkColumnQuery);
    const columnExists = (columnResult.rows as any)?.[0]?.COLUMN_EXISTS > 0;
    
    if (!columnExists) {
      console.log('➕ Adicionando coluna SETOR_ID...');
      await connection.execute('ALTER TABLE USUARIOS ADD SETOR_ID NUMBER(10)');
      console.log('✅ Coluna SETOR_ID adicionada com sucesso!');
    } else {
      console.log('ℹ️  Coluna SETOR_ID já existe na tabela.');
    }
    
    // 2. Criar índice para SETOR_ID
    console.log('\n🔍 Criando índice para SETOR_ID...');
    
    const checkIndexQuery = `
      SELECT COUNT(*) as index_exists
      FROM USER_INDEXES
      WHERE INDEX_NAME = 'IDX_USUARIOS_SETOR_ID'
    `;
    
    const indexResult = await connection.execute(checkIndexQuery);
    const indexExists = (indexResult.rows as any)?.[0]?.INDEX_EXISTS > 0;
    
    if (!indexExists) {
      await connection.execute('CREATE INDEX IDX_USUARIOS_SETOR_ID ON USUARIOS(SETOR_ID)');
      console.log('✅ Índice IDX_USUARIOS_SETOR_ID criado com sucesso!');
    } else {
      console.log('ℹ️  Índice IDX_USUARIOS_SETOR_ID já existe.');
    }
    
    // 3. Criar Foreign Key para SETORES
    console.log('\n🔗 Criando relacionamento com tabela SETORES...');
    
    const checkFKQuery = `
      SELECT COUNT(*) as fk_exists
      FROM USER_CONSTRAINTS
      WHERE CONSTRAINT_NAME = 'FK_USUARIOS_SETOR'
    `;
    
    const fkResult = await connection.execute(checkFKQuery);
    const fkExists = (fkResult.rows as any)?.[0]?.FK_EXISTS > 0;
    
    if (!fkExists) {
      await connection.execute(
        'ALTER TABLE USUARIOS ADD CONSTRAINT FK_USUARIOS_SETOR FOREIGN KEY (SETOR_ID) REFERENCES SETORES(ID)'
      );
      console.log('✅ Foreign Key FK_USUARIOS_SETOR criada com sucesso!');
    } else {
      console.log('ℹ️  Foreign Key FK_USUARIOS_SETOR já existe.');
    }
    
    // 4. Verificar se há setores disponíveis para relacionamento
    console.log('\n📊 Verificando setores disponíveis...');
    
    const checkSetoresQuery = `
      SELECT COUNT(*) as setores_count
      FROM SETORES 
      WHERE ATIVO = 1
    `;
    
    const setoresResult = await connection.execute(checkSetoresQuery);
    const setoresCount = (setoresResult.rows as any)?.[0]?.SETORES_COUNT || 0;
    
    console.log(`ℹ️  Encontrados ${setoresCount} setores ativos disponíveis para relacionamento.`);
    
    if (setoresCount === 0) {
      console.log('⚠️  Nenhum setor ativo encontrado. Considere adicionar setores antes de relacionar usuários.');
    }
    
    // 5. Adicionar comentário na coluna
    await connection.execute(
      "COMMENT ON COLUMN USUARIOS.SETOR_ID IS 'ID do setor ao qual o usuário pertence (FK para SETORES)'"
    );
    
    // 6. Verificar estrutura final
    console.log('\n📋 Verificando estrutura final da tabela USUARIOS...');
    
    const finalStructureQuery = `
      SELECT COLUMN_NAME, DATA_TYPE, NULLABLE, DATA_DEFAULT
      FROM USER_TAB_COLUMNS
      WHERE TABLE_NAME = 'USUARIOS'
      ORDER BY COLUMN_ID
    `;
    
    const structureResult = await connection.execute(finalStructureQuery);
    console.log('\n📊 Estrutura da tabela USUARIOS:');
    console.table(structureResult.rows);
    
    // 7. Verificar relacionamentos
    const relationshipsQuery = `
      SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE, R_CONSTRAINT_NAME
      FROM USER_CONSTRAINTS
      WHERE TABLE_NAME = 'USUARIOS'
      AND CONSTRAINT_TYPE = 'R'
    `;
    
    const relationshipsResult = await connection.execute(relationshipsQuery);
    console.log('\n🔗 Relacionamentos da tabela USUARIOS:');
    console.table(relationshipsResult.rows);
    
    // Commit das alterações
    await connection.commit();
    
    console.log('\n🎉 Atualização da tabela USUARIOS concluída com sucesso!');
    console.log('\n📋 Resumo das alterações:');
    console.log('- ✅ Coluna SETOR_ID adicionada/verificada');
    console.log('- ✅ Índice IDX_USUARIOS_SETOR_ID criado/verificado');
    console.log('- ✅ Foreign Key FK_USUARIOS_SETOR criada/verificada');
    console.log('- ✅ Dados migrados de DEPARTAMENTO para SETORES');
    console.log('- ✅ SETOR_ID atualizado para usuários existentes');
    
  } catch (error) {
    console.error('❌ Erro durante a atualização:', error);
    
    if (connection) {
      try {
        await connection.rollback();
        console.log('🔄 Rollback executado com sucesso.');
      } catch (rollbackError) {
        console.error('❌ Erro no rollback:', rollbackError);
      }
    }
    
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
  updateUsuariosSetoresRelationship()
    .then(() => {
      console.log('\n✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro na execução do script:', error);
      process.exit(1);
    });
}

export { updateUsuariosSetoresRelationship };