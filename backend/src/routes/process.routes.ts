import { Router } from 'express';
import { ProcessController } from '../controllers/process.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware';
import { body, param, query } from 'express-validator';

const router = Router();
const processController = new ProcessController();

/**
 * Validações para criação de processo
 */
const createProcessValidation = [
  body('assunto')
    .notEmpty()
    .withMessage('Assunto é obrigatório')
    .isLength({ min: 5, max: 200 })
    .withMessage('Assunto deve ter entre 5 e 200 caracteres'),
  body('descricao')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Descrição deve ter no máximo 1000 caracteres'),
  body('tipo_processo')
    .notEmpty()
    .withMessage('Tipo de processo é obrigatório')
    .isLength({ min: 2, max: 50 })
    .withMessage('Tipo de processo deve ter entre 2 e 50 caracteres'),
  body('prioridade')
    .optional()
    .isIn(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE'])
    .withMessage('Prioridade deve ser: BAIXA, NORMAL, ALTA ou URGENTE'),
  body('origem')
    .notEmpty()
    .withMessage('Origem é obrigatória')
    .isLength({ min: 2, max: 100 })
    .withMessage('Origem deve ter entre 2 e 100 caracteres'),
  body('destino')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Destino deve ter entre 2 e 100 caracteres'),
  body('setor_atual')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Setor atual deve ter entre 2 e 50 caracteres'),
  body('data_prazo')
    .optional()
    .isISO8601()
    .withMessage('Data de prazo deve estar no formato ISO 8601')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Data de prazo deve ser futura');
      }
      return true;
    }),
  body('observacoes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Observações devem ter no máximo 500 caracteres'),
  body('confidencial')
    .optional()
    .isBoolean()
    .withMessage('Confidencial deve ser verdadeiro ou falso'),
  body('valor_estimado')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Valor estimado deve ser um número positivo'),
  body('tags')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Tags devem ter no máximo 200 caracteres')
];

/**
 * Validações para atualização de processo
 */
const updateProcessValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID deve ser um número inteiro positivo'),
  body('assunto')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Assunto deve ter entre 5 e 200 caracteres'),
  body('descricao')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Descrição deve ter no máximo 1000 caracteres'),
  body('tipo_processo')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Tipo de processo deve ter entre 2 e 50 caracteres'),
  body('prioridade')
    .optional()
    .isIn(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE'])
    .withMessage('Prioridade deve ser: BAIXA, NORMAL, ALTA ou URGENTE'),
  body('destino')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Destino deve ter entre 2 e 100 caracteres'),
  body('setor_atual')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Setor atual deve ter entre 2 e 50 caracteres'),
  body('data_prazo')
    .optional()
    .isISO8601()
    .withMessage('Data de prazo deve estar no formato ISO 8601'),
  body('observacoes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Observações devem ter no máximo 500 caracteres'),
  body('confidencial')
    .optional()
    .isBoolean()
    .withMessage('Confidencial deve ser verdadeiro ou falso'),
  body('valor_estimado')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Valor estimado deve ser um número positivo'),
  body('tags')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Tags devem ter no máximo 200 caracteres')
];

/**
 * Validações para tramitação
 */
const tramitarValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID deve ser um número inteiro positivo'),
  body('setorDestino')
    .notEmpty()
    .withMessage('Setor de destino é obrigatório')
    .isLength({ min: 2, max: 50 })
    .withMessage('Setor de destino deve ter entre 2 e 50 caracteres'),
  body('observacoes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Observações devem ter no máximo 500 caracteres')
];

/**
 * Validações para mudança de status
 */
const changeStatusValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID deve ser um número inteiro positivo'),
  body('status')
    .notEmpty()
    .withMessage('Status é obrigatório')
    .isIn(['ABERTO', 'EM_ANDAMENTO', 'SUSPENSO', 'CONCLUIDO', 'ARQUIVADO'])
    .withMessage('Status deve ser: ABERTO, EM_ANDAMENTO, SUSPENSO, CONCLUIDO ou ARQUIVADO'),
  body('observacoes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Observações devem ter no máximo 500 caracteres')
];

