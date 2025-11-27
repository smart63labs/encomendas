import { BaseModel, SearchFilters, PaginationOptions, PaginatedResult } from './base.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { DatabaseService, OracleUtils } from '../config/database';
import crypto from 'crypto';
import { getDefaultPasswordForRole } from '../config/default-passwords';

/**
 * Interface para dados do usuário - Estrutura conforme tabela USUARIOS
 */
export interface IUser {
  // Estrutura exata da tabela USUARIOS na ordem especificada
  id?: number;
  setor_id?: number;
  role?: string;
  senha?: string;
  usuario_ativo?: number;
  ultimo_login?: Date;
  tentativas_login?: number;
  data_criacao?: Date;
  data_atualizacao?: Date;
  bloqueado_ate?: Date;
  nome: string;
  matricula?: string;
  vinculo_funcional?: string;
  cpf?: string;
  'pis/pasep'?: string;
  sexo?: string;
  estado_civil?: string;
  data_nascimento?: Date;
  pai?: string;
  mae?: string;
  rg?: string;
  tipo_rg?: string;
  orgao_expeditor?: string;
  uf_rg?: string;
  expedicao_rg?: Date;
  cidade_nascimento?: string;
  uf_nascimento?: string;
  tipo_sanguineo?: string;
  raca_cor?: string;
  pne?: number;
  tipo_vinculo?: string;
  categoria?: string;
  regime_juridico?: string;
  regime_previdenciario?: string;
  evento_tipo?: string;
  forma_provimento?: string;
  codigo_cargo?: string;
  cargo?: string;
  escolaridade_cargo?: string;
  escolaridade_servidor?: string;
  formacao_profissional_1?: string;
  formacao_profissional_2?: string;
  jornada?: string;
  nivel_referencia?: string;
  'comissao_funçao'?: string;
  data_ini_comissao?: Date;
  telefone?: string;
  endereco?: string;
  numero_endereco?: string;
  complemento_endereco?: string;
  bairro_endereco?: string;
  cidade_endereco?: string;
  uf_endereco?: string;
  cep_endereco?: string;
  e_mail: string;
  // Campos legados para compatibilidade (mantidos para não quebrar código existente)
  email?: string;
  departamento?: string;
  numero_funcional?: number;
  orgao?: string;
  setor?: string;
  lotacao?: string;
  hierarquia_setor?: string;
  municipio_lotacao?: string;
  codigo_setor?: string;
  logradouro?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone_setor?: string;
  email_setor?: string;
  ativo?: boolean;
  created_at?: Date;
  updated_at?: Date;
  // Campos específicos do Oracle (mantidos para compatibilidade)
  is_active?: number;
  last_login?: Date;
  // Indica se a senha padrão foi alterada
  senha_alterada?: string; // 'S' ou 'N'
}

/**
 * Interface para login
 */
export interface ILoginCredentials {
  cpf: string;
  senha: string;
}

/**
 * Interface para resposta de autenticação
 */
export interface IAuthResponse {
  user: Omit<IUser, 'senha'>;
  token: string;
  refreshToken: string;
  expiresIn: number;
  isDefaultPassword?: boolean;
}

/**
 * Interface para filtros de usuário
 */
export interface IUserFilters extends SearchFilters {
  nome?: string;
  email?: string;
  cargo?: string;
  departamento?: string;
  setor_id?: number;
  orgao?: string;
  setor?: string;
  lotacao?: string;
  hierarquia_setor?: string;
  municipio_lotacao?: string;
  codigo_setor?: string;
  ativo?: boolean;
}

/**
 * Modelo de Usuário
 * Gerencia autenticação, autorização e dados dos usuários
 */
export class UserModel extends BaseModel {
  protected static override tableName = 'USUARIOS';
  protected static override primaryKey = 'id';
  protected static override fillable = [
    // Campos da nova estrutura da tabela USUARIOS
    'nome', 'e_mail', 'senha', 'setor_id', 'role', 'usuario_ativo',
    'matricula', 'vinculo_funcional', 'cpf', 'pis/pasep', 'sexo', 'estado_civil',
    'data_nascimento', 'pai', 'mae', 'rg', 'tipo_rg', 'orgao_expeditor', 'uf_rg',
    'expedicao_rg', 'cidade_nascimento', 'uf_nascimento', 'tipo_sanguineo', 'raca_cor',
    'pne', 'tipo_vinculo', 'categoria', 'regime_juridico', 'regime_previdenciario',
    'evento_tipo', 'forma_provimento', 'codigo_cargo', 'cargo', 'escolaridade_cargo',
    'escolaridade_servidor', 'formacao_profissional_1', 'formacao_profissional_2',
    'jornada', 'nivel_referencia', 'comissao_funçao', 'data_ini_comissao',
    'telefone', 'endereco', 'numero_endereco', 'complemento_endereco',
    'bairro_endereco', 'cidade_endereco', 'uf_endereco', 'cep_endereco',
    // Campos legados para compatibilidade
    'email', 'ativo', 'departamento', 'numero_funcional'
  ];
  protected static override hidden = [];
  // Desabilita timestamps automáticos (updated_at/created_at) para evitar erro ORA-00904
  // A tabela USUARIOS utiliza campos como DATA_ATUALIZACAO e DATA_CRIACAO
  protected static override timestamps = false;

  // Configurações de segurança
  private static readonly SALT_ROUNDS = 10;
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_TIME = 30 * 60 * 1000; // 30 minutos
  private static readonly JWT_EXPIRES_IN = '24h';
  private static readonly REFRESH_TOKEN_EXPIRES_IN = '7d';

