import { Request, Response, NextFunction } from 'express';
import { BaseController, AuthenticatedRequest } from './base.controller';
import { EncomendaModel, IEncomenda } from '../models/encomenda.model';
import { DatabaseService } from '../config/database';
import sse from '../services/sse.service';
import oracledb from 'oracledb';

/**
 * Controller de Encomendas
 * Gerencia operações CRUD de encomendas
 */
export class EncomendaController extends BaseController {
  constructor() {
    super(EncomendaModel);
  }

  private tableName = 'ENCOMENDAS';

  // Lê o HUB_SETOR_ID da tabela CONFIGURACOES
  private async getHubSetorId(): Promise<number | null> {
    try {
      const result = await DatabaseService.executeQuery(
        `SELECT TO_NUMBER(DBMS_LOB.SUBSTR(VALOR, 100)) AS HUB_ID
           FROM CONFIGURACOES
          WHERE CHAVE = 'HUB_SETOR_ID'`
      );
      const hubIdRaw = result.rows?.[0]?.HUB_ID;
      const hubId = Number(hubIdRaw);
      if (!Number.isFinite(hubId) || hubId <= 0) return null;
      return hubId;
    } catch (e) {
      console.warn('Aviso: não foi possível obter HUB_SETOR_ID em CONFIGURACOES. Detalhes:', e);
      return null;
    }
  }

  override async index(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      // Filtro por setor do usuário (nova regra)
      // Se não for admin, filtra por setor de origem ou destino igual ao setor do usuário
      let userFilter = '';
      const binds: any = { offset, limit };

      // Opcional: só aplica filtro se tiver usuário logado e não for admin
      // Se a rota for pública ou sem usuário, mantém comportamento de ver tudo (ou muda conforme necessidade)
      if (req.user) {
        const isAdmin = ['ADMIN', 'ADMINISTRADOR'].includes(req.user.role?.toUpperCase() || '');

        if (!isAdmin) {
          const setorId = req.user.setorId;

          if (setorId) {
            userFilter = `AND (e.SETOR_ORIGEM_ID = :userSetorId OR e.SETOR_DESTINO_ID = :userSetorId)`;
            binds.userSetorId = setorId;
          } else {
            // Se usuário comum não tem setor, não vê nada? Ou vê tudo?
            // Regra mais segura: se não tem setor, não vê nada.
            // Retornando lista vazia imediatamente
            this.sendSuccess(res, {
              data: [],
              pagination: { page, limit, total: 0, pages: 0 }
            });
            return;
          }
        }
      }

      const query = `
        SELECT * FROM (
          SELECT 
            e.*,
            m.NUMERO_MALOTE AS NUMERO_MALOTE,
            l.CODIGO as NUMERO_LACRE,
            ur.NOME as REMETENTE_NOME,
            ur.MATRICULA as REMETENTE_MATRICULA,
            ur.VINCULO_FUNCIONAL as REMETENTE_VINCULO,
            ud.NOME as DESTINATARIO_NOME,
            ud.MATRICULA as DESTINATARIO_MATRICULA,
            ud.VINCULO_FUNCIONAL as DESTINATARIO_VINCULO,
            so.NOME_SETOR as SETOR_ORIGEM_NOME,
            so.LATITUDE as SETOR_ORIGEM_LATITUDE,
            so.LONGITUDE as SETOR_ORIGEM_LONGITUDE,
            so.CEP as SETOR_ORIGEM_CEP,
            so.LOGRADOURO as SETOR_ORIGEM_LOGRADOURO,
            so.NUMERO as SETOR_ORIGEM_NUMERO,
            so.COMPLEMENTO as SETOR_ORIGEM_COMPLEMENTO,
            so.BAIRRO as SETOR_ORIGEM_BAIRRO,
            so.CIDADE as SETOR_ORIGEM_CIDADE,
            so.ESTADO as SETOR_ORIGEM_ESTADO,
            sd.NOME_SETOR as SETOR_DESTINO_NOME,
            sd.LATITUDE as SETOR_DESTINO_LATITUDE,
            sd.LONGITUDE as SETOR_DESTINO_LONGITUDE,
            sd.CEP as SETOR_DESTINO_CEP,
            sd.LOGRADOURO as SETOR_DESTINO_LOGRADOURO,
            sd.NUMERO as SETOR_DESTINO_NUMERO,
            sd.COMPLEMENTO as SETOR_DESTINO_COMPLEMENTO,
            sd.BAIRRO as SETOR_DESTINO_BAIRRO,
            sd.CIDADE as SETOR_DESTINO_CIDADE,
            sd.ESTADO as SETOR_DESTINO_ESTADO,
            ROW_NUMBER() OVER (ORDER BY e.DATA_CRIACAO DESC) as rn
          FROM ${this.tableName} e
          LEFT JOIN USUARIOS ur ON e.USUARIO_ORIGEM_ID = ur.ID
          LEFT JOIN USUARIOS ud ON e.USUARIO_DESTINO_ID = ud.ID
          LEFT JOIN SETORES so ON e.SETOR_ORIGEM_ID = so.ID
          LEFT JOIN SETORES sd ON e.SETOR_DESTINO_ID = sd.ID
          LEFT JOIN MALOTE m ON e.MALOTE_ID = m.ID
          LEFT JOIN LACRE l ON e.LACRE_ID = l.ID
          WHERE 1=1 ${userFilter}
        ) WHERE rn BETWEEN :offset + 1 AND :offset + :limit
      `;

      // Query de contagem também precisa do filtro
      const countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} e WHERE 1=1 ${userFilter}`;

      // Binds para o count (remove offset e limit)
      const countBinds = { ...binds };
      delete countBinds.offset;
      delete countBinds.limit;

      const [result, countResult] = await Promise.all([
        DatabaseService.executeQuery(query, binds),
        DatabaseService.executeQuery(countQuery, countBinds)
      ]);

      const encomendas = await Promise.all(
        result.rows?.map(row => this.mapRowToEncomenda(row)) || []
      );
      const total = countResult.rows?.[0]?.TOTAL || 0;

      // Log para debug: verificar se os IDs dos setores estão sendo retornados
      if (encomendas.length > 0) {
        console.log('📦 Primeira encomenda retornada:', {
          id: encomendas[0].id,
          numeroEncomenda: encomendas[0].numeroEncomenda,
          setorOrigemId: encomendas[0].setorOrigemId,
          setorDestinoId: encomendas[0].setorDestinoId,
          setorOrigem: encomendas[0].setorOrigem,
          setorDestino: encomendas[0].setorDestino
        });
      }

      this.sendSuccess(res, {
        data: encomendas,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Erro detalhado ao listar encomendas:', error);
      this.sendError(res, 'Erro ao listar encomendas', 500);
    }
  }

  override async show(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const query = `
        SELECT 
          e.*,
          m.NUMERO_MALOTE AS NUMERO_MALOTE,
          l.CODIGO as NUMERO_LACRE,
          ur.NOME as REMETENTE_NOME,
          ur.MATRICULA as REMETENTE_MATRICULA,
          ur.VINCULO_FUNCIONAL as REMETENTE_VINCULO,
          ud.NOME as DESTINATARIO_NOME,
          ud.MATRICULA as DESTINATARIO_MATRICULA,
          ud.VINCULO_FUNCIONAL as DESTINATARIO_VINCULO,
          so.NOME_SETOR as SETOR_ORIGEM_NOME,
          so.LATITUDE as SETOR_ORIGEM_LATITUDE,
          so.LONGITUDE as SETOR_ORIGEM_LONGITUDE,
          so.CEP as SETOR_ORIGEM_CEP,
          so.LOGRADOURO as SETOR_ORIGEM_LOGRADOURO,
          so.NUMERO as SETOR_ORIGEM_NUMERO,
          so.COMPLEMENTO as SETOR_ORIGEM_COMPLEMENTO,
          so.BAIRRO as SETOR_ORIGEM_BAIRRO,
          so.CIDADE as SETOR_ORIGEM_CIDADE,
          so.ESTADO as SETOR_ORIGEM_ESTADO,
          sd.NOME_SETOR as SETOR_DESTINO_NOME,
          sd.LATITUDE as SETOR_DESTINO_LATITUDE,
          sd.LONGITUDE as SETOR_DESTINO_LONGITUDE,
          sd.CEP as SETOR_DESTINO_CEP,
          sd.LOGRADOURO as SETOR_DESTINO_LOGRADOURO,
          sd.NUMERO as SETOR_DESTINO_NUMERO,
          sd.COMPLEMENTO as SETOR_DESTINO_COMPLEMENTO,
          sd.BAIRRO as SETOR_DESTINO_BAIRRO,
          sd.CIDADE as SETOR_DESTINO_CIDADE,
          sd.ESTADO as SETOR_DESTINO_ESTADO
        FROM ${this.tableName} e
        LEFT JOIN USUARIOS ur ON e.USUARIO_ORIGEM_ID = ur.ID
        LEFT JOIN USUARIOS ud ON e.USUARIO_DESTINO_ID = ud.ID
        LEFT JOIN SETORES so ON e.SETOR_ORIGEM_ID = so.ID
        LEFT JOIN SETORES sd ON e.SETOR_DESTINO_ID = sd.ID
        LEFT JOIN MALOTE m ON e.MALOTE_ID = m.ID
        LEFT JOIN LACRE l ON e.LACRE_ID = l.ID
        WHERE e.ID = :id
      `;

      const result = await DatabaseService.executeQuery(query, { id });

      if (!result.rows || result.rows.length === 0) {
        return this.sendError(res, 'Encomenda não encontrada', 404);
      }

      const encomenda = await this.mapRowToEncomenda(result.rows[0]);
      this.sendSuccess(res, { data: encomenda });
    } catch (error) {
      console.error('Erro ao buscar encomenda por ID:', error);
      this.sendError(res, 'Erro ao buscar encomenda', 500);
    }
  }

  /**
   * Método específico para criar encomenda via wizard
   */
  async storeFromWizard(req: Request, res: Response): Promise<void> {
    // Garantir que traceId esteja acessível também no bloco catch
    let traceId: string = '';
    try {
      console.log('=== INÍCIO storeFromWizard ===');
      traceId = `WZ-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      console.log('TraceID storeFromWizard:', traceId);
      const wizardData = req.body;
      console.log('Dados recebidos do wizard:', JSON.stringify(wizardData, null, 2));

