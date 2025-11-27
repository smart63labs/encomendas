import { EnderecoForm } from '../hooks/use-cep';
import { getApiBaseUrl } from '@/utils/api-url';

export interface Coordenadas {
  lat: number;
  lng: number;
}

export interface GeocodingResult {
  coordenadas: Coordenadas | null;
  endereco?: string;
  erro?: string;
}

/**
 * Serviço de geocodificação para converter CEP/endereço em coordenadas geográficas
 */
export class GeocodingService {
  private static readonly NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
  private static readonly BRASILAPI_BASE_URL = 'https://brasilapi.com.br/api/cep/v2';
  
  /**
   * Converte CEP em coordenadas geográficas usando o backend
   * @param cep CEP no formato XXXXX-XXX ou XXXXXXXX
   * @returns Promise com as coordenadas ou null se não encontrado
   */
  static async geocodeByCep(cep: string): Promise<GeocodingResult> {
    try {
      // Primeiro, tentar usar o serviço de geocodificação do backend
      const backendResult = await this.geocodeWithBackend(cep);
      if (backendResult.coordenadas) {
        return backendResult;
      }

      // Fallback: usar o método original
      return await this.geocodeByCepOriginal(cep);
    } catch (error) {
      console.error('Erro na geocodificação:', error);
      return await this.geocodeByCepOriginal(cep);
    }
  }

