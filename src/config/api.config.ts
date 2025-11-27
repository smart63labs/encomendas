/**
 * Configuração dinâmica da API baseada no ambiente
 */

// Função para detectar se estamos em desenvolvimento local
const isLocalDevelopment = (): boolean => {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

// Função para obter a URL base da API com fallback inteligente
export const getApiBaseUrl = (): string => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const isCurrentLocal = isLocalDevelopment();

  const envApiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (envApiUrl) {
    try {
      const parsed = new URL(envApiUrl);
      const envHost = parsed.hostname;
      const isEnvLocal = envHost === 'localhost' || envHost === '127.0.0.1';

      // Se env é localhost mas o frontend não é local, usar host atual
      if (isEnvLocal && !isCurrentLocal) {
        return `${protocol}//${hostname}:3001/api`;
      }
      // Se env é IP/host e o frontend é local, usar localhost
      if (!isEnvLocal && isCurrentLocal) {
        return 'http://localhost:3001/api';
      }

      // Caso contrário, usar a env
      return envApiUrl;
    } catch {
      // env inválida → fallback
    }
  }

  // Sem env definida: resolver dinamicamente
  if (isCurrentLocal) {
    return 'http://localhost:3001/api';
  }
  return `${protocol}//${hostname}:3001/api`;
};

// Configuração exportada
export const API_CONFIG = {
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Exportar candidatos de URLs base para fallback automático
export const getApiCandidateBaseUrls = (): string[] => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const isCurrentLocal = isLocalDevelopment();
  const envApiUrl = import.meta.env.VITE_API_URL as string | undefined;

  const candidates: string[] = [];

  if (envApiUrl) {
    try {
      const parsed = new URL(envApiUrl);
      const envHost = parsed.hostname;
      const isEnvLocal = envHost === 'localhost' || envHost === '127.0.0.1';

      candidates.push(envApiUrl);

      const alt = isCurrentLocal ? 'http://localhost:3001/api' : `${protocol}//${hostname}:3001/api`;
      if (!candidates.includes(alt)) candidates.push(alt);
    } catch {
      // env inválida → ignorar e continuar com resolução dinâmica
    }
  }

  const currentHostBase = isCurrentLocal ? 'http://localhost:3001/api' : `${protocol}//${hostname}:3001/api`;
  if (!candidates.includes(currentHostBase)) candidates.push(currentHostBase);

  const localhostBase = 'http://localhost:3001/api';
  if (!candidates.includes(localhostBase)) candidates.push(localhostBase);

  return candidates;
};

// Log da configuração para debug
console.log('🔧 API Config:', {
  baseURL: API_CONFIG.baseURL,
  hostname: window.location.hostname,
  isLocal: isLocalDevelopment(),
  envVar: import.meta.env.VITE_API_URL,
  candidates: getApiCandidateBaseUrls(),
});