#!/usr/bin/env node

/**
 * Script para testar se a configuração da API está funcionando corretamente
 * Simula diferentes cenários de acesso (localhost vs rede)
 */

import fs from 'fs';
import path from 'path';

// Função para simular window.location em diferentes cenários
function testApiConfig(hostname, protocol = 'http:') {
  // Simular ambiente do navegador
  const mockWindow = {
    location: {
      hostname,
      protocol
    }
  };
  
  // Simular import.meta.env
  const mockEnv = {
    VITE_API_URL: process.env.VITE_API_URL || undefined
  };
  
  // Lógica da função getApiBaseUrl (copiada do arquivo)
  function getApiBaseUrl() {
    // Se há uma variável de ambiente definida, usar ela (prioridade máxima)
    if (mockEnv.VITE_API_URL) {
      return mockEnv.VITE_API_URL;
    }

    // Se estamos em desenvolvimento local (localhost/127.0.0.1), usar localhost
    if (mockWindow.location.hostname === 'localhost' || mockWindow.location.hostname === '127.0.0.1') {
      return 'http://localhost:3001/api';
    }

    // Caso contrário, usar o mesmo IP/hostname que está servindo o frontend
    const protocol = mockWindow.location.protocol;
    const hostname = mockWindow.location.hostname;
    
    // Assumir que o backend está na porta 3001
    return `${protocol}//${hostname}:3001/api`;
  }
  
  return getApiBaseUrl();
}

console.log('🧪 Testando configuração da API...\n');

// Cenários de teste
const scenarios = [
  {
    name: 'Desenvolvimento Local (localhost)',
    hostname: 'localhost',
    expected: 'http://localhost:3001/api'
  },
  {
    name: 'Desenvolvimento Local (127.0.0.1)',
    hostname: '127.0.0.1',
    expected: 'http://localhost:3001/api'
  },
  {
    name: 'Rede Local (IP específico)',
    hostname: '10.9.1.95',
    expected: 'http://10.9.1.95:3001/api'
  },
  {
    name: 'Rede Local (outro IP)',
    hostname: '192.168.1.100',
    expected: 'http://192.168.1.100:3001/api'
  }
];

// Testar sem variável de ambiente
console.log('📋 Teste 1: Sem variável de ambiente VITE_API_URL');
delete process.env.VITE_API_URL;

scenarios.forEach(scenario => {
  const result = testApiConfig(scenario.hostname);
  const status = result === scenario.expected ? '✅' : '❌';
  console.log(`${status} ${scenario.name}: ${result}`);
  if (result !== scenario.expected) {
    console.log(`   Esperado: ${scenario.expected}`);
  }
});

console.log('\n📋 Teste 2: Com variável de ambiente VITE_API_URL definida');
process.env.VITE_API_URL = 'http://10.9.1.95:3001/api';

scenarios.forEach(scenario => {
  const result = testApiConfig(scenario.hostname);
  const expected = 'http://10.9.1.95:3001/api'; // Deve sempre usar a env var
  const status = result === expected ? '✅' : '❌';
  console.log(`${status} ${scenario.name}: ${result}`);
  if (result !== expected) {
    console.log(`   Esperado: ${expected}`);
  }
});

console.log('\n🔍 Verificando arquivos corrigidos...');

// Lista de arquivos que devem ter sido corrigidos
const filesToCheck = [
  'src/services/geocoding.service.ts',
  'src/services/setores.service.ts',
  'src/components/encomendas/MapaRastreamento.tsx',
  'src/components/encomendas/MapaSetores.tsx',
  'src/components/encomendas/MapaWizard.tsx',
  'src/components/encomendas/MapaRotaOtimaEncomendas.tsx',
  'src/components/encomendas/MapaGeralEncomendas.tsx'
];

let allFixed = true;

filesToCheck.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasHardcodedLocalhost = content.includes('http://localhost:3001') && 
                                  !content.includes('getApiBaseUrl') &&
                                  !content.includes('window.location.hostname');
    
    if (hasHardcodedLocalhost) {
      console.log(`❌ ${filePath}: Ainda contém localhost hardcoded`);
      allFixed = false;
    } else {
      console.log(`✅ ${filePath}: Corrigido`);
    }
  } else {
    console.log(`⚠️  ${filePath}: Arquivo não encontrado`);
  }
});

console.log(`\n${allFixed ? '🎉' : '⚠️'} Status: ${allFixed ? 'Todos os arquivos foram corrigidos!' : 'Alguns arquivos ainda precisam de correção'}`);

console.log('\n📝 Próximos passos:');
console.log('1. Rebuild do frontend: npm run build');
console.log('2. Restart dos containers: docker-compose down && docker-compose up -d');
console.log('3. Testar acesso via: http://10.9.1.95:8080/');
console.log('4. Verificar console do navegador para erros de CORS');