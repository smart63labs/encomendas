import { useState, useCallback } from 'react';

export interface CepData {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  location: {
    type: string;
    coordinates: {
      longitude: string;
      latitude: string;
    };
  };
}

export interface CepError {
  name: string;
  message: string;
  type: string;
}

export interface UseCepSearchReturn {
  searchCep: (cep: string) => Promise<CepData | null>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useCepSearch = (): UseCepSearchReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const searchCep = useCallback(async (cep: string): Promise<CepData | null> => {
    // Limpar erro anterior
    setError(null);
    
    // Validar formato do CEP
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setError('CEP deve conter exatamente 8 dígitos');
      return null;
    }

    // Verificar se é um CEP genérico (terminado em 000)
    const isGenericCep = cleanCep.endsWith('000');

    setLoading(true);

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData: CepError = await response.json();
          setError(errorData.message || 'CEP deve conter exatamente 8 dígitos');
          return null;
        }
        
        if (response.status === 404) {
          const errorData: CepError = await response.json();
          if (isGenericCep) {
            setError('CEP genérico não encontrado. Tente usar um CEP mais específico da região.');
          } else {
            setError(errorData.message || 'CEP não encontrado');
          }
          return null;
        }
        
        if (response.status === 500) {
          const errorData: CepError = await response.json();
          setError(errorData.message || 'Erro interno no serviço de CEP');
          return null;
        }

        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data: CepData = await response.json();
      
      // Verificar se a BrasilAPI retornou dados incompletos (campos null/undefined)
      if (!data.street || !data.neighborhood) {
        console.log('⚠️ BrasilAPI retornou dados incompletos, tentando ViaCEP como fallback...');
        
        // Tentar ViaCEP como fallback para dados mais completos
        try {
          const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
          
          if (viaCepResponse.ok) {
            const viaCepData = await viaCepResponse.json();
            
            if (!viaCepData.erro) {
              // Mesclar dados: usar ViaCEP para endereço e BrasilAPI para coordenadas
              const mergedData: CepData = {
                cep: data.cep || viaCepData.cep.replace('-', ''),
                state: data.state || viaCepData.uf,
                city: data.city || viaCepData.localidade,
                neighborhood: viaCepData.bairro || data.neighborhood || '',
                street: viaCepData.logradouro || data.street || '',
                location: data.location || {
                  type: 'Point',
                  coordinates: {
                    longitude: 'N/A',
                    latitude: 'N/A'
                  }
                }
              };
              
              console.log('✅ Dados mesclados: BrasilAPI + ViaCEP para dados mais completos');
              return mergedData;
            }
          }
        } catch (viaCepErr) {
          console.error('Erro no fallback ViaCEP para dados incompletos:', viaCepErr);
        }
      }
      
      return data;

    } catch (err) {
      console.error('Erro ao buscar CEP na BrasilAPI:', err);
      
      // Tentar fallback com ViaCEP
      try {
        console.log('Tentando fallback com ViaCEP...');
        const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        
        if (viaCepResponse.ok) {
          const viaCepData = await viaCepResponse.json();
          
          if (viaCepData.erro) {
            if (isGenericCep) {
              setError('CEP genérico não encontrado. Tente usar um CEP mais específico da região.');
            } else {
              setError('CEP não encontrado');
            }
            return null;
          }
          
          // Converter dados do ViaCEP para o formato esperado
          const convertedData: CepData = {
            cep: viaCepData.cep.replace('-', ''),
            state: viaCepData.uf,
            city: viaCepData.localidade,
            neighborhood: viaCepData.bairro,
            street: viaCepData.logradouro,
            location: {
              type: 'Point',
              coordinates: {
                longitude: 'N/A', // ViaCEP não fornece coordenadas - marcado como N/A
                latitude: 'N/A'   // para diferenciação no processamento posterior
              }
            }
          };
          
          console.log('✅ CEP encontrado via ViaCEP (fallback)');
          return convertedData;
        }
      } catch (viaCepErr) {
        console.error('Erro no fallback ViaCEP:', viaCepErr);
      }
      
      // Se ambas as APIs falharam
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          setError('Erro de conexão. Verifique sua internet e tente novamente.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Erro desconhecido ao buscar CEP');
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    searchCep,
    loading,
    error,
    clearError,
  };
};