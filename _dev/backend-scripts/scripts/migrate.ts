import oracledb from 'oracledb';
import fs from 'fs';
import path from 'path';
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

async function executeSqlFile(connection: oracledb.Connection, filePath: string): Promise<void> {
  try {
    console.log(`Executando arquivo: ${filePath}`);
    
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Dividir o conteúdo em comandos individuais
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    for (const command of commands) {
      if (command.trim()) {
        try {
          console.log(`Executando comando: ${command.substring(0, 50)}...`);
          await connection.execute(command);
        } catch (error: any) {
          console.warn(`Aviso ao executar comando: ${error.message}`);
          // Continuar mesmo com erros (pode ser que a coluna já exista, etc.)
        }
      }
    }
    
    await connection.commit();
    console.log(`Arquivo ${filePath} executado com sucesso!`);
    
  } catch (error: any) {
    console.error(`Erro ao executar arquivo ${filePath}:`, error.message);
    throw error;
  }
}

async function runMigrations(): Promise<void> {
  let connection: oracledb.Connection | undefined;
  
  try {
    console.log('Conectando ao banco de dados...');
    connection = await oracledb.getConnection(dbConfig);
    console.log('Conectado com sucesso!');
    
    // Lista de arquivos SQL para executar
    const sqlFiles = [
      path.join(__dirname, '../../sql/fix_setores_relationships.sql')
    ];
    
    for (const sqlFile of sqlFiles) {
      if (fs.existsSync(sqlFile)) {
        await executeSqlFile(connection, sqlFile);
      } else {
        console.warn(`Arquivo não encontrado: ${sqlFile}`);
      }
    }
    
    console.log('Todas as migrações foram executadas com sucesso!');
    
  } catch (error: any) {
    console.error('Erro durante a migração:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('Conexão fechada.');
      } catch (error: any) {
        console.error('Erro ao fechar conexão:', error.message);
      }
    }
  }
}

// Executar migrações se este arquivo for executado diretamente
if (require.main === module) {
  runMigrations().catch(console.error);
}

export { runMigrations };