      // Normalizar possíveis IDs recebidos como string
      const toNumberOrNull = (v: any): number | null => {
        if (v === null || v === undefined) return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };
      const remetenteIdRaw = toNumberOrNull(wizardData.remetenteId);
      const destinatarioIdRaw = toNumberOrNull(wizardData.destinatarioId);
      const setorOrigemIdRaw = toNumberOrNull((wizardData as any).setorOrigemId);
      const setorDestinoIdRaw = toNumberOrNull((wizardData as any).setorDestinoId);

      // Usar os IDs enviados pelo frontend ou buscar por nome como fallback
      let usuarioRemetenteId = remetenteIdRaw || null;
      let setorRemetenteId: number | null = null;

      // Se não foi enviado o ID do remetente, tentar buscar por nome (USUARIOS.NOME) e fallback por setor
      if (!remetenteIdRaw) {
        console.log('Buscando remetente por nome:', wizardData.remetente);
        // Corrige coluna NAME -> NOME
        const remetenteQuery = `SELECT ID, SETOR_ID FROM USUARIOS WHERE NOME = :remetente`;
        const remetenteResult = await DatabaseService.executeQuery(remetenteQuery, { remetente: wizardData.remetente });
        console.log('Resultado busca remetente (USUARIOS):', remetenteResult);

        if (remetenteResult.rows && remetenteResult.rows.length > 0) {
          const remetenteData = remetenteResult.rows[0] as any;
          usuarioRemetenteId = remetenteData.ID;
          setorRemetenteId = remetenteData.SETOR_ID;
        } else {
          // Fallback: tentar buscar setor por nome
          const setorPorNomeQuery = `SELECT ID FROM SETORES WHERE NOME_SETOR = :nomeSetor AND ATIVO = 1`;
          const setorPorNomeResult = await DatabaseService.executeQuery(setorPorNomeQuery, { nomeSetor: wizardData.remetente });
          console.log('Resultado busca remetente (SETORES por nome):', setorPorNomeResult);
          if (setorPorNomeResult.rows && setorPorNomeResult.rows.length > 0) {
            const setor = setorPorNomeResult.rows[0] as any;
            setorRemetenteId = Number(setor.ID);
            usuarioRemetenteId = null; // Remetente selecionado como setor
          } else {
            return this.sendError(res, 'Remetente não encontrado', 400);
          }
        }
      } else {
        // Se setorOrigemId foi enviado (preferência), usar diretamente
        if (setorOrigemIdRaw != null) {
          setorRemetenteId = setorOrigemIdRaw;
          usuarioRemetenteId = remetenteIdRaw; // pode ser null se não houver usuário
        } else {
          // Buscar setor do remetente usando o ID: primeiro tentar como usuário
          const setorRemetenteQueryUsuario = `SELECT SETOR_ID FROM USUARIOS WHERE ID = :remetenteId`;
          const setorRemetenteResultUsuario = await DatabaseService.executeQuery(setorRemetenteQueryUsuario, { remetenteId: remetenteIdRaw });

          if (setorRemetenteResultUsuario.rows && setorRemetenteResultUsuario.rows.length > 0) {
            const setorData = setorRemetenteResultUsuario.rows[0] as any;
            setorRemetenteId = Number(setorData.SETOR_ID);
            usuarioRemetenteId = remetenteIdRaw!;
          } else {
            // Se não for um usuário válido, tentar como setor (ID vindo de um item tipo 'sector' no frontend)
            const setorRemetenteQuerySetor = `SELECT ID FROM SETORES WHERE ID = :setorId AND ATIVO = 1`;
            const setorRemetenteResultSetor = await DatabaseService.executeQuery(setorRemetenteQuerySetor, { setorId: remetenteIdRaw });
            if (setorRemetenteResultSetor.rows && setorRemetenteResultSetor.rows.length > 0) {
              const setor = setorRemetenteResultSetor.rows[0] as any;
              setorRemetenteId = Number(setor.ID);
              usuarioRemetenteId = null; // Remetente é um setor
            } else {
              return this.sendError(res, 'Setor do remetente não encontrado', 400);
            }
          }
        }
      }

      // Usar o ID do destinatário enviado pelo frontend ou buscar por nome
      let usuarioDestinatarioId = destinatarioIdRaw || null;
      let setorDestinatarioId: number | null = null;

      // Se foi enviado o ID do destinatário, buscar o setor: primeiro tentar como usuário
      if (destinatarioIdRaw) {
        // Se setorDestinoId foi enviado (preferência), usar diretamente
        if (setorDestinoIdRaw != null) {
          setorDestinatarioId = setorDestinoIdRaw;
          usuarioDestinatarioId = destinatarioIdRaw; // pode ser null se destinatário for setor
        } else {
          const setorDestinatarioQueryUsuario = `SELECT SETOR_ID FROM USUARIOS WHERE ID = :destinatarioId`;
          const setorDestinatarioResultUsuario = await DatabaseService.executeQuery(setorDestinatarioQueryUsuario, { destinatarioId: destinatarioIdRaw });

          if (setorDestinatarioResultUsuario.rows && setorDestinatarioResultUsuario.rows.length > 0) {
            const setorData = setorDestinatarioResultUsuario.rows[0] as any;
            setorDestinatarioId = Number(setorData.SETOR_ID);
            usuarioDestinatarioId = destinatarioIdRaw!;
          } else {
            // Se não for um usuário, tentar como setor
            const setorDestinatarioQuerySetor = `SELECT ID FROM SETORES WHERE ID = :setorId AND ATIVO = 1`;
            const setorDestinatarioResultSetor = await DatabaseService.executeQuery(setorDestinatarioQuerySetor, { setorId: destinatarioIdRaw });
            if (setorDestinatarioResultSetor.rows && setorDestinatarioResultSetor.rows.length > 0) {
              const setor = setorDestinatarioResultSetor.rows[0] as any;
              setorDestinatarioId = Number(setor.ID);
              usuarioDestinatarioId = null;
            } else {
              return this.sendError(res, 'Setor do destinatário não encontrado', 400);
            }
          }
        }
      } else {
        // Fallback: buscar por nome se não foi enviado o ID (USUARIOS.NOME)
        const destinatarioQueryUsuario = `SELECT ID, SETOR_ID FROM USUARIOS WHERE NOME = :destinatario`;
        const destinatarioResultUsuario = await DatabaseService.executeQuery(destinatarioQueryUsuario, { destinatario: wizardData.destinatario });

        if (destinatarioResultUsuario.rows && destinatarioResultUsuario.rows.length > 0) {
          const destinatarioData = destinatarioResultUsuario.rows[0] as any;
          usuarioDestinatarioId = destinatarioData.ID;
          setorDestinatarioId = destinatarioData.SETOR_ID;
        } else {
          // Fallback: tentar buscar setor por nome
          const destinatarioQuerySetor = `SELECT ID FROM SETORES WHERE NOME_SETOR = :nomeSetor AND ATIVO = 1`;
          const destinatarioResultSetor = await DatabaseService.executeQuery(destinatarioQuerySetor, { nomeSetor: wizardData.destinatario });
          if (destinatarioResultSetor.rows && destinatarioResultSetor.rows.length > 0) {
            const setor = destinatarioResultSetor.rows[0] as any;
            setorDestinatarioId = Number(setor.ID);
            usuarioDestinatarioId = null;
          } else {
            return this.sendError(res, 'Destinatário não encontrado', 400);
          }
        }
      }

      // Obter ID do usuário logado
      const id = (req as any).user?.id;
      if (!id) {
        return this.sendError(res, 'ID do usuário não encontrado', 400);
      }

      let hubSetorIdNumber: number | null = null;
      let requireHub: boolean = false;
      try {
        const hubSetorId = await this.getHubSetorId();
        hubSetorIdNumber = hubSetorId;
        if (hubSetorId != null && setorRemetenteId != null && setorDestinatarioId != null) {
          const origemEhHub = setorRemetenteId === hubSetorId;
          const destinoEhHub = setorDestinatarioId === hubSetorId;
          requireHub = !origemEhHub && !destinoEhHub;
        }
      } catch (e) {
        console.warn('Aviso: falha ao obter HUB_SETOR_ID em storeFromWizard. Prosseguindo. Detalhes:', e);
      }

      // Validações de negócio
      // Pelo menos um dos dois (remetente ou setor) deve ser informado
      if (!usuarioRemetenteId && !setorRemetenteId) {
        return this.sendError(res, 'Remetente (usuário ou setor) é obrigatório', 400);
      }

