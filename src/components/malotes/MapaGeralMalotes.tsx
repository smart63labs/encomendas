import React, { useEffect, useMemo, useState, useCallback } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { COORDENADAS_TOCANTINS, ZOOM_TOCANTINS } from '@/constants/mapConstants';
import { api } from '@/lib/api';
import { getApiBaseUrl } from '@/utils/api-url';
import { GeocodingService } from '@/services/geocoding.service';

type AnySetor = Record<string, any>;

interface MapaGeralMalotesProps {
  isVisible?: boolean;
  refreshTrigger?: number;
}

interface GrupoMalotesPorSetor {
  setorId: number;
  setorNome: string;
  latitude?: number;
  longitude?: number;
  malotes: any[];
}

interface RouteData {
  coordinates: [number, number][];
  distance: number;
  duration: number;
}

// Removido: listagem paginada antiga. Agora o mapa usa somente dados agregados de /malotes/mapa.

const carregarSetores = async (): Promise<AnySetor[]> => {
  try {
    const apiBase = getApiBaseUrl().replace(/\/$/, '');
    const response = await fetch(`${apiBase}/setores?limit=1000`);
    if (!response.ok) throw new Error('Erro ao buscar setores');
    const data = await response.json();
    return (data.data || data || []) as AnySetor[];
  } catch {
    return [];
  }
};

const MapFitBounds: React.FC<{ pontos: L.LatLng[] }> = ({ pontos }) => {
  const map = useMap();
  useEffect(() => {
    if (pontos.length > 0) {
      const bounds = L.latLngBounds(pontos);
      map.fitBounds(bounds, { padding: [20, 20] });
    } else {
      map.setView([COORDENADAS_TOCANTINS.lat, COORDENADAS_TOCANTINS.lng], ZOOM_TOCANTINS);
    }
  }, [map, pontos]);
  return null;
};

const criarIconeContador = (cor: string, contador: number) => {
  const html = `
    <div style="
      background:${cor};
      color:#fff;
      width:36px; height:36px;
      border-radius:18px;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 0 0 2px rgba(0,0,0,0.2);
      font-weight:bold;
    ">${contador}</div>
  `;
  return L.divIcon({ html, className: 'malote-marker', iconSize: [36, 36], iconAnchor: [18, 18] });
};

const criarIconeStatus = (cor: string, tipo: 'transito' | 'disponivel') => {
  const iconChar = tipo === 'transito' ? '🚚' : '📦';
  const html = `
    <div style="
      background:${cor};
      color:#fff;
      width:24px; height:24px;
      border-radius:12px;
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 0 0 2px rgba(255,255,255,0.8), 0 2px 4px rgba(0,0,0,0.3);
      font-size: 14px;
    ">${iconChar}</div>
  `;
  return L.divIcon({ html, className: 'malote-status-marker', iconSize: [24, 24], iconAnchor: [12, 12] });
};

const Legend = () => (
  <div className="leaflet-bottom leaflet-right" style={{ pointerEvents: 'auto' }}>
    <div className="leaflet-control bg-white p-3 rounded shadow-lg border border-gray-200 m-4">
      <h5 className="font-bold text-sm mb-2 text-gray-800">Legenda</h5>
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-[10px] shadow-sm">🚚</div>
          <span className="text-gray-700 font-medium">Malote em Trânsito</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] shadow-sm">📦</div>
          <span className="text-gray-700 font-medium">Malote Disponível</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-amber-500 border-b border-dashed border-white"></div>
          <span className="text-gray-700">Rota em Andamento</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-blue-600"></div>
          <span className="text-gray-700">Rota Planejada</span>
        </div>
      </div>
    </div>
  </div>
);

