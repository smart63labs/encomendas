import React, { useState, useEffect, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COORDENADAS_TOCANTINS, ZOOM_TOCANTINS, COORDENADAS_PALMAS } from '@/constants/mapConstants';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
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
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { useNotification } from '@/hooks/use-notification';
import NotificationModal from '@/components/ui/notification-modal';
import { GeocodingService, Coordenadas } from '@/services/geocoding.service';
import { formatMatriculaVinculo, getProfileBadgeClass } from '@/lib/utils';
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

// Fix para os ícones do Leaflet no Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

import { createCustomIcon } from '@/utils/map-icons';

const statusIcons = {
  pendente: createCustomIcon('grey'),
  preparando: createCustomIcon('blue'),
  transito: createCustomIcon('orange'),
  entregue: createCustomIcon('green'),
  devolvido: createCustomIcon('red'),
  default: createCustomIcon('grey')
};

// Coordenadas e zoom unificados
// Usando valores compartilhados de mapConstants

// Interfaces
interface Setor {
  ID: number;
  NOME_SETOR: string;
  CODIGO_SETOR?: string;
  ORGAO?: string;
  COLUNA1?: string; // Campo genérico conforme nova estrutura
  LOGRADOURO?: string;
  NUMERO?: string;
  COMPLEMENTO?: string;
  BAIRRO?: string;
  CIDADE?: string;
  ESTADO?: string;
  CEP?: string;
  LATITUDE?: number;
  LONGITUDE?: number;
  TELEFONE?: string;
  EMAIL?: string;
  ATIVO?: boolean;
}

interface SetorComCoordenadas extends Setor {
  coordenadas: {
    lat: number;
    lng: number;
  };
}

interface MapaGeralSetoresProps {
  setores: Setor[];
  isVisible: boolean;
  refreshTrigger?: number;
}

// Coordenadas padrão (compartilhadas)
// Já importadas de mapConstants

// Ícones personalizados
const criarIconeSetor = (cor: string = '#3b82f6') => {
  return L.divIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, ${cor} 0%, ${cor}dd 100%);
        width: 24px;
        height: 24px;
        border-radius: 6px;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

const criarIconeComContador = (contador: number, cor: string = '#3b82f6') => {
  return L.divIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, ${cor} 0%, ${cor}dd 100%);
        width: 30px;
        height: 30px;
        border-radius: 8px;
        border: 2px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        position: relative;
      ">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="white" style="margin-bottom: 1px;">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
        <div style="
          font-size: 9px;
          font-weight: 900;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
          line-height: 1;
        ">${contador}</div>
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};


// Cache para coordenadas
class CoordenadasCache {
  private static readonly CACHE_KEY = 'setores_coordenadas_cache';
  private static readonly CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 dias

  static get(key: string): { lat: number; lng: number } | null {
    try {
      const cache = localStorage.getItem(this.CACHE_KEY);
      if (!cache) return null;

      const data = JSON.parse(cache);
      const item = data[key];

      if (!item || Date.now() > item.expiry) {
        return null;
      }

      return item.coordenadas;
    } catch {
      return null;
    }
  }

  static set(key: string, coordenadas: { lat: number; lng: number }): void {
    try {
      const cache = localStorage.getItem(this.CACHE_KEY);
      const data = cache ? JSON.parse(cache) : {};

      data[key] = {
        coordenadas,
        expiry: Date.now() + this.CACHE_EXPIRY
      };

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar no cache:', error);
    }
  }
}

// Função para agrupar setores por localização
const agruparPorLocalizacao = (setores: SetorComCoordenadas[]): Array<{
  coordenadas: { lat: number; lng: number };
  setores: SetorComCoordenadas[];
  key: string;
}> => {
  const grupos: Record<string, SetorComCoordenadas[]> = {};

  setores.forEach((setor) => {
    const lat = Math.round(setor.coordenadas.lat * 1000) / 1000;
    const lng = Math.round(setor.coordenadas.lng * 1000) / 1000;
    const key = `${lat},${lng}`;

    if (!grupos[key]) {
      grupos[key] = [];
    }
    grupos[key].push(setor);
  });

  return Object.entries(grupos).map(([key, setores]) => {
    const [lat, lng] = key.split(',').map(Number);
    return {
      coordenadas: { lat, lng },
      setores,
      key
    };
  });
};

