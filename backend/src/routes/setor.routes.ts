import { Router } from 'express';
import { SetorController } from '../controllers/setor.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { body, param, query } from 'express-validator';

const router = Router();

// ==================== VALIDAÇÕES ====================

/**
 * Validação para ID de setor
 */
const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID deve ser um número inteiro positivo')
];

/**
 * Validação para criação de setor
 */
const createSetorValidation = [
  body('codigo_setor')
    .notEmpty()
    .withMessage('Código do setor é obrigatório')
    .isLength({ min: 1, max: 50 })
    .withMessage('Código do setor deve ter entre 1 e 50 caracteres'),
  body('orgao')
    .notEmpty()
    .withMessage('Órgão é obrigatório')
    .isLength({ min: 2, max: 100 })
    .withMessage('Órgão deve ter entre 2 e 100 caracteres'),
  body('setor')
    .notEmpty()
    .withMessage('Setor é obrigatório')
    .isLength({ min: 2, max: 200 })
    .withMessage('Setor deve ter entre 2 e 200 caracteres'),
  body('lotacao')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Lotação deve ter no máximo 200 caracteres'),
  body('hierarquia_setor')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Hierarquia do setor deve ter no máximo 100 caracteres'),
  body('municipio_lotacao')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Município de lotação deve ter no máximo 100 caracteres'),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Ativo deve ser verdadeiro ou falso')
];

/**
 * Validação para atualização de setor
 */
const updateSetorValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID deve ser um número inteiro positivo'),
  body('codigo_setor')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Código do setor deve ter entre 1 e 50 caracteres'),
  body('orgao')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Órgão deve ter entre 2 e 100 caracteres'),
  body('setor')
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage('Setor deve ter entre 2 e 200 caracteres'),
  body('lotacao')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Lotação deve ter no máximo 200 caracteres'),
  body('hierarquia_setor')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Hierarquia do setor deve ter no máximo 100 caracteres'),
  body('municipio_lotacao')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Município de lotação deve ter no máximo 100 caracteres'),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Ativo deve ser verdadeiro ou falso')
];

/**
 * Validação para listagem com filtros
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
  query('orgao')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Órgão deve ter entre 2 e 100 caracteres'),
  query('setor')
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage('Setor deve ter entre 2 e 200 caracteres'),
  query('municipio_lotacao')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Município deve ter entre 2 e 100 caracteres'),
  query('ativo')
    .optional()
    .isBoolean()
    .withMessage('Ativo deve ser verdadeiro ou falso')
];

/**
 * Validação para busca por órgão
 */
const orgaoValidation = [
  param('orgao')
    .notEmpty()
    .withMessage('Órgão é obrigatório')
    .isLength({ min: 2, max: 100 })
    .withMessage('Órgão deve ter entre 2 e 100 caracteres')
];

/**
 * Validação para busca por hierarquia
 */
const hierarquiaValidation = [
  param('hierarquia')
    .notEmpty()
    .withMessage('Hierarquia é obrigatória')
    .isLength({ min: 2, max: 100 })
    .withMessage('Hierarquia deve ter entre 2 e 100 caracteres')
];

// ==================== ROTAS PROTEGIDAS ====================

// Aplicar middleware de autenticação para todas as rotas
router.use(authMiddleware);

/**
 * @route GET /api/setores
 * @desc Listar setores com filtros e paginação
 * @access Private
 */
router.get(
  '/',
  listValidation,
  validateRequest,
  SetorController.index
);

/**
 * @route GET /api/setores/search
 * @desc Buscar setores por texto livre
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
  SetorController.search
);

/**
 * @route GET /api/setores/orgao/:orgao
 * @desc Buscar setores por órgão
 * @access Private
 */
router.get(
  '/orgao/:orgao',
  [
    ...orgaoValidation,
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
  SetorController.findByOrgao
);

/**
 * @route GET /api/setores/hierarquia/:hierarquia
 * @desc Buscar setores por hierarquia
 * @access Private
 */
router.get(
  '/hierarquia/:hierarquia',
  [
    ...hierarquiaValidation,
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
  SetorController.findByHierarquia
);

/**
 * @route GET /api/setores/ativos
 * @desc Buscar apenas setores ativos
 * @access Private
 */
router.get(
  '/ativos',
  [
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
  SetorController.findAtivos
);

/**
 * @route GET /api/setores/stats
 * @desc Obter estatísticas de setores
 * @access Private
 */
router.get(
  '/stats',
  SetorController.getStats
);

/**
 * @route GET /api/setores/:id
 * @desc Obter setor por ID
 * @access Private
 */
router.get(
  '/:id',
  idValidation,
  validateRequest,
  SetorController.show
);

/**
 * @route POST /api/setores
 * @desc Criar novo setor
 * @access Private (Admin)
 */
router.post(
  '/',
  createSetorValidation,
  validateRequest,
  SetorController.store
);

/**
 * @route PUT /api/setores/:id
 * @desc Atualizar setor
 * @access Private (Admin)
 */
router.put(
  '/:id',
  updateSetorValidation,
  validateRequest,
  SetorController.update
);

/**
 * @route DELETE /api/setores/:id
 * @desc Excluir setor (soft delete)
 * @access Private (Admin)
 */
router.delete(
  '/:id',
  idValidation,
  validateRequest,
  SetorController.destroy
);

/**
 * @route DELETE /api/setores
 * @desc Excluir múltiplos setores (soft delete)
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
  SetorController.destroyMultiple
);

export default router;
export { router as setorRoutes };