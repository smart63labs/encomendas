import oracledb from 'oracledb';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcrypt';

// Carregar variáveis de ambiente
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

async function testAdminLogin() {
  let connection: oracledb.Connection | undefined;
  
  try {
    console.log('🔐 Testando login do administrador...');
    
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
    
    console.log(`\n🔍 Buscando usuário: ${adminEmail}`);
    
    // Buscar usuário no banco
    const result = await connection.execute(
      `SELECT id, email, password_hash, name, role, department, is_active, created_at, last_login
       FROM users 
       WHERE email = :email AND is_active = 1`,
      { email: adminEmail },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (!result.rows || result.rows.length === 0) {
      console.log('❌ Usuário não encontrado ou inativo');
      return;
    }
    
    const user = result.rows[0] as any;
    console.log('✅ Usuário encontrado no banco:');
    console.log(`   🆔 ID: ${user.ID}`);
    console.log(`   📧 Email: ${user.EMAIL}`);
    console.log(`   👤 Nome: ${user.NAME}`);
    console.log(`   🎭 Papel: ${user.ROLE}`);
    console.log(`   🏢 Departamento: ${user.DEPARTMENT}`);
    console.log(`   📅 Criado em: ${user.CREATED_AT}`);
    console.log(`   🕐 Último login: ${user.LAST_LOGIN || 'Nunca'}`);
    
    // Verificar senha
    console.log('\n🔒 Verificando senha...');
    const passwordMatch = await bcrypt.compare(adminPassword, user.PASSWORD_HASH);
    
    if (passwordMatch) {
      console.log('✅ Senha correta!');
      
      // Atualizar último login
      await connection.execute(
        `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = :id`,
        { id: user.ID }
      );
      
      await connection.commit();
      console.log('✅ Último login atualizado');
      
      console.log('\n🎉 Login realizado com sucesso!');
      console.log('\n📋 Dados da sessão:');
      console.log(`   🆔 User ID: ${user.ID}`);
      console.log(`   📧 Email: ${user.EMAIL}`);
      console.log(`   👤 Nome: ${user.NAME}`);
      console.log(`   🎭 Papel: ${user.ROLE}`);
      console.log(`   🏢 Departamento: ${user.DEPARTMENT}`);
      
    } else {
      console.log('❌ Senha incorreta!');
    }
    
    // Verificar estatísticas do banco
    console.log('\n📊 Estatísticas do banco:');
    
    const stats = await connection.execute(
      `SELECT 
         (SELECT COUNT(*) FROM users) as total_users,
         (SELECT COUNT(*) FROM users WHERE is_active = 1) as active_users,
         (SELECT COUNT(*) FROM processes) as total_processes,
         (SELECT COUNT(*) FROM documents) as total_documents,
         (SELECT COUNT(*) FROM system_settings) as total_settings
       FROM DUAL`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    if (stats.rows && stats.rows.length > 0) {
      const data = stats.rows[0] as any;
      console.log(`   👥 Total de usuários: ${data.TOTAL_USERS}`);
      console.log(`   ✅ Usuários ativos: ${data.ACTIVE_USERS}`);
      console.log(`   📋 Total de processos: ${data.TOTAL_PROCESSES}`);
      console.log(`   📄 Total de documentos: ${data.TOTAL_DOCUMENTS}`);
      console.log(`   ⚙️  Configurações do sistema: ${data.TOTAL_SETTINGS}`);
    }
    
  } catch (error: any) {
    console.error('❌ Erro ao testar login:', error.message);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('\n🔌 Conexão fechada');
      } catch (error: any) {
        console.error('❌ Erro ao fechar conexão:', error.message);
      }
    }
  }
}

// Executar teste de login
testAdminLogin().catch(console.error);