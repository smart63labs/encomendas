const fs = require('fs');
const path = require('path');

// Função para substituir toast por modal em um arquivo
function replaceToastInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Substituir import do useToast se ainda existir
    if (content.includes('import { useToast }')) {
      content = content.replace(
        /import { useToast } from ['"]@?\/?(hooks\/use-toast|\.\.\/\.\.\/hooks\/use-toast)['"];?/g,
        `import { useNotification } from '@/hooks/use-notification';\nimport NotificationModal from '@/components/ui/notification-modal';`
      );
      modified = true;
    }

    // Substituir declaração do hook se ainda existir
    if (content.includes('const { toast } = useToast();')) {
      content = content.replace(
        /const { toast } = useToast\(\);/g,
        'const { notification, isOpen, showError, showSuccess, showInfo, showWarning, hideNotification } = useNotification();'
      );
      modified = true;
    }

    // Padrão mais flexível para capturar todas as variações de toast
    const toastPattern = /toast\(\{\s*title:\s*["'`]([^"'`]+)["'`],\s*description:\s*["'`]([^"'`]+)["'`](?:,\s*variant:\s*["'`](destructive|default)["'`])?\s*\}\);?/g;
    
    let match;
    while ((match = toastPattern.exec(content)) !== null) {
      const [fullMatch, title, description, variant] = match;
      let method = 'showInfo';
      
      if (variant === 'destructive') {
        method = 'showError';
      } else if (title.toLowerCase().includes('sucesso') || title.toLowerCase().includes('success')) {
        method = 'showSuccess';
      } else if (title.toLowerCase().includes('aviso') || title.toLowerCase().includes('warning')) {
        method = 'showWarning';
      }
      
      const replacement = `${method}("${title}", "${description}");`;
      content = content.replace(fullMatch, replacement);
      modified = true;
    }

    // Padrão para template literals
    const toastTemplatePattern = /toast\(\{\s*title:\s*["'`]([^"'`]+)["'`],\s*description:\s*`([^`]+)`,?\s*(?:variant:\s*["'`](destructive|default)["'`])?\s*\}\);?/g;
    
    while ((match = toastTemplatePattern.exec(content)) !== null) {
      const [fullMatch, title, description, variant] = match;
      let method = 'showInfo';
      
      if (variant === 'destructive') {
        method = 'showError';
      } else if (title.toLowerCase().includes('sucesso') || title.toLowerCase().includes('success')) {
        method = 'showSuccess';
      }
      
      const replacement = `${method}("${title}", \`${description}\`);`;
      content = content.replace(fullMatch, replacement);
      modified = true;
    }

    // Padrão para chamadas com variáveis
    const toastVariablePattern = /toast\(\{\s*title:\s*["'`]([^"'`]+)["'`],\s*description:\s*([^,}]+),?\s*(?:variant:\s*["'`](destructive|default)["'`])?\s*\}\);?/g;
    
    while ((match = toastVariablePattern.exec(content)) !== null) {
      const [fullMatch, title, description, variant] = match;
      let method = 'showInfo';
      
      if (variant === 'destructive') {
        method = 'showError';
      } else if (title.toLowerCase().includes('sucesso') || title.toLowerCase().includes('success')) {
        method = 'showSuccess';
      }
      
      const replacement = `${method}("${title}", ${description.trim()});`;
      content = content.replace(fullMatch, replacement);
      modified = true;
    }

    // Adicionar NotificationModal se não existir e há imports de useNotification
    if (content.includes('useNotification') && !content.includes('NotificationModal') && !content.includes('{/* Modal de Notificação */}')) {
      // Encontrar o último return statement antes do export
      const returnRegex = /(.*)(return\s*\(\s*<[^>]+>[\s\S]*?<\/[^>]+>\s*\);?\s*)/;
      const match = content.match(returnRegex);
      
      if (match) {
        const beforeReturn = match[1];
        const returnStatement = match[2];
        
        // Determinar indentação
        const lines = beforeReturn.split('\n');
        const lastLine = lines[lines.length - 1];
        const indent = lastLine.match(/^(\s*)/)[1];
        
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
  'src/components/encomendas/NovaEncomendaWizard.tsx',
  'src/components/encomendas/ListaEncomendas.tsx',
  'src/components/visualizadores/TextViewer.tsx',
  'src/pages/Configuracoes.tsx',
  'src/pages/Tramitacao.tsx',
  'src/pages/Arquivo.tsx'
];

console.log('🚀 Iniciando substituição avançada de toast por modais...\n');

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