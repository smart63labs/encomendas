/**
 * Script de teste para verificar conexão Oracle e tabelas
 * Execute com: node test-oracle.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

async function testOracle() {
  console.log('🔍 Testando conexão Oracle e tabelas...\n');
  
  try {
    // 1. Testar se o servidor está rodando
    console.log('1. Verificando se o servidor está rodando...');
    const healthCheck = await makeRequest('/api/health');
    
    if (healthCheck.status === 200) {
      console.log('✅ Servidor está rodando');
      console.log(`   Status: ${healthCheck.data.status}`);
      if (healthCheck.data.database) {
        console.log(`   Database: ${healthCheck.data.database.status}`);
      }
    } else {
      console.log('❌ Servidor não está respondendo');
      console.log('   Certifique-se de que o servidor está rodando com: npm run dev');
      return;
    }
    
    console.log('\n2. Verificando tabelas Oracle...');
    
    // 2. Verificar tabelas
    const tablesCheck = await makeRequest('/api/database/check-tables');
    
    if (tablesCheck.status === 200) {
      const result = tablesCheck.data;
      
      console.log('✅ Conexão Oracle estabelecida');
      console.log(`   Tabelas esperadas: ${result.summary.totalTables}`);
      console.log(`   Tabelas existentes: ${result.summary.existingTables}`);
      
      if (result.summary.allTablesExist) {
        console.log('🎉 Todas as tabelas estão criadas!');
        
        // Mostrar detalhes das tabelas
        console.log('\n📊 Detalhes das tabelas:');
        result.details.forEach(table => {
          if (table.exists) {
            console.log(`   ${table.table}: ${table.columns} colunas, ${table.rowCount} registros`);
          }
        });
        
      } else {
        console.log('⚠️  Algumas tabelas estão faltando:');
        result.summary.missingTables.forEach(table => {
          console.log(`   - ${table}`);
        });
        
        console.log('\n💡 Para criar as tabelas, execute:');
        console.log('   curl -X POST http://localhost:3000/api/database/create-tables');
        console.log('   ou use Postman/Insomnia para fazer POST em /api/database/create-tables');
      }
      
    } else if (tablesCheck.status === 500) {
      console.log('❌ Erro de conexão com Oracle');
      console.log(`   Erro: ${tablesCheck.data.error}`);
      console.log('\n🔧 Verifique:');
      console.log('   1. Se o Oracle está rodando');
      console.log('   2. Se as credenciais no .env estão corretas');
      console.log('   3. Se o serviço Oracle está acessível');
      
    } else {
      console.log('❌ Erro inesperado:', tablesCheck);
    }
    
  } catch (error) {
    console.log('❌ Erro ao conectar com o servidor:');
    console.log(`   ${error.message}`);
    console.log('\n🔧 Certifique-se de que:');
    console.log('   1. O servidor backend está rodando (npm run dev)');
    console.log('   2. O servidor está na porta 3000');
    console.log('   3. O arquivo .env está configurado');
  }
}

// Executar teste
testOracle().then(() => {
  console.log('\n✨ Teste concluído!');
}).catch(error => {
  console.error('Erro no teste:', error);
});

// Instruções de uso
console.log('='.repeat(60));
console.log('🧪 SCRIPT DE TESTE ORACLE');
console.log('='.repeat(60));
console.log('Este script verifica:');
console.log('• Se o servidor backend está rodando');
console.log('• Se a conexão Oracle está funcionando');
console.log('• Se as tabelas foram criadas');
console.log('• Detalhes de cada tabela');
console.log('='.repeat(60));
console.log('');