import { Router } from 'express';
import userRoutes from './user.routes';
import processRoutes from './process.routes';
import databaseRoutes from './database.routes';
import documentoRoutes from './documento.routes';
import tramitacaoRoutes from './tramitacao.routes';
import encomendaRoutes from './encomenda.routes';
import maloteRoutes from './malote.routes';
import prazoRoutes from './prazo.routes';
import setoresRoutes from './setores.routes';
import configuracaoRoutes from './configuracao.routes';
import routingRoutes from './routing.routes';
import databaseGeolocationRoutes from './database-geolocation.routes';
import geocodingRoutes from './geocoding.routes';
import ldapRoutes from './ldap.routes';
import ldapConfigRoutes from './ldap-config.routes';
import lacresRoutes from './lacres.routes';
import { Request, Response } from 'express';

const router = Router();

/**
 * Rota de health check da API
 * @route GET /api/health
 * @desc Verificar se a API está funcionando
 * @access Public
 */
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API está funcionando corretamente',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Rota de informações da API
 * @route GET /api/info
 * @desc Obter informações básicas da API
 * @access Public
 */
router.get('/info', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      name: 'Sistema de Protocolo - API REST',
      description: 'API REST para gerenciamento de processos administrativos',
      version: process.env.API_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: 'Oracle 19c',
      documentation: '/api/docs',
      endpoints: {
        users: '/api/users',
        processes: '/api/processes',
        database: '/api/database',
        documentos: '/api/documentos',
        configuracoes: '/api/configuracoes',
        tramitacoes: '/api/tramitacoes',
        encomendas: '/api/encomendas',
        malotes: '/api/malotes',
        prazos: '/api/prazos',
        setores: '/api/setores',
        health: '/api/health',
        info: '/api/info'
      }
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Registrar rotas dos módulos
 */
router.use('/users', userRoutes);
router.use('/processes', processRoutes);
router.use('/database', databaseRoutes);
router.use('/documentos', documentoRoutes);
router.use('/tramitacoes', tramitacaoRoutes);
router.use('/encomendas', encomendaRoutes);
router.use('/malotes', maloteRoutes);
router.use('/prazos', prazoRoutes);
router.use('/setores', setoresRoutes);
router.use('/configuracoes', configuracaoRoutes);
router.use('/routing', routingRoutes);
router.use('/database-geolocation', databaseGeolocationRoutes);
router.use('/geocoding', geocodingRoutes);
router.use('/ldap', ldapRoutes);
router.use('/ldap-config', ldapConfigRoutes);
router.use('/lacres', lacresRoutes);

/**
 * Rota para endpoints não encontrados
 * @route * /api/*
 * @desc Capturar rotas não definidas
 * @access Public
 */
router.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
    error: {
      code: 'ENDPOINT_NOT_FOUND',
      details: `A rota ${req.method} ${req.originalUrl} não existe`,
      availableEndpoints: {
        health: 'GET /api/health',
        info: 'GET /api/info',
        users: 'GET /api/users',
        processes: 'GET /api/processes',
        database: 'GET /api/database'
      }
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
export { router as apiRoutes };