/**
 * Validações para mudança de prioridade
 */
const changePriorityValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID deve ser um número inteiro positivo'),
  body('prioridade')
    .notEmpty()
    .withMessage('Prioridade é obrigatória')
    .isIn(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE'])
    .withMessage('Prioridade deve ser: BAIXA, NORMAL, ALTA ou URGENTE'),
  body('observacoes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Observações devem ter no máximo 500 caracteres')
];

/**
 * Validações para atribuição de responsável
 */
const assignResponsibleValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID deve ser um número inteiro positivo'),
  body('responsavelId')
    .isInt({ min: 1 })
    .withMessage('ID do responsável deve ser um número inteiro positivo'),
  body('observacoes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Observações devem ter no máximo 500 caracteres')
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
 * Validações para número de processo
 */
const numeroValidation = [
  param('numero')
    .notEmpty()
    .withMessage('Número do processo é obrigatório')
    .isLength({ min: 5, max: 50 })
    .withMessage('Número do processo deve ter entre 5 e 50 caracteres')
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
  query('numero_processo')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Número do processo deve ter entre 2 e 50 caracteres'),
  query('assunto')
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage('Assunto deve ter entre 2 e 200 caracteres'),
  query('tipo_processo')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Tipo de processo deve ter entre 2 e 50 caracteres'),
  query('prioridade')
    .optional()
    .isIn(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE'])
    .withMessage('Prioridade deve ser: BAIXA, NORMAL, ALTA ou URGENTE'),
  query('status')
    .optional()
    .isIn(['ABERTO', 'EM_ANDAMENTO', 'SUSPENSO', 'CONCLUIDO', 'ARQUIVADO'])
    .withMessage('Status deve ser: ABERTO, EM_ANDAMENTO, SUSPENSO, CONCLUIDO ou ARQUIVADO'),
  query('origem')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Origem deve ter entre 2 e 100 caracteres'),
  query('destino')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Destino deve ter entre 2 e 100 caracteres'),
  query('setor_atual')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Setor atual deve ter entre 2 e 50 caracteres'),
  query('usuario_criador')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID do usuário criador deve ser um número inteiro positivo'),
  query('usuario_responsavel')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID do usuário responsável deve ser um número inteiro positivo'),
  query('confidencial')
    .optional()
    .isBoolean()
    .withMessage('Confidencial deve ser verdadeiro ou falso'),
  query('tags')
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage('Tags devem ter entre 2 e 200 caracteres'),
  query('data_abertura_inicio')
    .optional()
    .isISO8601()
    .withMessage('Data de abertura inicial deve estar no formato ISO 8601'),
  query('data_abertura_fim')
    .optional()
    .isISO8601()
    .withMessage('Data de abertura final deve estar no formato ISO 8601'),
  query('data_prazo_inicio')
    .optional()
    .isISO8601()
    .withMessage('Data de prazo inicial deve estar no formato ISO 8601'),
  query('data_prazo_fim')
    .optional()
    .isISO8601()
    .withMessage('Data de prazo final deve estar no formato ISO 8601')
];

// ==================== APLICAR MIDDLEWARE DE AUTENTICAÇÃO ====================

// Todas as rotas de processo requerem autenticação
router.use(authMiddleware);

// ==================== ROTAS DE LISTAGEM E BUSCA ====================

/**
 * @route GET /api/processes
 * @desc Listar processos com filtros e paginação
 * @access Private
 */
router.get(
  '/',
  listValidation,
  validateRequest,
  processController.index.bind(processController)
);

/**
 * @route GET /api/processes/search
 * @desc Buscar processos por texto livre
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
  processController.search.bind(processController)
);

/**
 * @route GET /api/processes/my-processes
 * @desc Buscar processos criados pelo usuário logado
 * @access Private
 */
router.get(
  '/my-processes',
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
  processController.myProcesses.bind(processController)
);

/**
 * @route GET /api/processes/my-responsibilities
 * @desc Buscar processos sob responsabilidade do usuário logado
 * @access Private
 */
router.get(
  '/my-responsibilities',
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
  processController.myResponsibilities.bind(processController)
);

/**
 * @route GET /api/processes/overdue
 * @desc Buscar processos em atraso
 * @access Private
 */
router.get(
  '/overdue',
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
  processController.overdue.bind(processController)
);

/**
 * @route GET /api/processes/due-today
 * @desc Buscar processos vencendo hoje
 * @access Private
 */
router.get(
  '/due-today',
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
  processController.dueToday.bind(processController)
);

/**
 * @route GET /api/processes/due-this-week
 * @desc Buscar processos vencendo esta semana
 * @access Private
 */
router.get(
  '/due-this-week',
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
  processController.dueThisWeek.bind(processController)
);

/**
 * @route GET /api/processes/stats
 * @desc Obter estatísticas de processos
 * @access Private (Admin)
 */
router.get(
  '/stats',
  processController.getStats.bind(processController)
);

/**
 * @route GET /api/processes/number/:numero
 * @desc Buscar processo por número
 * @access Private
 */
router.get(
  '/number/:numero',
  numeroValidation,
  validateRequest,
  processController.findByNumber.bind(processController)
);

/**
 * @route GET /api/processes/:id
 * @desc Obter processo por ID
 * @access Private
 */
router.get(
  '/:id',
  idValidation,
  validateRequest,
  processController.show.bind(processController)
);

/**
 * @route GET /api/processes/:id/history
 * @desc Obter histórico de tramitação do processo
 * @access Private
 */
router.get(
  '/:id/history',
  [
    ...idValidation,
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
  processController.getHistory.bind(processController)
);

// ==================== ROTAS DE CRIAÇÃO E ATUALIZAÇÃO ====================

/**
 * @route POST /api/processes
 * @desc Criar novo processo
 * @access Private
 */
router.post(
  '/',
  rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 20 }), // 20 criações por 15 minutos
  createProcessValidation,
  validateRequest,
  processController.store.bind(processController)
);

