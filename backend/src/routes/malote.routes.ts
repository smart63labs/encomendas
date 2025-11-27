import { Router } from 'express';
import MaloteController from '../controllers/malote.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const controller = new MaloteController();

// Listar com paginação e filtros
router.get('/', authMiddleware, (req, res, next) => controller.index(req as any, res, next));
// Listar disponíveis por eventos (Entregue/Sim)
router.get('/disponiveis', authMiddleware, (req, res, next) => controller.availableByEvents(req as any, res, next));
// Status por eventos (disponível/indisponível) para todos os malotes do setor
router.get('/status-eventos', authMiddleware, (req, res, next) => controller.statusByEvents(req as any, res, next));
// Dados agregados para o mapa de malotes
router.get('/mapa', authMiddleware, (req, res, next) => controller.mapData(req as any, res, next));
// Contar
router.get('/count', authMiddleware, (req, res, next) => controller.count(req as any, res, next));
// Buscar por ID
router.get('/:id', authMiddleware, (req, res, next) => controller.show(req as any, res, next));
// Criar
router.post('/', authMiddleware, (req, res, next) => controller.store(req as any, res, next));
// Atualizar
router.put('/:id', authMiddleware, (req, res, next) => controller.update(req as any, res, next));
// Excluir
router.delete('/:id', authMiddleware, (req, res, next) => controller.destroy(req as any, res, next));

export default router;