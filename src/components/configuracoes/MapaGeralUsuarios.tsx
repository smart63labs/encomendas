import React, { useState, useEffect, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COORDENADAS_TOCANTINS, ZOOM_TOCANTINS, COORDENADAS_PALMAS, TOLERANCIA_COORDENADAS } from '@/constants/mapConstants';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from '@/components/ui/command';
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
  ChevronRight, 
  Maximize2, 
  Minimize2
} from 'lucide-react';
import { api } from '@/lib/api';
import { useNotification } from '@/hooks/use-notification';
import NotificationModal from '@/components/ui/notification-modal';
import { GeocodingService, Coordenadas } from '@/services/geocoding.service';
import { getProfileBadgeClass, formatMatriculaVinculo } from '@/lib/utils';
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
interface Usuario {
  ID: number;
  NOME?: string;
  NAME?: string; // Compatibilidade
  E_MAIL?: string;
  EMAIL?: string; // Compatibilidade
  PHONE?: string;
  TELEFONE?: string;
  ROLE?: 'ADMIN' | 'USER';
  MATRICULA?: number;
  VINCULO_FUNCIONAL?: number;
  SETOR_ID?: number;
  IS_ACTIVE?: number;
  // Novos campos da estrutura
  CPF?: number;
  PIS_PASEP?: number;
  SEXO?: 'M' | 'F';
  ESTADO_CIVIL?: string;
  DATA_NASCIMENTO?: Date;
  PAI?: string;
  MAE?: string;
  RG?: string;
  TIPO_RG?: string;
  ORGAO_EXPEDITOR?: string;
  UF_RG?: string;
  EXPEDICAO_RG?: Date;
  CIDADE_NASCIMENTO?: string;
  UF_NASCIMENTO?: string;
  TIPO_SANGUINEO?: string;
  RACA_COR?: string;
  PNE?: string;
  TIPO_VINCULO?: string;
  CATEGORIA?: string;
  REGIME_JURIDICO?: string;
  REGIME_PREVIDENCIARIO?: string;
  EVENTO_TIPO?: string;
  FORMA_PROVIMENTO?: string;
  CODIGO_CARGO?: string;
  CARGO?: string;
  ESCOLARIDADE_CARGO?: string;
  ESCOLARIDADE_SERVIDOR?: string;
  FORMACAO_PROFISSIONAL_1?: string;
  FORMACAO_PROFISSIONAL_2?: string;
  JORNADA?: string;
  NIVEL_REFERENCIA?: string;
  COMISSAO_FUNCAO?: string;
  DATA_INI_COMISSAO?: Date;
  ENDERECO?: string;
  NUMERO_ENDERECO?: string;
  COMPLEMENTO_ENDERECO?: string;
  BAIRRO_ENDERECO?: string;
  CIDADE_ENDERECO?: string;
  UF_ENDERECO?: string;
  CEP_ENDERECO?: string;
  DATA_CRIACAO?: Date;
  DATA_ATUALIZACAO?: Date;
  BLOQUEADO_ATE?: Date;
  TENTATIVAS_LOGIN?: number;
  // Dados do setor (via JOIN)
  NOME_SETOR?: string;
  CODIGO_SETOR?: string;
  ORGAO?: string;
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

interface UsuarioComCoordenadas extends Usuario {
  coordenadas: {
    lat: number;
    lng: number;
  };
}

interface MapaGeralUsuariosProps {
  usuarios: Usuario[];
  setores: any[];
  isVisible: boolean;
  refreshTrigger?: number;
}

// Coordenadas padrão (compartilhadas)
// Já importadas de mapConstants

// Tolerância para considerar coordenadas como "iguais" (em graus decimais)
const COORDINATE_TOLERANCE = TOLERANCIA_COORDENADAS; // ~11 metros

// Ícones personalizados mais chamativos para pessoas
const criarIconeUsuario = (cor: string = '#2563eb') => {
  return L.divIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, ${cor} 0%, ${cor}dd 100%);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        animation: pulse 2s infinite;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5V9C15 10.1 15.9 11 17 11S19 10.1 19 11V9H21ZM15 20C15 21.1 15.9 22 17 22S19 21.1 19 20H21V18L15 18.5V20ZM12 7C8.69 7 6 9.69 6 13V16L4.5 17.5C4.19 17.81 4 18.21 4 18.62V20C4 20.55 4.45 21 5 21H19C19.55 21 20 20.55 20 20V18.62C20 18.21 19.81 17.81 19.5 17.5L18 16V13C18 9.69 15.31 7 12 7Z"/>
        </svg>
        <div style="
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          border: 1px solid white;
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      </style>
    `,
    className: 'custom-div-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const criarIconeComContador = (contador: number, cor: string = '#2563eb') => {
  return L.divIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, ${cor} 0%, ${cor}dd 100%);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 6px 16px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        animation: bounce 2s infinite;
      ">
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white" style="margin-bottom: 2px;">
            <path d="M16 4C18.2 4 20 5.8 20 8S18.2 12 16 12S12 10.2 12 8S13.8 4 16 4ZM16 13C18.67 13 24 14.34 24 17V20H8V17C8 14.34 13.33 13 16 13ZM8.5 6C10.16 6 11.5 7.34 11.5 9S10.16 12 8.5 12S5.5 10.66 5.5 9S6.84 6 8.5 6ZM8.5 13.5C11.83 13.5 15.5 15.17 15.5 17.5V20H0V17.5C0 15.17 3.67 13.5 8.5 13.5Z"/>
          </svg>
          <span style="
            color: white;
            font-size: 10px;
            font-weight: bold;
            line-height: 1;
          ">${contador}</span>
        </div>
        <div style="
          position: absolute;
          top: -3px;
          right: -3px;
          width: 12px;
          height: 12px;
          background: #f59e0b;
          border-radius: 50%;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="color: white; font-size: 8px; font-weight: bold;">${contador}</span>
        </div>
      </div>
      <style>
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
          60% { transform: translateY(-2px); }
        }
      </style>
    `,
    className: 'custom-div-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

// Cache para coordenadas
class CoordenadasCache {
  private static readonly CACHE_KEY = 'usuarios_coordenadas_cache';
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

// Função para agrupar usuários por localização (idêntica ao mapa de encomendas)
const agruparPorLocalizacao = (usuarios: UsuarioComCoordenadas[]) => {
  const grupos: { [key: string]: UsuarioComCoordenadas[] } = {};
  
  usuarios.forEach(usuario => {
    // Verificar se o usuário tem coordenadas válidas antes de prosseguir
    if (!usuario.coordenadas || !usuario.coordenadas.lat || !usuario.coordenadas.lng) {
      console.warn('Usuário sem coordenadas válidas:', usuario.ID, usuario.NOME);
      return; // Pular este usuário
    }

    let chave: string;
    
    // PRIORIDADE 1: Usar CEP do setor se disponível
    const cep = usuario.CEP || usuario.CEP_ENDERECO;
    
    if (cep) {
      // Usar CEP como chave principal
      chave = `cep_${cep}`;
    } else {
      // FALLBACK: Usar coordenadas arredondadas
      const lat = Math.round(usuario.coordenadas.lat / COORDINATE_TOLERANCE) * COORDINATE_TOLERANCE;
      const lng = Math.round(usuario.coordenadas.lng / COORDINATE_TOLERANCE) * COORDINATE_TOLERANCE;
      chave = `coord_${lat.toFixed(4)},${lng.toFixed(4)}`;
    }
    
    if (!grupos[chave]) {
      grupos[chave] = [];
    }
    grupos[chave].push(usuario);
  });
  
  return grupos;
};

// Função para geocodificar um usuário (baseado no setor)
const geocodificarUsuario = async (usuario: Usuario): Promise<UsuarioComCoordenadas> => {
  const usuarioKey = String(usuario.SETOR_ID || usuario.CEP || usuario.CEP_ENDERECO || 'sem_setor');

  // Verificar cache primeiro
  const coordenadasCacheadas = CoordenadasCache.get(usuarioKey);
  if (coordenadasCacheadas) {
    return {
      ...usuario,
      coordenadas: coordenadasCacheadas
    };
  }

  // Se tem coordenadas do setor no banco, usar elas
  if (usuario.LATITUDE != null && usuario.LONGITUDE != null) {
    const coordenadas = {
      lat: parseFloat(String(usuario.LATITUDE).replace(',', '.')),
      lng: parseFloat(String(usuario.LONGITUDE).replace(',', '.'))
    };
    if (!Number.isNaN(coordenadas.lat) && !Number.isNaN(coordenadas.lng)) {
      CoordenadasCache.set(usuarioKey, coordenadas);
      return {
        ...usuario,
        coordenadas
      };
    }
  }

  // Tentar geocodificar por CEP do setor (verificar se existe)
  const cep = usuario.CEP || usuario.CEP_ENDERECO;
  if (cep) {
    try {
      const resultado = await GeocodingService.geocodeByCep(cep);
      if (resultado.coordenadas) {
        CoordenadasCache.set(usuarioKey, resultado.coordenadas);
        return {
          ...usuario,
          coordenadas: resultado.coordenadas
        };
      }
    } catch (error) {
      console.error(`Erro ao geocodificar CEP ${cep}:`, error);
    }
  }

  // Tentar geocodificar por cidade/estado do setor
  if (usuario.CIDADE && usuario.ESTADO) {
    try {
      const resultado = await GeocodingService.geocodeByCityState(usuario.CIDADE, usuario.ESTADO);
      if (resultado.coordenadas) {
        CoordenadasCache.set(usuarioKey, resultado.coordenadas);
        return {
          ...usuario,
          coordenadas: resultado.coordenadas
        };
      }
    } catch (error) {
      console.error(`Erro ao geocodificar cidade ${usuario.CIDADE}:`, error);
    }
  }

  // Sem fallback artificial - retorna undefined se não conseguir geocodificar
  return undefined;
};

// Componente para atualizar o centro e zoom do mapa
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
};

const MapaGeralUsuarios: React.FC<MapaGeralUsuariosProps> = React.memo(({ usuarios, setores, isVisible, refreshTrigger }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [usuariosComCoordenadas, setUsuariosComCoordenadas] = useState<UsuarioComCoordenadas[]>([]);
  const [isLoadingGeocode, setIsLoadingGeocode] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [popupIndices, setPopupIndices] = useState<Record<string, number>>({});
  const [loadingTotal, setLoadingTotal] = useState(0);
  const [loadingCount, setLoadingCount] = useState(0);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [filtros, setFiltros] = useState<{ nome: string; setor: string; cpf: string; matricula: string }>({
    nome: '',
    setor: '',
    cpf: '',
    matricula: ''
  });
  const [appliedFilters, setAppliedFilters] = useState<{ nome: string; setor: string; cpf: string; matricula: string }>({
    nome: '',
    setor: '',
    cpf: '',
    matricula: ''
  });
  const [setorOpen, setSetorOpen] = useState(false);
  const [showAllPoints, setShowAllPoints] = useState(true);
  const DEFAULT_MAX_POINTS = 500;

  // Filtrar usuários para remover apenas os com ROLE='ADMIN'
  const usuariosFiltrados = useMemo(() => {
    console.log('🔍 MAPA - USUÁRIOS RECEBIDOS:', usuarios);
    console.log('🔍 MAPA - USUÁRIOS COM ROLE=ADMIN:', usuarios.filter(u => (u.ROLE || '').toUpperCase() === 'ADMIN'));
    
    // Filtrar apenas por ROLE='ADMIN'
    const filtrados = usuarios.filter(usuario => {
      // Filtrar apenas por perfil/role admin
      return (usuario.ROLE || '').toUpperCase() !== 'ADMIN';
    });
    
    console.log('🔍 MAPA - USUÁRIOS APÓS FILTRO:', filtrados);
    return filtrados;
  }, [usuarios]);

  const setoresIndex = useMemo(() => {
    const m = new Map<number, any>();
    (setores || []).forEach(s => {
      const id = Number(s.ID ?? s.id);
      if (!Number.isNaN(id)) m.set(id, s);
    });
    return m;
  }, [setores]);

  const usuariosComSetor = useMemo(() => {
    return (usuariosFiltrados || []).map(u => {
      const sid = Number(u.SETOR_ID);
      const setorMatch = !Number.isNaN(sid) && setoresIndex.has(sid) ? setoresIndex.get(sid) : undefined;
      if (!setorMatch) return u;
      return {
        ...u,
        NOME_SETOR: u.NOME_SETOR || setorMatch.NOME_SETOR || setorMatch.SETOR || u.SETOR,
        SETOR: u.SETOR || setorMatch.SETOR || setorMatch.NOME_SETOR,
        ORGAO: u.ORGAO || setorMatch.ORGAO,
        LOGRADOURO: u.LOGRADOURO || setorMatch.LOGRADOURO,
        NUMERO: u.NUMERO || setorMatch.NUMERO,
        COMPLEMENTO: u.COMPLEMENTO || setorMatch.COMPLEMENTO,
        BAIRRO: u.BAIRRO || setorMatch.BAIRRO,
        CIDADE: u.CIDADE || setorMatch.CIDADE,
        ESTADO: u.ESTADO || setorMatch.ESTADO,
        CEP: u.CEP || setorMatch.CEP,
        LATITUDE: u.LATITUDE ?? setorMatch.LATITUDE,
        LONGITUDE: u.LONGITUDE ?? setorMatch.LONGITUDE,
      } as Usuario;
    });
  }, [usuariosFiltrados, setoresIndex]);

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

  // Opções de perfis disponíveis
  const perfisDisponiveis = useMemo(() => {
    const set = new Set<string>();
    (usuariosComSetor || []).forEach(u => {
      const p = (u.PERFIL || u.ROLE || '').trim();
      if (p) set.add(p);
    });
    return Array.from(set).sort();
  }, [usuariosComSetor]);

  // Aplicar filtros ao conjunto base (sem ADMIN)
  const usuariosFiltradosComPainel = useMemo(() => {
    const termoNome = appliedFilters.nome.trim().toLowerCase();
    const termoSetor = appliedFilters.setor.trim().toLowerCase();
    const termoCPF = appliedFilters.cpf.trim().toLowerCase();
    const termoMat = appliedFilters.matricula.trim().toLowerCase();

    return (usuariosComSetor || []).filter(u => {
      const nomeMatch = termoNome ? ((u.NAME || u.NOME || '').toLowerCase().includes(termoNome)) : true;
      const setorMatch = termoSetor ? ((u.NOME_SETOR || u.SETOR || '').toLowerCase().includes(termoSetor)) : true;
      const cpfVal = String(u.CPF || '').toLowerCase();
      const cpfMatch = termoCPF ? cpfVal.includes(termoCPF) : true;
      const matFormatted = (formatMatriculaVinculo(u) || '').toLowerCase();
      const matRaw = String(u.MATRICULA || (u as any).numero_funcional || (u as any).numeroFuncional || '').toLowerCase();
      const matMatch = termoMat ? (matFormatted.includes(termoMat) || matRaw.includes(termoMat)) : true;
      return nomeMatch && setorMatch && cpfMatch && matMatch;
    });
  }, [usuariosComSetor, appliedFilters]);

  // Geocodificar usuários quando necessário
  useEffect(() => {
    const geocodificarUsuarios = async () => {
      if (!usuariosFiltradosComPainel || usuariosFiltradosComPainel.length === 0) {
        setUsuariosComCoordenadas([]);
        return;
      }

      setIsLoadingGeocode(true);
      setGeocodingError(null);

      try {
        const gruposMap = new Map<string, Usuario[]>();
        for (const u of usuariosFiltradosComPainel) {
          const chave = String(u.SETOR_ID || (u as any).CEP || (u as any).CEP_ENDERECO || 'sem_setor');
          const arr = gruposMap.get(chave) || [];
          arr.push(u as any);
          gruposMap.set(chave, arr);
        }

        const representantes = Array.from(gruposMap.values()).map(list => list[0]);
        const coordenadasPorChave: Record<string, { lat: number; lng: number } | undefined> = {};
        setLoadingTotal(representantes.length);
        setLoadingCount(0);

        const batchSize = 5;
        for (let i = 0; i < representantes.length; i += batchSize) {
          const lote = representantes.slice(i, i + batchSize);
          const promessasLote = lote.map(usuario => geocodificarUsuario(usuario));
          const resultadosLote = await Promise.all(promessasLote);
          resultadosLote.forEach((res) => {
            const chave = String(res.SETOR_ID || (res as any).CEP || (res as any).CEP_ENDERECO || 'sem_setor');
            coordenadasPorChave[chave] = res.coordenadas;
          });
          setLoadingCount((c) => c + resultadosLote.length);

          if (i + batchSize < representantes.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        const resultados: UsuarioComCoordenadas[] = usuariosFiltradosComPainel
          .map((u) => {
            const chave = String(u.SETOR_ID || (u as any).CEP || (u as any).CEP_ENDERECO || 'sem_setor');
            const coord = coordenadasPorChave[chave];
            return { ...(u as any), coordenadas: coord } as UsuarioComCoordenadas;
          })
          .filter((u) => !!(u.coordenadas && u.coordenadas.lat && u.coordenadas.lng));

        setUsuariosComCoordenadas(resultados);
      } catch (error) {
        console.error('Erro ao geocodificar usuários:', error);
        setGeocodingError('Erro ao processar localizações dos usuários');
      } finally {
        setIsLoadingGeocode(false);
      }
    };

    geocodificarUsuarios();
  }, [usuariosFiltradosComPainel, refreshTrigger, showAllPoints]);

  // Agrupar usuários por localização
  const gruposUsuarios = useMemo(() => {
    const grupos = agruparPorLocalizacao(usuariosComCoordenadas);
    return Object.entries(grupos).map(([key, usuarios]) => ({
      key,
      usuarios,
      coordenadas: usuarios[0].coordenadas
    }));
  }, [usuariosComCoordenadas]);

  // Calcular centro e zoom do mapa
  const calcularCentroEZoom = useCallback(() => {
    if (usuariosComCoordenadas.length === 0) {
      return { center: [COORDENADAS_TOCANTINS.lat, COORDENADAS_TOCANTINS.lng] as [number, number], zoom: 7 };
    }

    if (usuariosComCoordenadas.length === 1) {
      const usuario = usuariosComCoordenadas[0];
      return { 
        center: [usuario.coordenadas.lat, usuario.coordenadas.lng] as [number, number], 
        zoom: 12 
      };
    }

    const lats = usuariosComCoordenadas.map(u => u.coordenadas.lat);
    const lngs = usuariosComCoordenadas.map(u => u.coordenadas.lng);
    
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
  }, [usuariosComCoordenadas]);

  const { center, zoom } = calcularCentroEZoom();

  // Garantir renderização correta quando o container fica visível
  useEffect(() => {
    if (isVisible && isExpanded && mapInstance) {
      // Pequeno atraso para permitir layout antes do invalidateSize
      const t = setTimeout(() => {
        try {
          mapInstance.invalidateSize(true);
        } catch (e) {
          // noop
        }
      }, 100);
      return () => clearTimeout(t);
    }
  }, [isVisible, isExpanded, mapInstance]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 p-2 hover:bg-green-100"
        >
          <MapPin className="w-4 h-4 text-green-700" />
          <span className="text-sm font-semibold text-green-800">
            🗺️ Mapa Geral - Usuários ({usuariosComCoordenadas.length})
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-green-700" />
          ) : (
            <ChevronDown className="w-4 h-4 text-green-700" />
          )}
        </Button>
        {isLoadingGeocode && (
          <div className="flex items-center gap-1 text-xs text-green-600">
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
              <Input
                placeholder="Nome do Usuário"
                value={filtros.nome}
                onChange={(e) => setFiltros(prev => ({ ...prev, nome: e.target.value }))}
              />
              <Popover open={setorOpen} onOpenChange={setSetorOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {filtros.setor ? filtros.setor : 'Setor'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Pesquisar setor..." />
                    <CommandEmpty>Nenhum setor encontrado</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        {(setores || []).map((s: any) => {
                          const label = s.NOME_SETOR || s.SETOR || 'Setor';
                          return (
                            <CommandItem
                              key={String(s.ID ?? s.id)}
                              onSelect={() => {
                                setFiltros(prev => ({ ...prev, setor: label }));
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
              <Input
                placeholder="CPF"
                value={filtros.cpf}
                onChange={(e) => setFiltros(prev => ({ ...prev, cpf: e.target.value }))}
              />
              <Input
                placeholder="Matrícula (com vínculo)"
                value={filtros.matricula}
                onChange={(e) => setFiltros(prev => ({ ...prev, matricula: e.target.value }))}
              />
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
                  setFiltros({ nome: '', setor: '', cpf: '', matricula: '' });
                  setAppliedFilters({ nome: '', setor: '', cpf: '', matricula: '' });
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
                    whenCreated={(map) => setMapInstance(map)}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapUpdater center={center} zoom={zoom} />
                    
                    {/* Renderizar marcadores agrupados de usuários */}
                    {Object.entries(agruparPorLocalizacao(usuariosComCoordenadas)).map(([chave, usuarios]) => {
                      const primeiroUsuario = usuarios[0];
                      const coordenada = primeiroUsuario.coordenadas;
                      const icone = usuarios.length > 1 ? 
                        criarIconeComContador(usuarios.length, '#f59e0b') : 
                        criarIconeUsuario('#f59e0b');
                        
                      return (
                        <Marker key={chave} position={[coordenada.lat, coordenada.lng]} icon={icone}>
                          <Popup>
                            <div className="p-2 w-80">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-green-800">👤 Usuário</h4>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setPopupIndex(chave, Math.max(0, getPopupIndex(chave) - 1))}
                              disabled={getPopupIndex(chave) === 0}
                              className="p-2 text-xs bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full shadow-md transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <span className="text-xs text-gray-600">{getPopupIndex(chave) + 1} de {usuarios.length}</span>
                            <button 
                              onClick={() => setPopupIndex(chave, Math.min(usuarios.length - 1, getPopupIndex(chave) + 1))}
                              disabled={getPopupIndex(chave) === usuarios.length - 1}
                              className="p-2 text-xs bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full shadow-md transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm">{usuarios[getPopupIndex(chave)].NOME || usuarios[getPopupIndex(chave)].NAME}</h4>
                              {(usuarios[getPopupIndex(chave)].USUARIO_ATIVO !== undefined || usuarios[getPopupIndex(chave)].ATIVO !== undefined || usuarios[getPopupIndex(chave)].IS_ACTIVE !== undefined) && (
                                <Badge variant={
                                  (usuarios[getPopupIndex(chave)].USUARIO_ATIVO || usuarios[getPopupIndex(chave)].ATIVO || usuarios[getPopupIndex(chave)].IS_ACTIVE) 
                                    ? "default" 
                                    : "destructive"
                                }>
                                  {(usuarios[getPopupIndex(chave)].USUARIO_ATIVO || usuarios[getPopupIndex(chave)].ATIVO || usuarios[getPopupIndex(chave)].IS_ACTIVE) ? 'Ativo' : 'Inativo'}
                                </Badge>
                              )}
                            </div>
                            
                            {/* Email */}
                            <p className="text-xs text-muted-foreground mb-1">
                              <strong>Email:</strong> {usuarios[getPopupIndex(chave)].E_MAIL || usuarios[getPopupIndex(chave)].EMAIL || usuarios[getPopupIndex(chave)].email || 'Não informado'}
                            </p>
                            
                            {/* Telefone */}
                            {(usuarios[getPopupIndex(chave)].PHONE || usuarios[getPopupIndex(chave)].TELEFONE) && (
                              <p className="text-xs text-muted-foreground mb-1">
                                <strong>Telefone:</strong> {usuarios[getPopupIndex(chave)].PHONE || usuarios[getPopupIndex(chave)].TELEFONE}
                              </p>
                            )}
                            
                            {/* Matrícula */}
                            {(usuarios[getPopupIndex(chave)].MATRICULA || usuarios[getPopupIndex(chave)].VINCULO_FUNCIONAL) && (
                              <p className="text-xs text-muted-foreground">
                                <strong>Matrícula:</strong> {formatMatriculaVinculo(usuarios[getPopupIndex(chave)])}
                              </p>
                            )}
                            
                            {/* Setor */}
                            {(usuarios[getPopupIndex(chave)].NOME_SETOR || usuarios[getPopupIndex(chave)].SETOR) && (
                              <p className="text-xs text-muted-foreground">
                                <strong>Setor:</strong> {usuarios[getPopupIndex(chave)].NOME_SETOR || usuarios[getPopupIndex(chave)].SETOR}
                              </p>
                            )}
                            
                            {/* Endereço do Setor */}
                            {(usuarios[getPopupIndex(chave)].LOGRADOURO || usuarios[getPopupIndex(chave)].CIDADE) && (
                              <p className="text-xs text-muted-foreground">
                                <strong>Endereço:</strong> {[
                                  usuarios[getPopupIndex(chave)].LOGRADOURO,
                                  usuarios[getPopupIndex(chave)].NUMERO,
                                  usuarios[getPopupIndex(chave)].COMPLEMENTO,
                                  usuarios[getPopupIndex(chave)].BAIRRO,
                                  usuarios[getPopupIndex(chave)].CIDADE,
                                  usuarios[getPopupIndex(chave)].ESTADO,
                                  usuarios[getPopupIndex(chave)].CEP
                                ].filter(Boolean).join(', ')}
                              </p>
                            )}
                            
                            {/* Órgão */}
                            {usuarios[getPopupIndex(chave)].ORGAO && (
                              <p className="text-xs text-muted-foreground">
                                <strong>Órgão:</strong> {usuarios[getPopupIndex(chave)].ORGAO}
                              </p>
                            )}
                            
                            {/* Perfil/Cargo */}
                            {(usuarios[getPopupIndex(chave)].PERFIL || usuarios[getPopupIndex(chave)].ROLE) && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Perfil:</span>
                                <Badge className={getProfileBadgeClass(usuarios[getPopupIndex(chave)].PERFIL || usuarios[getPopupIndex(chave)].ROLE)}>
                                  {usuarios[getPopupIndex(chave)].PERFIL || usuarios[getPopupIndex(chave)].ROLE}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
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

MapaGeralUsuarios.displayName = 'MapaGeralUsuarios';

export default MapaGeralUsuarios;
