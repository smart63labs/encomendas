import { Router, Request, Response } from 'express';
import { DatabaseService, OracleUtils } from '../config/database';

interface OracleRow { [key: string]: any }

const router = Router();

// GET /api/lacres - Lista com filtros e paginação
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    await DatabaseService.ensureInitialized();

    const { page = 1, limit = 24, search = '', status = 'todos', setorId = 'todos', lote = '' } = req.query as any;

    let where = 'WHERE 1=1';
    const binds: any = {};

    if (search) {
      where += ' AND (UPPER(CODIGO) LIKE UPPER(:search) OR UPPER(LOTE_NUMERO) LIKE UPPER(:search))';
      binds.search = `%${search}%`;
    }
    if (status && status !== 'todos') {
      where += ' AND STATUS = :status';
      binds.status = status;
    }
    if (setorId && setorId !== 'todos') {
      where += ' AND SETOR_ID = :setorId';
      binds.setorId = Number(setorId);
    }
    if (lote) {
      where += ' AND LOTE_NUMERO = :lote';
      binds.lote = String(lote);
    }

    const baseSql = `SELECT * FROM LACRE ${where} ORDER BY ID DESC`;
    const result = await DatabaseService.executeWithPagination(baseSql, binds, Number(page), Number(limit));
    const data = OracleUtils.toCamelCase(result.data);
    res.json({ success: true, data, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.pages } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro ao listar lacres', error: { message: error.message } });
  }
});

// POST /api/lacres/generate - Gera intervalo de lacres
router.post('/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    await DatabaseService.ensureInitialized();
    const { prefixo = 'LACRE', inicio, fim, loteNumero = '' } = req.body || {};
    const start = Number(inicio);
    const end = Number(fim);
    if (!prefixo || isNaN(start) || isNaN(end) || end < start) {
      res.status(400).json({ success: false, message: 'Parâmetros inválidos para geração de lacres' });
      return;
    }

    const queries: Array<{ sql: string; binds?: any }> = [];
    for (let n = start; n <= end; n++) {
      const codigo = `${prefixo}${String(n).padStart(6, '0')}`;
      queries.push({
        sql: `BEGIN
                INSERT INTO LACRE (CODIGO, STATUS, LOTE_NUMERO, DATA_CRIACAO)
                VALUES (:codigo, 'disponivel', :lote, SYSTIMESTAMP);
              EXCEPTION WHEN DUP_VAL_ON_INDEX THEN NULL; END;`,
        binds: { codigo, lote: String(loteNumero || '') }
      });
    }

    await DatabaseService.executeTransaction(queries);
    res.json({ success: true, message: 'Lacres gerados com sucesso', data: { prefixo, inicio: start, fim: end, loteNumero } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro ao gerar lacres', error: { message: error.message } });
  }
});

// PUT /api/lacres/:id - Atualiza campos de um lacre
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await DatabaseService.ensureInitialized();
    const id = Number(req.params.id);
    const { status, setorId, encomendaId, motivoDestruicao } = req.body || {};
    const sets: string[] = [];
    const binds: any = { id };

    if (status) { sets.push('STATUS = :status'); binds.status = status; }
    if (setorId !== undefined) { sets.push('SETOR_ID = :setorId'); binds.setorId = setorId ? Number(setorId) : null; }
    if (encomendaId !== undefined) { sets.push('ENCOMENDA_ID = :encomendaId'); binds.encomendaId = encomendaId ? Number(encomendaId) : null; }
    if (motivoDestruicao !== undefined) { sets.push('MOTIVO_DESTRUICAO = :motivo'); binds.motivo = String(motivoDestruicao || ''); }

    if (sets.length === 0) {
      res.status(400).json({ success: false, message: 'Nenhum campo para atualizar' });
      return;
    }

    sets.push('DATA_ATUALIZACAO = SYSTIMESTAMP');
    const sql = `UPDATE LACRE SET ${sets.join(', ')} WHERE ID = :id`;
    const result = await DatabaseService.executeQuery(sql, binds);
    res.json({ success: true, rowsAffected: result.rowsAffected });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro ao atualizar lacre', error: { message: error.message } });
  }
});

