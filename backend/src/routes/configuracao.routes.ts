import { Router } from 'express';
import { ConfiguracaoController } from '../controllers/configuracao.controller';
import { ConfiguracaoGeralController } from '../controllers/configuracao-geral.controller';
import { ConfiguracaoSegurancaController } from '../controllers/configuracao-seguranca.controller';
import { ConfiguracaoNotificacoesController } from '../controllers/configuracao-notificacoes.controller';
import { ConfiguracaoSistemaController } from '../controllers/configuracao-sistema.controller';
import { ConfiguracaoAparenciaController } from '../controllers/configuracao-aparencia.controller';
import { ConfiguracaoApisController } from '../controllers/configuracao-apis.controller';

const router = Router();
const configuracaoController = new ConfiguracaoController();
const configuracaoGeralController = new ConfiguracaoGeralController();
const configuracaoSegurancaController = new ConfiguracaoSegurancaController();
const configuracaoNotificacoesController = new ConfiguracaoNotificacoesController();
const configuracaoSistemaController = new ConfiguracaoSistemaController();
const configuracaoAparenciaController = new ConfiguracaoAparenciaController();
const configuracaoApisController = new ConfiguracaoApisController();

/**
 * @route GET /api/configuracoes
 * @desc Lista todas as configurações com filtros opcionais
 * @query categoria - Filtrar por categoria
 * @query chave - Buscar por chave (parcial)
 * @query ativo - Filtrar por status ativo (true/false)
 * @query editavel - Filtrar por editável (true/false)
 * @query obrigatoria - Filtrar por obrigatória (true/false)
 * @query ordenarPor - Campo para ordenação (categoria, chave, ordemExibicao, dataCriacao, dataAlteracao)
 * @query direcao - Direção da ordenação (ASC/DESC)
 * @query pagina - Número da página (padrão: 1)
 * @query limite - Itens por página (padrão: 50)
 */
router.get('/', (req, res) => configuracaoController.listar(req, res));

/**
 * @route GET /api/configuracoes/categorias
 * @desc Lista todas as categorias disponíveis
 */
router.get('/categorias', (req, res) => configuracaoController.listarCategorias(req, res));

// ==================== ROTAS ESPECÍFICAS POR ABA (DEVEM VIR ANTES DAS ROTAS GENÉRICAS) ====================

/**
 * @route GET /api/configuracoes/geral/:configuracaoId
 * @desc Busca configurações gerais por ID de configuração
 * @param configuracaoId - ID da configuração principal
 */
router.get('/geral/:configuracaoId(\\d+)', (req, res) => configuracaoGeralController.buscarPorConfiguracaoId(req, res));

/**
 * @route PUT /api/configuracoes/geral/:configuracaoId
 * @desc Salva configurações gerais
 * @param configuracaoId - ID da configuração principal
 * @body ConfiguracaoGeral
 */
router.put('/geral/:configuracaoId(\\d+)', (req, res) => configuracaoGeralController.salvar(req, res));

/**
 * @route GET /api/configuracoes/seguranca/:configuracaoId
 * @desc Busca configurações de segurança por ID de configuração
 * @param configuracaoId - ID da configuração principal
 */
router.get('/seguranca/:configuracaoId(\\d+)', (req, res) => configuracaoSegurancaController.buscarPorConfiguracaoId(req, res));

/**
 * @route PUT /api/configuracoes/seguranca/:configuracaoId
 * @desc Salva configurações de segurança
 * @param configuracaoId - ID da configuração principal
 * @body ConfiguracaoSeguranca
 */
router.put('/seguranca/:configuracaoId(\\d+)', (req, res) => configuracaoSegurancaController.salvar(req, res));

/**
 * @route GET /api/configuracoes/notificacoes/:configuracaoId
 * @desc Busca configurações de notificações por ID de configuração
 * @param configuracaoId - ID da configuração principal
 */
router.get('/notificacoes/:configuracaoId(\\d+)', (req, res) => configuracaoNotificacoesController.buscarPorConfiguracaoId(req, res));

