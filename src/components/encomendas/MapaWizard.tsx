import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeocodingService, Coordenadas } from '../../services/geocoding.service';
import { COORDENADAS_TOCANTINS, ZOOM_TOCANTINS } from '@/constants/mapConstants';
import { getApiBaseUrl } from '@/utils/api-url';

// Fix para os ícones do Leaflet no Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

import { mapIcons } from '@/utils/map-icons';

// Ícones usando a nova implementação local
const origemIcon = mapIcons.origem;
const destinoIcon = mapIcons.destino;

interface SetorData {
  ID: number;
  NOME: string;
  LOGRADOURO?: string;
  NUMERO?: string;
  COMPLEMENTO?: string;
  BAIRRO?: string;
  CIDADE?: string;
  ESTADO?: string;
  CEP?: string;
  LATITUDE?: number;
  LONGITUDE?: number;
}

// Cache para coordenadas geocodificadas
class CoordenadasCache {
  private static readonly CACHE_KEY = 'wizard_coordenadas_cache';
  private static readonly CACHE_VERSION = '1.0';
  private static readonly CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 dias
  private static cache: { [key: string]: { coordenadas: Coordenadas; timestamp: number; version: string } } = {};
  private static initialized = false;

  private static init() {
    if (this.initialized) return;
    
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const now = Date.now();
        Object.keys(parsedCache).forEach(key => {
          const entry = parsedCache[key];
          if (entry.version === this.CACHE_VERSION && 
              (now - entry.timestamp) < this.CACHE_EXPIRY) {
            this.cache[key] = entry;
          }
        });
      }
    } catch (error) {
      console.warn('Erro ao carregar cache de coordenadas:', error);
    }
    
    this.initialized = true;
  }

  static get(key: string): Coordenadas | null {
    this.init();
    const entry = this.cache[key];
    if (!entry) return null;
    
    const now = Date.now();
    if ((now - entry.timestamp) > this.CACHE_EXPIRY) {
      delete this.cache[key];
      this.saveToStorage();
      return null;
    }
    
    return entry.coordenadas;
  }

  static set(key: string, coordenadas: Coordenadas): void {
    this.init();
    this.cache[key] = {
      coordenadas,
      timestamp: Date.now(),
      version: this.CACHE_VERSION
    };
    this.saveToStorage();
  }

  private static saveToStorage(): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Erro ao salvar cache de coordenadas:', error);
    }
  }
}

interface MapaWizardProps {
  setorOrigem?: string;
  setorDestino?: string;
  setorOrigemData?: SetorData | null;
  setorDestinoData?: SetorData | null;
}

