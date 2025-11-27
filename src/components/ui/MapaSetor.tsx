import React, { useEffect, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { GeocodingService, Coordenadas } from '../../services/geocoding.service';
import { MapPin, Loader2, MousePointer, Search, X } from 'lucide-react';

// Fix para os ícones do Leaflet no Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

import { mapIcons } from '@/utils/map-icons';

// Ícone usando a nova implementação local
const selectedIcon = mapIcons.destino;

interface MapaSetorProps {
  cep?: string;
  latitude?: number;
  longitude?: number;
  className?: string;
  onCoordinatesChange?: (coordinates: Coordenadas) => void;
  allowSelection?: boolean;
  onFallbackStateChange?: (isFallback: boolean) => void; // Nova prop para notificar sobre estado de fallback
}

// Coordenadas padrão do centro do estado do Tocantins (fallback)
const COORDENADAS_TOCANTINS: Coordenadas = { lat: -10.18, lng: -48.33 };
//-10.186618444835807, -48.33366151505368 coordenadas praça dos girassois - palmas - to

// Componente para capturar cliques no mapa
const MapClickHandler: React.FC<{ 
  onCoordinatesChange?: (coordinates: Coordenadas) => void;
  allowSelection?: boolean;
  setSelectedCoordinates: (coords: Coordenadas | null) => void;
  setIsFallbackCoordinates: (isFallback: boolean) => void;
}> = ({ onCoordinatesChange, allowSelection, setSelectedCoordinates, setIsFallbackCoordinates }) => {
  useMapEvents({
    click: (e) => {
      if (allowSelection) {
        const newCoords = { lat: e.latlng.lat, lng: e.latlng.lng };
        setSelectedCoordinates(newCoords);
        setIsFallbackCoordinates(false); // Coordenadas selecionadas manualmente não são fallback
        onCoordinatesChange?.(newCoords);
      }
    }
  });
  return null;
};

// Componente para atualizar o centro e zoom do mapa automaticamente
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    // Verificar se o mapa está pronto antes de tentar atualizar
    if (map && map.getContainer()) {
      try {
        map.setView(center, zoom);
      } catch (error) {
        console.warn('Erro ao atualizar visualização do mapa:', error);
      }
    }
  }, [map, center, zoom]);
  
  return null;
};

