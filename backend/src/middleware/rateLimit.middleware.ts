import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';

/**
 * Interface para configuração do rate limiter
 */
interface RateLimitConfig {
  windowMs?: number;     // Janela de tempo em milissegundos (padrão: 15 minutos)
  max?: number;          // Máximo de requisições por janela (padrão: 100)
  message?: string;      // Mensagem personalizada
  skipSuccessfulRequests?: boolean; // Pular requisições bem-sucedidas
  skipFailedRequests?: boolean;     // Pular requisições com falha
  keyGenerator?: (req: Request) => string; // Função para gerar chave personalizada
}

/**
 * Cache para armazenar instâncias de rate limiters
 */
const rateLimiters = new Map<string, RateLimiterMemory>();

/**
 * Função para obter ou criar um rate limiter
 */
function getRateLimiter(config: RateLimitConfig): RateLimiterMemory {
  const key = JSON.stringify(config);
  
  if (!rateLimiters.has(key)) {
    const limiter = new RateLimiterMemory({
      points: config.max || 100,
      duration: Math.floor((config.windowMs || 15 * 60 * 1000) / 1000), // Converter para segundos
    });
    
    rateLimiters.set(key, limiter);
  }
  
  return rateLimiters.get(key)!;
}

/**
 * Middleware de rate limiting
 */
export const rateLimitMiddleware = (config: RateLimitConfig = {}) => {
  const limiter = getRateLimiter(config);
  const defaultMessage = config.message || 'Muitas requisições. Tente novamente mais tarde.';
  
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Gerar chave para identificar o cliente
      let key: string;
      
      if (config.keyGenerator) {
        key = config.keyGenerator(req);
      } else {
        // Usar IP como chave padrão
        key = req.ip || req.connection.remoteAddress || 'unknown';
        
        // Se houver usuário autenticado, usar ID do usuário
        const user = (req as any).user;
        if (user && user.userId) {
          key = `user:${user.userId}`;
        }
      }
      
      // Tentar consumir um ponto
      const result: RateLimiterRes = await limiter.consume(key);
      
      // Adicionar headers informativos
      res.set({
        'X-RateLimit-Limit': String(config.max || 100),
        'X-RateLimit-Remaining': String(result.remainingPoints || 0),
        'X-RateLimit-Reset': String(new Date(Date.now() + (result.msBeforeNext || 0)))
      });
      
      next();
    } catch (rateLimiterRes) {
      // Rate limit excedido
      const result = rateLimiterRes as RateLimiterRes;
      const retryAfter = Math.round(result.msBeforeNext / 1000) || 1;
      
      res.set({
        'X-RateLimit-Limit': String(config.max || 100),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(new Date(Date.now() + result.msBeforeNext)),
        'Retry-After': String(retryAfter)
      });
      
      res.status(429).json({
        success: false,
        message: defaultMessage,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          details: `Limite de ${config.max || 100} requisições por ${Math.floor((config.windowMs || 15 * 60 * 1000) / 60000)} minutos excedido`,
          retryAfter: retryAfter
        },
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Rate limiter específico para login (mais restritivo)
 */
export const loginRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas por IP
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  keyGenerator: (req: Request) => {
    // Usar combinação de IP e email para login
    const email = req.body?.email || 'unknown';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return `login:${ip}:${email}`;
  }
});

/**
 * Rate limiter para criação de recursos
 */
export const createResourceRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // 20 criações por usuário
  message: 'Muitas criações de recursos. Tente novamente mais tarde.'
});

/**
 * Rate limiter para APIs públicas
 */
export const publicApiRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por IP
  message: 'Limite de requisições da API excedido. Tente novamente mais tarde.'
});

/**
 * Rate limiter para mudança de senha
 */
export const passwordChangeRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 3, // 3 tentativas por usuário
  message: 'Muitas tentativas de mudança de senha. Tente novamente em 15 minutos.'
});

/**
 * Rate limiter para recuperação de senha
 */
export const passwordResetRateLimit = rateLimitMiddleware({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 tentativas por email
  message: 'Muitas tentativas de recuperação de senha. Tente novamente em 1 hora.',
  keyGenerator: (req: Request) => {
    const email = req.body?.email || 'unknown';
    return `password-reset:${email}`;
  }
});

/**
 * Rate limiter para upload de arquivos
 */
export const fileUploadRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 uploads por usuário
  message: 'Muitos uploads de arquivo. Tente novamente mais tarde.'
});

/**
 * Rate limiter para busca/pesquisa
 */
export const searchRateLimit = rateLimitMiddleware({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // 30 buscas por minuto
  message: 'Muitas buscas realizadas. Aguarde um momento antes de buscar novamente.'
});

/**
 * Rate limiter para operações administrativas
 */
export const adminRateLimit = rateLimitMiddleware({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 50, // 50 operações por administrador
  message: 'Muitas operações administrativas. Aguarde alguns minutos.'
});

/**
 * Middleware para aplicar rate limiting baseado no tipo de operação
 */
export const dynamicRateLimit = (operationType: string) => {
  const configs: { [key: string]: RateLimitConfig } = {
    'login': {
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: 'Muitas tentativas de login'
    },
    'create': {
      windowMs: 15 * 60 * 1000,
      max: 20,
      message: 'Muitas criações de recursos'
    },
    'update': {
      windowMs: 5 * 60 * 1000,
      max: 50,
      message: 'Muitas atualizações'
    },
    'delete': {
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: 'Muitas exclusões'
    },
    'search': {
      windowMs: 1 * 60 * 1000,
      max: 30,
      message: 'Muitas buscas'
    },
    'default': {
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Muitas requisições'
    }
  };
  
  const config = configs[operationType] || configs['default'];
  return rateLimitMiddleware(config);
};

/**
 * Função para limpar cache de rate limiters (útil para testes)
 */
export const clearRateLimitCache = (): void => {
  rateLimiters.clear();
};

/**
 * Função para obter estatísticas de rate limiting
 */
export const getRateLimitStats = (): { [key: string]: any } => {
  const stats: { [key: string]: any } = {};
  
  rateLimiters.forEach((limiter, key) => {
    stats[key] = {
      // TODO: Implementar estatísticas do rate limiter quando disponíveis na biblioteca
      // totalHits: limiter.totalHits || 0,
      // Outras estatísticas podem ser adicionadas conforme necessário
    };
  });
  
  return stats;
};

/**
 * Middleware para bypass de rate limiting em desenvolvimento
 */
export const developmentBypass = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_RATE_LIMIT === 'true') {
    next();
    return;
  }
  
  // Em produção, aplicar rate limiting padrão
  publicApiRateLimit(req, res, next);
};

export default rateLimitMiddleware;