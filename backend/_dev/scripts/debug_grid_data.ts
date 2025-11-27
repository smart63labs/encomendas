import { DatabaseService } from './src/config/database';

async function debugGridData() {
  let connection;
  
  try {
    console.log('🔍 Iniciando debug dos dados dos grids...');
    
    // Inicializar conexão
    await DatabaseService.initialize();
    connection = await DatabaseService.getConnection();
    
    // 1. Verificar estrutura da tabela SETORES
    console.log('\n📊 ESTRUTURA DA TABELA SETORES:');
    const setoresStructure = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, NULLABLE, DATA_DEFAULT
      FROM USER_TAB_COLUMNS
      WHERE TABLE_NAME = 'SETORES'
      ORDER BY COLUMN_ID
    `);
    console.table(setoresStructure.rows);
    
    // 2. Verificar dados da tabela SETORES
    console.log('\n📋 DADOS DA TABELA SETORES:');
    const setoresData = await connection.execute(`
      SELECT ID, CODIGO_SETOR, NOME_SETOR, ORGAO, SETOR, LOTACAO, ATIVO
      FROM SETORES
      WHERE ROWNUM <= 10
    `);
    console.table(setoresData.rows);
    
    // 3. Contar total de setores
    const setoresCount = await connection.execute('SELECT COUNT(*) as TOTAL FROM SETORES');
    console.log(`\n📈 Total de setores: ${(setoresCount.rows as any[])?.[0]?.[0] || 0}`);
    
    // 4. Verificar estrutura da tabela USUARIOS
    console.log('\n📊 ESTRUTURA DA TABELA USUARIOS:');
    const usuariosStructure = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, NULLABLE, DATA_DEFAULT
      FROM USER_TAB_COLUMNS
      WHERE TABLE_NAME = 'USUARIOS'
      ORDER BY COLUMN_ID
    `);
    console.table(usuariosStructure.rows);
    
    // 5. Verificar dados da tabela USUARIOS
    console.log('\n📋 DADOS DA TABELA USUARIOS:');
    const usuariosData = await connection.execute(`
      SELECT ID, EMAIL, NAME, DEPARTMENT, IS_ACTIVE, SETOR_ID
      FROM USUARIOS
      WHERE ROWNUM <= 10
    `);
    console.table(usuariosData.rows);
    
    // 6. Contar total de usuários
    const usuariosCount = await connection.execute('SELECT COUNT(*) as TOTAL FROM USUARIOS');
    console.log(`\n📈 Total de usuários: ${(usuariosCount.rows as any[])?.[0]?.[0] || 0}`);
    
    // 7. Verificar relacionamento USUARIOS x SETORES
    console.log('\n🔗 RELACIONAMENTO USUARIOS x SETORES:');
    const relacionamento = await connection.execute(`
      SELECT 
        u.ID as USER_ID,
        u.EMAIL,
        u.NAME,
        u.DEPARTMENT,
        u.IS_ACTIVE,
        u.SETOR_ID,
        s.NOME_SETOR,
        s.CODIGO_SETOR
      FROM USUARIOS u
      LEFT JOIN SETORES s ON u.SETOR_ID = s.ID
      WHERE ROWNUM <= 10
    `);
    console.table(relacionamento.rows);
    
    // 8. Verificar se existe coluna DEPARTAMENTO vs DEPARTMENT
    console.log('\n🔍 VERIFICANDO COLUNAS DEPARTAMENTO/DEPARTMENT:');
    const departamentoCheck = await connection.execute(`
      SELECT COUNT(*) as EXISTE
      FROM USER_TAB_COLUMNS
      WHERE TABLE_NAME = 'USUARIOS' AND COLUMN_NAME = 'DEPARTAMENTO'
    `);
    const departmentCheck = await connection.execute(`
      SELECT COUNT(*) as EXISTE
      FROM USER_TAB_COLUMNS
      WHERE TABLE_NAME = 'USUARIOS' AND COLUMN_NAME = 'DEPARTMENT'
    `);
    console.log(`Coluna DEPARTAMENTO existe: ${((departamentoCheck.rows as any[])?.[0]?.[0] || 0) > 0 ? 'SIM' : 'NÃO'}`);
    console.log(`Coluna DEPARTMENT existe: ${((departmentCheck.rows as any[])?.[0]?.[0] || 0) > 0 ? 'SIM' : 'NÃO'}`);
    
    // 9. Verificar se existe coluna NAME vs NOME
    console.log('\n🔍 VERIFICANDO COLUNAS DE NOME:');
    const nameCheck = await connection.execute(`
      SELECT COLUMN_NAME
      FROM USER_TAB_COLUMNS
      WHERE TABLE_NAME = 'USUARIOS' AND COLUMN_NAME IN ('NAME', 'NOME')
    `);
    console.log('Colunas de nome encontradas:');
    console.table(nameCheck.rows);
    
    // 10. Testar query que o frontend está fazendo para setores
    console.log('\n🧪 TESTANDO QUERY DO FRONTEND PARA SETORES:');
    try {
      const frontendSetores = await connection.execute(`
        SELECT * FROM SETORES
        ORDER BY NOME_SETOR
      `);
      console.log(`Registros retornados: ${frontendSetores.rows?.length || 0}`);
      if (frontendSetores.rows && frontendSetores.rows.length > 0) {
        console.log('Primeiro registro:');
        console.log(frontendSetores.rows[0]);
      }
    } catch (error: any) {
      console.error('Erro na query de setores:', error?.message || error);
    }
    
    // 11. Testar query que o frontend está fazendo para usuários
    console.log('\n🧪 TESTANDO QUERY DO FRONTEND PARA USUARIOS:');
    try {
      const frontendUsuarios = await connection.execute(`
        SELECT * FROM USUARIOS
        ORDER BY EMAIL
      `);
      console.log(`Registros retornados: ${frontendUsuarios.rows?.length || 0}`);
      if (frontendUsuarios.rows && frontendUsuarios.rows.length > 0) {
        console.log('Primeiro registro:');
        console.log(frontendUsuarios.rows[0]);
      }
    } catch (error: any) {
      console.error('Erro na query de usuários:', error?.message || error);
    }
    
    console.log('\n✅ Debug concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o debug:', error);
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

debugGridData();