// Função para geocodificar um setor
const geocodificarSetor = async (setor: Setor): Promise<SetorComCoordenadas> => {
  const setorKey = setor.CODIGO_SETOR || setor.NOME_SETOR;

  // 1) Priorizar coordenadas do banco sempre
  if (setor.LATITUDE != null && setor.LONGITUDE != null) {
    const coordenadas = {
      lat: parseFloat(String(setor.LATITUDE).replace(',', '.')),
      lng: parseFloat(String(setor.LONGITUDE).replace(',', '.'))
    };
    if (!Number.isNaN(coordenadas.lat) && !Number.isNaN(coordenadas.lng)) {
      // Atualiza/vence cache com o valor oficial do banco
      if (setorKey) CoordenadasCache.set(setorKey, coordenadas);
      return {
        ...setor,
        coordenadas
      };
    }
  }

  // 2) Caso não haja coordenadas no banco, tentar cache
  if (setorKey) {
    const coordenadasCacheadas = CoordenadasCache.get(setorKey);
    if (coordenadasCacheadas) {
      return {
        ...setor,
        coordenadas: coordenadasCacheadas
      };
    }
  }

  // Tentar geocodificar por CEP
  if (setor.CEP) {
    try {
      const resultado = await GeocodingService.geocodeByCep(setor.CEP);
      if (resultado.coordenadas) {
        if (setorKey) CoordenadasCache.set(setorKey, resultado.coordenadas);
        return {
          ...setor,
          coordenadas: resultado.coordenadas
        };
      }
    } catch (error) {
      console.error(`Erro ao geocodificar CEP ${setor.CEP}:`, error);
    }
  }

  // Tentar geocodificar por cidade/estado
  if (setor.CIDADE && setor.ESTADO) {
    try {
      const resultado = await GeocodingService.geocodeByCityState(setor.CIDADE, setor.ESTADO);
      if (resultado.coordenadas) {
        if (setorKey) CoordenadasCache.set(setorKey, resultado.coordenadas);
        return {
          ...setor,
          coordenadas: resultado.coordenadas
        };
      }
    } catch (error) {
      console.error(`Erro ao geocodificar cidade ${setor.CIDADE}:`, error);
    }
  }

  // Não usar coordenadas artificiais - retornar undefined se não conseguir geocodificar
  console.warn(`Não foi possível geocodificar o setor ${setor.NOME_SETOR} (${setor.CODIGO_SETOR})`);
  return {
    ...setor,
    coordenadas: undefined
  };
};

// Componente para atualizar o centro e zoom do mapa
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
};

