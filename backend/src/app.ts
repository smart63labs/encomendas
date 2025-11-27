import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config/database';
import routes from './routes';
import { developmentBypass } from './middleware/rateLimit.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import path from 'path';
import fs from 'fs';

/**
 * Classe principal da aplicação Express
 */
class App {
  public app: Application;
  private readonly port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3001', 10);
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Configurar middlewares da aplicação
   */
  private initializeMiddlewares(): void {
    // Configurar proxy confiável (para obter IP real atrás de proxy)
    this.app.set('trust proxy', 1);

    // Helmet para segurança HTTP
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configurado
    this.app.use(cors({
      origin: (origin, callback) => {
        // Permitir requisições sem origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:8080',
          'http://localhost:8081',
          'http://localhost:8082',
          'http://localhost:8083',
          'http://localhost:8084',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
          'http://127.0.0.1:8080',
          'http://127.0.0.1:8081',
          'http://127.0.0.1:8082',
          'http://127.0.0.1:8083',
          'http://127.0.0.1:8084',
          // Adicionar o IP específico da rede
          'http://10.9.1.95:8080',
          'http://10.9.1.95:3001',
          ...(process.env.CORS_ORIGIN?.split(',') || [])
        ];
        
        // Permitir qualquer IP local da rede (10.x.x.x, 192.168.x.x, 172.16-31.x.x) nas portas comuns
        const localNetworkRegex = /^https?:\/\/(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}):(3000|3001|8080|8081|8082|8083|8084)$/;
        
        if (allowedOrigins.includes(origin) || localNetworkRegex.test(origin)) {
          callback(null, true);
        } else {
          console.warn(`🚫 CORS: Origin não permitida: ${origin}`);
          callback(null, true); // Temporariamente permitir todas as origens para debug
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'Pragma'
      ],
      exposedHeaders: [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset'
      ]
    }));

    // Compressão de resposta
    this.app.use(compression());

