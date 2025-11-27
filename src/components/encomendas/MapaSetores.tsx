import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { MapPin, Route, Clock, Maximize2, Minimize2, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { GeocodingService, Coordenadas } from '../../services/geocoding.service';
import { Setor, SetorWithCoordinates } from '../../types/setor.types';
import { getApiBaseUrl } from '@/utils/api-url';
import { mapIcons } from '@/utils/map-icons';

// Fix para os ícones do Leaflet no Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Ícones usando a nova implementação local
const origemIcon = mapIcons.origem;
const destinoIcon = mapIcons.destino;

interface MapaSetoresProps {
  setorOrigem: string;
  setorDestino: string;
  onExpandedChange?: (expanded: boolean) => void;
}

// Interface para dados da rota
interface RouteData {
  coordinates: [number, number][];
  distance: number;
  duration: number;
}

// Configuração da API OpenRouteService
// A chave API é obtida dinamicamente do backend via endpoint /api/routing/directions
const ORS_BASE_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';

// Sistema de cache persistente para coordenadas dos setores
interface CacheEntry {
  coordenadas: Coordenadas;
  timestamp: number;
  version: string;
}

// Sistema de cache para dados completos dos setores
interface SetorCacheEntry {
  setor: Setor;
  timestamp: number;
  version: string;
}

class SetoresCache {
  private static readonly CACHE_KEY = 'setores_dados_cache';
  private static readonly CACHE_VERSION = '1.0';
  private static readonly CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutos
  private static cache: { [key: string]: SetorCacheEntry } = {};
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
      console.warn('Erro ao carregar cache de setores:', error);
    }
    
    this.initialized = true;
  }

  static get(nomeSetor: string): Setor | null {
    this.init();
    const key = nomeSetor.toLowerCase().trim();
    const entry = this.cache[key];
    if (!entry) return null;
    
    const now = Date.now();
    if ((now - entry.timestamp) > this.CACHE_EXPIRY) {
      delete this.cache[key];
      this.saveToStorage();
      return null;
    }
    
    return entry.setor;
  }

  static set(nomeSetor: string, setor: Setor): void {
    this.init();
    const key = nomeSetor.toLowerCase().trim();
    this.cache[key] = {
      setor,
      timestamp: Date.now(),
      version: this.CACHE_VERSION
    };
    this.saveToStorage();
  }

  private static saveToStorage(): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Erro ao salvar cache de setores:', error);
    }
  }

  static clear(): void {
    this.cache = {};
    localStorage.removeItem(this.CACHE_KEY);
  }

  static getStats(): { total: number; expired: number } {
    this.init();
    const now = Date.now();
    let expired = 0;
    const total = Object.keys(this.cache).length;
    
    Object.values(this.cache).forEach(entry => {
      if ((now - entry.timestamp) > this.CACHE_EXPIRY) {
        expired++;
      }
    });
    
    return { total, expired };
  }
}

class CoordenadasCache {
  private static readonly CACHE_KEY = 'setores_coordenadas_cache';
  private static readonly CACHE_VERSION = '1.0';
  private static readonly CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 dias
  private static cache: { [key: string]: CacheEntry } = {};
  private static initialized = false;

