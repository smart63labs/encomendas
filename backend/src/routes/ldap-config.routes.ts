import { Router } from 'express';
import ldapConfigController from '../controllers/ldap-config.controller';

const router = Router();

/**
 * @route POST /api/ldap-config/salvar
 * @desc Salvar configurações LDAP na tabela CONFIGURACOES_AUTENTICACAO
 * @access Private
 */
router.post('/salvar', ldapConfigController.salvar);

/**
 * @route GET /api/ldap-config/buscar
 * @desc Buscar configurações LDAP da tabela CONFIGURACOES_AUTENTICACAO
 * @access Private
 */
router.get('/buscar', ldapConfigController.buscar);

export default router;