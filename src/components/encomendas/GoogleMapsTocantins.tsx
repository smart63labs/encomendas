import React, { useEffect, useRef, useState } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface PontoMapa {
  cep: string;
  nome: string;
  tipo: 'origem' | 'destino';
}

interface GoogleMapsTocantinsProps {
  pontoOrigem?: PontoMapa;
  pontoDestino?: PontoMapa;
  apiKey: string;
}

interface MapProps {
  center: google.maps.LatLngLiteral;
  zoom: number;
  pontoOrigem?: PontoMapa;
  pontoDestino?: PontoMapa;
}

// Componente do mapa
const Map: React.FC<MapProps> = ({ center, zoom, pontoOrigem, pontoDestino }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map>();
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder>();
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();

  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new window.google.maps.Map(ref.current, {
        center,
        zoom,
        mapTypeId: 'roadmap',
        restriction: {
          latLngBounds: {
            north: -2.0,
            south: -13.0,
            west: -51.0,
            east: -45.0,
          },
          strictBounds: false,
        },
      });
      
      const newGeocoder = new google.maps.Geocoder();
      const newDirectionsService = new google.maps.DirectionsService();
      const newDirectionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#2563eb',
          strokeWeight: 3,
        },
      });
      
      newDirectionsRenderer.setMap(newMap);
      
      setMap(newMap);
      setGeocoder(newGeocoder);
      setDirectionsService(newDirectionsService);
      setDirectionsRenderer(newDirectionsRenderer);
    }
  }, [ref, map, center, zoom]);

  // Função para geocodificar CEP
  const geocodeCEP = async (cep: string): Promise<google.maps.LatLngLiteral | null> => {
    if (!geocoder) return null;
    
    return new Promise((resolve) => {
      geocoder.geocode(
        { address: `${cep}, Tocantins, Brasil` },
        (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location;
            resolve({
              lat: location.lat(),
              lng: location.lng(),
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  };

  // Criar marcador
  const createMarker = (
    position: google.maps.LatLngLiteral,
    title: string,
    tipo: 'origem' | 'destino'
  ) => {
    if (!map) return null;

    const marker = new google.maps.Marker({
      position,
      map,
      title,
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="${tipo === 'origem' ? '#10b981' : '#ef4444'}" stroke="white" stroke-width="2"/>
            <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">
              ${tipo === 'origem' ? 'O' : 'D'}
            </text>
          </svg>
        `)}`,
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 16),
      },
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 4px 0; color: #1f2937;">${title}</h3>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            ${tipo === 'origem' ? 'Ponto de Origem' : 'Ponto de Destino'}
          </p>
        </div>
      `,
    });

    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });

    return marker;
  };

  // Atualizar marcadores quando os pontos mudarem
  useEffect(() => {
    if (!map || !geocoder) return;

    // Limpar marcadores existentes
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);

    const processarPontos = async () => {
      const novosMarkers: google.maps.Marker[] = [];
      const positions: google.maps.LatLngLiteral[] = [];

      // Processar ponto de origem
      if (pontoOrigem?.cep) {
        const position = await geocodeCEP(pontoOrigem.cep);
        if (position) {
          const marker = createMarker(position, pontoOrigem.nome, 'origem');
          if (marker) {
            novosMarkers.push(marker);
            positions.push(position);
          }
        }
      }

      // Processar ponto de destino
      if (pontoDestino?.cep) {
        const position = await geocodeCEP(pontoDestino.cep);
        if (position) {
          const marker = createMarker(position, pontoDestino.nome, 'destino');
          if (marker) {
            novosMarkers.push(marker);
            positions.push(position);
          }
        }
      }

      setMarkers(novosMarkers);

      // Criar rota se temos origem e destino
      if (positions.length === 2 && directionsService && directionsRenderer) {
        directionsService.route(
          {
            origin: positions[0],
            destination: positions[1],
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === 'OK' && result) {
              directionsRenderer.setDirections(result);
            }
          }
        );
      }

      // Ajustar zoom para mostrar todos os pontos
      if (positions.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        positions.forEach(pos => bounds.extend(pos));
        map.fitBounds(bounds);
        
        // Garantir zoom mínimo
        const listener = google.maps.event.addListener(map, 'bounds_changed', () => {
          if (map.getZoom() && map.getZoom()! > 10) {
            map.setZoom(10);
          }
          google.maps.event.removeListener(listener);
        });
      }
    };

    processarPontos();
  }, [map, geocoder, pontoOrigem, pontoDestino, directionsService, directionsRenderer]);

  return <div ref={ref} style={{ width: '100%', height: '600px' }} />;
};

// Componente de loading
const MapLoading: React.FC = () => (
  <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
      <p className="text-sm text-gray-600">Carregando dados ...</p>
    </div>
  </div>
);

// Componente de erro
const MapError: React.FC<{ status: Status }> = ({ status }) => (
  <div className="flex items-center justify-center h-[600px] bg-red-50 rounded-lg border border-red-200">
    <div className="text-center">
      <div className="text-red-600 mb-2">❌</div>
      <p className="text-sm text-red-600 font-medium">Erro ao carregar o mapa</p>
      <p className="text-xs text-red-500 mt-1">Status: {status}</p>
    </div>
  </div>
);

// Componente principal
const GoogleMapsTocantins: React.FC<GoogleMapsTocantinsProps> = ({
  pontoOrigem,
  pontoDestino,
  apiKey,
}) => {
  const render = (status: Status) => {
    switch (status) {
      case Status.LOADING:
        return <MapLoading />;
      case Status.FAILURE:
        return <MapError status={status} />;
      case Status.SUCCESS:
        return (
          <Map
            center={{ lat: -10.25, lng: -48.25 }} // Centro do Tocantins
            zoom={7}
            pontoOrigem={pontoOrigem}
            pontoDestino={pontoDestino}
          />
        );
      default:
        return <MapLoading />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          🗺️ Mapa de Localização - Tocantins
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Wrapper apiKey={apiKey} render={render} />
        
        {/* Legenda */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs">Origem</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs">Destino</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-3 h-1 bg-blue-600"></div>
            <span className="text-xs">Rota</span>
          </Badge>
        </div>
        
        {/* Informações dos pontos */}
        {(pontoOrigem || pontoDestino) && (
          <div className="space-y-2 text-sm">
            {pontoOrigem && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="font-medium">Origem:</span>
                <span>{pontoOrigem.nome} - CEP: {pontoOrigem.cep}</span>
              </div>
            )}
            {pontoDestino && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="font-medium">Destino:</span>
                <span>{pontoDestino.nome} - CEP: {pontoDestino.cep}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleMapsTocantins;
export type { PontoMapa };