  /**
   * Processar resultado único - mapear campos do Oracle para o formato esperado
   */
  protected static override processResult(row: any): any {
    if (!row) return null;

    // Converter para camelCase primeiro
    const processed = OracleUtils.toCamelCase(row);

    // Mapear campos considerando a nova estrutura da tabela USUARIOS
    const mapped: any = {
      // Campos obrigatórios da tabela
      id: processed.id || row.ID,
      nome: processed.nome || row.NOME,
      e_mail: processed.eMail || row.E_MAIL,
      
      // Campos opcionais da nova estrutura
      setor_id: processed.setorId || row.SETOR_ID,
      role: processed.role || row.ROLE,
      senha: '', // Campo vazio para edição no frontend (não o hash)
      usuario_ativo: processed.usuarioAtivo || row.USUARIO_ATIVO,
      ultimo_login: processed.ultimoLogin || row.ULTIMO_LOGIN,
      tentativas_login: processed.tentativasLogin || row.TENTATIVAS_LOGIN,
      data_criacao: processed.dataCriacao || row.DATA_CRIACAO,
      data_atualizacao: processed.dataAtualizacao || row.DATA_ATUALIZACAO,
      bloqueado_ate: processed.bloqueadoAte || row.BLOQUEADO_ATE,
      matricula: processed.matricula || row.MATRICULA,
      vinculo_funcional: processed.vinculoFuncional || row.VINCULO_FUNCIONAL,
      cpf: processed.cpf || row.CPF,
      'pis/pasep': processed.pisPasep || row['PIS/PASEP'],
      sexo: processed.sexo || row.SEXO,
      estado_civil: processed.estadoCivil || row.ESTADO_CIVIL,
      data_nascimento: processed.dataNascimento || row.DATA_NASCIMENTO,
      pai: processed.pai || row.PAI,
      mae: processed.mae || row.MAE,
      rg: processed.rg || row.RG,
      tipo_rg: processed.tipoRg || row.TIPO_RG,
      orgao_expeditor: processed.orgaoExpeditor || row.ORGAO_EXPEDITOR,
      uf_rg: processed.ufRg || row.UF_RG,
      expedicao_rg: processed.expedicaoRg || row.EXPEDICAO_RG,
      cidade_nascimento: processed.cidadeNascimento || row.CIDADE_NASCIMENTO,
      uf_nascimento: processed.ufNascimento || row.UF_NASCIMENTO,
      tipo_sanguineo: processed.tipoSanguineo || row.TIPO_SANGUINEO,
      raca_cor: processed.racaCor || row.RACA_COR,
      pne: processed.pne || row.PNE,
      tipo_vinculo: processed.tipoVinculo || row.TIPO_VINCULO,
      categoria: processed.categoria || row.CATEGORIA,
      regime_juridico: processed.regimeJuridico || row.REGIME_JURIDICO,
      regime_previdenciario: processed.regimePrevidenciario || row.REGIME_PREVIDENCIARIO,
      evento_tipo: processed.eventoTipo || row.EVENTO_TIPO,
      forma_provimento: processed.formaProvimento || row.FORMA_PROVIMENTO,
      codigo_cargo: processed.codigoCargo || row.CODIGO_CARGO,
      cargo: processed.cargo || row.CARGO,
      escolaridade_cargo: processed.escolaridadeCargo || row.ESCOLARIDADE_CARGO,
      escolaridade_servidor: processed.escolaridadeServidor || row.ESCOLARIDADE_SERVIDOR,
      formacao_profissional_1: processed.formacaoProfissional1 || row.FORMACAO_PROFISSIONAL_1,
      formacao_profissional_2: processed.formacaoProfissional2 || row.FORMACAO_PROFISSIONAL_2,
      jornada: processed.jornada || row.JORNADA,
      nivel_referencia: processed.nivelReferencia || row.NIVEL_REFERENCIA,
      'comissao_funçao': processed.comissaoFuncao || row['COMISSAO_FUNÇAO'],
      data_ini_comissao: processed.dataIniComissao || row.DATA_INI_COMISSAO,
      telefone: processed.telefone || row.TELEFONE,
      endereco: processed.endereco || row.ENDERECO,
      numero_endereco: processed.numeroEndereco || row.NUMERO_ENDERECO,
      complemento_endereco: processed.complementoEndereco || row.COMPLEMENTO_ENDERECO,
      bairro_endereco: processed.bairroEndereco || row.BAIRRO_ENDERECO,
      cidade_endereco: processed.cidadeEndereco || row.CIDADE_ENDERECO,
      uf_endereco: processed.ufEndereco || row.UF_ENDERECO,
      cep_endereco: processed.cepEndereco || row.CEP_ENDERECO,
      
      // Campos de compatibilidade com frontend (mantidos para não quebrar código existente)
      name: processed.nome || row.NOME,
      email: processed.eMail || row.E_MAIL || processed.email || row.EMAIL,
      phone: processed.telefone || row.TELEFONE,
      // Determinar atividade do usuário aceitando múltiplas convenções de coluna/valor
      // Suporta USUARIO_ATIVO, IS_ACTIVE, ATIVO e valores como 1, '1', 'S', 'Y', true
      isActive: (() => {
        const toActiveBoolean = (val: any): boolean => {
          if (val === undefined || val === null) return false;
          if (typeof val === 'number') return val === 1;
          if (typeof val === 'boolean') return val;
          if (typeof val === 'string') {
            const v = val.trim().toUpperCase();
            return v === '1' || v === 'S' || v === 'Y' || v === 'TRUE' || v === 'T';
          }
          return false;
        };
        const activeRaw = (
          (processed as any).usuarioAtivo ?? row.USUARIO_ATIVO ?? row.IS_ACTIVE ?? row.ATIVO ??
          (processed as any).isActive ?? (processed as any).ativo
        );
        return toActiveBoolean(activeRaw);
      })(),
      ativo: (() => {
        const toActiveBoolean = (val: any): boolean => {
          if (val === undefined || val === null) return false;
          if (typeof val === 'number') return val === 1;
          if (typeof val === 'boolean') return val;
          if (typeof val === 'string') {
            const v = val.trim().toUpperCase();
            return v === '1' || v === 'S' || v === 'Y' || v === 'TRUE' || v === 'T';
          }
          return false;
        };
        const activeRaw = (
          (processed as any).usuarioAtivo ?? row.USUARIO_ATIVO ?? row.IS_ACTIVE ?? row.ATIVO ??
          (processed as any).isActive ?? (processed as any).ativo
        );
        return toActiveBoolean(activeRaw);
      })(),
      perfil: processed.role || row.ROLE,
      status: (processed.usuarioAtivo === 1 || row.USUARIO_ATIVO === 1 || row.IS_ACTIVE === 1 || row.ATIVO === 1) ? 'Ativo' : 'Inativo',
      lastLogin: processed.ultimoLogin || row.ULTIMO_LOGIN || row.LAST_LOGIN,
      createdAt: processed.dataCriacao || row.DATA_CRIACAO || processed.createdAt || row.CREATED_AT,
      updatedAt: processed.dataAtualizacao || row.DATA_ATUALIZACAO || processed.updatedAt || row.UPDATED_AT,
      
      // Campos de setor (se incluídos na consulta)
      setor: processed.setor || row.SETOR,
      orgao: processed.orgao || row.ORGAO,
      logradouro: processed.logradouro || row.LOGRADOURO,
      numero: processed.numero || row.NUMERO,
      complemento: processed.complemento || row.COMPLEMENTO,
      bairro: processed.bairro || row.BAIRRO,
      cidade: processed.cidade || row.CIDADE,
      estado: processed.estado || row.ESTADO,
      cep: processed.cep || row.CEP,
      
      // Campos em maiúsculo para compatibilidade com frontend
      NOME: processed.nome || row.NOME,
      E_MAIL: processed.eMail || row.E_MAIL,
      SETOR_ID: processed.setorId || row.SETOR_ID,
      ROLE: processed.role || row.ROLE,
      USUARIO_ATIVO: (processed as any).usuarioAtivo ?? row.USUARIO_ATIVO ?? row.IS_ACTIVE ?? row.ATIVO,
      ULTIMO_LOGIN: processed.ultimoLogin || row.ULTIMO_LOGIN || row.LAST_LOGIN,
      MATRICULA: processed.matricula || row.MATRICULA,
      VINCULO_FUNCIONAL: processed.vinculoFuncional || row.VINCULO_FUNCIONAL,
      CPF: processed.cpf || row.CPF,
      TELEFONE: processed.telefone || row.TELEFONE,
      CARGO: processed.cargo || row.CARGO,
      SETOR: processed.setor || row.SETOR,
      ORGAO: processed.orgao || row.ORGAO
    };

    // Remover campos undefined
    Object.keys(mapped).forEach(key => {
      if (mapped[key] === undefined) {
        delete mapped[key];
      }
    });

    // Remover campos hidden
    this.hidden.forEach(field => {
      delete mapped[field];
    });

    return mapped;
  }

