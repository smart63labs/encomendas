import { Router } from 'express';
import { LdapController } from '../controllers/ldap.controller';

const router = Router();
const ldapController = new LdapController();

// Rotas LDAP (sem middleware de autenticação para permitir testes)
router.post('/test-connection', ldapController.testConnection.bind(ldapController));
router.get('/status', ldapController.getStatus.bind(ldapController));
router.post('/test-user-authentication', ldapController.testUserAuthentication.bind(ldapController));

export default router;