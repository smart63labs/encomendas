import { Request, Response, NextFunction } from 'express';
import { BaseController, AuthenticatedRequest, QueryParams } from './base.controller';
import { SetorModel, ISetor, ISetorFilters } from '../models/setor.model';
import { SearchFilters } from '../models/base.model';

/**
 * Interface para dados de criação de setor
 */
interface CreateSetorData {
  codigo_setor: string;
  nome_setor: string;
  orgao?: string;
  ativo: boolean;
  logradouro?: string;
  numero?: string;
  coluna1?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Controlador de Setores
 * Gerencia operações CRUD e consultas de setores organizacionais
 */
export class SetorController extends BaseController {

  /**
   * Listar setores com filtros e paginação
   */
  static async index(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const queryParams = req.query as QueryParams;
      const filters: ISetorFilters = {
        codigo_setor: queryParams.codigo_setor as string,
        orgao: queryParams.orgao as string,
        nome_setor: queryParams.nome_setor as string,
        cidade: queryParams.cidade as string,
        estado: queryParams.estado as string,
        ativo: queryParams.ativo ? queryParams.ativo === 'true' : undefined
      };

      // Remover filtros vazios
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof ISetorFilters] === undefined || filters[key as keyof ISetorFilters] === '') {
          delete filters[key as keyof ISetorFilters];
        }
      });

      const pagination = {
        page: parseInt(queryParams.page as string) || 1,
        limit: parseInt(queryParams.limit as string) || 10
      };

      const result = await SetorModel.findSetores(filters, pagination);

      return res.json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar setor por ID
   */
  static async show(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const setor = await SetorModel.findById<ISetor>(parseInt(id));

      if (!setor) {
        return res.status(404).json({
          success: false,
          message: 'Setor não encontrado'
        });
      }

      return res.json({
        success: true,
        data: setor
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar setor por código
   */
  static async findByCode(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { codigo } = req.params;
      const setor = await SetorModel.findByCodigoSetor(codigo);

      if (!setor) {
        return res.status(404).json({
          success: false,
          message: 'Setor não encontrado'
        });
      }

      return res.json({
        success: true,
        data: setor
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar setores por nome (busca parcial)
   */
  static async search(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Parâmetro de busca "q" é obrigatório'
        });
      }

      const pagination = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10
      };

      const result = await SetorModel.searchByName(q, pagination);

      return res.json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar setores por órgão
   */
  static async findByOrgao(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { orgao } = req.params;
      
      const pagination = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10
      };

      const result = await SetorModel.findByOrgao(orgao, pagination);

      return res.json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter hierarquia completa de um setor
   */
  static async getHierarchy(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { codigo } = req.params;
      const hierarquia = await SetorModel.getHierarquiaCompleta(codigo);

      if (!hierarquia) {
        return res.status(404).json({
          success: false,
          message: 'Setor não encontrado'
        });
      }

      return res.json({
        success: true,
        data: hierarquia
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar setores por hierarquia
   */
  static async findByHierarquia(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { hierarquia } = req.params;
      const queryParams = req.query as QueryParams;
      const pagination = {
        page: parseInt(queryParams.page as string) || 1,
        limit: parseInt(queryParams.limit as string) || 10
      };

      const result = await SetorModel.findByHierarquia(hierarquia, pagination);

      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar setores ativos com paginação
   */
  static async findAtivos(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const queryParams = req.query as QueryParams;
      const pagination = {
        page: parseInt(queryParams.page as string) || 1,
        limit: parseInt(queryParams.limit as string) || 10
      };

      const result = await SetorModel.findActiveSetores(pagination);

      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Listar setores ativos (para dropdowns)
   */
  static async listActive(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const pagination = {
        page: 1,
        limit: 1000 // Limite alto para pegar todos os setores ativos
      };

      const result = await SetorModel.findActiveSetores(pagination);

      return res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Criar novo setor
   */
  static async store(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const setorData: CreateSetorData = req.body;

      // Validações básicas
      if (!setorData.codigo_setor || !setorData.orgao || !setorData.setor) {
        return res.status(400).json({
          success: false,
          message: 'Código do setor, órgão e setor são obrigatórios'
        });
      }

      const novoSetor = await SetorModel.createSetor(setorData);

      return res.status(201).json({
        success: true,
        message: 'Setor criado com sucesso',
        data: novoSetor
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Já existe um setor')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * Atualizar setor
   */
  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const setorData: Partial<ISetor> = req.body;

      const setorAtualizado = await SetorModel.updateSetor(parseInt(id), setorData);

      if (!setorAtualizado) {
        return res.status(404).json({
          success: false,
          message: 'Setor não encontrado'
        });
      }

      return res.json({
        success: true,
        message: 'Setor atualizado com sucesso',
        data: setorAtualizado
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Já existe um setor')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * Ativar/Desativar setor
   */
  static async toggleStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { ativo } = req.body;

      if (typeof ativo !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Campo "ativo" deve ser um boolean'
        });
      }

      const setorAtualizado = await SetorModel.toggleSetorStatus(parseInt(id), ativo);

      if (!setorAtualizado) {
        return res.status(404).json({
          success: false,
          message: 'Setor não encontrado'
        });
      }

      return res.json({
        success: true,
        message: `Setor ${ativo ? 'ativado' : 'desativado'} com sucesso`,
        data: setorAtualizado
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Excluir setor
   */
  static async destroy(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Verificar autenticação e permissão (Admin-only)
      const role = req.user?.role?.toUpperCase() || '';
      const isAdmin = role === 'ADMIN' || role === 'ADMINISTRADOR';
      if (!req.user || !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Apenas administradores podem excluir setores'
        });
      }

      const { id } = req.params;
      
      const deleted = await SetorModel.delete(parseInt(id));

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Setor não encontrado'
        });
      }

      return res.json({
        success: true,
        message: 'Setor excluído com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Excluir múltiplos setores
   */
  static async destroyMultiple(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'IDs devem ser fornecidos como array não vazio'
        });
      }

      const result = await SetorModel.deleteMultiple(ids);

      return res.json({
        success: true,
        message: `${result.deletedCount} setores excluídos com sucesso`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter estatísticas dos setores
   */
  static async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const stats = await SetorModel.getSetorStats();

      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

export default SetorController;