const MapaGeralSetores: React.FC<MapaGeralSetoresProps> = React.memo(({ setores, isVisible, refreshTrigger }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [setoresComCoordenadas, setSetoresComCoordenadas] = useState<SetorComCoordenadas[]>([]);
  const [isLoadingGeocode, setIsLoadingGeocode] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [popupIndices, setPopupIndices] = useState<Record<string, number>>({});
  const [usuariosPorSetor, setUsuariosPorSetor] = useState<Record<string, any[]>>({});
  const [loadingUsuarios, setLoadingUsuarios] = useState<Record<string, boolean>>({});
  const [loadingTotal, setLoadingTotal] = useState(0);
  const [loadingCount, setLoadingCount] = useState(0);
  const [filtros, setFiltros] = useState<{ setor: string; orgao: string; cidade: string }>({
    setor: '',
    orgao: '',
    cidade: ''
  });
  const [appliedFilters, setAppliedFilters] = useState<{ setor: string; orgao: string; cidade: string }>({
    setor: '',
    orgao: '',
    cidade: ''
  });
  const [setorOpen, setSetorOpen] = useState(false);
  const [showAllPoints, setShowAllPoints] = useState(false);
  const DEFAULT_MAX_POINTS = 500;

  const fetchUsuariosDoSetor = async (setorNome: string) => {
    try {
      if (usuariosPorSetor[setorNome]) return;
      setLoadingUsuarios(prev => ({ ...prev, [setorNome]: true }));
      const resp = await api.getUsersBySetor(setorNome);
      const data = (resp?.data?.data ?? resp?.data ?? []) as any[];
      setUsuariosPorSetor(prev => ({ ...prev, [setorNome]: data }));
    } catch (e) {
      // opcional: tratar erro com toast
    } finally {
      setLoadingUsuarios(prev => ({ ...prev, [setorNome]: false }));
    }
  };

  // Auto-expandir quando o mapa se torna visível
  useEffect(() => {
    if (isVisible && !isExpanded) {
      setIsExpanded(true);
    }
  }, [isVisible, isExpanded]);

  // Funções para gerenciar os índices dos popups
  const getPopupIndex = useCallback((key: string) => {
    return popupIndices[key] || 0;
  }, [popupIndices]);

  const setPopupIndex = useCallback((key: string, index: number) => {
    setPopupIndices(prev => ({ ...prev, [key]: index }));
  }, []);



  const cidadesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    (setores || []).forEach(s => {
      const cidade = (s.CIDADE || '').trim();
      if (cidade) set.add(cidade);
    });
    return Array.from(set).sort();
  }, [setores]);

  // Aplicar filtros aos setores antes da geocodificação
  const setoresFiltrados = useMemo(() => {
    const termoSetor = appliedFilters.setor.trim().toLowerCase();
    const termoCidade = appliedFilters.cidade.trim().toLowerCase();

    return (setores || []).filter(s => {
      const nomeMatch = termoSetor
        ? ((s.NOME_SETOR || '').toLowerCase().includes(termoSetor) || (s.CODIGO_SETOR || '').toLowerCase().includes(termoSetor))
        : true;
      const cidadeMatch = termoCidade ? (s.CIDADE || '').toLowerCase().includes(termoCidade) : true;
      return nomeMatch && cidadeMatch;
    });
  }, [setores, appliedFilters]);

  // Geocodificar setores quando necessário
  useEffect(() => {
    const geocodificarSetores = async () => {
      const setoresParaProcessarBase = setoresFiltrados;
      const setoresParaProcessar = showAllPoints ? setoresParaProcessarBase : [];
      if (!setoresParaProcessar || setoresParaProcessar.length === 0) {
        setSetoresComCoordenadas([]);
        return;
      }

      setIsLoadingGeocode(true);
      setGeocodingError(null);

      try {
        const gruposMap = new Map<string, Setor[]>();
        for (const s of setoresParaProcessar) {
          const chave = String(s.CEP || s.CODIGO_SETOR || s.NOME_SETOR || `${s.CIDADE || ''}|${s.ESTADO || ''}`);
          const arr = gruposMap.get(chave) || [];
          arr.push(s as any);
          gruposMap.set(chave, arr);
        }

        const representantes = Array.from(gruposMap.values()).map(list => list[0]);
        const coordenadasPorChave: Record<string, { lat: number; lng: number } | undefined> = {};
        setLoadingTotal(representantes.length);
        setLoadingCount(0);

        const batchSize = 5;
        for (let i = 0; i < representantes.length; i += batchSize) {
          const lote = representantes.slice(i, i + batchSize);
          const promessasLote = lote.map(setor => geocodificarSetor(setor));
          const resultadosLote = await Promise.all(promessasLote);
          resultadosLote.forEach((res) => {
            const chave = String(res.CEP || res.CODIGO_SETOR || res.NOME_SETOR || `${res.CIDADE || ''}|${res.ESTADO || ''}`);
            coordenadasPorChave[chave] = res.coordenadas;
          });
          setLoadingCount((c) => c + resultadosLote.length);

          if (i + batchSize < representantes.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        const resultados: SetorComCoordenadas[] = setoresParaProcessar
          .map((s) => {
            const chave = String(s.CEP || s.CODIGO_SETOR || s.NOME_SETOR || `${s.CIDADE || ''}|${s.ESTADO || ''}`);
            const coord = coordenadasPorChave[chave];
            return { ...(s as any), coordenadas: coord } as SetorComCoordenadas;
          })
          .filter((s) => !!(s.coordenadas && s.coordenadas.lat && s.coordenadas.lng));

        setSetoresComCoordenadas(resultados);
      } catch (error) {
        console.error('Erro ao geocodificar setores:', error);
        setGeocodingError('Erro ao processar localizações dos setores');
      } finally {
        setIsLoadingGeocode(false);
      }
    };

    geocodificarSetores();
  }, [setoresFiltrados, refreshTrigger, showAllPoints]);

  // Agrupar setores por localização
  const gruposSetores = agruparPorLocalizacao(setoresComCoordenadas);

  // Calcular centro e zoom do mapa
  const calcularCentroEZoom = useCallback(() => {
    if (setoresComCoordenadas.length === 0) {
      return { center: [COORDENADAS_TOCANTINS.lat, COORDENADAS_TOCANTINS.lng] as [number, number], zoom: 7 };
    }

    if (setoresComCoordenadas.length === 1) {
      const setor = setoresComCoordenadas[0];
      return {
        center: [setor.coordenadas.lat, setor.coordenadas.lng] as [number, number],
        zoom: 12
      };
    }

    const lats = setoresComCoordenadas.map(s => s.coordenadas.lat);
    const lngs = setoresComCoordenadas.map(s => s.coordenadas.lng);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);

    let zoom = 10;
    if (maxDiff > 5) zoom = 6;
    else if (maxDiff > 2) zoom = 7;
    else if (maxDiff > 1) zoom = 8;
    else if (maxDiff > 0.5) zoom = 9;
    else if (maxDiff > 0.1) zoom = 11;
    else zoom = 12;

    return { center: [centerLat, centerLng] as [number, number], zoom };
  }, [setoresComCoordenadas]);

  const { center, zoom } = calcularCentroEZoom();

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 p-2 hover:bg-blue-100"
        >
          <MapPin className="w-4 h-4 text-blue-700" />
          <span className="text-sm font-semibold text-blue-800">
            🗺️ Mapa Geral - Setores ({setoresComCoordenadas.length})
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-blue-700" />
          ) : (
            <ChevronDown className="w-4 h-4 text-blue-700" />
          )}
        </Button>
        {isLoadingGeocode && (
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            Carregando localizações...
          </div>
        )}
      </div>

      {/* Erro na geocodificação */}
      {geocodingError && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-sm text-red-800">❌ {geocodingError}</span>
        </div>
      )}

      {isExpanded && (
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-4 gap-4 h-[80vh] pb-4">
          {/* Painel de filtros */}
          <div className="lg:col-span-1 space-y-4 overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle>Filtros de Pesquisa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {/* Cidade como combobox pesquisável */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {filtros.cidade ? filtros.cidade : 'Cidade'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Pesquisar cidade..." />
                        <CommandEmpty>Nenhuma cidade encontrada</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {cidadesDisponiveis.map((cidade) => (
                              <CommandItem
                                key={cidade}
                                onSelect={() => setFiltros(prev => ({ ...prev, cidade }))}
                              >
                                {cidade}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>



                  {/* Setor combobox pesquisável, dependente da cidade */}
                  <Popover open={setorOpen} onOpenChange={setSetorOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between overflow-hidden">
                        <span className="w-full text-left whitespace-normal break-words">
                          {filtros.setor ? filtros.setor : 'Nome/Código do Setor'}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Pesquisar setor..." />
                        <CommandEmpty>Nenhum setor encontrado</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {(setores || [])
                              .filter((s: any) => !filtros.cidade || (s.CIDADE || '').trim() === filtros.cidade)
                              .map((s: any) => {
                                const label = s.NOME_SETOR || s.SETOR || s.CODIGO_SETOR || 'Setor';
                                return (
                                  <CommandItem
                                    key={String(s.ID ?? s.id)}
                                    onSelect={() => {
                                      const value = s.NOME_SETOR || s.SETOR || s.CODIGO_SETOR || '';
                                      setFiltros(prev => ({ ...prev, setor: value }));
                                      setSetorOpen(false);
                                    }}
                                  >
                                    {label}
                                  </CommandItem>
                                );
                              })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox checked={showAllPoints} onCheckedChange={(v) => setShowAllPoints(!!v)} />
                    <span className="text-xs text-muted-foreground">Mostrar todos os pontos</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => setAppliedFilters({ ...filtros })}
                    >
                      Buscar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAllPoints(false);
                        setSetoresComCoordenadas([]);
                        setFiltros({ setor: '', orgao: '', cidade: '' });
                        setAppliedFilters({ setor: '', orgao: '', cidade: '' });
                      }}
                    >
                      Limpar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mapa */}
          <div className="lg:col-span-3">
            <Card className="h-[calc(100%-1rem)]">
              <CardContent className="p-0 h-full">
                <div className="h-full rounded-lg overflow-hidden relative">
                  {isLoadingGeocode && (
                    <div className="absolute inset-0 z-[900] flex items-center justify-center bg-white/70">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {loadingTotal > 0 ? `Carregando dados (${loadingCount}/${loadingTotal})` : 'Carregando dados ...'}
                      </div>
                    </div>
                  )}
                  <MapContainer
                    center={center}
                    zoom={zoom}
                    style={{ height: '100%', width: '100%' }}
                    className="rounded-lg"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapUpdater center={center} zoom={zoom} />

                    {gruposSetores.map((grupo) => {
                      const isMultiple = grupo.setores.length > 1;
                      const currentIndex = getPopupIndex(grupo.key);
                      const currentSetor = grupo.setores[currentIndex] || grupo.setores[0];

                      return (
                        <Marker
                          key={grupo.key}
                          position={[grupo.coordenadas.lat, grupo.coordenadas.lng]}
                          icon={isMultiple ?
                            criarIconeComContador(grupo.setores.length, '#10b981') :
                            criarIconeSetor('#10b981')
                          }
                          eventHandlers={{
                            click: () => fetchUsuariosDoSetor(currentSetor.NOME_SETOR)
                          }}
                        >
                          <Popup className="custom-popup" maxWidth={300}>
                            <div className="space-y-2">
                              {isMultiple && (
                                <div className="flex items-center justify-between border-b pb-2">
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {currentIndex + 1} de {grupo.setores.length} setores
                                  </span>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setPopupIndex(grupo.key, Math.max(0, currentIndex - 1))}
                                      disabled={currentIndex === 0}
                                      className="h-6 w-6 p-0"
                                    >
                                      <ChevronLeft className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setPopupIndex(grupo.key, Math.min(grupo.setores.length - 1, currentIndex + 1))}
                                      disabled={currentIndex === grupo.setores.length - 1}
                                      className="h-6 w-6 p-0"
                                    >
                                      <ChevronRight className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}

                              <div>
                                <h4 className="font-semibold text-sm">{currentSetor.NOME_SETOR}</h4>
                                {currentSetor.CODIGO_SETOR && (
                                  <p className="text-xs text-muted-foreground">Código: {currentSetor.CODIGO_SETOR}</p>
                                )}
                                {currentSetor.ORGAO && (
                                  <p className="text-xs text-muted-foreground">Órgão: {currentSetor.ORGAO}</p>
                                )}
                              </div>

                              {(currentSetor.LOGRADOURO || currentSetor.BAIRRO || currentSetor.CIDADE) && (
                                <div className="text-xs">
                                  <p className="font-medium">Endereço:</p>
                                  <p>
                                    {[
                                      currentSetor.LOGRADOURO,
                                      currentSetor.NUMERO && currentSetor.NUMERO !== 'sem número' ? currentSetor.NUMERO : null,
                                      currentSetor.COMPLEMENTO
                                    ].filter(Boolean).join(', ')}
                                  </p>
                                  <p>
                                    {[currentSetor.BAIRRO, currentSetor.CIDADE, currentSetor.ESTADO].filter(Boolean).join(' - ')}
                                  </p>
                                  {currentSetor.CEP && <p>CEP: {currentSetor.CEP}</p>}
                                </div>
                              )}

                              {(currentSetor.TELEFONE || currentSetor.EMAIL) && (
                                <div className="text-xs border-t pt-2">
                                  {currentSetor.TELEFONE && <p>📞 {currentSetor.TELEFONE}</p>}
                                  {currentSetor.EMAIL && <p>✉️ {currentSetor.EMAIL}</p>}
                                </div>
                              )}


                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
});

MapaGeralSetores.displayName = 'MapaGeralSetores';

export default MapaGeralSetores;