/**
 * @route PUT /api/processes/:id
 * @desc Atualizar processo
 * @access Private
 */
router.put(
  '/:id',
  updateProcessValidation,
  validateRequest,
  processController.update.bind(processController)
);

// ==================== ROTAS DE TRAMITAÇÃO E GESTÃO ====================

/**
 * @route PUT /api/processes/:id/tramitar
 * @desc Tramitar processo para outro setor
 * @access Private
 */
router.put(
  '/:id/tramitar',
  tramitarValidation,
  validateRequest,
  processController.tramitar.bind(processController)
);

/**
 * @route PUT /api/processes/:id/status
 * @desc Alterar status do processo
 * @access Private
 */
router.put(
  '/:id/status',
  changeStatusValidation,
  validateRequest,
  processController.changeStatus.bind(processController)
);

/**
 * @route PUT /api/processes/:id/priority
 * @desc Alterar prioridade do processo
 * @access Private
 */
router.put(
  '/:id/priority',
  changePriorityValidation,
  validateRequest,
  processController.changePriority.bind(processController)
);

/**
 * @route PUT /api/processes/:id/assign
 * @desc Atribuir responsável ao processo
 * @access Private
 */
router.put(
  '/:id/assign',
  assignResponsibleValidation,
  validateRequest,
  processController.assignResponsible.bind(processController)
);

// ==================== ROTAS DE EXCLUSÃO ====================

/**
 * @route DELETE /api/processes/:id
 * @desc Excluir processo (soft delete)
 * @access Private
 */
router.delete(
  '/:id',
  idValidation,
  validateRequest,
  processController.destroy.bind(processController)
);

/**
 * @route DELETE /api/processes
 * @desc Excluir múltiplos processos (soft delete)
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
  processController.destroyMultiple.bind(processController)
);

export default router;
export { router as processRoutes };