  /**
   * Buscar usuários com filtros específicos
   */
  static async findUsers(
    filters: IUserFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IUser>> {
    return await this.findUsersWithSetor(filters, pagination);
  }

  /**
   * Buscar usuários com informações do setor (JOIN)
   */
  static async findUsersWithSetor(
    filters: IUserFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IUser>> {
    const { page = 1, limit = 10, orderBy = undefined, orderDirection = 'DESC' } = pagination;
    const offset = (page - 1) * (limit || 0);

    // Detectar colunas disponíveis dinamicamente (USUÁRIOS e SETORES) para evitar ORA-00904
    const usuariosColsResult = await DatabaseService.executeQuery(
      `SELECT COLUMN_NAME FROM USER_TAB_COLUMNS WHERE TABLE_NAME = 'USUARIOS'
       AND COLUMN_NAME IN (
         'ID','NOME','NAME','E_MAIL','EMAIL','CPF','TELEFONE','PHONE','CARGO','ROLE','DEPARTAMENTO','DEPARTMENT',
         'NUMERO_FUNCIONAL','MATRICULA','VINCULO_FUNCIONAL','USUARIO_ATIVO','IS_ACTIVE','ATIVO',
         'DATA_CRIACAO','CREATED_AT','DATA_ATUALIZACAO','UPDATED_AT','ULTIMO_LOGIN','LAST_LOGIN','SETOR_ID','ORGAO'
       )`
    );
    const setoresColsResult = await DatabaseService.executeQuery(
      `SELECT COLUMN_NAME FROM USER_TAB_COLUMNS WHERE TABLE_NAME = 'SETORES'
       AND COLUMN_NAME IN ('ID','NOME_SETOR','NOME','NAME','ORGAO','LOGRADOURO','NUMERO','COMPLEMENTO','BAIRRO','CIDADE','ESTADO','CEP')`
    );
    const uCols = new Set<string>((usuariosColsResult.rows || []).map((r: any) => r.COLUMN_NAME));
    const sCols = new Set<string>((setoresColsResult.rows || []).map((r: any) => r.COLUMN_NAME));

    // Mapeamentos de colunas com sinônimos
    const col = {
      id: 'u.ID',
      nome: uCols.has('NAME') ? 'u.NAME' : (uCols.has('NOME') ? 'u.NOME' : 'u.ID'),
      email: uCols.has('E_MAIL') ? 'u.E_MAIL' : (uCols.has('EMAIL') ? 'u.EMAIL' : 'NULL'),
      cpf: uCols.has('CPF') ? 'u.CPF' : 'NULL',
      telefone: uCols.has('PHONE') ? 'u.PHONE' : (uCols.has('TELEFONE') ? 'u.TELEFONE' : 'NULL'),
      cargo: uCols.has('ROLE') ? 'u.ROLE' : (uCols.has('CARGO') ? 'u.CARGO' : 'NULL'),
      departamento: sCols.has('NOME_SETOR') ? 's.NOME_SETOR' : (sCols.has('DEPARTAMENTO') ? 's.DEPARTAMENTO' : 'NULL'),
      numeroFuncional: uCols.has('NUMERO_FUNCIONAL') ? 'u.NUMERO_FUNCIONAL' : (uCols.has('MATRICULA') ? 'u.MATRICULA' : 'NULL'),
      vinculoFuncional: uCols.has('VINCULO_FUNCIONAL') ? 'u.VINCULO_FUNCIONAL' : 'NULL',
      ativo: uCols.has('USUARIO_ATIVO') ? 'u.USUARIO_ATIVO' : (uCols.has('IS_ACTIVE') ? 'u.IS_ACTIVE' : (uCols.has('ATIVO') ? 'u.ATIVO' : 'NULL')),
      // As datas podem estar vazias, construir expressões com fallback dinâmico
      // createdAtExpr prioriza DATA_CRIACAO/CREATED_AT e cai para DATA_ATUALIZACAO/UPDATED_AT/ULTIMO_LOGIN/LAST_LOGIN
      createdAtExpr: (() => {
        const parts: string[] = [];
        if (uCols.has('DATA_CRIACAO')) parts.push('u.DATA_CRIACAO');
        if (uCols.has('CREATED_AT')) parts.push('u.CREATED_AT');
        if (uCols.has('DATA_ATUALIZACAO')) parts.push('u.DATA_ATUALIZACAO');
        if (uCols.has('UPDATED_AT')) parts.push('u.UPDATED_AT');
        if (uCols.has('ULTIMO_LOGIN')) parts.push('u.ULTIMO_LOGIN');
        if (uCols.has('LAST_LOGIN')) parts.push('u.LAST_LOGIN');
        return parts.length ? `COALESCE(${parts.join(', ')})` : 'NULL';
      })(),
      updatedAtExpr: (() => {
        const parts: string[] = [];
        if (uCols.has('DATA_ATUALIZACAO')) parts.push('u.DATA_ATUALIZACAO');
        if (uCols.has('UPDATED_AT')) parts.push('u.UPDATED_AT');
        if (uCols.has('ULTIMO_LOGIN')) parts.push('u.ULTIMO_LOGIN');
        if (uCols.has('LAST_LOGIN')) parts.push('u.LAST_LOGIN');
        return parts.length ? `COALESCE(${parts.join(', ')})` : 'NULL';
      })(),
      ultimoLogin: uCols.has('ULTIMO_LOGIN') ? 'u.ULTIMO_LOGIN' : (uCols.has('LAST_LOGIN') ? 'u.LAST_LOGIN' : 'NULL'),
      setorId: uCols.has('SETOR_ID') ? 'u.SETOR_ID' : 'NULL',
      orgao: sCols.has('ORGAO') ? 's.ORGAO' : 'NULL',
      setorNome: sCols.has('NOME_SETOR') ? 's.NOME_SETOR' : (sCols.has('NAME') ? 's.NAME' : (sCols.has('NOME') ? 's.NOME' : 'NULL')),
    } as const;

    // Selecionar colunas com aliases estáveis esperados pelo frontend
    const selectCols: string[] = [
      `${col.id} AS ID`,
      `${col.nome} AS NOME`,
      `${col.email} AS EMAIL`,
      `${col.cpf} AS CPF`,
      `${col.telefone} AS TELEFONE`,
      `${col.cargo} AS CARGO`,
      `${col.cargo} AS ROLE`, // Adicionar ROLE explicitamente para o campo perfil
      `${col.orgao} AS ORGAO`,
      `${col.setorId} AS SETOR_ID`,
      `${col.numeroFuncional} AS MATRICULA`, // MATRICULA é o campo correto no banco
      `${col.vinculoFuncional} AS VINCULO_FUNCIONAL`,
      `${col.ativo} AS ATIVO`,
      `${col.createdAtExpr} AS CREATED_AT`,
      `${col.updatedAtExpr} AS UPDATED_AT`,
      `${col.ultimoLogin} AS ULTIMO_LOGIN`,
      `${col.setorNome} AS SETOR`,
      // Adicionar campos de endereço do setor
      `${sCols.has('LOGRADOURO') ? 's.LOGRADOURO' : 'NULL'} AS LOGRADOURO`,
      `${sCols.has('NUMERO') ? 's.NUMERO' : 'NULL'} AS NUMERO`,
      `${sCols.has('COMPLEMENTO') ? 's.COMPLEMENTO' : 'NULL'} AS COMPLEMENTO`,
      `${sCols.has('BAIRRO') ? 's.BAIRRO' : 'NULL'} AS BAIRRO`,
      `${sCols.has('CIDADE') ? 's.CIDADE' : 'NULL'} AS CIDADE`,
      `${sCols.has('ESTADO') ? 's.ESTADO' : 'NULL'} AS ESTADO`,
      `${sCols.has('CEP') ? 's.CEP' : 'NULL'} AS CEP`
    ];

    // Query base com JOIN usando colunas detectadas
    let sql = `
      SELECT ${selectCols.join(', ')}
      FROM ${this.tableName} u
      LEFT JOIN SETORES s ON ${uCols.has('SETOR_ID') ? 'u.SETOR_ID' : 'NULL'} = s.ID
    `;
    
    const binds: any = {};
    const conditions: string[] = [];

    // Aplicar filtros dinamicamente, ajustando mapeamentos conforme colunas disponíveis
    Object.keys(filters).forEach((key, index) => {
      const value = (filters as any)[key];
      // Ignorar filtro 'ativo' (pode não existir nesta instalação)
      // Agora mapeamos 'ativo' para IS_ACTIVE/ATIVO se existir
      if (value !== undefined && value !== null && value !== '') {
        let columnName: string;
        if (key === 'setor') {
          columnName = col.setorNome.replace('s.', 's.');
        } else if (key === 'numero_funcional') {
          columnName = col.numeroFuncional;
          if (columnName.endsWith('ID')) return; // não existe, ignorar
        } else if (key === 'vinculo_funcional') {
          columnName = col.vinculoFuncional;
          if (columnName.endsWith('ID')) return;
        } else if (key === 'nome') {
          columnName = col.nome;
        } else if (key === 'email') {
          columnName = col.email;
        } else if (key === 'cargo') {
          columnName = col.cargo;
        } else if (key === 'departamento') {
          columnName = col.departamento;
        } else if (key === 'orgao') {
          columnName = col.orgao;
        } else if (key === 'ativo') {
          columnName = col.ativo;
          if (columnName.endsWith('ID')) return;
        } else {
          // Fallback genérico: tentar usar prefixo 'u.'
          columnName = `u.${key.toUpperCase()}`;
          // Validar se a coluna existe
          if (!uCols.has(key.toUpperCase())) return;
        }

        if (typeof value === 'string' && value.includes('%')) {
          // Usar TRANSLATE para normalizar acentos em comparações LIKE
          const normalizedColumn = `TRANSLATE(UPPER(${columnName}), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'AAAAAEEEEIIIIOOOOUUUUCN')`;
          const normalizedValue = `TRANSLATE(UPPER(:filter${index}), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'AAAAAEEEEIIIIOOOOUUUUCN')`;
          conditions.push(`${normalizedColumn} LIKE ${normalizedValue}`);
        } else if (Array.isArray(value)) {
          const placeholders = value.map((_: any, i: number) => `:filter${index}_${i}`).join(', ');
          conditions.push(`${columnName} IN (${placeholders})`);
          value.forEach((val: any, i: number) => {
            binds[`filter${index}_${i}`] = val;
          });
          return;
        } else {
          conditions.push(`${columnName} = :filter${index}`);
        }
        binds[`filter${index}`] = value;
      }
    });

    // Adicionar condições WHERE
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Contar total de registros
    const countSql = `SELECT COUNT(*) as total FROM (${sql})`;
    const countResult = await DatabaseService.executeQuery(countSql, binds);
    const total = (countResult.rows?.[0] as any)?.TOTAL || 0;

    // Adicionar ordenação e paginação (mapear orderBy para colunas existentes)
    const orderMap: Record<string, string> = {
      nome: col.nome,
      email: col.email,
      created_at: col.createdAtExpr,
      updated_at: col.updatedAtExpr,
      numero_funcional: col.numeroFuncional,
      vinculo_funcional: col.vinculoFuncional,
      orgao: col.orgao,
      setor: col.setorNome,
      id: col.id
    };
    const requestedOrderKey = (orderBy || 'created_at').toString().toLowerCase();
    const effectiveOrderBy = orderMap[requestedOrderKey] || col.createdAtExpr || col.id;
    sql += ` ORDER BY ${effectiveOrderBy} ${orderDirection}`;

    // Se limit <= 0, retornar todos os registros (sem paginação); caso contrário, aplicar paginação
    const effectiveLimit = (!limit || limit < 1) ? total : limit;
    const effectiveOffset = (!limit || limit < 1) ? 0 : offset;
    if (effectiveLimit > 0) {
      sql += ` OFFSET :paginationOffset ROWS FETCH NEXT :paginationLimit ROWS ONLY`;
      binds.paginationOffset = effectiveOffset;
      binds.paginationLimit = effectiveLimit;
    }

    // Importante: por padrão, oracledb.maxRows pode limitar a 1000 linhas.
    // Para esta listagem, quando precisamos retornar todos os usuários (limit <= 0),
    // definimos maxRows: 0 para remover o limite do driver.
    const result = await DatabaseService.executeQuery(sql, binds, { maxRows: 0 });
    const data = this.processResults(result.rows || []);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: (!limit || limit < 1) ? 1 : Math.ceil(total / limit)
      }
    };
  }

