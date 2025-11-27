import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COORDENADAS_TOCANTINS, ZOOM_TOCANTINS, TOLERANCIA_COORDENADAS } from '@/constants/mapConstants';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Search, 
  MapPin, 
  Package, 
  User, 
  Building2, 
  Filter, 
  X, 
  Calendar,
  Clock,
  Truck,
  CheckCircle,
  AlertCircle,
  Loader2,
  Hash,
  QrCode,
  Info,
  ChevronUp, 
  ChevronDown
} from 'lucide-react';
import { api } from '@/lib/api';
import { useNotification } from '@/hooks/use-notification';
import NotificationModal from '@/components/ui/notification-modal';
import { GeocodingService, Coordenadas } from '@/services/geocoding.service';
import { Setor, SetorWithCoordinates } from '@/types/setor.types';
import type { Encomenda, EncomendaComCoordenadas } from '@/types/encomenda.types';
import { mapearStatus } from '@/types/encomenda.types';
import { 
  getStatusColor, 
  getStatusLabel, 
  getTipoColor, 
  getTipoLabel, 
  getPrioridadeColor, 
  getPrioridadeLabel, 
  getEntregaColor, 
  getEntregaLabel 
} from '@/utils/badge-colors';
import { debounce } from 'lodash';
import { getApiBaseUrl } from '@/utils/api-url';
import { mapIcons, getIconByStatus, createIconWithCounter } from '@/utils/map-icons';

// Fix para os ícones do Leaflet no Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Ícones usando a nova implementação local
const statusIcons = {
  pendente: mapIcons.pendente,
  preparando: mapIcons.preparando,
  transito: mapIcons.transito,
  entregue: mapIcons.entregue,
  devolvido: mapIcons.devolvido,
  default: mapIcons.default
};

// Ícones personalizados para origem e destino
const origemIcon = mapIcons.origem;
const destinoIcon = mapIcons.destino;

// Coordenadas e zoom unificados
// Usando valores compartilhados de mapConstants

// Tolerância para considerar coordenadas como "iguais" (em graus decimais)
const COORDINATE_TOLERANCE = TOLERANCIA_COORDENADAS; // ~11 metros

// Função para formatar matrícula e vínculo funcional
const formatMatriculaVinculo = (usuario: any) => {
  const matricula = usuario?.NUMERO_FUNCIONAL || usuario?.numero_funcional || usuario?.numeroFuncional || usuario?.matricula || usuario?.MATRICULA;
  const vinculo = usuario?.VINCULO_FUNCIONAL || usuario?.vinculo_funcional;
  
  if (matricula && vinculo) {
    return `${matricula}-${vinculo}`;
  } else if (matricula) {
    return matricula.toString();
  } else if (vinculo) {
    return vinculo;
  }
  return '-';
};

// Removido cache e busca duplicada de endereços de setores; usamos serviço central em outros componentes

// Interface para filtros (igual ao MapaRastreamento)
interface FiltrosRastreamento {
  numeroEncomenda: string;
  remetente: string;
  destinatario: string;
  setorOrigem: string;
  setorDestino: string;
  status: string;
  dataInicio: string;
  dataFim: string;
}

// Função para agrupar encomendas por CEP/setor (prioridade) ou coordenadas (fallback)
const agruparPorLocalizacao = (encomendas: EncomendaComCoordenadas[], tipo: 'origem' | 'destino') => {
  const grupos: { [key: string]: EncomendaComCoordenadas[] } = {};
  
  encomendas.forEach(encomenda => {
    let chave: string;
    
    // PRIORIDADE 1: Usar CEP do setor se disponível
    const nomeSetor = tipo === 'origem' ? encomenda.setorOrigem : encomenda.setorDestino;
    const setorInfo = encomenda.setoresInfo?.find(s => {
      const nome = (s as any).setor || (s as any).SETOR || (s as any).nome_setor || (s as any).NOME_SETOR;
      return nome === nomeSetor;
    });
    
    const cep = setorInfo ? ((setorInfo as any).cep || (setorInfo as any).CEP) : null;
    
    if (cep) {
      // Usar CEP como chave principal
      chave = `cep_${cep}`;
    } else {
      // FALLBACK: Usar coordenadas arredondadas
      const coord = tipo === 'origem' ? encomenda.coordOrigem : encomenda.coordDestino;
      if (!coord) return;
      
      const lat = Math.round(coord.lat / COORDINATE_TOLERANCE) * COORDINATE_TOLERANCE;
      const lng = Math.round(coord.lng / COORDINATE_TOLERANCE) * COORDINATE_TOLERANCE;
      chave = `coord_${lat.toFixed(4)},${lng.toFixed(4)}`;
    }
    
    if (!grupos[chave]) {
      grupos[chave] = [];
    }
    grupos[chave].push(encomenda);
  });
  
  return grupos;
};

// Função para criar ícone com contador (usando a implementação do utils)
const criarIconeComContador = (baseIcon: L.Icon, count: number) => {
  if (count === 1) return baseIcon;
  
  // Determinar cor baseada no tipo de ícone
  const isOrigem = baseIcon === origemIcon;
  const cor = isOrigem ? '#10b981' : '#ef4444';
  
  return createIconWithCounter(cor, count);
};

// Cache para coordenadas dos setores (copiado do MapaSetores)
interface CacheEntry {
  coordenadas: Coordenadas;
  timestamp: number;
  version: string;
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
      const stored = localStorage.getItem(this.CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.version === this.CACHE_VERSION) {
          this.cache = parsed.data || {};
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar cache de coordenadas:', error);
    }
    this.initialized = true;
  }

  static get(key: string): Coordenadas | null {
    this.init();
    const entry = this.cache[key];
    if (entry && Date.now() - entry.timestamp < this.CACHE_EXPIRY) {
      return entry.coordenadas;
    }
    return null;
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
      localStorage.setItem(this.CACHE_KEY, JSON.stringify({
        version: this.CACHE_VERSION,
        data: this.cache
      }));
    } catch (error) {
      console.warn('Erro ao salvar cache de coordenadas:', error);
    }
  }
}

// Ícone para encomendas (azul)
const encomendaIcon = mapIcons.encomenda;

interface MapaGeralEncomendasProps {
  encomendas: Encomenda[];
  isVisible: boolean;
  refreshTrigger?: number; // Prop para forçar atualização
}

// Tipo já definido em encomenda.types.ts

// Novo: dados de rota por encomenda (similar ao MapaSetores)
interface RouteData {
  coordinates: [number, number][];
  distance: number;
  duration: number;
}

// Função para buscar setores da API (copiada do MapaSetores)
const getApiBase = (): string => {
  return getApiBaseUrl().replace(/\/$/, '');
};

const buscarSetores = async (): Promise<Setor[]> => {
  try {
    const apiBase = getApiBase();
     const response = await fetch(`${apiBase}/setores?limit=1000`);
     if (!response.ok) {
       throw new Error('Erro ao buscar setores');
     }
     const data = await response.json();
     return (data.data || data || []) as Setor[];
   } catch (error) {
     console.error('Erro ao buscar setores:', error);
     return [];
   }
 };