const MapaSetor: React.FC<MapaSetorProps> = React.memo(({ 
  cep, 
  latitude, 
  longitude, 
  className = "w-full h-96",
  onCoordinatesChange,
  allowSelection = false,
  onFallbackStateChange
}) => {
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState<Coordenadas | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFallbackCoordinates, setIsFallbackCoordinates] = useState(false); // Flag para coordenadas de fallback
  
  // Estados para pesquisa de cidade
  const [searchCity, setSearchCity] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [manualSearchActive, setManualSearchActive] = useState(false); // Flag para indicar busca manual ativa

  // Função para buscar coordenadas por CEP
  const buscarCoordenadas = useCallback(async (cepValue: string) => {
    if (!cepValue) return;
    
    setIsLoading(true);
    setError(null);
    setIsFallbackCoordinates(false);
    
    try {
      console.log('🔍 Buscando coordenadas para CEP:', cepValue);
      const coords = await GeocodingService.geocodeByCep(cepValue);
      
      if (coords) {
        console.log('✅ Coordenadas encontradas:', coords);
        setCoordenadas(coords);
        setIsFallbackCoordinates(false);
      } else {
        console.warn('⚠️ Coordenadas não encontradas para o CEP');
        setError('CEP não encontrado. Por favor, selecione no mapa ou pesquise a cidade.');
        setCoordenadas(null);
        setIsFallbackCoordinates(false);
      }
    } catch (err) {
      console.error('❌ Erro ao buscar coordenadas:', err);
      setError('CEP inválido. Por favor, selecione no mapa ou pesquise a cidade.');
      setCoordenadas(null);
      setIsFallbackCoordinates(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função para buscar coordenadas por nome da cidade
  const buscarCidadePorNome = useCallback(async (nomeCidade: string) => {
    if (!nomeCidade.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      console.log('🔍 Buscando coordenadas para cidade:', nomeCidade);
      
      // Criar objeto EnderecoForm para usar com o GeocodingService
      const enderecoForm = {
        cidade: nomeCidade.trim(),
        estado: 'TO',
        cep: '',
        logradouro: '',
        numero: '',
        bairro: '',
        complemento: ''
      };
      
      const result = await GeocodingService.geocodeByAddress(enderecoForm);
      
      if (result.coordenadas) {
        console.log('✅ Coordenadas da cidade encontradas:', result.coordenadas);
        setCoordenadas(result.coordenadas);
        setSelectedCoordinates(result.coordenadas);
        setIsFallbackCoordinates(false);
        onCoordinatesChange?.(result.coordenadas);
        setShowSearchInput(false);
        setSearchCity('');
      } else {
        console.warn('⚠️ Coordenadas não encontradas para a cidade');
        setSearchError('Cidade não encontrada no Tocantins');
      }
    } catch (err) {
      console.error('❌ Erro ao buscar cidade:', err);
      setSearchError('Erro ao buscar cidade');
    } finally {
      setIsSearching(false);
    }
  }, [onCoordinatesChange]);

  // Função para lidar com a pesquisa
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchCity.trim()) {
      buscarCidadePorNome(searchCity.trim());
    }
  }, [searchCity, buscarCidadePorNome]);

  // Efeito para buscar coordenadas quando CEP mudar
  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null) {
      // Se já temos latitude e longitude válidas, usar diretamente
      setCoordenadas({ lat: latitude, lng: longitude });
      setSelectedCoordinates(null); // Limpar seleção manual ao receber coordenadas props
      setIsFallbackCoordinates(false); // Coordenadas válidas recebidas como props
    } else if (cep) {
      // Se temos CEP, buscar coordenadas
      buscarCoordenadas(cep);
    }
    // Se latitude/longitude são null mas existem como props, não definir fallback
  }, [cep, latitude, longitude, buscarCoordenadas]);

  // Efeito para notificar mudanças no estado de fallback
  useEffect(() => {
    onFallbackStateChange?.(isFallbackCoordinates);
  }, [isFallbackCoordinates, onFallbackStateChange]);



  // Se não há dados para mostrar
  if (!cep && !latitude && !longitude) {
    return (
      <div className={className}>
        {/* Mapa usando MapContainer */}
        <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-300 relative">
          {/* Campo de pesquisa de cidade - posicionado sobre o mapa */}
          <div className="absolute top-2 right-2 z-[1000]">
            {!showSearchInput ? (
              <button
                onClick={() => setShowSearchInput(true)}
                className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-2 shadow-md transition-colors"
                title="Pesquisar cidade"
              >
                <Search className="h-4 w-4 text-gray-600" />
              </button>
            ) : (
              <div className="bg-white border border-gray-300 rounded-lg shadow-md p-2 min-w-[200px]">
                <form onSubmit={handleSearch} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    placeholder="Nome da cidade..."
                    className="flex-1 text-sm border-0 outline-none bg-transparent"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isSearching || !searchCity.trim()}
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                    title="Buscar"
                  >
                    {isSearching ? (
                      <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                    ) : (
                      <Search className="h-3 w-3 text-blue-600" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSearchInput(false);
                      setSearchCity('');
                      setSearchError(null);
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Fechar"
                  >
                    <X className="h-3 w-3 text-gray-600" />
                  </button>
                </form>
                {searchError && (
                  <div className="mt-1 text-xs text-red-600">
                    {searchError}
                  </div>
                )}
              </div>
            )}
          </div>

          <MapContainer
            key={`mapa-default-${COORDENADAS_TOCANTINS.lat}-${COORDENADAS_TOCANTINS.lng}`}
            center={[COORDENADAS_TOCANTINS.lat, COORDENADAS_TOCANTINS.lng]}
            zoom={8}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </MapContainer>
        </div>
      </div>
    );
  }

  // Se está carregando
  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-50 rounded-lg border`}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-sm text-gray-600">Carregando dados ...</p>
        </div>
      </div>
    );
  }

  // Se não temos coordenadas ainda ou estamos carregando
  if (!coordenadas || isLoading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg border`}>
        <div className="text-center text-gray-500">
          <MapPin className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">
            {isLoading ? 'Carregando dados ...' : 'Aguardando localização...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Informações de localização */}
      <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 text-blue-800">
          <MapPin className="h-4 w-4" />
          <span className="font-medium">Localização</span>
          {allowSelection && (
            <div className="flex items-center gap-1 ml-auto text-xs text-blue-600">
              <MousePointer className="h-3 w-3" />
              <span>Clique no mapa para selecionar</span>
            </div>
          )}
        </div>
        
        {cep && (
          <div className="mt-1 text-sm text-blue-700">
            <strong>CEP:</strong> {cep}
          </div>
        )}
        
        <div className="mt-1 text-sm text-green-600">
          <strong>Coordenadas:</strong> {(selectedCoordinates || coordenadas)?.lat?.toFixed(6) || '0.000000'}, {(selectedCoordinates || coordenadas)?.lng?.toFixed(6) || '0.000000'}
        </div>
        
        {selectedCoordinates && (
          <div className="mt-1 text-xs text-red-600">
            🎯 Posição selecionada manualmente
          </div>
        )}
        
        {error && (
          <div className="mt-1 text-xs text-amber-600">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Mapa usando MapContainer */}
      <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-300 relative">
        {/* Campo de pesquisa de cidade - posicionado sobre o mapa */}
        <div className="absolute top-2 right-2 z-[1000]">
          {!showSearchInput ? (
            <button
              onClick={() => setShowSearchInput(true)}
              className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-2 shadow-md transition-colors"
              title="Pesquisar cidade"
            >
              <Search className="h-4 w-4 text-gray-600" />
            </button>
          ) : (
            <div className="bg-white border border-gray-300 rounded-lg shadow-md p-2 min-w-[200px]">
              <form onSubmit={handleSearch} className="flex items-center gap-1">
                <input
                  type="text"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  placeholder="Nome da cidade..."
                  className="flex-1 text-sm border-0 outline-none bg-transparent"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isSearching || !searchCity.trim()}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                  title="Buscar"
                >
                  {isSearching ? (
                    <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                  ) : (
                    <Search className="h-3 w-3 text-blue-600" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSearchInput(false);
                    setSearchCity('');
                    setSearchError(null);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Fechar"
                >
                  <X className="h-3 w-3 text-gray-600" />
                </button>
              </form>
              {searchError && (
                <div className="mt-1 text-xs text-red-600">
                  {searchError}
                </div>
              )}
            </div>
          )}
        </div>

        {coordenadas && coordenadas.lat && coordenadas.lng && (
          <MapContainer
            key={`mapa-${coordenadas.lat}-${coordenadas.lng}`}
            center={[coordenadas.lat, coordenadas.lng]}
            zoom={15}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            whenReady={() => {
              console.log('Mapa pronto - coordenadas:', coordenadas);
            }}
          >
            <MapUpdater 
              center={[coordenadas.lat, coordenadas.lng]} 
              zoom={15} 
            />
            <MapClickHandler 
              onCoordinatesChange={onCoordinatesChange}
              allowSelection={allowSelection}
              setSelectedCoordinates={setSelectedCoordinates}
              setIsFallbackCoordinates={setIsFallbackCoordinates}
            />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Marcador original (CEP/coordenadas iniciais) */}
            <Marker 
              position={[coordenadas.lat, coordenadas.lng]}
              eventHandlers={{
                add: () => console.log('Marcador adicionado ao mapa')
              }}
            >
              <Popup>
                <div className="text-center">
                  <div className="font-semibold text-blue-800 mb-1">
                    📍 Localização {selectedCoordinates ? 'Original' : 'do Setor'}
                  </div>
                {cep && (
                  <div className="text-sm text-gray-600 mb-1">
                    <strong>CEP:</strong> {cep}
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  Lat: {coordenadas?.lat?.toFixed(6) || '0.000000'}<br />
                  Lng: {coordenadas?.lng?.toFixed(6) || '0.000000'}
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Marcador da posição selecionada pelo usuário */}
          {selectedCoordinates && (
            <Marker position={[selectedCoordinates.lat, selectedCoordinates.lng]} icon={selectedIcon}>
              <Popup>
                <div className="text-center">
                  <div className="font-semibold text-red-800 mb-1">
                    🎯 Posição Selecionada
                  </div>
                  <div className="text-xs text-gray-500">
                    Lat: {selectedCoordinates.lat.toFixed(6)}<br />
                    Lng: {selectedCoordinates.lng.toFixed(6)}
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    Esta será salva no banco de dados
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
          </MapContainer>
        )}
      </div>
    </div>
  );
});

export default MapaSetor;