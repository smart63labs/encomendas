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

// Ícones usando a implementação local
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

// Cache específico para malotes
class CoordenadasCacheMalote {
  private static readonly CACHE_KEY = 'malote_coordenadas_cache';
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
      console.warn('Erro ao carregar cache de coordenadas do malote:', error);
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
      console.warn('Erro ao salvar cache de coordenadas do malote:', error);
    }
  }
}

interface MapaMaloteProps {
  setorOrigemData?: SetorData | null;
  setorDestinoData?: SetorData | null;
}

const MapaMalote: React.FC<MapaMaloteProps> = ({
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

  // Função para geocodificar setor (PRIORIZA coordenadas do banco)
  const geocodificarSetor = async (setorData: SetorData): Promise<Coordenadas | null> => {
    const nomeSetor = setorData.NOME;
    const cep = setorData.CEP;
    const lat = setorData.LATITUDE;
    const lng = setorData.LONGITUDE;
    
    const setorKey = `malote_setor_${setorData.ID}_${nomeSetor}`;

    // PRIORIDADE: Usar coordenadas do banco quando válidas
    if (lat && lng && lat !== 0 && lng !== 0) {
      console.log(`📍 [MALOTE - BANCO] Usando coordenadas do banco para setor ${nomeSetor}:`, { lat, lng });
      const coordenadas = { lat, lng };
      CoordenadasCacheMalote.set(setorKey, coordenadas);
      return coordenadas;
    }

    // FALLBACK 1: Verificar cache
    const coordenadasCacheadas = CoordenadasCacheMalote.get(setorKey);
    if (coordenadasCacheadas) {
      console.log(`💾 [MALOTE] Cache hit para setor ${nomeSetor}:`, coordenadasCacheadas);
      return coordenadasCacheadas;
    }

    // FALLBACK 2: Geocodificar por CEP
    if (cep) {
      console.log(`🔍 [MALOTE - CEP] Geocodificando setor ${nomeSetor} por CEP: ${cep}`);
      try {
        const resultado = await GeocodingService.geocodeByCep(cep);
        if (resultado.coordenadas) {
          console.log(`✅ [MALOTE] CEP ${cep} geocodificado:`, resultado.coordenadas);
          CoordenadasCacheMalote.set(setorKey, resultado.coordenadas);
          return resultado.coordenadas;
        } else {
          console.warn(`⚠️ [MALOTE] CEP ${cep} não geocodificado:`, resultado.erro);
        }
      } catch (error) {
        console.error(`❌ [MALOTE] Erro ao geocodificar CEP ${cep}:`, error);
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
        cep: ''
      };
      
      console.log(`🏠 [MALOTE] Geocodificando por endereço para setor ${nomeSetor}`);
      try {
        const resultado = await GeocodingService.geocodeByAddress(endereco);
        if (resultado.coordenadas) {
          console.log(`✅ [MALOTE] Endereço geocodificado:`, resultado.coordenadas);
          CoordenadasCacheMalote.set(setorKey, resultado.coordenadas);
          return resultado.coordenadas;
        }
      } catch (error) {
        console.error(`❌ [MALOTE] Erro ao geocodificar endereço:`, error);
      }
    }

    // FALLBACK 4: Coordenadas da cidade
    if (setorData.CIDADE && setorData.ESTADO) {
      console.log(`🏙️ [MALOTE] Geocodificando cidade ${setorData.CIDADE}, ${setorData.ESTADO}`);
      try {
        const cityResult = await GeocodingService.geocodeByCityState(setorData.CIDADE, setorData.ESTADO);
        if (cityResult.coordenadas) {
          console.log(`✅ [MALOTE] Coordenadas da cidade obtidas:`, cityResult.coordenadas);
          CoordenadasCacheMalote.set(setorKey, cityResult.coordenadas);
          return cityResult.coordenadas;
        }
      } catch (error) {
        console.error(`❌ [MALOTE] Erro ao geocodificar cidade:`, error);
      }
    }

    console.warn(`⚠️ [MALOTE] Não foi possível obter coordenadas para setor ${nomeSetor}`);
    return null;
  };

  // Função para calcular rota
  const calculateRoute = async (start: [number, number], end: [number, number]) => {
    try {
      const origem: [number, number] = [start[1], start[0]]; // [lng, lat]
      const destino: [number, number] = [end[1], end[0]]; // [lng, lat]
      
      console.log('🚀 [MALOTE] Calculando rota');
      console.log('📍 [MALOTE] Origem:', origem, 'Destino:', destino);
      
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
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data && result.data.coordinates) {
        console.log('✅ [MALOTE] Rota calculada com sucesso');
        const coordinates = result.data.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        
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
        throw new Error(result.message || 'Erro ao processar dados da rota');
      }
    } catch (error) {
      console.error('❌ [MALOTE] Erro ao calcular rota:', error);
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

  // Função para limpar elementos do mapa
  const clearMapElements = () => {
    if (!mapInstanceRef.current) return;
    
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    markersRef.current = [];
    
    if (routeLayerRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    
    setRouteInfo(null);
  };

  // Função para plotar setores no mapa
  const plotSetores = async () => {
    if (!mapInstanceRef.current) return;
    
    setLoading(true);
    setError(null);
    clearMapElements();
    
    const coordenadasValidas: Array<{ coords: Coordenadas; tipo: 'origem' | 'destino'; nome: string }> = [];
    
    try {
      // Processar setor de origem
      if (setorOrigemData) {
        console.log('🔍 [MALOTE] Processando setor de origem:', setorOrigemData.NOME);
        const coords = await geocodificarSetor(setorOrigemData);
        
        if (coords) {
          console.log('✅ [MALOTE] Coordenadas Origem:', coords);
          coordenadasValidas.push({ coords, tipo: 'origem', nome: setorOrigemData.NOME });
        } else {
          console.warn(`⚠️ [MALOTE] Setor origem ${setorOrigemData.NOME} sem coordenadas`);
        }
      }
      
      // Processar setor de destino
      if (setorDestinoData) {
        console.log('🔍 [MALOTE] Processando setor de destino:', setorDestinoData.NOME);
        const coords = await geocodificarSetor(setorDestinoData);
        
        if (coords) {
          console.log('✅ [MALOTE] Coordenadas Destino:', coords);
          coordenadasValidas.push({ coords, tipo: 'destino', nome: setorDestinoData.NOME });
        } else {
          console.warn(`⚠️ [MALOTE] Setor destino ${setorDestinoData.NOME} sem coordenadas`);
        }
      }
      
      // Adicionar marcadores
      coordenadasValidas.forEach(({ coords, tipo, nome }) => {
        const marker = L.marker([coords.lat, coords.lng], {
          icon: tipo === 'origem' ? origemIcon : destinoIcon
        }).addTo(mapInstanceRef.current!);
        
        const setorData = tipo === 'origem' ? setorOrigemData : setorDestinoData;
        
        let popupContent = `
          <div class="p-3 min-w-[250px]">
            <div class="font-bold text-base mb-2 text-${tipo === 'origem' ? 'green' : 'red'}-600">
              📦 ${tipo === 'origem' ? 'SETOR ORIGEM' : 'SETOR DESTINO'}
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
        
        popupContent += `</div>`;
        
        marker.bindPopup(popupContent);
        markersRef.current.push(marker);
      });
      
      // Calcular rota se ambos os setores têm coordenadas
      if (coordenadasValidas.length === 2) {
        const origem = coordenadasValidas.find(c => c.tipo === 'origem');
        const destino = coordenadasValidas.find(c => c.tipo === 'destino');
        
        if (origem && destino) {
          console.log('🗺️ [MALOTE] Calculando rota entre setores');
          const routeCoords = await calculateRoute([origem.coords.lat, origem.coords.lng], [destino.coords.lat, destino.coords.lng]);
          
          if (routeCoords) {
            routeLayerRef.current = L.polyline(routeCoords, {
              color: '#dc2626',
              weight: 4,
              opacity: 0.8
            }).addTo(mapInstanceRef.current);
          }
        }
        
        // Ajustar visualização
        const group = new L.FeatureGroup(markersRef.current);
        if (routeLayerRef.current) {
          group.addLayer(routeLayerRef.current);
        }
        mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [20, 20] });
      } else if (coordenadasValidas.length === 1) {
        // Centralizar no único setor
        mapInstanceRef.current.setView([coordenadasValidas[0].coords.lat, coordenadasValidas[0].coords.lng], 15);
      } else {
        // Manter visualização do Tocantins
        mapInstanceRef.current.setView(COORDENADAS_TOCANTINS, ZOOM_TOCANTINS);
      }
      
    } catch (error) {
      console.error('[MALOTE] Erro ao plotar setores:', error);
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        Rota do Malote
      </h4>
      
      <div className="relative">
        <div 
          ref={mapRef} 
          className="w-full h-80 rounded-lg border border-gray-200 bg-gray-50"
        />
        
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
              Carregando mapa do malote...
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute top-2 left-2 right-2 bg-red-50 border border-red-200 rounded p-2">
            <div className="text-sm text-red-600">{error}</div>
          </div>
        )}
        
        {routeInfo && (
          <div className="absolute bottom-2 left-2 bg-white bg-opacity-95 rounded-lg p-2 shadow-lg border">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span className="font-medium text-gray-700">{routeInfo.distance}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <span>Setor Origem</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded-full border border-white shadow"></div>
          <span>Setor Destino</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-0.5 bg-red-600"></div>
          <span>Rota do Malote</span>
        </div>
      </div>
      
      {/* Status dos setores */}
      <div className="text-xs text-gray-500">
        {setorOrigemData && !setorDestinoData && (
          <div className="text-center">Setor origem selecionado. Selecione o setor destino para traçar a rota.</div>
        )}
        {!setorOrigemData && setorDestinoData && (
          <div className="text-center">Setor destino selecionado. Selecione o setor origem para traçar a rota.</div>
        )}
        {setorOrigemData && setorDestinoData && (
          <div className="text-center text-green-600">Rota do malote calculada entre os setores.</div>
        )}
      </div>
    </div>
  );
};

export default MapaMalote;