  /**
   * Buscar usuário por email
   */
  static async findByEmail(email: string): Promise<IUser | null> {
    return await this.findOne<IUser>({ email });
  }

  /**
   * Buscar usuário por email incluindo senha (para autenticação)
   */
  static async findByEmailWithPassword(email: string): Promise<IUser | null> {
    try {
      const sql = `
        SELECT u.ID, u.E_MAIL, u.SENHA, u.NOME, u.ROLE, u.TELEFONE, u.USUARIO_ATIVO, 
               u.DATA_CRIACAO, u.DATA_ATUALIZACAO, u.ULTIMO_LOGIN, u.SETOR_ID
        FROM USUARIOS u
        WHERE u.E_MAIL = :email
      `;
      
      const result = await DatabaseService.executeQuery(sql, { email });
      
      if (!result.rows || result.rows.length === 0) {
        return null;
      }
      
      const rawUser = result.rows[0] as any;
      
      // Mapear campos do banco para o objeto user
      const user: IUser = {
        id: rawUser.ID,
        nome: rawUser.NOME,
        e_mail: rawUser.E_MAIL,
        email: rawUser.E_MAIL, // Compatibilidade
        senha: rawUser.SENHA,
        role: rawUser.ROLE,
        telefone: rawUser.TELEFONE,
        setor_id: rawUser.SETOR_ID,
        usuario_ativo: rawUser.USUARIO_ATIVO,
        ativo: rawUser.USUARIO_ATIVO === 1,
        data_criacao: rawUser.DATA_CRIACAO,
        data_atualizacao: rawUser.DATA_ATUALIZACAO,
        ultimo_login: rawUser.ULTIMO_LOGIN
      };
      
      return user;
    } catch (error) {
      console.error('Erro ao buscar usuário com senha:', error);
      return null;
    }
  }

  /**
   * Buscar usuário por CPF
   */
  static async findByCpf(cpf: string): Promise<IUser | null> {
    return await this.findOne<IUser>({ cpf });
  }

  /**
   * Criar novo usuário
   */
  static async createUser(userData: Omit<IUser, 'id' | 'created_at' | 'updated_at'>): Promise<IUser> {
    // Gerar senha automaticamente baseada no perfil/role centralizada em config
    const userRole = (userData as any).perfil || userData.role;
    const autoGeneratedPassword = getDefaultPasswordForRole(userRole?.toString());

    // Criar dados do usuário com senha gerada automaticamente
    const userDataWithPassword = {
      ...userData,
      senha: autoGeneratedPassword
    };

    // Validar dados
    const validation = await this.validateUserData(userDataWithPassword);
    if (!validation.valid) {
      throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
    }

    // Hash da senha gerada automaticamente
    const hashedPassword = await this.hashPassword(autoGeneratedPassword);
    const dataWithHashedPassword = {
      ...userDataWithPassword,
      senha: hashedPassword,
      ativo: userData.ativo !== undefined ? userData.ativo : true,
      tentativas_login: 0
    };

    // Garantir timestamps no banco (Oracle) usando colunas DATA_CRIACAO e DATA_ATUALIZACAO
    const now = new Date();
    const dbData = {
      ...dataWithHashedPassword,
      DATA_CRIACAO: now,
      DATA_ATUALIZACAO: now,
      SENHA_ALTERADA: 'N'
    };

    return await this.create<IUser>(dbData);
  }

