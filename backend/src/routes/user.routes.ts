import { Router } from 'express';
import { UserModel } from '../models/user.model';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { rateLimitMiddleware, developmentBypass } from '../middleware/rateLimit.middleware';
import { body, param, query } from 'express-validator';

const router = Router();
const userController = new UserController();

/**
 * Validações para criação de usuário
 */
const createUserValidation = [
  body('nome')
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail(),
  body('senha')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  body('cargo')
    .notEmpty()
    .withMessage('Cargo é obrigatório')
    .isLength({ min: 2, max: 50 })
    .withMessage('Cargo deve ter entre 2 e 50 caracteres'),
  body('departamento')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Departamento deve ter entre 2 e 50 caracteres'),
  body('setor_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Setor ID deve ser um número inteiro positivo'),
  body('telefone')
    .optional()
    .matches(/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/)
    .withMessage('Telefone deve estar no formato válido'),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Ativo deve ser verdadeiro ou falso')
];

/**
 * Validações para atualização de usuário
 */
const updateUserValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID deve ser um número inteiro positivo'),
  body('nome')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail(),
  body('cargo')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Cargo deve ter entre 2 e 50 caracteres'),
  body('departamento')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Departamento deve ter entre 2 e 50 caracteres'),
  body('setor_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Setor ID deve ser um número inteiro positivo'),
  body('telefone')
    .optional()
    .matches(/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/)
    .withMessage('Telefone deve estar no formato válido'),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Ativo deve ser verdadeiro ou falso')
];

/**
 * Validações para login
 */
const loginValidation = [
  body('cpf')
    .notEmpty()
    .withMessage('CPF é obrigatório')
    .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/)
    .withMessage('CPF deve estar no formato válido (XXX.XXX.XXX-XX ou apenas números)'),
  body('senha')
    .notEmpty()
    .withMessage('Senha é obrigatória')
];

/**
 * Validações para alteração de senha
 */
const changePasswordValidation = [
  body('senhaAtual')
    .notEmpty()
    .withMessage('Senha atual é obrigatória'),
  body('novaSenha')
    .isLength({ min: 6 })
    .withMessage('Nova senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Nova senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  body('confirmarSenha')
    .custom((value, { req }) => {
      if (value !== req.body.novaSenha) {
        throw new Error('Confirmação de senha não confere');
      }
      return true;
    })
];

/**
 * Validações para parâmetros de ID
 */
const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID deve ser um número inteiro positivo')
];

/**
 * Validações para busca por departamento
 */
const departmentValidation = [
  param('departamento')
    .notEmpty()
    .withMessage('Departamento é obrigatório')
    .isLength({ min: 2, max: 50 })
    .withMessage('Departamento deve ter entre 2 e 50 caracteres')
];

/**
 * Validações para busca por cargo
 */
const cargoValidation = [
  param('cargo')
    .notEmpty()
    .withMessage('Cargo é obrigatório')
    .isLength({ min: 2, max: 50 })
    .withMessage('Cargo deve ter entre 2 e 50 caracteres')
];

/**
 * Validações para query parameters de listagem
 */
const listValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número inteiro positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser um número entre 1 e 100'),
  query('search')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Busca deve ter entre 2 e 100 caracteres'),
  query('departamento')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Departamento deve ter entre 2 e 50 caracteres'),
  query('cargo')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Cargo deve ter entre 2 e 50 caracteres'),
  query('ativo')
    .optional()
    .isBoolean()
    .withMessage('Ativo deve ser verdadeiro ou falso')
];

// ==================== ROTAS PÚBLICAS ====================

/**
 * @route POST /api/users/login
 * @desc Autenticar usuário
 * @access Public
 */
router.post(
  '/login',
  developmentBypass, // Bypass em desenvolvimento
  loginValidation,
  validateRequest,
  userController.login.bind(userController)
);

/**
 * @route POST /api/users/refresh
 * @desc Renovar token de acesso
 * @access Public
 */
router.post(
  '/refresh',
  developmentBypass, // Bypass em desenvolvimento
  userController.refreshToken.bind(userController)
);

/**
 * @route POST /api/users
 * @desc Criar novo usuário (registro público)
 * @access Public
 */
router.post(
  '/',
  developmentBypass, // Bypass em desenvolvimento
  createUserValidation,
  validateRequest,
  userController.store.bind(userController)
);

// ==================== ROTAS PROTEGIDAS ====================

// Rota de teste sem autenticação
router.get('/test-search', userController.search.bind(userController));

