import { DatabaseService } from '../config/database';

async function addBloqueadoAteColumn() {
  try {
    console.log('Conectando ao banco de dados...');
    await DatabaseService.initialize();
    console.log('Conectado com sucesso!');

    // Verificar se a coluna já existe
    const checkSql = `
      SELECT COUNT(*) as count
      FROM USER_TAB_COLUMNS 
      WHERE TABLE_NAME = 'USERS' 
      AND COLUMN_NAME = 'BLOQUEADO_ATE'
    `;
    
    const checkResult = await DatabaseService.executeQuery(checkSql);
    const columnExists = (checkResult.rows?.[0] as any)?.COUNT > 0;
    
    if (columnExists) {
      console.log('✅ Coluna BLOQUEADO_ATE já existe na tabela USERS');
    } else {
      console.log('➕ Adicionando coluna BLOQUEADO_ATE na tabela USERS...');
      
      const alterSql = `
        ALTER TABLE USERS ADD (
          BLOQUEADO_ATE DATE
        )
      `;
      
      await DatabaseService.executeQuery(alterSql);
      console.log('✅ Coluna BLOQUEADO_ATE adicionada com sucesso!');
    }
    
    // Verificar a estrutura final
    console.log('\n=== VERIFICANDO COLUNAS RELACIONADAS AO LOGIN ===');
    const columnsSql = `
      SELECT COLUMN_NAME, DATA_TYPE, NULLABLE
      FROM USER_TAB_COLUMNS 
      WHERE TABLE_NAME = 'USERS' 
      AND COLUMN_NAME IN ('TENTATIVAS_LOGIN', 'BLOQUEADO_ATE', 'ULTIMO_LOGIN')
      ORDER BY COLUMN_NAME
    `;
    
    const columnsResult = await DatabaseService.executeQuery(columnsSql);
    columnsResult.rows?.forEach((row: any) => {
      console.log(`- ${row.COLUMN_NAME}: ${row.DATA_TYPE} (${row.NULLABLE === 'Y' ? 'NULL' : 'NOT NULL'})`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await DatabaseService.close();
    console.log('Conexão fechada.');
  }
}

addBloqueadoAteColumn();