  /**
   * Geocodifica usando o serviço do backend
   */
  private static async geocodeWithBackend(cep: string): Promise<GeocodingResult> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/geocoding/cep/${cep}`);
      
      if (!response.ok) {
        // Não logar erro para CEPs não encontrados (404)
        if (response.status === 404) {
          return { coordenadas: null, erro: 'CEP não encontrado' };
        }
        
        // Para outros erros HTTP, logar apenas uma vez
        if (response.status !== 400) {
          console.warn(`Erro HTTP ${response.status} ao geocodificar CEP ${cep}`);
        }
        
        return { coordenadas: null, erro: `Erro HTTP: ${response.status}` };
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        return {
          coordenadas: {
            lat: data.data.latitude,
            lng: data.data.longitude
          },
          endereco: data.data.address || 'Endereço obtido via geocodificação'
        };
      }

      return { coordenadas: null, erro: 'Dados inválidos retornados pelo backend' };
    } catch (error) {
      // Não logar erros de rede para CEPs inválidos
      if (error instanceof Error && !error.message.includes('400')) {
        console.warn('Erro ao usar serviço de geocodificação do backend:', error);
      }
      return { coordenadas: null, erro: 'Erro de conexão com o backend' };
    }
  }

  /**
   * Método original de geocodificação (mantido como fallback)
   */
  private static async geocodeByCepOriginal(cep: string): Promise<GeocodingResult> {
    try {
      // Primeiro, busca o endereço completo via BrasilAPI
      const endereco = await this.buscarEnderecoPorCep(cep);
      if (!endereco) {
        return {
          coordenadas: null,
          erro: 'CEP não encontrado'
        };
      }

      // Se a BrasilAPI já retornou coordenadas válidas, usar diretamente
      if (endereco.coordenadas) {
        return {
          coordenadas: endereco.coordenadas,
          endereco: `${endereco.logradouro}, ${endereco.bairro}, ${endereco.cidade}/${endereco.estado}`
        };
      }

      // Tentar geocodificar usando Google Maps Geocoding API (mais precisa)
      const googleResult = await this.geocodeWithGoogle(endereco);
      if (googleResult.coordenadas) {
        return googleResult;
      }

      // Tentar com ViaCEP + OpenCage (alternativa)
      const viaCepResult = await this.geocodeWithViaCep(cep);
      if (viaCepResult.coordenadas) {
        return viaCepResult;
      }

      // Fallback: geocodificar o endereço completo via Nominatim
      const nominatimResult = await this.geocodeByAddress(endereco);
      
      // Se Nominatim retornou apenas coordenadas genéricas da cidade, avisar o usuário
      if (nominatimResult.coordenadas && nominatimResult.endereco?.includes('centro da cidade')) {
        return {
          ...nominatimResult,
          erro: 'Coordenadas aproximadas - localização específica não encontrada'
        };
      }

      return nominatimResult;
    } catch (error) {
      console.error('Erro na geocodificação por CEP:', error);
      return {
        coordenadas: null,
        erro: 'Erro na geocodificação'
      };
    }
  }

  /**
   * Converte endereço em coordenadas geográficas usando Nominatim
   * @param endereco Dados do endereço
   * @returns Promise com as coordenadas
   */
  static async geocodeByAddress(endereco: EnderecoForm): Promise<GeocodingResult> {
    try {
      // Nova tentativa: busca estruturada com CEP, quando disponível
      if (endereco.cep) {
        const structured = await this.buscarNominatimEstruturado(endereco);
        if (structured.coordenadas) {
          console.log('✅ Endereço geocodificado via busca estruturada (CEP)');
          return structured;
        }
      }
  
      // Teste 1: Endereço completo
      const queryCompleta = this.montarQueryBusca(endereco);
      console.log('🔍 Tentando geocodificar endereço completo:', queryCompleta);
      
      let result = await this.buscarNominatim(queryCompleta);
      if (result.coordenadas) {
        console.log('✅ Endereço completo geocodificado com sucesso');
        return result;
      }
  
      // Teste 2: Apenas cidade, estado e país (fallback)
      if (endereco.cidade && endereco.estado) {
        const queryCidade = `${endereco.cidade}, ${endereco.estado}, Brasil`;
        console.log('🔄 Tentando geocodificar apenas a cidade:', queryCidade);
        
        result = await this.buscarNominatim(queryCidade);
        if (result.coordenadas) {
          console.log('✅ Cidade geocodificada com sucesso (fallback)');
          return {
            ...result,
            endereco: `${endereco.cidade}, ${endereco.estado} (centro da cidade)`
          };
        }
      }
  
      return {
        coordenadas: null,
        erro: 'Endereço não encontrado'
      };
    } catch (error) {
      console.error('Erro na geocodificação por endereço:', error);
      return {
        coordenadas: null,
        erro: 'Erro na geocodificação'
      };
    }
  }

  /**
   * Busca coordenadas no Nominatim
   * @param query Query de busca
   * @returns Promise com o resultado da geocodificação
   */
  private static async buscarNominatim(query: string): Promise<GeocodingResult> {
    const url = new URL(this.NOMINATIM_BASE_URL);
    url.searchParams.append('q', query);
    url.searchParams.append('format', 'json');
    url.searchParams.append('limit', '1');
    url.searchParams.append('countrycodes', 'br');
    url.searchParams.append('addressdetails', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Sistema-Protocolo-SEFAZ-TO/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      return {
        coordenadas: {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        },
        endereco: result.display_name
      };
    }

    return {
      coordenadas: null,
      erro: 'Localização não encontrada'
    };
  }

  /**
   * Busca endereço completo via BrasilAPI
   * @param cep CEP para busca
   * @returns Promise com dados do endereço
   */
  private static async buscarEnderecoPorCep(cep: string): Promise<EnderecoForm | null> {
    try {
      const numericCep = cep.replace(/\D/g, '');
      
      if (numericCep.length !== 8) {
        return null;
      }

      const response = await fetch(`${this.BRASILAPI_BASE_URL}/${numericCep}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`CEP ${cep} não encontrado na BrasilAPI`);
        } else if (response.status === 400) {
          console.warn(`CEP ${cep} inválido na BrasilAPI`);
        }
        return null;
      }
      
      const data = await response.json();
      
      // Estrutura de resposta da BrasilAPI
      const endereco: EnderecoForm = {
        cep: data.cep,
        logradouro: data.street || '',
        numero: '',
        complemento: '',
        bairro: data.neighborhood || '',
        cidade: data.city || '',
        estado: data.state || ''
      };

      // Se a BrasilAPI retornou coordenadas válidas, incluir no resultado
      if (data.location && 
          data.location.coordinates && 
          typeof data.location.coordinates.latitude === 'number' && 
          typeof data.location.coordinates.longitude === 'number' &&
          !isNaN(data.location.coordinates.latitude) &&
          !isNaN(data.location.coordinates.longitude)) {
        endereco.coordenadas = {
          lat: parseFloat(data.location.coordinates.latitude),
          lng: parseFloat(data.location.coordinates.longitude)
        };
        console.log(`✅ BrasilAPI retornou coordenadas para CEP ${cep}:`, endereco.coordenadas);
      } else {
        console.log(`⚠️ BrasilAPI não retornou coordenadas válidas para CEP ${cep}, será necessário geocodificar via Nominatim`);
        console.log('Dados de localização recebidos:', data.location);
      }

      return endereco;
    } catch (error) {
      console.error('Erro ao buscar CEP na BrasilAPI:', error);
      return null;
    }
  }

  /**
   * Monta query de busca para geocodificação
   * @param endereco Dados do endereço
   * @returns String formatada para busca
   */
  private static montarQueryBusca(endereco: EnderecoForm): string {
    const partes = [];
    
    if (endereco.logradouro) {
      partes.push(endereco.logradouro);
    }
    
    if (endereco.bairro) {
      partes.push(endereco.bairro);
    }
    
    if (endereco.cidade) {
      partes.push(endereco.cidade);
    }
    
    if (endereco.estado) {
      partes.push(endereco.estado);
    }
    
    partes.push('Brasil');
    
    return partes.join(', ');
  }

  private static async buscarNominatimEstruturado(endereco: EnderecoForm): Promise<GeocodingResult> {
    const url = new URL(this.NOMINATIM_BASE_URL);
    const streetParts = [endereco.logradouro, endereco.bairro].filter(Boolean).join(', ');
    if (streetParts) {
      url.searchParams.append('street', streetParts);
    }
    if (endereco.cidade) url.searchParams.append('city', endereco.cidade);
    if (endereco.estado) url.searchParams.append('state', endereco.estado);
    if (endereco.cep) url.searchParams.append('postalcode', endereco.cep.replace(/\D/g, ''));
    url.searchParams.append('country', 'Brasil');
    url.searchParams.append('format', 'json');
    url.searchParams.append('limit', '1');
    url.searchParams.append('countrycodes', 'br');
    url.searchParams.append('addressdetails', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Sistema-Protocolo-SEFAZ-TO/1.0'
      }
    });

    if (!response.ok) {
      return { coordenadas: null };
    }

    const data = await response.json();
    if (data && data.length > 0) {
      const result = data[0];
      return {
        coordenadas: {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        },
        endereco: result.display_name
      };
    }

    return { coordenadas: null };
  }

  /**
   * Geocodifica múltiplos CEPs em lote
   * @param ceps Array de CEPs
   * @returns Promise com array de resultados
   */
  static async geocodeBatchCeps(ceps: string[]): Promise<{ [cep: string]: GeocodingResult }> {
    const results: { [cep: string]: GeocodingResult } = {};
    
    // Processa em lotes para não sobrecarregar a API
    const batchSize = 5;
    for (let i = 0; i < ceps.length; i += batchSize) {
      const batch = ceps.slice(i, i + batchSize);
      
      const promises = batch.map(async (cep) => {
        const result = await this.geocodeByCep(cep);
        return { cep, result };
      });
      
      const batchResults = await Promise.all(promises);
      
      batchResults.forEach(({ cep, result }) => {
        results[cep] = result;
      });
      
      // Delay entre lotes para respeitar rate limits
      if (i + batchSize < ceps.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Geocodifica apenas por cidade e estado para obter coordenadas de fallback
   * @param cidade Nome da cidade
   * @param estado Sigla ou nome do estado
   * @returns Promise com as coordenadas da cidade ou null se não encontrado
   */
  static async geocodeByCityState(cidade: string, estado: string): Promise<GeocodingResult> {
    try {
      const query = `${cidade}, ${estado}, Brasil`;
      console.log('🏙️ Geocodificando cidade para fallback:', query);
      
      const result = await this.buscarNominatim(query);
      if (result.coordenadas) {
        console.log('✅ Coordenadas da cidade obtidas para fallback:', result.coordenadas);
        return {
          ...result,
          endereco: `${cidade}, ${estado} (centro da cidade - fallback)`
        };
      }

      return {
        coordenadas: null,
        erro: `Cidade ${cidade}, ${estado} não encontrada`
      };
    } catch (error) {
      console.error('Erro na geocodificação da cidade:', error);
      return {
        coordenadas: null,
        erro: 'Erro na geocodificação da cidade'
      };
    }
  }

  /**
   * Obtém coordenadas de fallback inteligente baseado nos dados do CEP
   * @param cepData Dados do CEP obtidos via API
   * @returns Promise com coordenadas da cidade ou null quando indisponível
   */
  static async getSmartFallbackCoordinates(cepData: any): Promise<Coordenadas | null> {

    try {
      // Se temos dados da cidade e estado, tentar geocodificar a cidade
      if (cepData?.city && cepData?.state) {
        console.log('🎯 Tentando obter coordenadas da cidade do CEP:', cepData.city, cepData.state);
        
        const cityResult = await this.geocodeByCityState(cepData.city, cepData.state);
        if (cityResult.coordenadas) {
          console.log('✅ Usando coordenadas da cidade como fallback:', cityResult.coordenadas);
          return cityResult.coordenadas;
        }
      }

      // Não retornar fallback fixo; manter null caso não seja possível geocodificar a cidade
      console.warn('⚠️ Não foi possível geocodificar a cidade a partir do CEP');
      return null;
    } catch (error) {
      console.error('Erro ao obter coordenadas de fallback inteligente:', error);
      return null;
    }
  }

  /**
   * Geocodifica um endereço em formato string
   * @param endereco String do endereço a ser geocodificado
   * @returns Promise com as coordenadas ou null se não encontrado
   */
  static async geocodificar(endereco: string): Promise<Coordenadas | null> {
    try {
      const result = await this.buscarNominatim(endereco);
      return result.coordenadas;
    } catch (error) {
      console.error('Erro ao geocodificar endereço:', endereco, error);
      return null;
    }
  }

  /**
   * Valida se as coordenadas estão dentro do Tocantins
   * @param coordenadas Coordenadas para validar
   * @returns true se estão no Tocantins
   */
  static isInTocantins(coordenadas: Coordenadas): boolean {
    // Limites aproximados do Tocantins
    const bounds = {
      north: -2.0,
      south: -13.0,
      west: -51.0,
      east: -45.0
    };
    
    return (
      coordenadas.lat >= bounds.south &&
      coordenadas.lat <= bounds.north &&
      coordenadas.lng >= bounds.west &&
      coordenadas.lng <= bounds.east
    );
  }
}

/**
 * Hook para usar o serviço de geocodificação
 */
export const useGeocoding = () => {
  const geocodeByCep = async (cep: string): Promise<GeocodingResult> => {
    return GeocodingService.geocodeByCep(cep);
  };

  const geocodeByAddress = async (endereco: EnderecoForm): Promise<GeocodingResult> => {
    return GeocodingService.geocodeByAddress(endereco);
  };

  const geocodeBatch = async (ceps: string[]): Promise<{ [cep: string]: GeocodingResult }> => {
    return GeocodingService.geocodeBatchCeps(ceps);
  };

  return {
    geocodeByCep,
    geocodeByAddress,
    geocodeBatch
  };
};