const MapaGeralMalotes: React.FC<MapaGeralMalotesProps> = ({ isVisible = true, refreshTrigger = 0 }) => {
  const [malotesMapa, setMalotesMapa] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routesByMalote, setRoutesByMalote] = useState<Record<string, RouteData>>({});
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [coordsPatchBySetor, setCoordsPatchBySetor] = useState<Record<number, { lat: number; lng: number }>>({});

  const calculateRoutes = useCallback(async () => {
    const pendentes = malotesMapa.filter((m: any) => {
      const id = String(m.maloteId || m.numeroMalote || '');
      if (!id) return false;
      
      const temOrigem = m?.origem?.latitude && m?.origem?.longitude;
      const temDestino = m?.destino?.latitude && m?.destino?.longitude;
      
      // Só calcular se tiver origem e destino e ainda não tiver rota
      return temOrigem && temDestino && !routesByMalote[id];
    });

    if (pendentes.length === 0) return;

    setIsLoadingRoutes(true);
    try {
      const apiBase = getApiBaseUrl().replace(/\/$/, '');
      const resultados = await Promise.all(
        pendentes.map(async (m: any) => {
          const id = String(m.maloteId || m.numeroMalote || '');
          const coords: [number, number][] = [
            [Number(m.origem.longitude), Number(m.origem.latitude)],
            [Number(m.destino.longitude), Number(m.destino.latitude)]
          ];

          const body = { profile: 'driving-car', coordinates: coords, radiuses: [5000, 5000] } as const;
          const url = `${apiBase}/routing/directions`;

          try {
            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            });

            if (!response.ok) return null;

            const json = await response.json();
            if (json?.success && json?.data) {
              const d = json.data;
              const route: RouteData = {
                coordinates: (d.coordinates || []) as [number, number][],
                distance: typeof d.distance === 'string' ? parseFloat(d.distance) * 1000 : Number(d.distance) * 1000,
                duration: Number(d.duration) * 60,
              };
              return { id, data: route };
            }
            return null;
          } catch (e) {
            console.error('Falha ao obter rota malote', id, e);
            return null;
          }
        })
      );

      const next = { ...routesByMalote };
      let changed = false;
      for (const r of resultados) {
        if (r) {
          next[r.id] = r.data;
          changed = true;
        }
      }
      
      if (changed) {
        setRoutesByMalote(next);
      }
    } catch (err) {
      console.error('Erro ao calcular rotas em lote:', err);
    } finally {
      setIsLoadingRoutes(false);
    }
  }, [malotesMapa, routesByMalote]);

  useEffect(() => {
    if (malotesMapa.length > 0) {
      calculateRoutes();
    }
  }, [malotesMapa, calculateRoutes]);

  useEffect(() => {
    const carregar = async () => {
      setLoading(true);
      setError(null);
      try {
        const mapaResp = await api.mapMalotes();
        const mapaData = mapaResp?.data?.data || mapaResp?.data || [];
        const arr = Array.isArray(mapaData) ? mapaData : [];
        setMalotesMapa(arr);
        try {
          const porSetor: Record<number, { nome: string }> = {};
          for (const it of arr) {
            const sid = Number(it?.destino?.setorId);
            const lat = Number(it?.destino?.latitude);
            const lng = Number(it?.destino?.longitude);
            const nome = String(it?.destino?.nome || '').trim();
            if (!sid || porSetor[sid]) continue;
            const inval = !lat || !lng || Number.isNaN(lat) || Number.isNaN(lng) || Math.abs(lat) < 0.0001 || Math.abs(lng) < 0.0001;
            if (inval && nome) porSetor[sid] = { nome };
          }
          const patches: Record<number, { lat: number; lng: number }> = {};
          await Promise.all(Object.entries(porSetor).map(async ([sidStr, info]) => {
            const sid = Number(sidStr);
            try {
              const r = await GeocodingService.geocodificar(`${info.nome}, Tocantins, Brasil`);
              if (r) patches[sid] = { lat: r.lat, lng: r.lng };
            } catch {}
          }));
          if (Object.keys(patches).length) setCoordsPatchBySetor(patches);
        } catch {}
      } catch (e) {
        setError('Erro ao carregar dados do mapa');
      } finally {
        setLoading(false);
      }
    };

    if (isVisible) carregar();
  }, [isVisible, refreshTrigger]);

  const pontos = useMemo(() => {
    const pts: L.LatLng[] = [];
    (malotesMapa || []).forEach((m: any) => {
      const oLat = m?.origem?.latitude; const oLng = m?.origem?.longitude;
      const dLat = m?.destino?.latitude; const dLng = m?.destino?.longitude;
      const aLat = m?.atual?.latitude; const aLng = m?.atual?.longitude;
      if (oLat && oLng) pts.push(L.latLng(oLat, oLng));
      if (dLat && dLng) pts.push(L.latLng(dLat, dLng));
      if (aLat && aLng) pts.push(L.latLng(aLat, aLng));
    });
    return pts;
  }, [malotesMapa]);

  return (
    <div className="w-full h-[600px]">
      {loading && (
        <div className="text-sm p-2">Carregando dados de malotes no mapa...</div>
      )}
      {error && (
        <div className="text-sm p-2 text-red-600">{error}</div>
      )}
      <MapContainer
        center={[COORDENADAS_TOCANTINS.lat, COORDENADAS_TOCANTINS.lng]}
        zoom={ZOOM_TOCANTINS}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapFitBounds pontos={pontos} />

        {(() => {
          const itens = (malotesMapa || []).map((m: any) => {
            const origemOk = m?.origem?.latitude && m?.origem?.longitude;
            const destinoOk = m?.destino?.latitude && m?.destino?.longitude;
            const atualOk = m?.atual?.latitude && m?.atual?.longitude;
            const emTransito = !!(m?.status?.emTransito);
            const corLinha = emTransito ? '#f59e0b' : '#2563eb';
            const dashArray = emTransito ? '6 6' : undefined;

            const origemPos: [number, number] | null = origemOk ? [Number(m.origem.latitude), Number(m.origem.longitude)] : null;
            let destinoPos: [number, number] | null = destinoOk ? [Number(m.destino.latitude), Number(m.destino.longitude)] : null;
            const sid = Number(m?.destino?.setorId);
            if ((!destinoPos || Math.abs(destinoPos[0]) < 0.0001 || Math.abs(destinoPos[1]) < 0.0001) && sid && coordsPatchBySetor[sid]) {
              destinoPos = [coordsPatchBySetor[sid].lat, coordsPatchBySetor[sid].lng];
            }
            const atualPos: [number, number] | null = atualOk ? [Number(m.atual.latitude), Number(m.atual.longitude)] : null;

            const id = String(m.maloteId || m.numeroMalote || '');
            const rota = routesByMalote[id];

            let markerPos: [number, number] | null = null;
            if (atualPos) {
              markerPos = atualPos;
            } else if (emTransito && origemPos) {
              markerPos = origemPos;
            } else if (!emTransito && destinoPos) {
              markerPos = destinoPos;
            } else {
              markerPos = origemPos || destinoPos;
            }

            return { m, id, emTransito, corLinha, dashArray, origemPos, destinoPos, atualPos, rota, markerPos };
          });

          const grupos: Record<string, typeof itens> = {} as any;
          itens.forEach((it) => {
            const p = it.markerPos;
            if (!p) return;
            const key = `${p[0].toFixed(6)},${p[1].toFixed(6)}`;
            if (!grupos[key]) grupos[key] = [] as any;
            grupos[key].push(it);
          });

          const radius = 0.01;
          const rendered: React.ReactNode[] = [];

          Object.values(grupos).forEach((grupo) => {
            if (grupo.length === 1) {
              const it = grupo[0];
              rendered.push(
                <React.Fragment key={`malote-${it.id}`}>
                  {it.origemPos && it.destinoPos && (
                    it.rota ? (
                      <Polyline 
                        positions={it.rota.coordinates.map(([lng, lat]) => [lat, lng])} 
                        pathOptions={{ color: it.corLinha, weight: 4, opacity: 0.85, dashArray: it.dashArray }} 
                      >
                        <Popup>
                          <div className="p-2">
                            <h4 className="font-semibold text-blue-800">🛣️ Rota de Malote</h4>
                            <p className="text-sm"><strong>Distância:</strong> {(it.rota.distance / 1000).toFixed(1)} km</p>
                            <p className="text-sm"><strong>Tempo:</strong> {Math.round(it.rota.duration / 60)} min</p>
                          </div>
                        </Popup>
                      </Polyline>
                    ) : (
                      <Polyline positions={[it.origemPos, it.destinoPos]} pathOptions={{ color: it.corLinha, weight: 3, opacity: 0.8, dashArray: it.dashArray }} />
                    )
                  )}
                  {it.markerPos && (
                    <Marker 
                      position={it.markerPos} 
                      icon={criarIconeStatus(it.emTransito ? '#f59e0b' : '#0ea5e9', it.emTransito ? 'transito' : 'disponivel')}
                      zIndexOffset={it.emTransito ? 1000 : 0}
                    >
                      <Popup>
                        <div className="space-y-1">
                          <div className="font-semibold">Malote {String(it.m.numeroMalote || it.m.maloteId || '')}</div>
                          <div className="text-xs">
                            {String(it.m?.destino?.nome || '')}
                          </div>
                       </div>
                      </Popup>
                    </Marker>
                  )}
                </React.Fragment>
              );
            } else {
              const center = grupo[0].markerPos as [number, number];
              grupo.forEach((it, idx) => {
                const frac = (idx + 1) / (grupo.length + 1);
                let pos: [number, number] = [center[0], center[1]];
                if (it.emTransito && (it.rota || (it.origemPos && it.destinoPos))) {
                  if (it.rota && Array.isArray(it.rota.coordinates) && it.rota.coordinates.length >= 2) {
                    const coords = it.rota.coordinates.map(([lng, lat]) => [lat, lng]);
                    let total = 0;
                    for (let i = 1; i < coords.length; i++) {
                      const a = coords[i - 1];
                      const b = coords[i];
                      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
                      total += d;
                    }
                    let target = total * frac;
                    let acc = 0;
                    for (let i = 1; i < coords.length; i++) {
                      const a = coords[i - 1];
                      const b = coords[i];
                      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
                      if (acc + d >= target) {
                        const t = (target - acc) / d;
                        pos = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
                        break;
                      }
                      acc += d;
                    }
                  } else if (it.origemPos && it.destinoPos) {
                    pos = [
                      it.origemPos[0] + frac * (it.destinoPos[0] - it.origemPos[0]),
                      it.origemPos[1] + frac * (it.destinoPos[1] - it.origemPos[1])
                    ];
                  }
                } else {
                  const angle = (2 * Math.PI * idx) / grupo.length;
                  pos = [center[0] + radius * Math.cos(angle), center[1] + radius * Math.sin(angle)];
                }
                rendered.push(
                  <React.Fragment key={`malote-${it.id}`}>
                    {it.origemPos && it.destinoPos && (
                      it.rota ? (
                        <Polyline 
                          positions={it.rota.coordinates.map(([lng, lat]) => [lat, lng])} 
                          pathOptions={{ color: it.corLinha, weight: 4, opacity: 0.85, dashArray: it.dashArray }} 
                        >
                          <Popup>
                            <div className="p-2">
                              <h4 className="font-semibold text-blue-800">🛣️ Rota de Malote</h4>
                              <p className="text-sm"><strong>Distância:</strong> {(it.rota.distance / 1000).toFixed(1)} km</p>
                              <p className="text-sm"><strong>Tempo:</strong> {Math.round(it.rota.duration / 60)} min</p>
                            </div>
                          </Popup>
                        </Polyline>
                      ) : (
                        <Polyline positions={[it.origemPos, it.destinoPos]} pathOptions={{ color: it.corLinha, weight: 3, opacity: 0.8, dashArray: it.dashArray }} />
                      )
                    )}
                    <Marker 
                      position={pos} 
                      icon={criarIconeStatus(it.emTransito ? '#f59e0b' : '#0ea5e9', it.emTransito ? 'transito' : 'disponivel')}
                      zIndexOffset={it.emTransito ? 1000 : 0}
                    >
                      <Popup>
                        <div className="space-y-2">
                          <div className="font-semibold">Malote {String(it.m.numeroMalote || it.m.maloteId || '')}</div>
                          <div className="text-xs">
                            {String(it.m?.destino?.nome || '')}
                          </div>
                          <div className="pt-2 border-t">
                            <div className="text-xs font-medium">Malotes deste Local</div>
                            <div className="mt-1 space-y-1">
                              {grupo.map((g) => (
                                <div key={`grp-${g.id}`} className="flex items-center gap-2 text-xs">
                                  <span>{g.emTransito ? '🚚' : '📦'}</span>
                                  <span>Malote {String(g.m.numeroMalote || g.m.maloteId || '')}</span>
                                  <span className="ml-auto">{g.emTransito ? 'Em trânsito' : 'Disponível'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                );
              });
            }
          });

          return rendered;
        })()}

        <Legend />
      </MapContainer>
    </div>
  );
};

export default MapaGeralMalotes;