  /**
   * Mapear campos do frontend para colunas do banco de dados
   */
  private static mapFieldsToColumns(data: any): any {
    const mapped = { ...data };
    
    // Mapeamento de campos específicos para a nova estrutura da tabela USUARIOS
    if ('ativo' in mapped) {
      mapped.USUARIO_ATIVO = mapped.ativo ? 1 : 0;
      delete mapped.ativo;
    }
    
    if ('usuario_ativo' in mapped) {
      mapped.USUARIO_ATIVO = mapped.usuario_ativo;
      delete mapped.usuario_ativo;
    }
    
    if ('nome' in mapped) {
      mapped.NOME = mapped.nome;
      delete mapped.nome;
    }
    
    if ('email' in mapped) {
      mapped.E_MAIL = mapped.email;
      delete mapped.email;
    }
    
    if ('e_mail' in mapped) {
      mapped.E_MAIL = mapped.e_mail;
      delete mapped.e_mail;
    }
    
    if ('senha' in mapped) {
      mapped.SENHA = mapped.senha;
      delete mapped.senha;
    }
    
    if ('telefone' in mapped) {
      mapped.TELEFONE = mapped.telefone;
      delete mapped.telefone;
    }
    
    if ('cargo' in mapped) {
      mapped.CARGO = mapped.cargo;
      delete mapped.cargo;
    }
    
    if ('perfil' in mapped) {
      // Converter perfil para role
      let roleValue = mapped.perfil.toString().toUpperCase();
      if (roleValue === 'GUEST') roleValue = 'USER';
      mapped.ROLE = roleValue;
      delete mapped.perfil;
    }
    
    if ('role' in mapped) {
      mapped.ROLE = mapped.role;
      delete mapped.role;
    }
    
    if ('setor_id' in mapped) {
      mapped.SETOR_ID = mapped.setor_id;
      delete mapped.setor_id;
    }
    
    if ('matricula' in mapped) {
      mapped.MATRICULA = mapped.matricula;
      delete mapped.matricula;
    }
    
    if ('vinculo_funcional' in mapped) {
      mapped.VINCULO_FUNCIONAL = mapped.vinculo_funcional;
      delete mapped.vinculo_funcional;
    }
    
    if ('cpf' in mapped) {
      mapped.CPF = mapped.cpf;
      delete mapped.cpf;
    }
    
    if ('pis/pasep' in mapped) {
      // Mapear para o nome exato da coluna no Oracle (com barra)
      mapped['PIS/PASEP'] = mapped['pis/pasep'];
      delete mapped['pis/pasep'];
    }
    
    if ('pis_pasep' in mapped) {
      // Alias compatível apontando para a mesma coluna
      mapped['PIS/PASEP'] = mapped.pis_pasep;
      delete mapped.pis_pasep;
    }
    
    if ('comissao_funçao' in mapped) {
      // Nome exato da coluna possui cedilha
      mapped['COMISSAO_FUNÇAO'] = mapped['comissao_funçao'];
      delete mapped['comissao_funçao'];
    }
    
    if ('ultimo_login' in mapped) {
      mapped.ULTIMO_LOGIN = mapped.ultimo_login;
      delete mapped.ultimo_login;
    }
    
    if ('tentativas_login' in mapped) {
      mapped.TENTATIVAS_LOGIN = mapped.tentativas_login;
      delete mapped.tentativas_login;
    }
    
    if ('data_criacao' in mapped) {
      mapped.DATA_CRIACAO = mapped.data_criacao;
      delete mapped.data_criacao;
    }
    
    if ('data_atualizacao' in mapped) {
      mapped.DATA_ATUALIZACAO = mapped.data_atualizacao;
      delete mapped.data_atualizacao;
    }
    
    // Mapear indicador de alteração de senha
    if ('senhaAlterada' in mapped) {
      mapped.SENHA_ALTERADA = mapped.senhaAlterada;
      delete mapped.senhaAlterada;
    }
    
    if ('bloqueado_ate' in mapped) {
      mapped.BLOQUEADO_ATE = mapped.bloqueado_ate;
      delete mapped.bloqueado_ate;
    }
    
    return mapped;
  }

  /**
   * Atualizar usuário
   */
  static async updateUser(id: number, userData: Partial<IUser>): Promise<IUser | null> {
    console.log('🔍 [USER MODEL] Iniciando updateUser - ID:', id, 'Dados:', Object.keys(userData));
    
    // Se está atualizando a senha, fazer hash
    if (userData.senha) {
      console.log('🔍 [USER MODEL] Fazendo hash da senha');
      userData.senha = await this.hashPassword(userData.senha);
      console.log('🔍 [USER MODEL] Hash da senha concluído');
    }

    // Validar dados (exceto senha se não foi fornecida)
    if (Object.keys(userData).some(key => key !== 'senha')) {
      console.log('🔍 [USER MODEL] Iniciando validação dos dados');
      const validation = await this.validateUserData(userData, id);
      console.log('🔍 [USER MODEL] Validação concluída:', validation.valid);
      
      if (!validation.valid) {
        throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
      }
    }

    // Mapear campos para colunas do banco
    console.log('🔍 [USER MODEL] Mapeando campos para colunas do banco');
    const mappedData = this.mapFieldsToColumns(userData);
    console.log('🔍 [USER MODEL] Campos mapeados:', Object.keys(mappedData));

    // Atualizar timestamp de atualização na coluna DATA_ATUALIZACAO
    mappedData.DATA_ATUALIZACAO = new Date();

    console.log('🔍 [USER MODEL] Chamando método update do BaseModel');
    const result = await this.update<IUser>(id, mappedData);
    console.log('🔍 [USER MODEL] Método update concluído');
    
    return result;
  }

  /**
   * Autenticar usuário
   */
  static async authenticate(credentials: ILoginCredentials): Promise<IAuthResponse> {
    const { cpf, senha } = credentials;

    // Buscar usuário (incluindo senha para verificação)
    // Usar DatabaseService diretamente para evitar processamento que remove campos hidden
    const cpfDigits = cpf.replace(/\D/g, '');
    const sql = `
      SELECT u.ID, u.NOME, u.E_MAIL, u.CPF, u.SENHA, u.USUARIO_ATIVO, u.SENHA_ALTERADA,
             u.ROLE, u.SETOR_ID, u.MATRICULA, u.VINCULO_FUNCIONAL
      FROM ${this.tableName} u
      WHERE REGEXP_REPLACE(TO_CHAR(u.CPF), '[^0-9]', '') = :cpf_digits
    `;
    
    const result = await DatabaseService.executeQuery(sql, { cpf_digits: cpfDigits });
    const rawUser = result.rows?.[0];
    
    if (!rawUser) {
      throw new Error('Usuário não encontrado');
    }

    // Converter para camelCase manualmente
    const user = {
      id: rawUser.ID,
      nome: rawUser.NOME,
      e_mail: rawUser.E_MAIL,
      email: rawUser.E_MAIL, // Compatibilidade
      cpf: rawUser.CPF,
      senha: rawUser.SENHA,
      usuario_ativo: rawUser.USUARIO_ATIVO,
      ativo: rawUser.USUARIO_ATIVO === 1 || rawUser.USUARIO_ATIVO === '1',
      senha_alterada: rawUser.SENHA_ALTERADA,
      // Papel do usuário (restrições baseadas somente em ROLE)
      role: rawUser.ROLE,
      setor_id: rawUser.SETOR_ID,
      matricula: rawUser.MATRICULA,
      vinculo_funcional: rawUser.VINCULO_FUNCIONAL
    };

    // Verificar se usuário está ativo
    if (!user.ativo) {
      throw new Error('Usuário inativo');
    }

    // Verificar senha
    if (!user.senha) {
      throw new Error('Senha não configurada para este usuário');
    }

    let senhaValida = false;
    const stored = String(user.senha);

    const isBcryptHash = /^\$2[aby]\$/.test(stored);

    if (isBcryptHash) {
      // Compatibilidade com hashes gerados em outros ambientes (ex.: PHP usa $2y$)
      const normalized = stored.startsWith('$2y$') ? ('$2b$' + stored.slice(4)) : stored;
      senhaValida = await bcrypt.compare(senha, normalized);
      // Se a senha for válida, alinhar custo/algoritmo ao padrão do sistema
      if (senhaValida) {
        try {
          // bcrypt.getRounds retorna o custo do hash atual
          const currentRounds = (bcrypt as any).getRounds ? (bcrypt as any).getRounds(normalized) : undefined;
          const needsRehash = (typeof currentRounds === 'number' && currentRounds !== this.SALT_ROUNDS) || stored.startsWith('$2y$');
          if (needsRehash) {
            const rehashed = await this.hashPassword(senha);
            await DatabaseService.executeQuery(
              `UPDATE ${this.tableName} SET SENHA = :senha, DATA_ATUALIZACAO = CURRENT_TIMESTAMP WHERE ID = :id`,
              { senha: rehashed, id: user.id }
            );
            user.senha = rehashed;
          }
        } catch (rehashErr) {
          // Não bloquear login por falha de rehash; apenas logar para acompanhamento
          console.warn('Rehash de senha falhou. Prosseguindo com login.', rehashErr);
        }
      }
    } else if (/^[a-fA-F0-9]{32}$/.test(stored)) {
      // MD5 legacy hash
      const md5 = crypto.createHash('md5').update(senha).digest('hex');
      senhaValida = md5.toLowerCase() === stored.toLowerCase();
      if (senhaValida) {
        const hashedPassword = await this.hashPassword(senha);
        await DatabaseService.executeQuery(
          `UPDATE ${this.tableName} SET SENHA = :senha, DATA_ATUALIZACAO = CURRENT_TIMESTAMP WHERE ID = :id`,
          { senha: hashedPassword, id: user.id }
        );
        user.senha = hashedPassword;
      }
    } else if (/^[a-fA-F0-9]{40}$/.test(stored)) {
      // SHA-1 legacy hash
      const sha1 = crypto.createHash('sha1').update(senha).digest('hex');
      senhaValida = sha1.toLowerCase() === stored.toLowerCase();
      if (senhaValida) {
        const hashedPassword = await this.hashPassword(senha);
        await DatabaseService.executeQuery(
          `UPDATE ${this.tableName} SET SENHA = :senha, DATA_ATUALIZACAO = CURRENT_TIMESTAMP WHERE ID = :id`,
          { senha: hashedPassword, id: user.id }
        );
        user.senha = hashedPassword;
      }
    } else if (/^[a-fA-F0-9]{64}$/.test(stored)) {
      // SHA-256 legacy hash
      const sha256 = crypto.createHash('sha256').update(senha).digest('hex');
      senhaValida = sha256.toLowerCase() === stored.toLowerCase();
      if (senhaValida) {
        const hashedPassword = await this.hashPassword(senha);
        await DatabaseService.executeQuery(
          `UPDATE ${this.tableName} SET SENHA = :senha, DATA_ATUALIZACAO = CURRENT_TIMESTAMP WHERE ID = :id`,
          { senha: hashedPassword, id: user.id }
        );
        user.senha = hashedPassword;
      }
    } else {
      // Fallback: senha em texto plano no banco
      senhaValida = senha === stored.trim();

      // Migrar imediatamente para hash seguro
      if (senhaValida) {
        const hashedPassword = await this.hashPassword(senha);
        await DatabaseService.executeQuery(
          `UPDATE ${this.tableName} SET SENHA = :senha, DATA_ATUALIZACAO = CURRENT_TIMESTAMP WHERE ID = :id`,
          { senha: hashedPassword, id: user.id }
        );
        user.senha = hashedPassword;
      }
    }

    if (!senhaValida) {
      // TODO: Incrementar tentativas de login (requer coluna TENTATIVAS_LOGIN e BLOQUEADO_ATE)
      // await this.incrementLoginAttempts(user.id!);
      throw new Error('Credenciais inválidas');
    }

    // TODO: Reset tentativas de login (requer colunas TENTATIVAS_LOGIN e BLOQUEADO_ATE)
     // await this.resetLoginAttempts(user.id!);
     
     // Atualizar último login manualmente
     await DatabaseService.executeQuery(
       `UPDATE ${this.tableName} SET ULTIMO_LOGIN = CURRENT_TIMESTAMP WHERE ID = :userId`,
       { userId: user.id }
     );

    // Verificar se está usando senha padrão
    // Cobrir casos conhecidos de senhas padrão usadas em ambientes de desenvolvimento/seed
    const DEFAULT_PASSWORD_HASH = '$2b$12$LQv3c1yqBwEHXw.9oC9FEO4SdHWw5uIUuIWxFJxeoJxs2xe4Rb3Oi';
    const defaultRawPasswords = ['Admin@123', 'admin123', 'User@123', '123456', 'Senha123@', 'senha123'];
    const computedDefault = defaultRawPasswords.includes(String(senha).trim()) || user.senha === DEFAULT_PASSWORD_HASH;
    // Preferir flag do banco se existir; caso contrário usar heurística
    const columnFlag = rawUser.SENHA_ALTERADA;
    const isDefaultFromColumn = columnFlag === undefined ? undefined : (String(columnFlag).toUpperCase() !== 'S');
    const isDefaultPassword = (isDefaultFromColumn !== undefined) ? isDefaultFromColumn : computedDefault;

    // Gerar tokens
    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Remover senha do objeto de resposta
    const { senha: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
      refreshToken,
      expiresIn: 24 * 60 * 60, // 24 horas em segundos
      isDefaultPassword
    };
  }

