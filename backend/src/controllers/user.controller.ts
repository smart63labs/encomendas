import { Request, Response, NextFunction } from 'express';
import { BaseController, AuthenticatedRequest, QueryParams } from './base.controller';
import { UserModel, IUser, ILoginCredentials, IUserFilters } from '../models/user.model';
import { SearchFilters } from '../models/base.model';
import { DatabaseService } from '../config/database';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { getDefaultPasswordForRole } from '../config/default-passwords';

/**
 * Interface para dados de criação de usuário - Estrutura conforme tabela USUARIOS
 */
interface CreateUserData {
  // Estrutura exata da tabela USUARIOS na ordem especificada
  setor_id?: number;
  role?: string;
  // senha: removido - será gerado automaticamente baseado no role
  usuario_ativo?: number;
  nome: string;
  matricula?: string;
  vinculo_funcional?: string;
  cpf?: string;
  'pis/pasep'?: string;
  sexo?: string;
  estado_civil?: string;
  data_nascimento?: Date;
  pai?: string;
  mae?: string;
  rg?: string;
  tipo_rg?: string;
  orgao_expeditor?: string;
  uf_rg?: string;
  expedicao_rg?: Date;
  cidade_nascimento?: string;
  uf_nascimento?: string;
  tipo_sanguineo?: string;
  raca_cor?: string;
  pne?: number;
  tipo_vinculo?: string;
  categoria?: string;
  regime_juridico?: string;
  regime_previdenciario?: string;
  evento_tipo?: string;
  forma_provimento?: string;
  codigo_cargo?: string;
  cargo?: string;
  escolaridade_cargo?: string;
  escolaridade_servidor?: string;
  formacao_profissional_1?: string;
  formacao_profissional_2?: string;
  jornada?: string;
  nivel_referencia?: string;
  'comissao_funçao'?: string;
  data_ini_comissao?: Date;
  telefone?: string;
  endereco?: string;
  numero_endereco?: string;
  complemento_endereco?: string;
  bairro_endereco?: string;
  cidade_endereco?: string;
  uf_endereco?: string;
  cep_endereco?: string;
  e_mail: string;
  // Campos de compatibilidade
  email?: string;
  ativo?: boolean;
}

/**
 * Interface para dados de atualização de usuário - Estrutura conforme tabela USUARIOS
 */
interface UpdateUserData {
  // Estrutura exata da tabela USUARIOS na ordem especificada
  setor_id?: number;
  role?: string;
  senha?: string;
  usuario_ativo?: number;
  nome?: string;
  matricula?: string;
  vinculo_funcional?: string;
  cpf?: string;
  'pis/pasep'?: string;
  sexo?: string;
  estado_civil?: string;
  data_nascimento?: Date;
  pai?: string;
  mae?: string;
  rg?: string;
  tipo_rg?: string;
  orgao_expeditor?: string;
  uf_rg?: string;
  expedicao_rg?: Date;
  cidade_nascimento?: string;
  uf_nascimento?: string;
  tipo_sanguineo?: string;
  raca_cor?: string;
  pne?: number;
  tipo_vinculo?: string;
  categoria?: string;
  regime_juridico?: string;
  regime_previdenciario?: string;
  evento_tipo?: string;
  forma_provimento?: string;
  codigo_cargo?: string;
  cargo?: string;
  escolaridade_cargo?: string;
  escolaridade_servidor?: string;
  formacao_profissional_1?: string;
  formacao_profissional_2?: string;
  jornada?: string;
  nivel_referencia?: string;
  'comissao_funçao'?: string;
  data_ini_comissao?: Date;
  telefone?: string;
  endereco?: string;
  numero_endereco?: string;
  complemento_endereco?: string;
  bairro_endereco?: string;
  cidade_endereco?: string;
  uf_endereco?: string;
  cep_endereco?: string;
  e_mail?: string;
  // Campos de compatibilidade
  email?: string;
  ativo?: boolean;
}

/**
 * Interface para alteração de senha
 */
interface ChangePasswordData {
  senhaAtual: string;
  novaSenha: string;
  confirmarSenha: string;
}

/**
 * Controller de Usuários
 * Gerencia operações CRUD e autenticação de usuários
 */
export class UserController extends BaseController {
  constructor() {
    super(UserModel);
  }

