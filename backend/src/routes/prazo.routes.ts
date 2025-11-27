import { Router } from 'express';
import { PrazoController } from '../controllers/prazo.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { body, param, query } from 'express-validator';

const router = Router();
const prazoController = new PrazoController();

const createValidation = [
  body('titulo').notEmpty().withMessage('Título é obrigatório'),
  body('descricao').notEmpty().withMessage('Descrição é obrigatória'),
  body('dataVencimento').notEmpty().withMessage('Data de vencimento é obrigatória'),
  body('status').isIn(['pendente', 'em_andamento', 'concluido', 'vencido']).withMessage('Status inválido'),
  body('prioridade').isIn(['baixa', 'media', 'alta', 'urgente']).withMessage('Prioridade inválida'),
  body('responsavel').notEmpty().withMessage('Responsável é obrigatório')
];

const updateValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
  body('titulo').optional().notEmpty().withMessage('Título não pode estar vazio'),
  body('status').optional().isIn(['pendente', 'em_andamento', 'concluido', 'vencido']).withMessage('Status inválido'),
  body('prioridade').optional().isIn(['baixa', 'media', 'alta', 'urgente']).withMessage('Prioridade inválida')
];

const idValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido')
];

const listValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Página inválida'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite inválido')
];

router.get('/', listValidation, validateRequest, prazoController.index.bind(prazoController));
router.get('/search', validateRequest, prazoController.search.bind(prazoController));
router.get('/stats', prazoController.getStats.bind(prazoController));
router.get('/vencidos', prazoController.getVencidos.bind(prazoController));
router.get('/proximos', prazoController.getProximos.bind(prazoController));
router.get('/:id', idValidation, validateRequest, prazoController.show.bind(prazoController));
router.post('/', createValidation, validateRequest, prazoController.store.bind(prazoController));
router.put('/:id', updateValidation, validateRequest, prazoController.update.bind(prazoController));
router.delete('/:id', idValidation, validateRequest, prazoController.destroy.bind(prazoController));

export default router;
export { router as prazoRoutes };