import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'express-validator';

/**
 * Interface para erro customizado
 */
interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
  isOperational?: boolean;
}

/**
 * Classe para erros da aplicação
 */
export class AppError extends Error implements CustomError {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erros específicos da aplicação
 */
export class ValidationAppError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Token de autenticação inválido ou expirado') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Acesso negado. Permissões insuficientes') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Recurso') {
    super(`${resource} não encontrado`, 404, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(
      message || `Erro no serviço externo: ${service}`,
      503,
      'EXTERNAL_SERVICE_ERROR',
      { service }
    );
  }
}

/**
 * Função para determinar se um erro é operacional
 */
const isOperationalError = (error: any): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Função para formatar erros de validação do express-validator
 */
const formatValidationErrors = (errors: ValidationError[]): any => {
  const formattedErrors: { [key: string]: string[] } = {};
  
  errors.forEach((error) => {
    const field = error.type === 'field' ? error.path : 'general';
    
    if (!formattedErrors[field]) {
      formattedErrors[field] = [];
    }
    
    formattedErrors[field].push(error.msg);
  });
  
  return formattedErrors;
};

/**
 * Função para log de erros
 */
const logError = (error: CustomError, req: Request): void => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.userId,
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack,
      details: error.details
    }
  };

  // Em desenvolvimento, mostrar erro completo no console
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Erro capturado:', JSON.stringify(errorInfo, null, 2));
  } else {
    // Em produção, log mais simples
    console.error(`[${errorInfo.timestamp}] ${error.name}: ${error.message}`);
    
    // Aqui você pode integrar com serviços de logging como Winston, Sentry, etc.
    // logger.error(errorInfo);
  }
};

/**
 * Middleware de tratamento de erros
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let customError: CustomError = error;

  // Converter erros conhecidos para CustomError
  if (!(error instanceof AppError)) {
    // Erro de validação do Mongoose/Sequelize
    if (error.name === 'ValidationError') {
      customError = new ValidationAppError(
        'Dados inválidos fornecidos',
        error.errors
      );
    }
    // Erro de cast do Mongoose
    else if (error.name === 'CastError') {
      customError = new ValidationAppError(
        `ID inválido: ${error.value}`
      );
    }
    // Erro de chave duplicada
    else if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      customError = new ConflictError(
        `${field} já existe no sistema`
      );
    }
    // Erro de JWT
    else if (error.name === 'JsonWebTokenError') {
      customError = new AuthenticationError('Token inválido');
    }
    else if (error.name === 'TokenExpiredError') {
      customError = new AuthenticationError('Token expirado');
    }
    // Erro de sintaxe JSON
    else if (error instanceof SyntaxError && 'body' in error) {
      customError = new ValidationAppError(
        'JSON inválido na requisição'
      );
    }
    // Erro genérico
    else {
      customError = new AppError(
        process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'Erro interno do servidor',
        error.statusCode || 500,
        error.code || 'INTERNAL_ERROR'
      );
    }
  }

  // Log do erro
  logError(customError, req);

  // Preparar resposta de erro
  const errorResponse: any = {
    success: false,
    message: customError.message,
    error: {
      code: customError.code || 'INTERNAL_ERROR',
      statusCode: customError.statusCode || 500
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  };

  // Adicionar detalhes em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.details = customError.details;
    errorResponse.error.stack = customError.stack;
  }

  // Adicionar detalhes específicos para erros de validação
  if (customError instanceof ValidationAppError && customError.details) {
    errorResponse.error.validationErrors = customError.details;
  }

  // Enviar resposta
  res.status(customError.statusCode || 500).json(errorResponse);
};

/**
 * Middleware para capturar rotas não encontradas
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new NotFoundError(`Rota ${req.method} ${req.originalUrl}`);
  next(error);
};

/**
 * Middleware para capturar erros assíncronos
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware para validar se o erro é operacional
 */
export const operationalErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!isOperationalError(error)) {
    // Se não for um erro operacional, pode ser um bug
    console.error('🐛 Possível bug detectado:', error);
    
    // Em produção, você pode querer reiniciar o processo
    if (process.env.NODE_ENV === 'production') {
      console.error('🔄 Considerando reinicialização do processo...');
    }
  }
  
  next(error);
};

/**
 * Função utilitária para criar respostas de sucesso padronizadas
 */
export const successResponse = (
  res: Response,
  data: any = null,
  message: string = 'Operação realizada com sucesso',
  statusCode: number = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Função utilitária para criar respostas paginadas
 */
export const paginatedResponse = (
  res: Response,
  data: any[],
  total: number,
  page: number,
  limit: number,
  message: string = 'Dados recuperados com sucesso'
): Response => {
  const totalPages = Math.ceil(total / limit);
  
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Middleware para timeout de requisições
 */
export const timeoutHandler = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        const error = new AppError(
          'Tempo limite da requisição excedido',
          408,
          'REQUEST_TIMEOUT'
        );
        next(error);
      }
    }, timeoutMs);

    // Limpar timeout quando a resposta for enviada
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

export default {
  AppError,
  ValidationAppError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  operationalErrorHandler,
  successResponse,
  paginatedResponse,
  timeoutHandler
};