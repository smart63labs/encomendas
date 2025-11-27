// Tipos e interfaces compartilhadas para o módulo de Configurações

// ============================================================================
// INTERFACES DE DADOS
// ============================================================================

export interface Usuario {
    ID?: number;
    id?: number;
    NOME?: string;
    nome?: string;
    NAME?: string;
    E_MAIL?: string;
    EMAIL?: string;
    email?: string;
    PHONE?: string;
    TELEFONE?: string;
    ROLE?: 'ADMIN' | 'USER' | 'SUPERVISOR';
    perfil?: string;
    MATRICULA?: number;
    matricula?: string;
    numero_funcional?: string;
    numeroFuncional?: string;
    VINCULO_FUNCIONAL?: number;
    vinculo_funcional?: string;
    vinculoFuncional?: string;
    SETOR_ID?: number;
    setor_id?: string;
    IS_ACTIVE?: number;
    USUARIO_ATIVO?: boolean;
    usuario_ativo?: boolean;
    ativo?: boolean;
    CPF?: number;
    cpf?: string;
    'pis/pasep'?: string;
    PIS_PASEP?: number;
    SEXO?: 'M' | 'F';
    sexo?: string;
    ESTADO_CIVIL?: string;
    estado_civil?: string;
    DATA_NASCIMENTO?: Date | string;
    data_nascimento?: string;
    PAI?: string;
    pai?: string;
    MAE?: string;
    mae?: string;
    RG?: string;
    rg?: string;
    TIPO_RG?: string;
    tipo_rg?: string;
    ORGAO_EXPEDITOR?: string;
    orgao_expeditor?: string;
    UF_RG?: string;
    uf_rg?: string;
    EXPEDICAO_RG?: Date | string;
    expedicao_rg?: string;
    CIDADE_NASCIMENTO?: string;
    cidade_nascimento?: string;
    UF_NASCIMENTO?: string;
    uf_nascimento?: string;
    TIPO_SANGUINEO?: string;
    tipo_sanguineo?: string;
    RACA_COR?: string;
    raca_cor?: string;
    PNE?: string | number;
    pne?: number;
    TIPO_VINCULO?: string;
    tipo_vinculo?: string;
    CATEGORIA?: string;
    categoria?: string;
    REGIME_JURIDICO?: string;
    regime_juridico?: string;
    REGIME_PREVIDENCIARIO?: string;
    regime_previdenciario?: string;
    EVENTO_TIPO?: string;
    evento_tipo?: string;
    FORMA_PROVIMENTO?: string;
    forma_provimento?: string;
    CODIGO_CARGO?: string;
    codigo_cargo?: string;
    CARGO?: string;
    cargo?: string;
    ESCOLARIDADE_CARGO?: string;
    escolaridade_cargo?: string;
    ESCOLARIDADE_SERVIDOR?: string;
    escolaridade_servidor?: string;
    FORMACAO_PROFISSIONAL_1?: string;
    formacao_profissional_1?: string;
    FORMACAO_PROFISSIONAL_2?: string;
    formacao_profissional_2?: string;
    JORNADA?: string;
    jornada?: string;
    NIVEL_REFERENCIA?: string;
    nivel_referencia?: string;
    COMISSAO_FUNCAO?: string;
    comissao_funcao?: string;
    DATA_INI_COMISSAO?: Date | string;
    data_ini_comissao?: string;
    ENDERECO?: string;
    endereco?: string;
    NUMERO_ENDERECO?: string;
    numero_endereco?: string;
    COMPLEMENTO_ENDERECO?: string;
    complemento_endereco?: string;
    BAIRRO_ENDERECO?: string;
    bairro_endereco?: string;
    CIDADE_ENDERECO?: string;
    cidade_endereco?: string;
    UF_ENDERECO?: string;
    uf_endereco?: string;
    CEP_ENDERECO?: string;
    cep_endereco?: string;
    DATA_CRIACAO?: Date | string;
    CREATED_AT?: Date | string;
    created_at?: Date | string;
    createdAt?: Date | string;
    DATA_ATUALIZACAO?: Date | string;
    BLOQUEADO_ATE?: Date | string;
    TENTATIVAS_LOGIN?: number;
    NOME_SETOR?: string;
    SETOR?: string;
    setor?: string;
    setorNome?: string;
    SETOR_NOME?: string;
    setor_nome?: string;
    department?: string;
    CODIGO_SETOR?: string;
    ORGAO?: string;
    senha?: string;
    role?: string;
}