/**
 * @route GET /api/users/search-by-name
 * @desc Buscar usuários por nome (para encomendas) - Rota pública
 * @access Public
 */
router.get(
  '/search-by-name',
  [
    query('q')
      .notEmpty()
      .withMessage('Termo de busca é obrigatório')
      .isLength({ min: 2, max: 100 })
      .withMessage('Termo de busca deve ter entre 2 e 100 caracteres'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Página deve ser um número inteiro positivo'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limite deve ser um número entre 1 e 100')
  ],
  validateRequest,
  userController.searchByName.bind(userController)
);

// Removido daqui - movido para antes da rota /:id

// Rota temporária para atualizar senha
router.post('/update-password', async (req, res) => {
  try {
    const bcrypt = require('bcrypt');
    const oracledb = require('oracledb');
    const { email, newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });
    
    const result = await connection.execute(
      'UPDATE USUARIOS SET SENHA = :senha WHERE EMAIL = :email',
      { senha: hashedPassword, email: email },
      { autoCommit: true }
    );
    await connection.close();
    
    res.json({ success: true, message: 'Senha atualizada com sucesso', rowsAffected: result.rowsAffected });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Rota de debug para verificar dados do usuário
router.get('/debug-user/:email', async (req, res) => {
  try {
    const oracledb = require('oracledb');
    const { email } = req.params;
    
    const connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });
    
    const result = await connection.execute(
      'SELECT ID, NOME, EMAIL, SENHA, LENGTH(SENHA) AS SENHA_LENGTH FROM USUARIOS WHERE EMAIL = :email',
      { email: email }
    );
    await connection.close();
    
    res.json({ success: true, data: result.rows, columns: result.metaData });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Rota de debug por CPF (não retorna a senha)
router.get('/debug-user-cpf/:cpf', async (req, res) => {
  try {
    const oracledb = require('oracledb');
    const { cpf } = req.params;
    const cpfDigits = cpf.replace(/\D/g, '');

    const connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    const result = await connection.execute(
      `SELECT ID, NOME, E_MAIL, CPF, SENHA, USUARIO_ATIVO
       FROM USUARIOS
       WHERE REGEXP_REPLACE(TO_CHAR(CPF), '[^0-9]', '') = :cpf_digits`,
      { cpf_digits: cpfDigits }
    );

    await connection.close();

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado por CPF' });
    }

    const row = result.rows[0];
    const senha = String(row.SENHA || '');
    const info = {
      id: row.ID,
      nome: row.NOME,
      email: row.E_MAIL,
      cpf: row.CPF,
      usuario_ativo: row.USUARIO_ATIVO,
      senha_length: senha.length,
      is_bcrypt: /^\$2[aby]\$/.test(senha),
      is_md5: /^[a-fA-F0-9]{32}$/.test(senha),
      is_sha1: /^[a-fA-F0-9]{40}$/.test(senha),
      is_sha256: /^[a-fA-F0-9]{64}$/.test(senha),
      is_plain: !(/^\$2[aby]\$/.test(senha) || /^[a-fA-F0-9]{32}$/.test(senha) || /^[a-fA-F0-9]{40}$/.test(senha) || /^[a-fA-F0-9]{64}$/.test(senha))
    };

    res.json({ success: true, data: info });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Verificar senha contra hash armazenado (debug)
router.post('/debug-check-password', async (req, res) => {
  try {
    const { cpf, senha } = req.body || {};
    if (!cpf || !senha) {
      return res.status(400).json({ success: false, error: 'CPF e senha são obrigatórios' });
    }

    const oracledb = require('oracledb');
    const bcrypt = require('bcrypt');

    const cpfDigits = String(cpf).replace(/\D/g, '');
    const connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    const result = await connection.execute(
      `SELECT ID, NOME, E_MAIL, CPF, SENHA, USUARIO_ATIVO
       FROM USUARIOS
       WHERE REGEXP_REPLACE(TO_CHAR(CPF), '[^0-9]', '') = :cpf_digits`,
      { cpf_digits: cpfDigits }
    );
    await connection.close();

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado por CPF' });
    }

    const row = result.rows[0];
    const stored = String(row.SENHA || '');
    const isBcrypt = /^\$2[aby]\$/.test(stored);
    const normalized = stored.startsWith('$2y$') ? ('$2b$' + stored.slice(4)) : stored;

    let matches = false;
    let checkType = 'unknown';
    if (isBcrypt) {
      checkType = 'bcrypt';
      matches = await bcrypt.compare(senha, normalized);
    } else if (/^[a-fA-F0-9]{32}$/.test(stored)) {
      checkType = 'md5';
      const crypto = require('crypto');
      const digest = crypto.createHash('md5').update(senha).digest('hex');
      matches = digest.toLowerCase() === stored.toLowerCase();
    } else if (/^[a-fA-F0-9]{40}$/.test(stored)) {
      checkType = 'sha1';
      const crypto = require('crypto');
      const digest = crypto.createHash('sha1').update(senha).digest('hex');
      matches = digest.toLowerCase() === stored.toLowerCase();
    } else if (/^[a-fA-F0-9]{64}$/.test(stored)) {
      checkType = 'sha256';
      const crypto = require('crypto');
      const digest = crypto.createHash('sha256').update(senha).digest('hex');
      matches = digest.toLowerCase() === stored.toLowerCase();
    } else {
      checkType = 'plain';
      matches = senha === stored.trim();
    }

    res.json({
      success: true,
      data: {
        id: row.ID,
        cpf: row.CPF,
        usuario_ativo: row.USUARIO_ATIVO,
        senha_length: stored.length,
        check_type: checkType,
        prefix: stored.slice(0, 4),
        matches
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Resetar senha por CPF (apenas em desenvolvimento)
router.post('/debug-reset-password-cpf', async (req, res) => {
  try {
    const { cpf, novaSenha } = req.body || {};
    if (!cpf || !novaSenha) {
      return res.status(400).json({ success: false, error: 'CPF e novaSenha são obrigatórios' });
    }

    const oracledb = require('oracledb');
    const bcrypt = require('bcrypt');
    const cpfDigits = String(cpf).replace(/\D/g, '');

    // Validação básica de senha (compatível com validatePassword do modelo)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(novaSenha)) {
      return res.status(400).json({ success: false, error: 'Nova senha não atende aos critérios de segurança' });
    }

    const hashed = await bcrypt.hash(novaSenha, 12);

    const connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    const updateResult = await connection.execute(
      `UPDATE USUARIOS
       SET SENHA = :senha
       WHERE REGEXP_REPLACE(TO_CHAR(CPF), '[^0-9]', '') = :cpf_digits`,
      { senha: hashed, cpf_digits: cpfDigits },
      { autoCommit: true }
    );

    await connection.close();

    if (updateResult.rowsAffected === 0) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado por CPF' });
    }

    res.json({ success: true, data: { cpf: cpfDigits, rowsAffected: updateResult.rowsAffected } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Testar autenticação local por CPF (apenas em desenvolvimento)
router.post('/debug-authenticate-cpf', async (req, res) => {
  try {
    const { cpf, senha } = req.body || {};
    if (!cpf || !senha) {
      return res.status(400).json({ success: false, error: 'CPF e senha são obrigatórios' });
    }

    const authResult = await UserModel.authenticate({ cpf, senha });

    // Se o método não lançar erro, consideramos sucesso e retornamos dados relevantes
    res.json({
      success: true,
      data: {
        user: authResult.user,
        token: authResult.token,
        refreshToken: authResult.refreshToken,
        expiresIn: authResult.expiresIn
      }
    });
  } catch (error) {
    // Autenticação local retorna erros descritivos; repassar com 401
    res.status(401).json({ success: false, error: (error as Error).message });
  }
});

// Versão GET para facilitar teste via querystring (evita issues de JSON)
router.get('/debug-authenticate-cpf-q', async (req, res) => {
  try {
    const cpf = String(req.query.cpf || '').trim();
    const senha = String(req.query.senha || '').trim();
    if (!cpf || !senha) {
      return res.status(400).json({ success: false, error: 'CPF e senha são obrigatórios via query' });
    }

    const authResult = await UserModel.authenticate({ cpf, senha });

    res.json({
      success: true,
      data: {
        user: authResult.user,
        token: authResult.token,
        refreshToken: authResult.refreshToken,
        expiresIn: authResult.expiresIn
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, error: (error as Error).message });
  }
});

// Rota temporária para verificar dados do usuário (sem autenticação)
router.get('/check-user-data/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const oracledb = require('oracledb');
    
    const connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });
    
    const result = await connection.execute(
      'SELECT ID, NOME, EMAIL, SENHA, LENGTH(SENHA) AS SENHA_LENGTH, CARGO FROM USUARIOS WHERE EMAIL = :email',
      { email: email }
    );
    
    await connection.close();
    
    res.json({ 
      success: true, 
      data: result.rows, 
      columns: result.metaData,
      message: `Dados do usuário ${email}`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Rota para criar usuários de teste (limpa e cria 3 usuários)
router.post('/create-test-users', async (req, res) => {
  try {
    const bcrypt = require('bcrypt');
    const oracledb = require('oracledb');
    
    const connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });
    
    // Primeiro, limpa todos os usuários existentes
    await connection.execute('DELETE FROM USUARIOS', {}, { autoCommit: true });
    
    // Cria os 3 usuários de teste
    const users = [
      {
        nome: 'Administrador Sistema',
        email: 'admin@sefaz.go.gov.br',
        senha: await bcrypt.hash('admin123', 10),
        orgao: 'SEFAZ',
        setor: 'ADMINISTRAÇÃO',
        lotacao: 'DIRETORIA',
        perfil: 'ADMIN'
      },
      {
        nome: 'João Silva',
        email: 'joao.silva@sefaz.go.gov.br',
        senha: await bcrypt.hash('123456', 10),
        orgao: 'SEFAZ',
        setor: 'TECNOLOGIA',
        lotacao: 'DESENVOLVIMENTO',
        perfil: 'USER'
      },
      {
        nome: 'Maria Santos',
        email: 'maria.santos@sefaz.go.gov.br',
        senha: await bcrypt.hash('123456', 10),
        orgao: 'SEFAZ',
        setor: 'FINANCEIRO',
        lotacao: 'CONTABILIDADE',
        perfil: 'USER'
      }
    ];
    
    const query = `
        INSERT INTO USUARIOS (ID, NOME, EMAIL, SENHA, DEPARTAMENTO, CARGO, ATIVO, CREATED_AT)
        VALUES (USUARIOS_SEQ.NEXTVAL, :nome, :email, :senha, :orgao, :perfil, 1, CURRENT_TIMESTAMP)
      `;
    
    for (const user of users) {
      await connection.execute(query, {
        nome: user.nome,
        email: user.email,
        senha: user.senha,
        orgao: user.orgao,
        setor: user.setor,
        lotacao: user.lotacao,
        perfil: user.perfil
      }, { autoCommit: true });
    }
    
    await connection.close();
    
    res.json({ 
      success: true, 
      message: 'Usuários de teste criados com sucesso',
      users: users.map(u => ({ nome: u.nome, email: u.email, perfil: u.perfil, setor: u.setor }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/**
 * @route GET /api/users/search-users-and-sectors
 * @desc Buscar usuários e setores combinados (para encomendas) - Rota pública
 * @access Public
 */
router.get(
  '/search-users-and-sectors',
  [
    query('q')
      .notEmpty()
      .withMessage('Termo de busca é obrigatório')
      .isLength({ min: 2, max: 100 })
      .withMessage('Termo de busca deve ter entre 2 e 100 caracteres'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limite deve ser um número entre 1 e 50')
  ],
  validateRequest,
  userController.searchUsersAndSectors.bind(userController)
);

// Aplicar middleware de autenticação para todas as rotas abaixo
router.use(authMiddleware);

/**
 * @route GET /api/users/profile
 * @desc Obter perfil do usuário logado
 * @access Private
 */
router.get(
  '/profile',
  userController.getProfile.bind(userController)
);

/**
 * @route GET /api/users/password-status
 * @desc Obter status da senha padrão (SENHA_ALTERADA)
 * @access Private
 */
router.get(
  '/password-status',
  userController.passwordStatus.bind(userController)
);

/**
 * @route PUT /api/users/profile
 * @desc Atualizar perfil do usuário logado
 * @access Private
 */
router.put(
  '/profile',
  [
    body('nome')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Nome deve ter entre 2 e 100 caracteres'),
    body('telefone')
      .optional()
      .matches(/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/)
      .withMessage('Telefone deve estar no formato válido')
  ],
  validateRequest,
  userController.updateProfile.bind(userController)
);

/**
 * @route PUT /api/users/change-password
 * @desc Alterar senha do usuário logado
 * @access Private
 */
router.put(
  '/change-password',
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 3 }), // 3 tentativas por 15 minutos
  changePasswordValidation,
  validateRequest,
  userController.changePassword.bind(userController)
);

/**
 * @route POST /api/users/logout
 * @desc Fazer logout do usuário
 * @access Private
 */
router.post(
  '/logout',
  userController.logout.bind(userController)
);

/**
 * @route GET /api/users
 * @desc Listar usuários com filtros e paginação
 * @access Private
 */
router.get(
  '/',
  listValidation,
  validateRequest,
  userController.index.bind(userController)
);

/**
 * @route GET /api/users/search
 * @desc Buscar usuários por texto livre
 * @access Private
 */
router.get(
  '/search',
  [
    query('q')
      .notEmpty()
      .withMessage('Termo de busca é obrigatório')
      .isLength({ min: 2, max: 100 })
      .withMessage('Termo de busca deve ter entre 2 e 100 caracteres'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Página deve ser um número inteiro positivo'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limite deve ser um número entre 1 e 100')
  ],
  validateRequest,
  userController.search.bind(userController)
);

/**
 * @route GET /api/users/department/:departamento
 * @desc Buscar usuários por departamento
 * @access Private
 */
router.get(
  '/department/:departamento',
  departmentValidation,
  validateRequest,
  userController.findByDepartment.bind(userController)
);

/**
 * @route GET /api/users/role/:cargo
 * @desc Buscar usuários por cargo
 * @access Private
 */
router.get(
  '/role/:cargo',
  cargoValidation,
  validateRequest,
  userController.findByRole.bind(userController)
);



/**
 * @route GET /api/users/setor/:setor
 * @desc Buscar usuários por setor
 * @access Private
 */
router.get(
  '/setor/:setor',
  [
    param('setor')
      .notEmpty()
      .withMessage('Setor é obrigatório')
      .isLength({ min: 2, max: 200 })
      .withMessage('Setor deve ter entre 2 e 200 caracteres'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Página deve ser um número inteiro positivo'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limite deve ser um número entre 1 e 100')
  ],
  validateRequest,
  userController.findBySetor.bind(userController)
);

/**
 * @route GET /api/users/orgao/:orgao
 * @desc Buscar usuários por órgão
 * @access Private
 */
router.get(
  '/orgao/:orgao',
  [
    param('orgao')
      .notEmpty()
      .withMessage('Órgão é obrigatório')
      .isLength({ min: 2, max: 100 })
      .withMessage('Órgão deve ter entre 2 e 100 caracteres'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Página deve ser um número inteiro positivo'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limite deve ser um número entre 1 e 100')
  ],
  validateRequest,
  userController.findByOrgao.bind(userController)
);

/**
 * @route GET /api/users/:id/org-info
 * @desc Obter dados completos do usuário com informações organizacionais
 * @access Private
 */
router.get(
  '/:id/org-info',
  idValidation,
  validateRequest,
  userController.getUserWithOrgInfo.bind(userController)
);

/**
 * Rota para obter usuários com dados organizacionais
 */
router.get(
  '/with-org-data',
  listValidation,
  validateRequest,
  userController.getUsersWithOrgData.bind(userController)
);

/**
 * @route GET /api/users/stats
 * @desc Obter estatísticas de usuários
 * @access Private (Admin)
 */
router.get(
  '/stats',
  userController.getStats.bind(userController)
);

// Aplicar middleware de autenticação para todas as rotas abaixo
router.use(authMiddleware);

/**
 * @route GET /api/users/profile
 * @desc Obter perfil do usuário logado
 * @access Private
 */
router.get(
  '/profile',
  userController.getProfile.bind(userController)
);


/**
 * @route POST /api/users/logout
 * @desc Fazer logout do usuário
 * @access Private
 */
router.post(
  '/logout',
  userController.logout.bind(userController)
);

/**
 * @route GET /api/users/:id
 * @desc Obter usuário por ID
 * @access Private
 */
router.get(
  '/:id',
  idValidation,
  validateRequest,
  userController.show.bind(userController)
);



/**
 * @route PUT /api/users/:id
 * @desc Atualizar usuário
 * @access Private (Admin ou próprio usuário)
 */
router.put(
  '/:id',
  updateUserValidation,
  validateRequest,
  userController.update.bind(userController)
);

/**
 * @route DELETE /api/users/:id
 * @desc Excluir usuário (soft delete)
 * @access Private (Admin)
 */
router.delete(
  '/:id',
  idValidation,
  validateRequest,
  userController.destroy.bind(userController)
);

/**
 * @route DELETE /api/users
 * @desc Excluir múltiplos usuários (soft delete)
 * @access Private (Admin)
 */
router.delete(
  '/',
  [
    body('ids')
      .isArray({ min: 1 })
      .withMessage('IDs devem ser fornecidos como array')
      .custom((ids) => {
        if (!ids.every((id: any) => Number.isInteger(id) && id > 0)) {
          throw new Error('Todos os IDs devem ser números inteiros positivos');
        }
        return true;
      })
  ],
  validateRequest,
  userController.destroyMultiple.bind(userController)
);

export default router;
export { router as userRoutes };