// DELETE /api/lacres/:id - Exclui um lacre
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await DatabaseService.ensureInitialized();
    const id = Number(req.params.id);
    const result = await DatabaseService.executeQuery('DELETE FROM LACRE WHERE ID = :id', { id });
    res.json({ success: true, rowsAffected: result.rowsAffected });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro ao excluir lacre', error: { message: error.message } });
  }
});

// POST /api/lacres/distribuir/manual - Distribuição manual
router.post('/distribuir/manual', async (req: Request, res: Response): Promise<void> => {
  try {
    await DatabaseService.ensureInitialized();
    const { setorId, quantidade } = req.body || {};
    const qtd = Number(quantidade || 0);
    if (!setorId || !qtd || qtd <= 0) {
      res.status(400).json({ success: false, message: 'setorId e quantidade são obrigatórios' });
      return;
    }

    // Selecionar IDs de lacres disponíveis
    const select = await DatabaseService.executeQuery(
      `SELECT ID FROM LACRE WHERE STATUS = 'disponivel' ORDER BY ID FETCH FIRST :qtd ROWS ONLY`,
      { qtd }
    );
    const ids = (select.rows || []).map((r: OracleRow) => r.ID);
    if (ids.length === 0) {
      res.json({ success: true, message: 'Nenhum lacre disponível', data: { distribuido: 0 } });
      return;
    }

    const queries = ids.map(id => ({
      sql: `UPDATE LACRE SET STATUS = 'atribuido', SETOR_ID = :setorId, DATA_ATUALIZACAO = SYSTIMESTAMP WHERE ID = :id`,
      binds: { setorId: Number(setorId), id }
    }));
    await DatabaseService.executeTransaction(queries);
    res.json({ success: true, data: { distribuido: ids.length } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro na distribuição manual', error: { message: error.message } });
  }
});

// POST /api/lacres/distribuir/auto - Distribuição automática (blocos sequenciais por setor)
router.post('/distribuir/auto', async (req: Request, res: Response): Promise<void> => {
  try {
    await DatabaseService.ensureInitialized();
    const { setorIds = [], totalLacres = null } = req.body || {};
    const setores: number[] = (Array.isArray(setorIds) ? setorIds : []).map((s: any) => Number(s)).filter(s => !!s);
    if (!setores.length) {
      res.status(400).json({ success: false, message: 'Informe pelo menos um setor' });
      return;
    }

    // Buscar lacres disponíveis
    const select = await DatabaseService.executeQuery(
      `SELECT ID FROM LACRE WHERE STATUS = 'disponivel' ORDER BY ID`,
    );
    let ids = (select.rows || []).map((r: OracleRow) => r.ID);
    if (totalLacres && Number(totalLacres) > 0) {
      ids = ids.slice(0, Number(totalLacres));
    }
    if (ids.length === 0) {
      res.json({ success: true, message: 'Nenhum lacre disponível', data: { distribuido: 0 } });
      return;
    }

    // Distribuir em blocos contínuos por setor, respeitando ordem crescente dos IDs
    // Estratégia: dividir o array de IDs em fatias sequenciais proporcionais à quantidade de setores
    const totalIds = ids.length;
    const sCount = setores.length;
    const basePorSetor = Math.floor(totalIds / sCount);
    const resto = totalIds % sCount;

    const queries: Array<{ sql: string; binds?: any }> = [];
    let cursor = 0;
    for (let i = 0; i < sCount; i++) {
      const setorId = setores[i];
      const qtdParaSetor = basePorSetor + (i < resto ? 1 : 0);
      const bloco = ids.slice(cursor, cursor + qtdParaSetor);
      for (const id of bloco) {
        queries.push({
          sql: `UPDATE LACRE SET STATUS = 'atribuido', SETOR_ID = :setorId, DATA_ATUALIZACAO = SYSTIMESTAMP WHERE ID = :id`,
          binds: { setorId, id }
        });
      }
      cursor += qtdParaSetor;
    }

    await DatabaseService.executeTransaction(queries);
    res.json({ success: true, data: { distribuido: ids.length, setores: setores.length } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro na distribuição automática', error: { message: error.message } });
  }
});

// POST /api/lacres/destruir-por-lote - Marca lacres de um lote como destruídos
router.post('/destruir-por-lote', async (req: Request, res: Response): Promise<void> => {
  try {
    await DatabaseService.ensureInitialized();
    const { loteNumero, motivo = '' } = req.body || {};
    if (!loteNumero) {
      res.status(400).json({ success: false, message: 'Informe o número do lote' });
      return;
    }
    // Impedir destruição se houver lacres distribuídos ou vinculados no lote
    const countSql = `
      SELECT COUNT(1) AS QTD
      FROM LACRE
      WHERE LOTE_NUMERO = :lote
        AND (
          STATUS <> 'disponivel' OR
          SETOR_ID IS NOT NULL OR
          ENCOMENDA_ID IS NOT NULL
        )
    `;
    const countRes = await DatabaseService.executeQuery(countSql, { lote: String(loteNumero) });
    const qtd = (countRes as any)?.rows?.[0]?.QTD ?? (countRes as any)?.rows?.[0]?.qtd ?? 0;
    if (Number(qtd) > 0) {
      res.status(400).json({ success: false, message: 'Destruição não permitida: existem lacres distribuídos ou vinculados neste lote.' });
      return;
    }
    const sql = `UPDATE LACRE SET STATUS = 'destruido', MOTIVO_DESTRUICAO = :motivo, DATA_ATUALIZACAO = SYSTIMESTAMP WHERE LOTE_NUMERO = :lote`;
    const result = await DatabaseService.executeQuery(sql, { lote: String(loteNumero), motivo: String(motivo) });
    res.json({ success: true, rowsAffected: result.rowsAffected });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro ao destruir lacres por lote', error: { message: error.message } });
  }
});

export default router;
/**
 * GET /api/lacres/disponiveis-por-setor
 * Lista lacres atribuídos ao setor com rótulos de disponibilidade.
 * Nova regra (global):
 *  - "Já usado / Indisponível" quando STATUS do lacre NÃO for 'disponivel' (inclui: utilizado, reservado, vinculado, extraviado, danificado, destruido)
 *  - Também "Já usado / Indisponível" quando existir ENCOMENDA vinculada ao LACRE (fallback de auditoria)
 *  - "Disponível" apenas quando STATUS = 'disponivel' e não há vínculo de ENCOMENDA
 */
router.get('/disponiveis-por-setor', async (req: Request, res: Response): Promise<void> => {
  try {
    await DatabaseService.ensureInitialized();
    const { setorId } = req.query as any;
    const sid = Number(setorId);
    if (!sid || Number.isNaN(sid)) {
      res.status(400).json({ success: false, message: 'Parâmetro setorId é obrigatório e deve ser numérico' });
      return;
    }

    const sql = `
      SELECT 
        l.ID,
        l.CODIGO,
        l.LOTE_NUMERO,
        l.SETOR_ID,
        l.STATUS AS STATUS_ORIGINAL,
        CASE 
          WHEN UPPER(TRIM(NVL(l.STATUS, 'disponivel'))) IN (
            'UTILIZADO','UTILILIZADO','USADO','RESERVADO','VINCULADO','EXTRAVIADO','DANIFICADO','DESTRUIDO'
          ) THEN 'indisponivel'
          WHEN EXISTS (
            SELECT 1 FROM ENCOMENDAS e
            WHERE e.LACRE_ID = l.ID
          ) THEN 'indisponivel'
          ELSE 'disponivel'
        END AS STATUS,
        CASE 
          WHEN UPPER(TRIM(NVL(l.STATUS, 'disponivel'))) IN (
            'UTILIZADO','UTILILIZADO','USADO','RESERVADO','VINCULADO','EXTRAVIADO','DANIFICADO','DESTRUIDO'
          ) THEN 'Já usado / Indisponível'
          WHEN EXISTS (
            SELECT 1 FROM ENCOMENDAS e
            WHERE e.LACRE_ID = l.ID
          ) THEN 'Já usado / Indisponível'
          ELSE 'Disponível'
        END AS STATUS_LABEL
      FROM LACRE l
      WHERE l.SETOR_ID = :sid
      ORDER BY l.ID DESC
    `;

    const result = await DatabaseService.executeQuery(sql, { sid });
    const data = OracleUtils.toCamelCase(result.rows || []);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erro ao listar lacres disponíveis por setor', error: { message: error.message } });
  }
});