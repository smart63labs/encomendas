import dotenv from 'dotenv';
import path from 'path';
import App from './app';
// Inicialização do servidor - restart

/**
 * Configurar variáveis de ambiente
 */
const configureEnvironment = (): void => {
  // Carregar arquivo .env baseado no ambiente
  const nodeEnv = process.env.NODE_ENV || 'development';
  const envFile = `.env.${nodeEnv}`;
  const envPath = path.resolve(process.cwd(), envFile);
  
  // Tentar carregar arquivo específico do ambiente
  dotenv.config({ path: envPath });
  
  // Carregar arquivo .env padrão como fallback
  dotenv.config();
  
  console.log(`🔧 Ambiente configurado: ${nodeEnv}`);
  console.log(`📁 Arquivo de configuração: ${envFile}`);
};

/**
 * Validar variáveis de ambiente obrigatórias
 */
const validateEnvironment = (): void => {
  const requiredEnvVars = [
    'DB_HOST',
    'DB_PORT', 
    'DB_SERVICE_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Variáveis de ambiente obrigatórias não encontradas:');
    missingVars.forEach(varName => {
      console.error(`   • ${varName}`);
    });
    console.error('\n💡 Certifique-se de configurar o arquivo .env corretamente.');
    process.exit(1);
  }
  
  console.log('✅ Todas as variáveis de ambiente obrigatórias estão configuradas');
};

/**
 * Exibir informações do sistema
 */
const displaySystemInfo = (): void => {
  console.log('\n' + '='.repeat(60));
  console.log('🏢 SISTEMA DE PROTOCOLO - BACKEND API');
  console.log('='.repeat(60));
  console.log(`📅 Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`🖥️  Node.js: ${process.version}`);
  console.log(`💾 Memória: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
  console.log(`🆔 PID: ${process.pid}`);
  console.log(`📂 Diretório: ${process.cwd()}`);
  console.log('='.repeat(60) + '\n');
};

/**
 * Função principal para inicializar o servidor
 */
const startServer = async (): Promise<void> => {
  try {
    // Exibir informações do sistema
    displaySystemInfo();
    
    // Configurar ambiente
    configureEnvironment();
    
    // Validar variáveis de ambiente
    validateEnvironment();
    
    // Inicializar conexão com banco de dados
    console.log('🔌 Inicializando conexão com banco de dados...');
    const { DatabaseService } = await import('./config/database');
    await DatabaseService.initialize();
    
    // Criar e iniciar aplicação
    console.log('🚀 Inicializando aplicação...');
    const app = new App();
    
    await app.start();
    
  } catch (error) {
    console.error('\n❌ Erro fatal ao inicializar servidor:');
    console.error(error);
    console.error('\n🔄 Encerrando processo...');
    process.exit(1);
  }
};

/**
 * Configurar handlers para sinais do sistema
 */
const setupProcessHandlers = (): void => {
  // Handler para erros não capturados
  process.on('uncaughtException', (error: Error) => {
    console.error('\n💥 ERRO NÃO CAPTURADO:');
    console.error(error);
    console.error('\n🔄 Encerrando processo de forma segura...');
    process.exit(1);
  });
  
  // Handler para promises rejeitadas não tratadas
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('\n💥 PROMISE REJEITADA NÃO TRATADA:');
    console.error('Motivo:', reason);
    console.error('Promise:', promise);
    console.error('\n🔄 Encerrando processo de forma segura...');
    process.exit(1);
  });
  
  // Handler para sinais de encerramento
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n📴 Sinal ${signal} recebido. Iniciando encerramento gracioso...`);
    
    try {
      // Fechar conexões de banco de dados
      const { DatabaseService } = await import('./config/database');
      if (DatabaseService.isPoolActive()) {
        console.log('🔌 Fechando pool de conexões Oracle...');
        await DatabaseService.close();
      }
      
      console.log('✅ Encerramento gracioso concluído');
      process.exit(0);
    } catch (error) {
      console.error('❌ Erro durante encerramento gracioso:', error);
      process.exit(1);
    }
  };
  
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

/**
 * Verificar se o script está sendo executado diretamente
 */
if (require.main === module) {
  // Configurar handlers de processo
  setupProcessHandlers();
  
  // Iniciar servidor
  startServer();
}

// Exportar para uso em testes
export { startServer, configureEnvironment, validateEnvironment };

// Trigger restart
export default startServer;
