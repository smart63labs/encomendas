import { Router } from 'express';
import { LdapController } from '../controllers/ldap.controller';

const router = Router();
const controller = new LdapController(); // Passando nome da tabela ou contexto com cast

// Rotas LDAP (sem middleware de autenticação para permitir testes)
router.post('/test-connection', controller.testConnection.bind(controller));
router.get('/status', controller.getStatus.bind(controller));
router.post('/test-user-authentication', controller.testUserAuthentication.bind(controller));

export default router;