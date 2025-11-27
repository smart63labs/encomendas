const fs = require('fs');
const path = require('path');

// Função para substituir toast por modal em um arquivo
function replaceToastInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Substituir todas as variações de toast com quebras de linha
    const patterns = [
      // Padrão com quebras de linha e espaços
      /toast\(\{\s*\n\s*title:\s*["']([^"']+)["'],\s*\n\s*description:\s*["']([^"']+)["'],\s*\n\s*variant:\s*["'](destructive|default)["'],?\s*\n\s*\}\);?/g,
      
      // Padrão sem variant com quebras de linha
      /toast\(\{\s*\n\s*title:\s*["']([^"']+)["'],\s*\n\s*description:\s*["']([^"']+)["'],?\s*\n\s*\}\);?/g,
      
      // Padrão inline com variant
      /toast\(\{\s*title:\s*["']([^"']+)["'],\s*description:\s*["']([^"']+)["'],\s*variant:\s*["'](destructive|default)["']\s*\}\);?/g,
      
      // Padrão inline sem variant
      /toast\(\{\s*title:\s*["']([^"']+)["'],\s*description:\s*["']([^"']+)["']\s*\}\);?/g,
      
      // Padrão com template literals
      /toast\(\{\s*\n?\s*title:\s*["']([^"']+)["'],\s*\n?\s*description:\s*`([^`]+)`,?\s*\n?\s*(?:variant:\s*["'](destructive|default)["'],?)?\s*\n?\s*\}\);?/g
    ];

    patterns.forEach(pattern => {
      content = content.replace(pattern, (match, title, description, variant) => {
        let method = 'showInfo';
        
        if (variant === 'destructive') {
          method = 'showError';
        } else if (title.toLowerCase().includes('sucesso') || title.toLowerCase().includes('success') || title.toLowerCase().includes('concluído')) {
          method = 'showSuccess';
        } else if (title.toLowerCase().includes('aviso') || title.toLowerCase().includes('warning')) {
          method = 'showWarning';
        }
        
        // Se description contém template literal, manter
        if (description && description.includes('${')) {
          return `${method}("${title}", \`${description}\`);`;
        } else {
          return `${method}("${title}", "${description}");`;
        }
      });
      modified = true;
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Arquivo atualizado: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️  Nenhuma alteração necessária: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message);
    return false;
  }
}

// Lista de arquivos para processar
const filesToProcess = [
  'src/components/encomendas/NovaEncomendaWizard.tsx',
  'src/components/encomendas/ListaEncomendas.tsx',
  'src/components/visualizadores/TextViewer.tsx',
  'src/pages/Configuracoes.tsx',
  'src/pages/Tramitacao.tsx',
  'src/pages/Arquivo.tsx'
];

console.log('🚀 Iniciando correção manual de toast por modais...\n');

let processedCount = 0;
filesToProcess.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    if (replaceToastInFile(fullPath)) {
      processedCount++;
    }
  } else {
    console.log(`⚠️  Arquivo não encontrado: ${fullPath}`);
  }
});

console.log(`\n✨ Processamento concluído! ${processedCount} arquivos foram modificados.`);