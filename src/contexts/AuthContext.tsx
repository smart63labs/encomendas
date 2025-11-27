import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { api, handleApiError } from '@/lib/api';

// Interface para dados do usuário - Estrutura conforme tabela USUARIOS
interface User {
  // Estrutura exata da tabela USUARIOS na ordem especificada
  id: number;
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
  // Campos de compatibilidade
  email?: string;
  orgao?: string;
  setor?: string;
  lotacao?: string;
  perfil?: string;
  ativo?: boolean;
}

// Interface para dados de login
interface LoginCredentials {
  cpf: string;
  senha: string;
}

// Interface para resposta de login
interface LoginResponse {
  user: User;
  token: string;
  isDefaultPassword?: boolean;
}

// Interface do contexto de autenticação
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDefaultPassword: boolean;
  login: (credentials: LoginCredentials) => Promise<{ isDefaultPassword?: boolean }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  markPasswordChanged: () => void;
}

// Criar o contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider do contexto de autenticação
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDefaultPassword, setIsDefaultPassword] = useState(false);

  // Verificar se há token salvo no localStorage ao inicializar
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);

        // Sincronizar status de senha padrão com o backend
        (async () => {
          try {
            const response = await api.get<{ isDefaultPassword: boolean }>(
              '/users/password-status'
            );
            const flag = response.data?.data?.isDefaultPassword ?? false;
            setIsDefaultPassword(Boolean(flag));
          } catch (error) {
            console.error('Erro ao recuperar status de senha:', error);
            // Em caso de falha/401, limpar sessão para evitar estado inconsistente
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setToken(null);
            setUser(null);
            setIsDefaultPassword(false);
          } finally {
            setIsLoading(false);
          }
        })();
      } catch (error) {
        console.error('Erro ao recuperar dados do usuário:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  // Função de login
  const login = useCallback(async (credentials: LoginCredentials): Promise<{ isDefaultPassword?: boolean }> => {
    try {
      setIsLoading(true);
      
      const response = await api.post<any>('/users/login', credentials);
      
      if (response.data.success && response.data.data) {
        const { user: userData, token: authToken, isDefaultPassword: defaultPassword } = response.data.data;
        
        // Salvar no estado
        setUser(userData);
        setToken(authToken);
        setIsDefaultPassword(defaultPassword || false);
        
        // Salvar no localStorage
        localStorage.setItem('auth_token', authToken);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        
        return { isDefaultPassword: defaultPassword };
      } else {
        throw new Error(response.data.message || 'Erro no login');
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      throw new Error(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função de logout
  const logout = useCallback((): void => {
    setUser(null);
    setToken(null);
    setIsDefaultPassword(false);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }, []);

  // Função para atualizar dados do usuário
  const updateUser = useCallback((userData: Partial<User>): void => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    }
  }, [user]);

  const value: AuthContextType = useMemo(() => ({
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    isDefaultPassword,
    login,
    logout,
    updateUser,
    markPasswordChanged: () => setIsDefaultPassword(false),
  }), [user, token, isLoading, isDefaultPassword, login, logout, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar o contexto de autenticação
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Exportar tipos para uso em outros componentes
export type { User, LoginCredentials, LoginResponse };