const { DatabaseService } = require('./dist/config/database');

(async () => {
  try {
    await DatabaseService.ensureInitialized();
    const conn = await DatabaseService.getConnection();
    
    console.log('=== VERIFICAÇÃO DO STATUS DO USUÁRIO ===\n');
    
    // Verificar o usuário admin diretamente no banco
    const result = await conn.execute(`
      SELECT ID, EMAIL, NAME, IS_ACTIVE, CREATED_AT, UPDATED_AT
      FROM USUARIOS 
      WHERE EMAIL = :email
    `, { email: 'admin_protocolo@sefaz.to.gov.br' });
    
    if (result.rows && result.rows.length > 0) {
      const user = result.rows[0];
      console.log('Usuário encontrado no banco:');
      console.log('ID:', user.ID);
      console.log('EMAIL:', user.EMAIL);
      console.log('NAME:', user.NAME);
      console.log('IS_ACTIVE:', user.IS_ACTIVE);
      console.log('IS_ACTIVE type:', typeof user.IS_ACTIVE);
      console.log('IS_ACTIVE === 1:', user.IS_ACTIVE === 1);
      console.log('IS_ACTIVE == 1:', user.IS_ACTIVE == 1);
      console.log('CREATED_AT:', user.CREATED_AT);
      console.log('UPDATED_AT:', user.UPDATED_AT);
      
      // Testar o mapeamento como no UserModel
      const isActive = user.IS_ACTIVE === 1;
      console.log('\nMapeamento isActive:', isActive);
      
    } else {
      console.log('Usuário não encontrado no banco!');
    }
    
    await conn.close();
    
  } catch (error) {
    console.error('Erro:', error);
  }
})();