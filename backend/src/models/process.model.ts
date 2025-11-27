import { BaseModel, SearchFilters, PaginationOptions, PaginatedResult } from './base.model';

/**
 * Interface para dados do processo
 */
export interface IProcess {
  id?: number;
  numero_processo: string;
  assunto: string;
  descricao?: string;
  tipo_processo: string;
  prioridade: 'BAIXA' | 'NORMAL' | 'ALTA' | 'URGENTE';
  status: 'ABERTO' | 'EM_ANDAMENTO' | 'SUSPENSO' | 'CONCLUIDO' | 'ARQUIVADO';
  origem: string;
  destino?: string;
  usuario_criador: number;
  usuario_responsavel?: number;
  setor_atual?: string;
  data_abertura: Date;
  data_prazo?: Date;
  data_conclusao?: Date;
  observacoes?: string;
  confidencial: boolean;
  valor_estimado?: number;
  tags?: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Interface para filtros de processo
 */
export interface IProcessFilters extends SearchFilters {
  numero_processo?: string;
  assunto?: string;
  tipo_processo?: string;
  prioridade?: string;
  status?: string;
  origem?: string;
  destino?: string;
  usuario_criador?: number;
  usuario_responsavel?: number;
  setor_atual?: string;
  confidencial?: boolean;
  data_abertura_inicio?: Date;
  data_abertura_fim?: Date;
  data_prazo_inicio?: Date;
  data_prazo_fim?: Date;
  tags?: string;
}

/**
 * Interface para estatísticas de processo
 */
export interface IProcessStats {
  total: number;
  porStatus: { [key: string]: number };
  porPrioridade: { [key: string]: number };
  porTipo: { [key: string]: number };
  porSetor: { [key: string]: number };
  emAtraso: number;
  vencendoHoje: number;
  vencendoSemana: number;
  valorTotal: number;
}

/**
 * Interface para histórico de tramitação
 */
export interface IProcessHistory {
  id?: number;
  processo_id: number;
  usuario_id: number;
  acao: string;
  setor_origem?: string;
  setor_destino?: string;
  observacoes?: string;
  data_acao: Date;
}

/**
 * Modelo de Processo
 * Gerencia processos administrativos e sua tramitação
 */
export class ProcessModel extends BaseModel {
  protected static override tableName = 'processos';
  protected static override primaryKey = 'id';
  protected static override fillable = [
    'numero_processo', 'assunto', 'descricao', 'tipo_processo', 'prioridade',
    'status', 'origem', 'destino', 'usuario_criador', 'usuario_responsavel',
    'setor_atual', 'data_abertura', 'data_prazo', 'data_conclusao',
    'observacoes', 'confidencial', 'valor_estimado', 'tags'
  ];
  protected static override timestamps = true;

  /**
   * Buscar processos com filtros específicos
   */
  static async findProcesses(
    filters: IProcessFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IProcess>> {
    // Construir filtros especiais para datas
    const processedFilters: any = { ...filters };
    
    // Remover filtros de data especiais e processar separadamente
    const { 
      data_abertura_inicio, data_abertura_fim,
      data_prazo_inicio, data_prazo_fim,
      ...regularFilters 
    } = processedFilters;

    let sql = `SELECT * FROM ${this.tableName}`;
    const binds: any = {};
    const conditions: string[] = [];

    // Aplicar filtros regulares
    Object.keys(regularFilters).forEach((key, index) => {
      const value = regularFilters[key];
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'string' && value.includes('%')) {
          conditions.push(`UPPER(${key}) LIKE UPPER(:filter${index})`);
        } else {
          conditions.push(`${key} = :filter${index}`);
        }
        binds[`filter${index}`] = value;
      }
    });

    // Filtros de data de abertura
    if (data_abertura_inicio) {
      conditions.push('data_abertura >= :dataAberturaInicio');
      binds.dataAberturaInicio = data_abertura_inicio;
    }
    if (data_abertura_fim) {
      conditions.push('data_abertura <= :dataAberturaFim');
      binds.dataAberturaFim = data_abertura_fim;
    }

    // Filtros de data de prazo
    if (data_prazo_inicio) {
      conditions.push('data_prazo >= :dataPrazoInicio');
      binds.dataPrazoInicio = data_prazo_inicio;
    }
    if (data_prazo_fim) {
      conditions.push('data_prazo <= :dataPrazoFim');
      binds.dataPrazoFim = data_prazo_fim;
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    return await this.queryWithPagination<IProcess>(sql, binds, pagination);
  }

  /**
   * Buscar processo por número
   */
  static async findByNumber(numeroProcesso: string): Promise<IProcess | null> {
    return await this.findOne<IProcess>({ numero_processo: numeroProcesso });
  }