      // Pelo menos um dos dois (destinatário ou setor) deve ser informado  
      if (!usuarioDestinatarioId && !setorDestinatarioId) {
        return this.sendError(res, 'Destinatário (usuário ou setor) é obrigatório', 400);
      }

      // Se ambos forem usuários, não podem ser o mesmo
      if (usuarioRemetenteId && usuarioDestinatarioId && usuarioRemetenteId === usuarioDestinatarioId) {
        return this.sendError(res, 'Remetente e destinatário não podem ser o mesmo usuário', 400);
      }

      if (!setorRemetenteId || !setorDestinatarioId) {
        return this.sendError(res, 'Setores de origem e destino são obrigatórios', 400);
      }

      if (setorRemetenteId === setorDestinatarioId) {
        return this.sendError(res, 'Setor de origem e setor de destino devem ser diferentes', 400);
      }

      // Gerar código de rastreamento único com referências aos IDs
      let codigoRastreamento = this.generateTrackingCode(
        usuarioRemetenteId || undefined,
        usuarioDestinatarioId || undefined,
        setorRemetenteId,
        setorDestinatarioId
      );

      // Gerar código do lacre do malote (opcional)
      const codigoLacremalote = wizardData.codigoLacremalote || null;

      // IDs opcionais recebidos do wizard para vínculos referenciais
      const lacreId = toNumberOrNull(wizardData.lacreId);
      const maloteId = toNumberOrNull(wizardData.maloteId);
      // Número do malote pode vir com diferentes chaves do frontend; preparar fallback
      let numeroMalote: string | null = (wizardData as any).numeroMalote ?? (wizardData as any).maloteNumero ?? null;

      // Validações de consistência de setor para LACRE e MALOTE quando informados
      if (lacreId) {
        const lacreCheck = await DatabaseService.executeQuery(
          `SELECT ID, SETOR_ID FROM LACRE WHERE ID = :id`,
          { id: lacreId }
        );
        if (!lacreCheck.rows || lacreCheck.rows.length === 0) {
          return this.sendError(res, 'Lacre informado não existe', 400);
        }
        const lacreRow = lacreCheck.rows[0] as any;
        const lacreSetorId = Number(lacreRow.SETOR_ID) || null;
        if (!lacreSetorId || lacreSetorId !== setorRemetenteId) {
          return this.sendError(res, 'Setor do lacre difere do setor de origem da encomenda', 400);
        }
      }

      if (maloteId) {
        const maloteCheck = await DatabaseService.executeQuery(
          `SELECT ID, SETOR_DESTINO_ID, NUMERO_MALOTE FROM MALOTE WHERE ID = :id`,
          { id: maloteId }
        );
        if (!maloteCheck.rows || maloteCheck.rows.length === 0) {
          return this.sendError(res, 'Malote informado não existe', 400);
        }
        const maloteRow = maloteCheck.rows[0] as any;
        // Fallback: se não veio do wizard, usar o número do malote do banco
        if (!numeroMalote) {
          numeroMalote = maloteRow.NUMERO_MALOTE ?? maloteRow.numeroMalote ?? null;
        }
      }

      // Buscar dados do setor para incluir endereço na etiqueta
      const setorQuery = `SELECT NOME_SETOR, LOGRADOURO, NUMERO, COMPLEMENTO, BAIRRO, CIDADE, ESTADO, CEP FROM SETORES WHERE ID = :setorId AND ATIVO = 1`;
      const setorResult = await DatabaseService.executeQuery(setorQuery, { setorId: setorRemetenteId });

      let enderecoSetor = 'Endereço não encontrado';
      let nomeSetor = 'Setor não encontrado';
      if (setorResult.rows && setorResult.rows.length > 0) {
        const setor = setorResult.rows[0] as any;
        nomeSetor = setor.NOME_SETOR;
        enderecoSetor = `${setor.LOGRADOURO}, ${setor.NUMERO} - ${setor.BAIRRO}, ${setor.CIDADE}/${setor.ESTADO} - CEP: ${setor.CEP}`;
      }

      // Buscar dados completos do setor de origem
      let nomeSetorOrigem = 'Setor não encontrado';
      let enderecoSetorOrigem = '';
      if (setorRemetenteId) {
        const setorOrigemResult = await DatabaseService.executeQuery(
          'SELECT NOME_SETOR, LOGRADOURO, NUMERO, BAIRRO, CIDADE, ESTADO, CEP FROM SETORES WHERE ID = :setorId AND ATIVO = 1',
          { setorId: setorRemetenteId }
        );
        if (setorOrigemResult.rows && setorOrigemResult.rows.length > 0) {
          const setorOrigem = setorOrigemResult.rows[0] as any;
          nomeSetorOrigem = setorOrigem.NOME_SETOR;
          enderecoSetorOrigem = `${setorOrigem.LOGRADOURO}, ${setorOrigem.NUMERO} - ${setorOrigem.BAIRRO}, ${setorOrigem.CIDADE}/${setorOrigem.ESTADO} - CEP: ${setorOrigem.CEP}`;
        }
      }

      // Buscar dados de matrícula e vínculo dos usuários
      let remetenteMatricula = '';
      let remetenteVinculo = '';
      let destinatarioMatricula = '';
      let destinatarioVinculo = '';

      if (usuarioRemetenteId) {
        const remetenteResult = await DatabaseService.executeQuery(
          'SELECT MATRICULA, VINCULO_FUNCIONAL FROM USUARIOS WHERE ID = :usuarioId',
          { usuarioId: usuarioRemetenteId }
        );
        if (remetenteResult.rows && remetenteResult.rows.length > 0) {
          const remetente = remetenteResult.rows[0] as any;
          remetenteMatricula = remetente.MATRICULA || '';
          remetenteVinculo = remetente.VINCULO_FUNCIONAL || '';
        }
      }

      if (usuarioDestinatarioId) {
        const destinatarioResult = await DatabaseService.executeQuery(
          'SELECT MATRICULA, VINCULO_FUNCIONAL FROM USUARIOS WHERE ID = :usuarioId',
          { usuarioId: usuarioDestinatarioId }
        );
        if (destinatarioResult.rows && destinatarioResult.rows.length > 0) {
          const destinatario = destinatarioResult.rows[0] as any;
          destinatarioMatricula = destinatario.MATRICULA || '';
          destinatarioVinculo = destinatario.VINCULO_FUNCIONAL || '';
        }
      }

      // Gerar QR Code com TODOS os dados da encomenda
      const qrCodeData = JSON.stringify({
        codigo: codigoRastreamento,
        remetente: wizardData.remetente,
        destinatario: wizardData.destinatario,
        setorOrigem: nomeSetorOrigem,
        setorDestino: nomeSetor,
        descricao: wizardData.descricao,
        dataPostagem: new Date().toISOString(),
        // Informações de malote/lacre/AR
        codigoLacre: codigoLacremalote,
        numeroMalote: numeroMalote,
        numeroAR: wizardData.avisoRecebimento || null,
        // Identificadores funcionais
        remetenteMatricula: remetenteMatricula,
        remetenteVinculo: remetenteVinculo,
        destinatarioMatricula: destinatarioMatricula,
        destinatarioVinculo: destinatarioVinculo,
        // Endereços dos setores
        enderecoSetorOrigem: enderecoSetorOrigem,
        enderecoSetorDestino: enderecoSetor,
        // Metadados
        urgente: wizardData.urgente || false,
        tipo: wizardData.tipo,
        prioridade: wizardData.urgente ? 'urgente' : 'normal'
      });

      // Gerar código de barras (usando o código de rastreamento)
      const codigoBarras = codigoRastreamento;

      // Garantir pool inicializado e verificar colunas existentes para evitar ORA-00904
      await DatabaseService.ensureInitialized();
      const allColsCheck = await DatabaseService.executeQuery(
        `SELECT UPPER(COLUMN_NAME) AS COLUMN_NAME FROM USER_TAB_COLUMNS 
         WHERE TABLE_NAME = 'ENCOMENDAS'`
      );
      const existingCols = new Set<string>((allColsCheck.rows || []).map((r: any) => String(r.COLUMN_NAME)));
      const existingOptionalCols = new Set<string>(
        ['QR_CODE', 'CODIGO_BARRAS', 'URGENTE', 'LACRE_ID', 'MALOTE_ID', 'NUMERO_AR', 'SETOR_HUB', 'SETOR_HUB_ID'].filter(c => existingCols.has(c))
      );

      // Metadados das colunas opcionais para binds type-aware
      const optMetaRes = await DatabaseService.executeQuery(
        `SELECT UPPER(COLUMN_NAME) AS COLUMN_NAME, DATA_TYPE, DATA_LENGTH, DATA_PRECISION, DATA_SCALE
         FROM USER_TAB_COLUMNS
         WHERE TABLE_NAME = 'ENCOMENDAS'
           AND UPPER(COLUMN_NAME) IN ('QR_CODE','CODIGO_BARRAS','URGENTE','LACRE_ID','MALOTE_ID','NUMERO_AR','NUMERO_ENCOMENDA','SETOR_HUB','SETOR_HUB_ID')`
      );
      const optMeta = new Map<string, { type: string; length: number; precision: number; scale: number }>();
      for (const row of (optMetaRes.rows || [])) {
        optMeta.set(String((row as any).COLUMN_NAME), {
          type: String((row as any).DATA_TYPE || '').toUpperCase(),
          length: Number((row as any).DATA_LENGTH || 0),
          precision: Number((row as any).DATA_PRECISION || 0),
          scale: Number((row as any).DATA_SCALE || 0)
        });
      }

