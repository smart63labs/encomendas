import React, { useState, useEffect, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  Info
} from 'lucide-react';
import { api } from '@/lib/api';
import { normalizeText } from '@/lib/utils';
import { obterEnderecoSetorSync, precarregarEnderecosParaNomes } from '@/services/setores.service';
import { useNotification } from '@/hooks/use-notification';
import NotificationModal from '@/components/ui/notification-modal';
import { GeocodingService, Coordenadas } from '@/services/geocoding.service';
import type { Encomenda } from '@/types/encomenda.types';
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
import { getApiBaseUrl } from '@/utils/api-url';

// Fix para os ícones do Leaflet no Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

import { mapIcons, getIconByStatus } from '@/utils/map-icons';

// Ícones usando a nova implementação local
const statusIcons = {
  pendente: mapIcons.pendente,
  preparando: mapIcons.preparando,
  transito: mapIcons.transito,
  entregue: mapIcons.entregue,
  devolvido: mapIcons.devolvido,
  default: mapIcons.default
};

// Coordenadas do centro do Tocantins
const COORDENADAS_TOCANTINS: Coordenadas = { lat: -10.25, lng: -48.25 };
const ZOOM_TOCANTINS = 8;

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

// Removido cache local e funções duplicadas; usando serviço compartilhado

interface EncomendaComCoordenadas extends Encomenda {
  coordOrigem?: Coordenadas;
  coordDestino?: Coordenadas;
  enderecoCompleto?: string;
}

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

interface MapaRastreamentoProps {
  isOpen: boolean;
  onClose: () => void;
  codigoInicial?: string;
}

// Componente para controlar o mapa
const MapController: React.FC<{ encomendas: EncomendaComCoordenadas[] }> = ({ encomendas }) => {
  const map = useMap();

  useEffect(() => {
    try {
      if (encomendas.length > 0) {
        const coordenadas: Coordenadas[] = [];
        encomendas.forEach(e => {
          if (e.coordOrigem) coordenadas.push(e.coordOrigem);
          if (e.coordDestino) coordenadas.push(e.coordDestino);
        });

        if (coordenadas.length > 0) {
          const bounds = L.latLngBounds(coordenadas.map(c => [c.lat, c.lng]));
          if ((map as any)?._mapPane) {
            map.fitBounds(bounds, { padding: [20, 20] });
          }
        }
      } else {
        if ((map as any)?._mapPane) {
          map.setView([COORDENADAS_TOCANTINS.lat, COORDENADAS_TOCANTINS.lng], ZOOM_TOCANTINS);
        }
      }
    } catch {}
  }, [map, encomendas]);

  return null;
};

