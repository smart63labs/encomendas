import { BaseModel, SearchFilters, PaginationOptions, PaginatedResult } from './base.model';

/**
 * Interface para dados do setor
 */
export interface ISetor {
  id?: number;
  codigo_setor: string;
  nome_setor: string;
  orgao?: string;
  ativo: boolean;
  logradouro?: string;
  numero?: string;
  coluna1?: string; // Campo genérico conforme nova estrutura
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  data_criacao?: Date;
  data_atualizacao?: Date;
  latitude?: number;
  longitude?: number;
}

/**
 * Interface para filtros de setor
 */
export interface ISetorFilters extends SearchFilters {
  codigo_setor?: string;
  orgao?: string;
  nome_setor?: string;
  ativo?: boolean;
  cidade?: string;
  estado?: string;
}

/**
 * Modelo de Setor
 * Gerencia dados organizacionais dos setores
 */
export class SetorModel extends BaseModel {
  protected static override tableName = 'setores';
  protected static override primaryKey = 'id';
  protected static override fillable = [
    'codigo_setor', 'nome_setor', 'orgao', 'ativo', 'logradouro', 'numero',
    'coluna1', 'bairro', 'cidade', 'estado', 'cep', 'telefone', 'email',
    'latitude', 'longitude'
  ];
  // Desabilita timestamps automáticos (updated_at/created_at) para evitar erro ORA-00904
  // A tabela SETORES utiliza campos como DATA_ATUALIZACAO e DATA_CRIACAO, com trigger no banco
  // para atualização automática. Portanto, não devemos injetar UPDATED_AT/CREATED_AT via BaseModel.
  protected static override timestamps = false;

  /**
   * Buscar setores com filtros específicos
   */
  static async findSetores(
    filters: ISetorFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<ISetor>> {
    return await this.findAll<ISetor>(filters, pagination);
  }

  /**
   * Buscar setor por código
   */
  static async findByCodigoSetor(codigoSetor: string): Promise<ISetor | null> {
    return await this.findOne<ISetor>({ codigo_setor: codigoSetor });
  }

  /**
   * Buscar setores por órgão
   */
  static async findByOrgao(
    orgao: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<ISetor>> {
    return await this.findSetores({ orgao }, pagination);
  }

  /**
   * Buscar setores por nome do setor
   */
  static async findBySetor(
    setor: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<ISetor>> {
    return await this.findSetores({ setor }, pagination);
  }

  /**
   * Buscar setores por lotação
   */
  static async findByLotacao(
    lotacao: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<ISetor>> {
    return await this.findSetores({ lotacao }, pagination);
  }

  /**
   * Buscar setores por hierarquia
   */
  static async findByHierarquia(
    hierarquia: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<ISetor>> {
    return await this.findSetores({ hierarquia_setor: hierarquia }, pagination);
  }

  /**
   * Buscar setores ativos
   */
  static async findActiveSetores(
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<ISetor>> {
    return await this.findSetores({ ativo: true }, pagination);
  }

  /**
   * Buscar setores por nome (busca parcial)
   */
  static async searchByName(
    nome: string,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<ISetor>> {
    const sql = `
      SELECT * FROM ${this.tableName}
      WHERE (UPPER(nome_setor) LIKE UPPER(:search) OR UPPER(orgao) LIKE UPPER(:search))
      AND ativo = 1
      ORDER BY orgao, nome_setor
    `;

    const searchTerm = `%${nome}%`;
    const result = await this.query<ISetor>(sql, { search: searchTerm });

    return {
      data: result,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total: result.length,
        pages: Math.ceil(result.length / (pagination.limit || 10))
      }
    };
  }

  /**
   * Obter hierarquia completa de um setor
   */
  static async getHierarquiaCompleta(codigoSetor: string): Promise<{
    orgao: string | undefined;
    setor: string;
    lotacao?: string;
    hierarquia: string;
  } | null> {
    const setor = await this.findByCodigoSetor(codigoSetor);
    if (!setor) {
      return null;
    }

    return {
      orgao: setor.orgao,
      setor: setor.nome_setor,
      hierarquia: `${setor.orgao || ''} > ${setor.nome_setor}`
    };
  }

  /**
   * Criar novo setor
   */
  static async createSetor(setorData: Omit<ISetor, 'id' | 'created_at' | 'updated_at'>): Promise<ISetor> {
    // Validar se já existe um setor com o mesmo código
    const existingSetor = await this.findByCodigoSetor(setorData.codigo_setor);
    if (existingSetor) {
      throw new Error(`Já existe um setor com o código: ${setorData.codigo_setor}`);
    }

    return await this.create<ISetor>({
      ...setorData,
      ativo: setorData.ativo !== undefined ? setorData.ativo : true
    });
  }

  /**
   * Atualizar setor
   */
  static async updateSetor(id: number, setorData: Partial<ISetor>): Promise<ISetor | null> {
    // Se está atualizando o código do setor, verificar se não existe outro com o mesmo código
    if (setorData.codigo_setor) {
      const existingSetor = await this.findByCodigoSetor(setorData.codigo_setor);
      if (existingSetor && existingSetor.id !== id) {
        throw new Error(`Já existe um setor com o código: ${setorData.codigo_setor}`);
      }
    }

    return await this.update<ISetor>(id, setorData);
  }

  /**
   * Ativar/Desativar setor
   */
  static async toggleSetorStatus(setorId: number, ativo: boolean): Promise<ISetor | null> {
    return await this.update<ISetor>(setorId, { ativo });
  }

  /**
   * Obter estatísticas dos setores
   */
  static async getSetorStats(): Promise<{
    total: number;
    ativos: number;
    inativos: number;
    porOrgao: { [key: string]: number };
    porMunicipio: { [key: string]: number };
  }> {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN ativo = 1 THEN 1 ELSE 0 END) as ativos,
        SUM(CASE WHEN ativo = 0 THEN 1 ELSE 0 END) as inativos
      FROM ${this.tableName}
    `;

    const statsResult = await this.query(sql);
    const stats = statsResult[0] || { total: 0, ativos: 0, inativos: 0 };

    // Estatísticas por órgão
    const orgaoSql = `
      SELECT orgao, COUNT(*) as count
      FROM ${this.tableName}
      WHERE ativo = 1
      GROUP BY orgao
      ORDER BY count DESC
    `;
    const orgaoStats = await this.query(orgaoSql);
    const porOrgao: { [key: string]: number } = {};
    orgaoStats.forEach((row: any) => {
      porOrgao[row.orgao] = parseInt(row.count);
    });

    // Estatísticas por município
    const municipioSql = `
      SELECT municipio_lotacao, COUNT(*) as count
      FROM ${this.tableName}
      WHERE ativo = 1 AND municipio_lotacao IS NOT NULL
      GROUP BY municipio_lotacao
      ORDER BY count DESC
    `;
    const municipioStats = await this.query(municipioSql);
    const porMunicipio: { [key: string]: number } = {};
    municipioStats.forEach((row: any) => {
      porMunicipio[row.municipio_lotacao] = parseInt(row.count);
    });

    return {
      total: parseInt(stats.total),
      ativos: parseInt(stats.ativos),
      inativos: parseInt(stats.inativos),
      porOrgao,
      porMunicipio
    };
  }
}

export default SetorModel;