      // Selecionar coluna de descrição disponível
      const descricaoCol = existingCols.has('DESCRICAO')
        ? 'DESCRICAO'
        : existingCols.has('OBSERVACOES')
          ? 'OBSERVACOES'
          : null;
      if (!descricaoCol) {
        throw new Error('Coluna de descrição não encontrada em ENCOMENDAS (esperado DESCRICAO ou OBSERVACOES)');
      }

      // Obter metadados da coluna de descrição para evitar estouro de tamanho (ORA-12899)
      const descColMetaRes = await DatabaseService.executeQuery(
        `SELECT DATA_TYPE, DATA_LENGTH FROM USER_TAB_COLUMNS 
         WHERE TABLE_NAME = 'ENCOMENDAS' AND COLUMN_NAME = :col`,
        { col: descricaoCol }
      );
      const descDataType = String(descColMetaRes.rows?.[0]?.DATA_TYPE || 'VARCHAR2').toUpperCase();
      const descDataLength = Number(descColMetaRes.rows?.[0]?.DATA_LENGTH || 4000);

      // Montar texto de descrição (com fallback de truncamento se tipo for VARCHAR/CHAR)
      let descricaoText = `Tipo: ${wizardData.tipo}\nRemetente: ${wizardData.remetente}\nDestinatário: ${wizardData.destinatario}\nSetor Origem: ${wizardData.setorOrigem || 'Não informado'}\nSetor Destino: ${wizardData.setorDestino}\nDescrição: ${wizardData.descricao}\nPrioridade: ${wizardData.prioridade || 'normal'}\nUrgente: ${wizardData.urgente ? 'Sim' : 'Não'}\nPeso: ${wizardData.peso || 0}kg\nDimensões: ${wizardData.dimensoes || 'Não informado'}\nValor Declarado: R$ ${wizardData.valorDeclarado || 0}\nObservações: ${wizardData.observacoes || 'Nenhuma'}`;
      const varcharTypes = ['VARCHAR2', 'CHAR', 'NVARCHAR2', 'NCHAR'];
      if (varcharTypes.includes(descDataType) && descricaoText.length > descDataLength) {
        descricaoText = descricaoText.slice(0, descDataLength);
      }

      // Montar INSERT dinamicamente com base nas colunas existentes
      const baseColumns = [
        'NUMERO_ENCOMENDA', descricaoCol, 'STATUS', 'DATA_CRIACAO', 'DATA_ATUALIZACAO',
        'USUARIO_ORIGEM_ID', 'USUARIO_DESTINO_ID', 'SETOR_ORIGEM_ID', 'SETOR_DESTINO_ID'
      ];
      const baseValues = [
        ':numeroEncomenda', ':descricao', ':status', 'SYSDATE', 'SYSDATE',
        ':usuarioOrigemId', ':usuarioDestinoId', ':setorOrigemId', ':setorDestinoId'
      ];

      const binds: any = {
        numeroEncomenda: codigoRastreamento,
        descricao: descricaoText,
        // STATUS definido para "em_transito" conforme regra do sistema
        status: 'em_transito',
        usuarioOrigemId: usuarioRemetenteId ? { val: usuarioRemetenteId, type: oracledb.NUMBER } : null,
        usuarioDestinoId: usuarioDestinatarioId ? { val: usuarioDestinatarioId, type: oracledb.NUMBER } : null,
        setorOrigemId: setorRemetenteId,
        setorDestinoId: setorDestinatarioId
      };

      // Persistir metadados de Hub quando aplicável
      const hubInvolved = hubSetorIdNumber != null && (
        setorRemetenteId === hubSetorIdNumber ||
        setorDestinatarioId === hubSetorIdNumber ||
        requireHub
      );
      if (hubInvolved && existingOptionalCols.has('SETOR_HUB')) {
        baseColumns.push('SETOR_HUB');
        baseValues.push(':setorHub');
        const meta = optMeta.get('SETOR_HUB');
        let val: any = 'SIM';
        if (meta?.type === 'NUMBER') {
          val = 1;
        }
        binds.setorHub = val;
      }
      if (hubInvolved && existingOptionalCols.has('SETOR_HUB_ID')) {
        baseColumns.push('SETOR_HUB_ID');
        baseValues.push(':setorHubId');
        binds.setorHubId = hubSetorIdNumber;
      }

      // Adicionar colunas opcionais presentes
      if (existingOptionalCols.has('QR_CODE')) {
        baseColumns.push('QR_CODE');
        baseValues.push(':qrCode');
        {
          const meta = optMeta.get('QR_CODE');
          let val = qrCodeData;
          const isVarchar = meta && ['VARCHAR2', 'CHAR', 'NVARCHAR2', 'NCHAR'].includes(meta.type);
          if (isVarchar && meta!.length > 0 && val.length > meta!.length) {
            val = val.slice(0, meta!.length);
          }
          binds.qrCode = val || null;
        }
      }
      if (existingOptionalCols.has('CODIGO_BARRAS')) {
        baseColumns.push('CODIGO_BARRAS');
        baseValues.push(':codigoBarras');
        {
          const meta = optMeta.get('CODIGO_BARRAS');
          let val: any = codigoBarras;
          if (meta?.type === 'NUMBER') {
            const digits = String(codigoBarras).replace(/\D+/g, '');
            val = digits ? Number(digits) : null;
          } else if (meta && ['VARCHAR2', 'CHAR', 'NVARCHAR2', 'NCHAR'].includes(meta.type)) {
            const s = String(codigoBarras);
            val = meta.length > 0 && s.length > meta.length ? s.slice(0, meta.length) : s;
          }
          binds.codigoBarras = val || null;
        }
      }
      if (existingOptionalCols.has('URGENTE')) {
        baseColumns.push('URGENTE');
        baseValues.push(':urgente');
        {
          const meta = optMeta.get('URGENTE');
          const isUrg = !!wizardData.urgente;
          let val: any = isUrg ? 1 : 0;
          if (meta && ['VARCHAR2', 'CHAR', 'NVARCHAR2', 'NCHAR'].includes(meta.type)) {
            val = isUrg ? 'S' : 'N';
          } else if (meta?.type === 'NUMBER') {
            val = isUrg ? 1 : 0;
          }
          binds.urgente = val;
        }
      }
      if (existingOptionalCols.has('LACRE_ID')) {
        baseColumns.push('LACRE_ID');
        baseValues.push(':lacreId');
        binds.lacreId = lacreId || null;
      }
      if (existingOptionalCols.has('MALOTE_ID')) {
        baseColumns.push('MALOTE_ID');
        baseValues.push(':maloteId');
        binds.maloteId = maloteId || null;
      }
      if (existingOptionalCols.has('NUMERO_AR')) {
        baseColumns.push('NUMERO_AR');
        baseValues.push(':numeroAR');
        {
          const meta = optMeta.get('NUMERO_AR');
          const raw = wizardData.avisoRecebimento ?? null;
          let val: any = raw;
          if (raw !== null && raw !== undefined) {
            if (meta?.type === 'NUMBER') {
              const digits = String(raw).replace(/\D+/g, '');
              val = digits ? Number(digits) : null;
            } else if (meta && ['VARCHAR2', 'CHAR', 'NVARCHAR2', 'NCHAR'].includes(meta.type)) {
              const s = String(raw);
              val = meta.length > 0 && s.length > meta.length ? s.slice(0, meta.length) : s;
            }
          } else {
            val = null;
          }
          binds.numeroAR = val;
        }
      }

      // Adicionar vínculo de encomenda pai se a coluna existir e o valor for informado
      const encomendaPaiIdRaw = req.body?.encomendaPaiId;
      const encomendaPaiId = encomendaPaiIdRaw != null ? Number(encomendaPaiIdRaw) : null;
      if (existingCols.has('ENCOMENDA_PAI_ID') && encomendaPaiId && Number.isFinite(encomendaPaiId)) {
        baseColumns.push('ENCOMENDA_PAI_ID');
        baseValues.push(':encomendaPaiId');
        binds.encomendaPaiId = encomendaPaiId;
      }

      const query = `
        INSERT INTO ${this.tableName} (
          ${baseColumns.join(', ')}
        ) VALUES (
          ${baseValues.join(', ')}
        )
      `;