  /**
   * Renovar token de acesso
   */
  static async refreshToken(refreshToken: string): Promise<{ token: string; expiresIn: number }> {
    try {
      // Verificar usando JWT_REFRESH_SECRET ou, em fallback, JWT_SECRET
      const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
      if (!refreshSecret) {
        throw new Error('Secret para refresh token não configurado');
      }

      const decoded = jwt.verify(refreshToken, refreshSecret) as any;
      const user = await this.findById<IUser>(decoded.userId);
      
      if (!user || !user.ativo) {
        throw new Error('Token inválido');
      }

      const newToken = this.generateToken(user);
      
      return {
        token: newToken,
        expiresIn: 24 * 60 * 60
      };
    } catch (error) {
      throw new Error('Token de refresh inválido');
    }
  }

  /**
   * Alterar senha do usuário
   */
  static async changePassword(
    userId: number, 
    senhaAtual: string, 
    novaSenha: string
  ): Promise<boolean> {
    // Buscar usuário com senha usando DatabaseService diretamente
    const sql = `SELECT SENHA FROM ${this.tableName} WHERE id = :userId`;
    const result = await DatabaseService.executeQuery(sql, { userId });
    const rawRow = result.rows?.[0];

    if (!rawRow) {
      throw new Error('Usuário não encontrado');
    }

    // Debug logs
    console.log('DEBUG changePassword:');
    console.log('- userId:', userId);
    console.log('- senhaAtual:', senhaAtual);
    console.log('- stored hash:', rawRow.SENHA);

    // Verificar senha atual usando a mesma lógica do authenticate
    const stored = String(rawRow.SENHA);
    let senhaValida = false;

    const isBcryptHash = /^\$2[aby]\$/.test(stored);

    if (isBcryptHash) {
      // Compatibilidade com hashes gerados em outros ambientes (ex.: PHP usa $2y$)
      const normalized = stored.startsWith('$2y$') ? ('$2b$' + stored.slice(4)) : stored;
      senhaValida = await bcrypt.compare(senhaAtual, normalized);
    } else if (/^[a-fA-F0-9]{32}$/.test(stored)) {
      // MD5 legacy hash
      const md5 = crypto.createHash('md5').update(senhaAtual).digest('hex');
      senhaValida = md5.toLowerCase() === stored.toLowerCase();
    } else if (/^[a-fA-F0-9]{40}$/.test(stored)) {
      // SHA-1 legacy hash
      const sha1 = crypto.createHash('sha1').update(senhaAtual).digest('hex');
      senhaValida = sha1.toLowerCase() === stored.toLowerCase();
    } else if (/^[a-fA-F0-9]{64}$/.test(stored)) {
      // SHA-256 legacy hash
      const sha256 = crypto.createHash('sha256').update(senhaAtual).digest('hex');
      senhaValida = sha256.toLowerCase() === stored.toLowerCase();
    } else {
      // Fallback: senha em texto plano no banco
      senhaValida = senhaAtual === stored.trim();
    }

    if (!senhaValida) {
      throw new Error('Senha atual incorreta');
    }

    // Validar nova senha
    if (!this.validatePassword(novaSenha)) {
      throw new Error('Nova senha não atende aos critérios de segurança');
    }

    // Hash da nova senha e atualizar
    const hashedPassword = await this.hashPassword(novaSenha);
    await DatabaseService.executeQuery(
      `UPDATE ${this.tableName} 
         SET SENHA = :senha,
             SENHA_ALTERADA = 'S',
             DATA_ATUALIZACAO = CURRENT_TIMESTAMP
       WHERE ID = :id`,
      { senha: hashedPassword, id: userId }
    );

    return true;
  }

  /**
   * Resetar senha (para administradores)
   */
  static async resetPassword(userId: number, novaSenha: string): Promise<boolean> {
    if (!this.validatePassword(novaSenha)) {
      throw new Error('Nova senha não atende aos critérios de segurança');
    }

    const hashedPassword = await this.hashPassword(novaSenha);
    await DatabaseService.executeQuery(
      `UPDATE ${this.tableName}
         SET SENHA = :senha,
             TENTATIVAS_LOGIN = 0,
             BLOQUEADO_ATE = NULL,
             DATA_ATUALIZACAO = CURRENT_TIMESTAMP
       WHERE ID = :id`,
      { senha: hashedPassword, id: userId }
    );

    return true;
  }

