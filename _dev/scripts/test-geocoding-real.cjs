// Usando fetch global do Node.js

async function testarGeocodificacaoReal() {
  console.log('🌍 Testando geocodificação com CEPs reais dos setores...');
  
  const cepsReais = [
    { cep: '77700-000', cidade: 'Guaraí', setor: 'Recursos Humanos' },
    { cep: '77960-000', cidade: 'Augustinópolis', setor: 'Tecnologia da Informação' },
    { cep: '77760-000', cidade: 'Colinas do Tocantins', setor: 'Auditoria' }
  ];
  
  for (const item of cepsReais) {
    console.log(`\n🔍 Testando ${item.setor} - ${item.cidade}`);
    console.log(`   CEP: ${item.cep}`);
    
    try {
      // 1. Buscar endereço via ViaCEP
      const cepNumerico = item.cep.replace(/\D/g, '');
      const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cepNumerico}/json/`);
      const viaCepData = await viaCepResponse.json();
      
      if (viaCepData.erro) {
        console.log(`   ❌ CEP não encontrado no ViaCEP`);
        continue;
      }
      
      console.log(`   📍 ViaCEP: ${viaCepData.logradouro || 'N/A'}, ${viaCepData.bairro || 'N/A'}, ${viaCepData.localidade}/${viaCepData.uf}`);
      
      // 2. Geocodificar via Nominatim
      const partes = [];
      if (viaCepData.logradouro) partes.push(viaCepData.logradouro);
      if (viaCepData.bairro) partes.push(viaCepData.bairro);
      if (viaCepData.localidade) partes.push(viaCepData.localidade);
      if (viaCepData.uf) partes.push(viaCepData.uf);
      partes.push('Brasil');
      
      const query = partes.join(', ');
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=br&addressdetails=1`;
      
      console.log(`   🔍 Query: ${query}`);
      
      const nominatimResponse = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'Sistema-Protocolo-SEFAZ-TO/1.0'
        }
      });
      
      const nominatimData = await nominatimResponse.json();
      
      if (nominatimData && nominatimData.length > 0) {
        const result = nominatimData[0];
        console.log(`   ✅ Coordenadas: ${result.lat}, ${result.lon}`);
        console.log(`   📍 Endereço completo: ${result.display_name}`);
        
        // Verificar se está no Tocantins
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        
        // Limites aproximados do Tocantins
        const tocantinsBounds = {
          north: -5.0,
          south: -13.5,
          east: -45.0,
          west: -51.0
        };
        
        const noTocantins = lat >= tocantinsBounds.south && 
                           lat <= tocantinsBounds.north && 
                           lng >= tocantinsBounds.west && 
                           lng <= tocantinsBounds.east;
        
        console.log(`   🗺️ Localização: ${noTocantins ? '✅ Tocantins' : '❌ Fora do Tocantins'}`);
        
      } else {
        console.log(`   ❌ Coordenadas não encontradas no Nominatim`);
      }
      
      // Aguardar para não sobrecarregar as APIs
      await new Promise(resolve => setTimeout(resolve, 1500));
      
    } catch (error) {
      console.log(`   ❌ Erro ao testar CEP ${item.cep}:`, error.message);
    }
  }
  
  console.log('\n🏁 Teste de geocodificação concluído!');
}

testarGeocodificacaoReal();