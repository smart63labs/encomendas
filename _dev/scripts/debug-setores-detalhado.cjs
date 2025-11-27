// Usando fetch global do Node.js

async function debugSetoresDetalhado() {
  try {
    console.log('🔍 Investigando estrutura detalhada dos setores...');
    
    const response = await fetch('http://localhost:3001/api/setores');
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    const setores = data.data || [];
    
    console.log(`\n📊 Total de setores encontrados: ${setores.length}`);
    console.log('\n📋 Estrutura dos primeiros 3 setores:');
    
    setores.slice(0, 3).forEach((setor, index) => {
      console.log(`\n--- Setor ${index + 1} ---`);
      console.log('Campos disponíveis:');
      Object.keys(setor).forEach(key => {
        const value = setor[key];
        console.log(`  ${key}: ${value || 'null/undefined'}`);
      });
    });
    
    // Verificar se existe algum campo relacionado a endereço
    console.log('\n🏠 Campos relacionados a endereço encontrados:');
    const camposEndereco = ['cep', 'endereco', 'logradouro', 'rua', 'avenida', 'numero', 'bairro', 'cidade', 'municipio', 'estado', 'uf'];
    
    const setorExemplo = setores[0] || {};
    const camposEncontrados = camposEndereco.filter(campo => 
      Object.keys(setorExemplo).some(key => 
        key.toLowerCase().includes(campo.toLowerCase())
      )
    );
    
    if (camposEncontrados.length > 0) {
      console.log('  Campos encontrados:', camposEncontrados.join(', '));
    } else {
      console.log('  ❌ Nenhum campo de endereço encontrado');
    }
    
    // Listar todos os campos únicos de todos os setores
    console.log('\n📝 Todos os campos únicos encontrados nos setores:');
    const todosCampos = new Set();
    setores.forEach(setor => {
      Object.keys(setor).forEach(key => todosCampos.add(key));
    });
    
    Array.from(todosCampos).sort().forEach(campo => {
      console.log(`  - ${campo}`);
    });
    
    // Verificar se há setores com dados de localização
    console.log('\n🌍 Verificando dados de localização:');
    const setoresComLocalizacao = setores.filter(setor => {
      return Object.keys(setor).some(key => {
        const keyLower = key.toLowerCase();
        return keyLower.includes('cidade') || 
               keyLower.includes('municipio') || 
               keyLower.includes('endereco') || 
               keyLower.includes('cep') ||
               keyLower.includes('logradouro');
      });
    });
    
    console.log(`  Setores com algum dado de localização: ${setoresComLocalizacao.length}`);
    
    if (setoresComLocalizacao.length > 0) {
      console.log('\n  Exemplos de setores com localização:');
      setoresComLocalizacao.slice(0, 3).forEach((setor, index) => {
        console.log(`\n  --- Setor ${index + 1}: ${setor.setor || setor.nome_setor} ---`);
        Object.keys(setor).forEach(key => {
          const keyLower = key.toLowerCase();
          if (keyLower.includes('cidade') || 
              keyLower.includes('municipio') || 
              keyLower.includes('endereco') || 
              keyLower.includes('cep') ||
              keyLower.includes('logradouro') ||
              keyLower.includes('bairro') ||
              keyLower.includes('estado') ||
              keyLower.includes('uf')) {
            console.log(`    ${key}: ${setor[key] || 'null/undefined'}`);
          }
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao investigar setores:', error);
  }
}

debugSetoresDetalhado();