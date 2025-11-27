import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model';

/**
 * Interface para o payload do JWT
 */
interface JWTPayload {
  userId: number;
  email: string;
  nome: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Interface para Request autenticado
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    email: string;
    nome: string;
    role: string;
    isActive: boolean; // propriedade padronizada
    setorId?: number; // ID do setor do usuário
  };
}

/**
 * Middleware de autenticação JWT
 * Verifica se o token é válido e adiciona os dados do usuário ao request
 */
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido',
        error: {
          code: 'MISSING_TOKEN',
          details: 'Header Authorization é obrigatório'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verificar formato do token (Bearer <token>)
    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        message: 'Formato de token inválido',
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          details: 'Token deve estar no formato: Bearer <token>'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const token = tokenParts[1];
    
    // Verificar se JWT_SECRET está configurado
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET não configurado');
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          details: 'Configuração de autenticação não encontrada'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verificar e decodificar o token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    } catch (jwtError: any) {
      let errorMessage = 'Token inválido';
      let errorCode = 'INVALID_TOKEN';
      
      if (jwtError.name === 'TokenExpiredError') {
        errorMessage = 'Token expirado';
        errorCode = 'TOKEN_EXPIRED';
      } else if (jwtError.name === 'JsonWebTokenError') {
        errorMessage = 'Token malformado';
        errorCode = 'MALFORMED_TOKEN';
      }
      
      res.status(401).json({
        success: false,
        message: errorMessage,
        error: {
          code: errorCode,
          details: jwtError.message
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verificar se o usuário ainda existe e está ativo
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não encontrado',
        error: {
          code: 'USER_NOT_FOUND',
          details: 'O usuário associado ao token não existe mais'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Usuário inativo',
        error: {
          code: 'USER_INACTIVE',
          details: 'Conta de usuário foi desativada'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // TODO: Implementar verificação de token revogado (blacklist)
    // const isTokenRevoked = await UserModel.isTokenRevoked(token);
    // if (isTokenRevoked) {
    //   res.status(401).json({
    //     success: false,
    //     message: 'Token revogado',
    //     error: {
    //       code: 'TOKEN_REVOKED',
    //       details: 'Este token foi invalidado'
    //     },
    //     timestamp: new Date().toISOString()
    //   });
    //   return;
    // }

    // Adicionar dados do usuário ao request
    req.user = {
      userId: user.id!,
      email: user.email,
      nome: user.nome || user.name,
      role: String((user as any).role || (user as any).perfil || '').toUpperCase(),
      isActive: user.isActive,
      setorId: user.setor_id
    };

    // TODO: Implementar atualização de último acesso
    // UserModel.updateLastAccess(user.id!).catch((error: any) => {
    //   console.error('Erro ao atualizar último acesso:', error);
    // });

    next();
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        details: 'Erro durante a verificação de autenticação'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware opcional de autenticação
 * Adiciona dados do usuário se o token for válido, mas não bloqueia se não houver token
 */
export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    // Se não há token, continua sem autenticação
    if (!authHeader) {
      next();
      return;
    }

    // Se há token, tenta autenticar
    await authMiddleware(req, res, next);
  } catch (error) {
    // Em caso de erro, continua sem autenticação
    console.error('Erro no middleware de autenticação opcional:', error);
    next();
  }
};

/**
 * Middleware para verificar permissões específicas
 */
export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
        error: {
          code: 'NOT_AUTHENTICATED',
          details: 'Autenticação é necessária para acessar este recurso'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verificar permissão baseada no cargo
    const hasPermission = checkUserPermission(req.user, permission);
    
    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: 'Acesso negado',
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          details: `Permissão '${permission}' é necessária para acessar este recurso`
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
};

/**
 * Middleware para verificar se o usuário é administrador
 */
export const requireAdmin = requirePermission('admin');

/**
 * Middleware para verificar se o usuário é supervisor ou administrador
 */
export const requireSupervisor = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Usuário não autenticado',
      error: {
        code: 'NOT_AUTHENTICATED',
        details: 'Autenticação é necessária para acessar este recurso'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  const supervisorRoles = ['ADMINISTRADOR', 'ADMIN', 'GERENTE', 'SUPERVISOR', 'COORDENADOR'];
  const userRole = req.user.role?.toUpperCase() || '';
  
  if (!supervisorRoles.includes(userRole)) {
    res.status(403).json({
      success: false,
      message: 'Acesso negado',
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        details: 'Apenas supervisores ou administradores podem acessar este recurso'
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  next();
};

/**
 * Função auxiliar para verificar permissões do usuário
 */
function checkUserPermission(user: any, permission: string): boolean {
  const adminRoles = ['ADMINISTRADOR', 'ADMIN', 'GERENTE'];
  const supervisorRoles = [...adminRoles, 'SUPERVISOR', 'COORDENADOR'];
  const userRole = user.role?.toUpperCase() || '';
  
  const isAdmin = adminRoles.includes(userRole);
  const isSupervisor = supervisorRoles.includes(userRole);
  
  switch (permission) {
    case 'admin':
      return isAdmin;
    case 'supervisor':
      return isSupervisor;
    case 'create_user':
    case 'delete_user':
    case 'view_all_users':
    case 'manage_system':
      return isAdmin;
    case 'create_process':
    case 'edit_process':
    case 'view_process':
      return true; // Todos os usuários autenticados podem
    case 'delete_process':
    case 'archive_process':
      return isSupervisor;
    default:
      return false;
  }
}

/**
 * Middleware para verificar se o usuário pode acessar recurso próprio ou é admin
 */
export const requireOwnershipOrAdmin = (userIdParam: string = 'id') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
        error: {
          code: 'NOT_AUTHENTICATED',
          details: 'Autenticação é necessária para acessar este recurso'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const targetUserId = parseInt(req.params[userIdParam]);
    const isOwner = req.user.userId === targetUserId;
    const isAdmin = checkUserPermission(req.user, 'admin');
    
    if (!isOwner && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Acesso negado',
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          details: 'Você só pode acessar seus próprios recursos ou ser um administrador'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
};

export default authMiddleware;