  /**
   * Criar novo processo
   */
  static async createProcess(processData: Omit<IProcess, 'id' | 'created_at' | 'updated_at'>): Promise<IProcess> {
    // Validar dados
    const validation = await this.validateProcessData(processData);
    if (!validation.valid) {
      throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
    }

    // Gerar número do processo se não fornecido
    if (!processData.numero_processo) {
      processData.numero_processo = await this.generateProcessNumber();
    }

    // Definir valores padrão
    const processWithDefaults = {
      ...processData,
      status: processData.status || 'ABERTO',
      prioridade: processData.prioridade || 'NORMAL',
      data_abertura: processData.data_abertura || new Date(),
      confidencial: processData.confidencial !== undefined ? processData.confidencial : false
    };

    const newProcess = await this.create<IProcess>(processWithDefaults);

    // Registrar no histórico
    await this.addToHistory(newProcess.id!, processData.usuario_criador, 'CRIACAO', {
      observacoes: 'Processo criado'
    });

    return newProcess;
  }

  /**
   * Atualizar processo
   */
  static async updateProcess(id: number, processData: Partial<IProcess>): Promise<IProcess | null> {
    const validation = await this.validateProcessData(processData, id);
    if (!validation.valid) {
      throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
    }

    return await this.update<IProcess>(id, processData);
  }

  /**
   * Tramitar processo
   */
  static async tramitarProcess(
    processId: number,
    usuarioId: number,
    setorDestino: string,
    observacoes?: string
  ): Promise<IProcess | null> {
    const process = await this.findById<IProcess>(processId);
    if (!process) {
      throw new Error('Processo não encontrado');
    }

    if (process.status === 'CONCLUIDO' || process.status === 'ARQUIVADO') {
      throw new Error('Não é possível tramitar processo concluído ou arquivado');
    }

    const setorOrigem = process.setor_atual;
    
    // Atualizar processo
    const updatedProcess = await this.update<IProcess>(processId, {
      setor_atual: setorDestino,
      status: 'EM_ANDAMENTO'
    });

    // Registrar no histórico
    const historyData: any = {
      setor_destino: setorDestino
    };
    
    if (setorOrigem) {
      historyData.setor_origem = setorOrigem;
    }
    
    if (observacoes) {
      historyData.observacoes = observacoes;
    }
    
    await this.addToHistory(processId, usuarioId, 'TRAMITACAO', historyData);

    return updatedProcess;
  }

  /**
   * Alterar status do processo
   */
  static async changeStatus(
    processId: number,
    usuarioId: number,
    novoStatus: IProcess['status'],
    observacoes?: string
  ): Promise<IProcess | null> {
    const process = await this.findById<IProcess>(processId);
    if (!process) {
      throw new Error('Processo não encontrado');
    }

    const statusAntigo = process.status;
    const updateData: Partial<IProcess> = { status: novoStatus };

    // Se concluindo, definir data de conclusão
    if (novoStatus === 'CONCLUIDO') {
      updateData.data_conclusao = new Date();
    }

    const updatedProcess = await this.update<IProcess>(processId, updateData);

    // Registrar no histórico
    await this.addToHistory(processId, usuarioId, 'MUDANCA_STATUS', {
      observacoes: `Status alterado de ${statusAntigo} para ${novoStatus}. ${observacoes || ''}`
    });

    return updatedProcess;
  }

  /**
   * Alterar prioridade do processo
   */
  static async changePriority(
    processId: number,
    usuarioId: number,
    novaPrioridade: IProcess['prioridade'],
    observacoes?: string
  ): Promise<IProcess | null> {
    const process = await this.findById<IProcess>(processId);
    if (!process) {
      throw new Error('Processo não encontrado');
    }

    const prioridadeAntiga = process.prioridade;
    const updatedProcess = await this.update<IProcess>(processId, { prioridade: novaPrioridade });

    // Registrar no histórico
    await this.addToHistory(processId, usuarioId, 'MUDANCA_PRIORIDADE', {
      observacoes: `Prioridade alterada de ${prioridadeAntiga} para ${novaPrioridade}. ${observacoes || ''}`
    });

    return updatedProcess;
  }

  /**
   * Atribuir responsável
   */
  static async assignResponsible(
    processId: number,
    usuarioId: number,
    responsavelId: number,
    observacoes?: string
  ): Promise<IProcess | null> {
    const updatedProcess = await this.update<IProcess>(processId, { 
      usuario_responsavel: responsavelId 
    });

    // Registrar no histórico
    await this.addToHistory(processId, usuarioId, 'ATRIBUICAO', {
      observacoes: `Responsável atribuído: ${responsavelId}. ${observacoes || ''}`
    });

    return updatedProcess;
  }