export interface Setor {
    ID: number;
    id?: number;
    NOME_SETOR: string;
    SETOR?: string;
    CODIGO_SETOR?: string;
    CODIGO?: string;
    ORGAO?: string;
    COLUNA1?: string;
    LOGRADOURO?: string;
    NUMERO?: string;
    COMPLEMENTO?: string;
    BAIRRO?: string;
    CIDADE?: string;
    ESTADO?: string;
    CEP?: string;
    LATITUDE?: number;
    LONGITUDE?: number;
    TELEFONE?: string;
    EMAIL?: string;
    ATIVO?: boolean;
}

export interface Lacre {
    id: string;
    codigo: string;
    CODIGO?: string;
    status: 'disponivel' | 'atribuido' | 'reservado' | 'vinculado' | 'utilizado' | 'extraviado' | 'danificado' | 'destruido';
    setorId?: number | string;
    setorNome?: string;
    encomendaId?: number | string;
    loteNumero?: string;
    motivoDestruicao?: string;
    historico?: Array<{ data: string; acao: string; detalhes: string }>;
}

export interface Malote {
    ID: number;
    numeroMalote: string;
    numeroContrato?: string;
    setorOrigemId?: number;
    setorOrigemNome?: string;
    setorDestinoId?: number;
    setorDestinoNome?: string;
    percurso?: string;
    numeroPercurso?: string;
    codigoEmissao?: string;
    dataEmissao?: Date | string;
    validade?: Date | string;
    dataValidade?: Date | string;
    estacao?: string;
    ativo?: boolean;
    cepOrigem?: string;
    cepDestino?: string;
    ida?: string;
    tamanho?: string;
    diasServico?: string;
    distritos?: string;
    setorOrigemLogradouro?: string;
    setorOrigemNumero?: string;
    setorOrigemComplemento?: string;
    setorOrigemBairro?: string;
    setorOrigemCidade?: string;
    setorOrigemEstado?: string;
    setorOrigemLatitude?: number;
    setorOrigemLongitude?: number;
    setorDestinoLogradouro?: string;
    setorDestinoNumero?: string;
    setorDestinoComplemento?: string;
    setorDestinoBairro?: string;
    setorDestinoCidade?: string;
    setorDestinoEstado?: string;
    setorDestinoLatitude?: number;
    setorDestinoLongitude?: number;
}

// ============================================================================
// INTERFACES DE FORMULÁRIOS
// ============================================================================

export interface SetorFormData {
    codigoSetor: string;
    nomeSetor: string;
    orgao: string;
    telefone: string;
    email: string;
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    latitude: number | null;
    longitude: number | null;
    semNumero: boolean;
    ativo: boolean;
}

export interface LacreFormData {
    prefixo: string;
    inicio: number;
    fim: number | undefined;
    loteNumero: string;
}

export interface DistribuicaoLacreFormData {
    setorId: string;
    quantidade: number;
    modo: 'manual' | 'auto';
}

export interface DestruicaoLacreFormData {
    loteNumero: string;
    motivo: string;
}

export interface DestruicaoLacreIndividualFormData {
    motivo: string;
    status: 'destruido' | 'extraviado' | 'danificado';
}

export interface EditarLacreFormData {
    status: string;
    setorId: string;
}

export interface MaloteFormData {
    numeroMalote: string;
    numeroContrato: string;
    percurso: string;
    codigoEmissao: string;
    dataEmissao: string;
    validade: string;
    estacao: string;
    distritos: string;
    ida: string;
    tamanho: string;
    diasServico: string;
    cepOrigem: string;
    cepDestino: string;
}

