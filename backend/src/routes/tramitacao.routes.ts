import { Router } from 'express';
import { TramitacaoController } from '../controllers/tramitacao.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { body, param, query } from 'express-validator';

const router = Router();
const tramitacaoController = new TramitacaoController();

const createValidation = [
  body('numeroProtocolo').notEmpty().withMessage('Número do protocolo é obrigatório'),
  body('assunto').notEmpty().withMessage('Assunto é obrigatório'),
  body('remetente').notEmpty().withMessage('Remetente é obrigatório'),
  body('destinatario').notEmpty().withMessage('Destinatário é obrigatório'),
  body('status').isIn(['pendente', 'em_andamento', 'concluida', 'cancelada']).withMessage('Status inválido'),
  body('prioridade').isIn(['baixa', 'media', 'alta', 'urgente']).withMessage('Prioridade inválida'),
  body('dataInicio').notEmpty().withMessage('Data de início é obrigatória')
];

const updateValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
  body('assunto').optional().notEmpty().withMessage('Assunto não pode estar vazio'),
  body('status').optional().isIn(['pendente', 'em_andamento', 'concluida', 'cancelada']).withMessage('Status inválido'),
  body('prioridade').optional().isIn(['baixa', 'media', 'alta', 'urgente']).withMessage('Prioridade inválida')
];

const idValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido')
];

const listValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Página inválida'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite inválido')
];

router.get('/', listValidation, validateRequest, tramitacaoController.index.bind(tramitacaoController));
router.get('/search', validateRequest, tramitacaoController.search.bind(tramitacaoController));
router.get('/stats', tramitacaoController.getStats.bind(tramitacaoController));
router.get('/:id', idValidation, validateRequest, tramitacaoController.show.bind(tramitacaoController));
router.post('/', createValidation, validateRequest, tramitacaoController.store.bind(tramitacaoController));
router.put('/:id', updateValidation, validateRequest, tramitacaoController.update.bind(tramitacaoController));
router.delete('/:id', idValidation, validateRequest, tramitacaoController.destroy.bind(tramitacaoController));

export default router;
export { router as tramitacaoRoutes };