  /**
   * Buscar processos por usuário criador
   */
  static async findByCreator(
    usuarioId: number,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IProcess>> {
    return await this.findProcesses({ usuario_criador: usuarioId }, pagination);
  }

  /**
   * Buscar processos por responsável
   */
  static async findByResponsible(
    usuarioId: number,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IProcess>> {
    return await this.findProcesses({ usuario_responsavel: usuarioId }, pagination);
  }

  /**
   * Buscar processos por setor
   */
  static async findBySetor(
    setor: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IProcess>> {
    return await this.findProcesses({ setor_atual: setor }, pagination);
  }

  /**
   * Buscar processos em atraso
   */
  static async findOverdue(
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IProcess>> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE data_prazo < SYSDATE 
        AND status NOT IN ('CONCLUIDO', 'ARQUIVADO')
    `;
    
    return await this.queryWithPagination<IProcess>(sql, {}, pagination);
  }

  /**
   * Buscar processos vencendo hoje
   */
  static async findDueToday(
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IProcess>> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE TRUNC(data_prazo) = TRUNC(SYSDATE)
        AND status NOT IN ('CONCLUIDO', 'ARQUIVADO')
    `;
    
    return await this.queryWithPagination<IProcess>(sql, {}, pagination);
  }

  /**
   * Buscar processos vencendo na próxima semana
   */
  static async findDueThisWeek(
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IProcess>> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE data_prazo BETWEEN SYSDATE AND SYSDATE + 7
        AND status NOT IN ('CONCLUIDO', 'ARQUIVADO')
    `;
    
    return await this.queryWithPagination<IProcess>(sql, {}, pagination);
  }

  /**
   * Buscar por tags
   */
  static async findByTags(
    tags: string[],
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IProcess>> {
    const conditions = tags.map((_, index) => 
      `UPPER(tags) LIKE UPPER(:tag${index})`
    ).join(' OR ');

    const binds: any = {};
    tags.forEach((tag, index) => {
      binds[`tag${index}`] = `%${tag}%`;
    });

    const sql = `SELECT * FROM ${this.tableName} WHERE (${conditions})`;
    
    return await this.queryWithPagination<IProcess>(sql, binds, pagination);
  }

  /**
   * Obter estatísticas de processos
   */
  static async getProcessStats(): Promise<IProcessStats> {
    // Estatísticas gerais
    const generalSql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN data_prazo < SYSDATE AND status NOT IN ('CONCLUIDO', 'ARQUIVADO') THEN 1 ELSE 0 END) as em_atraso,
        SUM(CASE WHEN TRUNC(data_prazo) = TRUNC(SYSDATE) AND status NOT IN ('CONCLUIDO', 'ARQUIVADO') THEN 1 ELSE 0 END) as vencendo_hoje,
        SUM(CASE WHEN data_prazo BETWEEN SYSDATE AND SYSDATE + 7 AND status NOT IN ('CONCLUIDO', 'ARQUIVADO') THEN 1 ELSE 0 END) as vencendo_semana,
        SUM(NVL(valor_estimado, 0)) as valor_total
      FROM ${this.tableName}
    `;

    const generalResult = await this.query(generalSql);
    const general = generalResult[0] as any;

    // Por status
    const statusSql = `
      SELECT status, COUNT(*) as count 
      FROM ${this.tableName} 
      GROUP BY status
    `;
    const statusResult = await this.query(statusSql);
    const porStatus: { [key: string]: number } = {};
    statusResult.forEach((row: any) => {
      porStatus[row.STATUS] = row.COUNT;
    });

    // Por prioridade
    const prioridadeSql = `
      SELECT prioridade, COUNT(*) as count 
      FROM ${this.tableName} 
      GROUP BY prioridade
    `;
    const prioridadeResult = await this.query(prioridadeSql);
    const porPrioridade: { [key: string]: number } = {};
    prioridadeResult.forEach((row: any) => {
      porPrioridade[row.PRIORIDADE] = row.COUNT;
    });

    // Por tipo
    const tipoSql = `
      SELECT tipo_processo, COUNT(*) as count 
      FROM ${this.tableName} 
      GROUP BY tipo_processo
    `;
    const tipoResult = await this.query(tipoSql);
    const porTipo: { [key: string]: number } = {};
    tipoResult.forEach((row: any) => {
      porTipo[row.TIPO_PROCESSO] = row.COUNT;
    });

    // Por setor
    const setorSql = `
      SELECT setor_atual, COUNT(*) as count 
      FROM ${this.tableName} 
      WHERE setor_atual IS NOT NULL
      GROUP BY setor_atual
    `;
    const setorResult = await this.query(setorSql);
    const porSetor: { [key: string]: number } = {};
    setorResult.forEach((row: any) => {
      porSetor[row.SETOR_ATUAL] = row.COUNT;
    });

    return {
      total: general.TOTAL || 0,
      porStatus,
      porPrioridade,
      porTipo,
      porSetor,
      emAtraso: general.EM_ATRASO || 0,
      vencendoHoje: general.VENCENDO_HOJE || 0,
      vencendoSemana: general.VENCENDO_SEMANA || 0,
      valorTotal: general.VALOR_TOTAL || 0
    };
  }

  /**
   * Obter histórico de tramitação
   */
  static async getProcessHistory(
    processId: number,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<IProcessHistory>> {
    const sql = `
      SELECT h.*, u.nome as usuario_nome
      FROM processo_historico h
      LEFT JOIN usuarios u ON h.usuario_id = u.id
      WHERE h.processo_id = :processId
      ORDER BY h.data_acao DESC
    `;
    
    return await this.queryWithPagination<IProcessHistory>(sql, { processId }, pagination);
  }

  /**
   * Gerar número do processo
   */
  private static async generateProcessNumber(): Promise<string> {
    const year = new Date().getFullYear();
    
    // Buscar último número do ano
    const sql = `
      SELECT MAX(CAST(SUBSTR(numero_processo, 1, INSTR(numero_processo, '/') - 1) AS NUMBER)) as ultimo_numero
      FROM ${this.tableName}
      WHERE numero_processo LIKE '%/${year}'
    `;
    
    const result = await this.query(sql);
    const ultimoNumero = (result[0] as any)?.ULTIMO_NUMERO || 0;
    const proximoNumero = ultimoNumero + 1;
    
    return `${proximoNumero.toString().padStart(6, '0')}/${year}`;
  }

  /**
   * Adicionar ao histórico
   */
  private static async addToHistory(
    processId: number,
    usuarioId: number,
    acao: string,
    options: {
      setor_origem?: string;
      setor_destino?: string;
      observacoes?: string;
    } = {}
  ): Promise<void> {
    const sql = `
      INSERT INTO processo_historico 
      (processo_id, usuario_id, acao, setor_origem, setor_destino, observacoes, data_acao)
      VALUES (:processo_id, :usuario_id, :acao, :setor_origem, :setor_destino, :observacoes, SYSDATE)
    `;
    
    await this.query(sql, {
      processo_id: processId,
      usuario_id: usuarioId,
      acao,
      setor_origem: options.setor_origem || null,
      setor_destino: options.setor_destino || null,
      observacoes: options.observacoes || null
    });
  }

  /**
   * Validar dados do processo
   */
  private static async validateProcessData(
    data: Partial<IProcess>,
    excludeId?: number
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validar assunto
    if (data.assunto !== undefined) {
      if (!data.assunto || data.assunto.trim().length < 5) {
        errors.push('Assunto deve ter pelo menos 5 caracteres');
      }
    }

    // Validar número do processo (se fornecido)
    if (data.numero_processo !== undefined) {
      const existing = await this.findByNumber(data.numero_processo);
      if (existing && existing.id !== excludeId) {
        errors.push('Número do processo já existe');
      }
    }

    // Validar tipo de processo
    if (data.tipo_processo !== undefined) {
      if (!data.tipo_processo || data.tipo_processo.trim().length < 2) {
        errors.push('Tipo de processo é obrigatório');
      }
    }

    // Validar prioridade
    if (data.prioridade !== undefined) {
      const prioridadesValidas = ['BAIXA', 'NORMAL', 'ALTA', 'URGENTE'];
      if (!prioridadesValidas.includes(data.prioridade)) {
        errors.push('Prioridade inválida');
      }
    }

    // Validar status
    if (data.status !== undefined) {
      const statusValidos = ['ABERTO', 'EM_ANDAMENTO', 'SUSPENSO', 'CONCLUIDO', 'ARQUIVADO'];
      if (!statusValidos.includes(data.status)) {
        errors.push('Status inválido');
      }
    }

    // Validar datas
    if (data.data_prazo && data.data_abertura) {
      if (new Date(data.data_prazo) < new Date(data.data_abertura)) {
        errors.push('Data de prazo não pode ser anterior à data de abertura');
      }
    }

    // Validar valor estimado
    if (data.valor_estimado !== undefined && data.valor_estimado < 0) {
      errors.push('Valor estimado não pode ser negativo');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default ProcessModel;