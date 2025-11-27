const fs = require('fs');
const path = require('path');

// Função para substituir toast por modal em um arquivo
function replaceToastInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Substituir import do useToast
    if (content.includes('import { useToast }')) {
      content = content.replace(
        /import { useToast } from ['"]@?\/?(hooks\/use-toast|\.\.\/\.\.\/hooks\/use-toast)['"];?/g,
        `import { useNotification } from '@/hooks/use-notification';\nimport NotificationModal from '@/components/ui/notification-modal';`
      );
      modified = true;
    }

    // Substituir declaração do hook
    if (content.includes('const { toast } = useToast();')) {
      content = content.replace(
        /const { toast } = useToast\(\);/g,
        'const { notification, isOpen, showError, showSuccess, showInfo, showWarning, hideNotification } = useNotification();'
      );
      modified = true;
    }

    // Substituir chamadas de toast
    const toastRegex = /toast\(\{\s*title:\s*["']([^"']+)["'],\s*description:\s*["']([^"']+)["'],\s*variant:\s*["'](destructive|default)["']\s*\}\);?/g;
    content = content.replace(toastRegex, (match, title, description, variant) => {
      const method = variant === 'destructive' ? 'showError' : 'showInfo';
      return `${method}("${title}", "${description}");`;
    });

    // Substituir chamadas de toast sem variant
    const toastRegexNoVariant = /toast\(\{\s*title:\s*["']([^"']+)["'],\s*description:\s*["']([^"']+)["']\s*\}\);?/g;
    content = content.replace(toastRegexNoVariant, (match, title, description) => {
      return `showInfo("${title}", "${description}");`;
    });

    // Substituir chamadas de toast com template literals
    const toastRegexTemplate = /toast\(\{\s*title:\s*["']([^"']+)["'],\s*description:\s*`([^`]+)`,\s*variant:\s*["'](destructive|default)["']\s*\}\);?/g;
    content = content.replace(toastRegexTemplate, (match, title, description, variant) => {
      const method = variant === 'destructive' ? 'showError' : 'showInfo';
      return `${method}("${title}", \`${description}\`);`;
    });

    // Adicionar NotificationModal antes do fechamento do componente principal
    if (content.includes('export default') && !content.includes('NotificationModal')) {
      // Encontrar o último return statement antes do export
      const returnRegex = /(\s+)(return\s*\(\s*<[^>]+>[\s\S]*?<\/[^>]+>\s*\);?\s*)/;
      const match = content.match(returnRegex);
      
      if (match) {
        const indent = match[1];
        const returnStatement = match[2];
        
        // Adicionar o modal antes do fechamento da div principal
        const modifiedReturn = returnStatement.replace(
          /(<\/[^>]+>\s*\);?\s*)$/,
          `\n${indent}  {/* Modal de Notificação */}\n${indent}  {notification && (\n${indent}    <NotificationModal\n${indent}      isOpen={isOpen}\n${indent}      onClose={hideNotification}\n${indent}      title={notification.title}\n${indent}      description={notification.description}\n${indent}      variant={notification.variant}\n${indent}    />\n${indent}  )}\n${indent}$1`
        );
        
        content = content.replace(returnStatement, modifiedReturn);
        modified = true;
      }
    }

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
  'src/components/encomendas/NovaEncomendaForm.tsx',
  'src/components/encomendas/MapaRastreamento.tsx',
  'src/components/encomendas/NovaEncomendaWizard.tsx',
  'src/components/encomendas/ListaEncomendas.tsx',
  'src/components/encomendas/RastreamentoEncomenda.tsx',
  'src/components/visualizadores/TextViewer.tsx',
  'src/pages/Configuracoes.tsx',
  'src/pages/Tramitacao.tsx',
  'src/pages/Arquivo.tsx',
  'src/hooks/use-cep.ts'
];

console.log('🚀 Iniciando substituição de toast por modais...\n');

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