  /**
   * Obter status da senha padrão via coluna SENHA_ALTERADA
   */
  static async getPasswordStatus(userId: number): Promise<boolean> {
    // true = está usando senha padrão (ainda não alterou)
    const sql = `SELECT SENHA_ALTERADA, SENHA FROM ${this.tableName} WHERE ID = :userId`;
    const res = await this.query(sql, { userId });
    const row = res[0] as { SENHA_ALTERADA?: string; SENHA?: string } | undefined;
    if (!row) {
      throw new Error('Usuário não encontrado');
    }
    const col = row.SENHA_ALTERADA;
    if (col !== undefined && col !== null) {
      return String(col).toUpperCase() !== 'S';
    }
    // Fallback heurístico quando coluna não existe
    const DEFAULT_PASSWORD_HASH = '$2b$12$LQv3c1yqBwEHXw.9oC9FEO4SdHWw5uIUuIWxFJxeoJxs2xe4Rb3Oi';
    const defaultRawPasswords = ['Admin@123', 'admin123', 'User@123', '123456', 'Senha123@', 'senha123'];
    const stored = String(row.SENHA || '').trim();
    const isDefaultHash = stored === DEFAULT_PASSWORD_HASH;
    // Sem senha atual fornecida, só podemos verificar hash conhecido
    return isDefaultHash || false;
  }

  /**
   * Ativar/Desativar usuário
   */
  static async toggleUserStatus(userId: number, ativo: boolean): Promise<IUser | null> {
    return await this.update<IUser>(userId, { ativo });
  }