      // Tentar inserir apenas com variações de "em_transito" aceitas pelo banco
      const statusCandidates = ['em_transito', 'EM_TRANSITO'];
      let inserted = false;
      for (const candidate of statusCandidates) {
        try {
          binds.status = candidate;
          await DatabaseService.executeQuery(query, binds);
          inserted = true;
          break;
        } catch (err) {
          const msg = (err as Error)?.message || String(err);
          // Em caso de chave única (por exemplo, NUMERO_ENCOMENDA duplicado), gerar novo código e tentar novamente
          if (msg.includes('ORA-00001')) {
            const numEncMeta = optMeta.get('NUMERO_ENCOMENDA');
            const maxLen = numEncMeta?.length && numEncMeta.length > 0 ? numEncMeta.length : 100;
            const suffix = '-' + String(Date.now()).slice(-6);
            codigoRastreamento = (codigoRastreamento + suffix).slice(0, maxLen);
            // Atualizar dependentes
            binds.numeroEncomenda = codigoRastreamento;
            // Se código de barras depender do rastreamento, readequar também
            const cbMeta = optMeta.get('CODIGO_BARRAS');
            let valCB: any = codigoRastreamento;
            if (existingOptionalCols.has('CODIGO_BARRAS')) {
              if (cbMeta?.type === 'NUMBER') {
                const digits = String(valCB).replace(/\D+/g, '');
                valCB = digits ? Number(digits) : null;
              } else if (cbMeta && ['VARCHAR2', 'CHAR', 'NVARCHAR2', 'NCHAR'].includes(cbMeta.type)) {
                const s = String(valCB);
                valCB = cbMeta.length > 0 && s.length > cbMeta.length ? s.slice(0, cbMeta.length) : s;
              }
              binds.codigoBarras = valCB;
            }
            continue;
          }
          // Somente continuar tentando em caso de violação de constraint de STATUS
          if (
            msg.includes('ORA-02290') ||
            msg.toLowerCase().includes('check constraint')
          ) {
            continue;
          }
          // Erros diferentes devem ser propagados
          throw err;
        }
      }
      if (!inserted) {
        throw new Error('Nenhum valor de STATUS aceito pelo banco (violação de constraint).');
      }
      const idRes = await DatabaseService.executeQuery(
        `SELECT ID FROM ${this.tableName} WHERE NUMERO_ENCOMENDA = :num`,
        { num: codigoRastreamento }
      );
      const newEncomendaId = idRes.rows?.[0]?.ID;

      try {
        if (lacreId && newEncomendaId && maloteId) {
          await DatabaseService.executeTransaction([
            {
              sql: `UPDATE LACRE SET ENCOMENDA_ID = :encomendaId, MALOTE_ID = :maloteId, STATUS = 'utilizado', DATA_ATUALIZACAO = SYSTIMESTAMP WHERE ID = :lacreId`,
              binds: { encomendaId: newEncomendaId, maloteId, lacreId }
            },
            {
              sql: `UPDATE MALOTE SET ENCOMENDA_ID = :encomendaId WHERE ID = :maloteId`,
              binds: { encomendaId: newEncomendaId, maloteId }
            }
          ]);
        } else if (lacreId && newEncomendaId && !maloteId) {
          await DatabaseService.executeQuery(
            `UPDATE LACRE SET STATUS = 'utilizado', DATA_ATUALIZACAO = SYSTIMESTAMP WHERE ID = :lacreId`,
            { lacreId }
          );
        } else if (maloteId && !lacreId) {
          console.warn('Aviso: MALOTE informado sem LACRE. ENCOMENDA_ID não será atualizado devido a regra do banco.');
        }
      } catch (linkErr) {
        console.warn('Aviso: falha ao atualizar vínculos de MALOTE/LACRE após criação da encomenda:', linkErr);
      }

      this.sendSuccess(res, {
        encomendaId: newEncomendaId,
        codigo: codigoRastreamento,
        qrCode: qrCodeData,
        codigoBarras: codigoBarras,
        codigoLacremalote: codigoLacremalote,
        enderecoSetor: enderecoSetor,
        nomeSetor: nomeSetor,
        message: 'Encomenda criada com sucesso'
      }, 'Encomenda criada com sucesso', {}, 201);