  /**
   * Autenticar usuário
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { cpf, senha }: ILoginCredentials = req.body;

      // Validar dados de entrada
      if (!cpf || !senha) {
        this.sendError(res, 'CPF e senha são obrigatórios', 400);
        return;
      }

      // Autenticação local (banco de dados)
      const localResult = await this.tryLocalAuthentication(cpf, senha);
      if (localResult.success && localResult.auth) {
        // Autenticação local já retorna tokens e flag de senha padrão
        this.sendSuccess(res, localResult.auth, 'Login realizado com sucesso');
        return;
      }

      // Se ambas falharam, retornar motivo específico da falha local se disponível
      const errorMessage = localResult.error || 'Credenciais inválidas';
      this.sendError(res, errorMessage, 401);
      
    } catch (error) {
      // Tratar erro conhecido de senha atual incorreta como 400 (Bad Request)
      if (error instanceof Error && error.message === 'Senha atual incorreta') {
        this.sendError(res, error.message, 400);
        return;
      }
      next(error);
    }
  }

  // Removido: tentativa de autenticação via LDAP no fluxo de login por CPF

  /**
   * Tenta autenticação local (banco de dados)
   */
  private async tryLocalAuthentication(cpf: string, senha: string): Promise<{ success: boolean; auth?: any; error?: string }> {
    try {
      // Usar o método authenticate do UserModel que já processa CPF
      const authResult = await UserModel.authenticate({ cpf, senha });
      // Retorna o objeto completo de autenticação (inclui tokens e isDefaultPassword)
      return { success: true, auth: authResult };
    } catch (error: any) {
      console.error('Erro na autenticação local:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Gera tokens JWT para o usuário autenticado
   */
  private async generateAuthTokens(user: any): Promise<any> {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET não configurado');
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      nome: user.nome,
      role: (user.role || user.cargo || '').toString().toUpperCase()
    };

    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '24h' });
    const refreshToken = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });

    return {
      user,
      token,
      refreshToken
    };
  }

  /**
   * Renovar token de acesso
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        this.sendError(res, 'Refresh token é obrigatório', 400);
        return;
      }

      const result = await UserModel.refreshToken(refreshToken);
      
      this.sendSuccess(res, result, 'Token renovado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter perfil do usuário autenticado
   */
  async profile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        this.sendError(res, 'Usuário não autenticado', 401);
        return;
      }

      const user = await UserModel.findById<IUser>(req.user.userId);
      
      if (!user) {
        this.sendError(res, 'Usuário não encontrado', 404);
        return;
      }

      this.sendSuccess(res, user, 'Perfil recuperado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Alias para o método profile (compatibilidade)
   */
  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    return this.profile(req, res, next);
  }

  /**
   * Logout do usuário
   */
  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        this.sendError(res, 'Usuário não autenticado', 401);
        return;
      }

      // Invalidar token (implementar blacklist se necessário)
      // Por enquanto, apenas retorna sucesso
      this.sendSuccess(res, null, 'Logout realizado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar perfil do usuário autenticado
   */
  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        this.sendError(res, 'Usuário não autenticado', 401);
        return;
      }

      const data: UpdateUserData = this.sanitizeInput(req.body);
      
      // Remover campos que não podem ser alterados pelo próprio usuário
      delete (data as any).ativo;
      
      const validation = await this.validateUpdateData(data, req.user.userId, req);
      if (!validation.valid) {
        this.sendError(res, validation.errors.join(', '), 400);
        return;
      }

      const updatedUser = await UserModel.updateUser(req.user.userId, data);
      
      if (!updatedUser) {
        this.sendError(res, 'Usuário não encontrado', 404);
        return;
      }

      // Log de auditoria (assíncrono, não bloqueia a resposta)
      this.logAudit('UPDATE_PROFILE', 'user', req.user.userId, req.user.userId, data)
        .catch(err => console.error('Erro ao registrar auditoria (UPDATE_PROFILE):', err));
      
      this.sendSuccess(res, updatedUser, 'Perfil atualizado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Alterar senha do usuário autenticado
   */
  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        this.sendError(res, 'Usuário não autenticado', 401);
        return;
      }

      const { senhaAtual, novaSenha, confirmarSenha }: ChangePasswordData = req.body;

      // Validar dados de entrada
      if (!senhaAtual || !novaSenha || !confirmarSenha) {
        this.sendError(res, 'Todos os campos são obrigatórios', 400);
        return;
      }

      if (novaSenha !== confirmarSenha) {
        this.sendError(res, 'Nova senha e confirmação não coincidem', 400);
        return;
      }

      if (novaSenha.length < 8) {
        this.sendError(res, 'Nova senha deve ter pelo menos 8 caracteres', 400);
        return;
      }

      const success = await UserModel.changePassword(req.user.userId, senhaAtual, novaSenha);
      
      if (!success) {
        this.sendError(res, 'Falha ao alterar senha', 500);
        return;
      }

      // Log de auditoria
      await this.logAudit('CHANGE_PASSWORD', 'user', req.user.userId, req.user.userId);
      
      this.sendSuccess(res, null, 'Senha alterada com sucesso');
    } catch (error) {
      // Tratar erro específico de senha atual incorreta
      if (error instanceof Error && error.message === 'Senha atual incorreta') {
        this.sendError(res, error.message, 400);
        return;
      }
      next(error);
    }
  }

  /**
   * Obter status da senha padrão do usuário logado
   */
  async passwordStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        this.sendError(res, 'Usuário não autenticado', 401);
        return;
      }

      const isDefault = await UserModel.getPasswordStatus(req.user.userId);
      this.sendSuccess(res, { isDefaultPassword: isDefault }, 'Status de senha recuperado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Criar novo usuário (apenas administradores)
   */
  /**
   * Criar usuário (registro público)
   */
  override async store(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data: CreateUserData = this.sanitizeInput(req.body);
      
      // Validação básica para registro público
      const validation = await this.validatePublicStoreData(data);
      if (!validation.valid) {
        this.sendError(res, validation.errors.join(', '), 400);
        return;
      }

      const newUser = await UserModel.createUser(data);
      
      // Log de auditoria para registro público
      await this.logAudit('PUBLIC_REGISTER', 'user', newUser.id!, newUser.id!, {
        createdUser: { id: newUser.id, email: newUser.email, nome: newUser.nome }
      });
      
      this.sendSuccess(res, newUser, 'Usuário criado com sucesso', {}, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Criar usuário (apenas administradores)
   */
  async createUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        this.sendError(res, 'Usuário não autenticado', 401);
        return;
      }

      // Verificar permissão de administrador
      if (!this.hasPermission(req.user, 'create_user')) {
        this.sendError(res, 'Sem permissão para criar usuários', 403);
        return;
      }

      const data: CreateUserData = this.sanitizeInput(req.body);
      
      const validation = await this.validateStoreData(data, req);
      if (!validation.valid) {
        this.sendError(res, validation.errors.join(', '), 400);
        return;
      }

      const newUser = await UserModel.createUser(data);
      
      // Log de auditoria
      await this.logAudit('CREATE_USER', 'user', newUser.id!, req.user.userId, {
        createdUser: { id: newUser.id, email: newUser.email, nome: newUser.nome }
      });
      
      this.sendSuccess(res, newUser, 'Usuário criado com sucesso', {}, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar usuário (apenas administradores)
   */
  override async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('🔍 [UPDATE USER] Iniciando atualização de usuário');
      
      if (!req.user) {
        this.sendError(res, 'Usuário não autenticado', 401);
        return;
      }

      const { id } = req.params;
      const userId = Number(id);
      
      console.log('🔍 [UPDATE USER] ID do usuário:', userId);
      
      if (!id || isNaN(userId)) {
        this.sendError(res, 'ID inválido', 400);
        return;
      }

      // Verificar se é o próprio usuário ou se tem permissão de administrador
      const isOwnProfile = userId === req.user.userId;
      const hasAdminPermission = this.hasPermission(req.user, 'update_user');
      
      console.log('🔍 [UPDATE USER] Permissões - Próprio perfil:', isOwnProfile, 'Admin:', hasAdminPermission);
      
      if (!isOwnProfile && !hasAdminPermission) {
        this.sendError(res, 'Sem permissão para atualizar este usuário', 403);
        return;
      }

      const data: UpdateUserData = this.sanitizeInput(req.body);
      console.log('🔍 [UPDATE USER] Dados sanitizados:', Object.keys(data));
      
      // Se não é administrador, remover campos que só admin pode alterar
      if (!hasAdminPermission) {
        delete (data as any).ativo;
        delete (data as any).cargo;
        delete (data as any).departamento;
        delete (data as any).role;
      }

      console.log('🔍 [UPDATE USER] Iniciando validação dos dados');
      const validation = await this.validateUpdateData(data, userId, req);
      console.log('🔍 [UPDATE USER] Validação concluída:', validation.valid);
      
      if (!validation.valid) {
        this.sendError(res, validation.errors.join(', '), 400);
        return;
      }

      // Buscar usuário atual para detectar mudança de role
      const currentUser = await UserModel.findById<IUser>(userId);
      if (!currentUser) {
        this.sendError(res, 'Usuário não encontrado', 404);
        return;
      }

      // Suporte a updates que enviam 'perfil' ao invés de 'role'
      const incomingPerfil = (data as any).perfil;
      if (incomingPerfil && hasAdminPermission) {
        (data as any).role = String(incomingPerfil);
      }

      // Se o role mudou e quem está atualizando tem permissão, resetar senha para padrão do novo role
      const newRole = (data as any).role as string | undefined;
      const oldRole = currentUser.role;
      const changedRole = !!(newRole && String(newRole).trim().toUpperCase() !== String(oldRole || '').trim().toUpperCase());

      if (hasAdminPermission && changedRole) {
        const defaultPassword = getDefaultPasswordForRole(newRole);
        console.log('🔐 [UPDATE USER] Role alterado. Resetando senha para padrão do role:', newRole);
        (data as any).senha = defaultPassword; // será hash-eada no model
        (data as any).senhaAlterada = 'N'; // flag para indicar senha padrão no banco (SENHA_ALTERADA)
      }

      console.log('🔍 [UPDATE USER] Iniciando atualização no banco de dados');
      const updatedUser = await UserModel.updateUser(userId, data);
      console.log('🔍 [UPDATE USER] Atualização no banco concluída');
      
      if (!updatedUser) {
        this.sendError(res, 'Usuário não encontrado', 404);
        return;
      }

      console.log('🔍 [UPDATE USER] Iniciando log de auditoria assíncrono');
      // Log de auditoria (assíncrono, não bloqueia a resposta)
      this.logAudit('UPDATE_USER', 'user', userId, req.user.userId, data)
        .then(() => console.log('✅ [UPDATE USER] Log de auditoria concluído com sucesso'))
        .catch(err => console.error('❌ [UPDATE USER] Erro ao registrar auditoria:', err));
      
      console.log('🔍 [UPDATE USER] Enviando resposta de sucesso');
      this.sendSuccess(res, updatedUser, 'Usuário atualizado com sucesso');
      console.log('🔍 [UPDATE USER] Resposta enviada com sucesso');
    } catch (error) {
      console.error('💥 [UPDATE USER] Erro capturado:', error);
      next(error);
    }
  }

  /**
   * Ativar/Desativar usuário
   */
  async toggleStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        this.sendError(res, 'Usuário não autenticado', 401);
        return;
      }

      if (!this.hasPermission(req.user, 'manage_users')) {
        this.sendError(res, 'Sem permissão para gerenciar usuários', 403);
        return;
      }

      const { id } = req.params;
      const { ativo } = req.body;
      
      if (!id || isNaN(Number(id))) {
        this.sendError(res, 'ID inválido', 400);
        return;
      }

      if (typeof ativo !== 'boolean') {
        this.sendError(res, 'Status deve ser verdadeiro ou falso', 400);
        return;
      }

      // Não permitir desativar o próprio usuário
      if (Number(id) === req.user.userId && !ativo) {
        this.sendError(res, 'Não é possível desativar o próprio usuário', 400);
        return;
      }

      const updatedUser = await UserModel.toggleUserStatus(Number(id), ativo);
      
      if (!updatedUser) {
        this.sendError(res, 'Usuário não encontrado', 404);
        return;
      }

      // Log de auditoria
      await this.logAudit(
        ativo ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
        'user',
        Number(id),
        req.user.userId
      );
      
      this.sendSuccess(res, updatedUser, `Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resetar senha de usuário (apenas administradores)
   */
  async resetPassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        this.sendError(res, 'Usuário não autenticado', 401);
        return;
      }

      if (!this.hasPermission(req.user, 'reset_password')) {
        this.sendError(res, 'Sem permissão para resetar senhas', 403);
        return;
      }

      const { id } = req.params;
      const { novaSenha } = req.body;
      
      if (!id || isNaN(Number(id))) {
        this.sendError(res, 'ID inválido', 400);
        return;
      }

      if (!novaSenha || novaSenha.length < 8) {
        this.sendError(res, 'Nova senha deve ter pelo menos 8 caracteres', 400);
        return;
      }

      const success = await UserModel.resetPassword(Number(id), novaSenha);
      
      if (!success) {
        this.sendError(res, 'Usuário não encontrado ou falha ao resetar senha', 404);
        return;
      }

      // Log de auditoria
      await this.logAudit('RESET_PASSWORD', 'user', Number(id), req.user.userId);
      
      this.sendSuccess(res, null, 'Senha resetada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar usuários por departamento
   */
  async findByDepartment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { departamento } = req.params;
      const pagination = this.extractPagination(req.query as QueryParams);
      
      if (!departamento) {
        this.sendError(res, 'Departamento é obrigatório', 400);
        return;
      }

      const result = await UserModel.findByDepartment(departamento, pagination);
      
      this.sendSuccess(res, result.data, 'Usuários recuperados com sucesso', {
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar usuários por cargo
   */
  async findByRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { cargo } = req.params;
      const pagination = this.extractPagination(req.query as QueryParams);
      
      if (!cargo) {
        this.sendError(res, 'Cargo é obrigatório', 400);
        return;
      }

      const result = await UserModel.findByRole(cargo, pagination);
      
      this.sendSuccess(res, result.data, 'Usuários recuperados com sucesso', {
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar usuários por nome (para encomendas)
   */
  async searchByName(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Parâmetro de busca "q" é obrigatório'
        });
        return;
      }

      const pagination = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10
      };

      const result = await UserModel.searchByName(q, pagination);

      res.json({
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
   * Buscar usuários e setores combinados (para encomendas)
   * Busca por nome do usuário ou nome do setor
   * Retorna dados agrupados por setor para exibição hierárquica
   */
  async searchUsersAndSectors(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Parâmetro de busca "q" é obrigatório'
        });
        return;
      }

      // Aumentar o limite padrão para 20 para mostrar todas as delegacias
      const limit = parseInt(req.query.limit as string) || 20;
      const searchTerm = `%${q.toLowerCase()}%`;
      
      // Função para remover acentos usando TRANSLATE do Oracle
      const removeAccents = (field: string) => `
        TRANSLATE(LOWER(${field}), 
          'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 
          'aaaaaeeeeiiiioooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
        )
      `;

      // Buscar setores por nome (apenas no campo NOME_SETOR) - com e sem acentuação
      const sectorsQuery = `
        SELECT 
          s.ID,
          s.NOME_SETOR,
          s.CODIGO_SETOR,
          s.ORGAO,
          s.ATIVO
        FROM SETORES s
        WHERE (LOWER(s.NOME_SETOR) LIKE :searchTerm 
               OR ${removeAccents('s.NOME_SETOR')} LIKE :searchTerm)
          AND s.ATIVO = 1
        ORDER BY s.NOME_SETOR
      `;

      // Buscar usuários vinculados aos setores encontrados - com e sem acentuação
      const usersFromSectorsQuery = `
        SELECT 
          u.ID,
          u.NOME as nome,
          u.MATRICULA,
          u.VINCULO_FUNCIONAL,
          u.ROLE as DEPARTAMENTO,
          s.NOME_SETOR,
          s.CODIGO_SETOR,
          s.ORGAO,
          s.ID as setor_id
        FROM USUARIOS u
        INNER JOIN SETORES s ON u.SETOR_ID = s.ID
        WHERE (LOWER(s.NOME_SETOR) LIKE :searchTerm 
               OR ${removeAccents('s.NOME_SETOR')} LIKE :searchTerm)
          AND s.ATIVO = 1
        ORDER BY s.NOME_SETOR, u.NOME
      `;

      // Buscar usuários por nome (que não estejam nos setores já encontrados) - com e sem acentuação
      const usersQuery = `
        SELECT 
          u.ID,
          u.NOME as nome,
          u.MATRICULA,
          u.VINCULO_FUNCIONAL,
          u.ROLE as DEPARTAMENTO,
          s.NOME_SETOR,
          s.CODIGO_SETOR,
          s.ORGAO,
          s.ID as setor_id
        FROM USUARIOS u
        LEFT JOIN SETORES s ON u.SETOR_ID = s.ID
        WHERE (LOWER(u.NOME) LIKE :searchTerm 
               OR ${removeAccents('u.NOME')} LIKE :searchTerm)
          AND (s.ATIVO = 1 OR s.ATIVO IS NULL)
        ORDER BY u.NOME
      `;

      const [sectorsResult, usersFromSectorsResult, usersResult] = await Promise.all([
        DatabaseService.executeQuery(sectorsQuery, { searchTerm }),
        DatabaseService.executeQuery(usersFromSectorsQuery, { searchTerm }),
        DatabaseService.executeQuery(usersQuery, { searchTerm })
      ]);

      // Processar setores encontrados
      const sectors = (sectorsResult.rows || []).map((row: any) => ({
        id: row.ID,
        NOME_SETOR: row.NOME_SETOR,
        CODIGO_SETOR: row.CODIGO_SETOR,
        ORGAO: row.ORGAO,
        tipo: 'sector',
        usuarios: []
      }));

      // Processar usuários dos setores encontrados
      const usersFromSectors = (usersFromSectorsResult.rows || []).map((row: any) => ({
        id: row.ID,
        nome: row.NOME,
        numero_funcional: row.MATRICULA,
        vinculo_funcional: row.VINCULO_FUNCIONAL,
        departamento: row.DEPARTAMENTO,
        setor: row.NOME_SETOR,
        setor_id: row.SETOR_ID,
        orgao: row.ORGAO,
        tipo: 'user'
      }));

      // Processar usuários encontrados por nome
      const users = (usersResult.rows || []).map((row: any) => ({
        id: row.ID,
        nome: row.NOME,
        numero_funcional: row.MATRICULA,
        vinculo_funcional: row.VINCULO_FUNCIONAL,
        departamento: row.DEPARTAMENTO,
        setor: row.NOME_SETOR,
        setor_id: row.SETOR_ID,
        orgao: row.ORGAO,
        tipo: 'user'
      }));

      // Detectar se a pesquisa é por setor (quando encontra setores)
      const isSearchBySector = sectors.length > 0;
      
      // Agrupar usuários por setor
      const setorMap = new Map();
      
      // Adicionar setores encontrados
      sectors.forEach(setor => {
        setorMap.set(setor.id, {
          ...setor,
          usuarios: []
        });
      });

      // Adicionar usuários aos seus respectivos setores
      usersFromSectors.forEach(user => {
        if (setorMap.has(user.setor_id)) {
          setorMap.get(user.setor_id).usuarios.push(user);
        }
      });

      // Adicionar usuários encontrados por nome (que podem estar em setores não encontrados pela busca de setor)
      users.forEach(user => {
        if (user.setor_id && !setorMap.has(user.setor_id)) {
          // Criar entrada para o setor se não existir
          setorMap.set(user.setor_id, {
            id: user.setor_id,
            NOME_SETOR: user.setor,
            CODIGO_SETOR: null,
            ORGAO: user.orgao,
            tipo: 'sector',
            usuarios: [user]
          });
        } else if (user.setor_id && setorMap.has(user.setor_id)) {
          // Adicionar usuário ao setor existente se não estiver duplicado
          const setor = setorMap.get(user.setor_id);
          const userExists = setor.usuarios.some((u: any) => u.id === user.id);
          if (!userExists) {
            setor.usuarios.push(user);
          }
        }
      });

      // Comentário: Removida a lógica que filtrava setores sem usuários
      // Agora todos os setores encontrados serão exibidos, independente de terem usuários vinculados

      // Verificar se há setores sem usuários para mostrar mensagem
      const sectorsWithoutUsers = isSearchBySector ? 
        sectors.filter(setor => !setorMap.has(setor.id)) : [];

      // Converter para array e criar estrutura hierárquica
      const groupedResults: any[] = [];
      
      Array.from(setorMap.values()).forEach((setor: any) => {
        // Adicionar o setor
        groupedResults.push({
          id: setor.id,
          NOME_SETOR: setor.NOME_SETOR,
          CODIGO_SETOR: setor.CODIGO_SETOR,
          ORGAO: setor.ORGAO,
          tipo: 'sector',
          isGroup: true
        });
        
        // Adicionar os usuários do setor
        setor.usuarios.forEach((user: any) => {
          groupedResults.push({
            ...user,
            isChildOfGroup: true,
            parentSectorId: setor.id
          });
        });
      });

      // Limitar resultados
      const combinedResults = groupedResults.slice(0, limit * 2); // Aumentar limite para acomodar estrutura hierárquica

      // Preparar mensagem de resposta
      let message = `Encontrados ${combinedResults.length} resultados para "${q}"`;
      
      // Adicionar informação sobre setores sem usuários
      if (sectorsWithoutUsers.length > 0) {
        const sectorsNames = sectorsWithoutUsers.map(s => s.NOME_SETOR).join(', ');
        if (combinedResults.length === 0) {
          message = `O setor "${sectorsNames}" não possui usuários vinculados.`;
        } else {
          message += `. Nota: O setor "${sectorsNames}" não possui usuários vinculados.`;
        }
      }

      // Adicionar headers para evitar cache
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      res.status(200).json({
        success: true,
        data: combinedResults,
        total: combinedResults.length,
        message: message,
        sectorsWithoutUsers: sectorsWithoutUsers.length > 0 ? sectorsWithoutUsers : undefined
      });

    } catch (error) {
      console.error('Erro ao buscar usuários e setores:', error);
      next(error);
    }
  }

  /**
   * Buscar usuários por setor
   */
  async findBySetor(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { setor } = req.params;
      
      const pagination = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10
      };

      const result = await UserModel.findBySetor(setor, pagination);

      res.json({
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
   * Buscar usuários por órgão
   */
  async findByOrgao(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orgao } = req.params;
      
      const pagination = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10
      };

      const result = await UserModel.findByOrgao(orgao, pagination);

      res.json({
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
   * Obter dados completos do usuário com informações organizacionais
   */
  async getUserWithOrgInfo(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await UserModel.findById<IUser>(parseInt(id));

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
        return;
      }

      // Remover senha do retorno
      const { senha, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: {
          ...userWithoutPassword,
          organizacao: {
            orgao: user.orgao,
            setor: user.setor,
            lotacao: user.lotacao,
            hierarquia_setor: user.hierarquia_setor,
            municipio_lotacao: user.municipio_lotacao,
            codigo_setor: user.codigo_setor
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter usuários com dados organizacionais
   */
  async getUsersWithOrgData(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = this.extractFilters(req.query);
      const pagination = this.extractPagination(req.query);
      // Se nenhum limite foi enviado na query, retornar todos os usuários desta rota
      const hasLimitParam = typeof (req.query as any).limit !== 'undefined';
      const effectivePagination = {
        ...pagination,
        limit: hasLimitParam ? pagination.limit : 0
      };

      const result = await UserModel.findUsersWithSetor(filters, effectivePagination);
      
      // Retornar apenas o array de usuários em data, com paginação separada
      this.sendSuccess(
        res,
        result.data,
        'Usuários com dados organizacionais recuperados com sucesso',
        { pagination: result.pagination }
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obter estatísticas dos usuários
   */
  async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        this.sendError(res, 'Usuário não autenticado', 401);
        return;
      }

      if (!this.hasPermission(req.user, 'view_stats')) {
        this.sendError(res, 'Sem permissão para visualizar estatísticas', 403);
        return;
      }

      const stats = await UserModel.getUserStats();
      
      this.sendSuccess(res, stats, 'Estatísticas recuperadas com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Extrair filtros específicos de usuário
   */
  protected override extractFilters(query: QueryParams): IUserFilters {
    const baseFilters = super.extractFilters(query);
    const userFilters: IUserFilters = { ...baseFilters };

    // Filtros específicos de usuário
    if (query.nome) {
      userFilters.nome = `%${query.nome}%`;
    }
    if (query.email) {
      userFilters.email = `%${query.email}%`;
    }
    if (query.cargo) {
      userFilters.cargo = query.cargo;
    }
    if (query.setor) {
      userFilters.setor = query.setor;
    }
    if (query.ativo !== undefined) {
      userFilters.ativo = query.ativo === 'true';
    }

    return userFilters;
  }

  /**
   * Campos para busca de texto livre
   */
  protected override getSearchFields(): string[] {
    return ['nome', 'email', 'cargo', 'departamento'];
  }

  /**
   * Validação para registro público
   */
  protected async validatePublicStoreData(
    data: CreateUserData
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validações básicas
    if (!data.nome || data.nome.trim().length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres');
    }

    if (!data.email) {
      errors.push('Email é obrigatório');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push('Email inválido');
      }
    }

    // Senha não é mais obrigatória - será gerada automaticamente

    // Verificar se email já existe
    if (data.email) {
      const existingUser = await UserModel.findByEmail(data.email);
      if (existingUser) {
        errors.push('Email já está em uso');
      }
    }

    // Verificar se CPF já existe (se fornecido)
    if (data.cpf) {
      const existingUserByCpf = await UserModel.findByCpf(data.cpf);
      if (existingUserByCpf) {
        errors.push('CPF já está em uso');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validar dados para criação de usuário
   */
  protected override async validateStoreData(
    data: CreateUserData,
    req: AuthenticatedRequest
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validações básicas
    if (!data.nome || data.nome.trim().length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres');
    }

    if (!data.email) {
      errors.push('Email é obrigatório');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push('Email inválido');
      }
    }

    // Senha não é mais obrigatória - será gerada automaticamente

    // Verificar se email já existe
    if (data.email) {
      const existingUser = await UserModel.findByEmail(data.email);
      if (existingUser) {
        errors.push('Email já está em uso');
      }
    }

    // Verificar se CPF já existe (se fornecido)
    if (data.cpf) {
      const existingUserByCpf = await UserModel.findByCpf(data.cpf);
      if (existingUserByCpf) {
        errors.push('CPF já está em uso');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validar dados para atualização de usuário
   */
  protected override async validateUpdateData(
    data: UpdateUserData,
    id: number,
    req: AuthenticatedRequest
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validar nome se fornecido
    if (data.nome !== undefined && (!data.nome || data.nome.trim().length < 2)) {
      errors.push('Nome deve ter pelo menos 2 caracteres');
    }

    // Validar email se fornecido
    if (data.email !== undefined) {
      if (!data.email) {
        errors.push('Email não pode ser vazio');
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
          errors.push('Email inválido');
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Verificar se pode excluir usuário
   */
  protected override async canDelete(
    id: number,
    req: AuthenticatedRequest
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Não permitir excluir o próprio usuário
    if (req.user && id === req.user.userId) {
      return { allowed: false, reason: 'Não é possível excluir o próprio usuário' };
    }

    // Verificar se usuário tem processos associados
    try {
      const processCount = await this.model.query(
        'SELECT COUNT(*) as count FROM processos WHERE usuario_criador = :userId OR usuario_responsavel = :userId',
        { userId: id }
      );
      
      if ((processCount[0] as any).COUNT > 0) {
        return { allowed: false, reason: 'Usuário possui processos associados' };
      }
    } catch (error) {
      // Em caso de erro, permitir exclusão
    }

    return { allowed: true };
  }

  /**
   * Hook executado após criar usuário
   */
  protected override async afterStore(user: IUser, req: AuthenticatedRequest): Promise<void> {
    // Enviar email de boas-vindas (implementar conforme necessário)
    // await this.sendWelcomeEmail(user);
  }

  /**
   * Excluir múltiplos usuários
   */
  async destroyMultiple(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        this.sendError(res, 'IDs não fornecidos ou inválidos', 400);
        return;
      }

      const results = [];
      const errors = [];

      for (const id of ids) {
        try {
          // Verificar se pode excluir
           const canDelete = await this.canDelete(id, req);
           if (!canDelete.allowed) {
             errors.push({ id, error: canDelete.reason });
             continue;
           }

          // Excluir usuário
          const deleted = await UserModel.delete(id);
          if (deleted) {
            results.push({ id, success: true });
          } else {
            errors.push({ id, error: 'Usuário não encontrado' });
          }
        } catch (error) {
          errors.push({ id, error: 'Erro ao excluir usuário' });
        }
      }

      this.sendSuccess(res, {
        deleted: results,
        errors: errors,
        total: ids.length,
        success: results.length,
        failed: errors.length
      }, `${results.length} usuário(s) excluído(s) com sucesso`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verificar permissões específicas do usuário
   */
  protected override hasPermission(user: any | undefined, permission: string): boolean {
    if (!user) return false;
    
    // Implementação básica baseada no cargo
    // Em um sistema real, isso seria mais complexo com tabelas de permissões
    const adminRoles = ['ADMINISTRADOR', 'ADMIN', 'GERENTE'];
    const isAdmin = adminRoles.includes(user.role?.toUpperCase() || '');
    
    switch (permission) {
      case 'create_user':
      case 'update_user':
      case 'manage_users':
      case 'reset_password':
      case 'view_stats':
        return isAdmin;
      default:
        return true;
    }
  }
}

export default UserController;