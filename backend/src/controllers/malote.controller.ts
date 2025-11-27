import { Request, Response, NextFunction } from 'express';
import { BaseController, AuthenticatedRequest, QueryParams } from './base.controller';
import { MaloteModel } from '../models/malote.model';
import { DatabaseService } from '../config/database';

export class MaloteController extends BaseController {
  constructor() {
    super(MaloteModel);
  }

  // Lê o HUB_SETOR_ID da tabela CONFIGURACOES
  private async getHubSetorId(): Promise<number | null> {
    try {
      const sql = `
        SELECT TO_NUMBER(DBMS_LOB.SUBSTR(VALOR, 100)) AS HUB_SETOR_ID
          FROM CONFIGURACOES
         WHERE CHAVE = 'HUB_SETOR_ID'`;
      const result = await DatabaseService.executeQuery(sql);
      const hubId = result.rows && result.rows[0] && Number(result.rows[0].HUB_SETOR_ID);
      return Number.isFinite(hubId) ? hubId : null;
    } catch (e) {
      console.warn('Aviso: não foi possível obter HUB_SETOR_ID em CONFIGURACOES. Detalhes:', e);
      return null;
    }
  }

  // Personalizar campos de busca textual
  protected override getSearchFields(): string[] {
    return ['NUMERO_MALOTE', 'CODIGO_EMISSAO', 'NUMERO_CONTRATO'];
  }

  // Sobrescrever extração de paginação para corrigir orderBy
  protected override extractPagination(query: QueryParams) {
    const pagination = super.extractPagination(query);
    
    // Mapear created_at/updated_at para DATA_CRIACAO/DATA_ATUALIZACAO
    if (pagination.orderBy) {
      const orderByLower = pagination.orderBy.toLowerCase();
      if (orderByLower === 'created_at') {
        pagination.orderBy = 'DATA_CRIACAO';
      } else if (orderByLower === 'updated_at') {
        pagination.orderBy = 'DATA_ATUALIZACAO';
      } else {
        // Converter para UPPER_SNAKE_CASE
        pagination.orderBy = pagination.orderBy.replace(/[A-Z]/g, (l: string) => `_${l}`).toUpperCase();
      }
    }
    
    return pagination;
  }

  // Personalizar filtros extraídos da query
  protected override extractFilters(query: QueryParams) {
    const filters: any = {};

    if (query.numeroMalote) filters.NUMERO_MALOTE = query.numeroMalote;
    if (query.codigoEmissao) filters.CODIGO_EMISSAO = query.codigoEmissao;
    if (query.numeroContrato) filters.NUMERO_CONTRATO = query.numeroContrato;
    if (query.ativo !== undefined) filters.ATIVO = query.ativo;

    // Mapear filtros de setor para colunas Oracle
    // Origem do malote (se existir na tabela)
    if ((query as any).setorOrigemId) {
      filters.SETOR_ORIGEM_ID = Number((query as any).setorOrigemId);
    }
    // Destino do malote: de acordo com a base Oracle atual a coluna é SETOR_DESTINO_ID
    if ((query as any).setorDestinoId) {
      filters.SETOR_DESTINO_ID = Number((query as any).setorDestinoId);
    }
    // Compatibilidade: alguns clientes podem enviar "setorId" como destino
    if ((query as any).setorId) {
      filters.SETOR_DESTINO_ID = Number((query as any).setorId);
    }

    // Regra de disponibilidade ao consultar por setor:
    // - Se 'status' for fornecido como 'todos' (ou equivalentes), não aplicar filtro de STATUS.
    // - Caso contrário, mapear o status textual para o formato da base.
    // - Se nenhum 'status' for fornecido e houver filtro de setor, aplicar STATUS='Disponivel' por padrão.
    const hasSetorFilter = (query as any).setorDestinoId || (query as any).setorId || (query as any).setorOrigemId;
    const rawStatus = (query as any).status;
    if (rawStatus !== undefined) {
      const s = String(rawStatus).trim().toLowerCase();
      const isTodos = s === 'todos' || s === 'all' || s === 'todas' || s === 'qualquer';
      if (!isTodos) {
        const map: Record<string, string> = {
          'disponivel': 'Disponivel',
          'indisponivel': 'Indisponivel',
          'em transito': 'Em transito',
          'em trânsito': 'Em transito'
        };
        const mapped = map[s] || (typeof rawStatus === 'string' ? rawStatus : String(rawStatus));
        filters.STATUS = mapped;
      }
    } else if (hasSetorFilter) {
      filters.STATUS = 'Disponivel';
    }

    // Filtros genéricos
    const excludeParams = ['page', 'limit', 'orderBy', 'orderDirection', 'search', 'status', 'setorOrigemId', 'setorId', 'setorDestinoId'];
    Object.keys(query).forEach(key => {
      if (!excludeParams.includes(key) && query[key] !== undefined && query[key] !== '') {
        filters[key] = (query as any)[key];
      }
    });

    return filters;
  }