// ============================================================================
// INTERFACES DE CONFIGURAÇÕES
// ============================================================================

export interface ConfigGeral {
    SISTEMA_NOME: string;
    nomeInstituicao: string;
    HUB_SETOR_ID: number | string;
    [key: string]: any;
}

export interface ConfigSeguranca {
    [key: string]: any;
}

export interface ConfigAutenticacao {
    LDAP_ENABLED: boolean;
    LDAP_URL: string;
    LDAP_BASE_DN: string;
    LDAP_BIND_DN: string;
    LDAP_BIND_PASSWORD: string;
    [key: string]: any;
}

export interface ConfigNotificacoes {
    [key: string]: any;
}

export interface ConfigSistema {
    [key: string]: any;
}

export interface ConfigAparencia {
    [key: string]: any;
}

export interface ConfigApis {
    GOOGLE_MAPS_API_KEY: string;
    [key: string]: any;
}

// ============================================================================
// INTERFACES DE FILTROS E PAGINAÇÃO
// ============================================================================

export interface FiltrosUsuarios {
    searchTerm: string;
    statusFilter: 'todos' | 'ativo' | 'inativo';
    perfilFilter: string;
}

export interface FiltrosSetores {
    searchTerm: string;
    statusFilter: 'todos' | 'ativo' | 'inativo';
    orgaoFilter: string;
}

export interface FiltrosLacres {
    status: string;
    setorId: string;
    busca: string;
}

export interface SortConfig {
    key: string;
    direction: 'asc' | 'desc';
}

export interface PaginationConfig {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
}

// ============================================================================
// TIPOS DE PROPS PARA COMPONENTES
// ============================================================================

export interface ConfigTabBaseProps {
    onRefresh?: () => void;
}

export interface ConfigUsuariosTabProps extends ConfigTabBaseProps {
    usuarios: Usuario[];
    setores: Setor[];
    refreshTrigger?: number;
}

export interface ConfigSetoresTabProps extends ConfigTabBaseProps {
    setores: Setor[];
    refreshTrigger?: number;
}

export interface ConfigLacreTabProps extends ConfigTabBaseProps {
    lacres: Lacre[];
    setores: Setor[];
    refreshTrigger?: number;
}

export interface ConfigMaloteTabProps extends ConfigTabBaseProps {
    malotes: Malote[];
    setores: Setor[];
    refreshTrigger?: number;
}

export interface ConfigGeralTabProps extends ConfigTabBaseProps {
    config: ConfigGeral;
    setores: Setor[];
    onSave: (config: ConfigGeral) => Promise<void>;
}

export interface ConfigSegurancaTabProps extends ConfigTabBaseProps {
    config: ConfigSeguranca;
    onSave: (config: ConfigSeguranca) => Promise<void>;
}

export interface ConfigAutenticacaoTabProps extends ConfigTabBaseProps {
    config: ConfigAutenticacao;
    onSave: (config: ConfigAutenticacao) => Promise<void>;
}

export interface ConfigNotificacoesTabProps extends ConfigTabBaseProps {
    config: ConfigNotificacoes;
    onSave: (config: ConfigNotificacoes) => Promise<void>;
}

export interface ConfigSistemaTabProps extends ConfigTabBaseProps {
    config: ConfigSistema;
    onSave: (config: ConfigSistema) => Promise<void>;
}

export interface ConfigAparenciaTabProps extends ConfigTabBaseProps {
    config: ConfigAparencia;
    onSave: (config: ConfigAparencia) => Promise<void>;
}

export interface ConfigApisTabProps extends ConfigTabBaseProps {
    config: ConfigApis;
    onSave: (config: ConfigApis) => Promise<void>;
}

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

export type ViewMode = 'grid' | 'list';

export type LacreStatus = 'disponivel' | 'atribuido' | 'reservado' | 'vinculado' | 'utilizado' | 'extraviado' | 'danificado' | 'destruido';

export type DistribuicaoModo = 'manual' | 'auto';

export type DestruicaoStatus = 'destruido' | 'extraviado' | 'danificado';
