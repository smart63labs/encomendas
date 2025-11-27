import React, { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useCepSearch } from '../../hooks/useCepSearch';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';

// Fix para os ícones do Leaflet no Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapaUsuarioProps {
  cep: string;
  className?: string;
  onAddressChange?: (address: any) => void;
}

// Coordenadas aproximadas das principais cidades do Tocantins
const COORDENADAS_CIDADES: { [key: string]: { lat: number; lng: number } } = {
  'palmas': { lat: -10.184, lng: -48.333 },
  'araguaína': { lat: -7.191, lng: -48.207 },
  'gurupi': { lat: -11.728, lng: -49.068 },
  'porto nacional': { lat: -10.704, lng: -48.417 },
  'paraíso do tocantins': { lat: -10.175, lng: -48.881 },
  'colinas do tocantins': { lat: -8.059, lng: -48.474 },
  'guaraí': { lat: -8.834, lng: -48.511 },
  'tocantinópolis': { lat: -6.327, lng: -47.421 },
  'araguatins': { lat: -5.648, lng: -48.123 },
  'dianópolis': { lat: -11.628, lng: -46.818 },
};

// Coordenada padrão (centro do Tocantins)
const COORDENADA_PADRAO = { lat: -10.186, lng: -48.334 };

const MapaUsuario: React.FC<MapaUsuarioProps> = React.memo(({ 
  cep, 
  className = "w-full h-[400px]",
  onAddressChange
}) => {
  const [enderecoInfo, setEnderecoInfo] = useState<any>(null);
  const [coordenadas, setCoordenadas] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { searchCep } = useCepSearch();

  // Função para obter coordenadas aproximadas baseadas na cidade
  const obterCoordenadasPorCidade = (cidade: string): { lat: number; lng: number } => {
    const cidadeNormalizada = cidade.toLowerCase().trim();
    
    // Procura por correspondência exata
    if (COORDENADAS_CIDADES[cidadeNormalizada]) {
      return COORDENADAS_CIDADES[cidadeNormalizada];
    }
    
    // Procura por correspondência parcial
    for (const [nomeCidade, coords] of Object.entries(COORDENADAS_CIDADES)) {
      if (cidadeNormalizada.includes(nomeCidade) || nomeCidade.includes(cidadeNormalizada)) {
        return coords;
      }
    }
    
    // Retorna coordenada padrão se não encontrar
    return COORDENADA_PADRAO;
  };

  // Função para buscar informações do CEP
  const buscarInformacoesCep = async () => {
    if (!cep || cep.length < 8) {
      setEnderecoInfo(null);
      setCoordenadas(null);
      setError(null);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Buscando informações para CEP:', cep);
      
      const cepData = await searchCep(cep);
      if (cepData) {
        console.log('✅ Informações encontradas:', cepData);
        setEnderecoInfo(cepData);
        onAddressChange?.(cepData);
        
        // Obter coordenadas aproximadas baseadas na cidade
        const coords = obterCoordenadasPorCidade(cepData.city || '');
        setCoordenadas(coords);
        console.log('📍 Coordenadas definidas:', coords);
      } else {
        setError('CEP não encontrado.');
        setCoordenadas(COORDENADA_PADRAO);
      }
    } catch (err) {
      console.error('❌ Erro ao buscar CEP:', err);
      setError('Erro ao buscar informações do CEP.');
      setCoordenadas(COORDENADA_PADRAO);
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar informações quando o CEP mudar
  useEffect(() => {
    buscarInformacoesCep();
  }, [cep]);

  // Se está carregando
  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg border`}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-sm text-gray-600">Carregando localização...</p>
        </div>
      </div>
    );
  }

  // Se não temos coordenadas ainda
  if (!coordenadas) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg border`}>
        <div className="text-center text-gray-500">
          <MapPin className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">Aguardando CEP...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Informações de localização - versão compacta */}
      <div className="mb-2 p-2 bg-blue-50 rounded border border-blue-200">
        <div className="flex items-center gap-1 text-blue-800 text-sm">
          <MapPin className="h-3 w-3" />
          <span className="font-medium">Localização</span>
        </div>
        
        <div className="mt-1 text-xs text-blue-700 space-y-0.5">
          {cep && (
            <div><strong>CEP:</strong> {cep}</div>
          )}
          
          {enderecoInfo && (
            <>
              <div><strong>Cidade:</strong> {enderecoInfo.city} - <strong>Estado:</strong> {enderecoInfo.state}</div>
              {enderecoInfo.street && <div><strong>Logradouro:</strong> {enderecoInfo.street}</div>}
              {enderecoInfo.neighborhood && <div><strong>Bairro:</strong> {enderecoInfo.neighborhood}</div>}
            </>
          )}
        </div>
        
        {error && (
          <div className="mt-1 flex items-center gap-1 text-amber-700 text-xs">
            <AlertCircle className="h-3 w-3" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Mapa */}
      <div className="rounded-lg border overflow-hidden">
        <MapContainer
          key={`mapa-${coordenadas.lat}-${coordenadas.lng}`}
          center={[coordenadas.lat, coordenadas.lng]}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: '300px', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Marcador da localização */}
          <Marker position={[coordenadas.lat, coordenadas.lng]}>
            <Popup>
              <div className="text-center">
                <div className="font-semibold text-blue-800 mb-1">
                  📍 Localização Aproximada
                </div>
                {cep && (
                  <div className="text-sm text-gray-600 mb-1">
                    <strong>CEP:</strong> {cep}
                  </div>
                )}
                {enderecoInfo && (
                  <div className="text-sm text-gray-600 mb-1">
                    <div>{enderecoInfo.city} - {enderecoInfo.state}</div>
                    {enderecoInfo.street && <div>{enderecoInfo.street}</div>}
                    {enderecoInfo.neighborhood && <div>{enderecoInfo.neighborhood}</div>}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  Localização baseada na cidade
                </div>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
});

MapaUsuario.displayName = 'MapaUsuario';

export default MapaUsuario;