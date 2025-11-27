// Script para testar se os campos de geolocalização existem na tabela SETORES

const API_BASE_URL = 'http://localhost:3001/api';

// Headers para requisições
const headers = {
  'Content-Type': 'application/json'
};

/**
 * Testar se os campos de geolocalização existem
 */
async function testarCamposGeolocalizacao() {
  try {
    console.log('🔍 Testando se os campos LATITUDE e LONGITUDE existem na tabela SETORES...');
    
    // Buscar um setor para verificar a estrutura
    const response = await fetch(`${API_BASE_URL}/setores?limit=1`, {
      headers
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar setores');
    }
    
    const setores = result.data || [];
    
    if (setores.length === 0) {
      console.log('❌ Nenhum setor encontrado para testar');
      return false;
    }
    
    const setor = setores[0];
    console.log('📊 Estrutura do primeiro setor:');
    console.log('Campos disponíveis:', Object.keys(setor));
    
    // Verificar se os campos existem
    const temLatitude = setor.hasOwnProperty('LATITUDE') || setor.hasOwnProperty('latitude');
    const temLongitude = setor.hasOwnProperty('LONGITUDE') || setor.hasOwnProperty('longitude');
    
    console.log('\n📍 Verificação dos campos de geolocalização:');
    console.log(`   LATITUDE: ${temLatitude ? '✅ Existe' : '❌ Não existe'}`);
    console.log(`   LONGITUDE: ${temLongitude ? '✅ Existe' : '❌ Não existe'}`);
    
    if (temLatitude && temLongitude) {
      console.log('\n🎉 Campos de geolocalização encontrados!');
      
      // Mostrar valores atuais
      const latValue = setor.LATITUDE || setor.latitude;
      const lngValue = setor.LONGITUDE || setor.longitude;
      
      console.log(`   Valores atuais:`);
      console.log(`   - LATITUDE: ${latValue || 'NULL'}`);
      console.log(`   - LONGITUDE: ${lngValue || 'NULL'}`);
      
      return true;
    } else {
      console.log('\n❌ Campos de geolocalização NÃO encontrados!');
      console.log('   É necessário executar o script SQL para criar os campos.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar campos de geolocalização:', error.message);
    return false;
  }
}

/**
 * Testar o endpoint de atualização de geolocalização
 */
async function testarEndpointGeolocalizacao() {
  try {
    console.log('\n🔧 Testando endpoint de atualização de geolocalização...');
    
    // Buscar um setor para testar
    const response = await fetch(`${API_BASE_URL}/setores?limit=1`, {
      headers
    });
    
    const result = await response.json();
    
    if (!result.success || !result.data || result.data.length === 0) {
      console.log('❌ Nenhum setor disponível para teste');
      return false;
    }
    
    const setor = result.data[0];
    const setorId = setor.ID || setor.id;
    
    console.log(`   Testando com setor ID: ${setorId}`);
    
    // Testar coordenadas de Palmas (coordenadas válidas para teste)
    const testResponse = await fetch(`${API_BASE_URL}/setores/${setorId}/geolocation`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        latitude: -10.184,
        longitude: -48.334
      })
    });
    
    const testResult = await testResponse.json();
    
    if (testResult.success) {
      console.log('✅ Endpoint de geolocalização funcionando!');
      console.log(`   Coordenadas atualizadas: ${testResult.data.latitude}, ${testResult.data.longitude}`);
      return true;
    } else {
      console.log('❌ Erro no endpoint de geolocalização:');
      console.log(`   ${testResult.message}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar endpoint:', error.message);
    return false;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando testes de geolocalização...');
  console.log('=' .repeat(60));
  
  // Teste 1: Verificar se os campos existem
  const camposExistem = await testarCamposGeolocalizacao();
  
  if (!camposExistem) {
    console.log('\n⚠️  AÇÃO NECESSÁRIA:');
    console.log('   Os campos de geolocalização não existem na tabela SETORES.');
    console.log('   Execute o script SQL para criar os campos:');
    console.log('   sqlplus SEFAZ_PROTOCOLO/sefaz2025@localhost:1521/XE @backend\\sql\\add_geolocation_to_setores.sql');
    return;
  }
  
  // Teste 2: Testar endpoint de atualização
  const endpointFunciona = await testarEndpointGeolocalizacao();
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 RESUMO DOS TESTES');
  console.log('=' .repeat(60));
  console.log(`✅ Campos de geolocalização: ${camposExistem ? 'OK' : 'FALHA'}`);
  console.log(`✅ Endpoint de atualização: ${endpointFunciona ? 'OK' : 'FALHA'}`);
  
  if (camposExistem && endpointFunciona) {
    console.log('\n🎉 Sistema de geolocalização está pronto!');
    console.log('   Agora você pode executar o script de geocodificação:');
    console.log('   node geocode-and-update-setores.cjs');
  } else {
    console.log('\n❌ Sistema de geolocalização precisa de correções.');
  }
}

// Executar
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = {
  testarCamposGeolocalizacao,
  testarEndpointGeolocalizacao
};