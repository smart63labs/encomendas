import oracledb from 'oracledb';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcrypt';

// Carregar variáveis de ambiente
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

async function insertAdminUser() {
  let connection: oracledb.Connection | undefined;
  
  try {
    console.log('👤 Inserindo usuário administrador...');
    
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
    
    const adminEmail = 'admin_protocolo@sefaz.to.gov.br';
    const adminPassword = 'admin_protocolo123';
    
    // Verificar se o usuário já existe
    const existingUser = await connection.execute(
      `SELECT ID FROM USUARIOS WHERE EMAIL = :email`,
      { email: adminEmail },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (existingUser.rows && existingUser.rows.length > 0) {
      console.log(`⚠️  Usuário ${adminEmail} já existe no banco`);
      
      // Atualizar a senha do usuário existente
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      await connection.execute(
        `UPDATE USUARIOS SET PASSWORD_HASH = :password_hash, UPDATED_AT = CURRENT_TIMESTAMP 
         WHERE EMAIL = :email`,
        {
          password_hash: hashedPassword,
          email: adminEmail
        }
      );
      
      console.log(`✅ Senha do usuário ${adminEmail} atualizada`);
    } else {
      // Criar novo usuário administrador
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      await connection.execute(
        `INSERT INTO USUARIOS (EMAIL, PASSWORD_HASH, NAME, ROLE, DEPARTMENT, IS_ACTIVE) 
         VALUES (:email, :password_hash, :name, :role, :department, :is_active)`,
        {
          email: adminEmail,
          password_hash: hashedPassword,
          name: 'Administrador do Sistema',
          role: 'ADMIN',
          department: 'TI - SEFAZ',
          is_active: 1
        }
      );
      
      console.log(`✅ Usuário administrador criado: ${adminEmail}`);
    }
    
    // Configurações do sistema removidas - tabela não existe ainda
    
    // Commit das transações
    await connection.commit();
    console.log('\n💾 Todas as alterações foram salvas no banco');
    
    console.log('\n🎉 Configuração do usuário administrador concluída!');
    console.log('\n🔑 Credenciais do administrador:');
    console.log(`   📧 Email: ${adminEmail}`);
    console.log(`   🔒 Senha: ${adminPassword}`);
    
  } catch (error: any) {
    console.error('❌ Erro ao inserir usuário administrador:', error.message);
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

// Executar inserção do admin
insertAdminUser().catch(console.error);