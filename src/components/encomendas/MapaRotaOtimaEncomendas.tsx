import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Polyline, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { useNotification } from '@/hooks/use-notification';
import { COORDENADAS_TOCANTINS, ZOOM_TOCANTINS } from '@/constants/mapConstants';
import type { Encomenda } from '@/types/encomenda.types';
import { X, Route as RouteIcon, MousePointer, MapPin, Loader2, Package, Truck, Info, User } from 'lucide-react';
import { GeocodingService } from '@/services/geocoding.service';
import { api } from '@/lib/api';
import { getApiBaseUrl } from '@/utils/api-url';
import { mapIcons } from '@/utils/map-icons';

// Ícones usando a nova implementação local
const inicioIcon = mapIcons.inicio;
const destinoIcon = mapIcons.destino;
const origemIcon = mapIcons.origem;

type Coordenada = { lat: number; lng: number };

interface Props {
  encomendas: Encomenda[];
  isVisible: boolean;
  refreshTrigger?: number;
}

type ClickMode = 'depot' | 'destino';

// Util: distância Haversine em km
const haversineKm = (a: Coordenada, b: Coordenada) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const d = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * d;
};

// Heurística simples: vizinho mais próximo + 2-opt
const nearestNeighborOrder = (points: Coordenada[]) => {
  const n = points.length;
  const unvisited = new Set(points.map((_, i) => i));
  const order: number[] = [0];
  unvisited.delete(0);
  while (unvisited.size) {
    const last = order[order.length - 1];
    let bestIdx = -1;
    let bestDist = Infinity;
    for (const i of unvisited) {
      const d = haversineKm(points[last], points[i]);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    order.push(bestIdx);
    unvisited.delete(bestIdx);
  }
  // fechar o ciclo voltando ao início
  order.push(0);
  return order;
};

const twoOptImprove = (points: Coordenada[], order: number[]) => {
  const distanceOf = (i: number, j: number) => haversineKm(points[order[i]], points[order[j]]);
  const totalDistance = (ord: number[]) => {
    let sum = 0;
    for (let k = 0; k < ord.length - 1; k++) sum += distanceOf(k, k + 1);
    return sum;
  };
  let improved = true;
  let best = order.slice();
  let bestDist = totalDistance(best);
  while (improved) {
    improved = false;
    for (let i = 1; i < best.length - 2; i++) {
      for (let j = i + 1; j < best.length - 1; j++) {
        const newOrder = best.slice(0, i).concat(best.slice(i, j).reverse(), best.slice(j));
        const newDist = totalDistance(newOrder);
        if (newDist < bestDist - 0.001) {
          best = newOrder;
          bestDist = newDist;
          improved = true;
        }
      }
    }
  }
  return best;
};

const formatKm = (km: number) => `${km.toFixed(1)} km`;

const MapaRotaOtimaEncomendas: React.FC<Props> = ({ encomendas, isVisible, refreshTrigger }) => {
  const { showError, showInfo } = useNotification();

  const [depotSetor, setDepotSetor] = useState<string>('');
  const [depotCoord, setDepotCoord] = useState<Coordenada | null>(null);
  const [destinos, setDestinos] = useState<Coordenada[]>([]);
  const [routeOrder, setRouteOrder] = useState<number[]>([]);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number>(0);
  const [routeDurationMin, setRouteDurationMin] = useState<number>(0);
  const [stopsInfo, setStopsInfo] = useState<Array<{ coord: Coordenada; km: number; min: number; ordem: number }>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [fitBoundsTick, setFitBoundsTick] = useState<number>(0);
  const [clickMode, setClickMode] = useState<ClickMode>('depot');
  const [autoLoading, setAutoLoading] = useState<boolean>(false);
  const [autoCount, setAutoCount] = useState<number>(0);
  const [origensEncomendas, setOrigensEncomendas] = useState<Coordenada[]>([]);
  const [destinosEncomendas, setDestinosEncomendas] = useState<Coordenada[]>([]);
  const [selectedDestino, setSelectedDestino] = useState<Coordenada | null>(null);
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [showRoute, setShowRoute] = useState<boolean>(true);
  const [centerOverride, setCenterOverride] = useState<[number, number] | null>(null);
  const [zoomOverride, setZoomOverride] = useState<number | null>(null);
  const segmentCacheRef = useRef<Map<string, { coords: [number, number][], distanceKm?: number, durationMin?: number }>>(new Map());

  // Combobox options e seleções (remetente/destinatário)
type LocalOption = { label: string; coord: Coordenada; usuario?: string; setor?: string };
  const [origemOptions, setOrigemOptions] = useState<LocalOption[]>([]);
  const [destinoOptions, setDestinoOptions] = useState<LocalOption[]>([]);
  const [openSaida, setOpenSaida] = useState(false);
  const [openDestino, setOpenDestino] = useState(false);
  const [selectedSaidaOption, setSelectedSaidaOption] = useState<LocalOption | null>(null);
  const [selectedDestinoOptionUi, setSelectedDestinoOptionUi] = useState<LocalOption | null>(null);
  const [destinoTodos, setDestinoTodos] = useState<boolean>(false);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);

  // Determinar setor origem mais frequente como depósito
  // Modo de clique: primeiro define saída, depois adiciona destinos
  useEffect(() => {
    if (!depotCoord) setClickMode('depot');
    else setClickMode('destino');
  }, [depotCoord]);

  useEffect(() => {
    const carregarHub = async () => {
      try {
        const resp = await api.getConfiguracaoPorChave('geral', 'HUB_SETOR_ID');
        const raw = (resp as any)?.data?.data ?? (resp as any)?.data;
        const valor = (raw as any)?.valor ?? (raw as any)?.VALOR ?? raw;
        const id = typeof valor === 'number' ? valor : parseInt(String(valor));
        if (!Number.isFinite(id)) return;
        const r = await api.getSetorById(id);
        const s = (r as any)?.data?.data ?? (r as any)?.data ?? {};
        const lat = (s as any)?.LATITUDE ?? (s as any)?.latitude;
        const lng = (s as any)?.LONGITUDE ?? (s as any)?.longitude;
        let coord: Coordenada | null = null;
        if (lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
          coord = { lat: Number(lat), lng: Number(lng) };
        }
        if (!coord) {
          const cep = (s as any)?.CEP ?? (s as any)?.cep;
          if (cep) {
            const res = await GeocodingService.geocodeByCep(String(cep));
            if (res?.coordenadas) coord = { lat: res.coordenadas.lat, lng: res.coordenadas.lng };
          }
        }
        if (!coord) {
          const nome = (s as any)?.NOME_SETOR ?? (s as any)?.SETOR ?? (s as any)?.nome_setor ?? (s as any)?.setor;
          if (nome) {
            const c = await GeocodingService.geocodificar(`${String(nome)}, TO, Brasil`);
            if (c) coord = { lat: c.lat, lng: c.lng };
          }
        }
        if (coord) {
          setDepotCoord(coord);
          const nomeSetorHub = (s as any)?.NOME_SETOR || (s as any)?.nome_setor || (s as any)?.SETOR || (s as any)?.setor || (s as any)?.NOME || (s as any)?.nome || '';
          setDepotSetor(nomeSetorHub);
          setFitBoundsTick(t => t + 1);
        }
      } catch {}
      try {
        if (!depotCoord || !depotSetor) {
          const respCat = await api.getConfiguracoesPorCategoria('geral');
          const dataCat = (respCat as any)?.data?.data ?? (respCat as any)?.data;
          const arr = Array.isArray(dataCat) ? dataCat : [];
          const item = arr.find((x: any) => String(x?.chave || x?.CHAVE).toUpperCase() === 'HUB_SETOR_ID');
          const v = item?.valor ?? item?.VALOR;
          const id2 = typeof v === 'number' ? v : parseInt(String(v));
          if (Number.isFinite(id2)) {
            const r2 = await api.getSetorById(id2);
            const s2 = (r2 as any)?.data?.data ?? (r2 as any)?.data ?? {};
            const nomeSetorHub2 = (s2 as any)?.NOME_SETOR || (s2 as any)?.nome_setor || (s2 as any)?.SETOR || (s2 as any)?.setor || (s2 as any)?.NOME || (s2 as any)?.nome || '';
            if (nomeSetorHub2) setDepotSetor(nomeSetorHub2);
            const lat2 = (s2 as any)?.LATITUDE ?? (s2 as any)?.latitude;
            const lng2 = (s2 as any)?.LONGITUDE ?? (s2 as any)?.longitude;
            if (lat2 != null && lng2 != null && !isNaN(Number(lat2)) && !isNaN(Number(lng2))) {
              setDepotCoord({ lat: Number(lat2), lng: Number(lng2) });
              setFitBoundsTick(t => t + 1);
            }
          }
        }
      } catch {}
    };
    carregarHub();
  }, []);

  // Normalização de status e filtro de não entregues
  const normalizar = (s?: string) => `${s || ''}`.trim().toLowerCase();
  const isNaoEntregue = (s?: string) => {
    const n = normalizar(s);
    // Considera como "não entregue" tudo que não seja claramente entregue/concluído
    // e inclui variações comuns
    const entregue = n.includes('entregue') || n.includes('entregado') || n.includes('conclu');
    return !entregue; // queremos pendentes/nao entregues/em trânsito
  };

  // Carregar automaticamente origem e destino de encomendas não entregues (apenas visual)
  const carregarMarcadoresEncomendas = useCallback(async () => {
    if (!encomendas || encomendas.length === 0) return;
    setAutoLoading(true);
    try {
      const pendentes = encomendas.filter((e) => isNaoEntregue(e.status));
      setAutoCount(pendentes.length);

      const origemCalculadas: Coordenada[] = [];
      const destinoCalculadas: Coordenada[] = [];
      const origemOpts: LocalOption[] = [];
      const destinoOpts: LocalOption[] = [];

      for (const e of pendentes) {
        let origem: Coordenada | null = null;
        let destino: Coordenada | null = null;

        // DESTINO: prioriza CEP -> coordenadas salvas -> endereço -> nome do setor
        const cepDestino = (e as any).setorDestinoEndereco?.cep || (e as any).setorDestinoCep;
        if (cepDestino) {
          const res = await GeocodingService.geocodeByCep(cepDestino);
          if (res?.coordenadas && GeocodingService.isInTocantins(res.coordenadas)) {
            destino = { lat: res.coordenadas.lat, lng: res.coordenadas.lng };
          }
        }
        if (!destino && e.setorDestinoCoordenadas?.latitude && e.setorDestinoCoordenadas?.longitude) {
          const lat = Number(e.setorDestinoCoordenadas.latitude);
          const lng = Number(e.setorDestinoCoordenadas.longitude);
          if (!isNaN(lat) && !isNaN(lng)) destino = { lat, lng };
        }
        if (!destino && (e as any).setorDestinoEndereco) {
          const end: any = (e as any).setorDestinoEndereco;
          const res = await GeocodingService.geocodeByAddress({
            cep: end.cep || '',
            logradouro: end.logradouro || '',
            numero: end.numero || '',
            complemento: end.complemento || '',
            bairro: end.bairro || (e.setorDestino || ''),
            cidade: end.cidade || '',
            estado: end.estado || 'TO',
          });
          if (res?.coordenadas && GeocodingService.isInTocantins(res.coordenadas)) {
            destino = { lat: res.coordenadas.lat, lng: res.coordenadas.lng };
          }
        }
        if (!destino && e.setorDestino) {
          const resCoord = await GeocodingService.geocodificar(`${e.setorDestino}, TO, Brasil`);
          if (resCoord && GeocodingService.isInTocantins(resCoord)) {
            destino = { lat: resCoord.lat, lng: resCoord.lng };
          }
        }

        // ORIGEM: prioriza CEP -> coordenadas salvas -> endereço -> nome do setor
        const cepOrigem = (e as any).setorOrigemEndereco?.cep || (e as any).setorOrigemCep;
        if (cepOrigem) {
          const res = await GeocodingService.geocodeByCep(cepOrigem);
          if (res?.coordenadas && GeocodingService.isInTocantins(res.coordenadas)) {
            origem = { lat: res.coordenadas.lat, lng: res.coordenadas.lng };
          }
        }
        if (!origem && e.setorOrigemCoordenadas?.latitude && e.setorOrigemCoordenadas?.longitude) {
          const lat = Number(e.setorOrigemCoordenadas.latitude);
          const lng = Number(e.setorOrigemCoordenadas.longitude);
          if (!isNaN(lat) && !isNaN(lng)) origem = { lat, lng };
        }
        if (!origem && (e as any).setorOrigemEndereco) {
          const end: any = (e as any).setorOrigemEndereco;
          const res = await GeocodingService.geocodeByAddress({
            cep: end.cep || '',
            logradouro: end.logradouro || '',
            numero: end.numero || '',
            complemento: end.complemento || '',
            bairro: end.bairro || (e.setorOrigem || ''),
            cidade: end.cidade || '',
            estado: end.estado || 'TO',
          });
          if (res?.coordenadas && GeocodingService.isInTocantins(res.coordenadas)) {
            origem = { lat: res.coordenadas.lat, lng: res.coordenadas.lng };
          }
        }
        if (!origem && e.setorOrigem) {
          const resCoord = await GeocodingService.geocodificar(`${e.setorOrigem}, TO, Brasil`);
          if (resCoord && GeocodingService.isInTocantins(resCoord)) {
            origem = { lat: resCoord.lat, lng: resCoord.lng };
          }
        }

        if (origem) {
          origemCalculadas.push(origem);
          origemOpts.push({
            label: (e.remetente || e.setorOrigem || 'Remetente'),
            coord: origem,
            usuario: e.remetente,
            setor: e.setorOrigem,
          });
        }
        if (destino) {
          destinoCalculadas.push(destino);
          destinoOpts.push({
            label: (e.destinatario || e.setorDestino || 'Destinatário'),
            coord: destino,
            usuario: e.destinatario,
            setor: e.setorDestino,
          });
        }
      }

      // Deduplicar por aproximação
      const keyOf = (c: Coordenada) => `${c.lat.toFixed(5)},${c.lng.toFixed(5)}`;
      const uniq = (arr: Coordenada[]) => {
        const seen = new Set<string>();
        const out: Coordenada[] = [];
        for (const c of arr) { const k = keyOf(c); if (!seen.has(k)) { seen.add(k); out.push(c); } }
        return out;
      };
      const uniqOpts = (arr: LocalOption[]) => {
        const map = new Map<string, LocalOption>();
        for (const opt of arr) {
          const k = keyOf(opt.coord);
          if (!map.has(k)) map.set(k, opt);
        }
        return Array.from(map.values());
      };

      const origensUnicas = uniq(origemCalculadas);
      const destinosUnicos = uniq(destinoCalculadas);

      setOrigensEncomendas(origensUnicas);
      setDestinosEncomendas(destinosUnicos);
      setOrigemOptions(uniqOpts(origemOpts));
      setDestinoOptions(uniqOpts(destinoOpts));
      setRouteOrder([]);
      setRouteDistanceKm(0);
      setRouteCoordinates([]);
      setFitBoundsTick((t) => t + 1);
    } finally {
      setAutoLoading(false);
    }
  }, [encomendas]);

  useEffect(() => {
    carregarMarcadoresEncomendas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregarMarcadoresEncomendas]);

  // Clique livre no mapa desativado: selecione saída por marcador existente.

  const calcularRota = useCallback(() => {
    if (!depotCoord) {
      showError('Sem depósito', 'Carregue coordenadas antes de calcular a rota.');
      return;
    }
    if (destinos.length === 0) {
      showError('Sem destinos', 'Não há destinos válidos no filtro atual.');
      return;
    }
    const points = [depotCoord, ...destinos];
    let order = nearestNeighborOrder(points);
    order = twoOptImprove(points, order);
    const dist = order.reduce((acc, _, i) => {
      if (i === order.length - 1) return acc;
      return acc + haversineKm(points[order[i]], points[order[i + 1]]);
    }, 0);
    setRouteOrder(order);
    setRouteDistanceKm(dist);
    setRouteCoordinates([]); // rota direta (fallback), sem coordenadas por rodovia
  }, [depotCoord, destinos, showError]);

  // Calcular rota diretamente a partir de dados fornecidos (evita corrida de estado)
  const calcularRotaComDados = useCallback((depot: Coordenada, dests: Coordenada[]) => {
    if (!depot) {
      showError('Sem saída', 'Selecione a origem (remetente) primeiro.');
      return;
    }
    if (!dests || dests.length === 0) {
      showError('Sem destinos', 'Escolha um destinatário ou todos os destinos.');
      return;
    }
    const points = [depot, ...dests];
    let order = nearestNeighborOrder(points);
    order = twoOptImprove(points, order);
    const dist = order.reduce((acc, _, i) => {
      if (i === order.length - 1) return acc;
      return acc + haversineKm(points[order[i]], points[order[i + 1]]);
    }, 0);
    setRouteOrder(order);
    setRouteDistanceKm(dist);
    setRouteCoordinates([]); // será substituída ao calcular via rodovias
  }, [showError]);

  // Removido: reset automático da rota ao alterar seleção
  // Anteriormente, limpar a rota em um efeito aqui apagava cálculos recém feitos
  // pelo botão "Traçar Rota". As funções de alteração de seleção já limpam a rota
  // manualmente quando necessário (ex.: limparTudo, definirSaidaCom, etc.).

  // Limpar filtros e estado
  const limparTudo = useCallback(() => {
    setDepotSetor('');
    setDepotCoord(null);
    setDestinos([]); // limpa apenas destinos escolhidos para rota
    setRouteOrder([]);
    setRouteDistanceKm(0);
    setClickMode('depot');
    setSelectedDestino(null);
  }, []);

  // Bounds de todos os marcadores
  const boundsAll = useMemo(() => {
    const pts: L.LatLng[] = [];
    if (depotCoord) pts.push(L.latLng(depotCoord.lat, depotCoord.lng));
    destinos.forEach((d) => pts.push(L.latLng(d.lat, d.lng))); // destinos escolhidos para rota
    origensEncomendas.forEach((o) => pts.push(L.latLng(o.lat, o.lng)));
    destinosEncomendas.forEach((d) => pts.push(L.latLng(d.lat, d.lng)));
    if (pts.length === 0) return null;
    return L.latLngBounds(pts);
  }, [depotCoord, destinos, origensEncomendas, destinosEncomendas]);

  useEffect(() => {
    if (isVisible && boundsAll) {
      setFitBoundsTick((t) => t + 1);
    }
  }, [isVisible, boundsAll]);

  const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
      map.setView(center, zoom);
    }, [map, center, zoom]);
    return null;
  };

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

  const polylinePositions = useMemo(() => {
    if (routeCoordinates.length > 0) return routeCoordinates;
    if (!routeOrder.length || !depotCoord) return [] as [number, number][];
    const points = [depotCoord, ...destinos];
    return routeOrder.map((idx) => [points[idx].lat, points[idx].lng] as [number, number]);
  }, [routeCoordinates, routeOrder, destinos, depotCoord]);

  // Definir saída e preencher destinos automaticamente com os pontos de destinatário restantes
  const definirSaidaCom = useCallback((coord: Coordenada) => {
    setDepotCoord(coord);
    setDepotSetor('Saída selecionada');
    setClickMode('destino');
    setDestinos(() => {
      const excludeKey = `${coord.lat.toFixed(6)},${coord.lng.toFixed(6)}`;
      const lista = destinosEncomendas.filter(d => `${d.lat.toFixed(6)},${d.lng.toFixed(6)}` !== excludeKey);
      return lista;
    });
    setRouteOrder([]);
    setRouteDistanceKm(0);
    setFitBoundsTick(t => t + 1);
  }, [destinosEncomendas]);

  const calcularRotaComSaida = useCallback((coord?: Coordenada) => {
    if (coord) definirSaidaCom(coord);
    calcularRota();
  }, [definirSaidaCom, calcularRota]);

  // Calcular rota para dois pontos: saída já definida e um único destino
  const calcularRotaComDestinoUnico = useCallback((dest: Coordenada) => {
    if (!depotCoord) {
      showError('Sem saída', 'Selecione a origem (remetente) primeiro.');
      return;
    }
    setDestinos([dest]);
    setRouteOrder([]);
    setRouteDistanceKm(0);
    setFitBoundsTick((t) => t + 1);
    calcularRota();
  }, [depotCoord, calcularRota, showError]);

  const calcularRotaParaDestinoSelecionado = useCallback(() => {
    if (!depotCoord) {
      showError('Sem saída', 'Selecione a origem (remetente) primeiro.');
      return;
    }
    if (!selectedDestino) {
      showInfo('Selecione um destino', 'Clique em um marcador de destino no mapa.');
      return;
    }
    calcularRotaComDestinoUnico(selectedDestino);
  }, [depotCoord, selectedDestino, calcularRotaComDestinoUnico, showError, showInfo]);

  // Traçar rota a partir das seleções dos comboboxes
  const coordKey = useCallback((c: Coordenada) => `${c.lat.toFixed(6)},${c.lng.toFixed(6)}`, []);
  const tracarRotaSelecionada = useCallback(() => {
    if (!depotCoord) {
      showError('Sem saída', 'Defina o centro logístico nas configurações.');
      return;
    }
    let novosDestinos: Coordenada[] = [];
    if (destinoTodos) {
      if (destinosEncomendas.length === 0) {
        showError('Sem destinos', 'Não há destinatários disponíveis.');
        return;
      }
      const excludeKey = coordKey(depotCoord);
      novosDestinos = destinosEncomendas.filter(d => coordKey(d) !== excludeKey);
    } else {
      if (!selectedDestinoOptionUi) {
        showError('Selecione o destino', 'Escolha um destinatário ou use "Todos os destinos".');
        return;
      }
      novosDestinos = [selectedDestinoOptionUi.coord];
    }
    setDestinos(novosDestinos);
    setRouteOrder([]);
    setRouteDistanceKm(0);
    setRouteCoordinates([]);
    setFitBoundsTick((t) => t + 1);
    calcularRotaComDados(depotCoord, novosDestinos);
    setShowRoute(true);
  }, [depotCoord, destinoTodos, selectedDestinoOptionUi, destinosEncomendas, coordKey, calcularRotaComDados, showError]);

  // Roteamento por rodovias: solicitar ao backend (OpenRouteService) as coordenadas por estrada
  const apiBase = getApiBaseUrl();
  const obterRotaRodovia = useCallback(async (origem: Coordenada, destino: Coordenada) => {
    try {
      const k = `${origem.lat.toFixed(6)},${origem.lng.toFixed(6)}->${destino.lat.toFixed(6)},${destino.lng.toFixed(6)}`;
      const cached = segmentCacheRef.current.get(k);
      if (cached) return cached;
      const body = {
        profile: 'driving-car',
        coordinates: [
          [origem.lng, origem.lat],
          [destino.lng, destino.lat]
        ],
        radiuses: [5000, 5000],
      };
      const res = await fetch(`${apiBase}/routing/directions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        try { const txt = await res.text(); console.error('Falha rota rodovia:', res.status, txt, body); } catch {}
        return null;
      }
      const json = await res.json();
      if (json?.success && json?.data?.coordinates) {
        const coordsLngLat: [number, number][] = json.data.coordinates as [number, number][];
        const coordsLatLng: [number, number][] = coordsLngLat.map(([lng, lat]) => [lat, lng]);
        const out = {
          coords: coordsLatLng,
          distanceKm: typeof json.data.distance === 'string' ? parseFloat(json.data.distance) : Number(json.data.distance),
          durationMin: Number(json.data.duration),
        } as { coords: [number, number][], distanceKm?: number, durationMin?: number };
        segmentCacheRef.current.set(k, out);
        return out;
      }
      return null;
    } catch (err) {
      console.error('Erro ao obter rota rodovia', err);
      return null;
    }
  }, [apiBase]);

  // Construir polyline pela malha viária para ordem calculada
  const construirPolylineRodovias = useCallback(async (points: Coordenada[], order: number[]) => {
    setLoading(true);
    try {
      const full: [number, number][][] = [];
      let somaKm = 0;
      let somaMin = 0;
      const infos: Array<{ coord: Coordenada; km: number; min: number; ordem: number }> = [];
      const avgSpeedKmH = 45; // estimativa para fallback
      let paradaCount = 0;
      for (let i = 0; i < order.length - 1; i++) {
        const a = points[order[i]];
        const b = points[order[i + 1]];
        const rota = await obterRotaRodovia(a, b);
        if (rota?.coords && rota.coords.length > 0) {
          full.push(rota.coords);
          if (rota.distanceKm && !isNaN(rota.distanceKm)) somaKm += rota.distanceKm;
          if (rota.durationMin && !isNaN(rota.durationMin)) somaMin += rota.durationMin;
        } else {
          // Fallback: segmento direto
          full.push([[a.lat, a.lng], [b.lat, b.lng]]);
          const km = haversineKm(a, b);
          somaKm += km;
          somaMin += (km / avgSpeedKmH) * 60;
        }
        if (order[i + 1] !== 0) {
          paradaCount += 1;
          infos.push({ coord: b, km: somaKm, min: somaMin, ordem: paradaCount });
        }
      }
      // Flatten mantendo ordem
      const merged: [number, number][] = [];
      for (const seg of full) {
        if (merged.length > 0 && seg.length > 0) {
          const [lastLat, lastLng] = merged[merged.length - 1];
          const [firstLat, firstLng] = seg[0];
          // Evitar duplicar o ponto de junção
          if (lastLat === firstLat && lastLng === firstLng) {
            merged.push(...seg.slice(1));
            continue;
          }
        }
        merged.push(...seg);
      }
      setRouteCoordinates(merged);
      setRouteDistanceKm(somaKm);
      setRouteDurationMin(somaMin);
      setStopsInfo(infos);
      setShowRoute(true);
      setFitBoundsTick(t => t + 1);
    } finally {
      setLoading(false);
    }
  }, [obterRotaRodovia]);

  // Após calcular ordem, construir rota por rodovias
  useEffect(() => {
    if (!depotCoord || destinos.length === 0 || routeOrder.length === 0) return;
    const points = [depotCoord, ...destinos];
    construirPolylineRodovias(points, routeOrder);
  }, [depotCoord, destinos, routeOrder, construirPolylineRodovias]);

  // Limpar apenas as rotas (manter seleções)
  const limparRotas = useCallback(() => {
    setRouteOrder([]);
    setRouteDistanceKm(0);
    setRouteCoordinates([]);
    setRouteDurationMin(0);
    setStopsInfo([]);
  }, []);

  // Usar overrides quando definidos
  const centerUse: [number, number] = centerOverride ?? [COORDENADAS_TOCANTINS.lat, COORDENADAS_TOCANTINS.lng];
  const zoomUse: number = zoomOverride ?? ZOOM_TOCANTINS;

  return (
    <div className="h-[80vh] flex flex-col">
      {/* Toolbar superior igual ao Mapa Geral */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setFitBoundsTick((t) => t + 1)} disabled={!boundsAll}>
          <Package className="w-4 h-4" /> Enquadrar marcadores
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowRoute((v) => !v)}>
          <Truck className="w-4 h-4" /> {showRoute ? 'Ocultar rotas' : 'Mostrar rotas'}
        </Button>
      </div>
      <div className="relative flex-1 rounded-lg overflow-hidden border border-blue-300">
        {(autoLoading || loading) && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/70">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando dados ...
            </div>
          </div>
        )}
        {/* Painel flutuante à esquerda: Saída, Destino, Traçar/Limpar rotas */}
        <div className="absolute top-16 left-14 z-[600] w-[380px] bg-white/95 backdrop-blur rounded-md shadow p-3 space-y-3">
          <div className="text-xs font-medium text-gray-700">Roteamento</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-2 py-1 border rounded">
              <User className="w-3 h-3" />
              <span className="text-xs font-medium">Saída:</span>
              <span className="truncate flex-1 min-w-0">{depotSetor || '—'}</span>
            </div>

            {/* Combobox: Destino (Destinatário ou Todos) */}
            <Popover open={openDestino} onOpenChange={setOpenDestino}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 w-full justify-start overflow-hidden">
                  <Truck className="w-4 h-4" />
                  <span className="text-xs font-medium">Destino:</span>
                  <span className="truncate flex-1 min-w-0" title={selectedDestinoOptionUi ? `${selectedDestinoOptionUi.usuario || selectedDestinoOptionUi.label}${selectedDestinoOptionUi.setor ? ' — ' + selectedDestinoOptionUi.setor : ''}` : (destinoTodos ? 'Todos os destinos' : '')}>
                    {destinoTodos
                      ? 'Todos os destinos'
                      : selectedDestinoOptionUi
                        ? `${selectedDestinoOptionUi.usuario || selectedDestinoOptionUi.label}${selectedDestinoOptionUi.setor ? ' — ' + selectedDestinoOptionUi.setor : ''}`
                        : 'Escolher destino'}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[360px] max-h-[280px] overflow-auto" align="start">
                <Command>
                  <CommandInput placeholder="Buscar destinatário..." />
                  <CommandList>
                    <CommandEmpty>Nenhum destinatário encontrado.</CommandEmpty>
                    <CommandGroup heading="Opções">
                      <CommandItem onSelect={() => { setDestinoTodos(true); setSelectedDestinoOptionUi(null); setOpenDestino(false); }}>
                        Todos os destinos
                      </CommandItem>
                    </CommandGroup>
                    <CommandGroup heading="Destinatários">
                      {destinoOptions.map((opt, idx) => (
                        <CommandItem key={`dest-${idx}`} onSelect={() => { setSelectedDestinoOptionUi(opt); setDestinoTodos(false); setOpenDestino(false); }}>
                          {(opt.usuario || opt.label) + (opt.setor ? ` — ${opt.setor}` : '')}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="gap-2" onClick={tracarRotaSelecionada}>
              <RouteIcon className="w-4 h-4" />
              Traçar rota
            </Button>
            <Button size="sm" variant="outline" className="gap-2" onClick={limparRotas}>
              <X className="w-4 h-4" />
              Limpar rotas
            </Button>
          </div>
          {/* Informações resumidas abaixo, com truncamento para evitar overflow */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex gap-1">
              <span className="font-medium">Saída:</span>
              <span className="truncate flex-1 min-w-0" title={depotSetor || ''}>
                {depotSetor || '—'}
              </span>
            </div>
            <div className="flex gap-1">
              <span className="font-medium">Destino:</span>
              <span className="truncate flex-1 min-w-0" title={selectedDestinoOptionUi ? `${selectedDestinoOptionUi.usuario || selectedDestinoOptionUi.label}${selectedDestinoOptionUi.setor ? ' — ' + selectedDestinoOptionUi.setor : ''}` : (destinoTodos ? 'Todos os destinos' : '')}>
                {destinoTodos
                  ? 'Todos os destinos'
                  : selectedDestinoOptionUi
                    ? `${selectedDestinoOptionUi.usuario || selectedDestinoOptionUi.label}${selectedDestinoOptionUi.setor ? ' — ' + selectedDestinoOptionUi.setor : ''}`
                    : '—'}
              </span>
            </div>
          </div>
        </div>

        <MapContainer key={`mapa-rota-${centerUse[0]}-${centerUse[1]}-${zoomUse}`} center={centerUse} zoom={zoomUse} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
          <MapUpdater center={centerUse} zoom={zoomUse} />
          <FitBoundsOnTrigger trigger={fitBoundsTick} bounds={boundsAll} />
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Overlays: legenda */}
          {showLegend && (
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-md shadow p-2 text-xs space-y-1 z-[1000]">
              <div className="font-medium text-gray-700">Legenda</div>
              <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded bg-green-600"></span><span>Origem</span></div>
              <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded bg-red-600"></span><span>Destino</span></div>
              <div className="flex items-center gap-2"><span className="inline-block w-6 h-0.5 bg-blue-600"></span><span>Rotas</span></div>
            </div>
          )}

          {/* Marcador da saída */}
          {depotCoord && (
            <Marker position={[depotCoord.lat, depotCoord.lng]} icon={inicioIcon}>
              <Popup>
                <div className="text-sm">
                  <strong>Saída</strong>
                  <div>{depotSetor || 'Selecionado no mapa'}</div>
                  <div className="mt-2">
                    <Button size="sm" variant="outline" onClick={() => { setDepotCoord(null); setRouteOrder([]); setRouteDistanceKm(0); setClickMode('depot'); }}>Remover saída</Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Origens das encomendas (visual, sem rota) */}
          {origensEncomendas.map((o, idx) => (
            <Marker position={[o.lat, o.lng]} icon={origemIcon} key={`orig-${idx}`}>
              <Popup>
                <div className="text-sm space-y-2">
                  <div className="font-medium">Origem de encomenda</div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => calcularRota()} disabled={!depotCoord}>
                      Calcular melhor rota (todos destinos)
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Destinos das encomendas (visual). Fluxo de dois pontos disponível */}
          {destinosEncomendas.map((d, idx) => (
            <Marker position={[d.lat, d.lng]} icon={destinoIcon} key={`dest-encom-${idx}`}
              eventHandlers={{ click: () => setSelectedDestino(d) }}>
              <Popup>
                <div className="text-sm space-y-2">
                  <div className="font-medium">Destino de encomenda</div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => calcularRotaComDestinoUnico(d)} disabled={!depotCoord}>
                      Calcular rota com este destino
                    </Button>
                  </div>
                  {!depotCoord && (
                    <div className="text-xs text-muted-foreground">Selecione uma origem primeiro</div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

  {/* Destinos escolhidos manualmente (além dos de encomendas) */}
  {destinos.map((d, idx) => (
    <Marker position={[d.lat, d.lng]} icon={destinoIcon} key={`dest-rota-${idx}`}>
      <Popup>
        <div className="text-sm">
          Destino #{idx + 1}
          <div className="mt-2">
            <Button size="sm" variant="outline" onClick={() => {
              setDestinos((prev) => prev.filter((_, i) => i !== idx));
              setRouteOrder([]);
              setRouteDistanceKm(0);
              setRouteDurationMin(0);
              setStopsInfo([]);
            }}>Remover</Button>
          </div>
        </div>
      </Popup>
      {(() => {
        const key = `${d.lat.toFixed(6)},${d.lng.toFixed(6)}`;
        const info = stopsInfo.find((s) => `${s.coord.lat.toFixed(6)},${s.coord.lng.toFixed(6)}` === key);
        if (!info) return null;
        const mins = Math.round(info.min);
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        const tempoFmt = h > 0 ? `${h}h ${m}min` : `${m}min`;
        const distFmt = `${info.km.toFixed(1)} km`;
        return (
          <Tooltip permanent direction="right" offset={[12, 0]} opacity={0.95}>
            <div className="text-[11px] space-y-1">
              <div className="font-medium">Parada #{info.ordem}</div>
              <div>Tempo acumulado: {tempoFmt}</div>
              <div>Distância acumulada: {distFmt}</div>
            </div>
          </Tooltip>
        );
      })()}
    </Marker>
  ))}

  {/* Rota só após cálculo */}
  {showRoute && polylinePositions.length > 0 && (
    <Polyline positions={polylinePositions} color="#1e3a8a" weight={5} opacity={0.85} />
  )}
        </MapContainer>
      </div>
      <div className="mt-2 text-xs text-blue-700 text-center">
        💡 Marcadores verdes = Origem | Marcadores vermelhos = Destino | Linhas azuis = Rotas calculadas
      </div>
    </div>
  );
};

export default React.memo(MapaRotaOtimaEncomendas);
