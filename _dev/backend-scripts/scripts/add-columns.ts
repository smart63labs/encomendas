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

async function addColumns(): Promise<void> {
  let connection: oracledb.Connection | undefined;
  
  try {
    console.log('Conectando ao banco de dados...');
    connection = await oracledb.getConnection(dbConfig);
    console.log('Conectado com sucesso!');
    
    // Adicionar colunas na tabela USERS
    try {
      console.log('\nAdicionando colunas na tabela USERS...');
      await connection.execute(`
        ALTER TABLE USERS ADD (
          SETOR_ID NUMBER,
          ORGAO VARCHAR2(200),
          SETOR VARCHAR2(200),
          LOTACAO VARCHAR2(200)
        )
      `);
      console.log('✅ Colunas adicionadas na tabela USERS');
    } catch (error: any) {
      if (error.message.includes('ORA-01430')) {
        console.log('⚠️ Colunas já existem na tabela USERS');
      } else {
        console.error('Erro ao adicionar colunas na USERS:', error.message);
      }
    }
    
    // Adicionar colunas na tabela ENCOMENDAS
    try {
      console.log('\nAdicionando colunas na tabela ENCOMENDAS...');
      await connection.execute(`
        ALTER TABLE ENCOMENDAS ADD (
          SETOR_ORIGEM_ID NUMBER,
          SETOR_DESTINO_ID NUMBER
        )
      `);
      console.log('✅ Colunas adicionadas na tabela ENCOMENDAS');
    } catch (error: any) {
      if (error.message.includes('ORA-01430')) {
        console.log('⚠️ Colunas já existem na tabela ENCOMENDAS');
      } else {
        console.error('Erro ao adicionar colunas na ENCOMENDAS:', error.message);
      }
    }

    // Adicionar coluna DATA_ENTREGA na tabela ENCOMENDAS
    try {
      console.log('\nAdicionando coluna DATA_ENTREGA na tabela ENCOMENDAS...');
      await connection.execute(`
        ALTER TABLE ENCOMENDAS ADD (
          DATA_ENTREGA DATE
        )
      `);
      console.log('✅ Coluna DATA_ENTREGA adicionada na tabela ENCOMENDAS');
    } catch (error: any) {
      if (error.message.includes('ORA-01430')) {
        console.log('⚠️ Coluna DATA_ENTREGA já existe na tabela ENCOMENDAS');
      } else {
        console.error('Erro ao adicionar coluna DATA_ENTREGA na ENCOMENDAS:', error.message);
      }
    }
    
    // Criar índices
    try {
      console.log('\nCriando índices...');
      await connection.execute('CREATE INDEX IDX_USERS_SETOR_ID ON USERS(SETOR_ID)');
      console.log('✅ Índice IDX_USERS_SETOR_ID criado');
    } catch (error: any) {
      if (error.message.includes('ORA-00955')) {
        console.log('⚠️ Índice IDX_USERS_SETOR_ID já existe');
      } else {
        console.error('Erro ao criar índice:', error.message);
      }
    }
    
    try {
      await connection.execute('CREATE INDEX IDX_ENCOMENDAS_SETOR_ORIGEM ON ENCOMENDAS(SETOR_ORIGEM_ID)');
      console.log('✅ Índice IDX_ENCOMENDAS_SETOR_ORIGEM criado');
    } catch (error: any) {
      if (error.message.includes('ORA-00955')) {
        console.log('⚠️ Índice IDX_ENCOMENDAS_SETOR_ORIGEM já existe');
      } else {
        console.error('Erro ao criar índice:', error.message);
      }
    }
    
    try {
      await connection.execute('CREATE INDEX IDX_ENCOMENDAS_SETOR_DESTINO ON ENCOMENDAS(SETOR_DESTINO_ID)');
      console.log('✅ Índice IDX_ENCOMENDAS_SETOR_DESTINO criado');
    } catch (error: any) {
      if (error.message.includes('ORA-00955')) {
        console.log('⚠️ Índice IDX_ENCOMENDAS_SETOR_DESTINO já existe');
      } else {
        console.error('Erro ao criar índice:', error.message);
      }
    }
    
    // Criar chaves estrangeiras
    try {
      console.log('\nCriando chaves estrangeiras...');
      await connection.execute(`
        ALTER TABLE USERS ADD CONSTRAINT FK_USERS_SETOR 
        FOREIGN KEY (SETOR_ID) REFERENCES SETORES(ID)
      `);
      console.log('✅ Chave estrangeira FK_USERS_SETOR criada');
    } catch (error: any) {
      if (error.message.includes('ORA-02275')) {
        console.log('⚠️ Chave estrangeira FK_USERS_SETOR já existe');
      } else {
        console.error('Erro ao criar FK_USERS_SETOR:', error.message);
      }
    }
    
    try {
      await connection.execute(`
        ALTER TABLE ENCOMENDAS ADD CONSTRAINT FK_ENCOMENDAS_SETOR_ORIGEM 
        FOREIGN KEY (SETOR_ORIGEM_ID) REFERENCES SETORES(ID)
      `);
      console.log('✅ Chave estrangeira FK_ENCOMENDAS_SETOR_ORIGEM criada');
    } catch (error: any) {
      if (error.message.includes('ORA-02275')) {
        console.log('⚠️ Chave estrangeira FK_ENCOMENDAS_SETOR_ORIGEM já existe');
      } else {
        console.error('Erro ao criar FK_ENCOMENDAS_SETOR_ORIGEM:', error.message);
      }
    }
    
    try {
      await connection.execute(`
        ALTER TABLE ENCOMENDAS ADD CONSTRAINT FK_ENCOMENDAS_SETOR_DESTINO 
        FOREIGN KEY (SETOR_DESTINO_ID) REFERENCES SETORES(ID)
      `);
      console.log('✅ Chave estrangeira FK_ENCOMENDAS_SETOR_DESTINO criada');
    } catch (error: any) {
      if (error.message.includes('ORA-02275')) {
        console.log('⚠️ Chave estrangeira FK_ENCOMENDAS_SETOR_DESTINO já existe');
      } else {
        console.error('Erro ao criar FK_ENCOMENDAS_SETOR_DESTINO:', error.message);
      }
    }

    // Adicionar coluna OPENROUTESERVICE_API_KEY na tabela CONFIGURACOES_APIS
    try {
      console.log('\nAdicionando coluna OPENROUTESERVICE_API_KEY na tabela CONFIGURACOES_APIS...');
      await connection.execute(`
        ALTER TABLE CONFIGURACOES_APIS ADD (
          OPENROUTESERVICE_API_KEY VARCHAR2(200)
        )
      `);
      console.log('✅ Coluna OPENROUTESERVICE_API_KEY adicionada na tabela CONFIGURACOES_APIS');
    } catch (error: any) {
      if (error.message.includes('ORA-01430')) {
        console.log('⚠️ Coluna OPENROUTESERVICE_API_KEY já existe na tabela CONFIGURACOES_APIS');
      } else if (error.message.includes('ORA-00942')) {
        console.error('⚠️ Tabela CONFIGURACOES_APIS não existe. Crie a tabela antes de adicionar a coluna.');
      } else {
        console.error('Erro ao adicionar coluna OPENROUTESERVICE_API_KEY:', error.message);
      }
    }
    
    // Popular tabela SETORES
    try {
      console.log('\nPopulando tabela SETORES...');
      await connection.execute(`
        INSERT INTO SETORES (ID, CODIGO_SETOR, ORGAO, SETOR, LOTACAO, ATIVO, CREATED_AT) 
        VALUES (1, 'SEFAZ-001', 'SEFAZ', 'SECRETARIA DA FAZENDA', 'SEDE', 1, CURRENT_TIMESTAMP)
      `);
      
      await connection.execute(`
        INSERT INTO SETORES (ID, CODIGO_SETOR, ORGAO, SETOR, LOTACAO, ATIVO, CREATED_AT) 
        VALUES (2, 'SEFAZ-002', 'SEFAZ', 'DIRETORIA DE ADMINISTRAÇÃO', 'SEDE', 1, CURRENT_TIMESTAMP)
      `);
      
      await connection.execute(`
        INSERT INTO SETORES (ID, CODIGO_SETOR, ORGAO, SETOR, LOTACAO, ATIVO, CREATED_AT) 
        VALUES (3, 'SEFAZ-003', 'SEFAZ', 'DIRETORIA DE ARRECADAÇÃO', 'SEDE', 1, CURRENT_TIMESTAMP)
      `);
      
      console.log('✅ Dados básicos inseridos na tabela SETORES');
    } catch (error: any) {
      if (error.message.includes('ORA-00001')) {
        console.log('⚠️ Dados já existem na tabela SETORES');
      } else {
        console.error('Erro ao inserir dados:', error.message);
      }
    }
    
    await connection.commit();
    console.log('\n✅ Todas as alterações foram aplicadas com sucesso!');
    
  } catch (error: any) {
    console.error('Erro durante a execução:', error.message);
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

// Executar se este arquivo for executado diretamente
if (require.main === module) {
  addColumns().catch(console.error);
}

export { addColumns };