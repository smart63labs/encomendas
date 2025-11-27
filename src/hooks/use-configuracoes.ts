import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Configuracao {
  id: number;
  categoria: string;
  chave: string;
  valor: string;
  tipo: string;
  descricao: string;
}

interface UseConfiguracoes {
  configuracoes: Record<string, string>;
  loading: boolean;
  error: string | null;
  getConfiguracao: (categoria: string, chave: string) => string | null;
  recarregarConfiguracoes: () => Promise<void>;
}

export const useConfiguracoes = (): UseConfiguracoes => {
  const [configuracoes, setConfiguracoes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarConfiguracoes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/configuracoes');
      
      if (response.data.success) {
        const configMap: Record<string, string> = {};
        response.data.data.forEach((config: Configuracao) => {
          const key = `${config.categoria}.${config.chave}`;
          configMap[key] = config.valor;
        });
        setConfiguracoes(configMap);
      } else {
        setError('Erro ao carregar configurações');
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const getConfiguracao = (categoria: string, chave: string): string | null => {
    const key = `${categoria}.${chave}`;
    return configuracoes[key] || null;
  };

  const recarregarConfiguracoes = async () => {
    await carregarConfiguracoes();
  };

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  return {
    configuracoes,
    loading,
    error,
    getConfiguracao,
    recarregarConfiguracoes
  };
};