const MapaRastreamento: React.FC<MapaRastreamentoProps> = ({ 
  isOpen, 
  onClose, 
  codigoInicial = '' 
}) => {
  const { notification, isOpen: isNotificationOpen, showError, showSuccess, showInfo, showWarning, hideNotification } = useNotification();
  const [filtros, setFiltros] = useState<FiltrosRastreamento>({
    numeroEncomenda: codigoInicial,
    remetente: '',
    destinatario: '',
    setorOrigem: 'todos',
    setorDestino: 'todos',
    status: 'todos',
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

  const [encomendas, setEncomendas] = useState<EncomendaComCoordenadas[]>([]);
  const [encomendasFiltradas, setEncomendasFiltradas] = useState<EncomendaComCoordenadas[]>([]);
  const [loading, setLoading] = useState(false);
  const [setores, setSetores] = useState<any[]>([]);
  const [encomendaSelecionada, setEncomendaSelecionada] = useState<EncomendaComCoordenadas | null>(null);
  const [showDetalhes, setShowDetalhes] = useState(false);
  // Tick para forçar re-render quando endereços de setores forem carregados
  const [enderecosTick, setEnderecosTick] = useState(0);
  // Removido: não aplicamos filtros automaticamente ao abrir

  // Carregar apenas setores ao abrir (para popular opções dos filtros)
  useEffect(() => {
    if (isOpen) {
      carregarSetores();
    }
  }, [isOpen]);

  // Atualizar filtros e buscar automaticamente quando abrir com código inicial
  useEffect(() => {
    if (isOpen && codigoInicial) {
      const f: FiltrosRastreamento = {
        numeroEncomenda: codigoInicial,
        remetente: '',
        destinatario: '',
        setorOrigem: 'todos',
        setorDestino: 'todos',
        status: 'todos',
        dataInicio: '',
        dataFim: ''
      };
      setFiltros(f);
      buscar(f);
    }
  }, [isOpen, codigoInicial]);

  // Removido: não aplicar filtros automaticamente ao abrir

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

  // Pré-carregar endereços dos setores visíveis na lista/grid
  const preCarregarEnderecosVisiveis = useCallback(async () => {
    try {
      const nomes = new Set<string>();
      encomendasFiltradas.slice(0, 40).forEach(e => {
        if (e.setorOrigem) nomes.add(e.setorOrigem);
        if (e.setorDestino) nomes.add(e.setorDestino);
      });
      await precarregarEnderecosParaNomes(Array.from(nomes));
      setEnderecosTick(t => t + 1);
    } catch (err) {
      console.warn('Falha ao pré-carregar endereços dos setores visíveis:', err);
    }
  }, [encomendasFiltradas]);

  useEffect(() => {
    if (isOpen && encomendasFiltradas.length > 0) {
      preCarregarEnderecosVisiveis();
    }
  }, [isOpen, encomendasFiltradas, preCarregarEnderecosVisiveis]);

  // Quando uma encomenda é selecionada, garantir que os endereços dos setores estejam disponíveis
  useEffect(() => {
    if (encomendaSelecionada) {
      const nomes = [encomendaSelecionada.setorOrigem, encomendaSelecionada.setorDestino].filter(Boolean) as string[];
      if (nomes.length) {
        precarregarEnderecosParaNomes(nomes)
          .then(() => setEnderecosTick(t => t + 1))
          .catch(() => void 0);
      }
    }
  }, [encomendaSelecionada]);

  // Função para extrair observações da descrição estruturada
  const extrairObservacoesDaDescricao = (descricao: string): string => {
    if (!descricao) return '';
    
    console.log('DEBUG - Descrição recebida:', descricao);
    
    // Procurar por "Observações:" na descrição (usando flag 's' para multi-linha)
    const match = descricao.match(/Observações:\s*(.+?)(?:\n|$)/is);
    console.log('DEBUG - Match encontrado:', match);
    
    if (match && match[1]) {
      const resultado = match[1].trim();
      console.log('DEBUG - Observações extraídas:', resultado);
      return resultado;
    }
    
    // Tentar uma abordagem alternativa: dividir por linhas e procurar
    const linhas = descricao.split('\n');
    for (const linha of linhas) {
      if (linha.toLowerCase().includes('observações:')) {
        const partes = linha.split(':');
        if (partes.length > 1) {
          const resultado = partes.slice(1).join(':').trim();
          console.log('DEBUG - Observações extraídas (método alternativo):', resultado);
          return resultado;
        }
      }
    }
    
    console.log('DEBUG - Nenhuma observação encontrada');
    return '';
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Carregar encomendas e setores em paralelo
      const [encomendasResponse, setoresResponse] = await Promise.all([
        api.getEncomendas(),
        api.getSetores()
      ]);

      if (encomendasResponse.data.success) {
        const encomendasData = encomendasResponse.data.data.data.map((e: any) => {
          console.log('DEBUG - Processando encomenda:', e.numeroEncomenda, 'Descrição:', e.descricao, 'Observações:', e.observacoes);
          
          return {
            ...e,
            status: mapearStatus(e.status),
            // Mapear campos corretos do banco de dados
            codigo: e.numeroEncomenda || e.codigo || '',
            codigoRastreamento: e.numeroEncomenda || e.codigoRastreamento || '',
            dataEnvio: e.dataCriacao || e.dataEnvio,
            dataEntrega: e.dataEntrega || null,
            // Usar observações diretamente do backend (já separadas)
            observacoes: e.observacoes || '',
            // Mapear campos de matrícula para os nomes esperados pelo modal
            remetente_matricula: e.remetenteMatricula,
            remetente_vinculo: e.remetenteVinculo,
            destinatario_matricula: e.destinatarioMatricula,
            destinatario_vinculo: e.destinatarioVinculo
          };
        });
        setEncomendas(encomendasData);
      }

      if (setoresResponse.data.success) {
        const setoresData = setoresResponse.data.data.map((setor: any) => ({
          id: setor.ID,
          nome: setor.NOME_SETOR,
          codigo: setor.CODIGO_SETOR,
          orgao: setor.ORGAO,
          endereco: {
            logradouro: setor.LOGRADOURO,
            numero: setor.NUMERO,
            complemento: setor.COMPLEMENTO,
            bairro: setor.BAIRRO,
            cidade: setor.CIDADE,
            estado: setor.ESTADO,
            cep: setor.CEP
          },
          latitude: setor.LATITUDE,
          longitude: setor.LONGITUDE
        }));
        setSetores(setoresData);
        
        // Pré-carregar endereços dos setores via serviço centralizado
        const nomesSetores = setoresResponse.data.data
          .map((setor: any) => setor.NOME_SETOR)
          .filter((n: any) => Boolean(n));
        await precarregarEnderecosParaNomes(nomesSetores);
        setEnderecosTick(t => t + 1);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showError("Erro ao carregar dados", "Não foi possível carregar as informações necessárias.");
    } finally {
      setLoading(false);
    }
  };

  // Carregar apenas setores para popular os selects de filtro
  const carregarSetores = async () => {
    try {
      const setoresResponse = await api.getSetores();
      if (setoresResponse.data.success) {
        const setoresData = setoresResponse.data.data.map((setor: any) => ({
          id: setor.ID,
          nome: setor.NOME_SETOR,
          codigo: setor.CODIGO_SETOR,
          orgao: setor.ORGAO,
          endereco: {
            logradouro: setor.LOGRADOURO,
            numero: setor.NUMERO,
            complemento: setor.COMPLEMENTO,
            bairro: setor.BAIRRO,
            cidade: setor.CIDADE,
            estado: setor.ESTADO,
            cep: setor.CEP
          },
          latitude: setor.LATITUDE,
          longitude: setor.LONGITUDE
        }));
        setSetores(setoresData);
        // Pré-carregar endereços dos setores via serviço centralizado
        const nomesSetores = setoresResponse.data.data
          .map((setor: any) => setor.NOME_SETOR)
          .filter((n: any) => Boolean(n));
        await precarregarEnderecosParaNomes(nomesSetores);
        setEnderecosTick(t => t + 1);
      }
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
      showError("Erro ao carregar setores", "Não foi possível carregar a lista de setores.");
    }
  };

  // Ação explícita de busca: garante dados base e aplica filtros atuais
  const buscar = async (filtrosParam?: FiltrosRastreamento) => {
    try {
      // Garantir setores carregados
      if (setores.length === 0) {
        await carregarSetores();
      }

      // Garantir encomendas carregadas
      let baseEncomendas = encomendas;
      if (baseEncomendas.length === 0) {
        try {
          const encomendasResponse = await api.getEncomendas();
          if (encomendasResponse.data.success) {
            baseEncomendas = encomendasResponse.data.data.data.map((e: any) => ({
              ...e,
              status: mapearStatus(e.status),
              codigo: e.numeroEncomenda || e.codigo || '',
              codigoRastreamento: e.numeroEncomenda || e.codigoRastreamento || '',
              dataEnvio: e.dataCriacao || e.dataEnvio,
              dataEntrega: e.dataEntrega || null,
              observacoes: e.observacoes || '',
              remetente_matricula: e.remetenteMatricula,
              remetente_vinculo: e.remetenteVinculo,
              destinatario_matricula: e.destinatarioMatricula,
              destinatario_vinculo: e.destinatarioVinculo
            }));
            setEncomendas(baseEncomendas);
          }
        } catch (err) {
          console.error('Erro ao carregar encomendas:', err);
          showError("Erro ao carregar encomendas", "Não foi possível carregar as encomendas para pesquisa.");
          return;
        }
      }

      const filtrosParaUsar = filtrosParam ?? filtros;
      await aplicarFiltros(baseEncomendas, filtrosParaUsar);
    } catch (error) {
      console.error('Erro na busca:', error);
    }
  };

  // Função de debounce para otimizar as pesquisas
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };



  // Função debounced para pesquisa de remetente (usuários e setores)
  const debouncedSearchRemetente = useCallback(
    debounce(async (searchTerm: string) => {
      if (!searchTerm || searchTerm.length < 2) {
        setSugestoesRemetente([]);
        setShowSugestoesRemetente(false);
        return;
      }
      
      setLoadingRemetente(true);
      try {
        const resp = await api.searchUsersAndSectors(searchTerm);
        const results = Array.isArray(resp)
          ? resp
          : (resp?.data?.data || resp?.data || []);
        setSugestoesRemetente(results);
        setShowSugestoesRemetente(Array.isArray(results) && results.length > 0);
      } catch (error) {
        console.error('Erro na busca de remetente:', error);
        setSugestoesRemetente([]);
        setShowSugestoesRemetente(false);
      } finally {
        setLoadingRemetente(false);
      }
    }, 300),
    []
  );

  // Função debounced para pesquisa de destinatário (usuários e setores)
  const debouncedSearchDestinatario = useCallback(
    debounce(async (searchTerm: string) => {
      if (!searchTerm || searchTerm.length < 2) {
        setSugestoesDestinatario([]);
        setShowSugestoesDestinatario(false);
        return;
      }
      
      setLoadingDestinatario(true);
      try {
        const resp = await api.searchUsersAndSectors(searchTerm);
        const results = Array.isArray(resp)
          ? resp
          : (resp?.data?.data || resp?.data || []);
        setSugestoesDestinatario(results);
        setShowSugestoesDestinatario(Array.isArray(results) && results.length > 0);
      } catch (error) {
        console.error('Erro na busca de destinatário:', error);
        setSugestoesDestinatario([]);
        setShowSugestoesDestinatario(false);
      } finally {
        setLoadingDestinatario(false);
      }
    }, 300),
    []
  );

  // Selecionar resultado como Remetente (usuário ou setor)
  const selectRemetente = (item: any) => {
    const tipo = item?.tipo || (item?.NOME_SETOR || item?.CODIGO_SETOR ? 'sector' : 'user');
    
    if (tipo === 'sector') {
      const nomeSetor = item.NOME_SETOR || item.nome_setor || item.SETOR || item.setor || item.nome || '';
      setFiltros(prev => ({ ...prev, setorOrigem: nomeSetor, remetente: '' }));
      setSugestoesRemetente([]);
      setShowSugestoesRemetente(false);
      return;
    }

    const nome = item.NOME || item.nome || '';
    const matricula = item.NUMERO_FUNCIONAL || item.numero_funcional || item.numeroFuncional || item.matricula || item.MATRICULA || '';
    const vinculo = item.VINCULO_FUNCIONAL || item.vinculo_funcional || '';

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

  // Selecionar resultado como Destinatário (usuário ou setor)
  const selectDestinatario = (item: any) => {
    const tipo = item?.tipo || (item?.NOME_SETOR || item?.CODIGO_SETOR ? 'sector' : 'user');

    if (tipo === 'sector') {
      const nomeSetor = item.NOME_SETOR || item.nome_setor || item.SETOR || item.setor || item.nome || '';
      setFiltros(prev => ({ ...prev, setorDestino: nomeSetor, destinatario: '' }));
      setSugestoesDestinatario([]);
      setShowSugestoesDestinatario(false);
      return;
    }

    const nome = item.NOME || item.nome || '';
    const matricula = item.NUMERO_FUNCIONAL || item.numero_funcional || item.numeroFuncional || item.matricula || item.MATRICULA || '';
    const vinculo = item.VINCULO_FUNCIONAL || item.vinculo_funcional || '';
    
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

  const geocodificarEncomenda = async (encomenda: Encomenda): Promise<{ origem?: Coordenadas; destino?: Coordenadas } | null> => {

    try {
      const resultado: { origem?: Coordenadas; destino?: Coordenadas } = {};

      // Helper para localizar setor por nome aproximado (ignorando acentos/maiúsculas)
      const localizarSetor = (nome?: string) => {
        if (!nome) return undefined;
        const alvo = normalizeText(nome);
        let encontrado = setores.find((s: any) => normalizeText(s.nome) === alvo);
        if (!encontrado) {
          encontrado = setores.find((s: any) => {
            const n = normalizeText(s.nome);
            return n.includes(alvo) || alvo.includes(n);
          });
        }
        if (!encontrado) {
          encontrado = setores.find((s: any) => {
            const codigo = s.codigo ? normalizeText(s.codigo) : '';
            return !!codigo && (codigo === alvo || alvo.includes(codigo));
          });
        }
        return encontrado;
      };

      // Geocodificar setor de origem
      const setorOrigem = localizarSetor(encomenda.setorOrigem);
      const enderecoOrigem = setorOrigem?.endereco || encomenda.setorOrigemEndereco;
      if (enderecoOrigem?.cep) {
        const resultadoOrigem = await GeocodingService.geocodeByCep(enderecoOrigem.cep);
        if (resultadoOrigem.coordenadas && GeocodingService.isInTocantins(resultadoOrigem.coordenadas)) {
          resultado.origem = resultadoOrigem.coordenadas;
        } else if (enderecoOrigem) {
          const byAddress = await GeocodingService.geocodeByAddress(enderecoOrigem);
          if (byAddress.coordenadas && GeocodingService.isInTocantins(byAddress.coordenadas)) {
            resultado.origem = byAddress.coordenadas;
          }
        }
      } else if (setorOrigem?.latitude && setorOrigem?.longitude) {
        resultado.origem = { lat: setorOrigem.latitude, lng: setorOrigem.longitude };
      } else if (enderecoOrigem) {
        const byAddress = await GeocodingService.geocodeByAddress(enderecoOrigem);
        if (byAddress.coordenadas && GeocodingService.isInTocantins(byAddress.coordenadas)) {
          resultado.origem = byAddress.coordenadas;
        }
      }

      // Geocodificar setor de destino
      const setorDestino = localizarSetor(encomenda.setorDestino);
      const enderecoDestino = setorDestino?.endereco || encomenda.setorDestinoEndereco;
      if (enderecoDestino?.cep) {
        const resultadoDestino = await GeocodingService.geocodeByCep(enderecoDestino.cep);
        if (resultadoDestino.coordenadas && GeocodingService.isInTocantins(resultadoDestino.coordenadas)) {
          resultado.destino = resultadoDestino.coordenadas;
        } else if (enderecoDestino) {
          const byAddress = await GeocodingService.geocodeByAddress(enderecoDestino);
          if (byAddress.coordenadas && GeocodingService.isInTocantins(byAddress.coordenadas)) {
            resultado.destino = byAddress.coordenadas;
          }
        }
      } else if (setorDestino?.latitude && setorDestino?.longitude) {
        resultado.destino = { lat: setorDestino.latitude, lng: setorDestino.longitude };
      } else if (enderecoDestino) {
        const byAddress = await GeocodingService.geocodeByAddress(enderecoDestino);
        if (byAddress.coordenadas && GeocodingService.isInTocantins(byAddress.coordenadas)) {
          resultado.destino = byAddress.coordenadas;
        }
      }

      // SEM FALLBACK ARTIFICIAL: Não usar coordenadas de Palmas como fallback
      // Se não conseguiu geocodificar, retornar apenas o que foi encontrado

      return resultado.origem || resultado.destino ? resultado : null;
    } catch (error) {
      console.error('Erro ao geocodificar encomenda:', error);
      return null;
    }
  };

  // Função para agrupar encomendas por localização (similar ao MapaGeralEncomendas)
  const agruparPorLocalizacao = (encomendas: EncomendaComCoordenadas[], tipo: 'origem' | 'destino') => {
    const COORDINATE_TOLERANCE = 0.001; // Tolerância para agrupar coordenadas próximas
    const grupos: { [key: string]: EncomendaComCoordenadas[] } = {};
    
    encomendas.forEach(encomenda => {
      let chave: string;
      
      // PRIORIDADE 1: Usar CEP do setor se disponível
      const nomeSetor = tipo === 'origem' ? encomenda.setorOrigem : encomenda.setorDestino;
      const setorInfo = setores.find(s => s.nome === nomeSetor);
      
      const cep = setorInfo?.endereco?.cep;
      
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

  // Função para criar ícone com contador
  const criarIconeComContador = (baseColor: string, count: number, tipo: 'origem' | 'destino') => {
    const letra = tipo === 'origem' ? 'O' : 'D';
    const displayText = count > 1 ? count.toString() : letra;
    
    return L.divIcon({
      html: `<div style="background-color: ${baseColor}; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: ${count > 1 ? '12px' : '14px'};">${displayText}</div>`,
      className: 'custom-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  };

  // Função para calcular rotas reais entre origem e destino
  const calcularRotas = async (encomendas: EncomendaComCoordenadas[]) => {
    const rotasCalculadas: { [key: string]: [number, number][] } = {};
    
    for (const encomenda of encomendas) {
      if (encomenda.coordOrigem && encomenda.coordDestino) {
        try {
          const coords: [number, number][] = [
            [encomenda.coordOrigem.lng, encomenda.coordOrigem.lat],
            [encomenda.coordDestino.lng, encomenda.coordDestino.lat]
          ];

          const response = await fetch(`${getApiBaseUrl()}/routing/directions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              profile: 'driving-car', 
              coordinates: coords,
              radiuses: [5000, 5000] // Tolerância para snap de pontos
            }),
          });

          if (response.ok) {
            const json = await response.json();
            if (json?.success && json?.data?.coordinates) {
              rotasCalculadas[encomenda.id] = json.data.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]); // Inverter lng,lat para lat,lng
            }
          }
        } catch (error) {
          console.error('Erro ao calcular rota para encomenda:', encomenda.id, error);
        }
      }
    }
    
    return rotasCalculadas;
  };

  const aplicarFiltros = async (encomendasData?: EncomendaComCoordenadas[], filtrosCustom?: FiltrosRastreamento) => {
    const dadosEncomendas = encomendasData || encomendas;
    const filtrosAtivos = filtrosCustom || filtros;
    
    console.log('=== INÍCIO APLICAR FILTROS ===');
    console.log('Filtros ativos:', filtrosAtivos);
    console.log('Total de encomendas disponíveis:', dadosEncomendas.length);
    console.log('Dados das encomendas:', dadosEncomendas);
    
    setLoading(true);
    try {
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
            // Tentar acessar tanto o formato original quanto o mapeado
            const matriculaRemetente = (encomenda as any).remetenteMatricula || (encomenda as any).remetente_matricula || '';
            const vinculoRemetente = (encomenda as any).remetenteVinculo || (encomenda as any).remetente_vinculo || '';
            
            console.log('=== DEBUG REMETENTE ===');
            console.log('Texto buscado:', remetenteTexto);
            console.log('Nome remetente:', nomeRemetente);
            console.log('Matrícula remetente:', matriculaRemetente);
            console.log('Vínculo remetente:', vinculoRemetente);
            
            // Buscar por nome
            if (nomeRemetente.includes(remetenteTexto)) {
              console.log('Encontrado por nome');
              return true;
            }
            
            // Buscar por matrícula
            if (matriculaRemetente && matriculaRemetente.toString().includes(remetenteTexto)) {
              console.log('Encontrado por matrícula');
              return true;
            }
            
            // Buscar por formato "Nome Mat: matricula-vinculo"
            if (matriculaRemetente && vinculoRemetente) {
              const formatoCompleto = `${nomeRemetente} mat: ${matriculaRemetente}-${vinculoRemetente}`;
              console.log('Formato completo gerado:', formatoCompleto);
              if (formatoCompleto.includes(remetenteTexto)) {
                console.log('Encontrado por formato completo');
                return true;
              }
            }
            
            // Buscar por formato "Nome (matricula-vinculo)" - novo formato
            if (matriculaRemetente && vinculoRemetente) {
              const formatoParenteses = `${nomeRemetente} (${matriculaRemetente}-${vinculoRemetente})`;
              console.log('Formato parênteses gerado:', formatoParenteses);
              if (formatoParenteses.includes(remetenteTexto)) {
                console.log('Encontrado por formato parênteses');
                return true;
              }
            }
            
            console.log('Não encontrado');
            return false;
          
          case 'destinatario':
            const destinatarioTexto = filtrosAtivos.destinatario.toLowerCase();
            const nomeDestinatario = encomenda.destinatario?.toLowerCase() || '';
            // Tentar acessar tanto o formato original quanto o mapeado
            const matriculaDestinatario = (encomenda as any).destinatarioMatricula || (encomenda as any).destinatario_matricula || '';
            const vinculoDestinatario = (encomenda as any).destinatarioVinculo || (encomenda as any).destinatario_vinculo || '';
            
            // Buscar por nome
            if (nomeDestinatario.includes(destinatarioTexto)) {
              return true;
            }
            
            // Buscar por matrícula
            if (matriculaDestinatario && matriculaDestinatario.toString().includes(destinatarioTexto)) {
              return true;
            }
            
            // Buscar por formato "Nome Mat: matricula-vinculo"
            if (matriculaDestinatario && vinculoDestinatario) {
              const formatoCompleto = `${nomeDestinatario} mat: ${matriculaDestinatario}-${vinculoDestinatario}`;
              if (formatoCompleto.includes(destinatarioTexto)) {
                return true;
              }
            }
            
            return false;
          
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
      console.log('Dados das encomendas filtradas:', resultado);

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
        showError("Múltiplos filtros detectados", `Por favor, use apenas um filtro por vez. Filtros ativos: ${filtrosPreenchidos.join(', ')}`);
        setLoading(false);
        return;
      }

      // Geocodificar encomendas filtradas
      const encomendasComCoordenadas = await Promise.all(
        resultado.map(async (encomenda) => {
          if (!encomenda.coordOrigem && !encomenda.coordDestino) {
            const coordenadas = await geocodificarEncomenda(encomenda);
            return { 
              ...encomenda, 
              coordOrigem: coordenadas?.origem,
              coordDestino: coordenadas?.destino,
              coordenadas: coordenadas?.destino || coordenadas?.origem
            };
          }
          return encomenda;
        })
      );

      // Calcular rotas reais para as encomendas
      const rotasCalculadas = await calcularRotas(encomendasComCoordenadas);
      
      // Adicionar rotas às encomendas
      const encomendasComRotas = encomendasComCoordenadas.map(encomenda => ({
        ...encomenda,
        rota: rotasCalculadas[encomenda.id] || null
      }));

      setEncomendasFiltradas(encomendasComRotas);
      
      console.log('=== FINAL APLICAR FILTROS ===');
      console.log('Encomendas finais definidas no estado:', encomendasComRotas.length);
      console.log('Dados finais:', encomendasComRotas);
      
      if (encomendasComRotas.length === 0) {
        const filtroAtivo = filtrosPreenchidos.length > 0 ? filtrosPreenchidos[0] : 'filtros aplicados';
        showInfo("Nenhuma encomenda encontrada", `Nenhum resultado foi encontrado para o filtro "${filtroAtivo}". Tente ajustar os critérios de pesquisa.`);
      }
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error);
      showError("Erro ao filtrar encomendas", "Ocorreu um erro ao processar os filtros.");
    } finally {
      setLoading(false);
    }
  };

  const limparFiltros = () => {
    setFiltros({
      numeroEncomenda: '',
      remetente: '',
      destinatario: '',
      setorOrigem: 'todos',
      setorDestino: 'todos',
      status: 'todos',
      dataInicio: '',
      dataFim: ''
    });
    // Após limpar filtros, manter todas as encomendas exibidas no mapa
    aplicarFiltros();
  };

  useEffect(() => {
    if (!isOpen) {
      setEncomendas([]);
      setEncomendasFiltradas([]);
      setEncomendaSelecionada(null);
      setShowDetalhes(false);
      setFiltros({
        numeroEncomenda: '',
        remetente: '',
        destinatario: '',
        setorOrigem: 'todos',
        setorDestino: 'todos',
        status: 'todos',
        dataInicio: '',
        dataFim: ''
      });
    }
  }, [isOpen]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pendente": return "Pendente";
      case "preparando": return "Preparando";
      case "transito": return "Em Trânsito";
      case "entregue": return "Entregue";
      case "devolvido": return "Devolvido";
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pendente":
        return <Clock className="w-4 h-4" />;
      case "preparando":
        return <Package className="w-4 h-4" />;
      case "transito":
        return <Truck className="w-4 h-4" />;
      case "entregue":
        return <CheckCircle className="w-4 h-4" />;
      case "devolvido":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const handleMarkerClick = (encomenda: EncomendaComCoordenadas) => {
    console.log('DEBUG - Encomenda selecionada:', encomenda);
    console.log('DEBUG - Observações da encomenda selecionada:', encomenda.observacoes);
    setEncomendaSelecionada(encomenda);
    setShowDetalhes(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Rastreamento no Mapa - Estado do Tocantins
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[80vh]">
          {/* Painel de Filtros */}
          <div className="lg:col-span-1 space-y-4 overflow-y-auto">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros de Pesquisa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Número da Encomenda</label>
                  <Input
                    placeholder="Ex: EN-2024-001246"
                    value={filtros.numeroEncomenda}
                    onChange={(e) => setFiltros(prev => ({ ...prev, numeroEncomenda: e.target.value }))}
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">Remetente</label>
                  <div className="relative">
                    <Input
                      placeholder="Digite o nome do remetente"
                      value={filtros.remetente}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFiltros(prev => ({ ...prev, remetente: value }));
                        debouncedSearchRemetente(value);
                      }}
                      className="text-sm input-remetente"
                    />
                    {loadingRemetente && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      </div>
                    )}
                    {showSugestoesRemetente && sugestoesRemetente.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto sugestoes-remetente">
                        {sugestoesRemetente.map((item, index) => {
                          const tipo = item?.tipo || (item?.NOME_SETOR || item?.CODIGO_SETOR ? 'sector' : 'user');
                          if (tipo === 'sector') {
                            const nomeSetor = item.NOME_SETOR || item.nome_setor || item.SETOR || item.setor || item.nome || '';
                            const codigoSetor = item.CODIGO_SETOR || item.codigo_setor || '';
                            const orgao = item.ORGAO || item.orgao || '';
                            return (
                              <div
                                key={`remetente-sector-${index}`}
                                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                onClick={() => selectRemetente(item)}
                              >
                                <div className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                                  <MapPin className="w-3 h-3 text-green-600" />
                                  {codigoSetor && `${codigoSetor} - `}{nomeSetor}
                                  {orgao && <span className="text-xs text-gray-500 ml-auto">{orgao}</span>}
                                </div>
                              </div>
                            );
                          } else {
                            const nome = item.NOME || item.nome || '';
                            const matricula = item.NUMERO_FUNCIONAL || item.numero_funcional || item.numeroFuncional || item.matricula || item.MATRICULA || '';
                            const vinculo = item.VINCULO_FUNCIONAL || item.vinculo_funcional || '';
                            const orgao = item.ORGAO || item.orgao || '';
                            const setor = item.SETOR || item.setor || '';
                            return (
                              <div
                                key={`remetente-user-${index}`}
                                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                onClick={() => selectRemetente(item)}
                              >
                                <div className="font-medium text-sm text-gray-900 flex items-center gap-2">
                                  <User className="w-3 h-3 text-blue-600" />
                                  {nome}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {matricula && vinculo ? `${matricula}-${vinculo}` : matricula || vinculo || 'Sem matrícula'}
                                </div>
                                {orgao && (
                                  <div className="text-xs text-gray-400">{orgao}</div>
                                )}
                                {setor && (
                                  <div className="text-xs text-gray-400">{setor}</div>
                                )}
                              </div>
                            );
                          }
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">Destinatário</label>
                  <div className="relative">
                    <Input
                      placeholder="Digite o nome do destinatário"
                      value={filtros.destinatario}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFiltros(prev => ({ ...prev, destinatario: value }));
                        debouncedSearchDestinatario(value);
                      }}
                      className="text-sm input-destinatario"
                    />
                    {loadingDestinatario && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      </div>
                    )}
                    {showSugestoesDestinatario && sugestoesDestinatario.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto sugestoes-destinatario">
                        {sugestoesDestinatario.map((item, index) => {
                          const tipo = item?.tipo || (item?.NOME_SETOR || item?.CODIGO_SETOR ? 'sector' : 'user');
                          if (tipo === 'sector') {
                            const nomeSetor = item.NOME_SETOR || item.nome_setor || item.SETOR || item.setor || item.nome || '';
                            const codigoSetor = item.CODIGO_SETOR || item.codigo_setor || '';
                            const orgao = item.ORGAO || item.orgao || '';
                            return (
                              <div
                                key={`destinatario-sector-${index}`}
                                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                onClick={() => selectDestinatario(item)}
                              >
                                <div className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                                  <MapPin className="w-3 h-3 text-green-600" />
                                  {codigoSetor && `${codigoSetor} - `}{nomeSetor}
                                  {orgao && <span className="text-xs text-gray-500 ml-auto">{orgao}</span>}
                                </div>
                              </div>
                            );
                          } else {
                            const nome = item.NOME || item.nome || '';
                            const matricula = item.NUMERO_FUNCIONAL || item.numero_funcional || item.numeroFuncional || item.matricula || item.MATRICULA || '';
                            const vinculo = item.VINCULO_FUNCIONAL || item.vinculo_funcional || '';
                            const orgao = item.ORGAO || item.orgao || '';
                            const setor = item.SETOR || item.setor || '';
                            return (
                              <div
                                key={`destinatario-user-${index}`}
                                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                onClick={() => selectDestinatario(item)}
                              >
                                <div className="font-medium text-sm text-gray-900 flex items-center gap-2">
                                  <User className="w-3 h-3 text-blue-600" />
                                  {nome}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {matricula && vinculo ? `${matricula}-${vinculo}` : matricula || vinculo || 'Sem matrícula'}
                                </div>
                                {orgao && (
                                  <div className="text-xs text-gray-400">{orgao}</div>
                                )}
                                {setor && (
                                  <div className="text-xs text-gray-400">{setor}</div>
                                )}
                              </div>
                            );
                          }
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">Setor Origem</label>
                  <Select value={filtros.setorOrigem} onValueChange={(value) => setFiltros(prev => ({ ...prev, setorOrigem: value }))}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Selecione o setor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os setores</SelectItem>
                      {setores.map((setor, index) => (
                        <SelectItem key={setor.id || `setor-origem-${index}`} value={setor.nome}>
                          {setor.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">Setor Destino</label>
                  <Select value={filtros.setorDestino} onValueChange={(value) => setFiltros(prev => ({ ...prev, setorDestino: value }))}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Selecione o setor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os setores</SelectItem>
                      {setores.map((setor, index) => (
                        <SelectItem key={setor.id || `setor-destino-${index}`} value={setor.nome}>
                          {setor.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600">Status</label>
                  <Select value={filtros.status} onValueChange={(value) => setFiltros(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os status</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="preparando">Preparando</SelectItem>
                      <SelectItem value="transito">Em Trânsito</SelectItem>
                      <SelectItem value="entregue">Entregue</SelectItem>
                      <SelectItem value="devolvido">Devolvido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={buscar} 
                    disabled={loading}
                    className="flex-1 text-xs"
                    size="sm"
                  >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                    Buscar
                  </Button>
                  <Button 
                    onClick={limparFiltros} 
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>

                {/* Resultados */}
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-600 mb-2">
                    {encomendasFiltradas.length} encomenda(s) encontrada(s)
                  </p>
                  <div className="text-xs text-gray-500 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Origem</span>
                      <div className="w-3 h-3 bg-red-500 rounded-full ml-2"></div>
                      <span>Destino</span>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {encomendasFiltradas.map(encomenda => (
                      <div 
                        key={encomenda.id}
                        className="p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleMarkerClick(encomenda)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-medium truncate">
                            {encomenda.codigo}
                          </span>
                          <Badge className={`${getStatusColor(encomenda.status)} text-[10px] px-1 py-0`}>
                            {getStatusLabel(encomenda.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mapa */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                <div className="h-full rounded-lg overflow-hidden relative">
                  {loading && (
                    <div className="absolute inset-0 z-[900] flex items-center justify-center bg-white/70">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Carregando dados ...
                      </div>
                    </div>
                  )}
                  <MapContainer
                    center={[COORDENADAS_TOCANTINS.lat, COORDENADAS_TOCANTINS.lng]}
                    zoom={ZOOM_TOCANTINS}
                    scrollWheelZoom={true}
                    zoomAnimation={false}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    <MapController encomendas={encomendasFiltradas} />
                    
                    {/* Marcadores de origem agrupados */}
                    {Object.entries(agruparPorLocalizacao(encomendasFiltradas, 'origem')).map(([chave, grupo]) => {
                      const coord = grupo[0].coordOrigem;
                      if (!coord) return null;
                      
                      const icone = criarIconeComContador('#4CAF50', grupo.length, 'origem');
                      
                      return (
                        <Marker
                          key={`origem-${chave}`}
                          position={[coord.lat, coord.lng]}
                          icon={icone}
                          eventHandlers={{
                            click: () => {
                              if (grupo.length === 1) {
                                handleMarkerClick(grupo[0]);
                              } else {
                                // Para múltiplas encomendas, mostrar a primeira
                                handleMarkerClick(grupo[0]);
                              }
                            }
                          }}
                        ></Marker>
                      );
                    })}

                    {/* Marcadores de destino agrupados */}
                    {Object.entries(agruparPorLocalizacao(encomendasFiltradas, 'destino')).map(([chave, grupo]) => {
                      const coord = grupo[0].coordDestino;
                      if (!coord) return null;
                      
                      const icone = criarIconeComContador('#f44336', grupo.length, 'destino');
                      
                      return (
                        <Marker
                          key={`destino-${chave}`}
                          position={[coord.lat, coord.lng]}
                          icon={icone}
                          eventHandlers={{
                            click: () => {
                              if (grupo.length === 1) {
                                handleMarkerClick(grupo[0]);
                              } else {
                                // Para múltiplas encomendas, mostrar a primeira
                                handleMarkerClick(grupo[0]);
                              }
                            }
                          }}
                        ></Marker>
                      );
                    })}

                    {/* Rotas reais entre origem e destino */}
                    {encomendasFiltradas.map((encomenda) => {
                      if (encomenda.rota && encomenda.rota.length > 0) {
                        return (
                          <Polyline
                            key={`rota-${encomenda.id}`}
                            positions={encomenda.rota}
                            color="#3b82f6"
                            weight={3}
                            opacity={0.7}
                          />
                        );
                      } else if (encomenda.coordOrigem && encomenda.coordDestino) {
                        // Fallback para linha reta se não houver rota
                        return (
                          <Polyline
                            key={`linha-${encomenda.id}`}
                            positions={[
                              [encomenda.coordOrigem.lat, encomenda.coordOrigem.lng],
                              [encomenda.coordDestino.lat, encomenda.coordDestino.lng]
                            ]}
                            color="#ef4444"
                            weight={2}
                            opacity={0.5}
                            dashArray="5, 10"
                          />
                        );
                      }
                      return null;
                    })}
                  </MapContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal de Detalhes */}
        {showDetalhes && encomendaSelecionada && (
          <Dialog open={showDetalhes} onOpenChange={setShowDetalhes}>
            <DialogContent className="max-w-4xl overflow-y-auto">
              <DialogHeader>
                  <DialogTitle>Detalhes da Encomenda</DialogTitle>
                  <DialogDescription>
                    Informações completas da encomenda
                  </DialogDescription>
                </DialogHeader>
              <div className="space-y-2">
                {/* Informações Básicas */}
                <div className="bg-gray-50 p-2 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Informações Básicas
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                    <div className="max-w-[200px]">
                      <label className="font-medium text-muted-foreground flex items-center gap-1">
                        <QrCode className="w-3 h-3" />
                        Código
                      </label>
                      <p className="font-mono text-nowrap text-xs">
                        {encomendaSelecionada.codigo || encomendaSelecionada.codigoRastreamento || 'Não informado'}
                      </p>
                    </div>
                    <div className="ml-8">
                      <label className="font-medium text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Status
                      </label>
                      <div>
                        <Badge className={`text-xs ${getStatusColor(encomendaSelecionada.status)}`}>
                          {getStatusLabel(encomendaSelecionada.status)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        Tipo
                      </label>
                      <Badge className={getTipoColor(encomendaSelecionada.tipo)}>
                         {getTipoLabel(encomendaSelecionada.tipo)}
                       </Badge>
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Prioridade
                      </label>
                      <div>
                        <Badge className={`text-xs ${getPrioridadeColor(encomendaSelecionada.prioridade)}`}>
                           {getPrioridadeLabel(encomendaSelecionada.prioridade)}
                         </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Datas */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Datas
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Envio
                      </label>
                      <p className="text-sm font-medium">
                        {encomendaSelecionada.dataEnvio ? 
                          new Date(encomendaSelecionada.dataEnvio).toLocaleDateString('pt-BR') : 
                          'Não informado'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        Entrega
                      </label>
                      <div className="text-sm font-medium">
                        {encomendaSelecionada.dataEntrega ? (
                          <Badge className={getEntregaColor(encomendaSelecionada.dataEntrega)}>
                            {new Date(encomendaSelecionada.dataEntrega).toLocaleDateString('pt-BR')}
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600">
                            Não entregue
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Remetente e Destinatário */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Remetente e Destinatário
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Dados de Origem */}
                    <div className="bg-green-50 border border-green-200 p-2 rounded-lg">
                      <h5 className="text-xs font-semibold text-green-800 mb-1 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        🏢 Origem
                      </h5>
                      
                      {/* Dados do Remetente */}
                      <div className="mb-2">
                        <label className="text-xs font-medium text-green-700 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Remetente
                        </label>
                        <p className="text-xs font-medium text-green-900">{encomendaSelecionada.remetente}</p>
                        <p className="text-xs text-green-600">Mat: {formatMatriculaVinculo({ matricula: encomendaSelecionada.remetente_matricula, vinculo_funcional: encomendaSelecionada.remetente_vinculo })}</p>
                      </div>
                      
                      {/* Setor Origem */}
                      <div>
                        <label className="text-xs font-medium text-green-700 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          Setor
                        </label>
                        <p className="text-xs font-medium text-green-900">{encomendaSelecionada.setorOrigem}</p>
                        <TooltipProvider>
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <div className="flex items-center gap-1 cursor-help">
                                 <AlertCircle className="w-3 h-3 text-green-500 hover:text-green-600" />
                      <p className="text-xs text-green-600">{obterEnderecoSetorSync(encomendaSelecionada.setorOrigem) !== 'Carregando endereço...' ? obterEnderecoSetorSync(encomendaSelecionada.setorOrigem).split(',').slice(-2).join(',').trim() : 'Carregando...'}</p>
                               </div>
                             </TooltipTrigger>
                             <TooltipContent>
                      <p className="whitespace-pre-line">{obterEnderecoSetorSync(encomendaSelecionada.setorOrigem)}</p>
                             </TooltipContent>
                           </Tooltip>
                         </TooltipProvider>
                      </div>
                    </div>
                    
                    {/* Dados de Destino */}
                    <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg">
                      <h5 className="text-xs font-semibold text-blue-800 mb-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        🎯 Destino
                      </h5>
                      
                      {/* Dados do Destinatário */}
                      <div className="mb-2">
                        <label className="text-xs font-medium text-blue-700 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Destinatário
                        </label>
                        <p className="text-xs font-medium text-blue-900">{encomendaSelecionada.destinatario}</p>
                        <p className="text-xs text-blue-600">Mat: {formatMatriculaVinculo({ matricula: encomendaSelecionada.destinatario_matricula, vinculo_funcional: encomendaSelecionada.destinatario_vinculo })}</p>
                      </div>
                      
                      {/* Setor Destino */}
                      <div>
                        <label className="text-xs font-medium text-blue-700 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          Setor
                        </label>
                        <p className="text-xs font-medium text-blue-900">{encomendaSelecionada.setorDestino}</p>
                        <TooltipProvider>
                           <Tooltip>
                             <TooltipTrigger asChild>
                               <div className="flex items-center gap-1 cursor-help">
                                 <AlertCircle className="w-3 h-3 text-blue-500 hover:text-blue-600" />
                      <p className="text-xs text-blue-600">{obterEnderecoSetorSync(encomendaSelecionada.setorDestino) !== 'Carregando endereço...' ? obterEnderecoSetorSync(encomendaSelecionada.setorDestino).split(',').slice(-2).join(',').trim() : 'Carregando...'}</p>
                               </div>
                             </TooltipTrigger>
                             <TooltipContent>
                      <p className="whitespace-pre-line">{obterEnderecoSetorSync(encomendaSelecionada.setorDestino)}</p>
                             </TooltipContent>
                           </Tooltip>
                         </TooltipProvider>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Descrição e Observações */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      Descrição
                    </h4>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {encomendaSelecionada.descricao || 'Nenhuma descrição fornecida.'}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-2 rounded-lg">
                    <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Observações
                    </h4>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {encomendaSelecionada.observacoes || 'Nenhuma observação registrada.'}
                    </p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
      
      {notification && (
        <NotificationModal
          isOpen={isNotificationOpen}
          onClose={hideNotification}
          title={notification.title}
          description={notification.description}
          variant={notification.variant}
        />
      )}
    </Dialog>
  );
};

export default MapaRastreamento;
