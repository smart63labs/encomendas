import { Router } from 'express';
import { DocumentoController } from '../controllers/documento.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { body, param, query } from 'express-validator';

const router = Router();
const documentoController = new DocumentoController();

/**
 * Validações para criação de documento
 */
const createDocumentoValidation = [
  body('nome')
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .isLength({ min: 2, max: 200 })
    .withMessage('Nome deve ter entre 2 e 200 caracteres'),
  body('tipo')
    .notEmpty()
    .withMessage('Tipo é obrigatório'),
  body('extensao')
    .notEmpty()
    .withMessage('Extensão é obrigatória'),
  body('tamanho')
    .isInt({ min: 1 })
    .withMessage('Tamanho deve ser um número positivo'),
  body('categoria')
    .notEmpty()
    .withMessage('Categoria é obrigatória'),
  body('pasta')
    .notEmpty()
    .withMessage('Pasta é obrigatória'),
  body('nivelAcesso')
    .isIn(['publico', 'restrito', 'confidencial'])
    .withMessage('Nível de acesso deve ser: publico, restrito ou confidencial'),
  body('uploadedBy')
    .notEmpty()
    .withMessage('Usuário que fez upload é obrigatório'),
  body('status')
    .optional()
    .isIn(['ativo', 'arquivado', 'excluido'])
    .withMessage('Status deve ser: ativo, arquivado ou excluido')
];

/**
 * Validações para atualização de documento
 */
const updateDocumentoValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID deve ser um número inteiro positivo'),
  body('nome')
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage('Nome deve ter entre 2 e 200 caracteres'),
  body('categoria')
    .optional()
    .notEmpty()
    .withMessage('Categoria não pode estar vazia'),
  body('pasta')
    .optional()
    .notEmpty()
    .withMessage('Pasta não pode estar vazia'),
  body('nivelAcesso')
    .optional()
    .isIn(['publico', 'restrito', 'confidencial'])
    .withMessage('Nível de acesso deve ser: publico, restrito ou confidencial'),
  body('status')
    .optional()
    .isIn(['ativo', 'arquivado', 'excluido'])
    .withMessage('Status deve ser: ativo, arquivado ou excluido')
];

/**
 * Validação de ID
 */
const idValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID deve ser um número inteiro positivo')
];

/**
 * Validações para listagem
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
  query('categoria')
    .optional()
    .notEmpty()
    .withMessage('Categoria não pode estar vazia'),
  query('pasta')
    .optional()
    .notEmpty()
    .withMessage('Pasta não pode estar vazia'),
  query('nivelAcesso')
    .optional()
    .isIn(['publico', 'restrito', 'confidencial'])
    .withMessage('Nível de acesso deve ser: publico, restrito ou confidencial'),
  query('status')
    .optional()
    .isIn(['ativo', 'arquivado', 'excluido'])
    .withMessage('Status deve ser: ativo, arquivado ou excluido')
];

/**
 * @route GET /api/documentos
 * @desc Listar documentos com paginação e filtros
 * @access Private
 */
router.get(
  '/',
  listValidation,
  validateRequest,
  documentoController.index.bind(documentoController)
);

/**
 * @route GET /api/documentos/search
 * @desc Buscar documentos
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
  documentoController.search.bind(documentoController)
);

/**
 * @route GET /api/documentos/stats
 * @desc Obter estatísticas dos documentos
 * @access Private
 */
router.get(
  '/stats',
  documentoController.getStats.bind(documentoController)
);

/**
 * @route GET /api/documentos/:id
 * @desc Obter documento por ID
 * @access Private
 */
router.get(
  '/:id',
  idValidation,
  validateRequest,
  documentoController.show.bind(documentoController)
);

/**
 * @route POST /api/documentos
 * @desc Criar novo documento
 * @access Private
 */
router.post(
  '/',
  createDocumentoValidation,
  validateRequest,
  documentoController.store.bind(documentoController)
);

/**
 * @route PUT /api/documentos/:id
 * @desc Atualizar documento
 * @access Private
 */
router.put(
  '/:id',
  updateDocumentoValidation,
  validateRequest,
  documentoController.update.bind(documentoController)
);

/**
 * @route DELETE /api/documentos/:id
 * @desc Excluir documento
 * @access Private
 */
router.delete(
  '/:id',
  idValidation,
  validateRequest,
  documentoController.destroy.bind(documentoController)
);

export default router;
export { router as documentoRoutes };