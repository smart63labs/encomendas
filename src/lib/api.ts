import axios from 'axios';
import { API_CONFIG, getApiCandidateBaseUrls } from '@/config/api.config';

// Configuração base da API
const API_BASE_URL = API_CONFIG.baseURL;

// Criar instância do axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers,
});

// Utilitário para obter próxima baseURL alternativa
const getNextBaseUrl = (currentBase?: string): string | undefined => {
  const candidates = getApiCandidateBaseUrls();
  // Tentar próxima diferente da atual
  const next = candidates.find((c) => c !== currentBase);
  return next;
};

// Interceptor para adicionar token de autenticação
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
apiClient.interceptors.response.use(
  (response: any) => {
    return response;
  },
  (error: any) => {
    // Fallback automático em caso de erro de rede (ex.: ECONNREFUSED)
    const isNetworkError = error.code === 'ERR_NETWORK' || error.message === 'Network Error';
    const hasNoResponse = !error.response;
    const config = error.config || {};
    const retryCount = config.__retryAttempt || 0;

    if (isNetworkError && hasNoResponse && retryCount < 1) {
      const currentBase = config.baseURL || apiClient.defaults.baseURL;
      const nextBase = getNextBaseUrl(currentBase);
      if (nextBase) {
        // Preparar retry com base alternativa
        const newConfig = {
          ...config,
          baseURL: nextBase,
          __retryAttempt: retryCount + 1,
        };
        // Atualizar default para próximas requisições
        apiClient.defaults.baseURL = nextBase;
        return apiClient.request(newConfig);
      }
    }

    // Tratar erro de autenticação
    if (error.response?.status === 401) {
      // Não redirecionar para login se for o endpoint de teste LDAP
      const isLdapTestEndpoint = error.config?.url?.includes('/ldap/test-user-authentication');

      if (!isLdapTestEndpoint) {
        localStorage.removeItem('auth_token');
        // Redirecionar para login se necessário
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    // Tratar outros erros
    console.error('Erro na API:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Interface para resposta padrão da API
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Classe principal da API
class ApiService {
  private client: any;

  constructor() {
    this.client = apiClient;
  }

  // Métodos HTTP básicos
  async get<T = any>(url: string, params?: any): Promise<any> {
    return this.client.get(url, { params });
  }

  async post<T = any>(url: string, data?: any): Promise<any> {
    return this.client.post(url, data);
  }

  async put<T = any>(url: string, data?: any): Promise<any> {
    return this.client.put(url, data);
  }

  async patch<T = any>(url: string, data?: any): Promise<any> {
    return this.client.patch(url, data);
  }

  async delete<T = any>(url: string): Promise<any> {
    return this.client.delete(url);
  }

  // Métodos específicos para usuários
  async searchUsersAndSectors(query: string, limit?: number) {
    // Nova função para busca combinada de usuários e setores
    const params: any = { q: query };
    if (limit) params.limit = limit;
    return this.get('/users/search-users-and-sectors', params);
  }

  async getUsersBySetor(setor: string) {
    // Alinha com backend: GET /api/users/setor/:setor
    return this.get(`/users/setor/${encodeURIComponent(setor)}`);
  }

  async getUsersByOrgao(orgao: string) {
    // Alinha com backend: GET /api/users/orgao/${encodeURIComponent(orgao)}
    return this.get(`/users/orgao/${encodeURIComponent(orgao)}`);
  }

  async getUsersWithOrgData() {
    return this.get('/users/with-org-data');
  }

  // Métodos CRUD de usuários
  async listUsers(params?: any) {
    return this.get('/users', params);
  }

  async getUserById(id: string | number) {
    return this.get(`/users/${id}`);
  }

  async createUser(data: any) {
    return this.post('/users', data);
  }

  async updateUser(id: string | number, data: any) {
    return this.put(`/users/${id}`, data);
  }

  async deleteUser(id: string | number) {
    return this.delete(`/users/${id}`);
  }

  async deleteMultipleUsers(ids: number[]) {
    return this.post('/users/delete-multiple', { ids });
  }

  async getUserStats() {
    return this.get('/users/stats');
  }

  // Métodos específicos para setores
  async getSetores(params?: any) {
    return this.get('/setores', params);
  }

  async searchSetores(params: { nome?: string; orgao?: string; ativo?: boolean } = {}) {
    return this.get('/setores/search', params);
  }

  async getSetoresByHierarquia(hierarquia: string) {
    return this.get(`/setores/hierarquia/${encodeURIComponent(hierarquia)}`);
  }

  async getSetoresAtivos() {
    return this.get('/setores/ativos');
  }

  async getSetoresStats() {
    return this.get('/setores/stats');
  }

  async getSetorById(id: string | number) {
    return this.get(`/setores/${id}`);
  }

  // Métodos para encomendas
  async getEncomendas(params?: any) {
    return this.get('/encomendas', params);
  }

  async createEncomenda(data: any) {
    return this.post('/encomendas', data);
  }

  async getEncomendaById(id: string) {
    return this.get(`/encomendas/${id}`);
  }

  async updateEncomenda(id: string, data: any) {
    return this.put(`/encomendas/${id}`, data);
  }

  async deleteEncomenda(id: string) {
    return this.delete(`/encomendas/${id}`);
  }

  async getEncomendaStats() {
    return this.get('/encomendas/stats');
  }

  // Assina atualizações em tempo real de encomendas via SSE
  subscribeEncomendas(
    onMessage: (event: MessageEvent) => void,
    onError?: (event: Event) => void
  ): EventSource {
    const streamUrl = `${API_BASE_URL}/encomendas/stream`;
    // Nota: EventSource não suporta headers customizados, então não enviamos token
    const es = new EventSource(streamUrl);
    es.addEventListener('encomendas:update', (e) => {
      try {
        onMessage(e as MessageEvent);
      } catch (err) {
        console.error('Erro ao processar mensagem SSE de encomendas:', err);
      }
    });
    es.onerror = (e) => {
      console.error('SSE error em encomendas:', e);
      if (onError) onError(e);
    };
    return es;
  }

  // Método para upload de arquivos
  async uploadFile(file: File, data?: any): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    if (data) {
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });
    }

    return this.client.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Métodos para Malotes
  async listMalotes(params?: any) {
    return this.get('/malotes', params);
  }

  async listMalotesDisponiveis(params?: { setorDestinoId?: number | string; setorId?: number | string; setorOrigemId?: number | string }) {
    return this.get('/malotes/disponiveis', params);
  }

  async listMalotesStatusEventos(params?: { setorDestinoId?: number | string; setorId?: number | string; setorOrigemId?: number | string }) {
    return this.get('/malotes/status-eventos', params);
  }

  async mapMalotes() {
    return this.get('/malotes/mapa');
  }

  async countMalotes(params?: any) {
    return this.get('/malotes/count', params);
  }

  async getMaloteById(id: string | number) {
    return this.get(`/malotes/${id}`);
  }

  async createMalote(data: any) {
    return this.post('/malotes', data);
  }

  async updateMalote(id: string | number, data: any) {
    return this.put(`/malotes/${id}`, data);
  }

  async deleteMalote(id: string | number) {
    return this.delete(`/malotes/${id}`);
  }

  // Métodos específicos para configurações LDAP
  async salvarConfiguracoesLdap(dados: any) {
    return this.post('/ldap-config/salvar', dados);
  }

  async buscarConfiguracoesLdap() {
    return this.get('/ldap-config/buscar');
  }

  // Método para health check
  async healthCheck() {
    return this.get('/health');
  }

  // Método para obter informações da API
  async getApiInfo() {
    return this.get('/info');
  }

  // Métodos para Lacres
  async listLacres(params?: { page?: number; limit?: number; search?: string; status?: string; setorId?: string; lote?: string }) {
    return this.get('/lacres', params);
  }

  async generateLacres(data: { prefixo: string; inicio: number; fim: number; loteNumero?: string }) {
    return this.post('/lacres/generate', data);
  }

  async updateLacre(id: number | string, data: { status?: string; setorId?: number | null; encomendaId?: number | null; motivoDestruicao?: string }) {
    return this.put(`/lacres/${id}`, data);
  }

  async deleteLacre(id: number | string) {
    return this.delete(`/lacres/${id}`);
  }

  async distribuirLacresManual(data: { setorId: number | string; quantidade: number }) {
    return this.post('/lacres/distribuir/manual', data);
  }

  async distribuirLacresAuto(data: { setorIds: Array<number | string>; totalLacres?: number | null }) {
    return this.post('/lacres/distribuir/auto', data);
  }

  async destruirLacresPorLote(data: { loteNumero: string; motivo?: string }) {
    return this.post('/lacres/destruir-por-lote', data);
  }

  // Métodos específicos para configurações
  async getConfiguracoes(filtros?: {
    categoria?: string;
    chave?: string;
    ativo?: boolean;
    editavel?: boolean;
    obrigatoria?: boolean;
    ordenarPor?: string;
    direcao?: 'ASC' | 'DESC';
    pagina?: number;
    limite?: number;
  }) {
    return this.get('/configuracoes', filtros);
  }

  async getConfiguracoesPorCategoria(categoria: string) {
    return this.get('/configuracoes', { categoria });
  }

  async getConfiguracaoPorChave(categoria: string, chave: string) {
    return this.get(`/configuracoes/${categoria}/${chave}`);
  }

  // Configurações específicas de APIs por configuracaoId
  async getConfiguracoesApis(configuracaoId: number) {
    return this.get(`/configuracoes/apis/${configuracaoId}`);
  }

  async salvarConfiguracoesApis(configuracaoId: number, dados: {
    googleMapsApiKey?: string;
    googleMapsAtivo?: boolean;
    cepApiUrl?: string;
    cepApiAtivo?: boolean;
    timeoutApi?: number;
    openRouteServiceApiKey?: string;
  }) {
    return this.put(`/configuracoes/apis/${configuracaoId}`, dados);
  }

  async criarConfiguracao(dados: {
    categoria: string;
    chave: string;
    valor: any;
    tipo?: string;
    descricao?: string;
    obrigatoria?: boolean;
    editavel?: boolean;
    ordemExibicao?: number;
  }) {
    return this.post('/configuracoes', dados);
  }

  async atualizarConfiguracao(id: number, dados: {
    valor?: any;
    descricao?: string;
    editavel?: boolean;
    ordemExibicao?: number;
    ativo?: boolean;
  }) {
    return this.put(`/configuracoes/${id}`, dados);
  }

  async atualizarMultiplasConfiguracoes(configuracoes: Array<{
    categoria: string;
    chave: string;
    valor: any;
    tipo?: string;
  }>) {
    return this.put('/configuracoes/batch', { configuracoes });
  }

  async removerConfiguracao(id: number) {
    return this.delete(`/configuracoes/${id}`);
  }

  async getCategorias() {
    return this.get('/configuracoes/categorias');
  }
}

// Instância singleton da API
export const api = new ApiService();

// Exportar também o cliente axios para uso direto se necessário
export { apiClient };

// Exportar tipos
export type { ApiResponse };

// Função utilitária para tratar erros da API
export const handleApiError = (error: any): string => {
  // Verificar se há resposta do servidor
  if (error.response?.data) {
    const apiError = error.response.data as ApiResponse;

    // Tratar especificamente erros de autorização (403)
    if (error.response.status === 403) {
      const rawError: any = (apiError as any).error;
      const messageFromErrorField = typeof rawError === 'string' ? rawError : rawError?.message;
      return messageFromErrorField || apiError.message || 'Acesso negado. Permissões insuficientes.';
    }

    // Tratar especificamente erros de autenticação (401)
    if (error.response.status === 401) {
      return apiError.error?.message || apiError.message || 'CPF ou senha inválidos. Verifique suas credenciais.';
    }

    // Tratar outros erros com mensagem específica
    const rawError: any = (apiError as any).error;
    const messageFromErrorField = typeof rawError === 'string' ? rawError : rawError?.message;
    return messageFromErrorField || apiError.message || 'Erro no servidor';
  }

  // Erros de rede
  if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
    return 'Erro de conexão com o servidor. Verifique se o backend está rodando.';
  }

  // Timeout
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return 'Tempo limite excedido. Tente novamente.';
  }

  // Erro de conexão recusada
  if (error.code === 'ECONNREFUSED' || error.message.includes('connect ECONNREFUSED')) {
    return 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.';
  }

  return error.message || 'Erro desconhecido na comunicação com o servidor';
};

// Função utilitária para verificar se a API está disponível
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    await api.healthCheck();
    return true;
  } catch (error) {
    console.error('API não está disponível:', error);
    return false;
  }
};