const MapaWizard: React.FC<MapaWizardProps> = ({
  setorOrigem,
  setorDestino,
  setorOrigemData,
  setorDestinoData
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  // Função para geocodificar setor (PRIORIZA ABSOLUTAMENTE coordenadas do banco)
  const geocodificarSetor = async (setorData: SetorData): Promise<Coordenadas | null> => {
    const nomeSetor = setorData.NOME;
    const cep = setorData.CEP;
    const lat = setorData.LATITUDE;
    const lng = setorData.LONGITUDE;
    
    const setorKey = `setor_${setorData.ID}_${nomeSetor}`;

    // PRIORIDADE ABSOLUTA: Usar coordenadas salvas no banco de dados quando válidas
    if (lat && lng && lat !== 0 && lng !== 0) {
      console.log(`📍 [PRIORIDADE BANCO] Usando coordenadas do banco para setor ${nomeSetor}:`, { lat, lng });
      const coordenadas = { lat, lng };
      CoordenadasCache.set(setorKey, coordenadas);
      return coordenadas;
    }

    // FALLBACK 1: Verificar cache persistente
    const coordenadasCacheadas = CoordenadasCache.get(setorKey);
    if (coordenadasCacheadas) {
      console.log(`💾 Cache hit para setor ${nomeSetor}:`, coordenadasCacheadas);
      return coordenadasCacheadas;
    }

    // FALLBACK 2: Se tem CEP, tentar geocodificar
    if (cep) {
      console.log(`🔍 [FALLBACK CEP] Geocodificando setor ${nomeSetor} por CEP: ${cep}`);
      try {
        const resultado = await GeocodingService.geocodeByCep(cep);
        if (resultado.coordenadas) {
          console.log(`✅ CEP ${cep} geocodificado com sucesso:`, resultado.coordenadas);
          CoordenadasCache.set(setorKey, resultado.coordenadas);
          return resultado.coordenadas;
        } else {
          console.warn(`⚠️ CEP ${cep} não pôde ser geocodificado:`, resultado.erro);
        }
      } catch (error) {
        console.error(`❌ Erro ao geocodificar CEP ${cep}:`, error);
      }
    }

    // FALLBACK 3: Geocodificar por endereço completo
    if (setorData.LOGRADOURO && setorData.CIDADE) {
      const endereco = {
        logradouro: setorData.LOGRADOURO,
        numero: setorData.NUMERO || '',
        complemento: setorData.COMPLEMENTO || '',
        bairro: setorData.BAIRRO || '',
        cidade: setorData.CIDADE || 'Palmas',
        estado: setorData.ESTADO || 'TO',
        cep: '' // CEP já foi tentado acima
      };
      
      console.log(`🏠 Tentando geocodificar por endereço completo para setor ${nomeSetor}`);
      try {
        const resultado = await GeocodingService.geocodeByAddress(endereco);
        if (resultado.coordenadas) {
          console.log(`✅ Endereço geocodificado com sucesso:`, resultado.coordenadas);
          CoordenadasCache.set(setorKey, resultado.coordenadas);
          return resultado.coordenadas;
        }
      } catch (error) {
        console.error(`❌ Erro ao geocodificar endereço:`, error);
      }
    }

    // FALLBACK 4: Coordenadas inteligentes baseadas na cidade do setor
    if (setorData.CIDADE && setorData.ESTADO) {
      console.log(`🏙️ Tentando obter coordenadas da cidade ${setorData.CIDADE}, ${setorData.ESTADO} para setor ${nomeSetor}`);
      try {
        const cityResult = await GeocodingService.geocodeByCityState(setorData.CIDADE, setorData.ESTADO);
        if (cityResult.coordenadas) {
          console.log(`✅ Coordenadas da cidade obtidas como fallback:`, cityResult.coordenadas);
          CoordenadasCache.set(setorKey, cityResult.coordenadas);
          return cityResult.coordenadas;
        }
      } catch (error) {
        console.error(`❌ Erro ao geocodificar cidade ${setorData.CIDADE}:`, error);
      }
    }

    // SEM FALLBACK ARTIFICIAL: Retornar null se não conseguir geocodificar
    console.warn(`⚠️ Não foi possível obter coordenadas para setor ${nomeSetor} - retornando null`);
    return null;
  };

  // Função para calcular rota usando o backend (mesma lógica do MapaSetores)
  const calculateRoute = async (start: [number, number], end: [number, number]) => {
    try {
      const origem: [number, number] = [start[1], start[0]]; // [lng, lat]
      const destino: [number, number] = [end[1], end[0]]; // [lng, lat]
      
      console.log('🚀 Iniciando cálculo de rota');
      console.log('📍 Origem:', origem, 'Destino:', destino);
      
      const response = await fetch(`${getApiBaseUrl()}/routing/directions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coordinates: [origem, destino],
          profile: 'driving-car'
        })
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        console.error('❌ Erro na resposta:', response.status, response.statusText);
        throw new Error(`Erro na API: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Resultado da API:', result);
      
      if (result.success && result.data && result.data.coordinates) {
        console.log('✅ Rota calculada com sucesso');
        // Converter coordenadas para formato Leaflet [lat, lng]
        const coordinates = result.data.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        
        // Atualizar informações da rota
        if (result.data.distance && result.data.duration) {
          const distanceKm = (result.data.distance / 1000).toFixed(1);
          const durationMin = Math.round(result.data.duration / 60);
          setRouteInfo({
            distance: `${distanceKm} km`,
            duration: `${durationMin} min`
          });
        }
        
        return coordinates;
      } else {
        console.error('❌ Erro nos dados da rota:', result);
        throw new Error(result.message || 'Erro ao processar dados da rota');
      }
    } catch (error) {
      console.error('❌ Erro ao calcular rota:', error);
      setRouteInfo(null);
      return null;
    }
  };

  // Inicializar mapa
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView(COORDENADAS_TOCANTINS, ZOOM_TOCANTINS);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Função para limpar marcadores e rotas
  const clearMapElements = () => {
    if (!mapInstanceRef.current) return;
    
    // Remover marcadores
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    markersRef.current = [];
    
    // Remover rota
    if (routeLayerRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    
    // Limpar informações da rota
    setRouteInfo(null);
  };

  // Função para plotar setores no mapa (só plota se tiver coordenadas válidas)
  const plotSetores = async () => {
    if (!mapInstanceRef.current) return;
    
    setLoading(true);
    setError(null);
    clearMapElements();
    
    const coordenadasValidas: Array<{ coords: Coordenadas; tipo: 'origem' | 'destino'; nome: string }> = [];
    
    try {
      // Processar setor de origem
      if (setorOrigemData) {
        console.log('🔍 Processando setor de origem:', setorOrigemData.NOME);
        console.log('📊 Dados completos do setor origem:', setorOrigemData);
        const coords = await geocodificarSetor(setorOrigemData);
        
        if (coords) {
          console.log('✅ Coordenadas Origem definidas:', coords);
          coordenadasValidas.push({ coords, tipo: 'origem', nome: setorOrigemData.NOME });
        } else {
          console.warn(`⚠️ Setor origem ${setorOrigemData.NOME} não pôde ser plotado - sem coordenadas válidas`);
        }
      }
      
      // Processar setor de destino
      if (setorDestinoData) {
        console.log('🔍 Processando setor de destino:', setorDestinoData.NOME);
        console.log('📊 Dados completos do setor destino:', setorDestinoData);
        const coords = await geocodificarSetor(setorDestinoData);
        
        if (coords) {
          console.log('✅ Coordenadas Destino definidas:', coords);
          coordenadasValidas.push({ coords, tipo: 'destino', nome: setorDestinoData.NOME });
        } else {
          console.warn(`⚠️ Setor destino ${setorDestinoData.NOME} não pôde ser plotado - sem coordenadas válidas`);
        }
      }
      
      // Adicionar marcadores apenas para coordenadas válidas
      coordenadasValidas.forEach(({ coords, tipo, nome }) => {
        const marker = L.marker([coords.lat, coords.lng], {
          icon: tipo === 'origem' ? origemIcon : destinoIcon
        }).addTo(mapInstanceRef.current!);
        
        // Obter dados do setor correspondente
        const setorData = tipo === 'origem' ? setorOrigemData : setorDestinoData;
        
        let popupContent = `
          <div class="p-3 min-w-[250px]">
            <div class="font-bold text-base mb-2 text-${tipo === 'origem' ? 'green' : 'red'}-600">
              📍 ${tipo === 'origem' ? 'ORIGEM' : 'DESTINO'}
            </div>
            <div class="mb-2">
              <div class="font-semibold text-sm text-gray-800">${nome}</div>
            </div>
        `;
        
        if (setorData) {
          popupContent += `
            <div class="border-t pt-2 mt-2">
              <div class="text-xs text-gray-600 mb-1"><strong>Informações do Setor:</strong></div>
              ${setorData.LOGRADOURO ? `<div class="text-xs">📍 ${setorData.LOGRADOURO}</div>` : ''}
              ${setorData.NUMERO ? `<div class="text-xs">🏠 Nº ${setorData.NUMERO}</div>` : ''}
              ${setorData.COMPLEMENTO ? `<div class="text-xs">📝 ${setorData.COMPLEMENTO}</div>` : ''}
              ${setorData.BAIRRO ? `<div class="text-xs">🏘️ ${setorData.BAIRRO}</div>` : ''}
              ${setorData.CIDADE ? `<div class="text-xs">🏙️ ${setorData.CIDADE}</div>` : ''}
              ${setorData.ESTADO ? `<div class="text-xs">🗺️ ${setorData.ESTADO}</div>` : ''}
              ${setorData.CEP ? `<div class="text-xs">📮 CEP: ${setorData.CEP}</div>` : ''}
              <div class="text-xs">🎯 Coordenadas: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}</div>
            </div>
          `;
        }
        
        popupContent += `
          </div>
        `;
        
        marker.bindPopup(popupContent);
        
        markersRef.current.push(marker);
      });
      
      // Calcular e exibir rota apenas se ambos os setores têm coordenadas
      if (coordenadasValidas.length === 2) {
        const origem = coordenadasValidas.find(c => c.tipo === 'origem');
        const destino = coordenadasValidas.find(c => c.tipo === 'destino');
        
        if (origem && destino) {
          console.log('🗺️ Calculando rota entre origem e destino');
          const routeCoords = await calculateRoute([origem.coords.lat, origem.coords.lng], [destino.coords.lat, destino.coords.lng]);
          
          if (routeCoords) {
            routeLayerRef.current = L.polyline(routeCoords, {
              color: '#3b82f6',
              weight: 4,
              opacity: 0.7
            }).addTo(mapInstanceRef.current);
          }
        }
        
        // Ajustar visualização para mostrar ambos os pontos
        const group = new L.FeatureGroup(markersRef.current);
        if (routeLayerRef.current) {
          group.addLayer(routeLayerRef.current);
        }
        mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [20, 20] });
      } else if (coordenadasValidas.length === 1) {
        // Se só um setor tem coordenadas, centralizar nele
        console.log('🎯 Centralizando mapa no único setor com coordenadas válidas');
        mapInstanceRef.current.setView([coordenadasValidas[0].coords.lat, coordenadasValidas[0].coords.lng], 15);
      } else {
        // Se nenhum setor tem coordenadas, manter visualização do Tocantins
        console.log('⚠️ Nenhum setor com coordenadas válidas - mantendo visualização do Tocantins');
        mapInstanceRef.current.setView(COORDENADAS_TOCANTINS, ZOOM_TOCANTINS);
      }
      
    } catch (error) {
      console.error('Erro ao plotar setores:', error);
      setError('Erro ao carregar dados do mapa');
    } finally {
      setLoading(false);
    }
  };

  // Efeito para plotar setores quando os dados mudarem
  useEffect(() => {
    if (setorOrigemData || setorDestinoData) {
      plotSetores();
    } else {
      clearMapElements();
    }
  }, [setorOrigemData, setorDestinoData]);

  return (
    <div className="space-y-2">
      <h4 className="text-base font-semibold text-primary font-heading flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        Mapa de Rota
      </h4>
      
      <div className="relative">
        <div 
          ref={mapRef} 
          className="w-full h-96 rounded-lg border border-gray-200 bg-gray-50"
        />
        
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Carregando mapa...
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute top-2 left-2 right-2 bg-red-50 border border-red-200 rounded p-2">
            <div className="text-sm text-red-600">{error}</div>
          </div>
        )}
        
        {routeInfo && (
          <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 rounded-lg p-2 shadow-md">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span className="font-medium text-gray-700">{routeInfo.distance}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-gray-700">{routeInfo.duration}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Legenda */}
      <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-full border border-white shadow"></div>
          <span>Origem</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded-full border border-white shadow"></div>
          <span>Destino</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-0.5 bg-blue-500"></div>
          <span>Rota</span>
        </div>
      </div>
      
      {/* Status dos setores */}
      <div className="text-xs text-gray-500">
        {setorOrigemData && !setorDestinoData && (
          <div className="text-center">Origem plotada. Selecione o destinatário para traçar a rota.</div>
        )}
        {!setorOrigemData && setorDestinoData && (
          <div className="text-center">Destino plotado. Selecione o remetente para traçar a rota.</div>
        )}
      </div>
    </div>
  );
};

export default MapaWizard;