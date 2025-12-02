import { Request, Response } from 'express';
import { DatabaseService } from '../config/database';
import {
  Configuracao,
  ConfiguracaoInput,
  ConfiguracaoUpdate,
  ConfiguracaoFiltros,
  ConfiguracaoOrdenacao,
  ConfiguracaoUtils,
  CATEGORIAS_CONFIG,
  TIPOS_CONFIG
} from '../models/configuracao.model';

export class ConfiguracaoController {
  constructor() {
    // Não precisa de propriedade db, usaremos DatabaseService diretamente
  }

  /**
   * Lista todas as configurações com filtros opcionais
   */
  async listar(req: Request, res: Response): Promise<void> {
    try {
      const {
        categoria,
        chave,
        ativo,
        editavel,
        obrigatoria,
        ordenarPor = 'ordemExibicao',
        direcao = 'ASC',
        pagina = 1,
        limite = 50
      } = req.query;

      let sql = `
        SELECT 
          ID,
          CATEGORIA,
          CHAVE,
          VALOR,
          TIPO,
          DESCRICAO,
          OBRIGATORIA,
          EDITAVEL,
          ORDEM_EXIBICAO,
          ATIVO,
          USUARIO_CRIACAO_ID as "usuarioCriacaoId",
          USUARIO_ALTERACAO_ID as "usuarioAlteracaoId",
          DATA_CRIACAO as "dataCriacao",
          DATA_ATUALIZACAO as "dataAtualizacao"
        FROM CONFIGURACOES 
        WHERE 1=1
      `;

      const params: any = {};
      let paramIndex = 1;

      if (categoria) {
        sql += ` AND CATEGORIA = :param${paramIndex}`;
        params[`param${paramIndex}`] = categoria;
        paramIndex++;
      }
      if (chave) {
        sql += ` AND UPPER(CHAVE) LIKE UPPER(:param${paramIndex})`;
        params[`param${paramIndex}`] = `%${chave}%`;
        paramIndex++;
      }
      if (ativo !== undefined) {
        sql += ` AND ATIVO = :param${paramIndex}`;
        const ativoStr = String(ativo);
        params[`param${paramIndex}`] = (ativoStr === 'true' || ativoStr === '1') ? 'S' : 'N';
        paramIndex++;
      }
      if (editavel !== undefined) {
        sql += ` AND EDITAVEL = :param${paramIndex}`;
        const editavelStr = String(editavel);
        params[`param${paramIndex}`] = (editavelStr === 'true' || editavelStr === '1') ? 'S' : 'N';
        paramIndex++;
      }
      if (obrigatoria !== undefined) {
        sql += ` AND OBRIGATORIA = :param${paramIndex}`;
        const obrigatoriaStr = String(obrigatoria);
        params[`param${paramIndex}`] = (obrigatoriaStr === 'true' || obrigatoriaStr === '1') ? 'S' : 'N';
        paramIndex++;
      }

      // Ordenação
      const camposValidos = ['categoria', 'chave', 'ordemExibicao', 'dataCriacao', 'dataAlteracao'];
      const campoOrdenacao = camposValidos.includes(ordenarPor as string) ? ordenarPor : 'ordemExibicao';
      const direcaoOrdenacao = direcao === 'DESC' ? 'DESC' : 'ASC';

      const campoSql = {
        'categoria': 'CATEGORIA',
        'chave': 'CHAVE',
        'ordemExibicao': 'ORDEM_EXIBICAO',
        'dataCriacao': 'DATA_CRIACAO',
        'dataAlteracao': 'DATA_ALTERACAO'
      }[campoOrdenacao as string];

      sql += ` ORDER BY ${campoSql} ${direcaoOrdenacao}`;

      // Paginação
      const offset = (Number(pagina) - 1) * Number(limite);
      sql += ` OFFSET :paginationOffset ROWS FETCH NEXT :paginationLimit ROWS ONLY`;
      params.paginationOffset = offset;
      params.paginationLimit = Number(limite);

      const result = await DatabaseService.executeQuery(sql, params);

      // Contar total de registros
      let sqlCount = `SELECT COUNT(*) as TOTAL FROM CONFIGURACOES WHERE 1=1`;
      const paramsCount: { [key: string]: any } = {};
      let paramCountIndex = 1;

      if (categoria) {
        sqlCount += ` AND CATEGORIA = :param${paramCountIndex}`;
        paramsCount[`param${paramCountIndex}`] = categoria;
        paramCountIndex++;
      }
      if (chave) {
        sqlCount += ` AND UPPER(CHAVE) LIKE UPPER(:param${paramCountIndex})`;
        paramsCount[`param${paramCountIndex}`] = `%${chave}%`;
        paramCountIndex++;
      }
      if (ativo !== undefined) {
        sqlCount += ` AND ATIVO = :param${paramCountIndex}`;
        const ativoStr = String(ativo);
        paramsCount[`param${paramCountIndex}`] = (ativoStr === 'true' || ativoStr === '1') ? 'S' : 'N';
        paramCountIndex++;
      }
      if (editavel !== undefined) {
        sqlCount += ` AND EDITAVEL = :param${paramCountIndex}`;
        const editavelStr = String(editavel);
        paramsCount[`param${paramCountIndex}`] = (editavelStr === 'true' || editavelStr === '1') ? 'S' : 'N';
        paramCountIndex++;
      }
      if (obrigatoria !== undefined) {
        sqlCount += ` AND OBRIGATORIA = :param${paramCountIndex}`;
        const obrigatoriaStr = String(obrigatoria);
        paramsCount[`param${paramCountIndex}`] = (obrigatoriaStr === 'true' || obrigatoriaStr === '1') ? 'S' : 'N';
        paramCountIndex++;
      }

      const countResult = await DatabaseService.executeQuery(sqlCount, paramsCount);
      const total = countResult.rows?.[0]?.TOTAL || 0;

      // Função auxiliar para processar valores async
      const processarValor = async (row: any): Promise<string> => {
        try {
          console.log(`Processando valor para chave ${row.CHAVE}:`, {
            valor: row.VALOR,
            tipo: typeof row.VALOR,
            isNull: row.VALOR === null,
            isUndefined: row.VALOR === undefined,
            constructor: row.VALOR?.constructor?.name
          });

          if (row.VALOR === null || row.VALOR === undefined) return '';
          if (typeof row.VALOR === 'string') return row.VALOR;
          if (typeof row.VALOR === 'number') return String(row.VALOR);
          if (typeof row.VALOR === 'boolean') return String(row.VALOR);

          // Se chegou aqui, é um objeto - vamos tentar extrair o valor
          if (row.VALOR && typeof row.VALOR === 'object') {
            // Verificar se tem propriedades comuns do Oracle
            if (row.VALOR.val !== undefined) return String(row.VALOR.val);
            if (row.VALOR.value !== undefined) return String(row.VALOR.value);
            if (row.VALOR.data !== undefined) return String(row.VALOR.data);

            // Se é um Buffer, converter para string
            if (Buffer.isBuffer(row.VALOR)) {
              return row.VALOR.toString('utf8');
            }

            // Verificar se é um CLOB do Oracle
            if (row.VALOR.constructor?.name === 'Lob' || row.VALOR._type || row.VALOR.getData) {
              try {
                // Para CLOBs, tentar obter o valor como string
                if (typeof row.VALOR.getData === 'function') {
                  const clobData = await row.VALOR.getData();
                  return clobData.toString();
                }
                // Se tem propriedade _data ou similar
                if (row.VALOR._data) {
                  return row.VALOR._data.toString();
                }
                // Fallback: converter para string
                return String(row.VALOR);
              } catch (clobError) {
                console.error(`Erro ao processar CLOB para chave ${row.CHAVE}:`, clobError);
                return '[CLOB não legível]';
              }
            }

            // Para outros objetos, tentar JSON.stringify com cuidado
            try {
              return JSON.stringify(row.VALOR, (key, value) => {
                // Evitar referências circulares
                if (typeof value === 'object' && value !== null) {
                  if (value.constructor?.name === 'Lob' || key.includes('Connection') || key.includes('_locator')) {
                    return '[Objeto Oracle]';
                  }
                }
                return value;
              });
            } catch (jsonError) {
              console.error(`Erro ao processar valor para chave ${row.CHAVE}:`, jsonError);
              return '[Objeto não serializável]';
            }
          }

          return String(row.VALOR);
        } catch (e) {
          console.error(`Erro ao processar valor para chave ${row.CHAVE}:`, e);
          return String(row.VALOR || '');
        }
      };

      const configuracoes: Configuracao[] = result.rows ? await Promise.all(result.rows.map(async (row: any) => ({
        id: Number(row.ID),
        categoria: String(row.CATEGORIA || ''),
        chave: String(row.CHAVE || ''),
        valor: await processarValor(row),
        tipo: String(row.TIPO || 'string') as 'string' | 'number' | 'boolean' | 'json' | 'date',
        descricao: String(row.DESCRICAO || ''),
        obrigatoria: row.OBRIGATORIA === 'S' || row.OBRIGATORIA === 1,
        editavel: row.EDITAVEL === 'S' || row.EDITAVEL === 1,
        ordemExibicao: Number(row.ORDEM_EXIBICAO || 0),
        usuarioCriacaoId: row.USUARIO_CRIACAO_ID ? Number(row.USUARIO_CRIACAO_ID) : null,
        usuarioAlteracaoId: row.USUARIO_ALTERACAO_ID ? Number(row.USUARIO_ALTERACAO_ID) : null,
        dataCriacao: row.DATA_CRIACAO ? new Date(row.DATA_CRIACAO) : null,
        dataAlteracao: row.DATA_ATUALIZACAO ? new Date(row.DATA_ATUALIZACAO) : null,
        ativo: row.ATIVO === 'S' || row.ATIVO === 1
      }))) : [];

      res.json({
        success: true,
        data: configuracoes,
        total,
        pagina: Number(pagina),
        limite: Number(limite),
        totalPaginas: Math.ceil(total / Number(limite))
      });

    } catch (error) {
      console.error('Erro ao listar configurações:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao listar configurações'
      });
    }
  }

  /**
   * Busca configuração por ID
   */
  async buscarPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Converter ID para número
      const configId = parseInt(id, 10);
      if (isNaN(configId)) {
        res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
        return;
      }

      const sql = `
        SELECT 
          ID, CATEGORIA, CHAVE, VALOR, TIPO, DESCRICAO,
          OBRIGATORIA, EDITAVEL, ORDEM_EXIBICAO,
          USUARIO_CRIACAO_ID, USUARIO_ALTERACAO_ID,
          DATA_CRIACAO, DATA_ALTERACAO, ATIVO
        FROM CONFIGURACOES
        WHERE ID = :1 AND ATIVO = 'S'
      `;

      const result = await DatabaseService.executeQuery(sql, [configId]);

      if (!result.rows || result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Configuração não encontrada'
        });
        return;
      }

      const row = result.rows[0];
      const configuracao: Configuracao = {
        id: row.ID,
        categoria: row.CATEGORIA,
        chave: row.CHAVE,
        valor: row.VALOR,
        tipo: row.TIPO,
        descricao: row.DESCRICAO,
        obrigatoria: row.OBRIGATORIA === 'S',
        editavel: row.EDITAVEL === 'S',
        ordemExibicao: row.ORDEM_EXIBICAO,
        usuarioCriacaoId: row.USUARIO_CRIACAO_ID,
        usuarioAlteracaoId: row.USUARIO_ALTERACAO_ID,
        dataCriacao: row.DATA_CRIACAO,
        dataAlteracao: row.DATA_ALTERACAO,
        ativo: row.ATIVO === 'S'
      };

      res.json({
        success: true,
        data: configuracao
      });

    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar configuração'
      });
    }
  }

  /**
   * Busca configuração por categoria e chave
   */
  async buscarPorChave(req: Request, res: Response): Promise<void> {
    try {
      const { categoria, chave } = req.params;

      const sql = `
        SELECT VALOR, TIPO
        FROM CONFIGURACOES
        WHERE UPPER(CATEGORIA) = UPPER(:1) AND CHAVE = :2 AND ATIVO = 'S'
      `;

      const result = await DatabaseService.executeQuery(sql, [categoria, chave]);

      if (!result.rows || result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Configuração não encontrada'
        });
        return;
      }

      const row = result.rows[0];
      const valorConvertido = ConfiguracaoUtils.parseValue(row.VALOR, row.TIPO);

      res.json({
        success: true,
        data: {
          categoria,
          chave,
          valor: valorConvertido,
          tipo: row.TIPO
        }
      });

    } catch (error) {
      console.error('Erro ao buscar configuração por chave:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar configuração'
      });
    }
  }

  /**
   * Cria nova configuração
   */
  async criar(req: Request, res: Response): Promise<void> {
    try {
      const dados: ConfiguracaoInput = req.body;
      const usuarioId = (req as any).user?.id || 1; // TODO: pegar do token JWT

      // Validações
      if (!dados.categoria || !dados.chave || dados.valor === undefined) {
        res.status(400).json({
          success: false,
          message: 'Categoria, chave e valor são obrigatórios'
        });
        return;
      }

      // Verificar se já existe
      const sqlExiste = `
        SELECT COUNT(*) as TOTAL
        FROM CONFIGURACOES
        WHERE CATEGORIA = :1 AND CHAVE = :2
      `;

      const existeResult = await DatabaseService.executeQuery(sqlExiste, [dados.categoria, dados.chave]);

      if (existeResult.rows?.[0]?.TOTAL > 0) {
        res.status(409).json({
          success: false,
          message: 'Já existe uma configuração com esta categoria e chave'
        });
        return;
      }

      // Validar tipo do valor
      const tipo = dados.tipo || 'string';
      if (!ConfiguracaoUtils.validateValue(dados.valor, tipo)) {
        res.status(400).json({
          success: false,
          message: `Valor inválido para o tipo ${tipo}`
        });
        return;
      }

      const sql = `
        INSERT INTO CONFIGURACOES (
          CATEGORIA, CHAVE, VALOR, TIPO, DESCRICAO,
          OBRIGATORIA, EDITAVEL, ORDEM_EXIBICAO,
          USUARIO_CRIACAO_ID, DATA_CRIACAO, ATIVO
        ) VALUES (
          :1, :2, :3, :4, :5, :6, :7, :8, :9, SYSDATE, 'S'
        )
      `;

      const valorString = ConfiguracaoUtils.stringifyValue(dados.valor, tipo);

      await DatabaseService.executeQuery(sql, [
        dados.categoria,
        dados.chave,
        valorString,
        tipo,
        dados.descricao || null,
        dados.obrigatoria ? 'S' : 'N',
        dados.editavel !== false ? 'S' : 'N',
        dados.ordemExibicao || 0,
        usuarioId
      ]);

      res.status(201).json({
        success: true,
        message: 'Configuração criada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao criar configuração:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao criar configuração'
      });
    }
  }

  /**
   * Atualiza configuração existente
   */
  async atualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dados: ConfiguracaoUpdate = req.body;
      const usuarioId = (req as any).user?.id || 1; // TODO: pegar do token JWT

      // Converter ID para número
      const configId = parseInt(id, 10);
      if (isNaN(configId)) {
        res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
        return;
      }

      // Verificar se existe e é editável
      const sqlVerifica = `
        SELECT EDITAVEL, TIPO
        FROM CONFIGURACOES
        WHERE ID = :1 AND ATIVO = 'S'
      `;

      const verificaResult = await DatabaseService.executeQuery(sqlVerifica, [configId]);

      if (!verificaResult.rows || verificaResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Configuração não encontrada'
        });
        return;
      }

      const config = verificaResult.rows[0];
      if (config.EDITAVEL === 'N') {
        res.status(403).json({
          success: false,
          message: 'Esta configuração não pode ser editada'
        });
        return;
      }

      // Validar valor se fornecido
      if (dados.valor !== undefined) {
        if (!ConfiguracaoUtils.validateValue(dados.valor, config.TIPO)) {
          res.status(400).json({
            success: false,
            message: `Valor inválido para o tipo ${config.TIPO}`
          });
          return;
        }
      }

      // Construir SQL de atualização dinamicamente
      const campos: string[] = [];
      const valores: any[] = [];
      let paramIndex = 1;

      if (dados.valor !== undefined) {
        campos.push(`VALOR = :${paramIndex}`);
        valores.push(ConfiguracaoUtils.stringifyValue(dados.valor, config.TIPO));
        paramIndex++;
      }

      if (dados.descricao !== undefined) {
        campos.push(`DESCRICAO = :${paramIndex}`);
        valores.push(dados.descricao);
        paramIndex++;
      }

      if (dados.editavel !== undefined) {
        campos.push(`EDITAVEL = :${paramIndex}`);
        valores.push(dados.editavel ? 'S' : 'N');
        paramIndex++;
      }

      if (dados.ordemExibicao !== undefined) {
        campos.push(`ORDEM_EXIBICAO = :${paramIndex}`);
        valores.push(dados.ordemExibicao);
        paramIndex++;
      }

      if (dados.ativo !== undefined) {
        campos.push(`ATIVO = :${paramIndex}`);
        valores.push(dados.ativo ? 'S' : 'N');
        paramIndex++;
      }

      if (campos.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Nenhum campo para atualizar foi fornecido'
        });
        return;
      }

      campos.push(`USUARIO_ALTERACAO_ID = :${paramIndex}`);
      valores.push(usuarioId);
      paramIndex++;

      campos.push(`DATA_ATUALIZACAO = SYSDATE`);

      valores.push(configId); // WHERE ID = :last

      const sql = `
        UPDATE CONFIGURACOES
        SET ${campos.join(', ')}
        WHERE ID = :${paramIndex}
      `;

      await DatabaseService.executeQuery(sql, valores);

      res.json({
        success: true,
        message: 'Configuração atualizada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao atualizar configuração'
      });
    }
  }

  /**
   * Remove configuração (soft delete)
   */
  async remover(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const usuarioId = (req as any).user?.id || 1; // TODO: pegar do token JWT

      // Converter ID para número
      const configId = parseInt(id, 10);
      if (isNaN(configId)) {
        res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
        return;
      }

      // Verificar se existe e não é obrigatória
      const sqlVerifica = `
        SELECT OBRIGATORIA
        FROM CONFIGURACOES
        WHERE ID = :1 AND ATIVO = 'S'
      `;

      const verificaResult = await DatabaseService.executeQuery(sqlVerifica, [configId]);

      if (!verificaResult.rows || verificaResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Configuração não encontrada'
        });
        return;
      }

      const config = verificaResult.rows[0];
      if (config.OBRIGATORIA === 'S') {
        res.status(403).json({
          success: false,
          message: 'Configurações obrigatórias não podem ser removidas'
        });
        return;
      }

      const sql = `
        UPDATE CONFIGURACOES
        SET ATIVO = 'N',
            USUARIO_ALTERACAO_ID = :1,
            DATA_ALTERACAO = SYSDATE
        WHERE ID = :2
      `;

      await DatabaseService.executeQuery(sql, [usuarioId, configId]);

      res.json({
        success: true,
        message: 'Configuração removida com sucesso'
      });

    } catch (error) {
      console.error('Erro ao remover configuração:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao remover configuração'
      });
    }
  }

  /**
   * Lista categorias disponíveis
   */
  async listarCategorias(req: Request, res: Response): Promise<void> {
    try {
      const sql = `
        SELECT DISTINCT CATEGORIA
        FROM CONFIGURACOES
        WHERE ATIVO = 'S'
        ORDER BY CATEGORIA
      `;

      const result = await DatabaseService.executeQuery(sql);
      const categorias = result.rows?.map((row: any) => row.CATEGORIA) || [];

      res.json({
        success: true,
        data: categorias
      });

    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao listar categorias'
      });
    }
  }

  /**
   * Atualiza múltiplas configurações de uma vez (batch update)
   */
  async atualizarMultiplas(req: Request, res: Response): Promise<void> {
    try {
      const { configuracoes } = req.body;
      const usuarioId = (req as any).user?.id || 1; // TODO: pegar do token JWT

      if (!Array.isArray(configuracoes) || configuracoes.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Array de configurações é obrigatório'
        });
        return;
      }

      const resultados = [];
      const erros = [];

      // Processar cada configuração
      for (const config of configuracoes) {
        try {
          const { categoria, chave, valor } = config;
          // Normalizar tipo informado (se houver) para o padrão do modelo
          const tipoInformado = (config.tipo ? String(config.tipo) : 'string').toLowerCase();

          if (!categoria || !chave) {
            erros.push({
              categoria,
              chave,
              erro: 'Categoria e chave são obrigatórias'
            });
            continue;
          }

          // Verificar se a configuração existe
          const sqlVerifica = `
            SELECT ID, TIPO, EDITAVEL
            FROM CONFIGURACOES
            WHERE CATEGORIA = :1 AND CHAVE = :2 AND ATIVO = 'S'
          `;

          const verificaResult = await DatabaseService.executeQuery(sqlVerifica, [categoria, chave]);

          if (!verificaResult.rows || verificaResult.rows.length === 0) {
            // Criar nova configuração se não existir
            const sqlCriar = `
              INSERT INTO CONFIGURACOES (
                CATEGORIA, CHAVE, VALOR, TIPO, DESCRICAO,
                OBRIGATORIA, EDITAVEL, ORDEM_EXIBICAO,
                USUARIO_CRIACAO_ID, DATA_CRIACAO, ATIVO
              ) VALUES (
                :1, :2, :3, :4, :5, :6, :7, :8, :9, SYSDATE, 'S'
              )
            `;

            await DatabaseService.executeQuery(sqlCriar, [
              categoria,
              chave,
              ConfiguracaoUtils.stringifyValue(valor, tipoInformado as any),
              tipoInformado,
              `Configuração ${chave} da aba ${categoria}`,
              'N', // OBRIGATORIA
              'S', // EDITAVEL
              999, // ORDEM_EXIBICAO
              usuarioId
            ]);

            resultados.push({
              categoria,
              chave,
              acao: 'criada',
              valor
            });
          } else {
            const configExistente = verificaResult.rows[0];
            const tipoExistente = String(configExistente.TIPO || 'string').toLowerCase();
            // Garantir que o valor de EDITAVEL esteja consistente com o check constraint
            const editavelSN = (() => {
              const v = configExistente.EDITAVEL;
              if (v === 'S' || v === 'N') return v;
              if (v === 1 || v === '1') return 'S';
              if (v === 0 || v === '0') return 'N';
              // Caso indecifrável, assumir 'S' para permitir atualização
              return 'S';
            })();

            if (configExistente.EDITAVEL === 'N') {
              erros.push({
                categoria,
                chave,
                erro: 'Configuração não é editável'
              });
              continue;
            }

            // Validar valor
            if (!ConfiguracaoUtils.validateValue(valor, tipoExistente as any)) {
              erros.push({
                categoria,
                chave,
                erro: `Valor inválido para o tipo ${tipoExistente}`
              });
              continue;
            }

            // Atualizar configuração existente
            const sqlAtualizar = `
              UPDATE CONFIGURACOES
              SET VALOR = :1,
                  EDITAVEL = :2,
                  USUARIO_ALTERACAO_ID = :3,
                  DATA_ATUALIZACAO = SYSDATE
              WHERE ID = :4
            `;

            await DatabaseService.executeQuery(sqlAtualizar, [
              ConfiguracaoUtils.stringifyValue(valor, tipoExistente as any),
              editavelSN,
              usuarioId,
              configExistente.ID
            ]);

            resultados.push({
              categoria,
              chave,
              acao: 'atualizada',
              valor
            });
          }
        } catch (error) {
          console.error(`Erro ao processar configuração ${config.categoria}/${config.chave}:`, error);
          erros.push({
            categoria: config.categoria,
            chave: config.chave,
            erro: (error as Error).message
          });
        }
      }

      res.json({
        success: erros.length === 0,
        message: erros.length === 0
          ? 'Todas as configurações foram processadas com sucesso'
          : `${resultados.length} configurações processadas, ${erros.length} com erro`,
        data: {
          processadas: resultados.length,
          totalErros: erros.length,
          resultados,
          detalhesErros: erros
        }
      });

    } catch (error) {
      console.error('Erro ao atualizar múltiplas configurações:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao atualizar configurações'
      });
    }
  }
}