/**
 * @route PUT /api/configuracoes/notificacoes/:configuracaoId
 * @desc Salva configurações de notificações
 * @param configuracaoId - ID da configuração principal
 * @body ConfiguracaoNotificacoes
 */
router.put('/notificacoes/:configuracaoId(\\d+)', (req, res) => configuracaoNotificacoesController.salvar(req, res));

/**
 * @route GET /api/configuracoes/sistema/:configuracaoId
 * @desc Busca configurações de sistema por ID de configuração
 * @param configuracaoId - ID da configuração principal
 */
router.get('/sistema/:configuracaoId(\\d+)', (req, res) => configuracaoSistemaController.buscarPorConfiguracaoId(req, res));

/**
 * @route PUT /api/configuracoes/sistema/:configuracaoId
 * @desc Salva configurações de sistema
 * @param configuracaoId - ID da configuração principal
 * @body ConfiguracaoSistema
 */
router.put('/sistema/:configuracaoId(\\d+)', (req, res) => configuracaoSistemaController.salvar(req, res));

/**
 * @route GET /api/configuracoes/aparencia/:configuracaoId
 * @desc Busca configurações de aparência por ID de configuração
 * @param configuracaoId - ID da configuração principal
 */
router.get('/aparencia/:configuracaoId(\\d+)', (req, res) => configuracaoAparenciaController.buscarPorConfiguracaoId(req, res));

/**
 * @route PUT /api/configuracoes/aparencia/:configuracaoId
 * @desc Salva configurações de aparência
 * @param configuracaoId - ID da configuração principal
 * @body ConfiguracaoAparencia
 */
router.put('/aparencia/:configuracaoId(\\d+)', (req, res) => configuracaoAparenciaController.salvar(req, res));

/**
 * @route GET /api/configuracoes/apis/:configuracaoId
 * @desc Busca configurações de APIs por ID de configuração
 * @param configuracaoId - ID da configuração principal
 */
router.get('/apis/:configuracaoId(\\d+)', (req, res) => configuracaoApisController.buscarPorConfiguracaoId(req, res));

/**
 * @route PUT /api/configuracoes/apis/:configuracaoId
 * @desc Salva configurações de APIs
 * @param configuracaoId - ID da configuração principal
 * @body ConfiguracaoApis
 */
router.put('/apis/:configuracaoId(\\d+)', (req, res) => configuracaoApisController.salvar(req, res));

// ==================== ROTAS GENÉRICAS (DEVEM VIR APÓS AS ROTAS ESPECÍFICAS) ====================

/**
 * @route GET /api/configuracoes/:id
 * @desc Busca configuração por ID
 * @param id - ID da configuração
 */
router.get('/:id', (req, res) => configuracaoController.buscarPorId(req, res));

/**
 * @route GET /api/configuracoes/:categoria/:chave
 * @desc Busca configuração por categoria e chave
 * @param categoria - Categoria da configuração
 * @param chave - Chave da configuração
 */
router.get('/:categoria/:chave', (req, res) => configuracaoController.buscarPorChave(req, res));

/**
 * @route PUT /api/configuracoes/batch
 * @desc Atualiza múltiplas configurações de uma vez
 * @body { configuracoes: Array<{ categoria: string, chave: string, valor: any }> }
 */
router.put('/batch', (req, res) => configuracaoController.atualizarMultiplas(req, res));

/**
 * @route POST /api/configuracoes
 * @desc Cria nova configuração
 * @body ConfiguracaoInput
 */
router.post('/', (req, res) => configuracaoController.criar(req, res));

/**
 * @route PUT /api/configuracoes/:id
 * @desc Atualiza configuração existente
 * @param id - ID da configuração
 * @body ConfiguracaoUpdate
 */
router.put('/:id', (req, res) => configuracaoController.atualizar(req, res));

/**
 * @route DELETE /api/configuracoes/:id
 * @desc Remove configuração (soft delete)
 * @param id - ID da configuração
 */
router.delete('/:id', (req, res) => configuracaoController.remover(req, res));



export default router;