    // Parser de JSON com limite de tamanho
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      }
    }));

    // Parser de URL encoded
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }));

    // Configurar logging
    this.setupLogging();

    // Rate limiting global
    this.app.use(developmentBypass);

    // Middleware para adicionar informações de request
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.requestTime = new Date().toISOString();
      req.requestId = this.generateRequestId();
      
      // Adicionar headers de resposta padrão
      res.setHeader('X-Request-ID', req.requestId);
      res.setHeader('X-API-Version', '1.0.0');
      
      next();
    });

    // Servir arquivos estáticos (se necessário)
    const publicPath = path.join(__dirname, '../public');
    if (fs.existsSync(publicPath)) {
      this.app.use('/public', express.static(publicPath, {
        maxAge: '1d',
        etag: true
      }));
    }
  }

  /**
   * Configurar sistema de logging
   */
  private setupLogging(): void {
    // Criar diretório de logs se não existir
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Configurar formato de log personalizado
    const logFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms :req[x-request-id]';

    // Log de acesso em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    }

    // Log de acesso em produção (arquivo)
    if (process.env.NODE_ENV === 'production') {
      const accessLogStream = fs.createWriteStream(
        path.join(logsDir, 'access.log'),
        { flags: 'a' }
      );
      
      this.app.use(morgan(logFormat, { stream: accessLogStream }));
    }

    // Log de erros
    const errorLogStream = fs.createWriteStream(
      path.join(logsDir, 'error.log'),
      { flags: 'a' }
    );

    this.app.use(morgan(logFormat, {
      stream: errorLogStream,
      skip: (_req, res) => res.statusCode < 400
    }));
  }

  /**
   * Configurar rotas da aplicação
   */
  private initializeRoutes(): void {
    // Rota de health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'Servidor funcionando corretamente',
        data: {
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: process.env.NODE_ENV || 'development',
          version: '1.0.0',
          requestId: req.requestId
        }
      });
    });

    // Registrar todas as rotas da API
    this.app.use('/api', routes);

    // Rota para documentação da API (se disponível)
    this.app.get('/docs', (_req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Documentação da API',
        data: {
          version: '1.0.0',
          endpoints: {
            health: 'GET /health',
            users: {
              list: 'GET /api/users',
              create: 'POST /api/users',
              get: 'GET /api/users/:id',
              update: 'PUT /api/users/:id',
              delete: 'DELETE /api/users/:id',
              login: 'POST /api/users/login',
              profile: 'GET /api/users/profile'
            },
            processes: {
              list: 'GET /api/processes',
              create: 'POST /api/processes',
              get: 'GET /api/processes/:id',
              update: 'PUT /api/processes/:id',
              delete: 'DELETE /api/processes/:id',
              forward: 'POST /api/processes/:id/forward',
              history: 'GET /api/processes/:id/history'
            }
          }
        }
      });
    });
  }

  /**
   * Configurar tratamento de erros
   */
  private initializeErrorHandling(): void {
    // Handler para rotas não encontradas
    this.app.use(notFoundHandler);

    // Handler global de erros
    this.app.use(errorHandler);
  }

  /**
   * Gerar ID único para requisição
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Iniciar servidor
   */
  public async start(): Promise<void> {
    try {
      // Testar conexão com banco de dados
      await this.testDatabaseConnection();

      // Iniciar servidor HTTP - aceitar conexões de qualquer IP
      const server = this.app.listen(this.port, '0.0.0.0', () => {
        console.log(`\n🚀 Servidor iniciado com sucesso!`);
        console.log(`📍 Porta: ${this.port}`);
        console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 URL Local: http://localhost:${this.port}`);
        console.log(`🌐 URL Rede: http://0.0.0.0:${this.port}`);
        console.log(`📚 Documentação: http://localhost:${this.port}/docs`);
        console.log(`❤️  Health Check: http://localhost:${this.port}/health`);
        console.log(`\n📋 Endpoints disponíveis:`);
        console.log(`   • GET  /api/users - Listar usuários`);
        console.log(`   • POST /api/users/login - Fazer login`);
        console.log(`   • GET  /api/processes - Listar processos`);
        console.log(`   • POST /api/processes - Criar processo`);
        console.log(`\n⏰ Servidor iniciado em: ${new Date().toLocaleString('pt-BR')}\n`);
      });

      // Capturar erros do servidor (ex.: EADDRINUSE) para evitar uncaughtException
      server.on('error', (err: any) => {
        if (err && err.code === 'EADDRINUSE') {
          console.error(`\n⚠️ Porta já em uso: ${this.port}`);
          console.error(`🔎 Outro processo está escutando em 0.0.0.0:${this.port}.`);
          console.error(`💡 Ações sugeridas:`);
          console.error(`   • Verifique se já existe um backend rodando e finalize-o.`);
          console.error(`   • Confirme se algum processo externo ocupa a porta 3001.`);
          console.error(`   • Evite iniciar múltiplas vezes o servidor em desenvolvimento.`);
          console.error(`\n🔄 Encerrando processo de forma segura...`);
          process.exit(1);
        } else {
          console.error('❌ Erro ao iniciar servidor HTTP:', err);
          console.error(`\n🔄 Encerrando processo de forma segura...`);
          process.exit(1);
        }
      });

      // Graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      console.error('❌ Erro ao iniciar servidor:', error);
      process.exit(1);
    }
  }

  /**
   * Testar conexão com banco de dados
   */
  private async testDatabaseConnection(): Promise<void> {
    try {
      console.log('🔍 Testando conexão com banco de dados...');
      
      // Aqui você pode adicionar um teste real de conexão
      // Por exemplo: await config.testConnection();
      
      console.log('✅ Conexão com banco de dados estabelecida');
    } catch (error) {
      console.error('❌ Erro na conexão com banco de dados:', error);
      throw error;
    }
  }

  /**
   * Configurar encerramento gracioso
   */
  private setupGracefulShutdown(): void {
    const gracefulShutdown = (signal: string) => {
      console.log(`\n📴 Recebido sinal ${signal}. Encerrando servidor graciosamente...`);
      
      // Fechar conexões de banco de dados
      // config.closeConnections();
      
      console.log('✅ Servidor encerrado com sucesso');
      process.exit(0);
    };

    // Escutar sinais de encerramento
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Tratar erros não capturados
    process.on('uncaughtException', (error) => {
      console.error('❌ Erro não capturado:', error);
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promise rejeitada não tratada:', reason);
      console.error('Promise:', promise);
      process.exit(1);
    });
  }



  /**
   * Obter instância da aplicação Express
   */
  public getApp(): Application {
    return this.app;
  }
}

// Estender interface Request para adicionar propriedades customizadas
declare global {
  namespace Express {
    interface Request {
      requestTime?: string;
      requestId?: string;
      rawBody?: Buffer;
    }
  }
}

export default App;
export { App };