  private static init() {
    if (this.initialized) return;
    
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        // Limpar entradas expiradas ou de versão antiga
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

  static clear(): void {
    this.cache = {};
    localStorage.removeItem(this.CACHE_KEY);
  }

  static getStats(): { total: number; expired: number } {
    this.init();
    const now = Date.now();
    let expired = 0;
    const total = Object.keys(this.cache).length;
    
    Object.values(this.cache).forEach(entry => {
      if ((now - entry.timestamp) > this.CACHE_EXPIRY) {
        expired++;
      }
    });
    
    return { total, expired };
  }
}

// Coordenadas padrão para Palmas (fallback)
  

// Componente de overlay para informações da rota
const RouteInfoOverlay: React.FC<{ routeData: any; formatDuration: (minutes: number) => string }> = ({ routeData, formatDuration }) => {
  useEffect(() => {
    const overlayElement = document.createElement('div');
    overlayElement.className = 'route-info-overlay';
    overlayElement.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(255, 255, 255, 0.95);
      padding: 8px 12px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      font-size: 12px;
      font-weight: 500;
      color: #059669;
      z-index: 1000;
      border: 1px solid #d1fae5;
      backdrop-filter: blur(4px);
    `;
    
    overlayElement.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <div>📍 Distância: ${routeData.distance} km</div>
        <div>⏱️ Tempo: ${formatDuration(routeData.duration)}</div>
      </div>
    `;
    
    const mapContainer = document.querySelector('.leaflet-container');
    if (mapContainer) {
      mapContainer.appendChild(overlayElement);
    }
    
    return () => {
      if (overlayElement && overlayElement.parentNode) {
        overlayElement.parentNode.removeChild(overlayElement);
      }
    };
  }, [routeData, formatDuration]);
  
  return null;
};

const MapaSetores: React.FC<MapaSetoresProps> = React.memo(({ setorOrigem, setorDestino, onExpandedChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [setores, setSetores] = useState<SetorWithCoordinates[]>([]);
  const [isLoadingSetores, setIsLoadingSetores] = useState(true);
  const [coordOrigem, setCoorOrigem] = useState<Coordenadas | null>(null);
  const [coordDestino, setCoorDestino] = useState<Coordenadas | null>(null);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [loadingTooltips, setLoadingTooltips] = useState<{ [key: string]: boolean }>({});
  const [tooltipData, setTooltipData] = useState<{ [key: string]: SetorWithCoordinates | null }>({});

  // Função para converter minutos em formato horas:minutos:segundos
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.round((minutes % 1) * 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}min ${secs}s`;
    } else if (mins > 0) {
      return `${mins}min ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Hook para debounce
  const useDebounce = (value: any, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  // Debounce dos nomes dos setores para evitar chamadas excessivas
  const debouncedSetorOrigem = useDebounce(setorOrigem, 300);
  const debouncedSetorDestino = useDebounce(setorDestino, 300);

  // Função para buscar setores específicos da API com cache (memoizada)
  const buscarSetoresEspecificos = useCallback(async (nomeSetores: string[]): Promise<Setor[]> => {
    try {
      const apiBase = getApiBaseUrl();
      const setoresEncontrados: Setor[] = [];
      const setoresParaBuscar: string[] = [];
      
      // Primeiro, verificar cache para cada setor
      for (const nomeSetor of nomeSetores) {
        if (!nomeSetor) continue;
        
        const setorCacheado = SetoresCache.get(nomeSetor);
        if (setorCacheado) {
          console.log(`💾 Cache hit para setor: ${nomeSetor}`);
          setoresEncontrados.push(setorCacheado);
        } else {
          setoresParaBuscar.push(nomeSetor);
        }
      }
      
      // Buscar apenas os setores que não estão em cache
      for (const nomeSetor of setoresParaBuscar) {
        try {
          console.log(`🔍 Buscando setor na API: ${nomeSetor}`);
          const url = `${apiBase}/setores?search=${encodeURIComponent(nomeSetor)}&limit=10`;
          console.log(`🌐 URL da API: ${url}`);
          const response = await fetch(url);
          console.log(`📡 Response status: ${response.status} ${response.statusText}`);
          if (response.ok) {
            const data = await response.json();
            console.log(`📊 Dados retornados da API para '${nomeSetor}':`, data);
            const setores = (data.data || data || []) as Setor[];
            console.log(`📋 Setores encontrados: ${setores.length}`);
            if (setores.length > 0) {
              console.log('🔍 Primeiro setor encontrado:', setores[0]);
            }
            
            // Encontrar o setor mais relevante
            const setorEncontrado = setores.find(s => {
              const nomesPossiveis = [
                (s as any).nome_setor,
                (s as any).NOME_SETOR
              ].filter(Boolean).map(n => String(n).toLowerCase().trim());
              
              return nomesPossiveis.some(nome => 
                nome === nomeSetor.toLowerCase().trim() ||
                nome.includes(nomeSetor.toLowerCase().trim()) ||
                nomeSetor.toLowerCase().trim().includes(nome)
              );
            });
            
            if (setorEncontrado) {
              setoresEncontrados.push(setorEncontrado);
              // Salvar no cache
              SetoresCache.set(nomeSetor, setorEncontrado);
              console.log(`💾 Setor salvo no cache: ${nomeSetor}`);
            }
          }
        } catch (error) {
          console.warn(`Erro ao buscar setor ${nomeSetor}:`, error);
        }
      }
      
      const cacheStats = SetoresCache.getStats();
      console.log(`📊 Setores carregados: ${setoresEncontrados.length}/${nomeSetores.length} (Cache: ${cacheStats.total} entradas)`);
      return setoresEncontrados;
    } catch (error) {
      console.error('Erro ao buscar setores específicos:', error);
      return [];
    }
  }, []);

  // Função para geocodificar setores em lotes para melhor performance (memoizada)
  const geocodificarSetoresEmLotes = useCallback(async (setores: Setor[], batchSize: number = 5): Promise<SetorWithCoordinates[]> => {
    const resultados: SetorWithCoordinates[] = [];
    const total = setores.length;
    
    console.log(`🔄 Iniciando geocodificação em lotes de ${batchSize} setores (total: ${total})`);
    
    for (let i = 0; i < setores.length; i += batchSize) {
      const lote = setores.slice(i, i + batchSize);
      console.log(`📦 Processando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(total / batchSize)} (${lote.length} setores)`);
      
      // Processar lote em paralelo
      const promessasLote = lote.map(setor => geocodificarSetor(setor));
      const resultadosLote = await Promise.all(promessasLote);
      
      resultados.push(...resultadosLote);
      
      // Pequena pausa entre lotes para não sobrecarregar as APIs
      if (i + batchSize < setores.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`✅ Geocodificação em lotes concluída: ${resultados.length} setores processados`);
    return resultados;
  }, []);

  // Função para geocodificar um setor (PRIORIZA ABSOLUTAMENTE coordenadas do banco) (memoizada)
  const geocodificarSetor = useCallback(async (setor: Setor): Promise<SetorWithCoordinates> => {
    // Normalização mínima de campos (tolerar variações vindas do backend)
    const codigoSetor = (setor as any).codigo_setor || (setor as any).CODIGO_SETOR || (setor as any).codigoSetor;
    const nomeSetor = (setor as any).nome_setor || (setor as any).NOME_SETOR;
    const cep = (setor as any).cep || (setor as any).CEP;
    const latRaw = (setor as any).latitude ?? (setor as any).LATITUDE;
    const lngRaw = (setor as any).longitude ?? (setor as any).LONGITUDE;

    const setorKey = codigoSetor || nomeSetor;

    // PRIORIDADE ABSOLUTA: Usar coordenadas salvas no banco de dados quando válidas
    if (latRaw != null && lngRaw != null) {
      const coordenadas = {
        lat: parseFloat(String(latRaw).replace(',', '.')),
        lng: parseFloat(String(lngRaw).replace(',', '.'))
      };
      if (!Number.isNaN(coordenadas.lat) && !Number.isNaN(coordenadas.lng) && coordenadas.lat !== 0 && coordenadas.lng !== 0) {
        console.log(`📍 [PRIORIDADE BANCO] Usando coordenadas do banco para setor ${nomeSetor}:`, coordenadas);
        if (setorKey) CoordenadasCache.set(setorKey, coordenadas);
        return {
          ...setor,
          codigo_setor: (setor as any).codigo_setor ?? (setor as any).CODIGO_SETOR ?? codigoSetor,
          nome_setor: (setor as any).nome_setor ?? (setor as any).NOME_SETOR ?? nomeSetor,
          coordenadas
        } as SetorWithCoordinates;
      }
    }

    // FALLBACK 1: Verificar cache persistente
    if (setorKey) {
      const coordenadasCacheadas = CoordenadasCache.get(setorKey);
      if (coordenadasCacheadas) {
        console.log(`💾 Cache hit para setor ${nomeSetor}:`, coordenadasCacheadas);
        return {
          ...setor,
          codigo_setor: (setor as any).codigo_setor ?? (setor as any).CODIGO_SETOR ?? codigoSetor,
          nome_setor: (setor as any).nome_setor ?? (setor as any).NOME_SETOR ?? nomeSetor,
          coordenadas: coordenadasCacheadas
        } as SetorWithCoordinates;
      }
    }

    // FALLBACK 2: Se tem CEP, tentar geocodificar
    if (cep) {
      console.log(`🔍 [FALLBACK CEP] Geocodificando setor ${nomeSetor} por CEP: ${cep}`);
      try {
        const resultado = await GeocodingService.geocodeByCep(cep);
        if (resultado.coordenadas) {
          console.log(`✅ CEP ${cep} geocodificado com sucesso:`, resultado.coordenadas);
          if (setorKey) CoordenadasCache.set(setorKey, resultado.coordenadas);
          return {
            ...setor,
            codigo_setor: (setor as any).codigo_setor ?? (setor as any).CODIGO_SETOR ?? codigoSetor,
            nome_setor: (setor as any).nome_setor ?? (setor as any).NOME_SETOR ?? nomeSetor,
            coordenadas: resultado.coordenadas
          } as SetorWithCoordinates;
        } else {
          console.warn(`⚠️ CEP ${cep} não pôde ser geocodificado:`, resultado.erro);
        }
      } catch (error) {
        console.error(`❌ Erro ao geocodificar CEP ${cep}:`, error);
      }
    }

    // CORREÇÃO ESPECÍFICA: Coordenadas corretas para setores com problemas conhecidos
    const setorId = (setor as any).id ?? (setor as any).ID ?? (setor as any).ID_SETOR;
    if (setorId === 26 || (nomeSetor && nomeSetor.includes('Tecnologia da Informação'))) {
      console.log(`🔧 Aplicando correção específica para Araguaína (Setor 26)`);
      const coordenadasCorrigidas = {
        lat: -7.1909,
        lng: -48.2073
      };
      console.log(`✅ Coordenadas corrigidas aplicadas:`, coordenadasCorrigidas);
      if (setorKey) CoordenadasCache.set(setorKey, coordenadasCorrigidas);
      return {
        ...setor,
        codigo_setor: (setor as any).codigo_setor ?? (setor as any).CODIGO_SETOR ?? codigoSetor,
        nome_setor: (setor as any).nome_setor ?? (setor as any).NOME_SETOR ?? nomeSetor,
        coordenadas: coordenadasCorrigidas
      } as SetorWithCoordinates;
    }

    // FALLBACK 3: Coordenadas inteligentes baseadas na cidade do setor
    const cidade = (setor as any).cidade || (setor as any).CIDADE || (setor as any).municipio_lotacao || (setor as any).MUNICIPIO_LOTACAO;
    const estado = (setor as any).estado || (setor as any).ESTADO || (setor as any).uf || (setor as any).UF;
    
    if (cidade && estado) {
      console.log(`🏙️ Tentando obter coordenadas da cidade ${cidade}, ${estado} para setor ${nomeSetor}`);
      try {
        const cityResult = await GeocodingService.geocodeByCityState(cidade, estado);
        if (cityResult.coordenadas) {
          console.log(`✅ Coordenadas da cidade obtidas como fallback:`, cityResult.coordenadas);
          if (setorKey) CoordenadasCache.set(setorKey, cityResult.coordenadas);
          return {
            ...setor,
            codigo_setor: (setor as any).codigo_setor ?? (setor as any).CODIGO_SETOR ?? codigoSetor,
            nome_setor: (setor as any).nome_setor ?? (setor as any).NOME_SETOR ?? nomeSetor,
            coordenadas: cityResult.coordenadas
          } as SetorWithCoordinates;
        }
      } catch (error) {
        console.error(`❌ Erro ao geocodificar cidade ${cidade}:`, error);
      }
    }

    // SEM FALLBACK ARTIFICIAL: Retornar setor sem coordenadas se não conseguir geocodificar
    console.warn(`⚠️ Não foi possível obter coordenadas para setor ${nomeSetor} - retornando sem coordenadas`);
    return {
      ...setor,
      codigo_setor: (setor as any).codigo_setor ?? (setor as any).CODIGO_SETOR ?? codigoSetor,
      nome_setor: (setor as any).nome_setor ?? (setor as any).NOME_SETOR ?? nomeSetor,
      coordenadas: undefined
    } as SetorWithCoordinates;
  }, []);

  // Função auxiliar para normalizar texto
  const normalizar = useCallback((texto: string) => {
    return texto
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, ' '); // Normaliza espaços
  }, []);

  // Índice otimizado para busca de setores (memoizado)
  const indiceSetores = useMemo(() => {
    const indiceExato = new Map<string, SetorWithCoordinates>();
    const indiceParcial = new Map<string, SetorWithCoordinates[]>();
    
    setores.forEach(setor => {
      const nomesPossiveis = [
        (setor as any).nome_setor,
        (setor as any).NOME_SETOR,
        (setor as any).codigo_setor,
        (setor as any).CODIGO_SETOR
      ].filter(Boolean).map(n => normalizar(String(n)));
      
      nomesPossiveis.forEach(nome => {
        // Índice para correspondência exata
        indiceExato.set(nome, setor);
        
        // Índice para correspondência parcial (palavras)
        const palavras = nome.split(' ').filter(p => p.length > 2);
        palavras.forEach(palavra => {
          if (!indiceParcial.has(palavra)) {
            indiceParcial.set(palavra, []);
          }
          const setoresPorPalavra = indiceParcial.get(palavra)!;
          if (!setoresPorPalavra.includes(setor)) {
            setoresPorPalavra.push(setor);
          }
        });
      });
    });
    
    return { exato: indiceExato, parcial: indiceParcial };
  }, [setores, normalizar]);

  // Função otimizada para encontrar setor por nome usando índices (memoizada)
  const encontrarSetorPorNome = useCallback((nomeSetor: string): SetorWithCoordinates | null => {
    if (!nomeSetor) return null;
    
    const alvoNormalizado = normalizar(nomeSetor);
    console.log('🔍 Buscando setor:', nomeSetor, '-> normalizado:', alvoNormalizado);
    
    // 1. Busca exata no índice (O(1))
    let setorEncontrado = indiceSetores.exato.get(alvoNormalizado);
    
    // 2. Se não encontrou, busca parcial usando palavras-chave
    if (!setorEncontrado) {
      const palavrasChave = alvoNormalizado.split(' ').filter(p => p.length > 2);
      const candidatos = new Set<SetorWithCoordinates>();
      
      // Coletar candidatos baseado nas palavras-chave
      palavrasChave.forEach(palavra => {
        const setoresPorPalavra = indiceSetores.parcial.get(palavra) || [];
        setoresPorPalavra.forEach(setor => candidatos.add(setor));
      });
      
      // Encontrar o melhor candidato
      if (candidatos.size > 0) {
        const candidatosArray = Array.from(candidatos);
        
        // Priorizar correspondência que contenha mais palavras-chave
        setorEncontrado = candidatosArray.reduce((melhor, atual) => {
          const nomeAtual = normalizar(String((atual as any).nome_setor || (atual as any).NOME_SETOR || ''));
          const nomeMelhor = normalizar(String((melhor as any).nome_setor || (melhor as any).NOME_SETOR || ''));
          
          const scoreAtual = palavrasChave.filter(palavra => nomeAtual.includes(palavra)).length;
          const scoreMelhor = palavrasChave.filter(palavra => nomeMelhor.includes(palavra)).length;
          
          return scoreAtual > scoreMelhor ? atual : melhor;
        });
      }
    }
    
    // 3. Fallback: busca por inclusão de substring (apenas se necessário)
    if (!setorEncontrado) {
      setorEncontrado = setores.find((s) => {
        const nomesPossiveis = [
          (s as any).nome_setor,
          (s as any).NOME_SETOR,
          (s as any).codigo_setor,
          (s as any).CODIGO_SETOR
        ]
          .filter(Boolean)
          .map((v: any) => normalizar(String(v)));
        
        return nomesPossiveis.some(nome => 
          nome.includes(alvoNormalizado) || alvoNormalizado.includes(nome)
        );
      });
    }
    
    if (setorEncontrado) {
      console.log('✅ Setor encontrado:', setorEncontrado);
    } else {
      console.warn('❌ Setor não encontrado para:', nomeSetor);
      console.log('📋 Setores disponíveis:', setores.map(s => ({
        nome_setor: (s as any).nome_setor || (s as any).NOME_SETOR
      })));
    }
    
    return setorEncontrado || null;
  }, [setores, indiceSetores, normalizar]);

  // Função para carregar dados do tooltip de forma lazy (memoizada)
  const loadTooltipData = useCallback(async (setorNome: string, tipo: 'origem' | 'destino') => {
    const key = `${tipo}-${setorNome}`;
    
    // Se já está carregando ou já foi carregado, não fazer nada
    if (loadingTooltips[key] || tooltipData[key] !== undefined) {
      return;
    }
    
    setLoadingTooltips(prev => ({ ...prev, [key]: true }));
    
    try {
      // Simular um pequeno delay para mostrar o loading
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const setorData = encontrarSetorPorNome(setorNome);
      setTooltipData(prev => ({ ...prev, [key]: setorData }));
    } catch (error) {
      console.error('Erro ao carregar dados do tooltip:', error);
      setTooltipData(prev => ({ ...prev, [key]: null }));
    } finally {
      setLoadingTooltips(prev => ({ ...prev, [key]: false }));
    }
  }, [encontrarSetorPorNome, loadingTooltips, tooltipData]);

  // Componente de tooltip otimizado
  const LazyTooltip = ({ setorNome, tipo, coordenadas }: { 
    setorNome: string; 
    tipo: 'origem' | 'destino'; 
    coordenadas: Coordenadas;
  }) => {
    const key = `${tipo}-${setorNome}`;
    const isLoading = loadingTooltips[key];
    const setorData = tooltipData[key];
    const isOrigem = tipo === 'origem';
    
    // Carregar dados quando o componente é montado
    useEffect(() => {
      loadTooltipData(setorNome, tipo);
    }, [setorNome, tipo, loadTooltipData]);
    
    return (
      <div className="text-sm max-w-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Carregando informações...</span>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Nome do Setor */}
            <p className={`text-sm font-medium mb-2 ${
              isOrigem ? 'text-green-800' : 'text-red-800'
            }`}>
              {isOrigem ? '📦' : '🎯'} <strong>{setorData?.nome_setor || setorNome}</strong>
            </p>
            
            <div className="text-xs">
              <p><span className="font-medium">🏢 Setor:</span> {setorData?.nome_setor || setorNome}</p>
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs mb-1"><span className="font-medium">📍 Endereço:</span></p>
              <div className="text-xs text-gray-600 ml-4">
                {(() => {
                  // Tentar acessar campos com diferentes variações de case
                  const logradouro = setorData?.logradouro || setorData?.LOGRADOURO;
                  const numero = setorData?.numero || setorData?.NUMERO;
                  const complemento = setorData?.complemento || setorData?.COMPLEMENTO;
                  const bairro = setorData?.bairro || setorData?.BAIRRO;
                  const cidade = setorData?.cidade || setorData?.CIDADE || setorData?.municipio_lotacao || setorData?.MUNICIPIO_LOTACAO;
                  const estado = setorData?.estado || setorData?.ESTADO || setorData?.uf || setorData?.UF || 'TO';
                  const cep = setorData?.cep || setorData?.CEP;
                  
                  if (logradouro) {
                    return (
                      <>
                        {logradouro}{numero ? `, ${numero}` : ''}
                        {complemento && <div>{complemento}</div>}
                        {bairro && <div>{bairro}</div>}
                        <div>{cidade || 'N/A'}/{estado}</div>
                        {cep && <div>CEP: {cep}</div>}
                      </>
                    );
                  } else {
                    return 'Endereço não disponível';
                  }
                })()
                }
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // useEffect para carregar apenas os setores necessários (origem e destino) com debounce
  useEffect(() => {
    const carregarSetoresNecessarios = async () => {
      setIsLoadingSetores(true);
      setGeocodingError(null);
      
      console.log('🔍 MapaSetores - Carregamento otimizado (apenas setores necessários)...');
        console.log('📍 Setor Origem:', debouncedSetorOrigem, 'Tipo:', typeof debouncedSetorOrigem);
        console.log('📍 Setor Destino:', debouncedSetorDestino, 'Tipo:', typeof debouncedSetorDestino);
        console.log('🏁 Coordenadas iniciais - Origem:', coordOrigem, 'Destino:', coordDestino);
        
        // Verificar se os nomes dos setores são válidos
        if (!debouncedSetorOrigem || !debouncedSetorDestino) {
          console.warn('⚠️ PROBLEMA: Um ou ambos os setores estão vazios!');
          console.log('   - setorOrigem vazio?', !debouncedSetorOrigem);
          console.log('   - setorDestino vazio?', !debouncedSetorDestino);
          return;
        }
      
      try {
        // Buscar apenas os setores origem e destino
        const setoresNecessarios = [debouncedSetorOrigem, debouncedSetorDestino].filter(Boolean);
        console.log('🔍 Setores necessários para busca:', setoresNecessarios);
        const setoresData = await buscarSetoresEspecificos(setoresNecessarios);
        console.log('📊 Setores específicos carregados:', setoresData.length);
        console.log('📋 Dados dos setores encontrados:', setoresData.map(s => ({
          setor: (s as any).setor || (s as any).SETOR,
          cep: (s as any).cep || (s as any).CEP,
          latitude: (s as any).latitude || (s as any).LATITUDE,
          longitude: (s as any).longitude || (s as any).LONGITUDE
        })));
        
        // Geocodificar apenas os setores necessários (lote pequeno = 2)
        const setoresComCoordenadas = await geocodificarSetoresEmLotes(setoresData, 2);
        
        setSetores(setoresComCoordenadas);
        console.log('🗺️ Setores geocodificados:', setoresComCoordenadas.length);
        
        // Processar coordenadas usando a mesma lógica do MapaGeralEncomendas
        // PRIORIDADE: CEP do setor (se disponível) > coordenadas do setor > fallback
        
        // Processar Origem
        if (debouncedSetorOrigem) {
          const setorOrigemData = setoresComCoordenadas.find(s => {
            const nomesPossiveis = [
              (s as any).setor,
              (s as any).SETOR,
              (s as any).nome_setor,
              (s as any).NOME_SETOR
            ].filter(Boolean).map(n => String(n).toLowerCase().trim());
            
            return nomesPossiveis.some(nome => 
              nome === debouncedSetorOrigem.toLowerCase().trim() ||
              nome.includes(debouncedSetorOrigem.toLowerCase().trim()) ||
              debouncedSetorOrigem.toLowerCase().trim().includes(nome)
            );
          });
          
          console.log('🎯 Setor Origem encontrado:', setorOrigemData);
          
          if (setorOrigemData) {
            // PRIORIDADE 1: Se o setor tem CEP, sempre geocodificar pelo CEP
            const cepOrigem = (setorOrigemData as any).cep || (setorOrigemData as any).CEP;
            if (cepOrigem) {
              console.log(`🔍 [PRIORIDADE CEP] Geocodificando origem ${debouncedSetorOrigem} por CEP: ${cepOrigem}`);
              try {
                const setorOrigemCompleto = {
                  SETOR: debouncedSetorOrigem,
                  CEP: cepOrigem,
                  LATITUDE: (setorOrigemData as any).latitude ?? (setorOrigemData as any).LATITUDE,
                  LONGITUDE: (setorOrigemData as any).longitude ?? (setorOrigemData as any).LONGITUDE,
                };
                const setorGeocodificado = await geocodificarSetor(setorOrigemCompleto as Setor);
                setCoorOrigem(setorGeocodificado.coordenadas);
                console.log('✅ Coordenadas Origem definidas via CEP:', setorGeocodificado.coordenadas);
              } catch (error) {
                console.error('❌ Erro ao geocodificar CEP da origem:', error);
                // Fallback para coordenadas do setor
                if (setorOrigemData.coordenadas) {
                  setCoorOrigem(setorOrigemData.coordenadas);
                  console.log('🔄 Coordenadas Origem definidas via fallback:', setorOrigemData.coordenadas);
                }
              }
            } else {
              // FALLBACK: Usar coordenadas já geocodificadas do setor
              if (setorOrigemData.coordenadas) {
                setCoorOrigem(setorOrigemData.coordenadas);
                console.log('📍 Coordenadas Origem definidas (sem CEP):', setorOrigemData.coordenadas);
              } else {
                console.warn('⚠️ Setor origem sem coordenadas e sem CEP');
              }
            }
          } else {
            console.warn('⚠️ Setor origem não encontrado');
          }
        }
        
        // Processar Destino
        if (debouncedSetorDestino) {
          const setorDestinoData = setoresComCoordenadas.find(s => {
            const nomesPossiveis = [
              (s as any).setor,
              (s as any).SETOR,
              (s as any).nome_setor,
              (s as any).NOME_SETOR
            ].filter(Boolean).map(n => String(n).toLowerCase().trim());
            
            return nomesPossiveis.some(nome => 
              nome === debouncedSetorDestino.toLowerCase().trim() ||
              nome.includes(debouncedSetorDestino.toLowerCase().trim()) ||
              debouncedSetorDestino.toLowerCase().trim().includes(nome)
            );
          });
          
          console.log('🎯 Setor Destino encontrado:', setorDestinoData);
          
          if (setorDestinoData) {
            // PRIORIDADE 1: Se o setor tem CEP, sempre geocodificar pelo CEP
            const cepDestino = (setorDestinoData as any).cep || (setorDestinoData as any).CEP;
            if (cepDestino) {
              console.log(`🔍 [PRIORIDADE CEP] Geocodificando destino ${debouncedSetorDestino} por CEP: ${cepDestino}`);
              try {
                const setorDestinoCompleto = {
                  SETOR: debouncedSetorDestino,
                  CEP: cepDestino,
                  LATITUDE: (setorDestinoData as any).latitude ?? (setorDestinoData as any).LATITUDE,
                  LONGITUDE: (setorDestinoData as any).longitude ?? (setorDestinoData as any).LONGITUDE,
                };
                const setorGeocodificado = await geocodificarSetor(setorDestinoCompleto as Setor);
                setCoorDestino(setorGeocodificado.coordenadas);
                console.log('✅ Coordenadas Destino definidas via CEP:', setorGeocodificado.coordenadas);
              } catch (error) {
                console.error('❌ Erro ao geocodificar CEP do destino:', error);
                // Fallback para coordenadas do setor
                if (setorDestinoData.coordenadas) {
                  setCoorDestino(setorDestinoData.coordenadas);
                  console.log('🔄 Coordenadas Destino definidas via fallback:', setorDestinoData.coordenadas);
                }
              }
            } else {
              // FALLBACK: Usar coordenadas já geocodificadas do setor
              if (setorDestinoData.coordenadas) {
                setCoorDestino(setorDestinoData.coordenadas);
                console.log('📍 Coordenadas Destino definidas (sem CEP):', setorDestinoData.coordenadas);
              } else {
                console.warn('⚠️ Setor destino sem coordenadas e sem CEP');
              }
            }
          } else {
            console.warn('⚠️ Setor destino não encontrado');
          }
        }
        
        // Log final das coordenadas definidas
        console.log('🎯 COORDENADAS FINAIS DEFINIDAS:');
        console.log('   📍 Origem atual:', coordOrigem);
        console.log('   📍 Destino atual:', coordDestino);
        
      } catch (error) {
        console.error('❌ Erro ao carregar setores:', error);
        setGeocodingError('Erro ao carregar dados dos setores');
      } finally {
        setIsLoadingSetores(false);
      }
    };
    
    carregarSetoresNecessarios();
  }, [debouncedSetorOrigem, debouncedSetorDestino]);
  


  // Calcular o centro do mapa baseado nas duas coordenadas (memoizado)
  const center = useMemo((): [number, number] => {
    if (coordOrigem && coordDestino) {
      const centerLat = (coordOrigem.lat + coordDestino.lat) / 2;
      const centerLng = (coordOrigem.lng + coordDestino.lng) / 2;
      return [centerLat, centerLng];
    }
    if (coordOrigem) return [coordOrigem.lat, coordOrigem.lng];
    if (coordDestino) return [coordDestino.lat, coordDestino.lng];
    return [0, 0];
  }, [coordOrigem, coordDestino]);
  
  // Calcular zoom baseado na distância (memoizado)
  const zoomLevel = useMemo(() => {
    if (coordOrigem && coordDestino) {
      const distance = Math.sqrt(
        Math.pow(coordOrigem.lat - coordDestino.lat, 2) + 
        Math.pow(coordOrigem.lng - coordDestino.lng, 2)
      );
      return distance < 0.01 ? 12 : distance < 0.1 ? 10 : 8;
    }
    return coordOrigem || coordDestino ? 12 : 2;
  }, [coordOrigem, coordDestino]);
  
  // Coordenadas ajustadas para evitar sobreposição (memoizado)
  const coordDestinoAjustada = useMemo(() => {
    if (coordOrigem && coordDestino) {
      if (coordOrigem.lat === coordDestino.lat && coordOrigem.lng === coordDestino.lng) {
        return {
          lat: coordDestino.lat + 0.001,
          lng: coordDestino.lng + 0.001
        };
      }
      return coordDestino;
    }
    return null;
  }, [coordOrigem, coordDestino]);

  // Função para calcular rota usando endpoint proxy do backend (memoizada)
  const calculateRoute = useCallback(async () => {
    if (!coordOrigem || !coordDestino) return;
    
    setIsLoadingRoute(true);
    setRouteError(null);
    
    try {
      const origem: [number, number] = [coordOrigem.lng, coordOrigem.lat];
      const destino: [number, number] = [coordDestino.lng, coordDestino.lat];
      
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
      console.log('📡 Response ok:', response.ok);
      
      if (!response.ok) {
        console.error('❌ Erro na resposta:', response.status, response.statusText);
        try {
          const errorData = await response.json();
          console.error('❌ Dados do erro:', errorData);
          throw new Error(errorData.message || `Erro na API: ${response.status}`);
        } catch (parseError) {
          console.error('❌ Erro ao parsear resposta de erro:', parseError);
          throw new Error(`Erro na API: ${response.status} - ${response.statusText}`);
        }
      }
      
      const result = await response.json();
      console.log('✅ Resultado da API:', result);
      
      if (result.success && result.data) {
        console.log('✅ Rota calculada com sucesso:', result.data);
        setRouteData(result.data);
      } else {
        console.error('❌ Erro nos dados da rota:', result);
        throw new Error(result.message || 'Erro ao processar dados da rota');
      }
    } catch (error) {
      console.error('❌ Erro ao calcular rota:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setRouteError('Erro de conexão: Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      } else {
        setRouteError(`Não foi possível calcular a rota: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    } finally {
      setIsLoadingRoute(false);
    }
  }, [coordOrigem, coordDestino]);

  const toggleExpanded = useCallback(() => {
    const next = !isExpanded;
    setIsExpanded(next);
    if (onExpandedChange) {
      try { onExpandedChange(next); } catch {}
    }
  }, [isExpanded, onExpandedChange]);

  useEffect(() => {
    if (onExpandedChange) {
      try { onExpandedChange(isExpanded); } catch {}
    }
  }, [isExpanded, onExpandedChange]);

  // Calcular rota automaticamente quando expandir o mapa
  useEffect(() => {
    if (isExpanded && coordOrigem && coordDestino && !routeData) {
      calculateRoute();
    }
  }, [isExpanded, coordOrigem, coordDestino]);

  // Mostrar loading enquanto carrega setores
  if (isLoadingSetores) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
        <div className="flex items-center justify-center h-32">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-amber-700" />
            <p className="text-sm text-amber-800">Carregando dados dos setores...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar erro se houver problema na geocodificação
  if (geocodingError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
        <div className="flex items-center justify-center h-32">
          <div className="flex flex-col items-center gap-2 text-center">
            <MapPin className="h-6 w-6 text-red-500" />
            <p className="text-sm text-red-600">{geocodingError}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="text-xs"
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          onClick={toggleExpanded}
          className="flex items-center gap-2 p-2 hover:bg-amber-100"
        >
          <MapPin className="w-4 h-4 text-amber-700" />
          <span className="text-sm font-semibold text-amber-800">
            🗺️ Localização dos Setores no Mapa
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-amber-700" />
          ) : (
            <ChevronDown className="w-4 h-4 text-amber-700" />
          )}
        </Button>
        
        {isLoadingRoute ? (
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            Calculando rota automaticamente...
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={calculateRoute}
            disabled={!coordOrigem || !coordDestino}
            className="flex items-center gap-1 text-xs"
          >
            <Route className="w-3 h-3" />
            Recalcular Rota
          </Button>
        )}
      </div>
      

      
      {/* Erro na rota */}
      {routeError && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-sm text-red-800">❌ {routeError}</span>
        </div>
      )}

      {isExpanded && (
        <div className="mt-3">
          <div className="h-[500px] w-full rounded-lg overflow-hidden border border-amber-300 relative">
            {(isLoadingSetores || isLoadingRoute) && (
              <div className="absolute inset-0 z-[900] flex items-center justify-center bg-white/70">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando dados ...
                </div>
              </div>
            )}
            <MapContainer
              center={center}
              zoom={zoomLevel}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Overlay com informações da rota */}
              {routeData && <RouteInfoOverlay routeData={routeData} formatDuration={formatDuration} />}
              
              {/* Marker do Setor Origem */}
              {coordOrigem && (
                <Marker position={[coordOrigem.lat, coordOrigem.lng]} icon={origemIcon}>
                  <Popup>
                    <LazyTooltip 
                      setorNome={setorOrigem} 
                      tipo="origem" 
                      coordenadas={coordOrigem} 
                    />
                  </Popup>
                </Marker>
              )}

              {/* Marker do Setor Destino */}
              {coordDestinoAjustada && (
                <Marker position={[coordDestinoAjustada.lat, coordDestinoAjustada.lng]} icon={destinoIcon}>
                  <Popup>
                    <LazyTooltip 
                      setorNome={setorDestino} 
                      tipo="destino" 
                      coordenadas={coordDestinoAjustada} 
                    />
                  </Popup>
                </Marker>
              )}
              
              {/* Linha da rota */}
              {routeData && routeData.coordinates && (
                <Polyline 
                  positions={routeData.coordinates.map((coord: [number, number]) => [coord[1], coord[0]])}
                  color="#2563eb"
                  weight={4}
                  opacity={0.8}
                />
              )}
            </MapContainer>
          </div>
          
          <div className="mt-2 text-xs text-amber-700 text-center">
            💡 Clique nos marcadores para ver detalhes dos endereços
          </div>
        </div>
      )}
    </div>
  );
});

export default MapaSetores;