import axios from 'axios';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  source: string;
  address?: string;
}

export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  importance: number;
}

export class GeocodingService {
  private static readonly NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
  private static readonly VIACEP_BASE_URL = 'https://viacep.com.br/ws';
  
  // Coordenadas de fallback para Palmas, TO
  private static readonly PALMAS_FALLBACK = {
    latitude: -10.184,
    longitude: -48.334,
    source: 'fallback_palmas'
  };

  /**
   * Obtém coordenadas geográficas a partir de um CEP
   */
  static async getCoordinatesFromCEP(cep: string): Promise<GeocodingResult> {
    try {
      // Normalizar CEP (remover caracteres especiais)
      const normalizedCEP = cep.replace(/\D/g, '');
      
      if (normalizedCEP.length !== 8) {
        throw new Error('CEP deve ter 8 dígitos');
      }

      console.log(`[GeocodingService] Buscando coordenadas para CEP: ${normalizedCEP}`);

      // Tentar obter endereço do ViaCEP
      try {
        const viaCEPResponse = await axios.get<ViaCEPResponse>(
          `${this.VIACEP_BASE_URL}/${normalizedCEP}/json/`,
          { timeout: 5000 }
        );

        if (viaCEPResponse.data && !viaCEPResponse.data.erro) {
          const address = viaCEPResponse.data;
          const fullAddress = `${address.logradouro}, ${address.bairro}, ${address.localidade}, ${address.uf}, Brasil`;
          
          console.log(`[GeocodingService] Endereço obtido do ViaCEP: ${fullAddress}`);
          
          // Tentar geocodificar o endereço completo
          const coordinates = await this.getCoordinatesFromAddress(fullAddress);
          if (coordinates) {
            return {
              ...coordinates,
              source: 'viacep_nominatim',
              address: fullAddress
            };
          }
        }
      } catch (error) {
        console.warn('[GeocodingService] Erro ao consultar ViaCEP:', error);
      }

      // Fallback: tentar buscar diretamente pelo CEP no Nominatim
      try {
        const nominatimResponse = await axios.get<NominatimResponse[]>(
          `${this.NOMINATIM_BASE_URL}/search`,
          {
            params: {
              q: normalizedCEP,
              format: 'json',
              countrycodes: 'br',
              limit: 1
            },
            timeout: 5000,
            headers: {
              'User-Agent': 'NovoProtocolo/1.0'
            }
          }
        );

        if (nominatimResponse.data && nominatimResponse.data.length > 0) {
          const result = nominatimResponse.data[0];
          console.log(`[GeocodingService] Coordenadas obtidas do Nominatim para CEP: ${result.lat}, ${result.lon}`);
          
          return {
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
            source: 'nominatim_cep',
            address: result.display_name
          };
        }
      } catch (error) {
        console.warn('[GeocodingService] Erro ao consultar Nominatim para CEP:', error);
      }

      // Se chegou até aqui, usar coordenadas de fallback
      console.warn(`[GeocodingService] Usando coordenadas de fallback para CEP: ${normalizedCEP}`);
      return this.PALMAS_FALLBACK;

    } catch (error) {
      console.error('[GeocodingService] Erro geral na geocodificação por CEP:', error);
      return this.PALMAS_FALLBACK;
    }
  }

  /**
   * Obtém coordenadas geográficas a partir de um endereço completo
   */
  static async getCoordinatesFromAddress(address: string): Promise<GeocodingResult | null> {
    try {
      console.log(`[GeocodingService] Buscando coordenadas para endereço: ${address}`);

      const nominatimResponse = await axios.get<NominatimResponse[]>(
        `${this.NOMINATIM_BASE_URL}/search`,
        {
          params: {
            q: address,
            format: 'json',
            countrycodes: 'br',
            limit: 1
          },
          timeout: 5000,
          headers: {
            'User-Agent': 'NovoProtocolo/1.0'
          }
        }
      );

      if (nominatimResponse.data && nominatimResponse.data.length > 0) {
        const result = nominatimResponse.data[0];
        console.log(`[GeocodingService] Coordenadas obtidas do Nominatim: ${result.lat}, ${result.lon}`);
        
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          source: 'nominatim_address',
          address: result.display_name
        };
      }

      return null;
    } catch (error) {
      console.error('[GeocodingService] Erro ao geocodificar endereço:', error);
      return null;
    }
  }

  /**
   * Valida se um CEP tem formato válido
   */
  static isValidCEP(cep: string): boolean {
    const normalizedCEP = cep.replace(/\D/g, '');
    return normalizedCEP.length === 8;
  }
}