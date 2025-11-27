#!/usr/bin/env node

/**
 * Script para testar a lógica de paginação das encomendas
 */

// Simular a função getItemsPerPage
function getItemsPerPage(viewMode) {
  // Ambos os modos agora usam 10 itens por página
  return 10;
}

// Simular dados de teste
const testScenarios = [
  { viewMode: 'list', totalItems: 25, expectedPages: 3, expectedLastPageItems: 5 },
  { viewMode: 'grid', totalItems: 25, expectedPages: 3, expectedLastPageItems: 7 },
  { viewMode: 'list', totalItems: 10, expectedPages: 1, expectedLastPageItems: 10 },
  { viewMode: 'grid', totalItems: 9, expectedPages: 1, expectedLastPageItems: 9 },
  { viewMode: 'list', totalItems: 50, expectedPages: 5, expectedLastPageItems: 10 },
  { viewMode: 'grid', totalItems: 50, expectedPages: 6, expectedLastPageItems: 5 }
];

console.log('🧪 Testando lógica de paginação das encomendas...\n');

testScenarios.forEach((scenario, index) => {
  const itemsPerPage = getItemsPerPage(scenario.viewMode);
  const totalPages = Math.ceil(scenario.totalItems / itemsPerPage);
  const lastPageItems = scenario.totalItems % itemsPerPage || itemsPerPage;
  
  const status = totalPages === scenario.expectedPages && lastPageItems === scenario.expectedLastPageItems ? '✅' : '❌';
  
  console.log(`${status} Teste ${index + 1}: ${scenario.viewMode.toUpperCase()}`);
  console.log(`   Total de itens: ${scenario.totalItems}`);
  console.log(`   Itens por página: ${itemsPerPage}`);
  console.log(`   Páginas calculadas: ${totalPages} (esperado: ${scenario.expectedPages})`);
  console.log(`   Itens na última página: ${lastPageItems} (esperado: ${scenario.expectedLastPageItems})`);
  
  if (status === '❌') {
    console.log(`   ⚠️  ERRO: Resultado não confere com o esperado!`);
  }
  console.log('');
});

console.log('📋 Resumo da configuração:');
console.log('• LIST (modo tabela/GridList): 10 itens por página');
console.log('• GRID (modo cards/CardList): 9 itens por página');
console.log('• Página é resetada quando o modo de visualização muda');
console.log('• Endereços são pré-carregados apenas para itens visíveis');

console.log('\n🎯 Benefícios:');
console.log('• LIST (tabela): Melhor aproveitamento vertical da tabela');
console.log('• GRID (cards): Layout 3x3 perfeito para cards em telas grandes');
console.log('• Performance: Menos dados carregados por vez no modo cards');