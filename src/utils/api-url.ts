/**
 * Utilitário para obter a URL base da API de forma dinâmica
 * Resolve o problema de localhost hardcoded para acesso em rede
 */

/**
 * Obtém a URL base da API baseada no ambiente atual
 * @returns URL base da API configurada dinamicamente
 */
export const getApiBaseUrl = (): string => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const isCurrentLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  // Se existe variável de ambiente, usar com fallback inteligente
  const envApiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (envApiUrl) {
    try {
      const parsed = new URL(envApiUrl);
      const envHost = parsed.hostname;
      const isEnvLocal = envHost === 'localhost' || envHost === '127.0.0.1';

      // Se env aponta para localhost mas o frontend está acessando via IP/host da rede, usar o host atual
      if (isEnvLocal && !isCurrentLocal) {
        return `${protocol}//${hostname}:3001/api`;
      }

      // Se env aponta para um IP/host da rede mas o frontend está em localhost, usar localhost
      if (!isEnvLocal && isCurrentLocal) {
        return 'http://localhost:3001/api';
      }

      // Caso contrário, usar a variável de ambiente
      return envApiUrl;
    } catch {
      // Se a env não é uma URL válida, cair para resolução padrão
    }
  }

  // Sem variável de ambiente: resolver dinamicamente
  if (isCurrentLocal) {
    return 'http://localhost:3001/api';
  }
  return `${protocol}//${hostname}:3001/api`;
};

/**
 * Obtém a URL base da API sem o sufixo /api
 * @returns URL base do servidor backend
 */
export const getServerBaseUrl = (): string => {
  return getApiBaseUrl().replace(/\/api$/, '');
};

/**
 * Constrói uma URL completa para um endpoint específico
 * @param endpoint Endpoint da API (ex: '/users', '/geocoding/cep/12345')
 * @returns URL completa para o endpoint
 */
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

/**
 * Log da configuração atual para debug
 */
export const logApiConfig = (): void => {
  console.log('🔧 API Configuration:', {
    baseURL: getApiBaseUrl(),
    serverURL: getServerBaseUrl(),
    hostname: window.location.hostname,
    isLocal: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    envVar: import.meta.env.VITE_API_URL,
  });
};

/**
 * Lista candidatos de URLs base para a API, em ordem de preferência,
 * permitindo fallback automático entre localhost e IP/host da rede.
 */
export const getApiCandidateBaseUrls = (): string[] => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const isCurrentLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  const envApiUrl = import.meta.env.VITE_API_URL as string | undefined;

  const candidates: string[] = [];

  if (envApiUrl) {
    try {
      const parsed = new URL(envApiUrl);
      const envHost = parsed.hostname;
      const isEnvLocal = envHost === 'localhost' || envHost === '127.0.0.1';

      // Preferir a env primeiro
      candidates.push(envApiUrl);

      // Adicionar alternativa baseada no contexto atual
      const alt = isCurrentLocal ? 'http://localhost:3001/api' : `${protocol}//${hostname}:3001/api`;
      if (!candidates.includes(alt)) candidates.push(alt);
    } catch {
      // env inválida → ignorar e continuar com resolução dinâmica
    }
  }

  // Sem env válida: adicionar candidatos padrão
  const currentHostBase = isCurrentLocal ? 'http://localhost:3001/api' : `${protocol}//${hostname}:3001/api`;
  if (!candidates.includes(currentHostBase)) candidates.push(currentHostBase);

  const localhostBase = 'http://localhost:3001/api';
  if (!candidates.includes(localhostBase)) candidates.push(localhostBase);

  return candidates;
};