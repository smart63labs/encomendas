import { Router } from 'express';
import { EncomendaController } from '../controllers/encomenda.controller';
import { validateRequest } from '../middleware/validation.middleware';
import { authMiddleware, requireAdmin } from '../middleware/auth.middleware';
import { body, param, query } from 'express-validator';
import sse from '../services/sse.service';

const router = Router();
const encomendaController = new EncomendaController();

const createValidation = [
  body('numeroProtocolo').notEmpty().withMessage('Número do protocolo é obrigatório'),
  body('remetente').notEmpty().withMessage('Remetente é obrigatório'),
  body('destinatario').notEmpty().withMessage('Destinatário é obrigatório'),
  body('descricao').notEmpty().withMessage('Descrição é obrigatória'),
  body('status').isIn(['pendente', 'em_transito', 'entregue', 'devolvida']).withMessage('Status inválido')
];

// Validação específica para o wizard de encomendas
const wizardValidation = [
  body('tipo').notEmpty().withMessage('Tipo é obrigatório'),
  body('remetente').notEmpty().withMessage('Remetente é obrigatório'),
  body('destinatario').notEmpty().withMessage('Destinatário é obrigatório'),
  body('descricao').notEmpty().withMessage('Descrição é obrigatória')
];

const updateValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
  body('descricao').optional().notEmpty().withMessage('Descrição não pode estar vazia'),
  body('status').optional().isIn(['pendente', 'em_transito', 'entregue', 'devolvida']).withMessage('Status inválido')
];

const idValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido')
];

const listValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Página inválida'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite inválido')
];

router.get('/', listValidation, validateRequest, authMiddleware, encomendaController.index.bind(encomendaController));
router.get('/stats', validateRequest, encomendaController.getStats.bind(encomendaController));
router.get('/search', validateRequest, encomendaController.search.bind(encomendaController));
router.get('/notifications/:userId', validateRequest, encomendaController.getNotifications.bind(encomendaController));

// SSE: stream de atualizações de encomendas (deve vir antes de rotas dinâmicas)
// Nota: SSE não suporta headers customizados, então não usamos authMiddleware aqui
router.get('/stream', (req, res) => {
  console.log('📡 Cliente SSE conectado em /encomendas/stream');
  
  // Validação opcional via query param se necessário
  // const token = req.query.token;
  // if (token) { /* validar token */ }
  
  try {
    sse.setupStream(req, res);
  } catch (error) {
    console.error('❌ Erro ao configurar stream SSE:', error);
    res.status(500).json({ success: false, error: 'Erro ao configurar stream' });
  }
});

// Rota específica para o wizard de encomendas (deve vir antes de rotas dinâmicas)
router.post('/wizard', wizardValidation, validateRequest, authMiddleware, encomendaController.storeFromWizard.bind(encomendaController));
router.get('/:id', idValidation, validateRequest, encomendaController.show.bind(encomendaController));
router.post('/', createValidation, validateRequest, authMiddleware, encomendaController.store.bind(encomendaController));
router.put('/:id', updateValidation, validateRequest, authMiddleware, encomendaController.update.bind(encomendaController));
router.put('/:id/confirm-receipt', idValidation, validateRequest, authMiddleware, encomendaController.confirmReceipt.bind(encomendaController));
router.delete('/:id', idValidation, validateRequest, authMiddleware, requireAdmin, encomendaController.destroy.bind(encomendaController));

export default router;
export { router as encomendaRoutes };