import { Router } from 'express';
import { ConfiguracoesController } from '../controllers/configuracoes.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const configuracoesController = new ConfiguracoesController();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

// Rotas para configurações
router.get('/', configuracoesController.buscarTodas.bind(configuracoesController));
router.get('/categoria/:categoria', configuracoesController.buscarPorCategoria.bind(configuracoesController));
router.put('/:id', configuracoesController.atualizar.bind(configuracoesController));

export default router;