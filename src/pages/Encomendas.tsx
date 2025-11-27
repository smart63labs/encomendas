import React, { useState, useEffect, useRef } from "react";
import { Package, Plus, Search, MapPin, Calendar, User, Truck, QrCode, Grid3X3, List, X, Info, AlertCircle, ChevronLeft, ChevronRight, Check, Route } from "lucide-react";
import { useModuleTheme } from "@/lib/theme-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NovaEncomendaWizard from "@/components/encomendas/NovaEncomendaWizard";
import ListaEncomendas from "@/components/encomendas/ListaEncomendas";
import RastreamentoEncomenda from "@/components/encomendas/RastreamentoEncomenda";
import MapaRastreamento from "@/components/encomendas/MapaRastreamento";
import MapaGeralEncomendas from "@/components/encomendas/MapaGeralEncomendas";
import MapaRotaOtimaEncomendas from "@/components/encomendas/MapaRotaOtimaEncomendas";
import MapaGeralMalotes from "@/components/malotes/MapaGeralMalotes";
import MapModal from "@/components/ui/MapModal";
import Layout from "@/components/layout/Layout";
import { api } from "@/lib/api";
import type { Encomenda } from "@/types/encomenda.types";
import { mapearStatus } from "@/types/encomenda.types";
import { useAuth } from "@/contexts/AuthContext";

  const Encomendas = () => {
  const classes = useModuleTheme('encomendas');
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showNovaEncomenda, setShowNovaEncomenda] = useState(false);
  const [showRastreamento, setShowRastreamento] = useState(false);
  const [codigoRastreamentoInicial, setCodigoRastreamentoInicial] = useState('');
  const [showMapaGeral, setShowMapaGeral] = useState(false);
    const [showMapaModal, setShowMapaModal] = useState(false);
    const [showMapaMalotes, setShowMapaMalotes] = useState(false);
  const [showRotaOtima, setShowRotaOtima] = useState(false);
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [hubSetorId, setHubSetorId] = useState<number | null>(null);
  
  // Estados para controle do wizard
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const wizardRef = useRef(null);
  
  // Função para abrir modal de rastreamento com código pré-preenchido
  const handleTrackWithCode = (codigoRastreamento: string) => {
    setCodigoRastreamentoInicial(codigoRastreamento);
    setShowRastreamento(true);
  };
  const [stats, setStats] = useState([
    {
      title: "Total de Encomendas",
      value: "0",
      icon: Package,
      color: "text-primary"
    },
    {
      title: "Em Trânsito",
      value: "0",
      icon: Truck,
      color: "text-accent-orange"
    },
    {
      title: "Entregues Hoje",
      value: "0",
      icon: MapPin,
      color: "text-accent-green"
    },
    {
      title: "Pendentes",
      value: "0",
      icon: Calendar,
      color: "text-accent-red"
    },
    {
      title: "Encomendas Urgentes",
      value: "0",
      icon: AlertCircle,
      color: "text-red-600"
    }
  ]);

  const isAdminUser = () => {
    const role = (user?.role || '').toString().toUpperCase();
    const perfil = (user?.perfil || '').toString().toUpperCase();
    return role === 'ADMIN' || perfil === 'ADMIN' || perfil === 'ADMINISTRADOR';
  };
  const getUserSetorId = (): number | null => {
    const raw = (user as any)?.setor_id ?? (user as any)?.setorId ?? (user as any)?.SETOR_ID;
    const num = Number(raw);
    return Number.isNaN(num) ? null : num;
  };
  const getUserSetorNome = (): string => {
    return (
      (user as any)?.setor ??
      (user as any)?.SETOR ??
      (user as any)?.nome_setor ??
      (user as any)?.NOME_SETOR ??
      ''
    );
  };
  const normalize = (s: any) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const stripOrgPrefix = (s: any) => {
    const str = String(s || '').trim();
    const parts = str.split('-').map(p => p.trim()).filter(Boolean);
    return parts.length >= 2 ? parts[parts.length - 1] : str;
  };
  const normalizeSetorName = (s: any) => normalize(stripOrgPrefix(s));
  const isHubUser = (): boolean => {
    const uid = getUserSetorId();
    return uid != null && hubSetorId != null && uid === hubSetorId;
  };

  useEffect(() => {
    const loadHubId = async () => {
      try {
        const resp = await api.getConfiguracoesPorCategoria('geral');
        const items = resp?.data?.data ?? resp?.data ?? [];
        const hubItem = Array.isArray(items)
          ? items.find((c: any) => (c.chave ?? c.CHAVE) === 'HUB_SETOR_ID')
          : null;
        let rawVal: any = hubItem ? (hubItem.valor ?? hubItem.VALOR ?? null) : null;
        if (rawVal && typeof rawVal === 'object') rawVal = rawVal.valor ?? rawVal.value ?? null;
        const num = Number(rawVal);
        setHubSetorId(Number.isNaN(num) ? null : num);
      } catch (_) {
        setHubSetorId(null);
      }
    };
    loadHubId();
  }, []);

  const applyVisibilityFilter = (list: Encomenda[]): Encomenda[] => {
    const adminOrHub = isAdminUser() || isHubUser();
    if (adminOrHub) return list;
    const userSetorNome = normalizeSetorName(getUserSetorNome());
    const userSetorId = getUserSetorId();
    return list.filter((encomenda) => {
      const origemNome = normalizeSetorName(encomenda.setorOrigem || '');
      const destinoNome = normalizeSetorName(encomenda.setorDestino || '');
      const origemId = (encomenda as any).setorOrigemId;
      const destinoId = (encomenda as any).setorDestinoId;
      const idMatch = userSetorId != null && (origemId === userSetorId || destinoId === userSetorId);
      const nomeMatch = userSetorNome && (
        userSetorNome === origemNome ||
        userSetorNome === destinoNome ||
        origemNome.includes(userSetorNome) ||
        destinoNome.includes(userSetorNome)
      );
      return idMatch || nomeMatch;
    });
  };

  const computeStatsFromVisible = (visible: Encomenda[]) => {
    const today = new Date();
    const isSameDay = (a?: string) => {
      if (!a) return false;
      const d = new Date(a);
      return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
    };
    const total = visible.length;
    const emTransito = visible.filter(e => e.status === 'transito').length;
    const entreguesHoje = visible.filter(e => e.status === 'entregue' && isSameDay(e.dataEntrega)).length;
    const pendentes = visible.filter(e => String((e as any).statusRaw || '').toLowerCase() === 'pendente').length;
    const urgentes = visible.filter(e => e.prioridade === 'urgente' || (e as any).urgente === true).length;
    setStats([
      { title: 'Total de Encomendas', value: String(total), icon: Package, color: 'text-primary' },
      { title: 'Em Trânsito', value: String(emTransito), icon: Truck, color: 'text-accent-orange' },
      { title: 'Entregues Hoje', value: String(entreguesHoje), icon: MapPin, color: 'text-accent-green' },
      { title: 'Pendentes', value: String(pendentes), icon: Calendar, color: 'text-accent-red' },
      { title: 'Encomendas Urgentes', value: String(urgentes), icon: AlertCircle, color: 'text-red-600' },
    ]);
  };

  const loadEncomendas = async () => {
    try {
      // Estratégia para carregar TODAS as encomendas
      let response;
      let allEncomendas = [];
      
      try {
        response = await api.getEncomendas();
        
        // Verificar se há paginação na resposta
        if (response.data.data && response.data.data.pagination) {
          const totalPages = response.data.data.pagination.totalPages || 1;
          
          if (totalPages > 1) {
            for (let page = 1; page <= totalPages; page++) {
              const pageResponse = await api.get('/encomendas', { page, limit: 50 });
              if (pageResponse.data.success && pageResponse.data.data) {
                const pageData = Array.isArray(pageResponse.data.data.data) 
                  ? pageResponse.data.data.data 
                  : pageResponse.data.data;
                allEncomendas.push(...pageData);
              }
            }
            
            response = {
              ...response,
              data: {
                ...response.data,
                data: allEncomendas
              }
            };
          }
        }
      } catch (error) {
        console.warn('Erro ao carregar múltiplas páginas:', error);
        response = await api.getEncomendas();
      }
      if (response.data.success && response.data.data) {
        // Usar função de mapeamento importada

        // Verificar se data.data é um array ou se os dados estão diretamente em data.data
        const encomendas = Array.isArray(response.data.data.data) ? response.data.data.data : response.data.data;
        
        const encomendasMapeadas = encomendas.map((encomenda: any) => ({
          id: encomenda.id?.toString() || '',
          codigo: encomenda.numeroEncomenda || '',
          codigoRastreamento: encomenda.numeroEncomenda || '',
          tipo: 'Encomenda',
          remetente: encomenda.remetente,
          destinatario: encomenda.destinatario,
          setorOrigem: encomenda.setorOrigem ?? encomenda.SETOR_ORIGEM ?? encomenda.setor_origem ?? '',
          setorDestino: encomenda.setorDestino ?? encomenda.SETOR_DESTINO ?? encomenda.setor_destino ?? '',
          setorOrigemId: (() => { const v = encomenda.setorOrigemId ?? encomenda.SETOR_ORIGEM_ID ?? encomenda.setor_origem_id; const n = Number(v); return Number.isNaN(n) ? undefined : n; })(),
          setorDestinoId: (() => { const v = encomenda.setorDestinoId ?? encomenda.SETOR_DESTINO_ID ?? encomenda.setor_destino_id; const n = Number(v); return Number.isNaN(n) ? undefined : n; })(),
          status: mapearStatus(encomenda.status || 'pendente'),
          statusRaw: String(encomenda.status || ''),
          prioridade: encomenda.urgente ? 'urgente' : 'normal',
          urgente: !!encomenda.urgente,
          dataPostagem: encomenda.dataCriacao ? new Date(encomenda.dataCriacao).toISOString().split('T')[0] : '',
          dataEnvio: encomenda.dataCriacao ? new Date(encomenda.dataCriacao).toISOString().split('T')[0] : '',
          dataEntrega: encomenda.dataEntrega ? new Date(encomenda.dataEntrega).toISOString().split('T')[0] : undefined,
          valorDeclarado: 0,
          peso: 0,
          descricao: encomenda.descricao || '',
          observacoes: '',
          // Identificadores
          numeroMalote: encomenda.numeroMalote ?? encomenda.NUMERO_MALOTE ?? '',
          numeroLacre: encomenda.numeroLacre ?? encomenda.NUMERO_LACRE ?? '',
          numeroAR: encomenda.numeroAR ?? encomenda.NUMERO_AR ?? '',
          codigoLacreMalote: encomenda.numeroLacre ?? encomenda.NUMERO_LACRE ?? '',
          // Campos camelCase esperados pelos componentes
          remetenteMatricula: encomenda.remetenteMatricula ?? encomenda.remetente_matricula ?? '',
          remetenteVinculo: encomenda.remetenteVinculo ?? encomenda.remetente_vinculo ?? '',
          destinatarioMatricula: encomenda.destinatarioMatricula ?? encomenda.destinatario_matricula ?? '',
          destinatarioVinculo: encomenda.destinatarioVinculo ?? encomenda.destinatario_vinculo ?? '',
          // Dados de matrícula e vínculo do remetente
          remetente_matricula: encomenda.remetenteMatricula,
          remetente_vinculo: encomenda.remetenteVinculo,
          // Dados de matrícula e vínculo do destinatário
          destinatario_matricula: encomenda.destinatarioMatricula,
          destinatario_vinculo: encomenda.destinatarioVinculo,
          // Coordenadas dos setores
          setorOrigemCoordenadas: encomenda.setorOrigemCoordenadas,
          setorDestinoCoordenadas: encomenda.setorDestinoCoordenadas,
          // Dados de endereço dos setores
          setorOrigemEndereco: encomenda.setorOrigemEndereco,
          setorDestinoEndereco: encomenda.setorDestinoEndereco
        }));
        setEncomendas(encomendasMapeadas);
        const visible = applyVisibilityFilter(encomendasMapeadas);
        computeStatsFromVisible(visible);
      } else {
        setEncomendas([]);
        computeStatsFromVisible([]);
      }
    } catch (error) {
      console.error('Erro ao carregar encomendas:', error);
      setEncomendas([]);
      computeStatsFromVisible([]);
    }
  };

  const handleNovaEncomendaSuccess = () => {
    setShowNovaEncomenda(false);
    setCurrentStep(1); // Reset do wizard
    // Recarregar dados após criar nova encomenda
    loadStats();
    loadEncomendas();
    setRefreshTrigger(prev => prev + 1); // Incrementar trigger para forçar atualização
  };

  const loadStats = async () => {
    computeStatsFromVisible(applyVisibilityFilter(encomendas));
  };

  useEffect(() => {
    loadEncomendas();
  }, []);

  return (
    <Layout>
      <div className="p-6">
        <div className="w-full space-y-6">
          {/* Cabeçalho */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-heading">
                Módulo de Encomendas
              </h1>
              <p className="text-foreground-secondary">
                Gestão completa de encomendas, malotes e rastreamento
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                className={`${classes.buttonSecondary} text-white gap-2`}
                onClick={() => setShowRastreamento(true)}
              >
                <QrCode className="w-4 h-4" />
                Rastrear
              </Button>
              <Button 
                className={`${classes.button} text-white gap-2`}
                onClick={() => setShowNovaEncomenda(true)}
              >
                <Plus className="w-4 h-4" />
                Nova Encomenda
              </Button>
            </div>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="card-govto">
                  <CardContent className="flex items-center justify-between p-6">
                    <div>
                      <p className="text-sm text-foreground-secondary font-medium">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-foreground font-heading mt-1">
                        {stat.value}
                      </p>
                    </div>
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Filtros e Busca */}
          <Card className="card-govto">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-muted w-4 h-4" />
                    <Input
                      placeholder="Pesquisar por código, destinatário ou descrição..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Status</SelectItem>
                      <SelectItem value="transito">Em Trânsito</SelectItem>
                      <SelectItem value="entregue">Entregue</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* Botões de Visualização */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMapaModal(true)}
                    className="gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    Ver Mapa Geral
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMapaMalotes(true)}
                    className="gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    Mapa de Malotes
                  </Button>
                  {isAdminUser() && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRotaOtima(true)}
                      className="gap-2"
                    >
                      <Route className="w-4 h-4" />
                      Rota Otimizada
                    </Button>
                  )}
                  <div className="flex border rounded-md">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-r-none border-r"
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-l-none"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conteúdo Principal */}
          <div className="space-y-6">
            <ListaEncomendas 
                  searchTerm={searchTerm} 
                  statusFilter={statusFilter} 
                  viewMode={viewMode} 
                  refreshTrigger={refreshTrigger}
                  onTrack={handleTrackWithCode}
            />
          </div>
        </div>

        {/* Modal do Mapa Geral */}
        <MapModal
          isOpen={showMapaModal}
          onClose={() => setShowMapaModal(false)}
          title="Mapa Geral das Encomendas"
          size="large"
        >
          <MapaGeralEncomendas 
            encomendas={encomendas} 
            isVisible={true}
            refreshTrigger={refreshTrigger}
          />
        </MapModal>

        {/* Modal do Mapa de Malotes */}
        <MapModal
          isOpen={showMapaMalotes}
          onClose={() => setShowMapaMalotes(false)}
          title="Mapa Geral de Malotes"
          size="large"
        >
          <MapaGeralMalotes isVisible={true} refreshTrigger={refreshTrigger} />
        </MapModal>

        {/* Modal da Rota Otimizada */}
        <MapModal
          isOpen={showRotaOtima}
          onClose={() => setShowRotaOtima(false)}
          title="Cálculo de Rota Otimizada"
          size="large"
        >
          <MapaRotaOtimaEncomendas 
            encomendas={encomendas} 
            isVisible={showRotaOtima}
            refreshTrigger={refreshTrigger}
          />
        </MapModal>

        {/* Modal Nova Encomenda */}
        {showNovaEncomenda && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[95vh] flex flex-col">
              {/* Cabeçalho fixo com navegação do wizard */}
              <div className="flex-shrink-0 bg-white p-4 rounded-t-lg relative">
                {/* Botão X discreto no canto superior direito */}
                <button
                  onClick={() => {
                    setShowNovaEncomenda(false);
                    setCurrentStep(1);
                  }}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="pr-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Nova Encomenda</h2>
                </div>
                
                {/* Barra de progresso */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Passo {currentStep} de {totalSteps}</span>
                    <span>{Math.round((currentStep / totalSteps) * 100)}% concluído</span>
                  </div>
                  <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
                </div>
                
                {/* Indicadores de passos */}
                <div className="flex justify-between mb-4">
                  {[
                    { number: 1, title: "Dados Básicos" },
                    { number: 2, title: "Remetente e Destinatário" },
                    { number: 3, title: "Descrição da Encomenda" },
                    { number: 4, title: "Confirmação" }
                  ].map((step) => (
                    <div key={step.number} className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        currentStep > step.number 
                          ? 'bg-green-500 text-white' 
                          : currentStep === step.number 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-600'
                      }`}>
                        {currentStep > step.number ? <Check className="w-4 h-4" /> : step.number}
                      </div>
                      <span className="text-xs text-gray-600 mt-1 text-center">{step.title}</span>
                    </div>
                  ))}
                </div>
                
                {/* Botões de navegação */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (wizardRef.current?.handlePrevious) {
                        wizardRef.current.handlePrevious();
                      } else {
                        setCurrentStep(Math.max(1, currentStep - 1));
                      }
                    }}
                    disabled={currentStep === 1}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </Button>
                  
                  <Button
                    onClick={async () => {
                      if (currentStep === totalSteps) {
                        // No último passo, executar a função de conclusão
                        handleNovaEncomendaSuccess();
                      } else if (wizardRef.current?.handleNext) {
                        await wizardRef.current.handleNext();
                      } else if (currentStep < totalSteps) {
                        setCurrentStep(currentStep + 1);
                      }
                    }}
                    disabled={false}
                    className="gap-2"
                  >
                    {currentStep === totalSteps ? 'Concluir' : 'Próximo'}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <NovaEncomendaWizard 
                  onSuccess={handleNovaEncomendaSuccess}
                  currentStep={currentStep}
                  onStepChange={setCurrentStep}
                  ref={wizardRef}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal Rastreamento com Mapa */}
        <MapaRastreamento 
          isOpen={showRastreamento}
          onClose={() => {
            setShowRastreamento(false);
            setCodigoRastreamentoInicial('');
          }}
          codigoInicial={codigoRastreamentoInicial}
        />
      </div>
    </Layout>
  );
};

export default Encomendas;