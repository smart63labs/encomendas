import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';

/**
 * Interface para erro de validação formatado
 */
interface FormattedValidationError {
  field: string;
  message: string;
  value?: any;
  location?: string;
}

/**
 * Middleware para validar requisições usando express-validator
 * Coleta todos os erros de validação e retorna uma resposta formatada
 */
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Obter resultados da validação
    const errors = validationResult(req);
    
    // Se não há erros, continuar
    if (errors.isEmpty()) {
      next();
      return;
    }

    // Formatar erros de validação
    const formattedErrors: FormattedValidationError[] = errors.array().map((error: any) => {
      const baseError: FormattedValidationError = {
        field: error.path || error.param || 'unknown',
        message: error.msg,
        location: error.location
      };

      // Adicionar valor se disponível
      if (error.value !== undefined) {
        baseError.value = error.value;
      }

      return baseError;
    });

    // Agrupar erros por campo para melhor legibilidade
    const errorsByField: { [key: string]: string[] } = {};
    formattedErrors.forEach(error => {
      if (!errorsByField[error.field]) {
        errorsByField[error.field] = [];
      }
      errorsByField[error.field].push(error.message);
    });

    // Criar mensagem de erro principal
    const fieldCount = Object.keys(errorsByField).length;
    const errorCount = formattedErrors.length;
    const mainMessage = `Erro${errorCount > 1 ? 's' : ''} de validação em ${fieldCount} campo${fieldCount > 1 ? 's' : ''}`;

    // Retornar resposta de erro
    res.status(400).json({
      success: false,
      message: mainMessage,
      error: {
        code: 'VALIDATION_ERROR',
        details: 'Os dados fornecidos não atendem aos critérios de validação',
        fields: errorsByField,
        errors: formattedErrors
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro no middleware de validação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        details: 'Erro durante a validação da requisição'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware para sanitizar dados de entrada
 * Remove campos não permitidos e aplica transformações básicas
 */
export const sanitizeInput = (allowedFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (req.body && typeof req.body === 'object') {
        // Criar novo objeto apenas com campos permitidos
        const sanitizedBody: any = {};
        
        allowedFields.forEach(field => {
          if (req.body.hasOwnProperty(field)) {
            let value = req.body[field];
            
            // Aplicar sanitização básica
            if (typeof value === 'string') {
              // Remover espaços em branco no início e fim
              value = value.trim();
              
              // Converter string vazia para null
              if (value === '') {
                value = null;
              }
            }
            
            sanitizedBody[field] = value;
          }
        });
        
        req.body = sanitizedBody;
      }
      
      next();
    } catch (error) {
      console.error('Erro no middleware de sanitização:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          details: 'Erro durante a sanitização dos dados'
        },
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Middleware para validar tipos de arquivo
 */
export const validateFileType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Verificar se há arquivos na requisição
      if (!req.file && !req.files) {
        next();
        return;
      }

      const files = req.files ? (Array.isArray(req.files) ? req.files : [req.file]) : [req.file];
      
      for (const file of files) {
        if (file && !allowedTypes.includes(file.mimetype)) {
          res.status(400).json({
            success: false,
            message: 'Tipo de arquivo não permitido',
            error: {
              code: 'INVALID_FILE_TYPE',
              details: `Tipos permitidos: ${allowedTypes.join(', ')}`,
              receivedType: file.mimetype
            },
            timestamp: new Date().toISOString()
          });
          return;
        }
      }
      
      next();
    } catch (error) {
      console.error('Erro no middleware de validação de arquivo:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          details: 'Erro durante a validação do arquivo'
        },
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Middleware para validar tamanho de arquivo
 */
export const validateFileSize = (maxSizeInMB: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Verificar se há arquivos na requisição
      if (!req.file && !req.files) {
        next();
        return;
      }

      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      const files = req.files ? (Array.isArray(req.files) ? req.files : [req.file]) : [req.file];
      
      for (const file of files) {
        if (file && file.size > maxSizeInBytes) {
          res.status(400).json({
            success: false,
            message: 'Arquivo muito grande',
            error: {
              code: 'FILE_TOO_LARGE',
              details: `Tamanho máximo permitido: ${maxSizeInMB}MB`,
              fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`
            },
            timestamp: new Date().toISOString()
          });
          return;
        }
      }
      
      next();
    } catch (error) {
      console.error('Erro no middleware de validação de tamanho:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          details: 'Erro durante a validação do tamanho do arquivo'
        },
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Middleware para validar parâmetros de paginação
 */
export const validatePagination = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { page, limit } = req.query;
    
    // Validar página
    if (page !== undefined) {
      const pageNum = parseInt(page as string);
      if (isNaN(pageNum) || pageNum < 1) {
        res.status(400).json({
          success: false,
          message: 'Parâmetro de página inválido',
          error: {
            code: 'INVALID_PAGE_PARAMETER',
            details: 'Página deve ser um número inteiro positivo'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }
    }
    
    // Validar limite
    if (limit !== undefined) {
      const limitNum = parseInt(limit as string);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({
          success: false,
          message: 'Parâmetro de limite inválido',
          error: {
            code: 'INVALID_LIMIT_PARAMETER',
            details: 'Limite deve ser um número entre 1 e 100'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }
    }
    
    next();
  } catch (error) {
    console.error('Erro no middleware de validação de paginação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        details: 'Erro durante a validação dos parâmetros de paginação'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware para validar formato de data
 */
export const validateDateFormat = (dateFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const errors: string[] = [];
      
      dateFields.forEach(field => {
        const value = req.body[field] || req.query[field];
        
        if (value !== undefined && value !== null && value !== '') {
          const date = new Date(value);
          
          if (isNaN(date.getTime())) {
            errors.push(`Campo '${field}' deve conter uma data válida`);
          }
        }
      });
      
      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Formato de data inválido',
          error: {
            code: 'INVALID_DATE_FORMAT',
            details: errors.join(', ')
          },
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      next();
    } catch (error) {
      console.error('Erro no middleware de validação de data:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          details: 'Erro durante a validação de formato de data'
        },
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Middleware para validar IDs numéricos em parâmetros
 */
export const validateNumericId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const id = req.params[paramName];
      
      if (!id) {
        res.status(400).json({
          success: false,
          message: `Parâmetro '${paramName}' é obrigatório`,
          error: {
            code: 'MISSING_PARAMETER',
            details: `O parâmetro '${paramName}' deve ser fornecido`
          },
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      const numericId = parseInt(id);
      
      if (isNaN(numericId) || numericId < 1) {
        res.status(400).json({
          success: false,
          message: `Parâmetro '${paramName}' inválido`,
          error: {
            code: 'INVALID_ID_PARAMETER',
            details: `O parâmetro '${paramName}' deve ser um número inteiro positivo`
          },
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      next();
    } catch (error) {
      console.error('Erro no middleware de validação de ID:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          details: 'Erro durante a validação do ID'
        },
        timestamp: new Date().toISOString()
      });
    }
  };
};

export default validateRequest;