      // Notificar clientes SSE
      sse.broadcast('encomendas:update', { action: 'created', numeroEncomenda: codigoRastreamento });
    } catch (error) {
      console.error('=== ERRO storeFromWizard ===');
      console.error('TraceID:', traceId);
      console.error('Tipo do erro:', typeof error);
      console.error('Erro completo:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('Message:', errMsg);
      const oraCode = (error as any)?.errorNum || this.extractOracleCode(errMsg);
      const oraOffset = (error as any)?.offset || null;
      const hint = this.mapOracleErrorHint(oraCode, errMsg);
      this.sendError(res, 'Erro ao criar encomenda', 500, {
        traceId,
        oracleCode: oraCode,
        oracleOffset: oraOffset,
        message: errMsg,
        hint
      });
    }
  }

  override async store(req: Request, res: Response): Promise<void> {
    try {
      const encomenda: IEncomenda = req.body;

      const usuarioOrigemId = encomenda.usuarioOrigemId;
      const usuarioDestinoId = encomenda.usuarioDestinoId;
      let setorOrigemId = encomenda.setorOrigemId;
      let setorDestinoId = encomenda.setorDestinoId;

      let requireHubStore = false;
      try {
        const hubSetorId = await this.getHubSetorId();
        if (hubSetorId != null && setorOrigemId != null && setorDestinoId != null) {
          const origemEhHub = setorOrigemId === hubSetorId;
          const destinoEhHub = setorDestinoId === hubSetorId;
          requireHubStore = !origemEhHub && !destinoEhHub;
        }
      } catch (e) {
        console.warn('Aviso: falha ao obter HUB_SETOR_ID em store. Prosseguindo. Detalhes:', e);
      }

      if (!usuarioOrigemId || !usuarioDestinoId || !setorOrigemId || !setorDestinoId) {
        return this.sendError(
          res,
          'Campos obrigatórios ausentes: usuário remetente/destinatário e setor origem/destino',
          400
        );
      }

      if (usuarioOrigemId === usuarioDestinoId) {
        return this.sendError(res, 'Remetente e destinatário não podem ser o mesmo usuário', 400);
      }

      if (setorOrigemId === setorDestinoId) {
        return this.sendError(res, 'Setor de origem e destino não podem ser o mesmo', 400);
      }

      // Validar se remetente e destinatário pertencem ao mesmo setor (não permitido)
      try {
        const usersResult = await DatabaseService.executeQuery(
          'SELECT ID, SETOR_ID FROM USUARIOS WHERE ID IN (:u1, :u2)',
          { u1: usuarioOrigemId, u2: usuarioDestinoId }
        );
        const rows = usersResult.rows || [];
        const uOrigem = rows.find((r: any) => r.ID === usuarioOrigemId);
        const uDestino = rows.find((r: any) => r.ID === usuarioDestinoId);
        if (
          uOrigem &&
          uDestino &&
          uOrigem.SETOR_ID != null &&
          uDestino.SETOR_ID != null &&
          uOrigem.SETOR_ID === uDestino.SETOR_ID
        ) {
          return this.sendError(res, 'Remetente e destinatário não podem pertencer ao mesmo setor', 400);
        }
      } catch (e) {
        // Se ocorrer erro na validação adicional, seguir com as validações já garantidas acima
        console.warn('Aviso: falha ao validar setores dos usuários. Prosseguindo com validações básicas. Detalhes:', e);
      }

      const query = `
        INSERT INTO ${this.tableName} (
          NUMERO_ENCOMENDA, DESCRICAO, STATUS, DATA_CRIACAO, DATA_ATUALIZACAO,
          USUARIO_ORIGEM_ID, USUARIO_DESTINO_ID, SETOR_ORIGEM_ID, SETOR_DESTINO_ID, URGENTE
        ) VALUES (
          :numeroEncomenda, :descricao, :status, SYSDATE, SYSDATE,
          :usuarioOrigemId, :usuarioDestinoId, :setorOrigemId, :setorDestinoId, :urgente
        )
      `;

      const binds = {
        numeroEncomenda: encomenda.numeroEncomenda,
        descricao: encomenda.descricao,
        status: encomenda.status || 'pendente',
        usuarioOrigemId,
        usuarioDestinoId,
        setorOrigemId,
        setorDestinoId,
        urgente: encomenda.urgente ? 1 : 0
      };

      await DatabaseService.executeQuery(query, binds);

      // Se o status foi definido para 'entregue', liberar MALOTE associado e marcar LACRE como utilizado
      try {
        const nextStatus = String(encomenda.status || '').toLowerCase().trim();
        if (nextStatus === 'entregue') {
          const linkRes = await DatabaseService.executeQuery(
            `SELECT MALOTE_ID, LACRE_ID, SETOR_DESTINO_ID FROM ${this.tableName} WHERE ID = :id`,
            { id: encomenda.id }
          );
          const linkRow = linkRes.rows?.[0] as any;
          const maloteId = linkRow?.MALOTE_ID ? Number(linkRow.MALOTE_ID) : null;
          const lacreId = linkRow?.LACRE_ID ? Number(linkRow.LACRE_ID) : null;
          const setorDestinoId = linkRow?.SETOR_DESTINO_ID ? Number(linkRow.SETOR_DESTINO_ID) : null;

          if (maloteId) {
            await DatabaseService.executeQuery(
              `UPDATE MALOTE SET ENCOMENDA_ID = NULL, STATUS = 'Disponivel', ${setorDestinoId ? 'SETOR_DESTINO_ID = :sdid,' : ''} DATA_ATUALIZACAO = SYSDATE WHERE ID = :mid`,
              setorDestinoId ? { mid: maloteId, sdid: setorDestinoId } : { mid: maloteId }
            );
          }
          if (lacreId) {
            await DatabaseService.executeQuery(
              `UPDATE LACRE SET ENCOMENDA_ID = NULL, STATUS = 'utilizado', DATA_ATUALIZACAO = SYSTIMESTAMP WHERE ID = :lid`,
              { lid: lacreId }
            );
          }
        }
        // NOTA: O STATUS do malote é atualizado automaticamente pelo trigger TRG_ENCOMENDAS_PROPAGATE_MALOTE_STATUS
        // que propaga o status da encomenda para o malote vinculado:
        // - STATUS = 'em_transito' -> MALOTE.STATUS = 'Em transito'
        // - STATUS = 'entregue' -> MALOTE.ENCOMENDA_ID = NULL e MALOTE.STATUS = 'Disponivel'
        // - Outros status -> MALOTE.STATUS = 'Indisponivel'
      } catch (releaseErr) {
        console.warn('Aviso: falha ao liberar MALOTE/LACRE após atualização de encomenda:', releaseErr);
      }
      this.sendSuccess(res, { message: 'Encomenda criada com sucesso' }, 'Encomenda criada com sucesso', {}, 201);

      // Notificar clientes SSE
      sse.broadcast('encomendas:update', { action: 'created', numeroEncomenda: encomenda.numeroEncomenda });
    } catch (error) {
      this.sendError(res, 'Erro ao criar encomenda', 500);
    }
  }

  override async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const encomenda: Partial<IEncomenda> = req.body;

      // Obter valores atuais para validar corretamente com atualizações parciais
      const currentRes = await DatabaseService.executeQuery(
        `SELECT USUARIO_ORIGEM_ID, USUARIO_DESTINO_ID, SETOR_ORIGEM_ID, SETOR_DESTINO_ID FROM ${this.tableName} WHERE ID = :id`,
        { id }
      );
      const current = currentRes.rows?.[0];
      if (!current) {
        return this.sendError(res, 'Encomenda não encontrada', 404);
      }

      const usuarioOrigemId = encomenda.usuarioOrigemId ?? current.USUARIO_ORIGEM_ID;
      const usuarioDestinoId = encomenda.usuarioDestinoId ?? current.USUARIO_DESTINO_ID;
      const setorOrigemId = encomenda.setorOrigemId ?? current.SETOR_ORIGEM_ID;
      const setorDestinoId = encomenda.setorDestinoId ?? current.SETOR_DESTINO_ID;

      if (!usuarioOrigemId || !usuarioDestinoId || !setorOrigemId || !setorDestinoId) {
        return this.sendError(
          res,
          'Campos obrigatórios ausentes: usuário remetente/destinatário e setor origem/destino',
          400
        );
      }

      if (usuarioOrigemId === usuarioDestinoId) {
        return this.sendError(res, 'Remetente e destinatário não podem ser o mesmo usuário', 400);
      }

      if (setorOrigemId === setorDestinoId) {
        return this.sendError(res, 'Setor de origem e destino não podem ser o mesmo', 400);
      }

      // Validar se remetente e destinatário pertencem ao mesmo setor (não permitido)
      try {
        const usersResult = await DatabaseService.executeQuery(
          'SELECT ID, SETOR_ID FROM USUARIOS WHERE ID IN (:u1, :u2)',
          { u1: usuarioOrigemId, u2: usuarioDestinoId }
        );
        const rows = usersResult.rows || [];
        const uOrigem = rows.find((r: any) => r.ID === usuarioOrigemId);
        const uDestino = rows.find((r: any) => r.ID === usuarioDestinoId);
        if (
          uOrigem &&
          uDestino &&
          uOrigem.SETOR_ID != null &&
          uDestino.SETOR_ID != null &&
          uOrigem.SETOR_ID === uDestino.SETOR_ID
        ) {
          return this.sendError(res, 'Remetente e destinatário não podem pertencer ao mesmo setor', 400);
        }
      } catch (e) {
        console.warn('Aviso: falha ao validar setores dos usuários na atualização. Prosseguindo com validações básicas. Detalhes:', e);
      }

      const query = `
        UPDATE ${this.tableName} SET
          NUMERO_ENCOMENDA = :numeroEncomenda,
          DESCRICAO = :descricao,
          STATUS = :status,
          DATA_ATUALIZACAO = SYSDATE,
          USUARIO_ORIGEM_ID = :usuarioOrigemId,
          USUARIO_DESTINO_ID = :usuarioDestinoId,
          SETOR_ORIGEM_ID = :setorOrigemId,
          SETOR_DESTINO_ID = :setorDestinoId,
          URGENTE = :urgente,
          DATA_ENTREGA = COALESCE(:dataEntrega, CASE WHEN :status = 'entregue' AND DATA_ENTREGA IS NULL THEN SYSDATE ELSE DATA_ENTREGA END)
        WHERE ID = :id
      `;

      const binds = {
        id,
        numeroEncomenda: encomenda.numeroEncomenda,
        descricao: encomenda.descricao,
        status: encomenda.status,
        usuarioOrigemId,
        usuarioDestinoId,
        setorOrigemId,
        setorDestinoId,
        urgente: encomenda.urgente ? 1 : 0,
        dataEntrega: encomenda.dataEntrega ? new Date(encomenda.dataEntrega as any) : null
      };

      await DatabaseService.executeQuery(query, binds);

      // Eventos descontinuados: ENCOMENDAS_EVENTOS removida. Histórico e validação são mantidos via ENCOMENDAS e MALOTE/LACRE.
      // Nenhuma ação adicional necessária aqui.
      this.sendSuccess(res, { message: 'Encomenda atualizada com sucesso' });

      // Notificar clientes SSE
      sse.broadcast('encomendas:update', { action: 'updated', id });
    } catch (error) {
      this.sendError(res, 'Erro ao atualizar encomenda', 500);
    }
  }

  override async destroy(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Verificar autenticação e permissão (Admin-only)
      const role = req.user?.role?.toUpperCase() || '';
      const isAdmin = role === 'ADMIN' || role === 'ADMINISTRADOR';
      if (!req.user || !isAdmin) {
        return this.sendError(res, 'Apenas administradores podem excluir encomendas', 403);
      }

      const { id } = req.params;

      // 0) Verificar existência do registro antes de prosseguir
      try {
        const exists = await DatabaseService.executeQuery(
          `SELECT ID FROM ${this.tableName} WHERE ID = :id`,
          { id }
        );
        if (!exists.rows || exists.rows.length === 0) {
          return this.sendError(res, 'Encomenda não encontrada', 404);
        }
      } catch (existsErr) {
        console.warn('Aviso: falha ao verificar existência da encomenda antes da exclusão:', existsErr);
      }

      // 1) Limpar vínculos na própria ENCOMENDAS (LACRE_ID/MALOTE_ID) e remover filhos LACRE/MALOTE
      try {
        // Buscar IDs vinculados
        const linkRes = await DatabaseService.executeQuery(
          `SELECT MALOTE_ID, LACRE_ID FROM ${this.tableName} WHERE ID = :id`,
          { id }
        );
        const linkRow = linkRes.rows?.[0] as any;
        const maloteId = linkRow?.MALOTE_ID ? Number(linkRow.MALOTE_ID) : null;
        const lacreId = linkRow?.LACRE_ID ? Number(linkRow.LACRE_ID) : null;

        const ops: { sql: string; binds?: any }[] = [];

        // 1.1) Quebrar FKs de ENCOMENDAS para LACRE/MALOTE para permitir remoção de filhos
        ops.push({
          sql: `UPDATE ${this.tableName} SET LACRE_ID = NULL, MALOTE_ID = NULL WHERE ID = :eid`,
          binds: { eid: Number(id) }
        });

        // 1.2) Remover todos LACRES que apontam para esta encomenda (trigger impede desfazer vínculo via UPDATE)
        ops.push({
          sql: `DELETE FROM LACRE WHERE ENCOMENDA_ID = :eid`,
          binds: { eid: Number(id) }
        });

        // 1.3) Soltar MALOTE (não apagar): tirar referência e restaurar disponibilidade
        if (maloteId) {
          // Desvincular malote da encomenda
          // NOTA: O STATUS do malote é atualizado automaticamente pelo trigger TRG_MALOTE_SET_STATUS_ON_LINK
          ops.push({
            sql: `UPDATE MALOTE SET ENCOMENDA_ID = NULL, DATA_ATUALIZACAO = SYSDATE WHERE ID = :mid`,
            binds: { mid: maloteId }
          });
        }
        // Abrangência: qualquer malote ainda com referência à encomenda
        ops.push({
          sql: `UPDATE MALOTE SET ENCOMENDA_ID = NULL, DATA_ATUALIZACAO = SYSDATE WHERE ENCOMENDA_ID = :eid`,
          binds: { eid: Number(id) }
        });

        await DatabaseService.executeTransaction(ops);
      } catch (releaseErr) {
        console.warn('Aviso: falha ao remover LACRE/soltar MALOTE antes da exclusão:', releaseErr);
      }

      // 2) Remover eventos vinculados (filhos) para evitar ORA-02292 em ambientes onde ENCOMENDAS_EVENTOS existe
      try {
        await DatabaseService.executeQuery(
          `DELETE FROM ENCOMENDAS_EVENTOS WHERE ENCOMENDA_ID = :id`,
          { id: Number(id) }
        );
      } catch (evtErr) {
        console.warn('Aviso: falha ao remover eventos de ENCOMENDAS_EVENTOS (pode não existir no ambiente):', evtErr);
      }

      // 3) Excluir a encomenda com tratamento fino de erros Oracle
      const deleteQuery = `DELETE FROM ${this.tableName} WHERE ID = :id`;
      try {
        await DatabaseService.executeQuery(deleteQuery, { id });
        this.sendSuccess(res, null, 'Encomenda excluída com sucesso');
        // Notificar clientes SSE apenas em sucesso
        sse.broadcast('encomendas:update', { action: 'deleted', id });
      } catch (dbErr: any) {
        const rawMsg = dbErr?.message ? String(dbErr.message) : String(dbErr);
        const oraCode = this.extractOracleCode(rawMsg);

        // ORA-02292: integrity constraint violated - child record found
        if (oraCode === 2292 || rawMsg.toUpperCase().includes('ORA-02292')) {
          return this.sendError(
            res,
            'Não é possível excluir: existem registros vinculados (malote, lacre, tramitações ou histórico). Desvincule-os e tente novamente.',
            409
          );
        }

        // ORA-00054: resource busy and acquire with NOWAIT specified or timeout expired
        if (oraCode === 54 || rawMsg.toUpperCase().includes('ORA-00054')) {
          return this.sendError(
            res,
            'Registro em uso no momento. Tente novamente em instantes.',
            423
          );
        }

        // Demais erros: logar e retornar 500 genérico com detalhes para diagnóstico
        console.error('Erro ao excluir encomenda (detalhe):', dbErr);
        return this.sendError(res, 'Erro ao excluir encomenda', 500, { oraCode, details: rawMsg });
      }
    } catch (error) {
      const rawMsg = (error as any)?.message ? String((error as any).message) : String(error);
      const oraCode = this.extractOracleCode(rawMsg);
      console.error('Erro inesperado ao excluir encomenda:', error);
      this.sendError(res, 'Erro ao excluir encomenda', 500, { oraCode, details: rawMsg });
    }
  }

  /**
   * Gera um código de rastreamento único
   * Formato: EN-YYYYMMDD-XXXXXX onde YYYYMMDD é a data da postagem
   */
  private generateTrackingCode(usuarioRemetenteId?: number, usuarioDestinatarioId?: number, setorRemetenteId?: number, setorDestinatarioId?: number): string {
    const dataPostagem = new Date();
    const ano = dataPostagem.getFullYear();
    const mes = String(dataPostagem.getMonth() + 1).padStart(2, '0');
    const dia = String(dataPostagem.getDate()).padStart(2, '0');
    const numeroSequencial = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

    // Incluir referências aos IDs no código
    const remetenteRef = usuarioRemetenteId ? String(usuarioRemetenteId).padStart(3, '0') : '000';
    const destinatarioRef = usuarioDestinatarioId ? String(usuarioDestinatarioId).padStart(3, '0') : '000';
    const setorOrigemRef = setorRemetenteId ? String(setorRemetenteId).padStart(2, '0') : '00';
    const setorDestinoRef = setorDestinatarioId ? String(setorDestinatarioId).padStart(2, '0') : '00';

    // Formato: EN-YYYYMMDD-RRRSSDDDTT-XXXXXX 
    // Onde: RRR=usuário remetente, SS=setor origem, DDD=usuário destinatário, TT=setor destino, XXXXXX=sequencial
    // Componentes unidos sem hífens: RRRSSDDDTT
    return `EN-${ano}${mes}${dia}-${remetenteRef}${setorOrigemRef}${destinatarioRef}${setorDestinoRef}-${numeroSequencial}`;
  }

  /**
   * Mapeia uma linha do banco para o objeto Encomenda
   */
  private async mapRowToEncomenda(row: any): Promise<IEncomenda> {
    const parseDescricaoField = (field: any): { descricao: string, observacoes: string, tipo?: string } => {
      if (!field) return { descricao: '', observacoes: '' };

      // Converter para string primeiro
      let fieldStr = '';
      if (typeof field === 'string') {
        fieldStr = field;
      } else if (field && typeof field === 'object') {
        // Para outros objetos, tentar toString
        fieldStr = field.toString ? field.toString() : '[Objeto não conversível]';
      } else {
        fieldStr = String(field);
      }

      // Separar descrição e observações do texto estruturado
      let descricao = '';
      let observacoes = '';
      let tipo: string | undefined;

      if (fieldStr) {
        const linhas = fieldStr.split('\n');

        for (const linha of linhas) {
          const linhaTrimmed = linha.trim();

          if (linhaTrimmed.startsWith('Tipo:')) {
            tipo = linhaTrimmed.replace('Tipo:', '').trim();
            continue;
          }
          if (linhaTrimmed.startsWith('Descrição:')) {
            descricao = linhaTrimmed.replace('Descrição:', '').trim();
          } else if (linhaTrimmed.startsWith('Observações:')) {
            observacoes = linhaTrimmed.replace('Observações:', '').trim();
          }
        }
      }

      return tipo !== undefined ? { descricao, observacoes, tipo } : { descricao, observacoes };
    };

    // Função auxiliar para tratar campos QR Code
    const parseQrCodeField = (field: any): string => {
      if (!field) return '';

      // Se vier como Lob (CLOB), ler como stream
      const isLob = field && typeof field === 'object' && (
        (field.type && String(field.type).toUpperCase().includes('CLOB')) ||
        typeof field.getData === 'function' ||
        typeof field.toString === 'function'
      );

      if (isLob && typeof (field as any).getData === 'function') {
        try {
          let fieldStr = '';
          const chunks: Buffer[] = [];
          (field as any).on('data', (chunk: Buffer) => chunks.push(chunk));
          (field as any).on('end', () => { fieldStr = Buffer.concat(chunks).toString('utf8'); });
          (field as any).on('error', (e: any) => { console.log('Erro ao ler Lob QR:', e); });
          // Nota: Em alguns drivers, é necessário await em uma promessa de leitura; aqui tratamos como melhor esforço
          if (fieldStr) {
            field = fieldStr;
          }
        } catch (e) {
          console.log('Erro ao processar Lob QR:', e);
        }
      }

      if (typeof field === 'string') {
        try {
          // Primeiro, tentar corrigir escape duplo se existir
          let cleanedData = field.trim();

          // Se começa e termina com aspas duplas, remover elas
          if (cleanedData.startsWith('"') && cleanedData.endsWith('"')) {
            cleanedData = cleanedData.slice(1, -1);
          }

          // Corrigir escape duplo de aspas ("" -> ")
          cleanedData = cleanedData.replace(/""/g, '"');

          // Corrigir escape simples também
          cleanedData = cleanedData.replace(/\\"/g, '"');

          // Remover quebras de linha desnecessárias
          cleanedData = cleanedData.replace(/\r?\n/g, '');

          // Verificar se é um JSON válido após limpeza
          const parsedData = JSON.parse(cleanedData);

          // Se conseguiu fazer parse, retornar o JSON limpo e normalizado
          return JSON.stringify(parsedData);
        } catch {
          // Se não conseguir fazer parse mesmo após limpeza, retornar string original
          return field;
        }
      }

      if (typeof field === 'object') {
        try {
          return JSON.stringify(field);
        } catch (error) {
          // Se houver erro de estrutura circular, retorna uma representação segura
          return '[Dados do QR Code não disponíveis]';
        }
      }

      return String(field);
    };

    const descricaoData = parseDescricaoField(row.DESCRICAO);

    // Log para debug: verificar se os IDs dos setores estão vindo do banco
    if (row.ID === 351 || row.ID === 350) {
      console.log('🔍 Debug mapRowToEncomenda - ID:', row.ID, {
        SETOR_ORIGEM_ID: row.SETOR_ORIGEM_ID,
        SETOR_DESTINO_ID: row.SETOR_DESTINO_ID,
        SETOR_ORIGEM_NOME: row.SETOR_ORIGEM_NOME,
        SETOR_DESTINO_NOME: row.SETOR_DESTINO_NOME
      });
    }

    return {
      id: Number(row.ID) || 0,
      numeroEncomenda: String(row.NUMERO_ENCOMENDA || ''),
      descricao: descricaoData.descricao,
      observacoes: descricaoData.observacoes,
      status: (row.STATUS as any) || 'pendente',
      dataCriacao: row.DATA_CRIACAO ? new Date(row.DATA_CRIACAO) : new Date(),
      dataAtualizacao: row.DATA_ATUALIZACAO ? new Date(row.DATA_ATUALIZACAO) : new Date(),
      // data_postagem removido
      dataEntrega: row.DATA_ENTREGA ? new Date(row.DATA_ENTREGA) : undefined as any,
      usuarioOrigemId: Number(row.USUARIO_ORIGEM_ID) || 0,
      remetente: String(row.REMETENTE_NOME || 'Usuário não encontrado'),
      destinatario: String(row.DESTINATARIO_NOME || 'Usuário não encontrado'),
      setorOrigem: String(row.SETOR_ORIGEM_NOME || 'Setor não encontrado'),
      setorDestino: String(row.SETOR_DESTINO_NOME || 'Setor não encontrado'),
      // IDs dos setores (CRÍTICO para filtro de visibilidade no frontend)
      setorOrigemId: row.SETOR_ORIGEM_ID != null ? Number(row.SETOR_ORIGEM_ID) : undefined,
      setorDestinoId: row.SETOR_DESTINO_ID != null ? Number(row.SETOR_DESTINO_ID) : undefined,
      // Dados de matrícula e vínculo do remetente e destinatário
      remetenteMatricula: row.REMETENTE_MATRICULA ? String(row.REMETENTE_MATRICULA) : null,
      remetenteVinculo: row.REMETENTE_VINCULO ? String(row.REMETENTE_VINCULO) : null,
      destinatarioMatricula: row.DESTINATARIO_MATRICULA ? String(row.DESTINATARIO_MATRICULA) : null,
      destinatarioVinculo: row.DESTINATARIO_VINCULO ? String(row.DESTINATARIO_VINCULO) : null,
      // Identificadores
      numeroMalote: row.NUMERO_MALOTE ? String(row.NUMERO_MALOTE) : undefined,
      numeroLacre: row.NUMERO_LACRE ? String(row.NUMERO_LACRE) : undefined,
      numeroAR: row.NUMERO_AR ? String(row.NUMERO_AR) : undefined,
      // Coordenadas e endereço dos setores
      setorOrigemCoordenadas: {
        latitude: row.SETOR_ORIGEM_LATITUDE != null ? Number(row.SETOR_ORIGEM_LATITUDE) : null,
        longitude: row.SETOR_ORIGEM_LONGITUDE != null ? Number(row.SETOR_ORIGEM_LONGITUDE) : null,
      },
      setorDestinoCoordenadas: {
        latitude: row.SETOR_DESTINO_LATITUDE != null ? Number(row.SETOR_DESTINO_LATITUDE) : null,
        longitude: row.SETOR_DESTINO_LONGITUDE != null ? Number(row.SETOR_DESTINO_LONGITUDE) : null,
      },
      setorOrigemEndereco: {
        logradouro: row.SETOR_ORIGEM_LOGRADOURO ? String(row.SETOR_ORIGEM_LOGRADOURO) : undefined,
        numero: row.SETOR_ORIGEM_NUMERO ? String(row.SETOR_ORIGEM_NUMERO) : undefined,
        complemento: row.SETOR_ORIGEM_COMPLEMENTO ? String(row.SETOR_ORIGEM_COMPLEMENTO) : undefined,
        bairro: row.SETOR_ORIGEM_BAIRRO ? String(row.SETOR_ORIGEM_BAIRRO) : undefined,
        cidade: row.SETOR_ORIGEM_CIDADE ? String(row.SETOR_ORIGEM_CIDADE) : undefined,
        estado: row.SETOR_ORIGEM_ESTADO ? String(row.SETOR_ORIGEM_ESTADO) : undefined,
        cep: row.SETOR_ORIGEM_CEP ? String(row.SETOR_ORIGEM_CEP) : undefined,
      },
      setorDestinoEndereco: {
        logradouro: row.SETOR_DESTINO_LOGRADOURO ? String(row.SETOR_DESTINO_LOGRADOURO) : undefined,
        numero: row.SETOR_DESTINO_NUMERO ? String(row.SETOR_DESTINO_NUMERO) : undefined,
        complemento: row.SETOR_DESTINO_COMPLEMENTO ? String(row.SETOR_DESTINO_COMPLEMENTO) : undefined,
        bairro: row.SETOR_DESTINO_BAIRRO ? String(row.SETOR_DESTINO_BAIRRO) : undefined,
        cidade: row.SETOR_DESTINO_CIDADE ? String(row.SETOR_DESTINO_CIDADE) : undefined,
        estado: row.SETOR_DESTINO_ESTADO ? String(row.SETOR_DESTINO_ESTADO) : undefined,
        cep: row.SETOR_DESTINO_CEP ? String(row.SETOR_DESTINO_CEP) : undefined,
      }
    };
  }

  /**
   * Obtém estatísticas das encomendas
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const query = `
        SELECT 
          COUNT(*) as TOTAL_ENCOMENDAS,
          SUM(CASE WHEN STATUS = 'postado' OR STATUS = 'em_transito' THEN 1 ELSE 0 END) as EM_TRANSITO,
          SUM(CASE WHEN STATUS = 'entregue' AND TRUNC(DATA_ATUALIZACAO) = TRUNC(SYSDATE) THEN 1 ELSE 0 END) as ENTREGUES_HOJE,
          SUM(CASE WHEN STATUS = 'pendente' THEN 1 ELSE 0 END) as PENDENTES,
          SUM(CASE WHEN URGENTE = 1 THEN 1 ELSE 0 END) as URGENTES
        FROM ${this.tableName}
      `;

      const result = await DatabaseService.executeQuery(query);
      const stats = result.rows?.[0] as any;

      this.sendSuccess(res, {
        data: {
          total: Number(stats?.TOTAL_ENCOMENDAS) || 0,
          emTransito: Number(stats?.EM_TRANSITO) || 0,
          entreguesHoje: Number(stats?.ENTREGUES_HOJE) || 0,
          pendentes: Number(stats?.PENDENTES) || 0,
          urgentes: Number(stats?.URGENTES) || 0
        }
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas das encomendas:', error);
      this.sendError(res, 'Erro ao obter estatísticas das encomendas', 500);
    }
  }

  /**
   * Obtém notificações de encomendas para o usuário logado
   * Retorna encomendas onde o usuário é destinatário e o status não é 'entregue'
   */
  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const query = `
        SELECT 
          e.ID,
          e.NUMERO_ENCOMENDA,
          e.DESCRICAO,
          e.STATUS,
          e.DATA_CRIACAO,
          e.URGENTE,
          ur.NOME as REMETENTE_NOME,
          ur.MATRICULA as REMETENTE_MATRICULA,
          so.NOME_SETOR as SETOR_ORIGEM_NOME
        FROM ${this.tableName} e
        LEFT JOIN USUARIOS ur ON e.USUARIO_ORIGEM_ID = ur.ID
        LEFT JOIN SETORES so ON e.SETOR_ORIGEM_ID = so.ID
        WHERE e.USUARIO_DESTINO_ID = :userId 
        AND e.STATUS != 'entregue'
        ORDER BY e.DATA_CRIACAO DESC
      `;

      const result = await DatabaseService.executeQuery(query, { userId });

      const notifications = result.rows?.map(row => ({
        id: Number(row.ID),
        numeroEncomenda: String(row.NUMERO_ENCOMENDA),
        descricao: String(row.DESCRICAO),
        status: String(row.STATUS),
        dataCriacao: row.DATA_CRIACAO,
        urgente: Number(row.URGENTE) === 1,
        remetenteNome: String(row.REMETENTE_NOME || ''),
        remetenteMatricula: String(row.REMETENTE_MATRICULA || ''),
        setorOrigemNome: String(row.SETOR_ORIGEM_NOME || '')
      })) || [];

      this.sendSuccess(res, {
        data: notifications,
        count: notifications.length
      });
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      this.sendError(res, 'Erro ao buscar notificações', 500);
    }
  }

  /**
   * Confirma o recebimento de uma encomenda
   * Altera o status para 'entregue' e define a data de entrega
   */
  async confirmReceipt(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Verificar se a encomenda existe
      const checkQuery = `SELECT ID, STATUS FROM ${this.tableName} WHERE ID = :id`;
      const checkResult = await DatabaseService.executeQuery(checkQuery, { id });

      if (!checkResult.rows || checkResult.rows.length === 0) {
        return this.sendError(res, 'Encomenda não encontrada', 404);
      }

      const encomenda = checkResult.rows[0] as any;

      if (encomenda.STATUS === 'entregue') {
        return this.sendError(res, 'Encomenda já foi confirmada como entregue', 400);
      }

      // Atualizar status para 'entregue' e definir data de entrega
      const updateQuery = `
        UPDATE ${this.tableName} SET
          STATUS = 'entregue',
          DATA_ENTREGA = SYSDATE,
          DATA_ATUALIZACAO = SYSDATE
        WHERE ID = :id
      `;

      await DatabaseService.executeQuery(updateQuery, { id });

      // Após confirmação de entrega, liberar MALOTE associado e marcar LACRE como utilizado
      try {
        const linkRes = await DatabaseService.executeQuery(
          `SELECT MALOTE_ID, LACRE_ID, SETOR_DESTINO_ID FROM ${this.tableName} WHERE ID = :id`,
          { id }
        );
        const linkRow = linkRes.rows?.[0] as any;
        const maloteId = linkRow?.MALOTE_ID ? Number(linkRow.MALOTE_ID) : null;
        const lacreId = linkRow?.LACRE_ID ? Number(linkRow.LACRE_ID) : null;
        const setorDestinoId = linkRow?.SETOR_DESTINO_ID ? Number(linkRow.SETOR_DESTINO_ID) : null;

        if (maloteId) {
          // Desvincular malote da encomenda
          // NOTA: O STATUS do malote é atualizado automaticamente pelo trigger TRG_MALOTE_SET_STATUS_ON_LINK
          // que define STATUS = 'Disponivel' ao desvincular (ENCOMENDA_ID = NULL)
          await DatabaseService.executeQuery(
            `UPDATE MALOTE SET ENCOMENDA_ID = NULL, ${setorDestinoId ? 'SETOR_DESTINO_ID = :sdid,' : ''} DATA_ATUALIZACAO = SYSDATE WHERE ID = :mid`,
            setorDestinoId ? { mid: maloteId, sdid: setorDestinoId } : { mid: maloteId }
          );
        }
        if (lacreId) {
          // Marcar lacre como utilizado e remover vínculo
          await DatabaseService.executeQuery(
            `UPDATE LACRE SET ENCOMENDA_ID = NULL, STATUS = 'utilizado', DATA_ATUALIZACAO = SYSTIMESTAMP WHERE ID = :lid`,
            { lid: lacreId }
          );
        }
      } catch (releaseErr) {
        console.warn('Aviso: falha ao liberar MALOTE/LACRE após confirmação de entrega:', releaseErr);
      }

      // Nova regra: não utilizar ENCOMENDAS_EVENTOS. Validação e histórico ficam na própria tabela ENCOMENDAS.

      this.sendSuccess(res, {
        message: 'Entrega confirmada com sucesso',
        data: { id: Number(id), status: 'entregue' }
      });

      // Notificar clientes SSE
      sse.broadcast('encomendas:update', { action: 'delivered', id });
    } catch (error) {
      console.error('Erro ao confirmar recebimento:', error);
      this.sendError(res, 'Erro ao confirmar recebimento', 500);
    }
  }
}