  /**
   * Buscar usuários por departamento
   */
  static async findByDepartment(
    departamento: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IUser>> {
    return await this.findUsers({ departamento }, pagination);
  }

  /**
   * Buscar usuários por cargo
   */
  static async findByRole(
    cargo: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IUser>> {
    return await this.findUsers({ cargo }, pagination);
  }

  /**
   * Buscar usuários ativos
   */
  static async findActiveUsers(
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IUser>> {
    return await this.findUsers({ ativo: true }, pagination);
  }

  /**
   * Buscar usuário por número funcional
   */
  static async findByNumeroFuncional(numeroFuncional: number): Promise<IUser | null> {
    return await this.findOne<IUser>({ numero_funcional: numeroFuncional });
  }

  /**
   * Buscar usuário por vínculo funcional
   */
  static async findByVinculoFuncional(vinculoFuncional: string): Promise<IUser[]> {
    const result = await this.findAll<IUser>({ vinculo_funcional: vinculoFuncional });
    return result.data;
  }

  /**
   * Gerar número funcional completo no formato 123456-01
   */
  static getNumeroFuncionalCompleto(numeroFuncional?: number, vinculoFuncional?: string): string | null {
    if (!numeroFuncional || !vinculoFuncional) {
      return null;
    }
    return `${numeroFuncional.toString().padStart(6, '0')}-${vinculoFuncional.padStart(2, '0')}`;
  }

  /**
   * Extrair número funcional e vínculo de um número funcional completo
   */
  static parseNumeroFuncionalCompleto(numeroCompleto: string): { numeroFuncional: number; vinculoFuncional: string } | null {
    const match = numeroCompleto.match(/^(\d+)-(\d{2})$/);
    if (!match) {
      return null;
    }
    return {
      numeroFuncional: parseInt(match[1], 10),
      vinculoFuncional: match[2]
    };
  }

  /**
   * Atualizar vínculo funcional de um usuário
   */
  static async updateVinculoFuncional(
    userId: number, 
    vinculoFuncional: string
  ): Promise<IUser | null> {
    // Validar formato do vínculo (2 dígitos)
    if (!/^\d{2}$/.test(vinculoFuncional)) {
      throw new Error('Vínculo funcional deve ter exatamente 2 dígitos');
    }

    return await this.update<IUser>(userId, { vinculo_funcional: vinculoFuncional });
  }

  /**
   * Buscar usuários por órgão
   */
  static async findByOrgao(
    orgao: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IUser>> {
    return await this.findUsers({ orgao }, pagination);
  }

  /**
   * Buscar usuários por setor
   */
  static async findBySetor(
    setor: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IUser>> {
    return await this.findUsers({ setor }, pagination);
  }

  /**
   * Buscar usuários por lotação
   */
  static async findByLotacao(
    lotacao: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IUser>> {
    return await this.findUsers({ lotacao }, pagination);
  }

  /**
   * Buscar usuários por hierarquia de setor
   */
  static async findByHierarquiaSetor(
    hierarquiaSetor: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IUser>> {
    return await this.findUsers({ hierarquia_setor: hierarquiaSetor }, pagination);
  }

  /**
   * Buscar usuários por código do setor
   */
  static async findByCodigoSetor(
    codigoSetor: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IUser>> {
    return await this.findUsers({ codigo_setor: codigoSetor }, pagination);
  }

  /**
   * Buscar usuários por nome (busca parcial)
   */
  static async searchByName(
    nome: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IUser>> {
    const sql = `
      SELECT DISTINCT 
        u.ID,
        u.NAME as NOME,
        u.EMAIL,
        u.ROLE as CARGO,
        s.NOME_SETOR as DEPARTAMENTO,
        u.PHONE as TELEFONE,
        u.MATRICULA as NUMERO_FUNCIONAL,
        u.VINCULO_FUNCIONAL,
        u.SETOR_ID,
        u.IS_ACTIVE as ATIVO,
        u.CREATED_AT,
        u.UPDATED_AT,
        u.LAST_LOGIN as ULTIMO_LOGIN,
        s.NOME_SETOR as SETOR,
        s.ORGAO,
        s.LOGRADOURO,
        s.NUMERO as NUMERO_ENDERECO,
        s.COMPLEMENTO,
        s.BAIRRO,
        s.CIDADE,
        s.ESTADO,
        s.CEP,
        s.TELEFONE as TELEFONE_SETOR,
        s.EMAIL as EMAIL_SETOR
      FROM ${this.tableName} u
      LEFT JOIN SETORES s ON u.SETOR_ID = s.ID
      WHERE UPPER(u.NAME) LIKE UPPER(:searchTerm)
      AND u.IS_ACTIVE = 1
      ORDER BY u.NAME
    `;

    const binds = { searchTerm: `%${nome}%` };
    
    // Contar total de registros primeiro
    const countSql = `
      SELECT COUNT(*) as total
      FROM ${this.tableName} u
      LEFT JOIN SETORES s ON u.SETOR_ID = s.ID
      WHERE UPPER(u.NAME) LIKE UPPER(:searchTerm)
      AND u.IS_ACTIVE = 1
    `;
    
    const countResult = await DatabaseService.executeQuery(countSql, binds);
    const total = (countResult.rows?.[0] as any)?.TOTAL || 0;
    
    // Aplicar paginação na query principal
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;
    
    const paginatedSql = sql + ` OFFSET :paginationOffset ROWS FETCH NEXT :paginationLimit ROWS ONLY`;
    binds.paginationOffset = offset;
    binds.paginationLimit = limit;
    
    // Utiliza diretamente o DatabaseService para executar a query
    const result = await DatabaseService.executeQuery(paginatedSql, binds);

    // Converte resultados para camelCase e remove campos ocultos
    const rows = this.processResults((result.rows as any[]) || []);
    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obter estatísticas dos usuários
   */
  static async getUserStats(): Promise<{
    total: number;
    ativos: number;
    inativos: number;
    bloqueados: number;
    porDepartamento: { [key: string]: number };
    porCargo: { [key: string]: number };
  }> {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN ativo = 1 THEN 1 ELSE 0 END) as ativos,
        SUM(CASE WHEN ativo = 0 THEN 1 ELSE 0 END) as inativos,
        SUM(CASE WHEN bloqueado_ate > SYSDATE THEN 1 ELSE 0 END) as bloqueados
      FROM ${this.tableName}
    `;

    const statsResult = await this.query(sql);
    const stats = statsResult[0] as any;

    // Estatísticas por departamento
    const deptSql = `
      SELECT departamento, COUNT(*) as count 
      FROM ${this.tableName} 
      WHERE departamento IS NOT NULL 
      GROUP BY departamento
    `;
    const deptResult = await this.query(deptSql);
    const porDepartamento: { [key: string]: number } = {};
    deptResult.forEach((row: any) => {
      porDepartamento[row.DEPARTAMENTO] = row.COUNT;
    });

    // Estatísticas por cargo
    const cargoSql = `
      SELECT cargo, COUNT(*) as count 
      FROM ${this.tableName} 
      WHERE cargo IS NOT NULL 
      GROUP BY cargo
    `;
    const cargoResult = await this.query(cargoSql);
    const porCargo: { [key: string]: number } = {};
    cargoResult.forEach((row: any) => {
      porCargo[row.CARGO] = row.COUNT;
    });

    return {
      total: stats.TOTAL || 0,
      ativos: stats.ATIVOS || 0,
      inativos: stats.INATIVOS || 0,
      bloqueados: stats.BLOQUEADOS || 0,
      porDepartamento,
      porCargo
    };
  }

  /**
   * Validar dados do usuário
   */
  private static async validateUserData(
    data: Partial<IUser>, 
    excludeId?: number
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validar nome
    if (data.nome !== undefined) {
      if (!data.nome || data.nome.trim().length < 2) {
        errors.push('Nome deve ter pelo menos 2 caracteres');
      }
    }

    // Preparar validações assíncronas paralelas
    const asyncValidations: Promise<void>[] = [];

    // Validar email
    if (data.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!data.email || !emailRegex.test(data.email)) {
        errors.push('Email inválido');
      } else {
        // Adicionar validação de duplicidade de email à lista de validações paralelas
        asyncValidations.push(
          (async () => {
            if (excludeId) {
              // Para atualizações, verificar se o email mudou antes de consultar o banco
              const currentUser = await this.findById<IUser>(excludeId);
              if (currentUser && currentUser.email !== data.email) {
                // Só verificar duplicação se o email realmente mudou
                const existingUser = await this.findByEmail(data.email);
                if (existingUser && existingUser.id !== excludeId) {
                  errors.push('Email já está em uso');
                }
              }
            } else {
              // Para criação, sempre verificar duplicação
              const existingUser = await this.findByEmail(data.email);
              if (existingUser) {
                errors.push('Email já está em uso');
              }
            }
          })()
        );
      }
    }

    // Validar CPF
    if (data.cpf !== undefined && data.cpf) {
      if (!this.validateCpf(data.cpf)) {
        errors.push('CPF inválido');
      } else {
        // Adicionar validação de duplicidade de CPF à lista de validações paralelas
        asyncValidations.push(
          (async () => {
            if (excludeId) {
              // Para atualizações, verificar se o CPF mudou antes de consultar o banco
              const currentUser = await this.findById<IUser>(excludeId);
              if (currentUser && currentUser.cpf !== data.cpf) {
                // Só verificar duplicação se o CPF realmente mudou
                const existingUser = await this.findByCpf(data.cpf);
                if (existingUser && existingUser.id !== excludeId) {
                  errors.push('CPF já está em uso');
                }
              }
            } else {
              // Para criação, sempre verificar duplicação
              const existingUser = await this.findByCpf(data.cpf);
              if (existingUser) {
                errors.push('CPF já está em uso');
              }
            }
          })()
        );
      }
    }

    // Executar todas as validações assíncronas em paralelo
    if (asyncValidations.length > 0) {
      await Promise.all(asyncValidations);
    }

    // Validar senha (apenas se fornecida)
    if (data.senha !== undefined && !this.validatePassword(data.senha)) {
      errors.push('Senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e símbolo');
    }

    // Validar telefone
    if (data.telefone !== undefined && data.telefone) {
      const phoneRegex = /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/;
      if (!phoneRegex.test(data.telefone)) {
        errors.push('Telefone inválido');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validar senha
   */
  private static validatePassword(senha: string): boolean {
    // Pelo menos 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 símbolo
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(senha);
  }

  /**
   * Validar CPF
   */
  private static validateCpf(cpf: string): boolean {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    
    return remainder === parseInt(cpf.charAt(10));
  }

  /**
   * Hash da senha
   */
  private static async hashPassword(senha: string): Promise<string> {
    return await bcrypt.hash(senha, this.SALT_ROUNDS);
  }

  /**
   * Gerar token JWT
   */
  private static generateToken(user: IUser): string {
    const payload = {
      userId: user.id,
      email: user.email,
      nome: user.nome,
      role: (user.role || user.cargo || '').toString().toUpperCase()
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: this.JWT_EXPIRES_IN
    });
  }

  /**
   * Gerar refresh token
   */
  private static generateRefreshToken(user: IUser): string {
    const payload = {
      userId: user.id,
      type: 'refresh'
    };

    // Usar JWT_REFRESH_SECRET se disponível; caso contrário, usar JWT_SECRET como fallback
    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    if (!refreshSecret) {
      throw new Error('Secret para refresh token não configurado');
    }

    return jwt.sign(payload, refreshSecret, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN
    });
  }

  /**
   * Incrementar tentativas de login
   */
  private static async incrementLoginAttempts(userId: number): Promise<void> {
    const lockoutMinutes = this.LOCKOUT_TIME / (1000 * 60);
    const sql = `
      UPDATE ${this.tableName} 
      SET tentativas_login = NVL(tentativas_login, 0) + 1,
          bloqueado_ate = CASE 
            WHEN NVL(tentativas_login, 0) + 1 >= :maxAttempts 
            THEN SYSDATE + INTERVAL '${lockoutMinutes}' MINUTE
            ELSE bloqueado_ate 
          END
      WHERE id = :userId
    `;

    await this.query(sql, {
      userId,
      maxAttempts: this.MAX_LOGIN_ATTEMPTS
    });
  }

  /**
   * Resetar tentativas de login
   */
  private static async resetLoginAttempts(userId: number): Promise<void> {
    const sql = `
      UPDATE ${this.tableName} 
      SET tentativas_login = 0,
          bloqueado_ate = NULL,
          ultimo_login = SYSDATE
      WHERE id = :userId
    `;

    await this.query(sql, { userId });
  }

  /**
   * Sobrescrever findAll para incluir JOIN com SETORES
   */
  static override async findAll(
    filters: SearchFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IUser>> {
    const { page = 1, limit = 10, orderBy = 'created_at', orderDirection = 'DESC' } = pagination;
    const offset = (page - 1) * limit;

    // Construir query base com JOIN
    let sql = `
      SELECT u.*, s.NOME_SETOR as SETOR
      FROM ${this.tableName} u
      LEFT JOIN SETORES s ON u.SETOR_ID = s.ID
    `;
    const binds: any = {};
    const conditions: string[] = [];

    // Aplicar filtros dinamicamente
    Object.keys(filters).forEach((key, index) => {
      const value = filters[key];
      if (value !== undefined && value !== null && value !== '') {
        const columnName = key === 'setor' ? 's.NOME_SETOR' : `u.${key}`;
        
        if (typeof value === 'string' && value.includes('%')) {
          // Busca com LIKE
          conditions.push(`UPPER(${columnName}) LIKE UPPER(:filter${index})`);
        } else if (Array.isArray(value)) {
          // Busca com IN
          const placeholders = value.map((_, i) => `:filter${index}_${i}`).join(', ');
          conditions.push(`${columnName} IN (${placeholders})`);
          value.forEach((val, i) => {
            binds[`filter${index}_${i}`] = val;
          });
          return; // Pular a atribuição normal do bind
        } else {
          // Busca exata
          conditions.push(`${columnName} = :filter${index}`);
        }
        binds[`filter${index}`] = value;
      }
    });

    // Adicionar condições WHERE
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Contar total de registros
    const countSql = `SELECT COUNT(*) as total FROM (${sql})`;
    const countResult = await DatabaseService.executeQuery(countSql, binds);
    const total = (countResult.rows as any)?.[0]?.TOTAL || 0;

    // Adicionar ordenação e paginação
    const orderColumn = orderBy === 'setor' ? 's.NOME_SETOR' : `u.${orderBy}`;
    sql += ` ORDER BY ${orderColumn} ${orderDirection}`;
    sql += ` OFFSET :paginationOffset ROWS FETCH NEXT :paginationLimit ROWS ONLY`;
    binds.paginationOffset = offset;
    binds.paginationLimit = limit;

    // Executar query principal
    const result = await DatabaseService.executeQuery(sql, binds);
    const rows = this.processResults((result.rows as any[]) || []);

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

export default UserModel;