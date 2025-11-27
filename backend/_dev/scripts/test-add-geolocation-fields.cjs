// Usar fetch global do Node.js 18+

// Configurações
const API_BASE_URL = 'http://localhost:3001/api';

async function testAddGeolocationFields() {
  console.log('🚀 Testando criação dos campos de geolocalização...');
  console.log('============================================================');

  try {
    // Fazer requisição para adicionar campos de geolocalização
    console.log('📡 Fazendo requisição para adicionar campos...');
    const response = await fetch(`${API_BASE_URL}/database-geolocation/add-geolocation-fields`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    console.log('\n📊 Resultado da operação:');
    console.log(`Status HTTP: ${response.status}`);
    console.log(`Sucesso: ${result.success ? '✅' : '❌'}`);
    console.log(`Mensagem: ${result.message}`);

    if (result.summary) {
      console.log('\n📈 Resumo das operações:');
      console.log(`- Total de operações: ${result.summary.totalOperations}`);
      console.log(`- Operações bem-sucedidas: ${result.summary.successfulOperations}`);
      console.log(`- Operações ignoradas: ${result.summary.skippedOperations}`);
      console.log(`- Operações falharam: ${result.summary.failedOperations}`);
    }

    if (result.operations && result.operations.length > 0) {
      console.log('\n🔧 Detalhes das operações:');
      result.operations.forEach((op, index) => {
        const statusIcon = op.status === 'SUCCESS' ? '✅' : op.status === 'SKIPPED' ? '⏭️' : '❌';
        console.log(`${index + 1}. ${statusIcon} ${op.name}: ${op.result}`);
      });
    }

    if (result.errors && result.errors.length > 0) {
      console.log('\n❌ Erros encontrados:');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.operation}: ${error.error}`);
      });
    }

    // Se bem-sucedido, testar se os campos foram criados
    if (result.success) {
      console.log('\n🔍 Verificando se os campos foram criados...');
      await testGeolocationFieldsExist();
    }

  } catch (error) {
    console.error('❌ Erro ao testar criação dos campos:', error.message);
  }
}

async function testGeolocationFieldsExist() {
  try {
    // Buscar um setor para verificar se os campos existem
    const response = await fetch(`${API_BASE_URL}/setores?limit=1`);
    const result = await response.json();

    if (result.success && result.data && result.data.length > 0) {
      const setor = result.data[0];
      const campos = Object.keys(setor);
      
      console.log('\n📋 Campos disponíveis no setor:');
      console.log(campos.join(', '));
      
      const hasLatitude = campos.includes('LATITUDE');
      const hasLongitude = campos.includes('LONGITUDE');
      
      console.log('\n📍 Verificação dos campos de geolocalização:');
      console.log(`   LATITUDE: ${hasLatitude ? '✅ Existe' : '❌ Não existe'}`);
      console.log(`   LONGITUDE: ${hasLongitude ? '✅ Existe' : '❌ Não existe'}`);
      
      if (hasLatitude && hasLongitude) {
        console.log('\n🎉 Campos de geolocalização criados com sucesso!');
        return true;
      } else {
        console.log('\n⚠️  Alguns campos de geolocalização não foram encontrados.');
        return false;
      }
    } else {
      console.log('\n⚠️  Não foi possível verificar os campos (nenhum setor encontrado).');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar campos:', error.message);
    return false;
  }
}

// Executar teste
testAddGeolocationFields()
  .then(() => {
    console.log('\n✅ Teste concluído!');
  })
  .catch((error) => {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  });