// Função para buscar setores relevantes (otimização)
const buscarSetoresRelevantes = async (nomesSetores: string[]): Promise<Setor[]> => {
  if (nomesSetores.length === 0) {
    return [];
  }
  
  try {
    // Buscar todos os setores e filtrar apenas os relevantes
    const todosSetores = await buscarSetores();
    const setoresRelevantes = todosSetores.filter(setor => {
      const nomeSetor = (setor as any).setor || (setor as any).SETOR || (setor as any).nome_setor || (setor as any).NOME_SETOR || '';
      return nomesSetores.some(nome => 
        nomeSetor.toLowerCase().includes(nome.toLowerCase()) ||
        nome.toLowerCase().includes(nomeSetor.toLowerCase())
      );
    });
    
    console.log(`Filtrados ${setoresRelevantes.length} setores relevantes de ${todosSetores.length} total`);
    return setoresRelevantes;
  } catch (error) {
    console.error('Erro ao buscar setores relevantes:', error);
    return [];
  }
};

// Função para geocodificar um setor (PRIORIZA ABSOLUTAMENTE coordenadas do banco)
const geocodificarSetor = async (setor: Setor): Promise<SetorWithCoordinates> => {
  const codigoSetor = (setor as any).codigo_setor || (setor as any).CODIGO_SETOR || (setor as any).codigoSetor;
  const nomeSetor = (setor as any).setor || (setor as any).SETOR || (setor as any).nome_setor || (setor as any).NOME_SETOR;
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
};

// Função para geocodificar setores em lotes (copiada do MapaSetores)
const geocodificarSetoresEmLotes = async (setores: Setor[], batchSize: number = 5): Promise<SetorWithCoordinates[]> => {
  const resultados: SetorWithCoordinates[] = [];
  
  for (let i = 0; i < setores.length; i += batchSize) {
    const lote = setores.slice(i, i + batchSize);
    const promessasLote = lote.map(setor => geocodificarSetor(setor));
    const resultadosLote = await Promise.all(promessasLote);
    resultados.push(...resultadosLote);
    
    // Pequena pausa entre lotes
    if (i + batchSize < setores.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return resultados;
};

// Função para encontrar setor por nome (copiada do MapaSetores)
const encontrarSetorPorNome = (setores: SetorWithCoordinates[], nomeSetor: string): SetorWithCoordinates | null => {
  if (!nomeSetor) return null;
  
  const normalizar = (texto: string) => {
    return texto
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, ' '); // Normaliza espaços
  };
  
  const alvoNormalizado = normalizar(nomeSetor);
  
  // Primeiro, tentar correspondência exata
  let setorEncontrado = setores.find((s) => {
    const nomesPossiveis = [
      (s as any).setor,
      (s as any).SETOR,
      (s as any).nome_setor,
      (s as any).NOME_SETOR,
      (s as any).codigo_setor,
      (s as any).CODIGO_SETOR
    ]
      .filter(Boolean)
      .map((v: any) => normalizar(String(v)));
    
    return nomesPossiveis.some(nome => nome === alvoNormalizado);
  });
  
  // Se não encontrou, tentar busca parcial (contém)
  if (!setorEncontrado) {
    setorEncontrado = setores.find((s) => {
      const nomesPossiveis = [
        (s as any).setor,
        (s as any).SETOR,
        (s as any).nome_setor,
        (s as any).NOME_SETOR
      ]
        .filter(Boolean)
        .map((v: any) => normalizar(String(v)));
      
      return nomesPossiveis.some(nome => nome.includes(alvoNormalizado) || alvoNormalizado.includes(nome));
    });
  }
  
  return setorEncontrado || null;
};

// Componente para atualizar o centro e zoom do mapa
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
};

// Componente que enquadra o mapa aos limites fornecidos quando 'trigger' muda
const FitBoundsOnTrigger: React.FC<{ trigger: number; bounds: L.LatLngBounds | null }> = ({ trigger, bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (!bounds) return;
    try {
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 12 });
    } catch (e) {
      // silencioso
    }
  }, [trigger]);
  return null;
};

