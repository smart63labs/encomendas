const bcrypt = require('bcrypt');

const hash = '$2b$10$eP474ODcLoGj9yYYr4yq6.XjRQy29AMQsMQZR8e6.whw4cQ2kCFCa';
const senhas = ['admin123', 'Admin@123', 'admin@123', 'ADMIN@123', 'Senha123@', 'senha123', '123456'];

async function testPasswords() {
  console.log('Testando senhas contra o hash do banco...');
  console.log('Hash:', hash);
  console.log('');
  
  for (const senha of senhas) {
    try {
      const result = await bcrypt.compare(senha, hash);
      console.log(`Senha '${senha}' válida:`, result);
    } catch (error) {
      console.log(`Erro ao testar senha '${senha}':`, error.message);
    }
  }
}

testPasswords();