  // Sobrescrever index para suportar busca textual via parâmetro "search" ou "q"
  override async index(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as QueryParams;
      const pagination = this.extractPagination(query);
      const filters = this.extractFilters(query);

      // Filtro de segurança por setor para usuários comuns
      if (req.user) {
        const isAdmin = ['ADMIN', 'ADMINISTRADOR'].includes(req.user.role?.toUpperCase() || '');
        if (!isAdmin) {
          const setorId = req.user.setorId;
          if (setorId) {
            // Regra: usuário comum vê apenas malotes vinculados ao seu setor (destino = proprietário)
            filters.SETOR_DESTINO_ID = setorId;
          } else {
            // Se usuário comum não tem setor, não vê nada
            this.sendSuccess(res, [], 'Registros recuperados com sucesso', {
              pagination: { page: pagination.page, limit: pagination.limit, total: 0, pages: 0 }
            });
            return;
          }
        }
      }

      const rawSearch = (query as any).search ?? (query as any).q;
      const searchTerm = typeof rawSearch === 'string' ? rawSearch.trim() : '';

      if (searchTerm && searchTerm.length >= 2) {
        const searchFields = this.getSearchFields();
        const result = await (this.model as typeof MaloteModel).search(
          searchTerm,
          searchFields,
          filters,
          pagination
        );

        this.sendSuccess(res, result.data, 'Registros recuperados com sucesso', {
          pagination: result.pagination,
          search: searchTerm
        });
      } else {
        const result = await this.model.findAll(filters, pagination);
        this.sendSuccess(res, result.data, 'Registros recuperados com sucesso', {
          pagination: result.pagination
        });
      }
    } catch (error) {
      next(error);
    }
  }

  // Opcionalmente, poderíamos customizar index/show/store/update/destroy, mas o BaseController cobre o necessário

  // Antes de criar, aplicar regra do Hub para origem/destino do malote
  protected override async beforeStore(data: any, req: AuthenticatedRequest): Promise<any> {
    const processed = { ...data };
    const hubSetorId = await this.getHubSetorId();

    // Normalizar campos de setor
    const origemRaw = processed.setorOrigemId ?? processed.SETOR_ORIGEM_ID;
    const destinoRaw = processed.setorDestinoId ?? processed.setorId ?? processed.SETOR_DESTINO_ID;
    let setorOrigemId = origemRaw !== undefined ? Number(origemRaw) : undefined;
    let setorDestinoId = destinoRaw !== undefined ? Number(destinoRaw) : undefined;

    if (hubSetorId && Number.isFinite(hubSetorId)) {
      // Regra Opção 1 (Hub Centralizador):
      // - Se origem ≠ Hub e destino ≠ Hub, redirecionar destino para Hub.
      // - Se destino = Hub, manter.
      // - Se origem = Hub, manter destino informado (segunda perna).
      const origemEhHub = setorOrigemId !== undefined && setorOrigemId === hubSetorId;
      const destinoEhHub = setorDestinoId !== undefined && setorDestinoId === hubSetorId;

      if (!origemEhHub && !destinoEhHub) {
        setorDestinoId = hubSetorId;
        console.log('[MaloteController] Ajuste de destino para Hub', { hubSetorId, setorOrigemId, setorDestinoId });
      }

      // Garantir consistência nos campos usados pelo model
      if (setorOrigemId !== undefined) {
        processed.setorOrigemId = setorOrigemId;
        processed.SETOR_ORIGEM_ID = setorOrigemId;
      }
      if (setorDestinoId !== undefined) {
        processed.setorDestinoId = setorDestinoId;
        processed.SETOR_DESTINO_ID = setorDestinoId;
        processed.setorId = setorDestinoId; // compatibilidade
      }
    }

    return processed;
  }

  // Antes de atualizar, manter regra do Hub
  protected override async beforeUpdate(data: any, id: number, req: AuthenticatedRequest): Promise<any> {
    const processed = { ...data };
    const hubSetorId = await this.getHubSetorId();

    const origemRaw = processed.setorOrigemId ?? processed.SETOR_ORIGEM_ID;
    const destinoRaw = processed.setorDestinoId ?? processed.setorId ?? processed.SETOR_DESTINO_ID;
    let setorOrigemId = origemRaw !== undefined ? Number(origemRaw) : undefined;
    let setorDestinoId = destinoRaw !== undefined ? Number(destinoRaw) : undefined;

    if (hubSetorId && Number.isFinite(hubSetorId)) {
      const origemEhHub = setorOrigemId !== undefined && setorOrigemId === hubSetorId;
      const destinoEhHub = setorDestinoId !== undefined && setorDestinoId === hubSetorId;

      if (!origemEhHub && !destinoEhHub) {
        setorDestinoId = hubSetorId;
        console.log('[MaloteController] (update) Ajuste de destino para Hub', { id, hubSetorId, setorOrigemId, setorDestinoId });
      }

      if (setorOrigemId !== undefined) {
        processed.setorOrigemId = setorOrigemId;
        processed.SETOR_ORIGEM_ID = setorOrigemId;
      }
      if (setorDestinoId !== undefined) {
        processed.setorDestinoId = setorDestinoId;
        processed.SETOR_DESTINO_ID = setorDestinoId;
        processed.setorId = setorDestinoId;
      }
    }

    return processed;
  }

  /**
   * Listar malotes disponíveis sem depender de ENCOMENDAS_EVENTOS
   * Regra:
   * - Um malote está "Em transito / Indisponível" se houver QUALQUER ENCOMENDA vinculada
   *   a ele com STATUS em trânsito, independentemente do setor.
   * - Um malote volta a ficar "Disponível" apenas quando a encomenda vinculada tiver STATUS = 'entregue'.
   * - Caso contrário, "Disponível".
   * Filtro obrigatório: setorId (aceita setorOrigemId/setorDestinoId/setorId)
   */
  async availableByEvents(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Escolhe o tipo de filtro conforme o parâmetro recebido:
      // - Se vier setorOrigemId (e não vier setorDestinoId), filtra por origem
      // - Caso contrário, filtra por destino
      const origemRaw = (req.query as any).setorOrigemId;
      const destinoRaw = (req.query as any).setorDestinoId ?? (req.query as any).setorId;
      const filtroTipo: 'origem' | 'destino' = origemRaw && !destinoRaw ? 'origem' : 'destino';
      const setorId = Number(filtroTipo === 'origem' ? origemRaw : destinoRaw);
      if (!setorId || Number.isNaN(setorId)) {
        return this.sendError(res, 'Parâmetro de setor ausente ou inválido (use setorOrigemId ou setorDestinoId)', 400);
      }

      const colMalote = filtroTipo === 'origem' ? 'm.SETOR_ORIGEM_ID' : 'm.SETOR_DESTINO_ID';

      const sql = `
        SELECT 
          m.ID,
          m.NUMERO_MALOTE,
          m.SETOR_ORIGEM_ID,
          m.SETOR_DESTINO_ID,
          m.ENCOMENDA_ID
        FROM MALOTE m
        WHERE ${colMalote} = :setorId
          AND NOT EXISTS (
            SELECT 1 FROM ENCOMENDAS e
            WHERE e.MALOTE_ID = m.ID
              AND (
                UPPER(REPLACE(TRIM(e.STATUS), ' ', '_')) IN ('EM_TRANSITO','EM_TRÂNSITO','EMTRANSITO','EM TRANSITO','EM TRÂNSITO')
                OR UPPER(TRIM(e.STATUS)) IN ('POSTADO','TRANSITO','TRÂNSITO','PENDENTE')
              )
          )
          AND UPPER(TRIM(NVL(m.STATUS, 'Disponivel'))) NOT IN ('INDISPONIVEL','EM TRANSITO','EM_TRANSITO','EM_TRÂNSITO','EMTRANSITO','EM TRÂNSITO')
        ORDER BY m.NUMERO_MALOTE
      `;

      const result = await DatabaseService.executeQuery(sql, { setorId });
      const data = result.rows || [];
      return this.sendSuccess(res, data, 'Malotes disponíveis filtrados com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Status por setor para todos os malotes de um setor (sem ENCOMENDAS_EVENTOS)
   * Regra:
   *  - Indisponível: existe QUALQUER ENCOMENDA vinculada ao malote com STATUS em trânsito,
   *    independentemente do setor, e/ou MALOTE não está 'Disponivel'.
   *  - Disponível: caso contrário.
   */
  async statusByEvents(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Diferenciar filtro por origem/destino conforme parâmetro enviado
      const origemRaw = (req.query as any).setorOrigemId;
      const destinoRaw = (req.query as any).setorDestinoId ?? (req.query as any).setorId;
      const filtroTipo: 'origem' | 'destino' = origemRaw && !destinoRaw ? 'origem' : 'destino';
      const setorId = Number(filtroTipo === 'origem' ? origemRaw : destinoRaw);
      if (!setorId || Number.isNaN(setorId)) {
        return this.sendError(res, 'Parâmetro de setor ausente ou inválido (use setorOrigemId ou setorDestinoId)', 400);
      }

      const colMalote = filtroTipo === 'origem' ? 'm.SETOR_ORIGEM_ID' : 'm.SETOR_DESTINO_ID';

      const sql = `
        SELECT 
          m.ID,
          m.NUMERO_MALOTE,
          m.SETOR_ORIGEM_ID,
          m.SETOR_DESTINO_ID,
          m.ENCOMENDA_ID,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM ENCOMENDAS e
              WHERE e.MALOTE_ID = m.ID
                AND (
                  UPPER(REPLACE(TRIM(e.STATUS), ' ', '_')) IN ('EM_TRANSITO','EM_TRÂNSITO','EMTRANSITO','EM TRANSITO','EM TRÂNSITO')
                  OR UPPER(TRIM(e.STATUS)) IN ('POSTADO','TRANSITO','TRÂNSITO')
                )
            ) THEN 'indisponivel'
            WHEN UPPER(TRIM(NVL(m.STATUS, 'Disponivel'))) IN ('INDISPONIVEL','EM TRANSITO','EM_TRANSITO','EM_TRÂNSITO','EMTRANSITO','EM TRÂNSITO') THEN 'indisponivel'
            ELSE 'disponivel'
          END AS STATUS_EVENTO,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM ENCOMENDAS e
              WHERE e.MALOTE_ID = m.ID
                AND (
                  UPPER(REPLACE(TRIM(e.STATUS), ' ', '_')) IN ('EM_TRANSITO','EM_TRÂNSITO','EMTRANSITO','EM TRANSITO','EM TRÂNSITO')
                  OR UPPER(TRIM(e.STATUS)) IN ('POSTADO','TRANSITO','TRÂNSITO')
                )
            ) THEN 'Em transito / Indisponível'
            WHEN UPPER(TRIM(NVL(m.STATUS, 'Disponivel'))) IN ('INDISPONIVEL','EM TRANSITO','EM_TRANSITO','EM_TRÂNSITO','EMTRANSITO','EM TRÂNSITO') THEN 'Em transito / Indisponível'
            ELSE 'Disponível'
          END AS STATUS_EVENTO_LABEL
        FROM MALOTE m
        WHERE ${colMalote} = :setorId
        ORDER BY m.NUMERO_MALOTE
      `;

      const result = await DatabaseService.executeQuery(sql, { setorId });
      const data = result.rows || [];
      return this.sendSuccess(res, data, 'Status por malote (sem eventos) recuperado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Dados agregados para o Mapa Geral de Malotes
   * Inclui origem, destino e status de trânsito sem depender de ENCOMENDAS_EVENTOS
   * Regra simplificada:
   *  - emTransito: quando MALOTE.STATUS indica trânsito
   *  - entregue: quando MALOTE.STATUS = 'Disponivel'
   *  - localização atual: setorDestino (aproximação sem histórico de eventos)
   */
  async mapData(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      let whereClause = '';
      const binds: any = {};

      if (req.user) {
        const isAdmin = ['ADMIN', 'ADMINISTRADOR'].includes(req.user.role?.toUpperCase() || '');
        if (!isAdmin) {
          const setorId = req.user.setorId;
          if (setorId) {
            whereClause = 'WHERE (m.SETOR_ORIGEM_ID = :setorId OR m.SETOR_DESTINO_ID = :setorId)';
            binds.setorId = setorId;
          } else {
             this.sendSuccess(res, [], 'Dados de mapa de malotes');
             return;
          }
        }
      }

      const sql = `
        SELECT 
          m.ID AS MALOTE_ID,
          m.NUMERO_MALOTE,
          m.SETOR_ORIGEM_ID,
          m.SETOR_DESTINO_ID,
          m.STATUS AS STATUS_MALOTE,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM ENCOMENDAS e
               WHERE e.MALOTE_ID = m.ID
                 AND (
                   UPPER(REPLACE(TRIM(e.STATUS), ' ', '_')) IN ('EM_TRANSITO','EM_TRÂNSITO','EMTRANSITO','EM TRANSITO','EM TRÂNSITO')
                   OR UPPER(TRIM(e.STATUS)) IN ('POSTADO','TRANSITO','TRÂNSITO')
                 )
            ) THEN 1
            ELSE 0
          END AS EM_TRANSITO,
          so.NOME_SETOR AS SETOR_ORIGEM_NOME,
          so.LATITUDE AS SETOR_ORIGEM_LATITUDE,
          so.LONGITUDE AS SETOR_ORIGEM_LONGITUDE,
          sd.NOME_SETOR AS SETOR_DESTINO_NOME,
          sd.LATITUDE AS SETOR_DESTINO_LATITUDE,
          sd.LONGITUDE AS SETOR_DESTINO_LONGITUDE
        FROM MALOTE m
        LEFT JOIN SETORES so ON so.ID = m.SETOR_ORIGEM_ID
        LEFT JOIN SETORES sd ON sd.ID = m.SETOR_DESTINO_ID
        ${whereClause}
        ORDER BY m.NUMERO_MALOTE
      `;

      const result = await DatabaseService.executeQuery(sql, binds);
      const data = (result.rows || []).map((r: any) => {
        const statusMalote = String(r.STATUS_MALOTE || '').toUpperCase().trim();
        const emTransito = Number(r.EM_TRANSITO) === 1;
        const entregue = statusMalote === 'DISPONIVEL' || statusMalote === 'DISPONÍVEL';
        const atualSetorId = r.SETOR_DESTINO_ID ? Number(r.SETOR_DESTINO_ID) : null;
        return {
          maloteId: Number(r.MALOTE_ID),
          numeroMalote: r.NUMERO_MALOTE,
          origem: {
            setorId: Number(r.SETOR_ORIGEM_ID),
            nome: r.SETOR_ORIGEM_NOME,
            latitude: r.SETOR_ORIGEM_LATITUDE ? Number(r.SETOR_ORIGEM_LATITUDE) : null,
            longitude: r.SETOR_ORIGEM_LONGITUDE ? Number(r.SETOR_ORIGEM_LONGITUDE) : null,
          },
          destino: {
            setorId: Number(r.SETOR_DESTINO_ID),
            nome: r.SETOR_DESTINO_NOME,
            latitude: r.SETOR_DESTINO_LATITUDE ? Number(r.SETOR_DESTINO_LATITUDE) : null,
            longitude: r.SETOR_DESTINO_LONGITUDE ? Number(r.SETOR_DESTINO_LONGITUDE) : null,
            dono: true,
          },
          atual: {
            setorId: atualSetorId,
            nome: r.SETOR_DESTINO_NOME,
            latitude: r.SETOR_DESTINO_LATITUDE ? Number(r.SETOR_DESTINO_LATITUDE) : null,
            longitude: r.SETOR_DESTINO_LONGITUDE ? Number(r.SETOR_DESTINO_LONGITUDE) : null,
          },
          status: {
            emTransito,
            entregue
          }
        };
      });

      return this.sendSuccess(res, data, 'Dados de mapa de malotes');
    } catch (error) {
      next(error);
    }
  }
}

export default MaloteController;
