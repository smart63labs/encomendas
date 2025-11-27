const { DatabaseService, OracleUtils } = require('./dist/config/database');

(async () => {
  try {
    await DatabaseService.ensureInitialized();
    const conn = await DatabaseService.getConnection();
    
    console.log('=== TESTE DE MAPEAMENTO DE USUÁRIOS ===\n');
    
    // 1. Verificar estrutura da tabela USUARIOS
    console.log('1. Estrutura da tabela USUARIOS:');
    const structure = await conn.execute(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM USER_TAB_COLUMNS 
      WHERE TABLE_NAME = 'USUARIOS' 
      ORDER BY COLUMN_ID
    `);
    console.table(structure.rows);
    
    // 2. Buscar dados brutos do banco
    console.log('\n2. Dados brutos do banco (primeiros 3 usuários):');
    const rawResult = await conn.execute(`
      SELECT * FROM USUARIOS WHERE ROWNUM <= 3
    `);
    console.log('Dados brutos:', JSON.stringify(rawResult.rows, null, 2));
    
    // 3. Testar conversão toCamelCase
    console.log('\n3. Teste de conversão toCamelCase:');
    if (rawResult.rows && rawResult.rows.length > 0) {
      const firstUser = rawResult.rows[0];
      console.log('Usuário original:', firstUser);
      
      const converted = OracleUtils.toCamelCase(firstUser);
      console.log('Usuário convertido:', converted);
      
      console.log('\nMapeamento de campos:');
      Object.keys(firstUser).forEach(key => {
        const camelKey = key.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        console.log(`${key} -> ${camelKey}`);
      });
    }
    
    // 4. Testar query do UserModel.findAll
    console.log('\n4. Teste da query do UserModel.findAll:');
    const userModelQuery = `
      SELECT u.*, s.setor as SETOR_NOME
      FROM USUARIOS u
      LEFT JOIN SETORES s ON u.setor_id = s.id
      WHERE ROWNUM <= 3
    `;
    
    const userModelResult = await conn.execute(userModelQuery);
    console.log('Resultado da query do UserModel:', JSON.stringify(userModelResult.rows, null, 2));
    
    if (userModelResult.rows && userModelResult.rows.length > 0) {
      const processedUsers = userModelResult.rows.map(row => {
        const processed = OracleUtils.toCamelCase(row);
        // Simular remoção de campos hidden
        delete processed.senha;
        delete processed.password;
        return processed;
      });
      
      console.log('\nUsuários processados (como no UserModel):');
      console.log(JSON.stringify(processedUsers, null, 2));
    }
    
    await conn.close();
    
  } catch (error) {
    console.error('Erro:', error);
  }
})();