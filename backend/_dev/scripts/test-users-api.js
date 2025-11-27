const http = require('http');

// Função para fazer login
function login() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: 'admin_protocolo@sefaz.to.gov.br',
      senha: 'admin123'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/users/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log('Login Status:', res.statusCode);
        try {
          const response = JSON.parse(data);
          if (response.success && response.data && response.data.token) {
            console.log('Login realizado com sucesso!');
            resolve(response.data.token);
          } else {
            console.log('Erro no login:', JSON.stringify(response, null, 2));
            reject(new Error('Login falhou'));
          }
        } catch (error) {
          console.error('Erro ao parsear resposta do login:', error.message);
          console.log('Resposta bruta:', data);
          reject(error);
        }
      });
    });

    req.on('error', (e) => {
      console.error('Erro na requisição de login:', e.message);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

// Função para buscar usuários
function getUsers(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/users?page=1&limit=50',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log('\nUsers API Status:', res.statusCode);
        try {
          const response = JSON.parse(data);
          console.log('Users Response:');
          console.log(JSON.stringify(response, null, 2));
          
          if (response.success && response.data) {
            console.log('\n=== ANÁLISE DOS DADOS DOS USUÁRIOS ===');
            response.data.forEach((user, index) => {
              console.log(`\nUsuário ${index + 1}:`);
              console.log(`  - ID: ${user.id || user.ID || 'N/A'}`);
              console.log(`  - Nome: '${user.nome || user.NAME || '-'}'`);
              console.log(`  - Email: '${user.email || user.EMAIL || '-'}'`);
              console.log(`  - Setor: '${user.setor || user.SETOR_NOME || user.departamento || user.DEPARTMENT || '-'}'`);
              console.log(`  - Cargo: '${user.cargo || user.ROLE || '-'}'`);
              console.log(`  - Ativo: ${user.ativo || user.IS_ACTIVE || 'N/A'}`);
              console.log(`  - Setor ID: ${user.setor_id || user.SETOR_ID || 'N/A'}`);
            });
          }
          resolve(response);
        } catch (error) {
          console.error('Erro ao parsear resposta dos usuários:', error.message);
          console.log('Resposta bruta:', data);
          reject(error);
        }
      });
    });

    req.on('error', (e) => {
      console.error('Erro na requisição de usuários:', e.message);
      reject(e);
    });

    req.end();
  });
}

// Executar teste
async function runTest() {
  try {
    console.log('=== TESTE DA API DE USUÁRIOS ===\n');
    const token = await login();
    await getUsers(token);
  } catch (error) {
    console.error('Erro no teste:', error.message);
  }
}

runTest();