const MapaGeralEncomendas: React.FC<MapaGeralEncomendasProps> = React.memo(({ encomendas, isVisible, refreshTrigger }) => {
  const { notification, isOpen, showError, showInfo, hideNotification } = useNotification();
  const [isExpanded, setIsExpanded] = useState(false);

  // Estados dos filtros
  const [filtros, setFiltros] = useState<FiltrosRastreamento>({
    numeroEncomenda: '',
    remetente: '',
    destinatario: '',
    setorOrigem: 'todos',
    setorDestino: 'todos',
    status: '',
    dataInicio: '',
    dataFim: ''
  });

  // Estados para pesquisa de usuários
  const [sugestoesRemetente, setSugestoesRemetente] = useState<any[]>([]);
  const [sugestoesDestinatario, setSugestoesDestinatario] = useState<any[]>([]);
  const [showSugestoesRemetente, setShowSugestoesRemetente] = useState(false);
  const [showSugestoesDestinatario, setShowSugestoesDestinatario] = useState(false);
  const [loadingRemetente, setLoadingRemetente] = useState(false);
  const [loadingDestinatario, setLoadingDestinatario] = useState(false);

  // Estados para encomendas filtradas
  const [encomendasFiltradas, setEncomendasFiltradas] = useState<EncomendaComCoordenadas[]>([]);
  const [loading, setLoading] = useState(false);
  // Controles de UI do mapa
  const [showLegend, setShowLegend] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [fitBoundsTick, setFitBoundsTick] = useState(0);
  const [centerOverride, setCenterOverride] = useState<[number, number] | null>(null);
  const [zoomOverride, setZoomOverride] = useState<number | null>(null);

  // Auto-expandir quando o mapa se torna visível
  useEffect(() => {
    if (isVisible && !isExpanded) {
      setIsExpanded(true);
    }
  }, [isVisible, isExpanded]);

  // Controlar cliques fora das sugestões
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Verificar se o clique foi fora das sugestões de remetente
      if (!target.closest('.sugestoes-remetente') && !target.closest('.input-remetente')) {
        setShowSugestoesRemetente(false);
      }
      
      // Verificar se o clique foi fora das sugestões de destinatário
      if (!target.closest('.sugestoes-destinatario') && !target.closest('.input-destinatario')) {
        setShowSugestoesDestinatario(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [encomendasComCoordenadas, setEncomendasComCoordenadas] = useState<EncomendaComCoordenadas[]>([]);
  const [isLoadingGeocode, setIsLoadingGeocode] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [setores, setSetores] = useState<SetorWithCoordinates[]>([]);
  // Lista completa de nomes de setores para os filtros (pré-carregados do sistema)
  const [setoresSelect, setSetoresSelect] = useState<string[]>([]);
  const [isLoadingSetores, setIsLoadingSetores] = useState(false);
  // Novo: estado para rotas calculadas por encomenda
  const [routesByEncomenda, setRoutesByEncomenda] = useState<Record<string, RouteData>>({});
  const routeCacheRef = useRef<Record<string, RouteData>>({});
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  
  // Estados para controlar os sliders dos popups
  const [popupIndices, setPopupIndices] = useState<Record<string, number>>({});
  
  // Funções para gerenciar os índices dos popups
  const getPopupIndex = useCallback((key: string) => {
    return popupIndices[key] || 0;
  }, [popupIndices]);
  
  const setPopupIndex = useCallback((key: string, index: number) => {
    setPopupIndices(prev => ({ ...prev, [key]: index }));
  }, []);

  // Função para geocodificar um endereço
  const geocodificarEndereco = useCallback(async (endereco: string): Promise<Coordenadas | null> => {
    try {
      const coordenadas = await GeocodingService.geocodificar(endereco);
      return coordenadas;
    } catch (error) {
      console.error('Erro ao geocodificar endereço:', endereco, error);
      return null;
    }
  }, []);

  // Novo: nomes dos setores (copiado do MapaSetores)
  const nomesSetoresDasEncomendas = useMemo(() => {
    const nomes = encomendas.map(e => e.setorOrigem || e.setorDestino);
    return Array.from(new Set(nomes.filter(Boolean)));
  }, [encomendas]);

  // Pré-carregar todos os setores do sistema para popular os selects de filtros
  useEffect(() => {
    const carregarSetoresSelect = async () => {
      try {
        const setoresBrutos = await buscarSetores();
        const nomes = Array.from(new Set(
          (setoresBrutos || [])
            .map((s: any) => s.nome || s.nome_setor || s.NOME_SETOR || s.setor || s.SETOR)
            .filter(Boolean)
        ));
        nomes.sort((a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
        setSetoresSelect(nomes);
      } catch (error) {
        console.error('Erro ao pré-carregar setores para filtros:', error);
      }
    };
    carregarSetoresSelect();
  }, []);

  // Função para processar coordenadas das encomendas usando a mesma lógica do MapaSetores
  const processarCoordenadasEncomendas = useCallback(async () => {
    if (!encomendas.length || !isExpanded) return;



    setIsLoadingGeocode(true);
    setGeocodingError(null);

    try {
      // Garante que temos os setores geocodificados antes de prosseguir
      if (setores.length === 0) {
        console.warn("Ainda não há setores geocodificados para processar as encomendas.");
        setIsLoadingGeocode(false);
        return;
      }

      const encomendasProcessadas = await Promise.all(
        encomendas.map(async (encomenda) => {
          const encomendaComCoord: EncomendaComCoordenadas = { ...encomenda };

          // Processar Origem (PRIORIDADE: CEP da encomenda)
          if (encomenda.setorOrigem) {
            const cepOrigem = (encomenda as any).setorOrigemCep;
            if (cepOrigem) {
              // Sempre tentar geocodificar pelo CEP primeiro
              const setorOrigemCompleto = {
                SETOR: encomenda.setorOrigem,
                CEP: cepOrigem,
                LATITUDE: encomenda.setorOrigemCoordenadas?.latitude,
                LONGITUDE: encomenda.setorOrigemCoordenadas?.longitude,
              };
              const setorGeocodificado = await geocodificarSetor(setorOrigemCompleto as Setor);
              encomendaComCoord.coordOrigem = setorGeocodificado.coordenadas;
            } else {
              // Sem CEP na encomenda: usar coordenadas do setor (se existentes) e, por fim, geocodificação
              const setorOrigem = encontrarSetorPorNome(setores, encomenda.setorOrigem);
              if (setorOrigem?.coordenadas) {
                encomendaComCoord.coordOrigem = setorOrigem.coordenadas;
              } else {
                const setorOrigemCompleto = {
                  SETOR: encomenda.setorOrigem,
                  CEP: (encomenda as any).setorOrigemCep,
                  LATITUDE: encomenda.setorOrigemCoordenadas?.latitude,
                  LONGITUDE: encomenda.setorOrigemCoordenadas?.longitude,
                };
                const setorGeocodificado = await geocodificarSetor(setorOrigemCompleto as Setor);
                encomendaComCoord.coordOrigem = setorGeocodificado.coordenadas;
              }
            }
          }

          // Processar Destino (PRIORIDADE: CEP da encomenda)
          if (encomenda.setorDestino) {
            const cepDestino = (encomenda as any).setorDestinoCep;
            if (cepDestino) {
              // Sempre tentar geocodificar pelo CEP primeiro
              const setorDestinoCompleto = {
                SETOR: encomenda.setorDestino,
                CEP: cepDestino,
                LATITUDE: encomenda.setorDestinoCoordenadas?.latitude,
                LONGITUDE: encomenda.setorDestinoCoordenadas?.longitude,
              };
              const setorGeocodificado = await geocodificarSetor(setorDestinoCompleto as Setor);
              encomendaComCoord.coordDestino = setorGeocodificado.coordenadas;
            } else {
              // Sem CEP na encomenda: usar coordenadas do setor (se existentes) e, por fim, geocodificação
              const setorDestino = encontrarSetorPorNome(setores, encomenda.setorDestino);
              if (setorDestino?.coordenadas) {
                encomendaComCoord.coordDestino = setorDestino.coordenadas;
              } else {
                const setorDestinoCompleto = {
                  SETOR: encomenda.setorDestino,
                  CEP: (encomenda as any).setorDestinoCep,
                  LATITUDE: encomenda.setorDestinoCoordenadas?.latitude,
                  LONGITUDE: encomenda.setorDestinoCoordenadas?.longitude,
                };
                const setorGeocodificado = await geocodificarSetor(setorDestinoCompleto as Setor);
                encomendaComCoord.coordDestino = setorGeocodificado.coordenadas;
              }
            }
          }

          return encomendaComCoord;
        })
      );

      setEncomendasComCoordenadas(encomendasProcessadas);
    } catch (error) {
      console.error('Erro ao processar coordenadas das encomendas:', error);
      setGeocodingError('Erro ao carregar localizações no mapa');
    } finally {
      setIsLoadingGeocode(false);
    }
  }, [encomendas, isExpanded, setores]);

  // Carregar apenas setores relevantes quando o componente for montado/atualizado
  useEffect(() => {
    const carregarSetores = async () => {
      // Se não há encomendas, evite carga pesada de setores
      const nomes = nomesSetoresDasEncomendas;
      if (nomes.length === 0) {
        setSetores([]);
        return;
      }

      setIsLoadingSetores(true);
      try {
        console.log('Carregando setores relevantes...', nomes);
        const setoresBrutos = await buscarSetoresRelevantes(nomes);
        console.log('Setores relevantes carregados:', setoresBrutos.length);

        if (setoresBrutos.length > 0) {
          console.log('Geocodificando setores relevantes...');
          const setoresComCoordenadas = await geocodificarSetoresEmLotes(setoresBrutos);
          console.log('Setores relevantes geocodificados:', setoresComCoordenadas.length);
          setSetores(setoresComCoordenadas);
        } else {
          setSetores([]);
        }
      } catch (error) {
        console.error('Erro ao carregar setores:', error);
      } finally {
        setIsLoadingSetores(false);
      }
    };

    carregarSetores();
  }, [nomesSetoresDasEncomendas]);

  // Processar coordenadas quando expandir o mapa
  useEffect(() => {
    console.log('MapaGeralEncomendas - useEffect:', { isExpanded, encomendasLength: encomendas.length, encomendas });
    if (isExpanded && encomendas.length > 0 && setores.length > 0) {
      processarCoordenadasEncomendas();
    }
  }, [isExpanded, processarCoordenadasEncomendas, setores, refreshTrigger]); // Adicionar refreshTrigger

  // Novo: calcular rotas para cada encomenda com coordOrigem e coordDestino
  const calculateRoutes = useCallback(async () => {
    if (!isExpanded) return;

    const pendentes = encomendasComCoordenadas.filter((enc) => enc.coordOrigem && enc.coordDestino && !routesByEncomenda[enc.id]);
    
    console.log('Debug calculateRoutes:', {
      isExpanded,
      encomendasComCoordenadasLength: encomendasComCoordenadas.length,
      pendentesLength: pendentes.length,
      routesByEncomendaKeys: Object.keys(routesByEncomenda),
      pendentesIds: pendentes.map(p => p.id)
    });
    
    if (pendentes.length === 0) return;

    setIsLoadingRoutes(true);
    try {
      const apiBase = getApiBase();
      console.log('API Base para rotas:', apiBase);
      const keyOf = (coords: [number, number][]) => `${coords[0][0].toFixed(6)},${coords[0][1].toFixed(6)}->${coords[1][0].toFixed(6)},${coords[1][1].toFixed(6)}`;
      const batchSize = 5;
      const next: Record<string, RouteData> = { ...routesByEncomenda };
      for (let i = 0; i < pendentes.length; i += batchSize) {
        const slice = pendentes.slice(i, i + batchSize);
        const results = await Promise.all(
          slice.map(async (enc) => {
            const coords: [number, number][] = [
              [enc.coordOrigem!.lng, enc.coordOrigem!.lat],
              [enc.coordDestino!.lng, enc.coordDestino!.lat]
            ];
            const k = keyOf(coords);
            const cached = routeCacheRef.current[k];
            if (cached) {
              return { id: enc.id, data: cached } as { id: string; data: RouteData };
            }
            const body = { profile: 'driving-car', coordinates: coords } as const;
            const bodyWithRadius = { ...body, radiuses: [5000, 5000] } as const;
            const url = `${apiBase}/routing/directions`;
            try {
              const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyWithRadius),
              });
              if (!response.ok) {
                const text = await response.text();
                console.error('Erro da API de rotas', { status: response.status, body, text, encomendaId: enc.id });
                return null;
              }
              const json = await response.json();
              if (json?.success && json?.data) {
                const d = json.data;
                const route: RouteData = {
                  coordinates: (d.coordinates || []) as [number, number][],
                  distance: typeof d.distance === 'string' ? parseFloat(d.distance) * 1000 : Number(d.distance) * 1000,
                  duration: Number(d.duration) * 60,
                };
                routeCacheRef.current[k] = route;
                return { id: enc.id, data: route } as { id: string; data: RouteData };
              }
              console.error('Resposta inválida da API de rotas para encomenda', enc.id, json);
              return null;
            } catch (e) {
              console.error('Falha ao obter rota', { encomendaId: enc.id, error: e, body });
              return null;
            }
          })
        );
        for (const r of results) {
          if (r) next[r.id] = r.data;
        }
      }
      if (Object.keys(next).length !== Object.keys(routesByEncomenda).length) {
        setRoutesByEncomenda(next);
      }
    } catch (err) {
      console.error('Erro ao calcular rotas em lote:', err);
    } finally {
      setIsLoadingRoutes(false);
    }
  }, [isExpanded, encomendasComCoordenadas, routesByEncomenda]);

  // Disparar cálculo de rotas quando coordenadas processadas mudarem
  useEffect(() => {
    if (isExpanded && encomendasComCoordenadas.length > 0) {
      calculateRoutes();
    }
  }, [isExpanded, encomendasComCoordenadas, calculateRoutes]);

  // Calcular centro do mapa - sempre centralizado no Tocantins para visualização otimizada
  const center = useMemo(() => {
    // Sempre centralizar no Tocantins para melhor visualização do estado
    return [COORDENADAS_TOCANTINS.lat, COORDENADAS_TOCANTINS.lng] as [number, number];
  }, []);

  // Zoom otimizado para mostrar o Tocantins inteiro na tela
  const zoomLevel = useMemo(() => {
    // Sempre usar zoom otimizado para o Tocantins
    return ZOOM_TOCANTINS;
  }, []);

  // Limites de todos os marcadores (origem e destino)
  const boundsAll = useMemo(() => {
    const pontos: L.LatLng[] = [];
    encomendasComCoordenadas.forEach((e) => {
      if (e.coordOrigem) pontos.push(L.latLng(e.coordOrigem.lat, e.coordOrigem.lng));
      if (e.coordDestino) pontos.push(L.latLng(e.coordDestino.lat, e.coordDestino.lng));
    });
    if (pontos.length === 0) return null;
    return L.latLngBounds(pontos);
  }, [encomendasComCoordenadas]);

  // Acionar automaticamente o enquadramento de marcadores ao abrir o modal
  useEffect(() => {
    if (isVisible && boundsAll && encomendasComCoordenadas.length > 0) {
      setFitBoundsTick((t) => t + 1);
    }
  }, [isVisible, boundsAll, encomendasComCoordenadas.length]);

  // Usar overrides quando definidos
  const centerUse = centerOverride ?? center;
  const zoomUse = zoomOverride ?? zoomLevel;

  // Função para aplicar filtros
  const aplicarFiltros = async (encomendasData?: EncomendaComCoordenadas[], filtrosCustom?: FiltrosRastreamento) => {
    try {
      console.log('🚀 FUNÇÃO APLICAR FILTROS INICIADA');
      
      const dadosEncomendas = encomendasData || encomendasComCoordenadas;
      const filtrosAtivos = filtrosCustom || filtros;
      
      console.log('=== APLICANDO FILTROS ===');
      console.log('Filtros ativos:', filtrosAtivos);
      console.log('Total de encomendas disponíveis:', dadosEncomendas.length);
      
      setLoading(true);
      
      let resultado = dadosEncomendas.filter(encomenda => {
        // Verificar quais filtros estão ativos (preenchidos)
        const filtrosPreenchidos = [];
        
        if (filtrosAtivos.numeroEncomenda) {
          filtrosPreenchidos.push('numero');
        }
        if (filtrosAtivos.remetente) {
          filtrosPreenchidos.push('remetente');
        }
        if (filtrosAtivos.destinatario) {
          filtrosPreenchidos.push('destinatario');
        }
        if (filtrosAtivos.setorOrigem && filtrosAtivos.setorOrigem !== 'todos') {
          filtrosPreenchidos.push('setorOrigem');
        }
        if (filtrosAtivos.setorDestino && filtrosAtivos.setorDestino !== 'todos') {
          filtrosPreenchidos.push('setorDestino');
        }
        if (filtrosAtivos.status && filtrosAtivos.status !== 'todos') {
          filtrosPreenchidos.push('status');
        }
        
        // Se nenhum filtro está preenchido, retornar todas as encomendas
        if (filtrosPreenchidos.length === 0) {
          return true;
        }
        
        // Se mais de um filtro está preenchido, mostrar mensagem e não filtrar
        if (filtrosPreenchidos.length > 1) {
          return false; // Será tratado com mensagem específica
        }
        
        // Aplicar apenas o filtro único ativo
        const filtroAtivo = filtrosPreenchidos[0];
        
        switch (filtroAtivo) {
          case 'numero':
            return encomenda.codigo?.toLowerCase().includes(filtrosAtivos.numeroEncomenda.toLowerCase()) ||
                   encomenda.codigoRastreamento?.toLowerCase().includes(filtrosAtivos.numeroEncomenda.toLowerCase());
          
          case 'remetente':
            const remetenteTexto = filtrosAtivos.remetente.toLowerCase();
            const nomeRemetente = encomenda.remetente?.toLowerCase() || '';
            const matriculaRemetente = (encomenda as any).remetenteMatricula || (encomenda as any).remetente_matricula || '';
            const vinculoRemetente = (encomenda as any).remetenteVinculo || (encomenda as any).remetente_vinculo || '';
            
            return nomeRemetente.includes(remetenteTexto) ||
                   matriculaRemetente.toString().includes(remetenteTexto) ||
                   vinculoRemetente.toLowerCase().includes(remetenteTexto);
          
          case 'destinatario':
            const destinatarioTexto = filtrosAtivos.destinatario.toLowerCase();
            const nomeDestinatario = encomenda.destinatario?.toLowerCase() || '';
            const matriculaDestinatario = (encomenda as any).destinatarioMatricula || (encomenda as any).destinatario_matricula || '';
            const vinculoDestinatario = (encomenda as any).destinatarioVinculo || (encomenda as any).destinatario_vinculo || '';
            
            return nomeDestinatario.includes(destinatarioTexto) ||
                   matriculaDestinatario.toString().includes(destinatarioTexto) ||
                   vinculoDestinatario.toLowerCase().includes(destinatarioTexto);
          
          case 'setorOrigem':
            return encomenda.setorOrigem?.toLowerCase().includes(filtrosAtivos.setorOrigem.toLowerCase());
          
          case 'setorDestino':
            return encomenda.setorDestino?.toLowerCase().includes(filtrosAtivos.setorDestino.toLowerCase());
          
          case 'status':
            return encomenda.status === filtrosAtivos.status;
          
          default:
            return true;
        }
      });

      console.log('=== RESULTADO DO FILTRO ===');
      console.log('Encomendas encontradas após filtro:', resultado.length);

      // Verificar se há múltiplos filtros ativos antes de processar
      const filtrosPreenchidos = [];
      
      if (filtrosAtivos.numeroEncomenda) {
        filtrosPreenchidos.push('Número da Encomenda');
      }
      if (filtrosAtivos.remetente) {
        filtrosPreenchidos.push('Remetente');
      }
      if (filtrosAtivos.destinatario) {
        filtrosPreenchidos.push('Destinatário');
      }
      if (filtrosAtivos.setorOrigem && filtrosAtivos.setorOrigem !== 'todos') {
        filtrosPreenchidos.push('Setor Origem');
      }
      if (filtrosAtivos.setorDestino && filtrosAtivos.setorDestino !== 'todos') {
        filtrosPreenchidos.push('Setor Destino');
      }
      if (filtrosAtivos.status && filtrosAtivos.status !== 'todos') {
        filtrosPreenchidos.push('Status');
      }
      
      // Se mais de um filtro está preenchido, mostrar mensagem de erro
      if (filtrosPreenchidos.length > 1) {
        showError(
          "Filtros múltiplos não permitidos",
          `Por favor, use apenas um filtro por vez. Filtros ativos: ${filtrosPreenchidos.join(', ')}.`
        );
        setEncomendasFiltradas([]);
        return;
      }

      setEncomendasFiltradas(resultado);

      // Se não encontrou resultados, mostrar mensagem
      if (resultado.length === 0 && filtrosPreenchidos.length > 0) {
        const filtroAtivo = filtrosPreenchidos.length > 0 ? filtrosPreenchidos[0] : 'filtros aplicados';
        showInfo(
          "Nenhuma encomenda encontrada",
          `Nenhum resultado foi encontrado para o filtro "${filtroAtivo}". Tente ajustar os critérios de pesquisa.`
        );
      }
    } catch (error) {
      console.error('💥 ERRO GLOBAL NA FUNÇÃO APLICAR FILTROS:', error);
      showError(
        "Erro ao filtrar encomendas",
        "Ocorreu um erro ao processar os filtros."
      );
    } finally {
      setLoading(false);
    }
  };

  const limparFiltros = () => {
    try {
      console.log('🧹 FUNÇÃO LIMPAR FILTROS INICIADA');
      
      // Limpar todos os filtros
      setFiltros({
        numeroEncomenda: '',
        remetente: '',
        destinatario: '',
        setorOrigem: '',
        setorDestino: '',
        status: '',
        dataInicio: '',
        dataFim: ''
      });
      // Limpar resultados filtrados para mostrar todas as encomendas
      setEncomendasFiltradas([]);
      // Mostrar mensagem de confirmação
      showInfo("Filtros Limpos", "Todos os filtros foram removidos.");
      
      console.log('✅ FILTROS LIMPOS COM SUCESSO');
    } catch (error) {
      console.error('💥 ERRO NA FUNÇÃO LIMPAR FILTROS:', error);
    }
  };

  const getStatusLabel = (status: string) => {
    const s = String(status || '').toLowerCase();
    return s === 'entregue' ? 'Entregue' : 'Em Trânsito';
  };

  // Função para selecionar usuário como remetente
  const selectRemetente = (usuario: any) => {
    const nome = usuario.NOME || usuario.nome || '';
    const matricula = usuario.NUMERO_FUNCIONAL || usuario.numero_funcional || usuario.numeroFuncional || usuario.matricula || usuario.MATRICULA || '';
    const vinculo = usuario.VINCULO_FUNCIONAL || usuario.vinculo_funcional || '';
    
    let nomeCompleto = nome;
    if (matricula && vinculo) {
      nomeCompleto += ` (${matricula}-${vinculo})`;
    } else if (matricula) {
      nomeCompleto += ` (${matricula})`;
    }
    
    setFiltros(prev => ({ ...prev, remetente: nomeCompleto }));
    setSugestoesRemetente([]);
    setShowSugestoesRemetente(false);
  };

  // Função para selecionar usuário como destinatário
  const selectDestinatario = (usuario: any) => {
    const nome = usuario.NOME || usuario.nome || '';
    const matricula = usuario.NUMERO_FUNCIONAL || usuario.numero_funcional || usuario.numeroFuncional || usuario.matricula || usuario.MATRICULA || '';
    const vinculo = usuario.VINCULO_FUNCIONAL || usuario.vinculo_funcional || '';
    
    let nomeCompleto = nome;
    if (matricula && vinculo) {
      nomeCompleto += ` (${matricula}-${vinculo})`;
    } else if (matricula) {
      nomeCompleto += ` (${matricula})`;
    }
    
    setFiltros(prev => ({ ...prev, destinatario: nomeCompleto }));
    setSugestoesDestinatario([]);
    setShowSugestoesDestinatario(false);
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[80vh]">
        {/* Painel de Filtros */}
        <div className="lg:col-span-1 space-y-4 overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle>Filtros de Pesquisa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Número da Encomenda</label>
                <Input
                  placeholder="Digite o código ou rastreamento"
                  value={filtros.numeroEncomenda}
                  onChange={(e) => setFiltros(prev => ({ ...prev, numeroEncomenda: e.target.value }))}
                />
              </div>
              <div className="space-y-2 relative">
                <label className="text-sm font-medium">Remetente</label>
                <Input
                  className="input-remetente"
                  placeholder="Nome, matrícula ou vínculo"
                  value={filtros.remetente}
                  onChange={(e) => setFiltros(prev => ({ ...prev, remetente: e.target.value }))}
                />
                {showSugestoesRemetente && (
                  <div className="sugestoes-remetente absolute z-10 mt-1 w-full bg-white border rounded shadow">
                    {sugestoesRemetente.map((usuario, idx) => (
                      <button key={idx} className="w-full text-left px-3 py-2 hover:bg-blue-50" onClick={() => selectRemetente(usuario)}>
                        {(usuario.NOME || usuario.nome)}{(usuario.NUMERO_FUNCIONAL || usuario.numero_funcional || usuario.matricula) ? ` (${usuario.NUMERO_FUNCIONAL || usuario.numero_funcional || usuario.matricula})` : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2 relative">
                <label className="text-sm font-medium">Destinatário</label>
                <Input
                  className="input-destinatario"
                  placeholder="Nome, matrícula ou vínculo"
                  value={filtros.destinatario}
                  onChange={(e) => setFiltros(prev => ({ ...prev, destinatario: e.target.value }))}
                />
                {showSugestoesDestinatario && (
                  <div className="sugestoes-destinatario absolute z-10 mt-1 w-full bg-white border rounded shadow">
                    {sugestoesDestinatario.map((usuario, idx) => (
                      <button key={idx} className="w-full text-left px-3 py-2 hover:bg-blue-50" onClick={() => selectDestinatario(usuario)}>
                        {(usuario.NOME || usuario.nome)}{(usuario.NUMERO_FUNCIONAL || usuario.numero_funcional || usuario.matricula) ? ` (${usuario.NUMERO_FUNCIONAL || usuario.numero_funcional || usuario.matricula})` : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Setor Origem</label>
                  <Select value={filtros.setorOrigem} onValueChange={(value) => setFiltros(prev => ({ ...prev, setorOrigem: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o setor" />
                    </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {setoresSelect.map((nome) => (
                      <SelectItem key={nome} value={nome}>{nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Setor Destino</label>
                <Select value={filtros.setorDestino} onValueChange={(value) => setFiltros(prev => ({ ...prev, setorDestino: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {setoresSelect.map((nome) => (
                      <SelectItem key={nome} value={nome}>{nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={filtros.status} onValueChange={(value) => setFiltros(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entregue">Entregue</SelectItem>
                    <SelectItem value="transito">Postado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={() => {
                  console.log('🔍 BOTÃO BUSCAR CLICADO!');
                  aplicarFiltros();
                }} className="gap-2">
                  <Search className="w-4 h-4" />
                  Buscar
                </Button>
                <Button variant="outline" onClick={() => {
                  console.log('🧹 BOTÃO LIMPAR CLICADO!');
                  limparFiltros();
                }} className="gap-2">
                  <X className="w-4 h-4" />
                  Limpar Filtros
                </Button>
              </div>
              <div className="pt-2 text-xs text-muted-foreground">
                Resultados: <Badge variant="secondary">{encomendasFiltradas.length}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Mapa */}
        <div className="lg:col-span-3 flex flex-col">
          {/* Toolbar de ações rápidas do mapa */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => { setCenterOverride([COORDENADAS_TOCANTINS.lat, COORDENADAS_TOCANTINS.lng]); setZoomOverride(ZOOM_TOCANTINS); }}>
              <MapPin className="w-4 h-4" /> Centralizar TO
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setFitBoundsTick((t) => t + 1)} disabled={!boundsAll}>
              <Package className="w-4 h-4" /> Enquadrar marcadores
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowRoutes((v) => !v)}>
              <Truck className="w-4 h-4" /> {showRoutes ? 'Ocultar rotas' : 'Mostrar rotas'}
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowLegend((v) => !v)}>
              <Info className="w-4 h-4" /> {showLegend ? 'Ocultar legenda' : 'Mostrar legenda'}
            </Button>
          </div>
          <div className="flex-1 rounded-lg overflow-hidden border border-blue-300 relative">
            {(loading || isLoadingGeocode || isLoadingSetores || isLoadingRoutes) && (
              <div className="absolute inset-0 z-[900] flex items-center justify-center bg-white/70">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando dados ...
                </div>
              </div>
            )}
            <MapContainer
              key={`mapa-${centerUse[0]}-${centerUse[1]}-${zoomUse}`}
              center={centerUse}
              zoom={zoomUse}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <MapUpdater center={centerUse} zoom={zoomUse} />
              <FitBoundsOnTrigger trigger={fitBoundsTick} bounds={boundsAll} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {/* Overlays de estado e legenda */}
              {showLegend && (
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-md shadow p-2 text-xs space-y-1 z-[1000]">
                  <div className="font-medium text-gray-700">Legenda</div>
                  <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded bg-green-600"></span><span>Origem</span></div>
                  <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded bg-red-600"></span><span>Destino</span></div>
                  <div className="flex items-center gap-2"><span className="inline-block w-6 h-0.5 bg-blue-600"></span><span>Rotas</span></div>
                </div>
              )}
              {isLoadingRoutes && (
                <div className="absolute top-2 left-2 bg-white/90 rounded-md shadow px-2 py-1 text-xs flex items-center gap-2 z-[1000]">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Calculando rotas...
                </div>
              )}
              {(encomendasFiltradas.length > 0 ? encomendasFiltradas : encomendasComCoordenadas).length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center z-[900] pointer-events-none">
                  <div className="bg-white/90 rounded-md shadow p-4 text-sm text-gray-700">
                    {encomendasFiltradas.length === 0 && encomendasComCoordenadas.length > 0 
                      ? 'Nenhuma encomenda encontrada com os filtros aplicados.' 
                      : 'Nenhuma encomenda encontrada.'}
                  </div>
                </div>
              )}
              {/* Renderizar marcadores agrupados de origem */}
              {Object.entries(agruparPorLocalizacao((encomendasFiltradas.length > 0 ? encomendasFiltradas : encomendasComCoordenadas).filter(e => e.coordOrigem), 'origem')).map(([chave, encomendas]) => {
                  const primeiraEncomenda = encomendas[0];
                  const coordenada = primeiraEncomenda.coordOrigem!;
                  const icone = criarIconeComContador(origemIcon, encomendas.length);
                  
                  return (
                    <Marker key={`origem-${chave}`} position={[coordenada.lat, coordenada.lng]} icon={icone}>
                      <Popup>
                        {(() => {
                          const currentIndex = getPopupIndex(`origem-${chave}`);
                          const encomenda = encomendas[currentIndex];
                          
                          return (
                            <div className="p-2 w-80">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-green-800">🚀 Origem</h4>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => setPopupIndex(`origem-${chave}`, Math.max(0, currentIndex - 1))}
                                    disabled={currentIndex === 0}
                                    className="p-2 text-xs bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full shadow-md transition-colors"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                                    </svg>
                                  </button>
                                  <span className="text-xs text-gray-600">{currentIndex + 1} de {encomendas.length}</span>
                                  <button 
                                    onClick={() => setPopupIndex(`origem-${chave}`, Math.min(encomendas.length - 1, currentIndex + 1))}
                                    disabled={currentIndex === encomendas.length - 1}
                                    className="p-2 text-xs bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full shadow-md transition-colors"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <div>
                                {(() => {
                                  const urgente = ((encomenda as any).urgente ?? false) || (encomenda.prioridade ? String(encomenda.prioridade).toLowerCase().includes('urg') : false);
                                  const entregue = encomenda.status ? String(encomenda.status).toLowerCase().includes('entreg') : false;
                                  const remetenteMatricula = (encomenda as any).remetente_matricula || (encomenda as any).remetenteMatricula;
                                  const remetenteVinculo = (encomenda as any).remetente_vinculo || (encomenda as any).remetenteVinculo;
                                  const rota = routesByEncomenda[encomenda.id];
                                  
                                  // Função para formatar endereço usando dados da encomenda
                                  const formatEnderecoFromEncomenda = (enderecoData: any) => {
                                    if (!enderecoData) return 'Endereço não disponível';
                                    
                                    const partes = [];
                                    if (enderecoData.logradouro) partes.push(enderecoData.logradouro);
                                    if (enderecoData.numero) partes.push(enderecoData.numero);
                                    if (enderecoData.complemento) partes.push(enderecoData.complemento);
                                    if (enderecoData.bairro) partes.push(enderecoData.bairro);
                                    if (enderecoData.cidade) partes.push(enderecoData.cidade);
                                    if (enderecoData.estado) partes.push(enderecoData.estado);
                                    if (enderecoData.cep) partes.push(`CEP: ${enderecoData.cep}`);
                                    
                                    return partes.length > 0 ? partes.join(', ') : 'Endereço não disponível';
                                  };
                                  
                                  const enderecoOrigemFull = formatEnderecoFromEncomenda((encomenda as any).setorOrigemEndereco);
                                  
                                  return (
                                    <div className="space-y-1">
                                      <p className="text-sm font-medium mb-2">📦 <strong>#{encomenda.codigoRastreamento}</strong></p>
                                      
                                      <div className="space-y-0 text-xs mb-1">
                                        <p><span className="font-medium">👤 Remetente:</span> {encomenda.remetente}{remetenteMatricula ? ` (${remetenteMatricula})` : ''}</p>
                                        <p><span className="font-medium">🏢 Setor:</span> {encomenda.setorOrigem}</p>
                                        
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-0 leading-tight">
                                          <p className="m-0 leading-tight"><span className="font-medium">📋 Tipo:</span> {(encomenda as any).tipo || 'N/I'}</p>
                                          <p className="m-0 leading-tight"><span className="font-medium">⚡ Prioridade:</span> {(encomenda as any).prioridade || 'Normal'} {urgente ? '🔥' : ''}</p>
                                        </div>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-x-4 gap-y-0 text-xs leading-tight">
                                        <p className="m-0 leading-tight"><span className="font-medium">📅 Envio:</span> {(encomenda as any).dataEnvio ? new Date((encomenda as any).dataEnvio).toLocaleDateString('pt-BR') : 'N/I'}</p>
                                        <p className="m-0 leading-tight"><span className="font-medium">📅 Entrega:</span> {(encomenda as any).dataEntrega ? new Date((encomenda as any).dataEntrega).toLocaleDateString('pt-BR') : 'N/I'}</p>
                                        
                                        <p className="m-0 leading-tight"><span className="font-medium">📊 Status:</span> {encomenda.status}</p>
                                        <p className="m-0 leading-tight"><span className="font-medium">✅ Entregue:</span> {entregue ? 'Sim ✅' : 'Não ❌'}</p>
                                      </div>
                                      
                                      <div className="mt-2 pt-2 border-t border-gray-200">
                                        <p className="text-xs mb-1"><span className="font-medium">📍 Endereço:</span> {enderecoOrigemFull}</p>
                                        {encomenda.coordDestino && (
                                          <div className="flex justify-between text-xs">
                                            <span><span className="font-medium">📏 Distância:</span> {rota ? formatDistanceKm(rota.distance) : formatDistanceKm(haversineDistanceMeters(encomenda.coordOrigem!, encomenda.coordDestino))}</span>
                                            <span><span className="font-medium">⏱️ Tempo:</span> {rota ? formatDuration(rota.duration) : 'N/D'}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })()}
                      </Popup>
                    </Marker>
                  );
                })}
              
              {/* Renderizar marcadores agrupados de destino */}
              {Object.entries(agruparPorLocalizacao((encomendasFiltradas.length > 0 ? encomendasFiltradas : encomendasComCoordenadas).filter(e => e.coordDestino), 'destino')).map(([chave, encomendas]) => {
                  const primeiraEncomenda = encomendas[0];
                  const coordenada = primeiraEncomenda.coordDestino!;
                  const icone = criarIconeComContador(destinoIcon, encomendas.length);
                  
                  return (
                    <Marker key={`destino-${chave}`} position={[coordenada.lat, coordenada.lng]} icon={icone}>
                      <Popup>
                        {(() => {
                          const currentIndex = getPopupIndex(`destino-${chave}`);
                          const encomenda = encomendas[currentIndex];
                          
                          return (
                            <div className="p-2 w-80">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-red-800">🎯 Destino</h4>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => setPopupIndex(`destino-${chave}`, Math.max(0, currentIndex - 1))}
                                    disabled={currentIndex === 0}
                                    className="p-2 text-xs bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full shadow-md transition-colors"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                                    </svg>
                                  </button>
                                  <span className="text-xs text-gray-600">{currentIndex + 1} de {encomendas.length}</span>
                                  <button 
                                    onClick={() => setPopupIndex(`destino-${chave}`, Math.min(encomendas.length - 1, currentIndex + 1))}
                                    disabled={currentIndex === encomendas.length - 1}
                                    className="p-2 text-xs bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full shadow-md transition-colors"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <div>
                                {(() => {
                                  const urgente = ((encomenda as any).urgente ?? false) || (encomenda.prioridade ? String(encomenda.prioridade).toLowerCase().includes('urg') : false);
                                  const entregue = encomenda.status ? String(encomenda.status).toLowerCase().includes('entreg') : false;
                                  const destinatarioMatricula = (encomenda as any).destinatario_matricula || (encomenda as any).destinatarioMatricula;
                                  const destinatarioVinculo = (encomenda as any).destinatario_vinculo || (encomenda as any).destinatarioVinculo;
                                  const rota = routesByEncomenda[encomenda.id];
                                  
                                  // Função para formatar endereço usando dados da encomenda
                                  const formatEnderecoFromEncomenda = (enderecoData: any) => {
                                    if (!enderecoData) return 'Endereço não disponível';
                                    
                                    const partes = [];
                                    if (enderecoData.logradouro) partes.push(enderecoData.logradouro);
                                    if (enderecoData.numero) partes.push(enderecoData.numero);
                                    if (enderecoData.complemento) partes.push(enderecoData.complemento);
                                    if (enderecoData.bairro) partes.push(enderecoData.bairro);
                                    if (enderecoData.cidade) partes.push(enderecoData.cidade);
                                    if (enderecoData.estado) partes.push(enderecoData.estado);
                                    if (enderecoData.cep) partes.push(`CEP: ${enderecoData.cep}`);
                                    
                                    return partes.length > 0 ? partes.join(', ') : 'Endereço não disponível';
                                  };
                                  
                                  const enderecoDestinoFull = formatEnderecoFromEncomenda((encomenda as any).setorDestinoEndereco);
                                  
                                  return (
                                    <div className="space-y-1">
                                      <p className="text-sm font-medium mb-2">🎯 <strong>#{encomenda.codigoRastreamento}</strong></p>
                                      
                                      <div className="space-y-0 text-xs mb-1">
                                        <p><span className="font-medium">👤 Destinatário:</span> {encomenda.destinatario}{destinatarioMatricula ? ` (${destinatarioMatricula})` : ''}</p>
                                        <p><span className="font-medium">🏢 Setor:</span> {encomenda.setorDestino}</p>
                                        
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-0 leading-tight">
                                          <p className="m-0 leading-tight"><span className="font-medium">📋 Tipo:</span> {(encomenda as any).tipo || 'N/I'}</p>
                                          <p className="m-0 leading-tight"><span className="font-medium">⚡ Prioridade:</span> {(encomenda as any).prioridade || 'Normal'} {urgente ? '🔥' : ''}</p>
                                        </div>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-x-4 gap-y-0 text-xs leading-tight">
                                        <p className="m-0 leading-tight"><span className="font-medium">📅 Envio:</span> {(encomenda as any).dataEnvio ? new Date((encomenda as any).dataEnvio).toLocaleDateString('pt-BR') : 'N/I'}</p>
                                        <p className="m-0 leading-tight"><span className="font-medium">📅 Entrega:</span> {(encomenda as any).dataEntrega ? new Date((encomenda as any).dataEntrega).toLocaleDateString('pt-BR') : 'N/I'}</p>
                                        
                                        <p className="m-0 leading-tight"><span className="font-medium">📊 Status:</span> {encomenda.status}</p>
                                        <p className="m-0 leading-tight"><span className="font-medium">✅ Entregue:</span> {entregue ? 'Sim ✅' : 'Não ❌'}</p>
                                      </div>
                                      
                                      <div className="mt-2 pt-2 border-t border-gray-200">
                                        <p className="text-xs mb-1"><span className="font-medium">📍 Endereço:</span> {enderecoDestinoFull}</p>
                                        {encomenda.coordOrigem && (
                                          <div className="flex justify-between text-xs">
                                            <span><span className="font-medium">📏 Distância:</span> {rota ? formatDistanceKm(rota.distance) : formatDistanceKm(haversineDistanceMeters(encomenda.coordOrigem, encomenda.coordDestino))}</span>
                                            <span><span className="font-medium">⏱️ Tempo:</span> {rota ? formatDuration(rota.duration) : 'N/D'}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })()}
                      </Popup>
                    </Marker>
                  );
                })}
              
              {/* Renderizar rotas */}
              {showRoutes && (encomendasFiltradas.length > 0 ? encomendasFiltradas : encomendasComCoordenadas).map((encomenda) => {
                const rota = routesByEncomenda[encomenda.id];

                return (
                  <React.Fragment key={encomenda.id}>
                    {/* Rota calculada (se disponível) ou linha direta (fallback) */}
                    {encomenda.coordOrigem && encomenda.coordDestino && (
                      rota ? (
                        <Polyline
                          positions={rota.coordinates.map(([lng, lat]) => [lat, lng])}
                          color="#1e40af"
                          weight={4}
                          opacity={0.85}
                          dashArray={undefined}
                        >
                          <Popup>
                            <div className="p-2">
                              <h4 className="font-semibold text-blue-800">🛣️ Rota calculada</h4>
                              <p className="text-sm"><strong>Distância:</strong> {formatDistanceKm(rota.distance)}</p>
                              <p className="text-sm"><strong>Tempo:</strong> {formatDuration(rota.duration)}</p>
                            </div>
                          </Popup>
                        </Polyline>
                      ) : (
                        <Polyline
                          positions={[[encomenda.coordOrigem.lat, encomenda.coordOrigem.lng],[encomenda.coordDestino.lat, encomenda.coordDestino.lng]]}
                          color="#3b82f6"
                          weight={5}
                          opacity={0.8}
                        >
                          <Popup>
                            <div className="p-2">
                              <h4 className="font-semibold text-blue-800">🔗 Ligação direta (fallback)</h4>
                              <p className="text-sm"><strong>Distância:</strong> {formatDistanceKm(haversineDistanceMeters(encomenda.coordOrigem, encomenda.coordDestino))}</p>
                              <p className="text-sm"><strong>Tempo:</strong> N/D</p>
                            </div>
                          </Popup>
                        </Polyline>
                      )
                    )}
                  </React.Fragment>
                );
              })}
            </MapContainer>
          </div>
          <div className="mt-2 text-xs text-blue-700 text-center">
            💡 Marcadores verdes = Origem | Marcadores vermelhos = Destino | Linhas azuis = Rotas calculadas ou ligação direta
          </div>
        </div>

      {/* Modal de Notificação */}
      {notification && (
        <NotificationModal
          isOpen={isOpen}
          onClose={hideNotification}
          title={notification.title}
          description={notification.description}
          variant={notification.variant}
        />
      )}
    </div>
    </>
  );
});

export default MapaGeralEncomendas;

// Helpers: endereço completo, distância e duração
const formatEnderecoSetor = (setorData: any): string => {
  if (!setorData) return 'Endereço não disponível';
  const logradouro = setorData?.logradouro || setorData?.LOGRADOURO;
  const numero = setorData?.numero || setorData?.NUMERO;
  const complemento = setorData?.complemento || setorData?.COMPLEMENTO;
  const bairro = setorData?.bairro || setorData?.BAIRRO;
  const cidade = setorData?.cidade || setorData?.CIDADE || setorData?.municipio_lotacao || setorData?.MUNICIPIO_LOTACAO;
  const estado = setorData?.estado || setorData?.ESTADO || setorData?.uf || setorData?.UF || 'TO';
  const cep = setorData?.cep || setorData?.CEP;

  if (logradouro) {
    const base = `${logradouro}${numero ? `, ${numero}` : ''}${complemento ? `, ${complemento}` : ''}`;
    const bairroStr = bairro ? ` - ${bairro}` : '';
    const cidadeEstado = `${cidade || 'N/A'}/${estado}`;
    const cepStr = cep ? `, CEP: ${cep}` : '';
    return `${base}${bairroStr} - ${cidadeEstado}${cepStr}`;
  }
  return 'Endereço não disponível';
};

const formatDistanceKm = (meters: number): string => {
  if (meters == null || Number.isNaN(meters)) return 'N/D';
  return `${(meters / 1000).toFixed(1)} km`;
};

const formatDuration = (seconds: number): string => {
  if (seconds == null || Number.isNaN(seconds)) return 'N/D';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}min`;
};

const haversineDistanceMeters = (a: Coordenadas, b: Coordenadas): number => {
  const R = 6371000; // raio da Terra em metros
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
};



