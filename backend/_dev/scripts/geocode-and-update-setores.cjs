// Usar fetch nativo do Node.js (disponível a partir da versão 18)

// Configurações da API
const API_BASE_URL = 'http://localhost:3001/api';
const VIACEP_BASE_URL = 'https://viacep.com.br/ws';
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

// Headers para requisições
const headers = {
  'Content-Type': 'application/json',
  'User-Agent': 'SEFAZ-Protocolo-Geocoding/1.0'
};

/**
 * Buscar endereço completo por CEP usando ViaCEP
 */
async function buscarEnderecoPorCep(cep) {
  try {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      throw new Error('CEP deve ter 8 dígitos');
    }

    const response = await fetch(`${VIACEP_BASE_URL}/${cepLimpo}/json/`);
    const data = await response.json();

    if (data.erro) {
      throw new Error('CEP não encontrado');
    }

    return {
      logradouro: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      estado: data.uf,
      cep: data.cep
    };
  } catch (error) {
    console.error(`Erro ao buscar CEP ${cep}:`, error.message);
    return null;
  }
}

/**
 * Geocodificar endereço usando Nominatim
 */
async function geocodificarEndereco(endereco) {
  try {
    const query = encodeURIComponent(`${endereco}, Brasil`);
    const url = `${NOMINATIM_BASE_URL}?q=${query}&format=json&limit=1&countrycodes=br`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SEFAZ-Protocolo-Geocoding/1.0'
      }
    });
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao geocodificar endereço:', error.message);
    return null;
  }
}

/**
 * Montar query de busca para geocodificação
 */
function montarQueryBusca(setor) {
  const partes = [];
  
  if (setor.LOGRADOURO) partes.push(setor.LOGRADOURO);
  if (setor.NUMERO) partes.push(setor.NUMERO);
  if (setor.BAIRRO) partes.push(setor.BAIRRO);
  if (setor.CIDADE) partes.push(setor.CIDADE);
  if (setor.ESTADO) partes.push(setor.ESTADO);
  
  return partes.join(', ');
}

/**
 * Buscar todos os setores da API
 */
async function buscarSetores() {
  try {
    const response = await fetch(`${API_BASE_URL}/setores?limit=100`, {
      headers
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao buscar setores');
    }
    
    return result.data || [];
  } catch (error) {
    console.error('Erro ao buscar setores:', error.message);
    return [];
  }
}

/**
 * Atualizar coordenadas do setor via API
 */
async function atualizarCoordenadas(setorId, latitude, longitude) {
  try {
    const response = await fetch(`${API_BASE_URL}/setores/${setorId}/geolocation`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        latitude,
        longitude
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'Erro ao atualizar coordenadas');
    }
    
    return result;
  } catch (error) {
    console.error(`Erro ao atualizar coordenadas do setor ${setorId}:`, error.message);
    return null;
  }
}

/**
 * Processar geocodificação de um setor
 */
async function processarSetor(setor) {
  console.log(`\n📍 Processando setor: ${setor.NOME_SETOR || setor.SETOR} (ID: ${setor.ID})`);
  
  let coordenadas = null;
  
  // Tentar geocodificar por CEP primeiro
  if (setor.CEP) {
    console.log(`   🔍 Buscando por CEP: ${setor.CEP}`);
    const endereco = await buscarEnderecoPorCep(setor.CEP);
    
    if (endereco) {
      const enderecoCompleto = `${endereco.logradouro}, ${endereco.bairro}, ${endereco.cidade}, ${endereco.estado}`;
      console.log(`   📍 Endereço encontrado: ${enderecoCompleto}`);
      
      coordenadas = await geocodificarEndereco(enderecoCompleto);
    }
  }
  
  // Se não conseguiu por CEP, tentar por endereço direto
  if (!coordenadas && (setor.LOGRADOURO || setor.CIDADE)) {
    const enderecoSetor = montarQueryBusca(setor);
    if (enderecoSetor) {
      console.log(`   🔍 Buscando por endereço: ${enderecoSetor}`);
      coordenadas = await geocodificarEndereco(enderecoSetor);
    }
  }
  
  if (coordenadas) {
    console.log(`   ✅ Coordenadas encontradas: ${coordenadas.latitude}, ${coordenadas.longitude}`);
    
    // Atualizar no banco via API
    const resultado = await atualizarCoordenadas(setor.ID, coordenadas.latitude, coordenadas.longitude);
    
    if (resultado) {
      console.log(`   💾 Coordenadas salvas no banco com sucesso!`);
      return { success: true, coordenadas };
    } else {
      console.log(`   ❌ Erro ao salvar coordenadas no banco`);
      return { success: false, error: 'Erro ao salvar no banco' };
    }
  } else {
    console.log(`   ❌ Não foi possível geocodificar o setor`);
    return { success: false, error: 'Geocodificação falhou' };
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando geocodificação e atualização dos setores...');
  console.log('=' .repeat(60));
  
  // Buscar setores
  console.log('📋 Buscando setores da API...');
  const setores = await buscarSetores();
  
  if (setores.length === 0) {
    console.log('❌ Nenhum setor encontrado!');
    return;
  }
  
  console.log(`📊 Encontrados ${setores.length} setores`);
  
  // Estatísticas
  let sucessos = 0;
  let falhas = 0;
  const resultados = [];
  
  // Processar cada setor
  for (const setor of setores) {
    const resultado = await processarSetor(setor);
    resultados.push({
      setor: setor.NOME_SETOR || setor.SETOR,
      id: setor.ID,
      ...resultado
    });
    
    if (resultado.success) {
      sucessos++;
    } else {
      falhas++;
    }
    
    // Pausa entre requisições para não sobrecarregar as APIs
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Relatório final
  console.log('\n' + '=' .repeat(60));
  console.log('📊 RELATÓRIO FINAL');
  console.log('=' .repeat(60));
  console.log(`✅ Sucessos: ${sucessos}`);
  console.log(`❌ Falhas: ${falhas}`);
  console.log(`📊 Total: ${setores.length}`);
  console.log(`📈 Taxa de sucesso: ${((sucessos / setores.length) * 100).toFixed(1)}%`);
  
  // Listar falhas
  if (falhas > 0) {
    console.log('\n❌ Setores que falharam:');
    resultados
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   - ${r.setor} (ID: ${r.id}): ${r.error}`);
      });
  }
  
  console.log('\n🎉 Processo concluído!');
}

// Executar
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = {
  buscarEnderecoPorCep,
  geocodificarEndereco,
  montarQueryBusca,
  buscarSetores,
  atualizarCoordenadas,
  processarSetor
};