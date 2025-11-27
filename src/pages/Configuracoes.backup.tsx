import React, { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import Layout from "@/components/layout/Layout";
import { useModuleTheme } from "@/lib/theme-config";
import { useAuth } from "@/contexts/AuthContext";
import { formatMatriculaVinculo, getProfileBadgeClass, normalizeText, formatDatePTBR } from "@/lib/utils";
import { useNotification } from '@/hooks/use-notification';
import NotificationModal from '@/components/ui/notification-modal';
import LdapTestModal from '@/components/ui/ldap-test-modal';
import { useCepSearch } from "@/hooks/useCepSearch";
import { GeocodingService } from "@/services/geocoding.service";
import MapaSetor from "@/components/ui/MapaSetor";
import MapaGeralSetores from "@/components/configuracoes/MapaGeralSetores";
import MapaGeralUsuarios from "@/components/configuracoes/MapaGeralUsuarios";
import MapModal from "@/components/ui/MapModal";
import NovoUsuarioWizard from "@/components/usuarios/NovoUsuarioWizard";
import MapaMalote from "@/components/malotes/MapaMalote";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ExpandableCard from "@/components/ui/expandable-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ImageUploadEditor from "@/components/ui/image-upload-editor";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Shield,
  Bell,
  Database,
  Mail,
  Palette,
  Save,
  RefreshCw,
  Users,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Search,
  Filter,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  RotateCcw,
  Grid3X3,
  List,
  Building2,
  Phone,
  Eye,
  EyeOff,
  Key,
  FileText,
  Check,
  MailMinusIcon,
  X,
  Info,
  AlertCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const Configuracoes = () => {
  const { notification, isOpen, showError, showSuccess, showInfo, showWarning, hideNotification } = useNotification();
  const { searchCep, loading: cepLoading, error: cepError, clearError } = useCepSearch();
  const [usuariosData, setUsuariosData] = useState<any[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  // Util compartilhado: formatMatriculaVinculo (importado de lib/utils)

  // Padronização de cores de perfil: getProfileBadgeClass (importado de lib/utils)

  // Estados para Setores
  const [setoresData, setSetoresData] = useState<any[]>([]);
  const [loadingSetores, setLoadingSetores] = useState(false);
  const [showCreateSetorModal, setShowCreateSetorModal] = useState(false);
  const [showEditSetorModal, setShowEditSetorModal] = useState(false);
  const [isViewModeSetor, setIsViewModeSetor] = useState(false);
  const [selectedSetor, setSelectedSetor] = useState<any>(null);
  const [setorFormData, setSetorFormData] = useState({
    codigoSetor: '',
    nomeSetor: '',
    orgao: '',
    telefone: '',
    email: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    latitude: null as number | null,
    longitude: null as number | null,
    semNumero: false,
    ativo: true
  });
  const [manualAddressEdit, setManualAddressEdit] = useState(false);

  // Estado para rastrear coordenadas de fallback nos modais
  const [isFallbackCoordinatesModal, setIsFallbackCoordinatesModal] = useState(false);

  // Estados para Malotes
  const [loadingMalotes, setLoadingMalotes] = useState(false);

  // Estados para Lacres
  const [lacreForm, setLacreForm] = useState({ prefixo: 'LACRE', inicio: 1, fim: undefined as number | undefined, loteNumero: '' });
  const [lacreList, setLacreList] = useState<any[]>([]);
  const [lacreLoading, setLacreLoading] = useState(false);
  const [lacreFilters, setLacreFilters] = useState({ status: 'todos', setorId: 'todos', busca: '' });
  const [distFormLacre, setDistFormLacre] = useState<{ setorId: string; quantidade: number; modo: 'manual' | 'auto' }>({ setorId: '', quantidade: 0, modo: 'manual' });
  // No modo automático, armazenar múltiplos setores selecionados
  const [distAutoSetores, setDistAutoSetores] = useState<string[]>([]);
  const [distSetoresSearch, setDistSetoresSearch] = useState("");
  const [distSetoresPage, setDistSetoresPage] = useState(1);
  const distSetoresPerPage = 10;
  const [currentPageLacre, setCurrentPageLacre] = useState(1);
  const [itemsPerPageLacre] = useState(24);
  // Paginação Kanban: 5 itens por página em cada seção
  const itemsPerPageKanban = 5;
  const [kanbanDisponiveisPage, setKanbanDisponiveisPage] = useState(1);
  const [kanbanAtribuidosPage, setKanbanAtribuidosPage] = useState(1);
  const [kanbanUtilizadosPage, setKanbanUtilizadosPage] = useState(1);
  const [kanbanDestruidosLotePage, setKanbanDestruidosLotePage] = useState(1);
  const [kanbanDestruidosIndividuaisPage, setKanbanDestruidosIndividuaisPage] = useState(1);
  const [kanbanDestruidosTab, setKanbanDestruidosTab] = useState<'lote' | 'individual'>('lote');
  const [showGerarLacresModal, setShowGerarLacresModal] = useState(false);
  const [showDistribuirLacresModal, setShowDistribuirLacresModal] = useState(false);
  const [distWizardStep, setDistWizardStep] = useState<number>(1);
  const [showDestruirLacresModal, setShowDestruirLacresModal] = useState(false);
  const [showDestruirLacreIndividualModal, setShowDestruirLacreIndividualModal] = useState(false);
  const [showVisualizarLacreModal, setShowVisualizarLacreModal] = useState(false);
  const [showEditarLacreModal, setShowEditarLacreModal] = useState(false);
  const [lacreSelecionado, setLacreSelecionado] = useState<any | null>(null);
  const [editFormLacre, setEditFormLacre] = useState<{ status: string; setorId: string }>({ status: '', setorId: '' });
  // Controle de expansão dos grupos de setores no Kanban Atribuídos
  const [expandedAtribuidosSetores, setExpandedAtribuidosSetores] = useState<Record<string, boolean>>({});
  // Controle de expansão dos grupos de setores no Kanban Utilizados
  const [expandedUtilizadosSetores, setExpandedUtilizadosSetores] = useState<Record<string, boolean>>({});
  const [destruirFormLacre, setDestruirFormLacre] = useState<{ loteNumero: string; motivo: string }>({ loteNumero: '', motivo: '' });
  const [destruirIndividualForm, setDestruirIndividualForm] = useState<{ motivo: string; status: 'destruido' | 'extraviado' | 'danificado' }>({ motivo: '', status: 'destruido' });
  const [openDestruirLoteCombo, setOpenDestruirLoteCombo] = useState(false);

  // Carregar lacres do backend
  const fetchLacres = async () => {
    try {
      setLacreLoading(true);
      const resp = await api.listLacres({ page: 1, limit: 1000 });
      const data = (resp as any)?.data?.data ?? (resp as any)?.data ?? [];
      setLacreList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar lacres:', error);
      showError('Erro ao carregar lacres', 'Não foi possível carregar a lista de lacres.');
    } finally {
      setLacreLoading(false);
    }
  };

  useEffect(() => {
    fetchLacres();
  }, []);

  useEffect(() => {
    if (showDistribuirLacresModal) {
      setDistWizardStep(1);
    }
  }, [showDistribuirLacresModal]);

  // Ao abrir o modal de destruição, tentar pré-preencher o número do lote
  useEffect(() => {
    if (showDestruirLacresModal) {
      let inicial = '';
      if (lacreSelecionado?.loteNumero) {
        inicial = String(lacreSelecionado.loteNumero);
      } else {
        // Encontrar lotes elegíveis (nenhum lacre distribuído/vinculado)
        const porLote: Record<string, { total: number; distribuidos: number }> = {};
        for (const l of lacreList) {
          const lote = String(l.loteNumero || '').trim();
          if (!lote) continue;
          if (!porLote[lote]) porLote[lote] = { total: 0, distribuidos: 0 };
          porLote[lote].total++;
          const distribuido = (l.status && l.status !== 'disponivel') || (l.setorId != null && String(l.setorId) !== '') || (l.encomendaId != null && String(l.encomendaId) !== '');
          if (distribuido) porLote[lote].distribuidos++;
        }
        const lotesElegiveis = Object.keys(porLote).filter(k => porLote[k].total > 0 && porLote[k].distribuidos === 0);
        if (lotesElegiveis.length === 1) {
          inicial = lotesElegiveis[0];
        }
      }
      if (inicial && !String(destruirFormLacre.loteNumero || '').trim()) {
        setDestruirFormLacre(prev => ({ ...prev, loteNumero: inicial }));
      }
    }
  }, [showDestruirLacresModal, lacreSelecionado, lacreList]);

  // Lotes elegíveis para seleção no combobox
  const lotesElegiveis = useMemo(() => {
    const porLote: Record<string, { total: number; distribuidos: number }> = {};
    for (const l of lacreList) {
      const lote = String(l.loteNumero || '').trim();
      if (!lote) continue;
      if (!porLote[lote]) porLote[lote] = { total: 0, distribuidos: 0 };
      porLote[lote].total++;
      const distribuido = (l.status && l.status !== 'disponivel') || (l.setorId != null && String(l.setorId) !== '') || (l.encomendaId != null && String(l.encomendaId) !== '');
      if (distribuido) porLote[lote].distribuidos++;
    }
    return Object.entries(porLote)
      .filter(([_, v]) => v.total > 0 && v.distribuidos === 0)
      .map(([lote, v]) => ({ lote, total: v.total }));
  }, [lacreList]);

  const disponiveisCount = useMemo(() => lacreList.filter(l => l.status === 'disponivel').length, [lacreList]);

  // Garantir que, no modo manual, a quantidade seja pré-preenchida com os disponíveis
  useEffect(() => {
    if (distWizardStep === 3 && distFormLacre.modo === 'manual') {
      const qtdAtual = Number(distFormLacre.quantidade) || 0;
      let qtdDesejada = qtdAtual;
      // Se vazio/zero, usar disponíveis (no mínimo 1)
      if (qtdAtual <= 0) {
        qtdDesejada = Math.max(1, disponiveisCount || 1);
      }
      // Se exceder os disponíveis, ajustar para o máximo permitido
      if (qtdAtual > disponiveisCount) {
        qtdDesejada = Math.max(1, disponiveisCount || 1);
      }
      if (qtdDesejada !== qtdAtual) {
        setDistFormLacre(prev => ({ ...prev, quantidade: qtdDesejada }));
      }
    }
  }, [distWizardStep, distFormLacre.modo, distFormLacre.quantidade, disponiveisCount]);

  const avancarWizardDistribuicao = () => {
    // Etapa 1 → sempre vai para setores
    if (distWizardStep === 1) {
      if (!distFormLacre.modo) { showError('Modo obrigatório', 'Selecione o modo de distribuição.'); return; }
      setDistWizardStep(2);
      return;
    }
    // Etapa 2 → validação depende do modo
    if (distWizardStep === 2) {
      if (distFormLacre.modo === 'manual') {
        if (!distFormLacre.setorId) { showError('Setor obrigatório', 'Selecione o setor para distribuição manual.'); return; }
        setDistWizardStep(3);
        return;
      } else {
        if (!Array.isArray(distAutoSetores) || distAutoSetores.length < 2) {
          showError('Seleção de setores', 'Selecione pelo menos 2 setores para distribuição automática.');
          return;
        }
        // Pular quantidade no automático
        setDistWizardStep(4);
        return;
      }
    }
    // Etapa 3 (apenas manual) → valida quantidade
    if (distWizardStep === 3) {
      const qtd = Number(distFormLacre.quantidade);
      if (isNaN(qtd) || qtd <= 0) { showError('Quantidade inválida', 'Informe uma quantidade válida.'); return; }
      if (qtd > disponiveisCount) { showWarning('Quantidade ajustada', 'Quantidade excede os disponíveis. Ajuste o valor.'); return; }
      setDistWizardStep(4);
      return;
    }
  };

  const voltarWizardDistribuicao = () => {
    // Ajuste para fluxo automático pular a quantidade
    if (distWizardStep === 4) {
      if (distFormLacre.modo === 'auto') { setDistWizardStep(2); return; }
      setDistWizardStep(3); return;
    }
    setDistWizardStep(prev => Math.max(1, prev - 1));
  };

  // Controle de permissões do usuário
  const { user } = useAuth();
  const isAdmin = useMemo(() => {
    const role = String((user as any)?.ROLE || (user as any)?.role || (user as any)?.cargo || (user as any)?.perfil || '').toUpperCase();
    return ['ADMINISTRADOR', 'ADMIN', 'GERENTE'].includes(role);
  }, [user]);

  // Lista filtrada de lacres conforme busca, status e setor
  const filteredLacres = useMemo(() => {
    let list = [...lacreList];
    const term = (lacreFilters.busca || '').toLowerCase();
    if (term) {
      list = list.filter((l) => {
        const codigo = String(l.codigo || '').toLowerCase();
        const setor = String(l.setorNome || '').toLowerCase();
        return codigo.includes(term) || setor.includes(term);
      });
    }
    if (lacreFilters.status && lacreFilters.status !== 'todos') {
      list = list.filter((l) => l.status === lacreFilters.status);
    }
    if (lacreFilters.setorId && lacreFilters.setorId !== 'todos') {
      list = list.filter((l) => String(l.setorId || '') === String(lacreFilters.setorId));
    }
    // Reset de paginações Kanban ao mudar filtros
    setKanbanDisponiveisPage(1);
    setKanbanAtribuidosPage(1);
    setKanbanUtilizadosPage(1);
    setKanbanDestruidosLotePage(1);
    setKanbanDestruidosIndividuaisPage(1);
    return list;
  }, [lacreList, lacreFilters]);

  const lacreStatusLabels: Record<string, string> = {
    disponivel: 'DISPONÍVEL',
    atribuido: 'ATRIBUÍDO',
    reservado: 'RESERVADO',
    vinculado: 'VINCULADO',
    utilizado: 'UTILIZADO',
    extraviado: 'EXTRAVIADO',
    danificado: 'DANIFICADO',
    destruido: 'DESTRUÍDO'
  };

  const lacreValidTransitions: Record<string, string[]> = {
    disponivel: ['atribuido', 'reservado', 'vinculado', 'danificado', 'extraviado', 'destruido'],
    reservado: ['vinculado', 'disponivel'],
    atribuido: ['vinculado', 'disponivel'],
    vinculado: ['utilizado', 'extraviado', 'danificado'],
    utilizado: [],
    extraviado: ['destruido'],
    danificado: ['destruido'],
    destruido: []
  };

  // Label de status contextual: exibe "ATRIBUÍDO" quando status=reservado e tem setor atribuído
  const getLacreStatusLabel = (l: any): string => {
    const st = String(l?.status || '').toLowerCase();
    switch (st) {
      case 'disponivel': return 'DISPONÍVEL';
      case 'atribuido': return 'ATRIBUÍDO';
      case 'reservado': return (l?.setorId != null && String(l?.setorId) !== '') ? 'ATRIBUÍDO' : 'RESERVADO';
      case 'vinculado': return 'VINCULADO';
      case 'utilizado': return 'UTILIZADO';
      case 'extraviado': return 'EXTRAVIADO';
      case 'danificado': return 'DANIFICADO';
      case 'destruido': return 'DESTRUÍDO';
      default: return String(st);
    }
  };

  // Util: extrai a parte numérica de um código de lacre (últimos dígitos)
  const getNumeroDoCodigo = (codigo: any): number => {
    const str = String(codigo || '').trim();
    const m = str.match(/(\d+)\s*$/);
    return m ? Number(m[1]) : NaN;
  };

  // Util: encontra o último número existente para um prefixo informado
  const getUltimoNumeroPorPrefixo = (prefixo: string): number => {
    const pref = String(prefixo || '').toUpperCase().trim();
    let max = 0;
    for (const l of lacreList) {
      const codigo = String(l.codigo || l.CODIGO || '').toUpperCase();
      if (!pref || codigo.startsWith(pref)) {
        const n = getNumeroDoCodigo(codigo);
        if (!isNaN(n) && n > max) max = n;
      }
    }
    return max; // 0 se nenhum encontrado
  };

  // Ajusta automaticamente o início ao abrir o modal ou ao trocar prefixo
  useEffect(() => {
    if (showGerarLacresModal) {
      const ultimo = getUltimoNumeroPorPrefixo(lacreForm.prefixo);
      const sugerido = ultimo > 0 ? ultimo + 1 : 1;
      setLacreForm(prev => ({ ...prev, inicio: sugerido }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGerarLacresModal]);

  // Ao trocar o prefixo, sugerimos o próximo número válido
  useEffect(() => {
    if (showGerarLacresModal) {
      const ultimo = getUltimoNumeroPorPrefixo(lacreForm.prefixo);
      const sugerido = ultimo > 0 ? ultimo + 1 : 1;
      setLacreForm(prev => ({ ...prev, inicio: sugerido }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lacreForm.prefixo]);

  const gerarLacres = async () => {
    try {
      const inicio = Number(lacreForm.inicio);
      let fim = (typeof lacreForm.fim === 'number' && !isNaN(lacreForm.fim)) ? lacreForm.fim : inicio;
      let prefixo = String(lacreForm.prefixo || '').trim();

      // Fallback para prefixo vazio
      if (!prefixo) {
        prefixo = 'LACRE';
        setLacreForm(prev => ({ ...prev, prefixo }));
      }

      // Validar número inicial
      if (isNaN(inicio)) {
        showError('Dados inválidos', 'Número inicial inválido.');
        return;
      }

      // Ajustar Fim automaticamente quando inválido ou menor que Início
      if (isNaN(fim) || fim < inicio) {
        fim = inicio;
        setLacreForm(prev => ({ ...prev, fim: inicio }));
      }

      // Regra: permitir gerar apenas a partir do primeiro número na sequência ao existente
      const ultimo = getUltimoNumeroPorPrefixo(prefixo);
      const proximoEsperado = ultimo > 0 ? ultimo + 1 : 1;
      if (inicio !== proximoEsperado) {
        showWarning('Sequência inválida', `O início deve ser ${proximoEsperado}. Ajuste o intervalo.`);
        setLacreForm(prev => ({
          ...prev,
          inicio: proximoEsperado,
          fim: (typeof prev.fim === 'number' && !isNaN(prev.fim) && prev.fim >= proximoEsperado) ? prev.fim : proximoEsperado
        }));
        return;
      }

      // Validação adicional: prevenir duplicidade no intervalo solicitado
      const numerosExistentes = new Set<number>();
      for (const l of lacreList) {
        const codigo = String(l.codigo || l.CODIGO || '').toUpperCase();
        if (prefixo && codigo.startsWith(prefixo.toUpperCase())) {
          const n = getNumeroDoCodigo(codigo);
          if (!isNaN(n)) numerosExistentes.add(n);
        }
      }
      for (let n = inicio; n <= fim; n++) {
        if (numerosExistentes.has(n)) {
          showError('Intervalo conflitante', `O número ${n} já existe para o prefixo ${prefixo}.`);
          return;
        }
      }

      await api.generateLacres({ prefixo, inicio, fim, loteNumero: lacreForm.loteNumero });
      await fetchLacres();
      showSuccess('Lacres gerados', `Intervalo ${inicio}–${fim} processado com sucesso.`);
    } catch (e) {
      console.error('Erro ao gerar lacres', e);
      showError('Erro', 'Falha ao gerar lacres.');
    }
  };

  const distribuirLacresManual = async () => {
    if (!distFormLacre.setorId) {
      showError('Setor obrigatório', 'Selecione o setor para distribuir.');
      return;
    }
    const qtd = Number(distFormLacre.quantidade);
    if (isNaN(qtd) || qtd <= 0) {
      showError('Quantidade inválida', 'Informe uma quantidade válida.');
      return;
    }
    try {
      await api.distribuirLacresManual({ setorId: distFormLacre.setorId, quantidade: qtd });
      await fetchLacres();
      showSuccess('Distribuição realizada', `Distribuição manual concluída para o setor.`);
    } catch (error) {
      console.error('Erro ao distribuir lacres manualmente:', error);
      showError('Erro', 'Falha ao distribuir lacres manualmente.');
    }
  };

  const distribuirLacresAuto = async () => {
    if (!Array.isArray(setoresData) || setoresData.length === 0) {
      showError('Sem setores', 'Carregue os setores antes da distribuição automática.');
      return;
    }
    const setoresSelecionados = (Array.isArray(distAutoSetores) ? distAutoSetores : []).filter(Boolean);
    if (setoresSelecionados.length < 2) {
      showError('Seleção insuficiente', 'Selecione pelo menos 2 setores para distribuição automática.');
      return;
    }
    try {
      const setorIdsNum = setoresSelecionados.map((s) => Number(s)).filter((v) => !!v);
      await api.distribuirLacresAuto({ setorIds: setorIdsNum, totalLacres: null });
      await fetchLacres();
      showSuccess('Distribuição automática', `Distribuição concluída entre ${setoresSelecionados.length} setores.`);
    } catch (error) {
      console.error('Erro na distribuição automática:', error);
      showError('Erro', 'Falha ao distribuir lacres automaticamente.');
    }
  };

  // Plano de distribuição automática (tratamento de divisão não inteira)
  const calcularDistribuicaoAutomatica = (totalLacres: number, setoresSelecionados: string[]) => {
    const k = setoresSelecionados.length;
    if (k === 0) return [] as { setorId: string, quantidade: number }[];
    const base = Math.floor(totalLacres / k);
    const resto = totalLacres % k;
    return setoresSelecionados.map((setorId, idx) => ({
      setorId,
      quantidade: base + (idx < resto ? 1 : 0)
    }));
  };

  const aplicarTransicaoLacre = (lacreId: string, novoStatus: string) => {
    setLacreList(prev => prev.map(l => {
      if (l.id !== lacreId) return l;
      const permitidos = lacreValidTransitions[l.status] || [];
      if (!permitidos.includes(novoStatus)) {
        showError('Transição inválida', `Não é possível mover de ${getLacreStatusLabel(l)} para ${lacreStatusLabels[novoStatus] || novoStatus}.`);
        return l;
      }
      return {
        ...l,
        status: novoStatus,
        historico: [...l.historico, { data: new Date().toISOString(), acao: 'status', detalhes: `${getLacreStatusLabel(l)} → ${lacreStatusLabels[novoStatus]}` }]
      };
    }));
  };

  const vincularLacreAEncomenda = async (lacreId: string) => {
    const encomendaId = window.prompt('Informe o ID da encomenda para vincular:');
    if (!encomendaId) return;
    try {
      await api.updateLacre(lacreId, { status: 'vinculado', encomendaId: Number(encomendaId) });
      await fetchLacres();
      showSuccess('Lacre vinculado', `Lacre vinculado à encomenda ${encomendaId}.`);
    } catch (error) {
      console.error('Erro ao vincular lacre à encomenda:', error);
      showError('Erro', 'Falha ao vincular lacre à encomenda.');
    }
  };

  const destruirLacre = async (lacreId: string) => {
    const motivo = window.prompt('Informe o motivo da destruição:');
    if (!motivo) return;
    try {
      await api.updateLacre(lacreId, { status: 'destruido', motivoDestruicao: motivo });
      await fetchLacres();
      showSuccess('Lacre destruído', 'O lacre foi destruído.');
    } catch (error) {
      console.error('Erro ao destruir lacre:', error);
      showError('Erro', 'Falha ao destruir lacre.');
    }
  };

  const destruirLacresPorLote = async () => {
    try {
      const loteAlvo = String(destruirFormLacre.loteNumero || '').trim();
      const motivo = String(destruirFormLacre.motivo || '').trim();
      if (!loteAlvo) { showError('Lote obrigatório', 'Informe o número do lote a ser destruído.'); return; }

      // Validação local: impedir destruição se houver lacres distribuídos/vinculados
      const lacresDoLote = lacreList.filter(l => String(l.loteNumero || '') === loteAlvo);
      if (lacresDoLote.length === 0) {
        showWarning('Lote não encontrado', 'Nenhum lacre do lote informado foi carregado na listagem.');
        return;
      }
      const possuiDistribuidos = lacresDoLote.some(l => (l.status && l.status !== 'disponivel') || (l.setorId != null && String(l.setorId) !== '') || (l.encomendaId != null && String(l.encomendaId) !== ''));
      if (possuiDistribuidos) {
        showError('Destruição não permitida', 'Este lote contém lacres já distribuídos ou vinculados.');
        return;
      }
      await api.destruirLacresPorLote({ loteNumero: loteAlvo, motivo });
      setShowDestruirLacresModal(false);
      setDestruirFormLacre({ loteNumero: '', motivo: '' });
      await fetchLacres();
      showSuccess('Destruição concluída', `Lacres do lote ${loteAlvo} marcados como destruídos.`);
    } catch (e) {
      console.error('Erro ao destruir lacres por lote', e);
      showError('Erro', 'Falha ao destruir lacres em lote.');
    }
  };

  const openEditarLacre = (lacre: any) => {
    try {
      if (!isAdmin) {
        showError('Permissão negada', 'Apenas administradores podem editar lacres.');
        return;
      }
      setLacreSelecionado(lacre);
      setEditFormLacre({ status: String(lacre.status || ''), setorId: String(lacre.setorId || '') });
      setShowEditarLacreModal(true);
    } catch (e) {
      console.error('Erro ao abrir edição do lacre:', e);
      showError('Erro', 'Não foi possível abrir o modal de edição.');
    }
  };

  const salvarEdicaoLacre = async () => {
    try {
      if (!isAdmin) {
        showError('Permissão negada', 'Apenas administradores podem salvar alterações em lacres.');
        return;
      }
      if (!lacreSelecionado) return;

      const atual = lacreSelecionado as any;
      const novoStatus = String(editFormLacre.status || atual.status);
      const setorId = String(editFormLacre.setorId || '');

      // Validar transição de status
      if (novoStatus !== atual.status) {
        const permitidos = lacreValidTransitions[atual.status] || [];
        if (!permitidos.includes(novoStatus)) {
          showError('Transição inválida', `Não é possível mover de ${getLacreStatusLabel(atual)} para ${lacreStatusLabels[novoStatus] || novoStatus}.`);
          return;
        }
      }

      // Atualizar dados do setor, se informado
      let novoSetorNome: string | null = atual.setorNome || null;
      if (setorId && Array.isArray(setoresData)) {
        const setor = setoresData.find((s: any) => String(s.ID) === String(setorId));
        novoSetorNome = setor ? (setor.NOME_SETOR || setor.SETOR || null) : null;
      } else if (!setorId) {
        novoSetorNome = null;
      }

      await api.updateLacre(atual.id, { status: novoStatus, setorId: setorId ? Number(setorId) : null });
      setShowEditarLacreModal(false);
      setLacreSelecionado(null);
      await fetchLacres();
      showSuccess('Lacre atualizado', 'Alterações salvas com sucesso.');
    } catch (e) {
      console.error('Erro ao salvar edição de lacre:', e);
      showError('Erro', 'Não foi possível salvar as alterações.');
    }
  };

  const fetchUsuarios = async () => {
    try {
      setLoadingUsuarios(true);

      // Carregar TODOS os usuários do banco de dados
      let allUsers: any[] = [];
      let page = 1;
      let hasMorePages = true;

      console.log('🔄 Iniciando carregamento de TODOS os usuários...');

      while (hasMorePages) {
        console.log(`📄 Carregando página ${page} (limite: 100 por página)...`);

        const response = await api.get('/users/with-org-data', {
          limit: 100,
          page: page
        });

        if (response.data.success && response.data.data) {
          const pageData = response.data.data;
          const pagination = response.data.pagination;

          console.log(`📄 Página ${page}:`, {
            usuariosRecebidos: pageData.length,
            totalAcumulado: allUsers.length + pageData.length,
            paginacao: pagination
          });

          // Adicionar usuários desta página ao total
          allUsers = [...allUsers, ...pageData];

          // Verificar se há mais páginas usando múltiplos critérios
          if (pagination && pagination.totalPages) {
            // Se temos informação de paginação, usar ela
            hasMorePages = page < pagination.totalPages;
            console.log(`📊 Paginação: ${page}/${pagination.totalPages} páginas`);
          } else if (pageData.length < 100) {
            // Se recebemos menos que o limite, é a última página
            hasMorePages = false;
            console.log(`📄 Última página detectada (${pageData.length} < 100)`);
          } else {
            // Se recebemos exatamente 100, pode haver mais páginas
            hasMorePages = true;
            console.log(`📄 Página completa (${pageData.length}), verificando próxima...`);
          }

          page++;

          // Proteção contra loop infinito (máximo 50 páginas = 5000 usuários)
          if (page > 50) {
            console.warn('⚠️ Limite de segurança atingido (50 páginas), parando...');
            hasMorePages = false;
          }

        } else {
          console.error(`❌ Erro na resposta da página ${page}:`, response.data);
          hasMorePages = false;
        }
      }

      console.log('✅ CARREGAMENTO COMPLETO!');
      console.log(`🎯 TOTAL DE USUÁRIOS CARREGADOS: ${allUsers.length}`);
      console.log(`👥 USUÁRIOS ADMIN: ${allUsers.filter((u: any) => (u.ROLE || '').toUpperCase() === 'ADMIN').length}`);
      console.log(`👤 USUÁRIOS NÃO-ADMIN: ${allUsers.filter((u: any) => (u.ROLE || '').toUpperCase() !== 'ADMIN').length}`);

      // Verificar se temos todos os usuários esperados
      if (allUsers.length >= 1950) {
        console.log('✅ Quantidade de usuários parece correta!');
      } else {
        console.warn(`⚠️ Quantidade de usuários (${allUsers.length}) pode estar abaixo do esperado`);
      }

      setUsuariosData(allUsers);

    } catch (error) {
      console.error("❌ Erro ao carregar usuários:", error);
      setUsuariosData([]);
      showError("Erro ao carregar usuários", "Não foi possível carregar a lista de usuários. Tente recarregar a página.");
    } finally {
      setLoadingUsuarios(false);
    }
  };

  // -----------------------------
  // Funções para Setores
  // -----------------------------
  const fetchSetores = async () => {
    try {
      setLoadingSetores(true);
      // Passando limit=1000 para carregar todos os registros
      const response = await api.get('/setores', { limit: 1000, ativo: 'all' });
      console.log('Resposta da API de setores:', response.data);
      const data = response.data.success ? response.data.data : response.data;
      setSetoresData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar setores:', error);
      setSetoresData([]);
      showError("Erro ao carregar setores", "Não foi possível carregar a lista de setores.");
    } finally {
      setLoadingSetores(false);
    }
  };

  const resetSetorForm = () => {
    setSetorFormData({
      codigoSetor: '',
      nomeSetor: '',
      orgao: '',
      telefone: '',
      email: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      latitude: null,
      longitude: null,
      semNumero: false,
      ativo: true
    });
    setManualAddressEdit(false);
  };

  const handleSetorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Aplicar formatações específicas para cada campo
    if (name === 'codigoSetor') {
      // Código do Setor: máximo 12 caracteres (013.AGEATANN)
      const cleanValue = value.replace(/[^A-Za-z0-9.]/g, '').toUpperCase();
      const limitedValue = cleanValue.slice(0, 12);
      setSetorFormData(prev => ({ ...prev, [name]: limitedValue }));
    } else if (name === 'cep') {
      // CEP: formatação 77001-908 (9 caracteres)
      const cleanCep = value.replace(/\D/g, '');
      const limitedCep = cleanCep.slice(0, 8);
      const maskedCep = limitedCep.replace(/(\d{5})(\d{3})/, '$1-$2');
      setSetorFormData(prev => ({ ...prev, [name]: maskedCep }));

      // Buscar automaticamente quando CEP tiver 8 dígitos
      if (limitedCep.length === 8) {
        handleCepSearch(limitedCep);
      }
    } else if (name === 'telefone') {
      // Telefone: formatação (63) 1234-1234 (14 caracteres)
      const cleanPhone = value.replace(/\D/g, '');
      const limitedPhone = cleanPhone.slice(0, 10);
      let maskedPhone = '';

      if (limitedPhone.length > 0) {
        if (limitedPhone.length <= 2) {
          maskedPhone = `(${limitedPhone}`;
        } else if (limitedPhone.length <= 6) {
          maskedPhone = `(${limitedPhone.slice(0, 2)}) ${limitedPhone.slice(2)}`;
        } else {
          maskedPhone = `(${limitedPhone.slice(0, 2)}) ${limitedPhone.slice(2, 6)}-${limitedPhone.slice(6)}`;
        }
      }

      setSetorFormData(prev => ({ ...prev, [name]: maskedPhone }));
    } else {
      setSetorFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCepSearch = async (cep: string) => {
    clearError();

    try {
      // Primeiro, usar o GeocodingService para obter coordenadas
      const geocodingResult = await GeocodingService.geocodeByCep(cep);

      // Depois, buscar dados do endereço via useCepSearch
      const cepData = await searchCep(cep);

      if (cepData) {
        let latitude = null;
        let longitude = null;

        // PRIORIDADE 1: Usar coordenadas do GeocodingService se disponíveis
        if (geocodingResult.coordenadas) {
          latitude = geocodingResult.coordenadas.lat;
          longitude = geocodingResult.coordenadas.lng;
          console.log('✅ Coordenadas obtidas via GeocodingService:', geocodingResult.coordenadas);
        }
        // PRIORIDADE 2: Verificar se o useCepSearch (BrasilAPI) retornou coordenadas válidas
        else if (cepData.location?.coordinates &&
          cepData.location.coordinates.latitude !== 'N/A' &&
          cepData.location.coordinates.longitude !== 'N/A' &&
          cepData.location.coordinates.latitude !== '0' &&
          cepData.location.coordinates.longitude !== '0') {
          latitude = parseFloat(cepData.location.coordinates.latitude);
          longitude = parseFloat(cepData.location.coordinates.longitude);
          console.log('✅ Coordenadas obtidas via BrasilAPI (useCepSearch):', { latitude, longitude });
        }
        // PRIORIDADE 3: Fallback inteligente - coordenadas da cidade do CEP
        else {
          console.log('⚠️ Coordenadas específicas não disponíveis, tentando obter coordenadas da cidade...');
          const smartFallback = await GeocodingService.getSmartFallbackCoordinates(cepData);
          if (smartFallback) {
            latitude = smartFallback.lat;
            longitude = smartFallback.lng;
            console.log('🏙️ Usando coordenadas da cidade como fallback:', smartFallback);
          }
        }

        // Tratar campos null/undefined da BrasilAPI
        const logradouro = cepData.street || '';
        const bairro = cepData.neighborhood || '';
        const cidade = cepData.city || '';
        const estado = cepData.state || '';

        // Para CEPs genéricos (sem logradouro/bairro específico), usar nome da cidade
        const logradouroFinal = logradouro || (cidade ? `Centro de ${cidade}` : '');
        const bairroFinal = bairro || 'Centro';

        setSetorFormData(prev => ({
          ...prev,
          logradouro: logradouroFinal,
          bairro: bairroFinal,
          cidade: cidade,
          estado: estado,
          latitude: latitude,
          longitude: longitude
        }));

        // Debug para verificar os dados
        console.log('Dados do CEP:', cepData);
        console.log('Latitude final:', latitude);
        console.log('Longitude final:', longitude);

        let coordenadasMsg = '';
        if (geocodingResult.coordenadas) {
          coordenadasMsg = ' Coordenadas específicas obtidas com sucesso!';
        } else if (cepData.location?.coordinates &&
          cepData.location.coordinates.latitude !== 'N/A' &&
          cepData.location.coordinates.longitude !== 'N/A') {
          coordenadasMsg = ' Coordenadas obtidas via BrasilAPI!';
        } else if (latitude && longitude) {
          coordenadasMsg = ` Coordenadas da cidade ${cidade} obtidas como referência.`;
        } else {
          coordenadasMsg = ' Endereço encontrado. Coordenadas serão geocodificadas automaticamente.';
        }

        // Mensagem mais informativa para CEPs genéricos
        const enderecoMsg = logradouro && bairro
          ? `${logradouro}, ${bairro}`
          : `CEP genérico da cidade`;

        showInfo("CEP encontrado!", `Endereço preenchido automaticamente: ${enderecoMsg} - ${cidade}/${estado}.${coordenadasMsg}`);
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      showError("Erro ao buscar CEP", "Não foi possível encontrar o endereço para este CEP.");
    }
  };

  const handleCreateSetor = async () => {
    // Validar se não está usando coordenadas de fallback
    if (isFallbackCoordinatesModal) {
      showWarning(
        "Coordenadas inválidas",
        "Não é possível salvar o setor com coordenadas de fallback. Por favor, marque um ponto no mapa ou pesquise por uma cidade válida."
      );
      return;
    }

    try {
      const nome = setorFormData.nomeSetor;
      await api.post('/setores', setorFormData);
      await fetchSetores();
      setShowCreateSetorModal(false);
      resetSetorForm();
      showInfo("Setor criado com sucesso!", `O setor ${nome} foi adicionado ao sistema.`);
    } catch (error) {
      console.error('Erro ao criar setor:', error);
      showError("Erro ao criar setor", "Ocorreu um erro ao tentar criar o setor. Tente novamente.");
    }
  };

  const handleUpdateSetor = async () => {
    if (!selectedSetor) return;

    // Validar se não está usando coordenadas de fallback
    if (isFallbackCoordinatesModal) {
      showWarning(
        "Coordenadas inválidas",
        "Não é possível salvar o setor com coordenadas de fallback. Por favor, marque um ponto no mapa ou pesquise por uma cidade válida."
      );
      return;
    }

    try {
      const nome = setorFormData.nomeSetor;
      await api.put(`/setores/${selectedSetor.ID}`, setorFormData);
      await fetchSetores();
      setShowEditSetorModal(false);
      setSelectedSetor(null);
      resetSetorForm();
      showInfo("Setor atualizado com sucesso!", `Os dados do setor ${nome} foram atualizados.`);
    } catch (error) {
      console.error('Erro ao atualizar setor:', error);
      showError("Erro ao atualizar setor", "Ocorreu um erro ao tentar atualizar o setor. Tente novamente.");
    }
  };

  const handleDeleteSetor = async (id: number) => {
    const setorToDelete = setoresData.find(setor => setor.ID === id);
    if (!setorToDelete) return;

    try {
      await api.delete(`/setores/${id}`);
      await fetchSetores();
      showInfo("Setor excluído com sucesso!", `O setor ${setorToDelete.NOME_SETOR || setorToDelete.SETOR} foi removido do sistema.`);
    } catch (error) {
      console.error('Erro ao excluir setor:', error);
      showError("Erro ao excluir setor", "Ocorreu um erro ao tentar excluir o setor. Tente novamente.");
    }
  };

  const handleEditSetor = (setor: any) => {
    setSelectedSetor(setor);
    setSetorFormData({
      codigoSetor: setor.CODIGO_SETOR || setor.codigo_setor || setor.codigoSetor || '',
      nomeSetor: setor.NOME_SETOR || setor.SETOR || setor.nome_setor || setor.nomeSetor || '',
      orgao: setor.ORGAO || setor.orgao || '',
      telefone: setor.TELEFONE || setor.telefone || '',
      email: setor.EMAIL || setor.email || '',
      cep: setor.CEP || setor.cep || '',
      logradouro: setor.LOGRADOURO || setor.logradouro || '',
      numero: setor.NUMERO || setor.numero || '',
      complemento: setor.COMPLEMENTO || setor.complemento || '',
      bairro: setor.BAIRRO || setor.bairro || '',
      cidade: setor.CIDADE || setor.cidade || '',
      estado: setor.ESTADO || setor.estado || '',
      // Preservar coordenadas existentes ou usar null se não existirem
      latitude: setor.LATITUDE !== undefined && setor.LATITUDE !== null ? setor.LATITUDE :
        (setor.latitude !== undefined && setor.latitude !== null ? setor.latitude : null),
      longitude: setor.LONGITUDE !== undefined && setor.LONGITUDE !== null ? setor.LONGITUDE :
        (setor.longitude !== undefined && setor.longitude !== null ? setor.longitude : null),
      semNumero: false,
      ativo: setor.ATIVO !== undefined ? setor.ATIVO : (setor.ativo !== undefined ? setor.ativo : true)
    });
    setManualAddressEdit(false);
    setShowEditSetorModal(true);
  };

  const handleEditUser = async (user: any) => {
    setSelectedUser(user);

    // Tenta carregar dados completos do usuário por ID
    let fetchedUser: any = null;
    try {
      const resp = await api.getUserById(user.id);
      fetchedUser = (resp as any)?.data?.data ?? null;
    } catch (e) {
      // Em caso de erro, segue com os dados existentes da lista
      console.error('Falha ao carregar usuário por ID, usando dados da lista.', e);
    }

    // Mescla dados do usuário selecionado com o retornado da API
    const source = { ...(user || {}), ...(fetchedUser || {}) } as any;

    // -----------------------------
    // Normalizações para selects e enums
    // -----------------------------
    const normStr = (v: any) => {
      if (v === undefined || v === null) return '';
      return String(v).trim();
    };
    const upper = (v: any) => (v ? normStr(v).toUpperCase() : '');
    const lower = (v: any) => (v ? normStr(v).toLowerCase() : '');
    const stripAccents = (s: string) => (s ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : s);

    const mapEstadoCivil = (v: any) => {
      const x = lower(v);
      if (!x) return '';
      if (x.includes('sol')) return 'solteiro';
      if (x.includes('cas')) return 'casado';
      if (x.includes('div')) return 'divorciado';
      if (x.includes('viu')) return 'viuvo';
      return x; // fallback
    };
    const mapTipoVinculo = (v: any) => {
      const x = upper(v);
      if (!x) return '';
      if (x.includes('EFET')) return 'EFETIVO';
      if (x.includes('COMISS')) return 'COMISSIONADO';
      if (x.includes('TERCE')) return 'TERCEIRIZADO';
      if (x.includes('ESTAG')) return 'ESTAGIARIO';
      if (x.includes('TEMP')) return 'TEMPORARIO';
      return x;
    };
    const mapCategoria = (v: any) => {
      const x = upper(v);
      if (!x) return '';
      if (x.includes('SERV')) return 'SERVIDOR';
      if (x.includes('EMP')) return 'EMPREGADO';
      if (x.includes('MILIT')) return 'MILITAR';
      if (x.includes('TERCE')) return 'TERCEIRIZADO';
      return x;
    };
    const mapRegimeJuridico = (v: any) => {
      const x = upper(v);
      if (!x) return '';
      if (x.includes('ESTAT')) return 'ESTATUTARIO';
      if (x.includes('CLT')) return 'CLT';
      if (x.includes('MILIT')) return 'MILITAR';
      if (x.includes('TEMP')) return 'TEMPORARIO';
      return x;
    };
    const mapRegimePrev = (v: any) => {
      const x = upper(v);
      if (!x) return '';
      if (x.includes('RPPS')) return 'RPPS';
      if (x.includes('RGPS')) return 'RGPS';
      if (x.includes('MILIT')) return 'MILITAR';
      return x;
    };
    const mapTipoEvento = (v: any) => {
      const x = upper(stripAccents(normStr(v)));
      if (!x) return '';
      if (x.includes('ADMIS')) return 'ADMISSAO';
      if (x.includes('NOMEA')) return 'NOMEACAO';
      if (x.includes('CONTRAT')) return 'CONTRATACAO';
      if (x.includes('DESIG')) return 'DESIGNACAO';
      if (x.includes('ELEI')) return 'ELEICAO';
      return x;
    };
    const mapEscolaridade = (v: any) => {
      const x = upper(v);
      if (!x) return '';
      if (x.includes('FUND')) return 'FUNDAMENTAL';
      if (x.includes('MEDIO')) return 'MEDIO';
      if (x.includes('TEC')) return 'TECNICO';
      if (x.includes('SUP')) return 'SUPERIOR';
      if (x.includes('ESP')) return 'ESPECIALIZACAO';
      if (x.includes('MEST')) return 'MESTRADO';
      if (x.includes('DOUT')) return 'DOUTORADO';
      return x;
    };
    const mapJornada = (v: any) => {
      const x = normStr(v);
      if (!x) return '';
      const num = x.replace(/\D/g, '');
      if (['20', '30', '40', '44'].includes(num)) return num + 'H';
      return upper(x);
    };
    const mapPne = (v: any) => {
      if (v === undefined || v === null || String(v).trim() === '') return '';
      return toBool(v) ? 'SIM' : 'NAO';
    };

    // Normaliza diversos formatos de data para o formato aceito pelo input date (YYYY-MM-DD)
    const toDateInput = (v: any): string => {
      if (v === undefined || v === null) return '';
      // Se vier como Date ou timestamp
      try {
        if (v instanceof Date) {
          return new Date(v).toISOString().slice(0, 10);
        }
        const s = String(v).trim();
        if (!s) return '';
        // ISO completo: 2023-01-02T00:00:00.000Z
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
          return s.slice(0, 10);
        }
        // dd/MM/yyyy
        const m1 = s.match(/^(\d{2})[\/](\d{2})[\/](\d{4})$/);
        if (m1) {
          const [_, dd, mm, yyyy] = m1;
          return `${yyyy}-${mm}-${dd}`;
        }
        // dd-MM-yyyy
        const m2 = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
        if (m2) {
          const [_, dd, mm, yyyy] = m2;
          return `${yyyy}-${mm}-${dd}`;
        }
        // Tenta parsear genericamente
        const d = new Date(s);
        if (!isNaN(d.getTime())) {
          return d.toISOString().slice(0, 10);
        }
      } catch (e) {
        // Silencia erros e retorna vazio
      }
      return '';
    };

    // Normaliza o tipo de documento para uma das opções do select
    const mapTipoRg = (v: any): string => {
      const x = upper(stripAccents(v));
      if (!x) return '';
      if (x.includes('PASS')) return 'PASSAPORTE';
      if (x.includes('CTPS') || x.includes('TRABALHO')) return 'CTPS';
      if (x.includes('CNH') || x.includes('HABILIT')) return 'CNH';
      if (x.includes('RG') || x.includes('IDENTID')) return 'RG';
      return 'OUTROS';
    };

    // Normaliza o tipo sanguíneo para o formato esperado (A+, O-, etc.)
    const mapTipoSanguineo = (v: any): string => {
      const x = upper(stripAccents(v));
      if (!x) return '';
      const hasPos = x.includes('+') || x.includes('POS');
      const hasNeg = x.includes('-') || x.includes('NEG');
      // Trata casos com "ZERO" como O
      const base = x.includes('ZERO') ? 'O' : x.replace(/[^ABO]/g, '');
      if (base.startsWith('AB')) {
        if (hasPos) return 'AB+';
        if (hasNeg) return 'AB-';
      } else if (base.startsWith('A')) {
        if (hasPos) return 'A+';
        if (hasNeg) return 'A-';
      } else if (base.startsWith('B')) {
        if (hasPos) return 'B+';
        if (hasNeg) return 'B-';
      } else if (base.startsWith('O')) {
        if (hasPos) return 'O+';
        if (hasNeg) return 'O-';
      }
      // Tenta mapear explicitamente pela string original
      if (/^AB\s*\+/.test(x) || x.includes('AB POS')) return 'AB+';
      if (/^AB\s*-/.test(x) || x.includes('AB NEG')) return 'AB-';
      if (/^A\s*\+/.test(x) || x.includes('A POS')) return 'A+';
      if (/^A\s*-/.test(x) || x.includes('A NEG')) return 'A-';
      if (/^B\s*\+/.test(x) || x.includes('B POS')) return 'B+';
      if (/^B\s*-/.test(x) || x.includes('B NEG')) return 'B-';
      if (/^O\s*\+/.test(x) || x.includes('O POS')) return 'O+';
      if (/^O\s*-/.test(x) || x.includes('O NEG')) return 'O-';
      return '';
    };

    const estadoCivilNormalized = mapEstadoCivil(source.estado_civil || source.ESTADO_CIVIL || '');
    const tipoVinculoNormalized = mapTipoVinculo(source.tipo_vinculo || source.TIPO_VINCULO || '');
    const categoriaNormalized = mapCategoria(source.categoria || source.CATEGORIA || '');
    const regimeJuridicoNormalized = mapRegimeJuridico(source.regime_juridico || source.REGIME_JURIDICO || '');
    const regimePrevNormalized = mapRegimePrev(source.regime_previdenciario || source.REGIME_PREVIDENCIARIO || '');
    const tipoEventoNormalized = mapTipoEvento(source.tipo_evento || source.TIPO_EVENTO || source.evento_tipo || source.EVENTO_TIPO || '');
    const escolaridadeCargoNormalized = mapEscolaridade(source.escolaridade_cargo || source.ESCOLARIDADE_CARGO || '');
    const escolaridadeServidorNormalized = mapEscolaridade(source.escolaridade_servidor || source.ESCOLARIDADE_SERVIDOR || '');
    const jornadaNormalized = mapJornada(source.jornada || source.JORNADA || '');
    const pneNormalized = mapPne(source.pne ?? source.PNE);

    // Derivar setor_id a partir do nome do setor se necessário
    let setorIdDerivado = source.setor_id || source.SETOR_ID || '';
    const setorNomeOrig = source.setor || source.SETOR || source.departamento || source.DEPARTAMENTO || '';
    if (!setorIdDerivado && setorNomeOrig && Array.isArray(setoresData) && setoresData.length > 0) {
      const match = (setoresData || []).find((s: any) => {
        const nome = s.NOME_SETOR || s.nome_setor || s.nome;
        return nome && String(nome).trim().toLowerCase() === String(setorNomeOrig).trim().toLowerCase();
      });
      if (match) {
        setorIdDerivado = String(match.ID ?? match.id ?? '');
      }
    }

    // Endereço: garantir compatibilidade com wizard (endereco) e logradouro
    const enderecoFromSource = source.endereco || source.ENDERECO || source.logradouro || source.LOGRADOURO || '';

    setFormData({
      // Dados básicos
      nome: source.nome || source.name || source.NOME || "",
      email: source.email || source.e_mail || source.E_MAIL || "",
      perfil: (source.perfil || source.role || source.ROLE || "").toLowerCase(),
      ativo: source.ativo !== undefined ? source.ativo : (source.isActive !== undefined ? source.isActive : (source.USUARIO_ATIVO === 1)),

      // Dados pessoais
      cpf: source.cpf || source.CPF || "",
      'pis/pasep': source['pis/pasep'] || source.pis || source.PIS || "",
      data_nascimento: toDateInput(source.data_nascimento || source.DATA_NASCIMENTO || ""),
      sexo: source.sexo || source.SEXO || "",
      estado_civil: estadoCivilNormalized,
      rg: source.rg || source.RG || "",
      orgao_expeditor: source.orgao_expeditor || source.ORGAO_EXPEDITOR || "",
      uf_rg: source.uf_rg || source.UF_RG || "",
      expedicao_rg: toDateInput(source.expedicao_rg || source.EXPEDICAO_RG || ""),
      tipo_sanguineo: mapTipoSanguineo(source.tipo_sanguineo || source.TIPO_SANGUINEO || ""),
      raca_cor: source.raca_cor || source.RACA_COR || source.cor_raca || "",
      pne: pneNormalized,
      deficiencia: source.deficiencia || source.DEFICIENCIA || "",

      // Contatos
      telefone: source.telefone || source.phone || source.TELEFONE || "",
      celular: source.celular || source.CELULAR || "",
      telefone_comercial: source.telefone_comercial || source.TELEFONE_COMERCIAL || "",
      email_pessoal: source.email_pessoal || source.EMAIL_PESSOAL || "",

      // Endereço (chaves do wizard)
      cep_endereco: source.cep_endereco || source.CEP_ENDERECO || source.cep || source.CEP || "",
      cidade_endereco: source.cidade_endereco || source.CIDADE_ENDERECO || source.cidade || source.CIDADE || "",
      uf_endereco: source.uf_endereco || source.UF_ENDERECO || source.uf || source.UF || "",
      // Garantir que o wizard exiba o campo Endereço corretamente
      endereco: enderecoFromSource,
      logradouro: enderecoFromSource,
      numero_endereco: source.numero_endereco || source.NUMERO_ENDERECO || source.numero || source.NUMERO || "",
      complemento_endereco: source.complemento_endereco || source.COMPLEMENTO_ENDERECO || source.complemento || source.COMPLEMENTO || "",
      bairro_endereco: source.bairro_endereco || source.BAIRRO_ENDERECO || source.bairro || source.BAIRRO || "",
      // Compatibilidade para revisão
      cep: (source.cep_endereco || source.CEP_ENDERECO || source.cep || source.CEP || ""),

      // Dados funcionais
      matricula: source.matricula || source.MATRICULA || "",
      vinculo_funcional: source.vinculo_funcional || source.VINCULO_FUNCIONAL || "",
      setor_id: setorIdDerivado,
      setor_nome_livre: setorNomeOrig || "",
      setor: source.setor || source.SETOR || source.departamento || source.DEPARTAMENTO || "",
      cargo: source.cargo || source.CARGO || source.role || source.ROLE || "",
      orgao: source.orgao || source.ORGAO || "",
      lotacao: source.lotacao || source.LOTACAO || "",
      hierarquia_setor: source.hierarquia_setor || source.HIERARQUIA_SETOR || "",
      municipio_lotacao: source.municipio_lotacao || source.MUNICIPIO_LOTACAO || "",
      codigo_setor: source.codigo_setor || source.CODIGO_SETOR || "",
      categoria: categoriaNormalized,
      regime_juridico: regimeJuridicoNormalized,
      regime_previdenciario: regimePrevNormalized,
      tipo_evento: tipoEventoNormalized,
      forma_provimento: source.forma_provimento || source.FORMA_PROVIMENTO || "",
      codigo_cargo: source.codigo_cargo || source.CODIGO_CARGO || "",
      escolaridade_cargo: escolaridadeCargoNormalized,
      escolaridade_servidor: escolaridadeServidorNormalized,
      formacao_profissional_1: source.formacao_profissional_1 || source.FORMACAO_PROFISSIONAL_1 || "",
      formacao_profissional_2: source.formacao_profissional_2 || source.FORMACAO_PROFISSIONAL_2 || "",
      jornada: jornadaNormalized,
      nivel_referencia: source.nivel_referencia || source.NIVEL_REFERENCIA || "",
      comissao_funcao: source.comissao_funcao || source.COMISSAO_FUNCAO || source['comissao_funçao'] || "",
      data_ini_comissao: source.data_ini_comissao || source.DATA_INI_COMISSAO || "",

      // Dados bancários
      banco: source.banco || source.BANCO || "",
      agencia: source.agencia || source.AGENCIA || "",
      conta: source.conta || source.CONTA || "",
      tipo_conta: source.tipo_conta || source.TIPO_CONTA || "",

      // Dados de filiação
      pai: source.pai || source.PAI || "",
      mae: source.mae || source.MAE || "",
      cidade_nascimento: source.cidade_nascimento || source.CIDADE_NASCIMENTO || "",
      uf_nascimento: source.uf_nascimento || source.UF_NASCIMENTO || "",
      tipo_rg: mapTipoRg(source.tipo_rg || source.TIPO_RG || ""),
      tipo_vinculo: tipoVinculoNormalized
    });
    setShowEditModal(true);
  };

  const handleViewUser = async (user: any) => {
    setIsViewModeUser(true);
    await handleEditUser(user);
  };

  const handleViewSetor = (setor: any) => {
    setIsViewModeSetor(true);
    handleEditSetor(setor);
  };

  // Carregar setores ao montar o componente
  useEffect(() => {
    fetchSetores();
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Carregar configurações ao montar o componente
  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const classes = useModuleTheme("configuracoes");

  // Estados para configurações das abas
  const [configGeral, setConfigGeral] = useState({
    SISTEMA_NOME: '',
    nomeInstituicao: '',
    cnpj: '',
    endereco: '',
    telefone: '',
    email: '',
    descricao: '',
    cidade: '',
    emailContato: '',
    siteUrl: '',
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    whatsapp: '',
    logoHeaderUrl: '',
    textoCopyright: '',
    enderecoCompleto: '',
    HUB_SETOR_ID: ''
  });

  const [configSeguranca, setConfigSeguranca] = useState({
    autenticacaoDuasEtapas: false,
    senhaComplexidade: 'media',
    tempoSessao: 30,
    tentativasLogin: 3,
    bloqueioTempo: 15,
    logAuditoria: true
  });

  const [configNotificacoes, setConfigNotificacoes] = useState({
    notificacoesEmail: true,
    notificacoesPush: false,
    emailProcessos: true,
    emailPrazos: true,
    emailDocumentos: false,
    frequenciaResumo: 'diario'
  });

  const [configSistema, setConfigSistema] = useState({
    backupAutomatico: true,
    frequenciaBackup: 'diario',
    horarioBackup: '02:00',
    retencaoBackup: 30,
    manutencaoAutomatica: true,
    logNivel: 'info'
  });

  // Estado: Configurações de Malote - Setor Origem
  const [setorOrigemMalote, setSetorOrigemMalote] = useState({
    setorId: '',
    setorNome: '',
    latitude: null as number | null,
    longitude: null as number | null,
    enderecoSetor: {
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: ''
    }
  });

  // Estado: Configurações de Malote - Setor Destino
  const [setorDestinoMalote, setSetorDestinoMalote] = useState({
    setorId: '',
    setorNome: '',
    latitude: null as number | null,
    longitude: null as number | null,
    enderecoSetor: {
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: ''
    }
  });

  // Estado: Configurações de Malote - Dados Gerais
  const [maloteConfig, setMaloteConfig] = useState({
    // Dados do Contrato (fictícios)
    numeroContrato: '9912565780',
    percurso: '',
    codigoEmissao: 'VG275SIGMA',
    dataEmissao: '24/02/2022',
    validade: '24/02/2027',
    // Dados do Malote (com valores padrão sugeridos)
    ida: '1',
    numeroMalote: '',
    tamanho: 'G',
    diasServico: 'Segunda-feira, Terça-feira, Quarta-feira, Quinta-feira, Sexta-feira',
    estacao: 'A',
    distritos: '307',
    ativo: true,
    cepOrigem: '',
    cepDestino: ''
  });

  // Estado: Lista de malotes e UI (padrão Setores/Usuários)
  const [malotesData, setMalotesData] = useState<any[]>([]);
  const [showCreateMaloteModal, setShowCreateMaloteModal] = useState(false);
  const [showHubModal, setShowHubModal] = useState(false);
  const [showViewMaloteModal, setShowViewMaloteModal] = useState(false);
  const [viewMaloteData, setViewMaloteData] = useState<any | null>(null);
  const [isEditingMalote, setIsEditingMalote] = useState(false);
  const [editingMaloteId, setEditingMaloteId] = useState<number | null>(null);
  const [searchTermMalote, setSearchTermMalote] = useState("");
  const [statusFilterMalote, setStatusFilterMalote] = useState("todos");
  const [viewModeMalote, setViewModeMalote] = useState<'grid' | 'list'>('list');
  const [currentPageMalote, setCurrentPageMalote] = useState(1);
  const [itemsPerPageMalote] = useState(10);

  // Wizard: Novo Malote (2 etapas)
  const [currentStepMalote, setCurrentStepMalote] = useState(1);
  const stepsMalote = [
    { id: 1, title: 'Origem / Destino', icon: MailMinusIcon },
    { id: 2, title: 'Malote / Contrato', icon: FileText }
  ];
  const progressMalote = (currentStepMalote / stepsMalote.length) * 100;

  const handleNextMalote = () => {
    // Validação do Step 1: Setores Origem e Destino são obrigatórios
    if (currentStepMalote === 1) {
      if (!setorOrigemMalote.setorId) {
        showError('Setor Origem obrigatório', 'Selecione o setor de origem antes de continuar.');
        return;
      }
      if (!setorDestinoMalote.setorId) {
        showError('Setor Destino obrigatório', 'Selecione o setor de destino antes de continuar.');
        return;
      }
    }

    // Validação do Step 2: Nº Malote e Percurso são obrigatórios
    if (currentStepMalote === 2) {
      if (!maloteConfig.numeroMalote || !maloteConfig.percurso) {
        showError('Campos obrigatórios', 'Preencha o Nº Malote e o Percurso antes de continuar.');
        return;
      }
    }
    setCurrentStepMalote(prev => Math.min(prev + 1, stepsMalote.length));
  };

  const handlePreviousMalote = () => setCurrentStepMalote(prev => Math.max(prev - 1, 1));
  const [setorComboboxOpenMalote, setSetorComboboxOpenMalote] = useState(false);
  const [setorOrigemComboboxOpen, setSetorOrigemComboboxOpen] = useState(false);
  const [setorDestinoComboboxOpen, setSetorDestinoComboboxOpen] = useState(false);
  const [editandoDadosContrato, setEditandoDadosContrato] = useState(false);
  const [diasSemanaPopoverOpen, setDiasSemanaPopoverOpen] = useState(false);
  const [diasSemanaSelecionados, setDiasSemanaSelecionados] = useState<string[]>(['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira']);

  // Filtros e ordenação para malotes
  const filteredAndSortedMalotes = useMemo(() => {
    let filtered = [...malotesData];

    if (searchTermMalote) {
      const term = searchTermMalote.toLowerCase();
      filtered = filtered.filter((m: any) => {
        const num = String(m.numeroMalote || '').toLowerCase();
        const setor = String(m.setorNome || '').toLowerCase();
        const setorOrigem = String(m.setorOrigemNome || '').toLowerCase();
        const setorDestino = String(m.setorDestinoNome || '').toLowerCase();
        const codigo = String(m.codigoEmissao || '').toLowerCase();
        return (
          num.includes(term) ||
          setor.includes(term) ||
          setorOrigem.includes(term) ||
          setorDestino.includes(term) ||
          codigo.includes(term)
        );
      });
    }

    if (statusFilterMalote !== 'todos') {
      const ativo = statusFilterMalote === 'ativo';
      filtered = filtered.filter((m: any) => Boolean(m.ativo) === ativo);
    }

    return filtered;
  }, [malotesData, searchTermMalote, statusFilterMalote]);

  // Estado para controlar expansão dos grupos de malotes
  const [expandedMaloteGroups, setExpandedMaloteGroups] = useState<Record<string, boolean>>({});

  // Agrupamento de malotes por Setor Destino para o cardlist
  const malotesAgrupadosPorSetorDestino = useMemo(() => {
    console.log('🔍 Agrupando malotes. Total filtrado:', filteredAndSortedMalotes.length);
    const grupos: Record<string, { setorNome: string; cepDestino: string; malotes: any[] }> = {};

    filteredAndSortedMalotes.forEach((malote: any) => {
      // ID do setor destino (vem do backend via JOIN com tabela SETORES)
      const setorDestinoId = malote.setorDestinoId || malote.SETOR_DESTINO_ID;

      // Nome do setor (vem do JOIN - já normalizado pela função normalizeMaloteFromApi)
      const setorDestinoNome = malote.setorDestinoNome || malote.setorNome;

      const cepDestino = malote.cepDestino || '-';

      console.log('🔍 Processando malote:', {
        id: malote.id || malote.ID,
        setorDestinoId,
        setorDestinoNome,
        maloteCompleto: malote
      });

      // Só agrupa se tiver ID do setor (obrigatório no banco)
      if (setorDestinoId) {
        if (!grupos[setorDestinoId]) {
          grupos[setorDestinoId] = {
            setorNome: setorDestinoNome,
            cepDestino: cepDestino,
            malotes: []
          };
        }
        grupos[setorDestinoId].malotes.push(malote);
      } else {
        console.warn('⚠️ Malote sem setorDestinoId:', malote);
      }
    });

    console.log('🔍 Grupos criados:', Object.keys(grupos).length, grupos);
    return grupos;
  }, [filteredAndSortedMalotes]);

  const totalPagesMalote = Math.ceil(filteredAndSortedMalotes.length / itemsPerPageMalote);
  const startIndexMalote = (currentPageMalote - 1) * itemsPerPageMalote;
  const endIndexMalote = startIndexMalote + itemsPerPageMalote;
  const paginatedMalotes = filteredAndSortedMalotes.slice(startIndexMalote, endIndexMalote);

  // Handlers Malote
  const resetMaloteForm = () => {
    setMaloteConfig({
      setorId: '',
      setorNome: '',
      enderecoSetor: {
        logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: ''
      },
      numeroContrato: '9912565780',
      percurso: '',
      codigoEmissao: 'VG275SIGMA',
      dataEmissao: '24/02/2022',
      validade: '24/02/2027',
      cepOrigem: '',
      cepDestino: '',
      ida: '1',
      numeroMalote: '',
      tamanho: 'G',
      diasServico: 'Segunda-feira, Terça-feira, Quarta-feira, Quinta-feira, Sexta-feira',
      estacao: 'A',
      distritos: '307',
      ativo: true
    });

    // Resetar estados dos setores origem e destino
    setSetorOrigemMalote({
      setorId: '',
      setorNome: '',
      latitude: null,
      longitude: null,
      enderecoSetor: {
        logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: ''
      }
    });

    setSetorDestinoMalote({
      setorId: '',
      setorNome: '',
      latitude: null,
      longitude: null,
      enderecoSetor: {
        logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: ''
      }
    });

    // Resetar dias da semana selecionados para os dias úteis padrão
    setDiasSemanaSelecionados(['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira']);
    setEditandoDadosContrato(false);

    // Resetar estados dos comboboxes
    setSetorOrigemComboboxOpen(false);
    setSetorDestinoComboboxOpen(false);

    // Resetar para o step 1
    setCurrentStepMalote(1);
    setIsEditingMalote(false);
    setEditingMaloteId(null);
    setViewMaloteData(null);
    setShowViewMaloteModal(false);
  };

  // Pré-preenche o formulário para edição com dados do malote selecionado
  const prefillMaloteForEdit = (m: any) => {
    const origemId = String(m.setorOrigemId ?? m.SETOR_ORIGEM_ID ?? '').trim();
    const destinoId = String(m.setorDestinoId ?? m.SETOR_DESTINO_ID ?? '').trim();
    const findSetor = (idStr: string) => {
      if (!idStr || !Array.isArray(setoresData)) return null;
      return (setoresData || []).find((s: any) => String(s.ID ?? s.id) === String(idStr)) || null;
    };
    const setorOrigemInfo = findSetor(origemId);
    const setorDestinoInfo = findSetor(destinoId);

    setMaloteConfig(prev => ({
      ...prev,
      numeroContrato: m.numeroContrato ?? m.NUMERO_CONTRATO ?? prev.numeroContrato,
      percurso: m.percurso ?? m.numeroPercurso ?? prev.percurso,
      codigoEmissao: m.codigoEmissao ?? m.CODIGO_EMISSAO ?? prev.codigoEmissao,
      dataEmissao: m.dataEmissao ?? m.DATA_EMISSAO ?? prev.dataEmissao,
      validade: m.validade ?? m.dataValidade ?? prev.validade,
      numeroMalote: m.numeroMalote ?? m.NUMERO_MALOTE ?? prev.numeroMalote,
      cepOrigem: m.cepOrigem ?? m.CEP_ORIGEM ?? prev.cepOrigem,
      cepDestino: m.cepDestino ?? m.CEP_DESTINO ?? prev.cepDestino,
      ida: m.ida ?? prev.ida,
      tamanho: m.tamanho ?? prev.tamanho,
      diasServico: m.diasServico ?? prev.diasServico,
      estacao: m.estacao ?? prev.estacao,
      distritos: m.distritos ?? prev.distritos,
      ativo: Boolean(m.ativo ?? prev.ativo)
    }));

    if (setorOrigemInfo) {
      setSetorOrigemMalote({
        setorId: String(setorOrigemInfo.ID ?? ''),
        setorNome: setorOrigemInfo.NOME_SETOR || setorOrigemInfo.SETOR || setorOrigemInfo.NOME || '',
        latitude: setorOrigemInfo.LATITUDE || null,
        longitude: setorOrigemInfo.LONGITUDE || null,
        enderecoSetor: {
          logradouro: setorOrigemInfo.LOGRADOURO || '',
          numero: setorOrigemInfo.NUMERO || '',
          complemento: setorOrigemInfo.COMPLEMENTO || '',
          bairro: setorOrigemInfo.BAIRRO || '',
          cidade: setorOrigemInfo.CIDADE || '',
          estado: setorOrigemInfo.ESTADO || '',
          cep: setorOrigemInfo.CEP || ''
        }
      });
    }

    if (setorDestinoInfo) {
      setSetorDestinoMalote({
        setorId: String(setorDestinoInfo.ID ?? ''),
        setorNome: setorDestinoInfo.NOME_SETOR || setorDestinoInfo.SETOR || setorDestinoInfo.NOME || '',
        latitude: setorDestinoInfo.LATITUDE || null,
        longitude: setorDestinoInfo.LONGITUDE || null,
        enderecoSetor: {
          logradouro: setorDestinoInfo.LOGRADOURO || '',
          numero: setorDestinoInfo.NUMERO || '',
          complemento: setorDestinoInfo.COMPLEMENTO || '',
          bairro: setorDestinoInfo.BAIRRO || '',
          cidade: setorDestinoInfo.CIDADE || '',
          estado: setorDestinoInfo.ESTADO || '',
          cep: setorDestinoInfo.CEP || ''
        }
      });
    }
  };

  const openEditMalote = (m: any) => {
    try {
      const norm = normalizeMaloteFromApi(m);
      setIsEditingMalote(true);
      const idVal = Number(norm.id ?? norm.ID);
      setEditingMaloteId(Number.isFinite(idVal) ? idVal : null);
      prefillMaloteForEdit(norm);
      setShowCreateMaloteModal(true);
      setCurrentStepMalote(1);
    } catch (error) {
      console.error('Erro ao preparar edição de malote:', error);
      showError('Erro', 'Não foi possível abrir o editor do malote.');
    }
  };

  const openViewMalote = (m: any) => {
    try {
      const norm = normalizeMaloteFromApi(m);
      setViewMaloteData(norm);
      setShowViewMaloteModal(true);
    } catch (error) {
      console.error('Erro ao abrir visualização de malote:', error);
      showError('Erro', 'Não foi possível abrir a visualização do malote.');
    }
  };

  // Normaliza registros vindos da API para o shape da UI
  const normalizeMaloteFromApi = (item: any) => {
    // Derivar nome do setor a partir de setoresData e setorId/SETOR_ID
    const setorIdFromItem = item?.setorId ?? item?.SETOR_ID;
    let setorNomeDerivado = '';
    if (setorIdFromItem && Array.isArray(setoresData) && setoresData.length > 0) {
      const setorMatch = (setoresData || []).find((s: any) => {
        const sid = s?.ID ?? s?.id;
        return sid && String(sid) === String(setorIdFromItem);
      });
      if (setorMatch) {
        setorNomeDerivado = setorMatch.NOME_SETOR || setorMatch.SETOR || setorMatch.NOME || '';
      }
    }

    // Derivar Setor Origem/Destino a partir de IDs/CEPs quando possível
    const origemId = item?.setorOrigemId ?? item?.SETOR_ORIGEM_ID ?? setorIdFromItem;
    const destinoId = item?.setorDestinoId ?? item?.SETOR_DESTINO_ID;
    const cepOrigem = item?.cepOrigem ?? item?.CEP_ORIGEM;
    const cepDestino = item?.cepDestino ?? item?.CEP_DESTINO;

    const findSetorNome = (id?: any, cep?: any) => {
      if (!Array.isArray(setoresData) || setoresData.length === 0) return '';
      let match: any = null;
      if (id) {
        match = (setoresData || []).find((s: any) => {
          const sid = s?.ID ?? s?.id;
          return sid && String(sid) === String(id);
        });
      }
      if (!match && cep) {
        match = (setoresData || []).find((s: any) => {
          const scep = s?.CEP ?? s?.cep;
          return scep && String(scep).replace(/\D/g, '') === String(cep).replace(/\D/g, '');
        });
      }
      return match ? (match.NOME_SETOR || match.SETOR || match.NOME || '') : '';
    };

    const setorOrigemNomeDerivado = findSetorNome(origemId, cepOrigem);
    const setorDestinoNomeDerivado = findSetorNome(destinoId, cepDestino);

    return {
      ...item,
      percurso: item.percurso ?? item.numeroPercurso,
      validade: item.validade ?? item.dataValidade,
      setorNome: item.setorNome ?? setorNomeDerivado ?? '',
      // Priorizar nomes que vêm do JOIN do backend (SETOR_ORIGEM_NOME, SETOR_DESTINO_NOME)
      setorOrigemNome: item.setorOrigemNome ?? item.SETOR_ORIGEM_NOME ?? setorOrigemNomeDerivado ?? '',
      setorDestinoNome: item.setorDestinoNome ?? item.SETOR_DESTINO_NOME ?? setorDestinoNomeDerivado ?? '',
      // Garantir que os IDs também estejam disponíveis
      setorDestinoId: item.setorDestinoId ?? item.SETOR_DESTINO_ID,
      setorOrigemId: item.setorOrigemId ?? item.SETOR_ORIGEM_ID
    };
  };

  // Monta o payload alinhado aos campos fillable do backend
  const buildMalotePayload = () => {
    const setorOrigemIdVal = (setorOrigemMalote as any)?.setorId || (maloteConfig as any)?.setorId || '';
    const setorDestinoIdVal = (setorDestinoMalote as any)?.setorId || '';
    return {
      numeroContrato: maloteConfig.numeroContrato,
      numeroPercurso: (maloteConfig as any).percurso,
      codigoEmissao: maloteConfig.codigoEmissao,
      dataEmissao: maloteConfig.dataEmissao,
      dataValidade: (maloteConfig as any).validade,
      numeroMalote: maloteConfig.numeroMalote,
      cepOrigem: (maloteConfig as any).cepOrigem,
      cepDestino: (maloteConfig as any).cepDestino,
      ida: maloteConfig.ida,
      tamanho: maloteConfig.tamanho,
      diasServico: maloteConfig.diasServico,
      estacao: maloteConfig.estacao,
      distritos: maloteConfig.distritos,
      ativo: maloteConfig.ativo,
      // Campos exigidos pelo backend (Oracle: SETOR_ORIGEM_ID é NOT NULL)
      setorOrigemId: setorOrigemIdVal ? parseInt(setorOrigemIdVal) : undefined,
      setorDestinoId: setorDestinoIdVal ? parseInt(setorDestinoIdVal) : undefined,
    } as any;
  };

  // Carrega lista de malotes do backend
  const fetchMalotes = async () => {
    try {
      setLoadingMalotes(true);
      // Passando limit=1000 para carregar todos os registros
      const response = await api.get('/malotes', { limit: 1000 });
      console.log('🔍 Resposta da API de malotes:', response.data);
      const data = response.data.success ? response.data.data : response.data;
      console.log('🔍 Data extraída:', data);
      const lista = Array.isArray(data) ? data : [];
      console.log('🔍 Lista de malotes (antes normalização):', lista);
      // Normalizar cada registro para incluir setorNome derivado
      const normalizada = lista.map((x) => {
        const norm = normalizeMaloteFromApi(x);
        console.log('🔍 Malote normalizado:', { original: x, normalizado: norm });
        return norm;
      });
      console.log('🔍 Malotes normalizados (total):', normalizada.length);
      setMalotesData(normalizada);
    } catch (error) {
      console.error('❌ Erro ao buscar malotes:', error);
      setMalotesData([]);
      showError("Erro ao carregar malotes", "Não foi possível carregar a lista de malotes.");
    } finally {
      setLoadingMalotes(false);
    }
  };

  const handleCreateMalote = async () => {
    try {
      // Validar setor origem obrigatório (SETOR_ORIGEM_ID é NOT NULL no Oracle)
      const origemIdStr = (setorOrigemMalote as any)?.setorId || (maloteConfig as any)?.setorId || '';
      const origemId = origemIdStr ? parseInt(origemIdStr) : NaN;
      if (!origemId || Number.isNaN(origemId)) {
        showError('Validação', 'Selecione o Setor Origem antes de criar o malote.');
        return;
      }
      const payload = buildMalotePayload();
      const resp = await api.createMalote(payload);
      const sucesso = (resp as any)?.data?.success ?? (resp as any)?.success;
      const dado = (resp as any)?.data?.data ?? (resp as any)?.data;
      if (sucesso && dado) {
        const novo = normalizeMaloteFromApi(dado);
        setMalotesData(prev => [novo, ...prev]);
        setShowCreateMaloteModal(false);
        showSuccess('Malote criado', 'O malote foi criado com sucesso.');
        resetMaloteForm();
      } else {
        throw new Error((resp as any)?.data?.message || 'Falha ao criar malote');
      }
    } catch (error) {
      console.error('Erro ao criar malote:', error);
      showError('Erro', 'Não foi possível criar o malote.');
    }
  };

  // Quando setores forem carregados/atualizados, re-derivar setorNome nos malotes
  useEffect(() => {
    if (Array.isArray(malotesData) && malotesData.length > 0 && Array.isArray(setoresData) && setoresData.length > 0) {
      setMalotesData(prev => prev.map(x => normalizeMaloteFromApi(x)));
    }
  }, [setoresData]);

  // Persistência backend: criação de malote com CEPs sincronizados
  const handleCreateMalotePersist = async () => {
    try {
      // Validação dos campos obrigatórios do Step 2
      if (!maloteConfig.numeroMalote || !maloteConfig.percurso) {
        showError('Campos obrigatórios', 'Preencha o Nº Malote e o Percurso antes de criar o malote.');
        return;
      }

      // Validar setores origem e destino do Step 1
      const setorOrigemId = String(setorOrigemMalote?.setorId || '').trim();
      const setorDestinoId = String(setorDestinoMalote?.setorId || '').trim();
      const cepOrigem = String(setorOrigemMalote?.enderecoSetor?.cep || maloteConfig.cepOrigem || '').trim();
      const cepDestino = String(setorDestinoMalote?.enderecoSetor?.cep || maloteConfig.cepDestino || '').trim();

      if (!setorOrigemId) {
        showError('Setor Origem obrigatório', 'Selecione o setor de origem no Step 1.');
        return;
      }
      if (!setorDestinoId) {
        showError('Setor Destino obrigatório', 'Selecione o setor de destino no Step 1.');
        return;
      }
      if (!cepOrigem) {
        showError('CEP Origem obrigatório', 'O CEP do setor de origem não foi encontrado.');
        return;
      }
      if (!cepDestino) {
        showError('CEP Destino obrigatório', 'O CEP do setor de destino não foi encontrado.');
        return;
      }

      const payload = {
        numeroContrato: maloteConfig.numeroContrato,
        numeroPercurso: maloteConfig.percurso,
        codigoEmissao: maloteConfig.codigoEmissao,
        dataEmissao: maloteConfig.dataEmissao,
        dataValidade: maloteConfig.validade,
        numeroMalote: maloteConfig.numeroMalote,
        cepOrigem,
        cepDestino,
        ida: maloteConfig.ida,
        tamanho: maloteConfig.tamanho,
        diasServico: maloteConfig.diasServico,
        estacao: maloteConfig.estacao,
        distritos: maloteConfig.distritos,
        ativo: Boolean(maloteConfig.ativo),
        setorOrigemId: Number(setorOrigemId),
        setorDestinoId: Number(setorDestinoId),
      } as any;

      const resp = isEditingMalote
        ? await api.updateMalote(String(editingMaloteId ?? ''), payload)
        : await api.createMalote(payload);
      const dado = (resp as any)?.data?.data ?? (resp as any)?.data ?? null;

      // Recarregar dados do backend para garantir sincronização
      await fetchMalotes();

      setShowCreateMaloteModal(false);
      showSuccess(isEditingMalote ? 'Malote atualizado' : 'Malote criado', isEditingMalote ? 'Alterações salvas com sucesso.' : 'Malote salvo no backend com CEPs sincronizados.');
      resetMaloteForm();
    } catch (error: any) {
      console.error('Erro ao persistir malote:', error);
      const msg = String(error?.message || 'Erro ao salvar malote');
      showError(isEditingMalote ? 'Falha ao atualizar malote' : 'Falha ao criar malote', msg);
    }
  };

  const [configAparencia, setConfigAparencia] = useState({
    tema: 'claro',
    corPrimaria: '#3b82f6',
    corSecundaria: '#64748b',
    logoPersonalizada: '',
    favicon: '',
    fontePrincipal: 'Inter'
  });

  const [configApis, setConfigApis] = useState({
    googleMapsApiKey: '',
    googleMapsAtivo: false,
    openRouteServiceApiKey: '',
    cepApiUrl: 'https://viacep.com.br/ws/',
    cepApiAtivo: true,
    timeoutApi: 30
  });

  // Estados para configurações LDAP
  const [configLdap, setConfigLdap] = useState({
    ldapAtivo: false,
    servidor: '10.9.7.106',
    porta: 389,
    baseDN: 'OU=CONTAS;dc=sefaz;dc=to;dc=gov;dc=br',
    filtroConexao: '(&(objectClass=user)(objectCategory=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))',
    usarBind: true,
    rootDN: 'sefaz\\glpi',
    senhaRootDN: '',
    campoLogin: 'samaccountname',
    nomeServidor: 'srv-acdc',
    servidorPadrao: true
  });

  // Estados para controle de loading
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [savingConfigs, setSavingConfigs] = useState(false);
  // Snapshot das últimas configurações salvas por categoria
  const [lastSavedConfigs, setLastSavedConfigs] = useState<Record<string, any>>({});

  // Estado para controle do modal de teste LDAP
  const [showLdapTestModal, setShowLdapTestModal] = useState(false);

  // Carregar malotes na montagem
  useEffect(() => {
    fetchMalotes();
  }, []);

  // Utilitário simples para comparar objetos de configuração
  const areObjectsEqual = (a: any, b: any) => {
    try {
      const normalize = (obj: any) => {
        if (!obj || typeof obj !== 'object') return obj;
        const entries = Object.entries(obj).sort(([k1], [k2]) => k1.localeCompare(k2));
        return JSON.stringify(entries.map(([k, v]) => [k, typeof v === 'boolean' || typeof v === 'number' || typeof v === 'string' ? v : String(v)]));
      };
      return normalize(a) === normalize(b);
    } catch {
      return false;
    }
  };

  // Normalização de boolean vindos do backend (string/number)
  const toBool = (v: any) => v === true || v === 'true' || v === '1' || v === 1 || v === 'S' || v === 'sim';

  // Função para carregar configurações do banco de dados
  const carregarConfiguracoes = async () => {
    try {
      setLoadingConfigs(true);
      console.log('🔄 Carregando configurações...');
      const response = await api.getConfiguracoes(); // Carregar todas as categorias

      // Normalizar resposta da API (AxiosResponse<ApiResponse>)
      const sucesso = (response as any)?.data?.success ?? (response as any)?.success;
      const dados = (response as any)?.data?.data ?? (response as any)?.data;

      console.log('📡 Resposta da API:', response);

      if (sucesso && dados) {
        const configs = Array.isArray(dados) ? dados : [dados];
        console.log('📋 Configurações recebidas:', configs);

        // Organizar configurações por categoria
        const configsPorCategoria = configs.reduce((acc: any, config: any) => {
          if (!acc[config.categoria]) {
            acc[config.categoria] = {};
          }
          acc[config.categoria][config.chave] = config.valor;
          return acc;
        }, {});

        console.log('🗂️ Configurações por categoria:', configsPorCategoria);

        // Atualizar estados das abas
        if (configsPorCategoria.geral) {
          console.log('✅ Atualizando configGeral com:', configsPorCategoria.geral);

          // Mapear corretamente as chaves do banco para os campos do estado
          const configGeralMapeada = {
            SISTEMA_NOME: configsPorCategoria.geral.SISTEMA_NOME || '',
            cnpj: configsPorCategoria.geral.cnpj || '',
            endereco: configsPorCategoria.geral.endereco || '',
            telefone: configsPorCategoria.geral.telefone || '',
            email: configsPorCategoria.geral.email || '',
            descricao: configsPorCategoria.geral.descricao || '',
            HUB_SETOR_ID: (() => {
              const v = (configsPorCategoria.geral as any).HUB_SETOR_ID;
              if (typeof v === 'number') return v;
              const n = parseInt(v);
              return Number.isFinite(n) ? n : '';
            })()
          };

          setConfigGeral(prev => {
            const newConfig = { ...prev, ...configGeralMapeada };
            console.log('🔄 Estado anterior:', prev);
            console.log('🆕 Novo estado:', newConfig);
            return newConfig;
          });
        } else {
          console.log('⚠️ Nenhuma configuração encontrada para categoria "geral"');
        }
        if (configsPorCategoria.seguranca) {
          setConfigSeguranca(prev => ({ ...prev, ...configsPorCategoria.seguranca }));
        }
        if (configsPorCategoria.notificacoes) {
          setConfigNotificacoes(prev => ({ ...prev, ...configsPorCategoria.notificacoes }));
        }
        if (configsPorCategoria.sistema) {
          setConfigSistema(prev => ({ ...prev, ...configsPorCategoria.sistema }));
        }
        if (configsPorCategoria.aparencia) {
          setConfigAparencia(prev => ({ ...prev, ...configsPorCategoria.aparencia }));
        }
        // Remover tratamento LDAP da tabela CONFIGURACOES (será carregado separadamente)
        if (configsPorCategoria.apis) {
          setConfigApis(prev => ({ ...prev, ...configsPorCategoria.apis }));
        }

        // Carregar configurações específicas de APIs (CONFIGURACOES_APIS)
        try {
          const respApis = await api.getConfiguracoesApis(1);
          const dadosApis = (respApis as any)?.data?.data ?? (respApis as any)?.data;
          const sucessoApis = (respApis as any)?.data?.success ?? (respApis as any)?.success;
          if (sucessoApis && dadosApis) {
            setConfigApis(prev => ({ ...prev, ...(dadosApis || {}) }));
          }
        } catch (e) {
          console.warn('Não foi possível carregar configurações específicas de APIs:', e);
        }
      }

      // Carregar configurações LDAP específicas da tabela CONFIGURACOES_AUTENTICACAO
      try {
        console.log('🔄 Carregando configurações LDAP...');
        const respLdap = await api.buscarConfiguracoesLdap();
        const dadosLdap = (respLdap as any)?.data?.data ?? (respLdap as any)?.data;
        const sucessoLdap = (respLdap as any)?.data?.success ?? (respLdap as any)?.success;

        console.log('📡 Resposta LDAP:', respLdap);

        if (sucessoLdap && dadosLdap) {
          console.log('✅ Configurações LDAP encontradas:', dadosLdap);

          // Mapear configurações LDAP
          const mappedLdap = {
            ldapAtivo: toBool(dadosLdap.ldapAtivo), // Usar ldapAtivo diretamente da resposta
            servidor: dadosLdap.servidor || '',
            porta: typeof dadosLdap.porta === 'number' ? dadosLdap.porta : (parseInt(dadosLdap.porta) || 389),
            baseDN: dadosLdap.baseDN || '',
            filtroConexao: dadosLdap.filtroConexao || '',
            usarBind: toBool(dadosLdap.usarBind),
            rootDN: dadosLdap.rootDN || '',
            senhaRootDN: dadosLdap.senhaRootDN || '',
            campoLogin: dadosLdap.campoLogin || '',
            nomeServidor: dadosLdap.nomeServidor || '',
            servidorPadrao: toBool(dadosLdap.servidorPadrao),
          };

          console.log('🔄 Mapeamento LDAP:', mappedLdap);
          setConfigLdap(prev => {
            const newConfig = { ...prev, ...mappedLdap };
            console.log('🔄 Estado LDAP anterior:', prev);
            console.log('🆕 Novo estado LDAP:', newConfig);
            return newConfig;
          });
        } else {
          console.log('⚠️ Nenhuma configuração LDAP encontrada ou erro na resposta');
        }
      } catch (error) {
        console.warn('Erro ao carregar configurações LDAP:', error);
      }

    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      showError("Erro", "Não foi possível carregar as configurações.");
    } finally {
      setLoadingConfigs(false);
      // Atualiza snapshot com os valores carregados mais recentes
      setLastSavedConfigs({
        geral: configGeral,
        seguranca: configSeguranca,
        notificacoes: configNotificacoes,
        sistema: configSistema,
        aparencia: configAparencia,
        ldap: configLdap,
        apis: configApis,
      });
    }
  };

  // Função para salvar configurações de uma categoria
  const salvarConfiguracoes = async (categoria: string, dados: any) => {
    try {
      setSavingConfigs(true);

      // Se não houver alterações, informa usuário e evita chamada ao backend
      const previous = lastSavedConfigs[categoria];
      if (previous && areObjectsEqual(previous, dados)) {
        showInfo('Sem alterações', 'Os dados já estavam salvos.');
        return;
      }

      // Converter APENAS campos alterados em relação ao snapshot anterior
      const entriesAlteradas = Object.entries(dados).filter(([chave, valorAtual]) => {
        const valorAnterior = previous ? (previous as any)[chave] : undefined;
        const toComparable = (v: any) => {
          if (v === null || v === undefined) return '';
          if (typeof v === 'boolean') return v ? 'S' : 'N';
          if (typeof v === 'number') return v;
          if (typeof v === 'string') {
            const num = Number(v);
            return Number.isFinite(num) && v.trim() !== '' ? num : v;
          }
          return String(v);
        };
        return toComparable(valorAnterior) !== toComparable(valorAtual);
      });
      const configuracoes = entriesAlteradas.map(([chave, valor]) => ({
        categoria,
        chave,
        valor: String(valor),
        tipo:
          typeof valor === 'boolean'
            ? 'boolean'
            : typeof valor === 'number'
              ? 'number'
              : 'string',
      }));

      // Evitar enviar HUB_SETOR_ID vazio para não criar configuração com tipo incorreto
      const configuracoesFiltradas = configuracoes.filter((c) => {
        if (c.chave === 'HUB_SETOR_ID') {
          return c.valor !== '';
        }
        return true;
      });

      // Se nenhuma configuração alterada, evita chamada desnecessária
      if (configuracoesFiltradas.length === 0) {
        showInfo('Sem alterações', 'Nenhum campo modificado para salvar.');
        return;
      }
      const response = await api.atualizarMultiplasConfiguracoes(configuracoesFiltradas);
      const sucesso = (response as any)?.data?.success ?? (response as any)?.success;
      const mensagem = (response as any)?.data?.message ?? (response as any)?.message;
      const detalhesErros = (response as any)?.data?.data?.erros ?? (response as any)?.data?.erros;

      if (sucesso) {
        showSuccess('Sucesso', `Configurações de ${categoria} salvas com sucesso!`);
        // Atualiza snapshot local para detectar futuras tentativas sem alteração
        setLastSavedConfigs(prev => ({ ...prev, [categoria]: dados }));
        // Recarregar configurações para garantir sincronização
        await carregarConfiguracoes();
      } else {
        // Tornar a mensagem mais clara e acionável
        const dataResp = (response as any)?.data?.data ?? (response as any)?.data;
        const errosLista: any[] = Array.isArray(dataResp?.erros)
          ? dataResp.erros
          : Array.isArray(detalhesErros)
            ? detalhesErros
            : [];
        const processadas = typeof dataResp?.processadas === 'number' ? dataResp.processadas : undefined;
        const totalErros = Array.isArray(errosLista) ? errosLista.length : undefined;

        const cabecalho = mensagem
          || (processadas !== undefined && totalErros !== undefined
            ? `${processadas} configurações aplicadas; ${totalErros} com erro`
            : `Não foi possível salvar as configurações de ${categoria}`);

        const detalhesFormatados = Array.isArray(errosLista) && errosLista.length > 0
          ? `\nProblemas encontrados:\n${errosLista
            .map((e: any) => `• ${(e.categoria || categoria)}/${(e.chave || e.field || 'chave')}: ${e.erro || e.message || 'valor inválido'}`)
            .join('\n')}`
          : '';

        const dica = `\nDica: verifique se os campos estão editáveis e se os tipos estão corretos (booleano, número ou texto).`;

        showError('Erro ao salvar', `${cabecalho}${detalhesFormatados}${dica}`);
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      showError('Erro', `Não foi possível salvar as configurações de ${categoria}. ${msg}`);
    } finally {
      setSavingConfigs(false);
    }
  };

  // Funções específicas para salvar cada aba
  const salvarConfigGeral = () => salvarConfiguracoes('geral', configGeral);
  const salvarConfigSeguranca = () => salvarConfiguracoes('seguranca', configSeguranca);
  const salvarConfigNotificacoes = () => salvarConfiguracoes('notificacoes', configNotificacoes);
  const salvarConfigSistema = () => salvarConfiguracoes('sistema', configSistema);
  const salvarConfigAparencia = () => salvarConfiguracoes('aparencia', configAparencia);
  const salvarConfigLdap = async () => {
    try {
      setSavingConfigs(true);

      // Se não houver alterações, informa usuário e evita chamada ao backend
      const previous = lastSavedConfigs['ldap'];
      if (previous && areObjectsEqual(previous, configLdap)) {
        showInfo('Sem alterações', 'Os dados já estavam salvos.');
        return;
      }

      const response = await api.salvarConfiguracoesLdap(configLdap);
      const sucesso = (response as any)?.data?.success ?? (response as any)?.success;
      const mensagem = (response as any)?.data?.message ?? (response as any)?.message;

      if (sucesso) {
        showSuccess('Sucesso', 'Configurações LDAP salvas com sucesso!');
        // Atualiza snapshot local para detectar futuras tentativas sem alteração
        setLastSavedConfigs(prev => ({ ...prev, ldap: configLdap }));
        // Recarregar configurações para garantir sincronização
        await carregarConfiguracoes();
      } else {
        showError('Erro ao salvar', mensagem || 'Não foi possível salvar as configurações LDAP.');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações LDAP:', error);
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      showError('Erro', `Não foi possível salvar as configurações LDAP. ${msg}`);
    } finally {
      setSavingConfigs(false);
    }
  };
  const salvarConfigApis = async () => {
    try {
      setSavingConfigs(true);
      const payload = {
        ...configApis,
        timeoutApi: typeof (configApis as any).timeoutApi === 'string' ? parseInt((configApis as any).timeoutApi as any, 10) || 0 : (configApis as any).timeoutApi,
      } as any;
      const response = await api.salvarConfiguracoesApis(1, payload);
      const sucesso = (response as any)?.data?.success ?? (response as any)?.success;
      const mensagem = (response as any)?.data?.message ?? (response as any)?.message;
      if (sucesso) {
        showInfo("Sucesso", "Configurações de APIs salvas com sucesso!");
        await carregarConfiguracoes();
      } else {
        throw new Error(mensagem || 'Erro ao salvar configurações de APIs');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações de APIs:', error);
      showError("Erro", "Não foi possível salvar as configurações de APIs.");
    } finally {
      setSavingConfigs(false);
    }
  };

  // -----------------------------
  // Estados e Handlers CRUD Usuário
  // -----------------------------
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isViewModeUser, setIsViewModeUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [perfilFilter, setPerfilFilter] = useState("todos");

  // Estados para ordenação e paginação de usuários
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Estados para filtros e busca de setores
  const [searchTermSetores, setSearchTermSetores] = useState("");
  const [statusFilterSetores, setStatusFilterSetores] = useState("todos");
  const [orgaoFilterSetores, setOrgaoFilterSetores] = useState("todos");
  const [viewModeSetores, setViewModeSetores] = useState<'grid' | 'list'>('list');
  const [viewModeUsuarios, setViewModeUsuarios] = useState<'grid' | 'list'>('list');

  // Estados para paginação e ordenação de setores
  const [currentPageSetores, setCurrentPageSetores] = useState(1);
  const [itemsPerPageSetores] = useState(10);
  const [sortConfigSetores, setSortConfigSetores] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Estados para mapas
  const [showMapaSetores, setShowMapaSetores] = useState(false);
  const [showMapaSetoresModal, setShowMapaSetoresModal] = useState(false);
  const [showMapaUsuarios, setShowMapaUsuarios] = useState(false);
  const [showMapaUsuariosModal, setShowMapaUsuariosModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);



  // Função para ordenar colunas de usuários
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Função para ordenar colunas de setores
  const handleSortSetores = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfigSetores && sortConfigSetores.key === key && sortConfigSetores.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfigSetores({ key, direction });
  };

  // Função para renderizar cabeçalho com ordenação
  const renderSortableHeader = (key: string, label: string, className?: string) => {
    const isActive = sortConfig?.key === key;
    const direction = sortConfig?.direction;

    return (
      <TableHead className={`cursor-pointer hover:bg-muted/50 ${className || ''}`} onClick={() => handleSort(key)}>
        <div className="flex items-center gap-1">
          <span>{label}</span>
          <div className="flex flex-col">
            <ChevronUp className={`w-3 h-3 ${isActive && direction === 'asc' ? 'text-primary' : 'text-muted-foreground'}`} />
            <ChevronDown className={`w-3 h-3 -mt-1 ${isActive && direction === 'desc' ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
        </div>
      </TableHead>
    );
  };

  // Função para renderizar cabeçalho com ordenação para setores
  const renderSortableHeaderSetores = (key: string, label: string, className?: string) => {
    const isActive = sortConfigSetores?.key === key;
    const direction = sortConfigSetores?.direction;

    return (
      <TableHead className={`cursor-pointer hover:bg-muted/50 ${className || ''}`} onClick={() => handleSortSetores(key)}>
        <div className="flex items-center gap-1">
          <span>{label}</span>
          <div className="flex flex-col">
            <ChevronUp className={`w-3 h-3 ${isActive && direction === 'asc' ? 'text-primary' : 'text-muted-foreground'}`} />
            <ChevronDown className={`w-3 h-3 -mt-1 ${isActive && direction === 'desc' ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
        </div>
      </TableHead>
    );
  };

  // Filtrar, ordenar e paginar usuários
  const filteredAndSortedUsuarios = (() => {
    let filtered = usuariosData.filter((usuario) => {
      const activeFlag = usuario.IS_ACTIVE !== undefined ? usuario.IS_ACTIVE : usuario.USUARIO_ATIVO;
      const statusString = activeFlag ? 'ativo' : 'inativo';
      const roleString = (usuario.ROLE || usuario.PERFIL || '').toString();
      const setorString = (usuario.setor || usuario.SETOR || usuario.setorNome || usuario.SETOR_NOME || usuario.setor_nome || usuario.department || '').toString();
      const createdRaw = usuario.CREATED_AT || usuario.created_at || usuario.createdAt;
      let createdString = '';
      if (createdRaw) {
        try {
          const d = typeof createdRaw === 'string' ? new Date(createdRaw) : new Date(createdRaw as any);
          createdString = isNaN(d.getTime()) ? String(createdRaw) : d.toLocaleDateString('pt-BR');
        } catch {
          createdString = String(createdRaw);
        }
      }

      const search = normalizeText(searchTerm);
      const perfilVal = usuario.perfil || usuario.PERFIL || usuario.ROLE || '';
      const setorVal = usuario.setor || usuario.SETOR || usuario.setorNome || usuario.SETOR_NOME || usuario.setor_nome || usuario.department || '';
      const candidates = [
        usuario.NOME || usuario.nome || usuario.NAME || '',
        usuario.E_MAIL || usuario.EMAIL || usuario.email || '',
        String(formatMatriculaVinculo(usuario) || ''),
        String(usuario.MATRICULA || ''),
        String(usuario.numero_funcional || usuario.numeroFuncional || ''),
        String(usuario.VINCULO_FUNCIONAL || usuario.vinculo_funcional || usuario.vinculoFuncional || ''),
        setorVal,
        usuario.CARGO || usuario.cargo || '',
        perfilVal,
        statusString,
        createdString,
      ];
      const matchesSearch = !searchTerm || candidates.some(c => normalizeText(String(c)).includes(search));

      const matchesStatus =
        statusFilter === "todos" ||
        (statusFilter === "ativo" && activeFlag) ||
        (statusFilter === "inativo" && !activeFlag);

      const matchesPerfil =
        perfilFilter === "todos" ||
        roleString.toLowerCase() === perfilFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesPerfil;
    });

    // Depois, ordenar
    if (sortConfig) {
      filtered.sort((a, b) => {
        // Mapear chaves para os nomes corretos dos campos
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'nome':
            aValue = a.NOME || a.NAME || '';
            bValue = b.NOME || b.NAME || '';
            break;
          case 'email':
            aValue = a.E_MAIL || a.EMAIL || '';
            bValue = b.E_MAIL || b.EMAIL || '';
            break;
          case 'matricula':
            aValue = a.MATRICULA || 0;
            bValue = b.MATRICULA || 0;
            break;
          case 'vinculo':
            aValue = a.VINCULO_FUNCIONAL || 0;
            bValue = b.VINCULO_FUNCIONAL || 0;
            break;
          case 'setor':
            aValue = a.NOME_SETOR || '';
            bValue = b.NOME_SETOR || '';
            break;
          case 'cargo':
            aValue = a.CARGO || '';
            bValue = b.CARGO || '';
            break;
          case 'ativo':
            aValue = a.IS_ACTIVE !== undefined ? a.IS_ACTIVE : a.USUARIO_ATIVO;
            bValue = b.IS_ACTIVE !== undefined ? b.IS_ACTIVE : b.USUARIO_ATIVO;
            break;
          case 'role':
          case 'perfil':
            aValue = a.ROLE || a.PERFIL || '';
            bValue = b.ROLE || b.PERFIL || '';
            break;
          case 'data_criacao':
          case 'created_at':
            aValue = a.DATA_CRIACAO || a.created_at || '';
            bValue = b.DATA_CRIACAO || b.created_at || '';
            break;
          default:
            aValue = a[sortConfig.key as keyof typeof a];
            bValue = b[sortConfig.key as keyof typeof b];
        }

        // Tratamento especial para datas
        if (sortConfig.key.includes('data') || sortConfig.key === 'created_at' || sortConfig.key === 'DATA_CRIACAO') {
          const aDate = new Date(aValue as string).getTime();
          const bDate = new Date(bValue as string).getTime();
          return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
        }

        // Tratamento para valores booleanos
        if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          return sortConfig.direction === 'asc'
            ? (aValue === bValue ? 0 : aValue ? 1 : -1)
            : (aValue === bValue ? 0 : aValue ? -1 : 1);
        }

        // Tratamento para números
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Tratamento para strings (normalizar para comparação)
        const aStr = normalizeText(String(aValue || ''));
        const bStr = normalizeText(String(bValue || ''));

        if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  })();

  // Calcular paginação
  const totalPages = Math.ceil(filteredAndSortedUsuarios.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsuarios = filteredAndSortedUsuarios.slice(startIndex, endIndex);

  // Para compatibilidade com código existente
  const filteredUsuarios = filteredAndSortedUsuarios;

  // Filtrar, ordenar e paginar setores
  const filteredAndSortedSetores = (() => {
    // Primeiro, filtrar
    let filtered = setoresData.filter((setor) => {
      const searchS = normalizeText(searchTermSetores);
      const enderecoStr = `${setor.LOGRADOURO || ''} ${setor.NUMERO || ''} ${setor.COMPLEMENTO || ''} - ${setor.BAIRRO || ''}`.trim();
      const statusLabelS = setor.ATIVO ? 'Ativo' : 'Inativo';
      const statusKeyS = setor.ATIVO ? 'ativo' : 'inativo';
      const candidatesS = [
        setor.NOME_SETOR || setor.SETOR || '',
        setor.ORGAO || '',
        setor.CODIGO || setor.CODIGO_SETOR || '',
        enderecoStr,
        setor.TELEFONE || '',
        setor.EMAIL || '',
        statusLabelS,
        statusKeyS,
      ];
      const matchesSearch = !searchTermSetores || candidatesS.some(c => normalizeText(String(c)).includes(searchS));

      const matchesStatus =
        statusFilterSetores === "todos" ||
        (statusFilterSetores === "ativo" && setor.ATIVO) ||
        (statusFilterSetores === "inativo" && !setor.ATIVO);

      const matchesOrgao =
        orgaoFilterSetores === "todos" ||
        setor.ORGAO === orgaoFilterSetores;

      return matchesSearch && matchesStatus && matchesOrgao;
    });

    // Depois, ordenar
    if (sortConfigSetores) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        // Tratamento especial para o campo ENDERECO (concatenação)
        if (sortConfigSetores.key === 'ENDERECO') {
          aValue = `${a.LOGRADOURO || ''} ${a.NUMERO || ''} ${a.COMPLEMENTO || ''} - ${a.BAIRRO || ''}`.trim();
          bValue = `${b.LOGRADOURO || ''} ${b.NUMERO || ''} ${b.COMPLEMENTO || ''} - ${b.BAIRRO || ''}`.trim();
        } else {
          aValue = a[sortConfigSetores.key as keyof typeof a];
          bValue = b[sortConfigSetores.key as keyof typeof b];
        }

        // Tratamento especial para datas
        if (sortConfigSetores.key.includes('data') || sortConfigSetores.key === 'created_at') {
          const aDate = new Date(aValue as string).getTime();
          const bDate = new Date(bValue as string).getTime();
          return sortConfigSetores.direction === 'asc' ? aDate - bDate : bDate - aDate;
        }

        // Tratamento para valores booleanos
        if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          return sortConfigSetores.direction === 'asc'
            ? (aValue === bValue ? 0 : aValue ? 1 : -1)
            : (aValue === bValue ? 0 : aValue ? -1 : 1);
        }

        // Tratamento para strings e números (incluindo TELEFONE e EMAIL)
        const aStr = String(aValue || '').toLowerCase();
        const bStr = String(bValue || '').toLowerCase();

        if (aStr < bStr) return sortConfigSetores.direction === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortConfigSetores.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  })();

  // Calcular paginação para setores
  const totalPagesSetores = Math.ceil(filteredAndSortedSetores.length / itemsPerPageSetores);
  const startIndexSetores = (currentPageSetores - 1) * itemsPerPageSetores;
  const endIndexSetores = startIndexSetores + itemsPerPageSetores;
  const paginatedSetores = filteredAndSortedSetores.slice(startIndexSetores, endIndexSetores);

  // Para compatibilidade com código existente
  const filteredSetores = filteredAndSortedSetores;

  const [formData, setFormData] = useState({
    // Campos principais conforme estrutura da tabela USUARIOS
    nome: "",
    e_mail: "",
    senha: "",
    role: "",
    usuario_ativo: true,
    setor_id: "",
    matricula: "",
    vinculo_funcional: "",
    // Dados pessoais
    cpf: "",
    'pis/pasep': "",
    sexo: "",
    estado_civil: "",
    data_nascimento: "",
    pai: "",
    mae: "",
    // Documentos
    rg: "",
    tipo_rg: "",
    orgao_expeditor: "",
    uf_rg: "",
    expedicao_rg: "",
    cidade_nascimento: "",
    uf_nascimento: "",
    tipo_sanguineo: "",
    raca_cor: "",
    pne: 0,
    // Dados funcionais
    tipo_vinculo: "",
    categoria: "",
    regime_juridico: "",
    regime_previdenciario: "",
    tipo_evento: "",
    forma_provimento: "",
    codigo_cargo: "",
    cargo: "",
    escolaridade_cargo: "",
    escolaridade_servidor: "",
    formacao_profissional_1: "",
    formacao_profissional_2: "",
    jornada: "",
    nivel_referencia: "",
    comissao_funcao: "",
    data_ini_comissao: "",
    // Contato e endereço
    telefone: "",
    logradouro: "",
    numero_endereco: "",
    complemento_endereco: "",
    bairro_endereco: "",
    cidade_endereco: "",
    uf_endereco: "",
    cep_endereco: "",
    // Campos de compatibilidade
    email: "",
    perfil: "",
    ativo: true,
  });

  // Estado para controlar a visibilidade da senha
  const [showPassword, setShowPassword] = useState(false);

  // Setor selecionado para o usuário (para exibir mapa no modal de criação)
  const selectedSetorUsuario = useMemo(() => {
    if (!formData?.setor_id) return null;
    return (setoresData || []).find((s: any) => s && (s.ID || s.id) && String(s.ID ?? s.id) === String(formData.setor_id));
  }, [formData?.setor_id, setoresData]);

  const resetForm = () =>
    setFormData({
      // Campos principais conforme estrutura da tabela USUARIOS
      nome: "",
      e_mail: "",
      senha: "",
      role: "",
      usuario_ativo: true,
      setor_id: "",
      matricula: "",
      vinculo_funcional: "",
      // Dados pessoais
      cpf: "",
      'pis/pasep': "",
      sexo: "",
      estado_civil: "",
      data_nascimento: "",
      pai: "",
      mae: "",
      // Documentos
      rg: "",
      tipo_rg: "",
      orgao_expeditor: "",
      uf_rg: "",
      expedicao_rg: "",
      cidade_nascimento: "",
      uf_nascimento: "",
      tipo_sanguineo: "",
      raca_cor: "",
      pne: 0,
      // Dados funcionais
      tipo_vinculo: "",
      categoria: "",
      regime_juridico: "",
      regime_previdenciario: "",
      tipo_evento: "",
      forma_provimento: "",
      codigo_cargo: "",
      cargo: "",
      escolaridade_cargo: "",
      escolaridade_servidor: "",
      formacao_profissional_1: "",
      formacao_profissional_2: "",
      jornada: "",
      nivel_referencia: "",
      comissao_funcao: "",
      data_ini_comissao: "",
      // Contato e endereço
      telefone: "",
      endereco: "",
      logradouro: "",
      numero_endereco: "",
      complemento_endereco: "",
      bairro_endereco: "",
      cidade_endereco: "",
      uf_endereco: "",
      cep_endereco: "",
      // Campos de compatibilidade
      email: "",
      perfil: "",
      ativo: true,
    });

  // Memoizar o setor selecionado do formulário de usuário para otimizar performance
  const selectedSetorForm = useMemo(() => {
    if (!formData.setor_id || !setoresData) return null;
    return setoresData.find(s => s && s.ID && s.ID.toString() === formData.setor_id?.toString());
  }, [formData.setor_id, setoresData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Aplicar formatação específica para telefone
    if (name === 'telefone') {
      // Telefone: formatação (63) 1234-1234 (14 caracteres)
      const cleanPhone = value.replace(/\D/g, '');
      const limitedPhone = cleanPhone.slice(0, 10);
      let maskedPhone = '';

      if (limitedPhone.length > 0) {
        if (limitedPhone.length <= 2) {
          maskedPhone = `(${limitedPhone}`;
        } else if (limitedPhone.length <= 6) {
          maskedPhone = `(${limitedPhone.slice(0, 2)}) ${limitedPhone.slice(2)}`;
        } else {
          maskedPhone = `(${limitedPhone.slice(0, 2)}) ${limitedPhone.slice(2, 6)}-${limitedPhone.slice(6)}`;
        }
      }

      setFormData((prev) => ({ ...prev, [name]: maskedPhone }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateUser = async () => {
    try {
      // Criar uma cópia dos dados do formulário
      const createData = { ...formData };

      // Converter role/perfil para maiúscula antes de salvar no banco
      if (createData.perfil) {
        createData.perfil = createData.perfil.toUpperCase();
      }
      if (createData.role) {
        createData.role = createData.role.toUpperCase();
      }

      await api.createUser(createData);
      await fetchUsuarios();
      setShowCreateModal(false);
      resetForm();
      showInfo("Usuário criado com sucesso!", `O usuário ${formData.nome} foi adicionado ao sistema.`);
    } catch (error) {
      console.error("Erro ao criar usuário", error);
      showError("Erro ao criar usuário", "Ocorreu um erro ao tentar criar o usuário. Tente novamente.");
    }
  };

  // Função para buscar dados completos do usuário por ID
  const fetchUserById = async (userId: string | number) => {
    try {
      const response = await api.getUserById(userId);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
      showError("Erro ao carregar dados", "Não foi possível carregar os dados completos do usuário.");
      return null;
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      // Criar uma cópia dos dados do formulário
      const updateData = { ...formData };

      // Se a senha não foi alterada (ainda é o hash original), remover do objeto de atualização
      const originalPasswordHash = selectedUser.senha || selectedUser.passwordHash || "";
      if (updateData.senha === originalPasswordHash || !updateData.senha || updateData.senha.trim() === "") {
        delete updateData.senha;
      }

      // Converter role/perfil para maiúscula antes de salvar no banco
      if (updateData.perfil) {
        updateData.perfil = updateData.perfil.toUpperCase();
      }
      if (updateData.role) {
        updateData.role = updateData.role.toUpperCase();
      }

      await api.updateUser(selectedUser.id, updateData);
      await fetchUsuarios();
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      showInfo("Usuário atualizado com sucesso!", `Os dados do usuário ${formData.nome} foram atualizados.`);
    } catch (error) {
      console.error("Erro ao atualizar usuário", error);
      showError("Erro ao atualizar usuário", "Ocorreu um erro ao tentar atualizar o usuário. Tente novamente.");
    }
  };

  const handleDeleteUser = async (id: number) => {
    const userToDelete = usuariosData.find(user => user.id === id);
    if (!confirm("Confirma a exclusão deste usuário?")) return;
    try {
      await api.deleteUser(id);
      await fetchUsuarios();
      showInfo("Usuário excluído com sucesso!", `O usuário ${userToDelete?.nome || 'selecionado'} foi removido do sistema.`);
    } catch (error) {
      console.error("Erro ao excluir usuário", error);
      showError("Erro ao excluir usuário", "Ocorreu um erro ao tentar excluir o usuário. Tente novamente.");
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
            <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <Tabs defaultValue="geral" className="space-y-4">
          <TabsList className="grid w-full grid-cols-11">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="seguranca">Segurança</TabsTrigger>
            <TabsTrigger value="autenticacao">Autenticação</TabsTrigger>
            <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
            <TabsTrigger value="sistema">Sistema</TabsTrigger>
            <TabsTrigger value="aparencia">Aparência</TabsTrigger>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            <TabsTrigger value="setores">Setores</TabsTrigger>
            <TabsTrigger value="apis">APIs</TabsTrigger>
            <TabsTrigger value="malote">Malote</TabsTrigger>
            <TabsTrigger value="lacre">Lacre</TabsTrigger>
          </TabsList>

          {/* ---------------- GERAl ---------------- */}
          <TabsContent value="geral" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" /> Configurações Gerais
                </CardTitle>
                <CardDescription>
                  Configure as informações básicas do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Seção: Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">Informações Básicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <Label htmlFor="SISTEMA_NOME">Nome do Sistema</Label>
                      <Input
                        id="SISTEMA_NOME"
                        value={configGeral.SISTEMA_NOME}
                        onChange={(e) => setConfigGeral(prev => ({ ...prev, SISTEMA_NOME: e.target.value }))}
                        placeholder="Digite o nome do sistema"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nomeInstituicao">Nome da Instituição</Label>
                      <Input
                        id="nomeInstituicao"
                        value={configGeral.nomeInstituicao}
                        onChange={(e) => setConfigGeral(prev => ({ ...prev, nomeInstituicao: e.target.value }))}
                        placeholder="Digite o nome da instituição"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={configGeral.cnpj}
                      onChange={(e) => setConfigGeral(prev => ({ ...prev, cnpj: e.target.value }))}
                      placeholder="00.000.000/0001-00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={configGeral.descricao}
                      onChange={(e) => setConfigGeral(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Digite uma descrição da instituição"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Seção: Endereço e Localização */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">Endereço e Localização</h3>
                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      value={configGeral.endereco}
                      onChange={(e) => setConfigGeral(prev => ({ ...prev, endereco: e.target.value }))}
                      placeholder="Digite o endereço"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        value={configGeral.cidade}
                        onChange={(e) => setConfigGeral(prev => ({ ...prev, cidade: e.target.value }))}
                        placeholder="Digite a cidade"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="enderecoCompleto">Endereço Completo</Label>
                      <Input
                        id="enderecoCompleto"
                        value={configGeral.enderecoCompleto}
                        onChange={(e) => setConfigGeral(prev => ({ ...prev, enderecoCompleto: e.target.value }))}
                        placeholder="Endereço completo com CEP"
                      />
                    </div>
                  </div>
                </div>

                {/* Seção: Contato */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">Informações de Contato</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={configGeral.telefone}
                        onChange={(e) => setConfigGeral(prev => ({ ...prev, telefone: e.target.value }))}
                        placeholder="(63) 3000-0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        value={configGeral.whatsapp}
                        onChange={(e) => setConfigGeral(prev => ({ ...prev, whatsapp: e.target.value }))}
                        placeholder="(63) 99999-9999"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail Institucional</Label>
                      <Input
                        id="email"
                        type="email"
                        value={configGeral.email}
                        onChange={(e) => setConfigGeral(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="contato@to.gov.br"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailContato">E-mail de Contato</Label>
                      <Input
                        id="emailContato"
                        type="email"
                        value={configGeral.emailContato}
                        onChange={(e) => setConfigGeral(prev => ({ ...prev, emailContato: e.target.value }))}
                        placeholder="contato@instituicao.gov.br"
                      />
                    </div>
                  </div>
                </div>

                {/* Seção: URLs e Redes Sociais */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">URLs e Redes Sociais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="siteUrl">Site Institucional</Label>
                      <Input
                        id="siteUrl"
                        type="url"
                        value={configGeral.siteUrl}
                        onChange={(e) => setConfigGeral(prev => ({ ...prev, siteUrl: e.target.value }))}
                        placeholder="https://www.instituicao.gov.br"
                      />
                    </div>
                    <ImageUploadEditor
                      value={configGeral.logoHeaderUrl}
                      onChange={(url) => setConfigGeral(prev => ({ ...prev, logoHeaderUrl: url }))}
                      label="URL do Logo (Header)"
                      placeholder="https://exemplo.com/logo.png"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="facebookUrl">Facebook</Label>
                      <Input
                        id="facebookUrl"
                        type="url"
                        value={configGeral.facebookUrl}
                        onChange={(e) => setConfigGeral(prev => ({ ...prev, facebookUrl: e.target.value }))}
                        placeholder="https://facebook.com/instituicao"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagramUrl">Instagram</Label>
                      <Input
                        id="instagramUrl"
                        type="url"
                        value={configGeral.instagramUrl}
                        onChange={(e) => setConfigGeral(prev => ({ ...prev, instagramUrl: e.target.value }))}
                        placeholder="https://instagram.com/instituicao"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitterUrl">Twitter/X</Label>
                    <Input
                      id="twitterUrl"
                      type="url"
                      value={configGeral.twitterUrl}
                      onChange={(e) => setConfigGeral(prev => ({ ...prev, twitterUrl: e.target.value }))}
                      placeholder="https://twitter.com/instituicao"
                    />
                  </div>
                </div>

                {/* Seção: Configurações Adicionais */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">Configurações Adicionais</h3>
                  <div className="space-y-2">
                    <Label htmlFor="textoCopyright">Texto de Copyright</Label>
                    <Input
                      id="textoCopyright"
                      value={configGeral.textoCopyright}
                      onChange={(e) => setConfigGeral(prev => ({ ...prev, textoCopyright: e.target.value }))}
                      placeholder="© 2024 Instituição. Todos os direitos reservados."
                    />
                  </div>

                  {/* (Movido) Seletor de Setor Hub foi movido para a aba Malote */}
                </div>



                <div className="flex justify-end pt-4">
                  <Button
                    onClick={salvarConfigGeral}
                    disabled={savingConfigs}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {savingConfigs ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </div>

                {/* Paginação para Setores */}
                {totalPagesSetores > 1 && (
                  <div className="flex items-center justify-between px-2 py-4">
                    <div className="text-sm text-muted-foreground">
                      Página {currentPageSetores} de {totalPagesSetores}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPageSetores(prev => Math.max(prev - 1, 1))}
                        disabled={currentPageSetores === 1}
                      >
                        Anterior
                      </Button>
                      {Array.from({ length: totalPagesSetores }, (_, i) => i + 1)
                        .filter(page => {
                          const distance = Math.abs(page - currentPageSetores);
                          return distance === 0 || distance === 1 || page === 1 || page === totalPagesSetores;
                        })
                        .map((page, index, array) => {
                          const showEllipsis = index > 0 && page - array[index - 1] > 1;
                          return (
                            <React.Fragment key={page}>
                              {showEllipsis && <span className="px-2 text-muted-foreground">...</span>}
                              <Button
                                variant={currentPageSetores === page ? "default" : "outline"}
                                size="sm"
                                className="w-8 h-8 p-0"
                                onClick={() => setCurrentPageSetores(page)}
                              >
                                {page}
                              </Button>
                            </React.Fragment>
                          );
                        })}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPageSetores(prev => Math.min(prev + 1, totalPagesSetores))}
                        disabled={currentPageSetores === totalPagesSetores}
                      >
                        Próximo
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- LACRE ---------------- */}
          <TabsContent value="lacre" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" /> Gerenciamento de Lacres
                    </CardTitle>
                    <CardDescription>
                      Mantenha o ciclo de vida de lacres: lote e distribuição
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowGerarLacresModal(true)}
                      className={`${classes.button} text-white`}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Gerar lacres
                    </Button>
                    <Button
                      onClick={() => setShowDistribuirLacresModal(true)}
                      className={`${classes.button} text-white`}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Distribuir lacres
                    </Button>
                    <Button
                      onClick={() => { if (lacreSelecionado?.loteNumero) { setDestruirFormLacre(prev => ({ ...prev, loteNumero: String(lacreSelecionado.loteNumero) })); } setShowDestruirLacresModal(true); }}
                      className={`${classes.button} text-white`}
                      disabled={!isAdmin}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Destruir lacres
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filtros e Busca */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por código ou setor..."
                        value={lacreFilters.busca}
                        onChange={(e) => { setLacreFilters(prev => ({ ...prev, busca: e.target.value })); setCurrentPageLacre(1); setKanbanDisponiveisPage(1); setKanbanAtribuidosPage(1); setKanbanUtilizadosPage(1); setKanbanDestruidosLotePage(1); setKanbanDestruidosIndividuaisPage(1); setKanbanDestruidosTab('lote'); }}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Select value={lacreFilters.status} onValueChange={(v) => { setLacreFilters(prev => ({ ...prev, status: v })); setCurrentPageLacre(1); setKanbanDisponiveisPage(1); setKanbanAtribuidosPage(1); setKanbanUtilizadosPage(1); setKanbanDestruidosLotePage(1); setKanbanDestruidosIndividuaisPage(1); setKanbanDestruidosTab('lote'); }}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="disponivel">DISPONÍVEL</SelectItem>
                        <SelectItem value="reservado">RESERVADO</SelectItem>
                        <SelectItem value="vinculado">VINCULADO</SelectItem>
                        <SelectItem value="utilizado">UTILIZADO</SelectItem>
                        <SelectItem value="extraviado">EXTRAVIADO</SelectItem>
                        <SelectItem value="danificado">DANIFICADO</SelectItem>
                        <SelectItem value="destruido">DESTRUÍDO</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={lacreFilters.setorId} onValueChange={(v) => { setLacreFilters(prev => ({ ...prev, setorId: v })); setCurrentPageLacre(1); setKanbanDisponiveisPage(1); setKanbanAtribuidosPage(1); setKanbanUtilizadosPage(1); setKanbanDestruidosLotePage(1); setKanbanDestruidosIndividuaisPage(1); setKanbanDestruidosTab('lote'); }}>
                      <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Setor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os setores</SelectItem>
                        {Array.isArray(setoresData) && setoresData.map((s: any) => (
                          <SelectItem key={String(s.ID)} value={String(s.ID)}>{s.NOME_SETOR || s.SETOR || 'Setor'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Contador de Resultados */}
                {(() => {
                  const total = filteredLacres.length;
                  const totalPages = Math.max(1, Math.ceil(total / itemsPerPageLacre));
                  const startIndex = (currentPageLacre - 1) * itemsPerPageLacre;
                  const endIndex = Math.min(startIndex + itemsPerPageLacre, total);
                  const pageItems = filteredLacres.slice(startIndex, endIndex);

                  return (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-muted-foreground">
                          Exibindo {pageItems.length} de {total} lacres
                        </p>
                        {(lacreFilters.busca || lacreFilters.status !== 'todos' || lacreFilters.setorId !== 'todos') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setLacreFilters({ status: 'todos', setorId: 'todos', busca: '' }); setCurrentPageLacre(1); setKanbanDisponiveisPage(1); setKanbanAtribuidosPage(1); setKanbanUtilizadosPage(1); setKanbanDestruidosLotePage(1); setKanbanDestruidosIndividuaisPage(1); setKanbanDestruidosTab('lote'); }}
                          >
                            Limpar filtros
                          </Button>
                        )}
                      </div>

                      {/* Lacres agrupados por status (Kanban simples) */}
                      {(() => {
                        // Agrupamento por status usando TODOS os itens filtrados
                        // Remover 'utilizado' de Atribuídos para aparecer na nova coluna
                        const assignedStatuses = new Set(['atribuido', 'reservado', 'vinculado', 'extraviado', 'danificado']);
                        const groupDisponiveis = filteredLacres.filter((l: any) => l.status === 'disponivel');
                        const groupUtilizados = filteredLacres.filter((l: any) => l.status === 'utilizado');
                        const groupAtribuidos = filteredLacres.filter((l: any) => assignedStatuses.has(l.status));
                        const groupDestruidos = filteredLacres.filter((l: any) => ['destruido', 'extraviado', 'danificado'].includes(String(l.status)));

                        // Divisão de destruídos: em lote (sem vínculos) vs individuais (com setor/encomenda)
                        const groupDestruidosLote = groupDestruidos.filter((l: any) => (l.setorId == null || String(l.setorId) === '') && (l.encomendaId == null || String(l.encomendaId) === ''));
                        const groupDestruidosIndividuais = groupDestruidos.filter((l: any) => !((l.setorId == null || String(l.setorId) === '') && (l.encomendaId == null || String(l.encomendaId) === '')));

                        // Paginação de cada coluna/seção (5 por página)
                        // Disponíveis
                        const totalPagesDisponiveis = Math.max(1, Math.ceil(groupDisponiveis.length / itemsPerPageKanban));
                        const startIndexDisponiveis = (kanbanDisponiveisPage - 1) * itemsPerPageKanban;
                        const endIndexDisponiveis = Math.min(startIndexDisponiveis + itemsPerPageKanban, groupDisponiveis.length);
                        const visibleDisponiveis = groupDisponiveis.slice(startIndexDisponiveis, endIndexDisponiveis);

                        // Atribuídos (com subseções por setor - paginação por grupos de setor)
                        const atribuidosPorSetor: Record<string, any[]> = {};
                        const deriveSetorNome = (id: any, nome: any) => {
                          if (nome) return String(nome);
                          if (id && Array.isArray(setoresData)) {
                            const match = (setoresData || []).find((s: any) => String(s.ID) === String(id));
                            return match ? (match.NOME_SETOR || match.SETOR || 'Sem setor') : 'Sem setor';
                          }
                          return 'Sem setor';
                        };
                        for (const l of groupAtribuidos) {
                          const key = deriveSetorNome(l.setorId, l.setorNome);
                          if (!atribuidosPorSetor[key]) atribuidosPorSetor[key] = [];
                          atribuidosPorSetor[key].push(l);
                        }
                        const setorGroups = Object.entries(atribuidosPorSetor);
                        const totalPagesAtribuidos = Math.max(1, Math.ceil(setorGroups.length / itemsPerPageKanban));
                        const startIndexAtribuidos = (kanbanAtribuidosPage - 1) * itemsPerPageKanban;
                        const endIndexAtribuidos = Math.min(startIndexAtribuidos + itemsPerPageKanban, setorGroups.length);
                        const visibleSetorGroups = setorGroups.slice(startIndexAtribuidos, endIndexAtribuidos);

                        // Utilizados (com subseções por setor - paginação por grupos de setor)
                        const utilizadosPorSetor: Record<string, any[]> = {};
                        for (const l of groupUtilizados) {
                          const key = deriveSetorNome(l.setorId, l.setorNome);
                          if (!utilizadosPorSetor[key]) utilizadosPorSetor[key] = [];
                          utilizadosPorSetor[key].push(l);
                        }
                        const setorUtilizadosGroups = Object.entries(utilizadosPorSetor);
                        const totalPagesUtilizados = Math.max(1, Math.ceil(setorUtilizadosGroups.length / itemsPerPageKanban));
                        const startIndexUtilizados = (kanbanUtilizadosPage - 1) * itemsPerPageKanban;
                        const endIndexUtilizados = Math.min(startIndexUtilizados + itemsPerPageKanban, setorUtilizadosGroups.length);
                        const visibleSetorUtilizadosGroups = setorUtilizadosGroups.slice(startIndexUtilizados, endIndexUtilizados);

                        // Destruídos em Lote
                        const totalPagesDestruidosLote = Math.max(1, Math.ceil(groupDestruidosLote.length / itemsPerPageKanban));
                        const startIndexDestruidosLote = (kanbanDestruidosLotePage - 1) * itemsPerPageKanban;
                        const endIndexDestruidosLote = Math.min(startIndexDestruidosLote + itemsPerPageKanban, groupDestruidosLote.length);
                        const visibleDestruidosLote = groupDestruidosLote.slice(startIndexDestruidosLote, endIndexDestruidosLote);

                        // Destruídos Individuais
                        const totalPagesDestruidosIndividuais = Math.max(1, Math.ceil(groupDestruidosIndividuais.length / itemsPerPageKanban));
                        const startIndexDestruidosIndividuais = (kanbanDestruidosIndividuaisPage - 1) * itemsPerPageKanban;
                        const endIndexDestruidosIndividuais = Math.min(startIndexDestruidosIndividuais + itemsPerPageKanban, groupDestruidosIndividuais.length);
                        const visibleDestruidosIndividuais = groupDestruidosIndividuais.slice(startIndexDestruidosIndividuais, endIndexDestruidosIndividuais);

                        const renderCard = (l: any) => (
                          <Card key={l.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-medium text-primary text-sm">{l.codigo}</div>
                                  <div className="text-xs text-muted-foreground">{(() => {
                                    const nome = l.setorNome;
                                    if (nome) return nome;
                                    if (l.setorId && Array.isArray(setoresData)) {
                                      const s = (setoresData || []).find((sx: any) => String(sx.ID) === String(l.setorId));
                                      return s ? (s.NOME_SETOR || s.SETOR || '-') : '-';
                                    }
                                    return '-';
                                  })()}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={l.status === 'disponivel' ? 'secondary' : 'default'}>
                                    {lacreStatusLabels[l.status] || l.status}
                                  </Badge>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0" aria-label="Abrir menu de ações">
                                        <span className="sr-only">Abrir menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {['destruido', 'extraviado', 'danificado'].includes(String(l.status)) ? (
                                        <>
                                          <DropdownMenuItem onClick={() => { setLacreSelecionado(l); setShowVisualizarLacreModal(true); }}>Visualizar</DropdownMenuItem>
                                        </>
                                      ) : (
                                        <>
                                          <DropdownMenuItem onClick={() => openEditarLacre(l)}>Editar</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => {
                                            try {
                                              if (!isAdmin) {
                                                showError('Permissão negada', 'Apenas administradores podem destruir lacres.');
                                                return;
                                              }
                                              setLacreSelecionado(l);
                                              setDestruirIndividualForm({ motivo: '', status: 'destruido' });
                                              setShowDestruirLacreIndividualModal(true);
                                            } catch (error) {
                                              console.error('Erro ao destruir lacre:', error);
                                              showError('Erro', 'Não foi possível destruir o lacre.');
                                            }
                                          }}>Destruir</DropdownMenuItem>
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              <div className="text-xs space-y-1">
                                <div><span className="font-medium">Setor:</span> {(() => {
                                  const nome = l.setorNome;
                                  if (nome) return nome;
                                  if (l.setorId && Array.isArray(setoresData)) {
                                    const s = (setoresData || []).find((sx: any) => String(sx.ID) === String(l.setorId));
                                    return s ? (s.NOME_SETOR || s.SETOR || '-') : '-';
                                  }
                                  return '-';
                                })()}</div>
                                <div><span className="font-medium">Status:</span> {getLacreStatusLabel(l)}</div>
                              </div>
                            </CardContent>
                          </Card>
                        );

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Coluna: Disponíveis */}
                            <Card className="border">
                              <CardHeader>
                                <CardTitle className="text-base">Disponíveis ({groupDisponiveis.length})</CardTitle>
                                <CardDescription>Lacres livres para distribuição</CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-3 pr-1">
                                {groupDisponiveis.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">Nenhum lacre disponível.</p>
                                ) : (
                                  visibleDisponiveis.map(renderCard)
                                )}
                                {/* Paginação Disponíveis */}
                                {totalPagesDisponiveis > 1 && (
                                  <div className="flex items-center justify-between px-2 py-2 border-t mt-2 flex-wrap gap-2">
                                    <div className="text-xs text-muted-foreground">
                                      Mostrando {groupDisponiveis.length === 0 ? 0 : startIndexDisponiveis + 1} a {endIndexDisponiveis} de {groupDisponiveis.length}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setKanbanDisponiveisPage(prev => Math.max(prev - 1, 1))}
                                        disabled={kanbanDisponiveisPage === 1}
                                      >
                                        Anterior
                                      </Button>
                                      <div className="flex items-center gap-1 flex-wrap">
                                        {Array.from({ length: totalPagesDisponiveis }).map((_, i) => (
                                          <React.Fragment key={i}>
                                            <Button
                                              variant={kanbanDisponiveisPage === i + 1 ? 'default' : 'outline'}
                                              size="sm"
                                              onClick={() => setKanbanDisponiveisPage(i + 1)}
                                            >
                                              {i + 1}
                                            </Button>
                                          </React.Fragment>
                                        ))}
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setKanbanDisponiveisPage(prev => Math.min(prev + 1, totalPagesDisponiveis))}
                                        disabled={kanbanDisponiveisPage === totalPagesDisponiveis}
                                      >
                                        Próximo
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            {/* Coluna: Atribuídos */}
                            <Card className="border">
                              <CardHeader>
                                <CardTitle className="text-base">Atribuídos ({groupAtribuidos.length})</CardTitle>
                                <CardDescription>Reservados, vinculados, extraviados e danificados</CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-3 pr-1">
                                {groupAtribuidos.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">Nenhum lacre atribuído.</p>
                                ) : (
                                  <>
                                    {visibleSetorGroups.map(([setor, itens]) => (
                                      <div key={setor} className="space-y-2">
                                        <div
                                          className="flex items-center justify-between cursor-pointer select-none"
                                          onClick={() => setExpandedAtribuidosSetores(prev => ({ ...prev, [setor]: !prev[setor] }))}
                                        >
                                          <div className="flex items-center gap-2">
                                            {expandedAtribuidosSetores[setor] ? (
                                              <ChevronDown className="h-4 w-4" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4" />
                                            )}
                                            <div className="text-sm font-medium">{setor}</div>
                                          </div>
                                          <Badge variant="secondary">{itens.length}</Badge>
                                        </div>
                                        {expandedAtribuidosSetores[setor] && (
                                          <div className="space-y-2">
                                            {itens.map(renderCard)}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </>
                                )}
                                {/* Paginação Atribuídos */}
                                {totalPagesAtribuidos > 1 && (
                                  <div className="flex items-center justify-between px-2 py-2 border-t mt-2 flex-wrap gap-2">
                                    <div className="text-xs text-muted-foreground">
                                      Mostrando setores {setorGroups.length === 0 ? 0 : startIndexAtribuidos + 1} a {endIndexAtribuidos} de {setorGroups.length}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setKanbanAtribuidosPage(prev => Math.max(prev - 1, 1))}
                                        disabled={kanbanAtribuidosPage === 1}
                                      >
                                        Anterior
                                      </Button>
                                      <div className="flex items-center gap-1 flex-wrap">
                                        {Array.from({ length: totalPagesAtribuidos }).map((_, i) => (
                                          <React.Fragment key={i}>
                                            <Button
                                              variant={kanbanAtribuidosPage === i + 1 ? 'default' : 'outline'}
                                              size="sm"
                                              onClick={() => setKanbanAtribuidosPage(i + 1)}
                                            >
                                              {i + 1}
                                            </Button>
                                          </React.Fragment>
                                        ))}
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setKanbanAtribuidosPage(prev => Math.min(prev + 1, totalPagesAtribuidos))}
                                        disabled={kanbanAtribuidosPage === totalPagesAtribuidos}
                                      >
                                        Próximo
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            {/* Coluna: Utilizados */}
                            <Card className="border">
                              <CardHeader>
                                <CardTitle className="text-base">Utilizados ({groupUtilizados.length})</CardTitle>
                                <CardDescription>Lacres já utilizados</CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-3 pr-1">
                                {groupUtilizados.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">Nenhum lacre utilizado.</p>
                                ) : (
                                  <>
                                    {visibleSetorUtilizadosGroups.map(([setor, itens]) => (
                                      <div key={setor} className="space-y-2">
                                        <div
                                          className="flex items-center justify-between cursor-pointer select-none"
                                          onClick={() => setExpandedUtilizadosSetores(prev => ({ ...prev, [setor]: !prev[setor] }))}
                                        >
                                          <div className="flex items-center gap-2">
                                            {expandedUtilizadosSetores[setor] ? (
                                              <ChevronDown className="h-4 w-4" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4" />
                                            )}
                                            <div className="text-sm font-medium">{setor}</div>
                                          </div>
                                          <Badge variant="secondary">{itens.length}</Badge>
                                        </div>
                                        {expandedUtilizadosSetores[setor] && (
                                          <div className="space-y-2">
                                            {itens.map(renderCard)}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </>
                                )}
                                {/* Paginação Utilizados */}
                                {totalPagesUtilizados > 1 && (
                                  <div className="flex items-center justify-between px-2 py-2 border-t mt-2 flex-wrap gap-2">
                                    <div className="text-xs text-muted-foreground">
                                      Mostrando setores {setorUtilizadosGroups.length === 0 ? 0 : startIndexUtilizados + 1} a {endIndexUtilizados} de {setorUtilizadosGroups.length}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setKanbanUtilizadosPage(prev => Math.max(prev - 1, 1))}
                                        disabled={kanbanUtilizadosPage === 1}
                                      >
                                        Anterior
                                      </Button>
                                      <div className="flex items-center gap-1 flex-wrap">
                                        {Array.from({ length: totalPagesUtilizados }).map((_, i) => (
                                          <React.Fragment key={i}>
                                            <Button
                                              variant={kanbanUtilizadosPage === i + 1 ? 'default' : 'outline'}
                                              size="sm"
                                              onClick={() => setKanbanUtilizadosPage(i + 1)}
                                            >
                                              {i + 1}
                                            </Button>
                                          </React.Fragment>
                                        ))}
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setKanbanUtilizadosPage(prev => Math.min(prev + 1, totalPagesUtilizados))}
                                        disabled={kanbanUtilizadosPage === totalPagesUtilizados}
                                      >
                                        Próximo
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>

                            {/* Coluna: Destruídos */}
                            <Card className="border">
                              <CardHeader>
                                <CardTitle className="text-base">Destruídos ({groupDestruidos.length})</CardTitle>
                                <CardDescription>Lacres eliminados do ciclo</CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-4 pr-1">
                                {/* Abas para Destruídos: Lote vs Individuais */}
                                <Tabs value={kanbanDestruidosTab} onValueChange={(v) => setKanbanDestruidosTab(v as any)}>
                                  <TabsList className="grid grid-cols-2 w-full">
                                    <TabsTrigger value="lote">Em lote <span className="ml-2"><Badge variant="secondary">{groupDestruidosLote.length}</Badge></span></TabsTrigger>
                                    <TabsTrigger value="individual">Individuais <span className="ml-2"><Badge variant="secondary">{groupDestruidosIndividuais.length}</Badge></span></TabsTrigger>
                                  </TabsList>

                                  <TabsContent value="lote" className="space-y-3">
                                    {groupDestruidosLote.length === 0 ? (
                                      <p className="text-sm text-muted-foreground">Nenhum lacre destruído em lote.</p>
                                    ) : (
                                      visibleDestruidosLote.map(renderCard)
                                    )}
                                    {/* Paginação Em Lote */}
                                    {totalPagesDestruidosLote > 1 && (
                                      <div className="flex items-center justify-between px-2 py-2 border-t mt-2 flex-wrap gap-2">
                                        <div className="text-xs text-muted-foreground">
                                          Mostrando {groupDestruidosLote.length === 0 ? 0 : startIndexDestruidosLote + 1} a {endIndexDestruidosLote} de {groupDestruidosLote.length}
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setKanbanDestruidosLotePage(prev => Math.max(prev - 1, 1))}
                                            disabled={kanbanDestruidosLotePage === 1}
                                          >
                                            Anterior
                                          </Button>
                                          <div className="flex items-center gap-1 flex-wrap">
                                            {Array.from({ length: totalPagesDestruidosLote }).map((_, i) => (
                                              <React.Fragment key={i}>
                                                <Button
                                                  variant={kanbanDestruidosLotePage === i + 1 ? 'default' : 'outline'}
                                                  size="sm"
                                                  onClick={() => setKanbanDestruidosLotePage(i + 1)}
                                                >
                                                  {i + 1}
                                                </Button>
                                              </React.Fragment>
                                            ))}
                                          </div>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setKanbanDestruidosLotePage(prev => Math.min(prev + 1, totalPagesDestruidosLote))}
                                            disabled={kanbanDestruidosLotePage === totalPagesDestruidosLote}
                                          >
                                            Próximo
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </TabsContent>

                                  <TabsContent value="individual" className="space-y-3">
                                    {groupDestruidosIndividuais.length === 0 ? (
                                      <p className="text-sm text-muted-foreground">Nenhum lacre destruído individualmente.</p>
                                    ) : (
                                      visibleDestruidosIndividuais.map(renderCard)
                                    )}
                                    {/* Paginação Individuais */}
                                    {totalPagesDestruidosIndividuais > 1 && (
                                      <div className="flex items-center justify-between px-2 py-2 border-t mt-2 flex-wrap gap-2">
                                        <div className="text-xs text-muted-foreground">
                                          Mostrando {groupDestruidosIndividuais.length === 0 ? 0 : startIndexDestruidosIndividuais + 1} a {endIndexDestruidosIndividuais} de {groupDestruidosIndividuais.length}
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setKanbanDestruidosIndividuaisPage(prev => Math.max(prev - 1, 1))}
                                            disabled={kanbanDestruidosIndividuaisPage === 1}
                                          >
                                            Anterior
                                          </Button>
                                          <div className="flex items-center gap-1 flex-wrap">
                                            {Array.from({ length: totalPagesDestruidosIndividuais }).map((_, i) => (
                                              <React.Fragment key={i}>
                                                <Button
                                                  variant={kanbanDestruidosIndividuaisPage === i + 1 ? 'default' : 'outline'}
                                                  size="sm"
                                                  onClick={() => setKanbanDestruidosIndividuaisPage(i + 1)}
                                                >
                                                  {i + 1}
                                                </Button>
                                              </React.Fragment>
                                            ))}
                                          </div>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setKanbanDestruidosIndividuaisPage(prev => Math.min(prev + 1, totalPagesDestruidosIndividuais))}
                                            disabled={kanbanDestruidosIndividuaisPage === totalPagesDestruidosIndividuais}
                                          >
                                            Próximo
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </TabsContent>
                                </Tabs>
                              </CardContent>
                            </Card>
                          </div>
                        );
                      })()}

                      {/* Paginação removida no modo agrupado (Kanban) */}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Modal: Cadastro de Lotes de Lacres */}
          <Dialog open={showGerarLacresModal} onOpenChange={setShowGerarLacresModal}>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Cadastro de Lotes</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-1">
                  <Label>Prefixo</Label>
                  <Input value={lacreForm.prefixo} onChange={(e) => setLacreForm(prev => ({ ...prev, prefixo: e.target.value.toUpperCase() }))} />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label>Início</Label>
                  <Input type="number" value={lacreForm.inicio} disabled readOnly />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label>Fim</Label>
                  <Input
                    type="number"
                    value={lacreForm.fim ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLacreForm(prev => ({ ...prev, fim: val === '' ? undefined : Number(val) }));
                    }}
                  />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label>Número do Lote</Label>
                  <Input value={lacreForm.loteNumero} onChange={(e) => setLacreForm(prev => ({ ...prev, loteNumero: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowGerarLacresModal(false)}>Cancelar</Button>
                <Button className="btn-govto-primary gap-2" onClick={() => { gerarLacres(); setShowGerarLacresModal(false); }}>
                  <Plus className="w-4 h-4" /> Gerar lacres
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal: Destruição de Lacres em Lote */}
          <Dialog open={showDestruirLacresModal} onOpenChange={setShowDestruirLacresModal}>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Destruição em Lote</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-1">
                  <Label>Número do Lote</Label>
                  <Popover open={openDestruirLoteCombo} onOpenChange={setOpenDestruirLoteCombo}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start overflow-hidden">
                        <span className="truncate flex-1 min-w-0">
                          {String(destruirFormLacre.loteNumero || '').trim() || 'Escolher lote elegível'}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[360px] max-h-[280px] overflow-auto" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar lote..." />
                        <CommandList>
                          <CommandEmpty>Nenhum lote elegível.</CommandEmpty>
                          <CommandGroup heading="Lotes elegíveis">
                            {lotesElegiveis.map((opt) => (
                              <CommandItem key={opt.lote} onSelect={() => { setDestruirFormLacre(prev => ({ ...prev, loteNumero: opt.lote })); setOpenDestruirLoteCombo(false); }}>
                                {opt.lote} — {opt.total} lacres
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label>Motivo</Label>
                  <Textarea value={destruirFormLacre.motivo} onChange={(e) => setDestruirFormLacre(prev => ({ ...prev, motivo: e.target.value }))} />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {(() => {
                  const alvo = String(destruirFormLacre.loteNumero || '').trim();
                  const totais = lacreList.filter(l => String(l.loteNumero || '') === alvo).length;
                  const elegiveis = lacreList.filter(l => String(l.loteNumero || '') === alvo && (lacreValidTransitions[l.status] || []).includes('destruido')).length;
                  return `Encontrados ${totais} lacres no lote. Elegíveis: ${elegiveis}.`;
                })()}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowDestruirLacresModal(false); setDestruirFormLacre({ loteNumero: '', motivo: '' }); }}>Cancelar</Button>
                <Button onClick={destruirLacresPorLote} disabled={!isAdmin}>Destruir lacres</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal: Destruição de Lacre Individual */}
          <Dialog open={showDestruirLacreIndividualModal} onOpenChange={setShowDestruirLacreIndividualModal}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Destruição de Lacre</DialogTitle>
              </DialogHeader>
              {lacreSelecionado ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Código do Lacre</Label>
                    <Input value={String(lacreSelecionado.codigo)} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Status atual</Label>
                    <Input value={getLacreStatusLabel(lacreSelecionado)} disabled />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Motivo</Label>
                    <Textarea
                      value={destruirIndividualForm.motivo}
                      onChange={(e) => setDestruirIndividualForm(prev => ({ ...prev, motivo: e.target.value }))}
                      placeholder="Descreva o motivo da destruição"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Tipo de encerramento</Label>
                    <Select value={destruirIndividualForm.status} onValueChange={(v) => setDestruirIndividualForm(prev => ({ ...prev, status: v as any }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="extraviado">EXTRAVIADO</SelectItem>
                        <SelectItem value="danificado">DANIFICADO</SelectItem>
                        <SelectItem value="destruido">DESTRUÍDO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Nenhum lacre selecionado.</div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => { setShowDestruirLacreIndividualModal(false); setDestruirIndividualForm({ motivo: '', status: 'destruido' }); setLacreSelecionado(null); }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      if (!isAdmin) {
                        showError('Permissão negada', 'Apenas administradores podem destruir lacres.');
                        return;
                      }
                      if (String(lacreSelecionado?.status) === 'utilizado') {
                        showError('Ação não permitida', 'Lacres em status UTILIZADO não podem ser destruídos.');
                        return;
                      }
                      const motivo = String(destruirIndividualForm.motivo || '').trim();
                      if (!motivo) { showError('Motivo obrigatório', 'Informe o motivo da destruição.'); return; }
                      const alvoId = String(lacreSelecionado?.id || '').trim();
                      if (!alvoId) { showError('Seleção inválida', 'Nenhum lacre válido selecionado.'); return; }
                      await api.updateLacre(alvoId, { status: destruirIndividualForm.status, motivoDestruicao: motivo });
                      setShowDestruirLacreIndividualModal(false);
                      setDestruirIndividualForm({ motivo: '', status: 'destruido' });
                      setLacreSelecionado(null);
                      const statusMsg = destruirIndividualForm.status === 'extraviado' ? 'extraviado' : destruirIndividualForm.status === 'danificado' ? 'danificado' : 'destruído';
                      showSuccess('Encerramento realizado', `O lacre foi marcado como ${statusMsg}.`);
                      await fetchLacres();
                    } catch (e) {
                      console.error('Erro ao destruir lacre individual', e);
                      showError('Erro', 'Falha ao destruir lacre.');
                    }
                  }}
                  disabled={!isAdmin}
                >
                  Destruir lacre
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal: Visualizar Lacre Destruído */}
          <Dialog open={showVisualizarLacreModal} onOpenChange={(open) => { setShowVisualizarLacreModal(open); if (!open) setLacreSelecionado(null); }}>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Visualizar Lacre</DialogTitle>
              </DialogHeader>
              {lacreSelecionado ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Código do Lacre</Label>
                    <Input value={String(lacreSelecionado.codigo)} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Input value={getLacreStatusLabel(lacreSelecionado)} disabled />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Setor</Label>
                    <Input
                      value={(() => {
                        const nome = lacreSelecionado.setorNome;
                        if (nome) return nome;
                        if (lacreSelecionado.setorId && Array.isArray(setoresData)) {
                          const s = (setoresData || []).find((sx: any) => String(sx.ID) === String(lacreSelecionado.setorId));
                          return s ? (s.NOME_SETOR || s.SETOR || '-') : '-';
                        }
                        return '-';
                      })()}
                      disabled
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Motivo da destruição</Label>
                    <Textarea value={String(lacreSelecionado.motivoDestruicao || '-')} disabled />
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Nenhum lacre selecionado.</div>
              )}
              <DialogFooter className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => window.print()}>Imprimir</Button>
                  <Button variant="outline" onClick={() => {
                    try {
                      // Usar o diálogo de impressão para salvar como PDF
                      window.print();
                    } catch (e) {
                      console.error('Erro ao gerar PDF', e);
                      showError('Erro', 'Falha ao abrir diálogo de PDF.');
                    }
                  }}>PDF</Button>
                  <Button variant="outline" onClick={async () => {
                    try {
                      const titulo = `Lacre ${String(lacreSelecionado?.codigo || '')}`;
                      const texto = `Status: ${getLacreStatusLabel(lacreSelecionado)}\nSetor: ${(() => {
                        const nome = lacreSelecionado?.setorNome;
                        if (nome) return nome;
                        if (lacreSelecionado?.setorId && Array.isArray(setoresData)) {
                          const s = (setoresData || []).find((sx: any) => String(sx.ID) === String(lacreSelecionado?.setorId));
                          return s ? (s.NOME_SETOR || s.SETOR || '-') : '-';
                        }
                        return '-';
                      })()}\nMotivo: ${String(lacreSelecionado?.motivoDestruicao || '-')}`;
                      if ((navigator as any)?.share) {
                        await (navigator as any).share({ title: titulo, text: texto });
                        showSuccess('Compartilhado', 'Informações do lacre compartilhadas.');
                      } else if (navigator.clipboard) {
                        await navigator.clipboard.writeText(`${titulo}\n${texto}`);
                        showSuccess('Copiado', 'Informações copiadas para a área de transferência.');
                      } else {
                        showInfo('Compartilhar não disponível', 'Seu navegador não suporta compartilhamento.');
                      }
                    } catch (e) {
                      console.error('Erro ao compartilhar', e);
                      showError('Erro', 'Falha ao compartilhar informações.');
                    }
                  }}>Compartilhar</Button>
                </div>
                <Button variant="default" onClick={() => { setShowVisualizarLacreModal(false); setLacreSelecionado(null); }}>Fechar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal: Edição de Lacre */}
          <Dialog open={showEditarLacreModal} onOpenChange={setShowEditarLacreModal}>
            <DialogContent className="sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle>Editar Lacre</DialogTitle>
              </DialogHeader>
              {lacreSelecionado ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-1">
                    <Label>Código</Label>
                    <Input value={String(lacreSelecionado.codigo)} disabled />
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <Label>Status</Label>
                    <Select value={editFormLacre.status} onValueChange={(v) => setEditFormLacre(prev => ({ ...prev, status: v }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          lacreSelecionado.status,
                          ...((lacreValidTransitions[lacreSelecionado.status] || []) as string[])
                        ].filter((v, i, arr) => arr.indexOf(v) === i).map((st) => (
                          <SelectItem key={st} value={st}>{lacreStatusLabels[st] || st}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-1">
                    <Label>Setor</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between">
                          {(() => {
                            if (!editFormLacre.setorId) return 'Selecione o setor';
                            const setor = Array.isArray(setoresData) ? setoresData.find((s: any) => String(s.ID) === String(editFormLacre.setorId)) : null;
                            return setor?.NOME_SETOR || setor?.SETOR || 'Selecione o setor';
                          })()}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[360px]" align="start">
                        <Command>
                          <CommandInput placeholder="Pesquisar setor..." />
                          <CommandList>
                            <CommandEmpty>Nenhum setor encontrado.</CommandEmpty>
                            <CommandGroup>
                              {Array.isArray(setoresData) && setoresData.map((s: any) => (
                                <CommandItem key={String(s.ID)} onSelect={() => setEditFormLacre(prev => ({ ...prev, setorId: String(s.ID) }))}>
                                  {s.NOME_SETOR || s.SETOR || 'Setor'}
                                </CommandItem>
                              ))}
                              <CommandItem onSelect={() => setEditFormLacre(prev => ({ ...prev, setorId: '' }))}>
                                Sem setor
                              </CommandItem>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Selecione um lacre para editar.</p>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowEditarLacreModal(false); setLacreSelecionado(null); }}>Cancelar</Button>
                <Button onClick={salvarEdicaoLacre} disabled={!isAdmin || !lacreSelecionado}>Salvar alterações</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal: Distribuição de Lacres (Wizard) - Seguindo padrão do Nova Encomenda */}
          {showDistribuirLacresModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[95vh] flex flex-col">
                {/* Cabeçalho fixo com navegação do wizard */}
                <div className="flex-shrink-0 bg-white p-4 rounded-t-lg relative">
                  {/* Botão X discreto no canto superior direito */}
                  <button
                    onClick={() => {
                      setShowDistribuirLacresModal(false);
                      setDistWizardStep(1);
                      setDistAutoSetores([]);
                      setDistSetoresSearch("");
                      setDistSetoresPage(1);
                    }}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="pr-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Distribuição de Lacres</h2>
                  </div>

                  {/* Barra de progresso */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Passo {distWizardStep} de 4</span>
                      <span>{Math.round((distWizardStep / 4) * 100)}% concluído</span>
                    </div>
                    <Progress value={(distWizardStep / 4) * 100} className="h-2" />
                  </div>

                  {/* Indicadores de passos */}
                  <div className="flex justify-between mb-4">
                    {[
                      { number: 1, title: "Modo" },
                      { number: 2, title: "Setor" },
                      { number: 3, title: "Quantidade" },
                      { number: 4, title: "Confirmação" }
                    ].map((step) => (
                      <div key={step.number} className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${distWizardStep > step.number
                          ? 'bg-green-500 text-white'
                          : distWizardStep === step.number
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                          }`}>
                          {distWizardStep > step.number ? <Check className="w-4 h-4" /> : step.number}
                        </div>
                        <span className="text-xs text-gray-600 mt-1 text-center">{step.title}</span>
                      </div>
                    ))}
                  </div>

                  {/* Botões de navegação */}
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={voltarWizardDistribuicao}
                      disabled={distWizardStep === 1}
                      className="gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </Button>

                    <Button
                      onClick={() => {
                        if (distWizardStep === 4) {
                          // No último passo, executar a distribuição
                          if (distFormLacre.modo === 'manual') {
                            distribuirLacresManual();
                          } else {
                            distribuirLacresAuto();
                          }
                          setShowDistribuirLacresModal(false);
                          setDistWizardStep(1);
                          setDistAutoSetores([]);
                          setDistSetoresSearch("");
                          setDistSetoresPage(1);
                        } else {
                          avancarWizardDistribuicao();
                        }
                      }}
                      className="gap-2"
                    >
                      {distWizardStep === 4 ? 'Distribuir' : 'Próximo'}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Conteúdo rolável */}
                <div className="flex-1 overflow-y-auto p-4">
                  {/* Conteúdo por etapa */}
                  {distWizardStep === 1 && (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione o Modo de Distribuição</h3>
                        <p className="text-sm text-gray-600">Escolha como deseja distribuir os lacres disponíveis</p>
                      </div>

                      <div className="max-w-md mx-auto space-y-4">
                        <div className="space-y-2">
                          <Label>Modo de Distribuição</Label>
                          <Select value={distFormLacre.modo} onValueChange={(v: 'manual' | 'auto') => setDistFormLacre(prev => ({ ...prev, modo: v }))}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione o modo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual">Manual - Escolher setor específico</SelectItem>
                              <SelectItem value="auto">Automático - Distribuição automática</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-blue-700">
                            <Info className="w-4 h-4" />
                            <span className="font-medium">Lacres Disponíveis</span>
                          </div>
                          <p className="text-blue-600 mt-1">{disponiveisCount} lacres com status "DISPONÍVEL"</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {distWizardStep === 2 && (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione {distFormLacre.modo === 'auto' ? 'os Setores' : 'o Setor'}</h3>
                        <p className="text-sm text-gray-600">
                          {distFormLacre.modo === 'auto'
                            ? 'Escolha pelo menos 2 setores para distribuição automática'
                            : 'Escolha o setor que receberá os lacres'}
                        </p>
                      </div>

                      {distFormLacre.modo === 'manual' ? (
                        <div className="max-w-md mx-auto space-y-4">
                          <div className="space-y-2">
                            <Label>Setor de Destino</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" className="w-full justify-between">
                                  {(() => {
                                    const setor = Array.isArray(setoresData) ? setoresData.find((s: any) => String(s.ID) === String(distFormLacre.setorId)) : null;
                                    return setor?.NOME_SETOR || setor?.SETOR || 'Selecione o setor';
                                  })()}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="p-0 w-[400px]" align="start">
                                <Command>
                                  <CommandInput placeholder="Pesquisar setor..." />
                                  <CommandList>
                                    <CommandEmpty>Nenhum setor encontrado.</CommandEmpty>
                                    <CommandGroup>
                                      {Array.isArray(setoresData) && setoresData.map((s: any) => (
                                        <CommandItem key={String(s.ID)} onSelect={() => setDistFormLacre(prev => ({ ...prev, setorId: String(s.ID) }))}>
                                          {s.NOME_SETOR || s.SETOR || 'Setor'}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      ) : (
                        <div className="max-w-2xl mx-auto space-y-4">
                          <Label>Selecione os Setores</Label>

                          {/* Busca de setores */}
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="Pesquisar por nome, código ou órgão..."
                              value={distSetoresSearch}
                              onChange={(e) => { setDistSetoresSearch(e.target.value); setDistSetoresPage(1); }}
                              className="pl-8"
                            />
                          </div>

                          {/* Lista paginada de setores com seleção */}
                          {(() => {
                            const setoresAll = Array.isArray(setoresData) ? setoresData : [];
                            const term = distSetoresSearch.trim().toLowerCase();
                            const filtered = term
                              ? setoresAll.filter((s: any) => {
                                const nome = String(s.NOME_SETOR || s.SETOR || '').toLowerCase();
                                const codigo = String(s.CODIGO_SETOR || s.CODIGO || '').toLowerCase();
                                const orgao = String(s.ORGAO || '').toLowerCase();
                                return nome.includes(term) || codigo.includes(term) || orgao.includes(term);
                              })
                              : setoresAll;
                            const totalPages = Math.max(1, Math.ceil(filtered.length / distSetoresPerPage));
                            const page = Math.min(distSetoresPage, totalPages);
                            const startIndex = (page - 1) * distSetoresPerPage;
                            const endIndex = Math.min(startIndex + distSetoresPerPage, filtered.length);
                            const pageItems = filtered.slice(startIndex, endIndex);

                            return (
                              <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {pageItems.map((s: any) => {
                                    const idStr = String(s.ID);
                                    const checked = distAutoSetores.includes(idStr);
                                    return (
                                      <label key={idStr} className="flex items-center gap-2 border rounded-md p-2 cursor-pointer hover:bg-gray-50">
                                        <Checkbox
                                          checked={checked}
                                          onCheckedChange={(val) => {
                                            setDistAutoSetores(prev => {
                                              const set = new Set(prev);
                                              if (val) set.add(idStr); else set.delete(idStr);
                                              return Array.from(set);
                                            });
                                          }}
                                        />
                                        <span className="text-sm">{s.NOME_SETOR || s.SETOR || 'Setor'}</span>
                                      </label>
                                    );
                                  })}
                                  {pageItems.length === 0 && (
                                    <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
                                      Nenhum setor encontrado.
                                    </div>
                                  )}
                                </div>

                                {/* Paginação */}
                                <div className="flex items-center justify-between px-1 py-2 border-t">
                                  <p className="text-xs text-muted-foreground">
                                    Exibindo {pageItems.length} de {filtered.length} setores
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setDistSetoresPage(prev => Math.max(prev - 1, 1))}
                                      disabled={page === 1}
                                    >
                                      Anterior
                                    </Button>
                                    <span className="text-xs text-muted-foreground">
                                      Página {page} de {totalPages}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setDistSetoresPage(prev => Math.min(prev + 1, totalPages))}
                                      disabled={page >= totalPages}
                                    >
                                      Próximo
                                    </Button>
                                  </div>
                                </div>
                              </>
                            );
                          })()}

                          <p className="text-xs text-muted-foreground">Selecione no mínimo dois setores.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {distWizardStep === 3 && distFormLacre.modo === 'manual' && (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Defina a Quantidade</h3>
                        <p className="text-sm text-gray-600">Quantos lacres deseja distribuir?</p>
                      </div>

                      <div className="max-w-md mx-auto space-y-4">
                        <div className="space-y-2">
                          <Label>Quantidade de Lacres</Label>
                          <Input
                            type="number"
                            value={distFormLacre.quantidade}
                            onChange={(e) => setDistFormLacre(prev => ({ ...prev, quantidade: Number(e.target.value) }))}
                            min="1"
                            max={disponiveisCount}
                            className="text-center text-lg"
                          />
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-yellow-700">
                            <AlertCircle className="w-4 h-4" />
                            <span className="font-medium">Importante</span>
                          </div>
                          <p className="text-yellow-600 mt-1">
                            Serão distribuídos apenas lacres com status "DISPONÍVEL".
                            Total disponível: {disponiveisCount} lacres
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {distWizardStep === 4 && (
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Confirme a Distribuição</h3>
                        <p className="text-sm text-gray-600">Revise os dados antes de confirmar</p>
                      </div>

                      <div className="max-w-md mx-auto">
                        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Modo:</span>
                            <span className="text-gray-900">
                              {distFormLacre.modo === 'auto' ? 'Automático' : 'Manual'}
                            </span>
                          </div>

                          {distFormLacre.modo === 'manual' && (
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">Setor:</span>
                              <span className="text-gray-900">
                                {(() => {
                                  const setor = Array.isArray(setoresData) ? setoresData.find((s: any) => String(s.ID) === String(distFormLacre.setorId)) : null;
                                  return setor?.NOME_SETOR || setor?.SETOR || distFormLacre.setorId || '-';
                                })()}
                              </span>
                            </div>
                          )}

                          {distFormLacre.modo === 'manual' ? (
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">Quantidade:</span>
                              <span className="text-gray-900">{distFormLacre.quantidade} lacres</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-700">Setores selecionados:</span>
                                <span className="text-gray-900">{Array.isArray(distAutoSetores) ? distAutoSetores.length : 0}</span>
                              </div>
                              {/* Plano de distribuição (tratamento para divisão não inteira) */}
                              {Array.isArray(distAutoSetores) && distAutoSetores.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {calcularDistribuicaoAutomatica(disponiveisCount, distAutoSetores).map((item) => {
                                    const setor = Array.isArray(setoresData) ? setoresData.find((s: any) => String(s.ID) === String(item.setorId)) : null;
                                    const nome = setor?.NOME_SETOR || setor?.SETOR || item.setorId;
                                    return (
                                      <div key={item.setorId} className="flex justify-between text-sm">
                                        <span className="text-gray-700">{nome}</span>
                                        <span className="text-gray-900 font-medium">{item.quantidade} lacres</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </>
                          )}

                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Disponíveis:</span>
                            <span className="text-gray-900">{disponiveisCount} lacres</span>
                          </div>

                          {distFormLacre.modo === 'auto' && (
                            <div className="text-xs text-muted-foreground">
                              Distribuição automática equitativa: setores recebem a mesma base; sobras são atribuídas um a um.
                            </div>
                          )}

                          <div className="border-t pt-4">
                            <div className="flex items-center gap-2 text-green-700">
                              <Check className="w-4 h-4" />
                              <span className="font-medium">Pronto para distribuir</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ---------------- SEGURANCA ---------------- */}
          <TabsContent value="seguranca" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" /> Configurações de Segurança
                </CardTitle>
                <CardDescription>
                  Configure as políticas de segurança do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Autenticação em duas etapas</Label>
                      <p className="text-sm text-muted-foreground">
                        Ative a autenticação 2FA para maior segurança
                      </p>
                    </div>
                    <Switch
                      checked={configSeguranca.autenticacaoDuasEtapas}
                      onCheckedChange={(checked) => setConfigSeguranca(prev => ({ ...prev, autenticacaoDuasEtapas: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="senhaComplexidade">Complexidade de senha</Label>
                    <Select
                      value={configSeguranca.senhaComplexidade}
                      onValueChange={(value) => setConfigSeguranca(prev => ({ ...prev, senhaComplexidade: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">
                          Baixa (mínimo 6 caracteres)
                        </SelectItem>
                        <SelectItem value="media">
                          Média (mínimo 8 caracteres + números)
                        </SelectItem>
                        <SelectItem value="alta">
                          Alta (mínimo 12 caracteres + símbolos)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiracaoSessao">
                      Expiração de sessão (minutos)
                    </Label>
                    <Input
                      id="expiracaoSessao"
                      type="number"
                      value={configSeguranca.tempoSessao}
                      onChange={(e) => setConfigSeguranca(prev => ({ ...prev, tempoSessao: parseInt(e.target.value) || 0 }))}
                      placeholder="60"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tentativasLogin">
                      Máximo de tentativas de login
                    </Label>
                    <Input
                      id="tentativasLogin"
                      type="number"
                      value={configSeguranca.tentativasLogin}
                      onChange={(e) => setConfigSeguranca(prev => ({ ...prev, tentativasLogin: parseInt(e.target.value) || 0 }))}
                      placeholder="5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bloqueioTempo">
                      Tempo de bloqueio (minutos)
                    </Label>
                    <Input
                      id="bloqueioTempo"
                      type="number"
                      value={configSeguranca.bloqueioTempo}
                      onChange={(e) => setConfigSeguranca(prev => ({ ...prev, bloqueioTempo: parseInt(e.target.value) || 0 }))}
                      placeholder="15"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Log de auditoria</Label>
                      <p className="text-sm text-muted-foreground">
                        Registrar todas as ações dos usuários
                      </p>
                    </div>
                    <Switch
                      checked={configSeguranca.logAuditoria}
                      onCheckedChange={(checked) => setConfigSeguranca(prev => ({ ...prev, logAuditoria: checked }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={salvarConfigSeguranca}
                    disabled={savingConfigs}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {savingConfigs ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* (Removido) Mapa Geral dos Setores - movido para a aba Setores */}
          </TabsContent>

          {/* ---------------- AUTENTICACAO ---------------- */}
          <TabsContent value="autenticacao" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" /> Configurações de Autenticação
                </CardTitle>
                <CardDescription>
                  Configure os métodos de autenticação do sistema, incluindo LDAP
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Toggle principal para LDAP */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Autenticação LDAP</Label>
                      <p className="text-sm text-muted-foreground">
                        Habilite a autenticação via LDAP. O método de autenticação padrão permanecerá como fallback.
                      </p>
                    </div>
                    <Switch
                      checked={configLdap.ldapAtivo}
                      onCheckedChange={(checked) => setConfigLdap(prev => ({ ...prev, ldapAtivo: checked }))}
                    />
                  </div>

                  {/* Configurações LDAP - só aparecem quando LDAP está ativo */}
                  {configLdap.ldapAtivo && (
                    <div className="space-y-6 p-4 border rounded-lg">
                      <h3 className="text-lg font-semibold text-foreground border-b pb-2">Configurações do Servidor LDAP</h3>

                      {/* Informações básicas do servidor */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="nomeServidor">Nome do Servidor</Label>
                          <Input
                            id="nomeServidor"
                            value={configLdap.nomeServidor}
                            onChange={(e) => setConfigLdap(prev => ({ ...prev, nomeServidor: e.target.value }))}
                            placeholder="srv-acdc"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="servidor">Endereço do Servidor</Label>
                          <Input
                            id="servidor"
                            value={configLdap.servidor}
                            onChange={(e) => setConfigLdap(prev => ({ ...prev, servidor: e.target.value }))}
                            placeholder="10.9.7.106"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="porta">Porta LDAP</Label>
                          <Input
                            id="porta"
                            type="number"
                            value={configLdap.porta}
                            onChange={(e) => setConfigLdap(prev => ({ ...prev, porta: parseInt(e.target.value) || 389 }))}
                            placeholder="389"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="campoLogin">Campo de Login</Label>
                          <Input
                            id="campoLogin"
                            value={configLdap.campoLogin}
                            onChange={(e) => setConfigLdap(prev => ({ ...prev, campoLogin: e.target.value }))}
                            placeholder="samaccountname"
                          />
                        </div>
                      </div>

                      {/* BaseDN e Filtros */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="baseDN">BaseDN</Label>
                          <Input
                            id="baseDN"
                            value={configLdap.baseDN}
                            onChange={(e) => setConfigLdap(prev => ({ ...prev, baseDN: e.target.value }))}
                            placeholder="OU=CONTAS;dc=sefaz;dc=to;dc=gov;dc=br"
                          />
                          <p className="text-xs text-muted-foreground">
                            Unidade organizacional onde estão os usuários
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="filtroConexao">Filtro da Conexão</Label>
                          <Textarea
                            id="filtroConexao"
                            value={configLdap.filtroConexao}
                            onChange={(e) => setConfigLdap(prev => ({ ...prev, filtroConexao: e.target.value }))}
                            placeholder="(&(objectClass=user)(objectCategory=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))"
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground">
                            Filtro LDAP para buscar usuários ativos
                          </p>
                        </div>
                      </div>

                      {/* Configurações de Bind */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Usar Bind (ligações não-anônimas)</Label>
                            <p className="text-sm text-muted-foreground">
                              Necessário para autenticação com credenciais
                            </p>
                          </div>
                          <Switch
                            checked={configLdap.usarBind}
                            onCheckedChange={(checked) => setConfigLdap(prev => ({ ...prev, usarBind: checked }))}
                          />
                        </div>

                        {configLdap.usarBind && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="rootDN">RootDN (usuário de bind)</Label>
                              <Input
                                id="rootDN"
                                value={configLdap.rootDN}
                                onChange={(e) => setConfigLdap(prev => ({ ...prev, rootDN: e.target.value }))}
                                placeholder="sefaz\glpi"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="senhaRootDN">Senha do RootDN</Label>
                              <Input
                                id="senhaRootDN"
                                type="password"
                                value={configLdap.senhaRootDN}
                                onChange={(e) => setConfigLdap(prev => ({ ...prev, senhaRootDN: e.target.value }))}
                                placeholder="••••••••"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Configurações adicionais */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Servidor Padrão</Label>
                            <p className="text-sm text-muted-foreground">
                              Definir como servidor LDAP principal
                            </p>
                          </div>
                          <Switch
                            checked={configLdap.servidorPadrao}
                            onCheckedChange={(checked) => setConfigLdap(prev => ({ ...prev, servidorPadrao: checked }))}
                          />
                        </div>
                      </div>

                      {/* Botão de teste de conexão */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={() => setShowLdapTestModal(true)}
                        >
                          <Database className="w-4 h-4" />
                          Testar Conexão
                        </Button>
                        <Button
                          onClick={salvarConfigLdap}
                          disabled={savingConfigs}
                          className="flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          {savingConfigs ? 'Salvando...' : 'Salvar Configurações LDAP'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Informações sobre fallback */}
                  <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      ℹ️ Método de Autenticação Híbrido
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Quando o LDAP estiver ativo, o sistema tentará autenticar primeiro via LDAP.
                      Se a autenticação LDAP falhar ou não estiver disponível, o sistema utilizará
                      automaticamente o método de autenticação padrão (banco de dados local).
                      O sistema manterá sempre o login e senha de admin como padrão, mesmo quando o LDAP estiver funcionando.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- NOTIFICACOES ---------------- */}
          <TabsContent value="notificacoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" /> Configurações de Notificações
                </CardTitle>
                <CardDescription>
                  Configure como e quando receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações por e-mail</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber notificações importantes por e-mail
                      </p>
                    </div>
                    <Switch
                      checked={configNotificacoes.notificacoesEmail}
                      onCheckedChange={(checked) => setConfigNotificacoes(prev => ({ ...prev, notificacoesEmail: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações push</Label>
                      <p className="text-sm text-muted-foreground">
                        Receber notificações push no navegador
                      </p>
                    </div>
                    <Switch
                      checked={configNotificacoes.notificacoesPush}
                      onCheckedChange={(checked) => setConfigNotificacoes(prev => ({ ...prev, notificacoesPush: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>E-mail para processos</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificações sobre novos processos
                      </p>
                    </div>
                    <Switch
                      checked={configNotificacoes.emailProcessos}
                      onCheckedChange={(checked) => setConfigNotificacoes(prev => ({ ...prev, emailProcessos: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>E-mail para prazos</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificações sobre prazos vencendo
                      </p>
                    </div>
                    <Switch
                      checked={configNotificacoes.emailPrazos}
                      onCheckedChange={(checked) => setConfigNotificacoes(prev => ({ ...prev, emailPrazos: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>E-mail para documentos</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificações sobre novos documentos
                      </p>
                    </div>
                    <Switch
                      checked={configNotificacoes.emailDocumentos}
                      onCheckedChange={(checked) => setConfigNotificacoes(prev => ({ ...prev, emailDocumentos: checked }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequenciaRelatorios">
                      Frequência de resumo
                    </Label>
                    <Select
                      value={configNotificacoes.frequenciaResumo}
                      onValueChange={(value) => setConfigNotificacoes(prev => ({ ...prev, frequenciaResumo: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diario">Diário</SelectItem>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="nunca">Nunca</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={salvarConfigNotificacoes}
                    disabled={savingConfigs}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {savingConfigs ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Mapa Geral dos Usuários */}
            {/* Removido: bloco duplicado de MapaGeralUsuarios fora da aba correta */}
          </TabsContent>

          {/* ---------------- SISTEMA ---------------- */}
          <TabsContent value="sistema" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" /> Configurações do Sistema
                </CardTitle>
                <CardDescription>
                  Configure parâmetros técnicos do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Backup automático</Label>
                      <p className="text-sm text-muted-foreground">
                        Realizar backup automático dos dados
                      </p>
                    </div>
                    <Switch
                      checked={configSistema.backupAutomatico}
                      onCheckedChange={(checked) => setConfigSistema(prev => ({ ...prev, backupAutomatico: checked }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequenciaBackup">Frequência do backup</Label>
                    <Select
                      value={configSistema.frequenciaBackup}
                      onValueChange={(value) => setConfigSistema(prev => ({ ...prev, frequenciaBackup: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6h">A cada 6 horas</SelectItem>
                        <SelectItem value="diario">Diário</SelectItem>
                        <SelectItem value="semanal">Semanal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="retencaoLogs">Retenção de logs (dias)</Label>
                    <Input
                      id="retencaoLogs"
                      type="number"
                      value={configSistema.retencaoLogs}
                      onChange={(e) => setConfigSistema(prev => ({ ...prev, retencaoLogs: e.target.value }))}
                      placeholder="90"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tamanhoMaxArquivo">
                      Tamanho máximo de arquivo (MB)
                    </Label>
                    <Input
                      id="tamanhoMaxArquivo"
                      type="number"
                      value={configSistema.tamanhoMaxArquivo}
                      onChange={(e) => setConfigSistema(prev => ({ ...prev, tamanhoMaxArquivo: e.target.value }))}
                      placeholder="10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeoutSessao">Timeout de sessão (minutos)</Label>
                    <Input
                      id="timeoutSessao"
                      type="number"
                      value={configSistema.timeoutSessao}
                      onChange={(e) => setConfigSistema(prev => ({ ...prev, timeoutSessao: e.target.value }))}
                      placeholder="30"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Modo de manutenção</Label>
                      <p className="text-sm text-muted-foreground">
                        Ativar modo de manutenção do sistema
                      </p>
                    </div>
                    <Switch
                      checked={configSistema.modoManutencao}
                      onCheckedChange={(checked) => setConfigSistema(prev => ({ ...prev, modoManutencao: checked }))}
                    />
                  </div>

                  <Separator />

                  <div className="flex gap-4">
                    <Button className={`${classes.buttonSecondary} text-white`}>
                      <RefreshCw className="w-4 h-4 mr-2" /> Limpar Cache
                    </Button>
                    <Button className={`${classes.buttonSecondary} text-white`}>
                      <Database className="w-4 h-4 mr-2" /> Backup Manual
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={salvarConfigSistema}
                    disabled={savingConfigs}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {savingConfigs ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- APARENCIA ---------------- */}
          <TabsContent value="aparencia" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" /> Configurações de Aparência
                </CardTitle>
                <CardDescription>Personalize a aparência do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tema">Tema</Label>
                    <Select
                      value={configAparencia.tema}
                      onValueChange={(value) => setConfigAparencia(prev => ({ ...prev, tema: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="claro">Claro</SelectItem>
                        <SelectItem value="escuro">Escuro</SelectItem>
                        <SelectItem value="auto">Automático</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="idioma">Idioma</Label>
                    <Select
                      value={configAparencia.idioma}
                      onValueChange={(value) => setConfigAparencia(prev => ({ ...prev, idioma: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="es-ES">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="formatoData">Formato de data</Label>
                    <Select
                      value={configAparencia.formatoData}
                      onValueChange={(value) => setConfigAparencia(prev => ({ ...prev, formatoData: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dd/mm/yyyy">DD/MM/AAAA</SelectItem>
                        <SelectItem value="mm/dd/yyyy">MM/DD/AAAA</SelectItem>
                        <SelectItem value="yyyy-mm-dd">AAAA-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="densidade">Densidade da interface</Label>
                    <Select
                      value={configAparencia.densidade}
                      onValueChange={(value) => setConfigAparencia(prev => ({ ...prev, densidade: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compacta">Compacta</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="confortavel">Confortável</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>



                  <div className="space-y-2">
                    <Label htmlFor="corPrimaria">Cor primária</Label>
                    <Select
                      value={configAparencia.corPrimaria}
                      onValueChange={(value) => setConfigAparencia(prev => ({ ...prev, corPrimaria: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="azul">Azul</SelectItem>
                        <SelectItem value="verde">Verde</SelectItem>
                        <SelectItem value="roxo">Roxo</SelectItem>
                        <SelectItem value="vermelho">Vermelho</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Animações</Label>
                      <p className="text-sm text-muted-foreground">
                        Ativar animações na interface
                      </p>
                    </div>
                    <Switch
                      checked={configAparencia.animacoes}
                      onCheckedChange={(checked) => setConfigAparencia(prev => ({ ...prev, animacoes: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sidebar compacta</Label>
                      <p className="text-sm text-muted-foreground">
                        Usar sidebar em modo compacto
                      </p>
                    </div>
                    <Switch
                      checked={configAparencia.sidebarCompacta}
                      onCheckedChange={(checked) => setConfigAparencia(prev => ({ ...prev, sidebarCompacta: checked }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={salvarConfigAparencia}
                    disabled={savingConfigs}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {savingConfigs ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- MALOTE ---------------- */}
          <TabsContent value="malote" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" /> Gerenciamento de Malotes
                    </CardTitle>
                    <CardDescription>
                      Mantenha os malotes padronizados conforme setores e contratos
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => { resetMaloteForm(); setShowCreateMaloteModal(true); }}
                      className={`${classes.button} text-white`}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Malote
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowHubModal(true)}
                      className="gap-2"
                    >
                      <Building2 className="w-4 h-4" />
                      Centro Logistico
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>


                {/* Filtros e Busca */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por Nº, Setor ou Código..."
                        value={searchTermMalote}
                        onChange={(e) => setSearchTermMalote(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Select value={statusFilterMalote} onValueChange={setStatusFilterMalote}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex rounded-md overflow-hidden">
                      <Button
                        variant={viewModeMalote === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewModeMalote('grid')}
                        className="rounded-r-none"
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={viewModeMalote === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewModeMalote('list')}
                        className="rounded-l-none"
                      >
                        <List className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Contador de Resultados */}
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    Exibindo {paginatedMalotes.length} de {filteredAndSortedMalotes.length} malotes
                  </p>
                  {(searchTermMalote || statusFilterMalote !== 'todos') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setSearchTermMalote(''); setStatusFilterMalote('todos'); }}
                    >
                      Limpar filtros
                    </Button>
                  )}
                </div>

                {/* Lista: tabela ou cartões */}
                {viewModeMalote === 'list' ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs w-[140px]">Nº Malote</TableHead>
                          <TableHead className="text-xs w-[160px]">Nº Contrato</TableHead>


                          <TableHead className="text-xs w-[140px]">CEP Origem</TableHead>
                          <TableHead className="text-xs w-[140px]">CEP Destino</TableHead>
                          <TableHead className="text-xs w-[140px]">Percurso</TableHead>
                          <TableHead className="text-xs w-[140px]">Cód. Emissão</TableHead>
                          <TableHead className="text-xs w-[140px]">Emissão</TableHead>
                          <TableHead className="text-xs w-[140px]">Validade</TableHead>
                          <TableHead className="text-xs w-[120px]">Ida</TableHead>
                          <TableHead className="text-xs w-[120px]">Tamanho</TableHead>
                          <TableHead className="text-xs w-[120px]">Estação</TableHead>
                          <TableHead className="text-xs w-[120px]">Distritos</TableHead>
                          <TableHead className="text-xs w-[120px]">Status</TableHead>
                          <TableHead className="text-xs text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedMalotes.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="h-24 text-center">Nenhum malote encontrado.</TableCell>
                          </TableRow>
                        ) : (
                          paginatedMalotes.map((m: any) => (
                            <TableRow key={m.id}>
                              <TableCell className="font-medium text-xs">{m.numeroMalote}</TableCell>
                              <TableCell className="text-xs">{m.numeroContrato || '-'}</TableCell>


                              <TableCell className="text-xs">{m.cepOrigem || '-'}</TableCell>
                              <TableCell className="text-xs">{m.cepDestino || '-'}</TableCell>
                              <TableCell className="text-xs">{m.percurso || m.numeroPercurso}</TableCell>
                              <TableCell className="text-xs">{m.codigoEmissao}</TableCell>
                              <TableCell className="text-xs">{formatDatePTBR(m.dataEmissao)}</TableCell>
                              <TableCell className="text-xs">{formatDatePTBR(m.validade || m.dataValidade)}</TableCell>
                              <TableCell className="text-xs">{m.ida || '-'}</TableCell>
                              <TableCell className="text-xs">{m.tamanho || '-'}</TableCell>
                              <TableCell className="text-xs">{m.estacao || '-'}</TableCell>
                              <TableCell className="text-xs">{m.distritos || '-'}</TableCell>
                              <TableCell>
                                <Badge variant={m.ativo ? 'default' : 'secondary'}>
                                  {m.ativo ? 'Ativo' : 'Inativo'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Abrir menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openEditMalote(m)}>Editar</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openViewMalote(m)}>Visualizar</DropdownMenuItem>
                                    <DropdownMenuItem onClick={async () => {
                                      try {
                                        await api.deleteMalote(m.id);
                                        await fetchMalotes();
                                        showSuccess('Excluído', 'Malote removido com sucesso.');
                                      } catch (error) {
                                        console.error('Erro ao excluir malote:', error);
                                        showError('Erro', 'Não foi possível excluir o malote.');
                                      }
                                    }}>Excluir</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.keys(malotesAgrupadosPorSetorDestino).length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Nenhum malote encontrado.</p>
                      </div>
                    ) : (
                      Object.entries(malotesAgrupadosPorSetorDestino).map(([setorId, grupo]) => (
                        <div key={setorId} className="border border-gray-200 rounded-lg overflow-hidden">
                          {/* Cabeçalho do Grupo - Clicável para expandir/recolher */}
                          <div
                            className="bg-primary/10 border-b border-primary/20 p-3 cursor-pointer hover:bg-primary/15 transition-colors"
                            onClick={() => setExpandedMaloteGroups(prev => ({ ...prev, [setorId]: !prev[setorId] }))}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {expandedMaloteGroups[setorId] ? (
                                  <ChevronDown className="w-4 h-4 text-primary" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-primary" />
                                )}
                                <div>
                                  <h3 className="text-base font-semibold text-primary font-heading flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    {grupo.setorNome}
                                  </h3>
                                  <p className="text-xs text-foreground-secondary mt-1">
                                    CEP Destino: {grupo.cepDestino} • {grupo.malotes.length} {grupo.malotes.length === 1 ? 'malote' : 'malotes'}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline" className="bg-white">
                                {grupo.malotes.length}
                              </Badge>
                            </div>
                          </div>

                          {/* Cards dos Malotes do Grupo - Retrátil */}
                          {expandedMaloteGroups[setorId] && (
                            <div className="p-4 bg-gray-50">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {grupo.malotes.map((m: any) => (
                                  <ExpandableCard
                                    key={m.id}
                                    className="card-govto hover:shadow-md transition-shadow bg-white"
                                    header={
                                      <div className="flex items-start justify-between w-full">
                                        <div>
                                          <div className="text-sm font-bold text-primary font-heading">Malote {m.numeroMalote}</div>
                                          <div className="text-xs text-foreground-secondary">Origem: {m.setorOrigemNome || m.setorNome || '-'}</div>
                                        </div>
                                      </div>
                                    }
                                    actions={
                                      <div className="flex items-center gap-1">
                                        <Badge variant={m.ativo ? 'default' : 'secondary'} className="text-xs px-1 py-0">
                                          {m.ativo ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-6 w-6 p-0" aria-label="Abrir menu de ações">
                                              <span className="sr-only">Abrir menu</span>
                                              <MoreHorizontal className="h-3 w-3" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEditMalote(m)}>Editar</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openViewMalote(m)}>Visualizar</DropdownMenuItem>
                                            <DropdownMenuItem onClick={async () => {
                                              try {
                                                await api.deleteMalote(m.id);
                                                await fetchMalotes();
                                                showSuccess('Excluído', 'Malote removido com sucesso.');
                                              } catch (error) {
                                                console.error('Erro ao excluir malote:', error);
                                                showError('Erro', 'Não foi possível excluir o malote.');
                                              }
                                            }}>Excluir</DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    }
                                  >
                                    <div className="text-xs space-y-0.5">
                                      <div><span className="font-medium">Contrato:</span> {m.numeroContrato || '-'}</div>
                                      <div><span className="font-medium">Emissão:</span> {formatDatePTBR(m.dataEmissao)}</div>
                                      <div><span className="font-medium">Validade:</span> {formatDatePTBR(m.validade || m.dataValidade)}</div>
                                      <div><span className="font-medium">Percurso:</span> {m.percurso || m.numeroPercurso}</div>
                                      <div><span className="font-medium">Código:</span> {m.codigoEmissao}</div>
                                      <div><span className="font-medium">CEP Origem:</span> {m.cepOrigem || '-'}</div>
                                      <div><span className="font-medium">Ida:</span> {m.ida || '-'}</div>
                                      <div><span className="font-medium">Tamanho:</span> {m.tamanho || '-'}</div>
                                      <div><span className="font-medium">Dias:</span> {m.diasServico || '-'}</div>
                                      <div><span className="font-medium">Estação:</span> {m.estacao || '-'}</div>
                                      <div><span className="font-medium">Distritos:</span> {m.distritos || '-'}</div>
                                    </div>
                                  </ExpandableCard>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Paginação */}
                {totalPagesMalote > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t mt-4">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {startIndexMalote + 1} a {Math.min(endIndexMalote, filteredAndSortedMalotes.length)} de {filteredAndSortedMalotes.length} malotes
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPageMalote(prev => Math.max(prev - 1, 1))}
                        disabled={currentPageMalote === 1}
                      >
                        Anterior
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPagesMalote }, (_, i) => i + 1)
                          .filter(page => {
                            const distance = Math.abs(page - currentPageMalote);
                            return distance === 0 || distance === 1 || page === 1 || page === totalPagesMalote;
                          })
                          .map((page, index, array) => {
                            const prevPage = array[index - 1];
                            const showDots = prevPage && page - prevPage > 1;
                            return (
                              <React.Fragment key={page}>
                                {showDots && <span className="px-1">...</span>}
                                <Button
                                  variant={page === currentPageMalote ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setCurrentPageMalote(page)}
                                >
                                  {page}
                                </Button>
                              </React.Fragment>
                            );
                          })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPageMalote(prev => Math.min(prev + 1, totalPagesMalote))}
                        disabled={currentPageMalote === totalPagesMalote}
                      >
                        Próximo
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Modal: Novo Malote */}
            <Dialog open={showCreateMaloteModal} onOpenChange={setShowCreateMaloteModal}>
              <DialogContent className="sm:max-w-[1200px] max-h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Novo Malote</DialogTitle>
                </DialogHeader>

                {/* Cabeçalho do Wizard */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-muted-foreground">
                      Etapa {currentStepMalote} de {stepsMalote.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handlePreviousMalote} disabled={currentStepMalote === 1} className="gap-2 h-8">
                        <ChevronLeft className="w-4 h-4" />
                        Anterior
                      </Button>
                      {currentStepMalote < stepsMalote.length ? (
                        <Button size="sm" onClick={handleNextMalote} className={`${classes.button} text-white gap-2 h-8`}>
                          Próximo
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button size="sm" onClick={handleCreateMalotePersist} className={`${classes.button} text-white gap-2 h-8`}>
                          Finalizar
                          <Save className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <Progress value={progressMalote} className="mb-3" />
                  <div className="flex items-center justify-between">
                    {stepsMalote.map((step, index) => {
                      const Icon = step.icon;
                      const isActive = currentStepMalote === step.id;
                      const isCompleted = currentStepMalote > step.id;
                      return (
                        <div key={step.id} className="flex items-center">
                          <div className={`flex items-center gap-2 ${isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${isActive ? 'bg-primary text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200 text-muted-foreground'}`}>
                              {isCompleted ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                            </div>
                            <span className="text-xs font-medium hidden sm:block">{step.title}</span>
                          </div>
                          {index < stepsMalote.length - 1 && (
                            <div className={`w-12 h-0.5 mx-2 ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Conteúdo do Wizard */}
                <div className="flex-1 overflow-hidden">
                  {currentStepMalote === 1 && (
                    <div className="h-full flex gap-6">
                      {/* Mapa à esquerda */}
                      <div className="w-1/2 flex flex-col">
                        <MapaMalote
                          setorOrigemData={setorOrigemMalote.setorId ? {
                            ID: parseInt(setorOrigemMalote.setorId),
                            NOME: setorOrigemMalote.setorNome,
                            LOGRADOURO: setorOrigemMalote.enderecoSetor.logradouro,
                            NUMERO: setorOrigemMalote.enderecoSetor.numero,
                            COMPLEMENTO: setorOrigemMalote.enderecoSetor.complemento,
                            BAIRRO: setorOrigemMalote.enderecoSetor.bairro,
                            CIDADE: setorOrigemMalote.enderecoSetor.cidade,
                            ESTADO: setorOrigemMalote.enderecoSetor.estado,
                            CEP: setorOrigemMalote.enderecoSetor.cep,
                            LATITUDE: setorOrigemMalote.latitude,
                            LONGITUDE: setorOrigemMalote.longitude
                          } : null}
                          setorDestinoData={setorDestinoMalote.setorId ? {
                            ID: parseInt(setorDestinoMalote.setorId),
                            NOME: setorDestinoMalote.setorNome,
                            LOGRADOURO: setorDestinoMalote.enderecoSetor.logradouro,
                            NUMERO: setorDestinoMalote.enderecoSetor.numero,
                            COMPLEMENTO: setorDestinoMalote.enderecoSetor.complemento,
                            BAIRRO: setorDestinoMalote.enderecoSetor.bairro,
                            CIDADE: setorDestinoMalote.enderecoSetor.cidade,
                            ESTADO: setorDestinoMalote.enderecoSetor.estado,
                            CEP: setorDestinoMalote.enderecoSetor.cep,
                            LATITUDE: setorDestinoMalote.latitude,
                            LONGITUDE: setorDestinoMalote.longitude
                          } : null}
                        />
                      </div>

                      {/* Campos à direita */}
                      <div className="w-1/2 overflow-y-auto space-y-6">
                        {/* Dados do Malote */}
                        <div className="space-y-4">
                          {/* Endereço do Setor de uso do Malote */}
                          <div className="space-y-4">
                            {/* Setor Origem */}
                            <div className="space-y-2">
                              <Label htmlFor="setor-origem">Setor Origem</Label>
                              <Popover open={setorOrigemComboboxOpen} onOpenChange={setSetorOrigemComboboxOpen}>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" role="combobox" aria-expanded={setorOrigemComboboxOpen} className="w-full justify-between">
                                    {setorOrigemMalote.setorNome || 'Selecione o setor origem'}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0 w-[360px]" align="start">
                                  <Command>
                                    <CommandInput placeholder="Pesquisar setor origem..." />
                                    <CommandList>
                                      <CommandEmpty>Nenhum setor encontrado.</CommandEmpty>
                                      <CommandGroup>
                                        {Array.isArray(setoresData) && setoresData.map((s: any) => (
                                          <CommandItem
                                            key={String(s.ID)}
                                            value={s.NOME_SETOR || s.SETOR || 'Setor'}
                                            onSelect={() => {
                                              const value = String(s.ID);
                                              setSetorOrigemMalote(prev => ({
                                                ...prev,
                                                setorId: value,
                                                setorNome: s.NOME_SETOR || s.SETOR || '',
                                                latitude: s.LATITUDE || null,
                                                longitude: s.LONGITUDE || null,
                                                enderecoSetor: {
                                                  logradouro: s.LOGRADOURO || '',
                                                  numero: s.NUMERO || '',
                                                  complemento: s.COMPLEMENTO || '',
                                                  bairro: s.BAIRRO || '',
                                                  cidade: s.CIDADE || '',
                                                  estado: s.ESTADO || '',
                                                  cep: s.CEP || '',
                                                }
                                              }));
                                              // Atualizar CEP Origem no maloteConfig
                                              setMaloteConfig(prev => ({
                                                ...prev,
                                                cepOrigem: s.CEP || ''
                                              }));
                                              setSetorOrigemComboboxOpen(false);
                                            }}
                                          >
                                            {s.NOME_SETOR || s.SETOR || 'Setor'}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              {setorOrigemMalote.setorId && (
                                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                                  <div className="font-medium">Endereço:</div>
                                  <div>
                                    {setorOrigemMalote.enderecoSetor.logradouro && `${setorOrigemMalote.enderecoSetor.logradouro}`}
                                    {setorOrigemMalote.enderecoSetor.numero && `, ${setorOrigemMalote.enderecoSetor.numero}`}
                                    {setorOrigemMalote.enderecoSetor.complemento && ` - ${setorOrigemMalote.enderecoSetor.complemento}`}
                                  </div>
                                  <div>
                                    {setorOrigemMalote.enderecoSetor.bairro && `${setorOrigemMalote.enderecoSetor.bairro}, `}
                                    {setorOrigemMalote.enderecoSetor.cidade && `${setorOrigemMalote.enderecoSetor.cidade}`}
                                    {setorOrigemMalote.enderecoSetor.estado && ` - ${setorOrigemMalote.enderecoSetor.estado}`}
                                  </div>
                                  {setorOrigemMalote.enderecoSetor.cep && (
                                    <div className="font-medium text-blue-600">CEP: {setorOrigemMalote.enderecoSetor.cep}</div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Setor Destino */}
                            <div className="space-y-2">
                              <Label htmlFor="setor-destino">Setor Destino</Label>
                              <Popover open={setorDestinoComboboxOpen} onOpenChange={setSetorDestinoComboboxOpen}>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" role="combobox" aria-expanded={setorDestinoComboboxOpen} className="w-full justify-between">
                                    {setorDestinoMalote.setorNome || 'Selecione o setor destino'}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0 w-[360px]" align="start">
                                  <Command>
                                    <CommandInput placeholder="Pesquisar setor destino..." />
                                    <CommandList>
                                      <CommandEmpty>Nenhum setor encontrado.</CommandEmpty>
                                      <CommandGroup>
                                        {Array.isArray(setoresData) && setoresData.map((s: any) => (
                                          <CommandItem
                                            key={String(s.ID)}
                                            value={s.NOME_SETOR || s.SETOR || 'Setor'}
                                            onSelect={() => {
                                              const value = String(s.ID);
                                              setSetorDestinoMalote(prev => ({
                                                ...prev,
                                                setorId: value,
                                                setorNome: s.NOME_SETOR || s.SETOR || '',
                                                latitude: s.LATITUDE || null,
                                                longitude: s.LONGITUDE || null,
                                                enderecoSetor: {
                                                  logradouro: s.LOGRADOURO || '',
                                                  numero: s.NUMERO || '',
                                                  complemento: s.COMPLEMENTO || '',
                                                  bairro: s.BAIRRO || '',
                                                  cidade: s.CIDADE || '',
                                                  estado: s.ESTADO || '',
                                                  cep: s.CEP || '',
                                                }
                                              }));
                                              // Atualizar CEP Destino no maloteConfig
                                              setMaloteConfig(prev => ({
                                                ...prev,
                                                cepDestino: s.CEP || ''
                                              }));
                                              setSetorDestinoComboboxOpen(false);
                                            }}
                                          >
                                            {s.NOME_SETOR || s.SETOR || 'Setor'}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              {setorDestinoMalote.setorId && (
                                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                                  <div className="font-medium">Endereço:</div>
                                  <div>
                                    {setorDestinoMalote.enderecoSetor.logradouro && `${setorDestinoMalote.enderecoSetor.logradouro}`}
                                    {setorDestinoMalote.enderecoSetor.numero && `, ${setorDestinoMalote.enderecoSetor.numero}`}
                                    {setorDestinoMalote.enderecoSetor.complemento && ` - ${setorDestinoMalote.enderecoSetor.complemento}`}
                                  </div>
                                  <div>
                                    {setorDestinoMalote.enderecoSetor.bairro && `${setorDestinoMalote.enderecoSetor.bairro}, `}
                                    {setorDestinoMalote.enderecoSetor.cidade && `${setorDestinoMalote.enderecoSetor.cidade}`}
                                    {setorDestinoMalote.enderecoSetor.estado && ` - ${setorDestinoMalote.enderecoSetor.estado}`}
                                  </div>
                                  {setorDestinoMalote.enderecoSetor.cep && (
                                    <div className="font-medium text-blue-600">CEP: {setorDestinoMalote.enderecoSetor.cep}</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  )}

                  {currentStepMalote === 2 && (
                    <div className="space-y-6">
                      {/* Dados do Malote */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Dados do Malote</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="num-malote">
                              Nº Malote <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="num-malote"
                              value={maloteConfig.numeroMalote}
                              onChange={(e) => setMaloteConfig(prev => ({ ...prev, numeroMalote: e.target.value }))}
                              placeholder="Digite o número do malote"
                              className={!maloteConfig.numeroMalote ? 'border-red-300' : ''}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="percurso">
                              Percurso <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="percurso"
                              value={maloteConfig.percurso}
                              onChange={(e) => setMaloteConfig(prev => ({ ...prev, percurso: e.target.value }))}
                              placeholder="Digite o percurso"
                              className={!maloteConfig.percurso ? 'border-red-300' : ''}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="ida">Ida</Label>
                            <Input
                              id="ida"
                              value={maloteConfig.ida}
                              onChange={(e) => setMaloteConfig(prev => ({ ...prev, ida: e.target.value }))}
                              placeholder="1"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tamanho">Tamanho</Label>
                            <Input
                              id="tamanho"
                              value={maloteConfig.tamanho}
                              onChange={(e) => setMaloteConfig(prev => ({ ...prev, tamanho: e.target.value }))}
                              placeholder="G"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>Dias de Serviço</Label>
                            <Popover open={diasSemanaPopoverOpen} onOpenChange={setDiasSemanaPopoverOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between"
                                >
                                  {diasSemanaSelecionados.length > 0
                                    ? diasSemanaSelecionados.join(', ')
                                    : 'Selecione os dias da semana'}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-4" align="start">
                                <div className="space-y-2">
                                  <div className="text-sm font-medium mb-3">Selecione os dias de serviço:</div>
                                  {['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'].map((dia) => (
                                    <div key={dia} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`dia-${dia}`}
                                        checked={diasSemanaSelecionados.includes(dia)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            const novosDias = [...diasSemanaSelecionados, dia];
                                            setDiasSemanaSelecionados(novosDias);
                                            setMaloteConfig(prev => ({ ...prev, diasServico: novosDias.join(', ') }));
                                          } else {
                                            const novosDias = diasSemanaSelecionados.filter(d => d !== dia);
                                            setDiasSemanaSelecionados(novosDias);
                                            setMaloteConfig(prev => ({ ...prev, diasServico: novosDias.join(', ') }));
                                          }
                                        }}
                                      />
                                      <Label
                                        htmlFor={`dia-${dia}`}
                                        className="text-sm font-normal cursor-pointer"
                                      >
                                        {dia}
                                      </Label>
                                    </div>
                                  ))}
                                  <div className="flex gap-2 mt-4 pt-3 border-t">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="flex-1"
                                      onClick={() => {
                                        const todosDias = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
                                        setDiasSemanaSelecionados(todosDias);
                                        setMaloteConfig(prev => ({ ...prev, diasServico: todosDias.join(', ') }));
                                      }}
                                    >
                                      Dias Úteis
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="flex-1"
                                      onClick={() => {
                                        setDiasSemanaSelecionados([]);
                                        setMaloteConfig(prev => ({ ...prev, diasServico: '' }));
                                      }}
                                    >
                                      Limpar
                                    </Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="estacao">Estação</Label>
                            <Input
                              id="estacao"
                              value={maloteConfig.estacao}
                              onChange={(e) => setMaloteConfig(prev => ({ ...prev, estacao: e.target.value }))}
                              placeholder="A"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="distritos">Distritos</Label>
                            <Input
                              id="distritos"
                              value={maloteConfig.distritos}
                              onChange={(e) => setMaloteConfig(prev => ({ ...prev, distritos: e.target.value }))}
                              placeholder="307"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Dados do Contrato */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">Dados do Contrato</h3>
                          <Button
                            type="button"
                            variant={editandoDadosContrato ? "default" : "outline"}
                            size="sm"
                            onClick={() => setEditandoDadosContrato(!editandoDadosContrato)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            {editandoDadosContrato ? 'Bloquear Edição' : 'Editar'}
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="num-contrato">Nº Contrato</Label>
                            <Input
                              id="num-contrato"
                              value={maloteConfig.numeroContrato}
                              onChange={(e) => setMaloteConfig(prev => ({ ...prev, numeroContrato: e.target.value }))}
                              disabled={!editandoDadosContrato}
                              className={!editandoDadosContrato ? 'bg-gray-50' : ''}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="codigo-emissao">Código de Emissão</Label>
                            <Input
                              id="codigo-emissao"
                              value={maloteConfig.codigoEmissao}
                              onChange={(e) => setMaloteConfig(prev => ({ ...prev, codigoEmissao: e.target.value }))}
                              disabled={!editandoDadosContrato}
                              className={!editandoDadosContrato ? 'bg-gray-50' : ''}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="data-emissao">Data de Emissão</Label>
                            <Input
                              id="data-emissao"
                              value={maloteConfig.dataEmissao}
                              onChange={(e) => setMaloteConfig(prev => ({ ...prev, dataEmissao: e.target.value }))}
                              disabled={!editandoDadosContrato}
                              className={!editandoDadosContrato ? 'bg-gray-50' : ''}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="validade">Validade</Label>
                            <Input
                              id="validade"
                              value={maloteConfig.validade}
                              onChange={(e) => setMaloteConfig(prev => ({ ...prev, validade: e.target.value }))}
                              disabled={!editandoDadosContrato}
                              className={!editandoDadosContrato ? 'bg-gray-50' : ''}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Rodapé igual ao do modal Novo Setor */}
                <DialogFooter>
                  {/* Status do Malote movido para o rodapé - travado como Ativo */}
                  <div className="flex items-center space-x-2 mr-auto">
                    <Label htmlFor="ativo-switch-malote" className="text-sm font-medium">
                      Status:
                    </Label>
                    <span className="text-sm text-green-600 font-medium">
                      Ativo
                    </span>
                    <Switch
                      id="ativo-switch-malote"
                      checked={true}
                      disabled={true}
                      className="opacity-50"
                    />
                  </div>

                  <Button variant="outline" onClick={resetMaloteForm}>
                    Limpar Campos
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateMaloteModal(false)}>Cancelar</Button>
                  {currentStepMalote < stepsMalote.length ? (
                    <Button className="btn-govto-primary" onClick={handleNextMalote}>
                      Próximo
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button className="btn-govto-primary" onClick={handleCreateMalotePersist}>
                      Criar Malote
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Modal: Centro Logistico (Setar/Alterar Setor Hub) */}
            <Dialog open={showHubModal} onOpenChange={setShowHubModal}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Centro Logistico</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Setor</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between">
                          {(() => {
                            const hubId = configGeral.HUB_SETOR_ID;
                            if (!hubId) return 'Selecione o setor';
                            const setor = Array.isArray(setoresData) ? setoresData.find((s: any) => String(s.ID ?? s.id) === String(hubId)) : null;
                            return setor?.NOME_SETOR || setor?.SETOR || 'Selecione o setor';
                          })()}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[400px]" align="start">
                        <Command>
                          <CommandInput placeholder="Pesquisar setor..." />
                          <CommandList>
                            <CommandEmpty>Nenhum setor encontrado.</CommandEmpty>
                            <CommandGroup>
                              {Array.isArray(setoresData) && setoresData.map((s: any) => (
                                <CommandItem key={String(s.ID ?? s.id)} onSelect={() => setConfigGeral(prev => ({ ...prev, HUB_SETOR_ID: Number(s.ID ?? s.id) }))}>
                                  {s.NOME_SETOR || s.SETOR || 'Setor'}
                                </CommandItem>
                              ))}
                              <CommandItem onSelect={() => setConfigGeral(prev => ({ ...prev, HUB_SETOR_ID: '' }))}>
                                Sem setor
                              </CommandItem>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowHubModal(false)}>Cancelar</Button>
                  <Button
                    onClick={async () => {
                      await salvarConfiguracoes('geral', { HUB_SETOR_ID: configGeral.HUB_SETOR_ID });
                      setShowHubModal(false);
                    }}
                    disabled={savingConfigs || !configGeral.HUB_SETOR_ID}
                    className={`${classes.button} text-white`}
                  >
                    <Save className="w-4 h-4" />
                    {savingConfigs ? 'Salvando...' : 'Salvar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Modal: Visualizar Malote */}
            <Dialog open={showViewMaloteModal} onOpenChange={setShowViewMaloteModal}>
              <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Visualizar Malote</DialogTitle>
                </DialogHeader>
                {viewMaloteData ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Nº Malote</Label>
                        <div className="text-sm p-2 border rounded bg-muted/30">{viewMaloteData.numeroMalote || '-'}</div>
                      </div>
                      <div>
                        <Label>Contrato</Label>
                        <div className="text-sm p-2 border rounded bg-muted/30">{viewMaloteData.numeroContrato || '-'}</div>
                      </div>
                      <div>
                        <Label>Setor Origem</Label>
                        <div className="text-sm p-2 border rounded bg-muted/30">{viewMaloteData.setorOrigemNome || viewMaloteData.setorNome || '-'}</div>
                      </div>
                      <div>
                        <Label>Setor Destino</Label>
                        <div className="text-sm p-2 border rounded bg-muted/30">{viewMaloteData.setorDestinoNome || '-'}</div>
                      </div>
                      <div>
                        <Label>Percurso</Label>
                        <div className="text-sm p-2 border rounded bg-muted/30">{viewMaloteData.percurso || viewMaloteData.numeroPercurso || '-'}</div>
                      </div>
                      <div>
                        <Label>Código Emissão</Label>
                        <div className="text-sm p-2 border rounded bg-muted/30">{viewMaloteData.codigoEmissao || '-'}</div>
                      </div>
                      <div>
                        <Label>Data Emissão</Label>
                        <div className="text-sm p-2 border rounded bg-muted/30">{formatDatePTBR(viewMaloteData.dataEmissao)}</div>
                      </div>
                      <div>
                        <Label>Validade</Label>
                        <div className="text-sm p-2 border rounded bg-muted/30">{formatDatePTBR(viewMaloteData.validade || viewMaloteData.dataValidade)}</div>
                      </div>
                      <div>
                        <Label>Estação</Label>
                        <div className="text-sm p-2 border rounded bg-muted/30">{viewMaloteData.estacao || '-'}</div>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <div className="text-sm p-2 border rounded bg-muted/30">{viewMaloteData.ativo ? 'Ativo' : 'Inativo'}</div>
                      </div>
                      <div>
                        <Label>CEP Origem</Label>
                        <div className="text-sm p-2 border rounded bg-muted/30">{viewMaloteData.cepOrigem || '-'}</div>
                      </div>
                      <div>
                        <Label>CEP Destino</Label>
                        <div className="text-sm p-2 border rounded bg-muted/30">{viewMaloteData.cepDestino || '-'}</div>
                      </div>
                      <div>
                        <Label>Ida</Label>
                        <div className="text-sm p-2 border rounded bg-muted/30">{viewMaloteData.ida || '-'}</div>
                      </div>
                      <div>
                        <Label>Tamanho</Label>
                        <div className="text-sm p-2 border rounded bg-muted/30">{viewMaloteData.tamanho || '-'}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Mapa Origem/Destino</Label>
                      <MapaMalote
                        setorOrigemData={viewMaloteData.setorOrigemId ? {
                          ID: parseInt(String(viewMaloteData.setorOrigemId)),
                          NOME: viewMaloteData.setorOrigemNome,
                          LOGRADOURO: viewMaloteData.setorOrigemLogradouro,
                          NUMERO: viewMaloteData.setorOrigemNumero,
                          COMPLEMENTO: viewMaloteData.setorOrigemComplemento,
                          BAIRRO: viewMaloteData.setorOrigemBairro,
                          CIDADE: viewMaloteData.setorOrigemCidade,
                          ESTADO: viewMaloteData.setorOrigemEstado,
                          CEP: viewMaloteData.cepOrigem,
                          LATITUDE: viewMaloteData.setorOrigemLatitude,
                          LONGITUDE: viewMaloteData.setorOrigemLongitude
                        } : null}
                        setorDestinoData={viewMaloteData.setorDestinoId ? {
                          ID: parseInt(String(viewMaloteData.setorDestinoId)),
                          NOME: viewMaloteData.setorDestinoNome,
                          LOGRADOURO: viewMaloteData.setorDestinoLogradouro,
                          NUMERO: viewMaloteData.setorDestinoNumero,
                          COMPLEMENTO: viewMaloteData.setorDestinoComplemento,
                          BAIRRO: viewMaloteData.setorDestinoBairro,
                          CIDADE: viewMaloteData.setorDestinoCidade,
                          ESTADO: viewMaloteData.setorDestinoEstado,
                          CEP: viewMaloteData.cepDestino,
                          LATITUDE: viewMaloteData.setorDestinoLatitude,
                          LONGITUDE: viewMaloteData.setorDestinoLongitude
                        } : null}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Carregando dados do malote...</div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ---------------- USUARIOS ---------------- */}
          <TabsContent value="usuarios" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" /> Configurações de Usuários
                    </CardTitle>
                    <CardDescription>
                      Gerencie os usuários do sistema
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        resetForm();
                        setShowCreateModal(true);
                      }}
                      className={`${classes.button} text-white`}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Usuário
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filtros e Busca */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome, email ou matrícula..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={perfilFilter} onValueChange={setPerfilFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Perfil" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                        <SelectItem value="USER">Usuário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Contador de Resultados */}
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    Exibindo {paginatedUsuarios.length} de {filteredAndSortedUsuarios.length} usuários
                  </p>
                  <div className="flex items-center gap-2">
                    {(searchTerm || statusFilter !== "todos" || perfilFilter !== "todos") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchTerm("");
                          setStatusFilter("todos");
                          setPerfilFilter("todos");
                        }}
                      >
                        Limpar Filtros
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMapaUsuariosModal(true)}
                      className="gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      Ver Mapa Geral
                    </Button>
                    <div className="flex border rounded-md">
                      <Button
                        variant={viewModeUsuarios === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewModeUsuarios('grid')}
                        className="rounded-r-none border-r"
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={viewModeUsuarios === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewModeUsuarios('list')}
                        className="rounded-l-none"
                      >
                        <List className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border overflow-x-auto">
                  {viewModeUsuarios === 'list' ? (
                    <Table className="min-w-full">
                      <TableHeader>
                        <TableRow>
                          {renderSortableHeader('nome', 'Nome', 'min-w-[200px] w-[200px]')}
                          {renderSortableHeader('numero_funcional', 'Matrícula', 'min-w-[120px] w-[120px]')}
                          {renderSortableHeader('email', 'Email', 'min-w-[200px] w-[200px]')}
                          {renderSortableHeader('perfil', 'Perfil', 'min-w-[100px] w-[100px]')}
                          {renderSortableHeader('ativo', 'Status', 'min-w-[80px] w-[80px]')}
                          {renderSortableHeader('setor', 'Setor', 'min-w-[150px] w-[150px]')}
                          {renderSortableHeader('created_at', 'Criado em', 'min-w-[140px] w-[140px]')}
                          <TableHead className="text-right min-w-[100px] w-[100px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingUsuarios ? (
                          <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                              <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
                            </TableCell>
                          </TableRow>
                        ) : !Array.isArray(filteredUsuarios) || filteredUsuarios.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                              {usuariosData.length === 0
                                ? "Nenhum usuário encontrado."
                                : "Nenhum usuário corresponde aos filtros aplicados."
                              }
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedUsuarios.map((u) => (
                            <TableRow key={u.ID || u.id}>
                              <TableCell className="font-medium min-w-[200px] w-[200px] py-2 px-3">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="truncate block text-xs">
                                        {u.nome || u.NAME || '-'}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{u.nome || u.NAME || '-'}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell className="text-blue-600 font-medium min-w-[120px] w-[120px] py-2 px-3">
                                <span className="text-xs">{formatMatriculaVinculo(u)}</span>
                              </TableCell>
                              <TableCell className="min-w-[200px] w-[200px] py-2 px-3">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="truncate block text-xs">
                                        {u.email || u.EMAIL || '-'}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{u.email || u.EMAIL || '-'}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell className="min-w-[100px] w-[100px] py-2 px-3">
                                <Badge className={getProfileBadgeClass(u.perfil || u.ROLE || 'USER')}>
                                  <span className="text-xs">{u.perfil || u.ROLE || 'USER'}</span>
                                </Badge>
                              </TableCell>
                              <TableCell className="min-w-[80px] w-[80px] py-2 px-3">
                                <Badge variant={u.ativo ? "default" : "secondary"} size="sm">
                                  <span className="text-xs">{u.ativo ? 'Ativo' : 'Inativo'}</span>
                                </Badge>
                              </TableCell>
                              <TableCell className="min-w-[150px] w-[150px] py-2 px-3">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="text-xs truncate block">{u.setor || u.SETOR || u.setorNome || u.SETOR_NOME || u.setor_nome || '-'}</span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{u.setor || u.SETOR || u.setorNome || u.SETOR_NOME || u.setor_nome || '-'}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell className="min-w-[140px] w-[140px] py-2 px-3">
                                {(() => {
                                  const dateValue = u.CREATED_AT || u.created_at || u.createdAt;
                                  if (!dateValue) return <span className="text-sm">N/A</span>;

                                  try {
                                    let date;

                                    // Se for string no formato Oracle (DD/MM/AA HH:MM:SS)
                                    if (typeof dateValue === 'string' && dateValue.includes('/')) {
                                      const [datePart] = dateValue.split(' ');
                                      const [day, month, year] = datePart.split('/');
                                      const fullYear = year.length === 2 ? `20${year}` : year;
                                      date = new Date(`${fullYear}-${month}-${day}`);
                                    } else {
                                      date = new Date(dateValue);
                                    }

                                    if (isNaN(date.getTime())) return <span className="text-xs">N/A</span>;

                                    return (
                                      <span className="text-xs">
                                        {date.toLocaleDateString('pt-BR')}
                                      </span>
                                    );
                                  } catch (error) {
                                    return <span className="text-xs">N/A</span>;
                                  }
                                })()}
                              </TableCell>
                              <TableCell className="text-right min-w-[100px] w-[100px] py-2 px-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Abrir menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewUser(u)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      Visualizar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleEditUser(u)}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteUser(u.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                      {loadingUsuarios ? (
                        Array.from({ length: 6 }).map((_, index) => (
                          <Card key={index} className="animate-pulse">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : filteredAndSortedUsuarios.length === 0 ? (
                        <div className="col-span-full text-center py-8 text-muted-foreground">
                          Nenhum usuário encontrado
                        </div>
                      ) : (
                        paginatedUsuarios.map((u) => (
                          <ExpandableCard
                            key={u.id}
                            className="hover:shadow-md transition-shadow"
                            header={
                              <div className="min-w-0">
                                <h3 className="font-semibold text-base truncate" title={u.nome}>
                                  {u.nome || "Nome não informado"}
                                </h3>
                                <p className="text-sm text-muted-foreground truncate" title={u.email}>
                                  {u.email || "Email não informado"}
                                </p>
                              </div>
                            }
                            actions={
                              <div className="flex items-center gap-2">
                                <Badge variant={u.ativo ? "default" : "secondary"} className="text-xs shrink-0">
                                  {u.ativo ? 'Ativo' : 'Inativo'}
                                </Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <span className="sr-only">Abrir menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewUser(u)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      Visualizar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditUser(u)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDeleteUser(u.id)} className="text-red-600">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            }
                          >
                            <Separator />
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="space-y-2">
                                <div>
                                  <span className="text-muted-foreground block">Matrícula:</span>
                                  <span className="font-medium">{formatMatriculaVinculo(u)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground block">Perfil:</span>
                                  <Badge className={getProfileBadgeClass(u.perfil || u.ROLE || "USER")}>
                                    <span className="text-xs capitalize">{u.perfil || u.ROLE || "USER"}</span>
                                  </Badge>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-muted-foreground block">Setor:</span>
                                  <span className="font-medium text-xs leading-tight" title={u.setor || u.department || "N/A"}>
                                    {u.setor || u.department || "N/A"}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground block">Criado em:</span>
                                  <span className="font-medium">
                                    {(() => {
                                      const dateValue = u.createdAt || u.created_at || u.CREATED_AT;
                                      if (!dateValue) return "N/A";

                                      try {
                                        let date;
                                        if (typeof dateValue === 'string') {
                                          // Formato Oracle: "16/09/25 08:52:27,822000000"
                                          if (dateValue.includes('/') && dateValue.includes(',')) {
                                            const [datePart, timePart] = dateValue.split(' ');
                                            const [day, month, year] = datePart.split('/');
                                            const fullYear = year.length === 2 ? `20${year}` : year;
                                            const timeWithoutNanos = timePart.split(',')[0];
                                            date = new Date(`${fullYear}-${month}-${day}T${timeWithoutNanos}`);
                                          } else {
                                            date = new Date(dateValue);
                                          }
                                        } else {
                                          date = new Date(dateValue);
                                        }

                                        if (isNaN(date.getTime())) return "N/A";

                                        return date.toLocaleDateString('pt-BR');
                                      } catch {
                                        return "N/A";
                                      }
                                    })()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </ExpandableCard>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Controles de Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>
                        Mostrando {startIndex + 1} a {Math.min(endIndex, filteredAndSortedUsuarios.length)} de {filteredAndSortedUsuarios.length} usuários
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            const distance = Math.abs(page - currentPage);
                            return distance === 0 || distance === 1 || page === 1 || page === totalPages;
                          })
                          .map((page, index, array) => {
                            const prevPage = array[index - 1];
                            const showEllipsis = prevPage && page - prevPage > 1;

                            return (
                              <div key={page} className="flex items-center gap-1">
                                {showEllipsis && <span className="text-muted-foreground">...</span>}
                                <Button
                                  variant={currentPage === page ? "default" : "outline"}
                                  size="sm"
                                  className="w-8 h-8 p-0"
                                  onClick={() => setCurrentPage(page)}
                                >
                                  {page}
                                </Button>
                              </div>
                            );
                          })
                        }
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Próximo
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Modal do Mapa Geral de Usuários */}
            <MapModal
              isOpen={showMapaUsuariosModal}
              onClose={() => setShowMapaUsuariosModal(false)}
              title="Mapa Geral dos Usuários"
              size="large"
            >
              <MapaGeralUsuarios
                usuarios={usuariosData}
                setores={setoresData}
                isVisible={true}
                refreshTrigger={refreshTrigger}
              />
            </MapModal>
          </TabsContent>

          {/* ---------------- SETORES ---------------- */}
          <TabsContent value="setores" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" /> Gerenciamento de Setores
                    </CardTitle>
                    <CardDescription>
                      Configure os setores da organização com informações de endereço completo
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        resetSetorForm();
                        setShowCreateSetorModal(true);
                      }}
                      className={`${classes.button} text-white`}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Setor
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filtros e Busca */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome, código ou órgão..."
                        value={searchTermSetores}
                        onChange={(e) => setSearchTermSetores(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={statusFilterSetores} onValueChange={setStatusFilterSetores}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={orgaoFilterSetores} onValueChange={setOrgaoFilterSetores}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Órgão" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="SEFAZ">SEFAZ</SelectItem>
                        <SelectItem value="SECAD">SECAD</SelectItem>
                        <SelectItem value="SEPLAN">SEPLAN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Contador de Resultados */}
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    Exibindo {paginatedSetores.length} de {filteredAndSortedSetores.length} setores
                    {filteredAndSortedSetores.length !== setoresData.length && (
                      <span className="text-muted-foreground/70"> (filtrados de {setoresData.length} total)</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    {(searchTermSetores || statusFilterSetores !== "todos" || orgaoFilterSetores !== "todos") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchTermSetores("");
                          setStatusFilterSetores("todos");
                          setOrgaoFilterSetores("todos");
                          setCurrentPageSetores(1);
                        }}
                      >
                        Limpar Filtros
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMapaSetoresModal(true)}
                      className="gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      Ver Mapa Geral
                    </Button>
                    <div className="flex border rounded-md">
                      <Button
                        variant={viewModeSetores === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewModeSetores('grid')}
                        className="rounded-r-none border-r"
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={viewModeSetores === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewModeSetores('list')}
                        className="rounded-l-none"
                      >
                        <List className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border">
                  {viewModeSetores === 'list' ? (
                    <Table className="table-fixed">
                      <TableHeader>
                        <TableRow>
                          {renderSortableHeaderSetores('NOME', 'Nome', 'w-[180px]')}
                          {renderSortableHeaderSetores('ORGAO', 'Órgão', 'w-[200px]')}
                          {renderSortableHeaderSetores('ENDERECO', 'Endereço', 'w-[180px]')}
                          {renderSortableHeaderSetores('TELEFONE', 'Telefone', 'w-[120px]')}
                          {renderSortableHeaderSetores('EMAIL', 'Email', 'w-[180px]')}
                          {renderSortableHeaderSetores('ATIVO', 'Status', 'w-[80px]')}
                          <TableHead className="text-right w-[100px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingSetores ? (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                              <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
                            </TableCell>
                          </TableRow>
                        ) : !Array.isArray(paginatedSetores) || paginatedSetores.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                              {setoresData.length === 0
                                ? "Nenhum setor encontrado."
                                : "Nenhum setor corresponde aos filtros aplicados."
                              }
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedSetores.map((setor) => {
                            const endereco = `${setor.LOGRADOURO || ''} ${setor.NUMERO || ''} ${setor.COMPLEMENTO || ''} - ${setor.BAIRRO || ''}`.trim();
                            return (
                              <TableRow key={setor.ID}>
                                <TableCell className="font-medium w-[180px] py-2 px-2">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="truncate block text-xs">
                                          {setor.NOME_SETOR || setor.SETOR}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{setor.NOME_SETOR || setor.SETOR}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>
                                <TableCell className="w-[200px] py-2 px-2">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="truncate block text-xs">
                                          {setor.ORGAO || '-'}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{setor.ORGAO || '-'}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>
                                <TableCell className="w-[180px] py-2 px-2">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="truncate block text-xs">
                                          {endereco || '-'}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{endereco || '-'}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>
                                <TableCell className="w-[120px] py-2 px-2">
                                  <span className="text-xs">{setor.TELEFONE || '-'}</span>
                                </TableCell>
                                <TableCell className="w-[180px] py-2 px-2">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="truncate block text-xs">
                                          {setor.EMAIL || '-'}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{setor.EMAIL || '-'}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>
                                <TableCell className="w-[80px] py-2 px-2">
                                  <Badge variant={setor.ATIVO ? "default" : "secondary"} size="sm">
                                    <span className="text-xs">{setor.ATIVO ? 'Ativo' : 'Inativo'}</span>
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right w-[100px] py-2 px-2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Abrir menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => handleViewSetor(setor)}
                                      >
                                        <Eye className="mr-2 h-4 w-4" />
                                        Visualizar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleEditSetor(setor)}
                                      >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteSetor(setor.ID)}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Excluir
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                      {loadingSetores ? (
                        <div className="col-span-full flex justify-center items-center h-24">
                          <RefreshCw className="w-6 h-6 animate-spin" />
                        </div>
                      ) : !Array.isArray(paginatedSetores) || paginatedSetores.length === 0 ? (
                        <div className="col-span-full text-center py-8">
                          <p className="text-muted-foreground">
                            {setoresData.length === 0
                              ? "Nenhum setor encontrado."
                              : "Nenhum setor corresponde aos filtros aplicados."
                            }
                          </p>
                        </div>
                      ) : (
                        paginatedSetores.map((setor) => {
                          const endereco = `${setor.LOGRADOURO || ''} ${setor.NUMERO || ''} ${setor.COMPLEMENTO || ''} - ${setor.BAIRRO || ''}`.trim();
                          return (
                            <ExpandableCard
                              key={setor.ID}
                              className="hover:shadow-md transition-shadow"
                              header={
                                <div className="min-w-0">
                                  <h3 className="font-semibold text-base truncate" title={setor.NOME_SETOR || setor.SETOR}>
                                    {setor.NOME_SETOR || setor.SETOR || 'Nome não informado'}
                                  </h3>
                                  <p className="text-sm text-muted-foreground truncate" title={setor.CODIGO_SETOR || setor.CODIGO}>
                                    {setor.CODIGO_SETOR || setor.CODIGO || 'Código não informado'}
                                  </p>
                                </div>
                              }
                              actions={
                                <div className="flex items-center gap-2">
                                  <Badge variant={setor.ATIVO ? "default" : "secondary"} className="text-xs shrink-0">
                                    {setor.ATIVO ? 'Ativo' : 'Inativo'}
                                  </Badge>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <span className="sr-only">Abrir menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleViewSetor(setor)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Visualizar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleEditSetor(setor)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDeleteSetor(setor.ID)} className="text-red-600">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Excluir
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              }
                            >
                              <Separator />
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="space-y-2">
                                  <div>
                                    <span className="text-muted-foreground block">Órgão:</span>
                                    <span className="font-medium">{setor.ORGAO || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground block">Telefone:</span>
                                    <span className="font-medium">{setor.TELEFONE || 'N/A'}</span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <span className="text-muted-foreground block">Endereço:</span>
                                    <span className="font-medium text-xs leading-tight" title={endereco || 'N/A'}>
                                      {endereco && endereco !== ' - ' ? endereco : 'N/A'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground block">Email:</span>
                                    <span className="font-medium truncate block" title={setor.EMAIL || 'N/A'}>
                                      {setor.EMAIL || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </ExpandableCard>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Modal do Mapa Geral de Setores */}
            <MapModal
              isOpen={showMapaSetoresModal}
              onClose={() => setShowMapaSetoresModal(false)}
              title="Mapa Geral dos Setores"
              size="large"
            >
              <MapaGeralSetores
                setores={setoresData}
                isVisible={true}
                refreshTrigger={refreshTrigger}
              />
            </MapModal>

            {/* Controles de Paginação para Setores */}
            {totalPagesSetores > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    Mostrando {startIndexSetores + 1} a {Math.min(endIndexSetores, filteredAndSortedSetores.length)} de {filteredAndSortedSetores.length} setores
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPageSetores(prev => Math.max(prev - 1, 1))}
                    disabled={currentPageSetores === 1}
                  >
                    Anterior
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPagesSetores }, (_, i) => i + 1)
                      .filter(page => {
                        const distance = Math.abs(page - currentPageSetores);
                        return distance === 0 || distance === 1 || page === 1 || page === totalPagesSetores;
                      })
                      .map((page, index, array) => {
                        const prevPage = array[index - 1];
                        const showEllipsis = prevPage && page - prevPage > 1;

                        return (
                          <div key={page} className="flex items-center gap-1">
                            {showEllipsis && <span className="text-muted-foreground">...</span>}
                            <Button
                              variant={currentPageSetores === page ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                              onClick={() => setCurrentPageSetores(page)}
                            >
                              {page}
                            </Button>
                          </div>
                        );
                      })
                    }
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPageSetores(prev => Math.min(prev + 1, totalPagesSetores))}
                    disabled={currentPageSetores === totalPagesSetores}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ---------------- APIs ---------------- */}
          <TabsContent value="apis" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5" /> Configurações de APIs
                    </CardTitle>
                    <CardDescription>
                      Configure as chaves de API para integração com serviços externos
                    </CardDescription>
                  </div>

                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {/* Google Maps API */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-600" />
                      <h3 className="font-semibold text-lg">Google Maps API</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Chave de API necessária para funcionalidades de mapa, geocodificação e rotas
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="googleMapsApiKey">API Key do Google Maps</Label>
                      <Input
                        id="googleMapsApiKey"
                        type="password"
                        value={configApis.googleMapsApiKey}
                        onChange={(e) => setConfigApis(prev => ({ ...prev, googleMapsApiKey: e.target.value }))}
                        placeholder="Digite sua chave de API do Google Maps"
                        className="font-mono"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="googleMapsEnabled"
                        checked={configApis.googleMapsAtivo}
                        onCheckedChange={(checked) => setConfigApis(prev => ({ ...prev, googleMapsAtivo: checked }))}
                      />
                      <Label htmlFor="googleMapsEnabled">Habilitar Google Maps</Label>
                    </div>
                  </div>

                  {/* OpenRouteService API */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-purple-600" />
                      <h3 className="font-semibold text-lg">OpenRouteService API</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Chave de API utilizada para cálculo de rotas e matrizes de distância
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="openRouteServiceApiKey">API Key do OpenRouteService</Label>
                      <Input
                        id="openRouteServiceApiKey"
                        type="password"
                        value={configApis.openRouteServiceApiKey}
                        onChange={(e) => setConfigApis(prev => ({ ...prev, openRouteServiceApiKey: e.target.value }))}
                        placeholder="Digite sua chave de API do OpenRouteService"
                        className="font-mono"
                      />
                    </div>
                  </div>

                  {/* API de Busca de CEP */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-green-600" />
                      <h3 className="font-semibold text-lg">API de Busca de CEP</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Configure o serviço de busca de CEP para preenchimento automático de endereços
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="cepApiUrl">URL da API</Label>
                      <Input
                        id="cepApiUrl"
                        value={configApis.cepApiUrl}
                        onChange={(e) => setConfigApis(prev => ({ ...prev, cepApiUrl: e.target.value }))}
                        placeholder="URL base da API de CEP"
                        className="font-mono"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="cepApiEnabled"
                        checked={configApis.cepApiAtivo}
                        onCheckedChange={(checked) => setConfigApis(prev => ({ ...prev, cepApiAtivo: checked }))}
                      />
                      <Label htmlFor="cepApiEnabled">Habilitar busca de CEP</Label>
                    </div>
                  </div>

                  {/* Configurações Gerais de API */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-orange-600" />
                      <h3 className="font-semibold text-lg">Configurações Gerais</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Configure parâmetros gerais para todas as APIs
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="timeoutApi">Timeout das APIs (segundos)</Label>
                      <Input
                        id="timeoutApi"
                        type="number"
                        value={configApis.timeoutApi}
                        onChange={(e) => setConfigApis(prev => ({ ...prev, timeoutApi: e.target.value }))}
                        placeholder="30"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={salvarConfigApis}
                    disabled={savingConfigs}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {savingConfigs ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs CRUD Usuário */}
        <Dialog open={showCreateModal} onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) {
            setFormData(prev => ({ ...prev, currentStep: 1 }));
          }
        }}>
          <DialogContent className="sm:max-w-[1200px] max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Novo Usuário</DialogTitle>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-muted-foreground">Progresso do cadastro</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((formData.currentStep || 1) / 6) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                {[
                  { id: 1, title: 'Acesso', icon: Key },
                  { id: 2, title: 'Pessoal e Contatos', icon: Users },
                  { id: 3, title: 'Endereço', icon: MapPin },
                  { id: 4, title: 'Lotação', icon: Building2 },
                  { id: 5, title: 'Funcionais', icon: FileText },
                  { id: 6, title: 'Revisão', icon: Eye }
                ].map((step, index) => {
                  const isActive = (formData.currentStep || 1) === step.id;
                  const isCompleted = (formData.currentStep || 1) > step.id;
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className="flex items-center">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded ${isActive ? 'bg-blue-50' : ''}`}>
                        <div className={`w-7 h-7 rounded-full border flex items-center justify-center ${isActive ? 'border-blue-600 bg-white text-blue-600' : isCompleted ? 'border-green-600 bg-green-50 text-green-600' : 'border-gray-300 bg-white text-gray-500'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`text-sm ${isActive ? 'text-blue-700 font-medium' : 'text-gray-600'}`}>{step.title}</span>
                      </div>
                      {index < 5 && (
                        <div className={`w-12 h-0.5 mx-2 ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    const currentStep = formData.currentStep || 1;
                    if (currentStep > 1) {
                      setFormData(prev => ({ ...prev, currentStep: currentStep - 1 }));
                    }
                  }}
                  disabled={(formData.currentStep || 1) === 1}
                  className="gap-2 h-9"
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </Button>
                <div className="text-xs text-muted-foreground">Etapa {formData.currentStep || 1} de 6</div>
                <div className="flex gap-3">
                  {(formData.currentStep || 1) < 6 && (
                    <Button
                      onClick={() => {
                        const currentStep = formData.currentStep || 1;
                        if (currentStep < 6) {
                          setFormData(prev => ({ ...prev, currentStep: currentStep + 1 }));
                        }
                      }}
                      className="btn-govto-primary gap-2 h-9"
                    >
                      {(formData.currentStep || 1) === 5 ? 'Finalizar' : 'Próximo'}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </DialogHeader>
            <div className="py-3 flex-1 overflow-y-auto">
              <NovoUsuarioWizard
                formData={formData}
                setFormData={setFormData}
                setores={setoresData}
                onCancel={() => setShowCreateModal(false)}
                onCreateUser={handleCreateUser}
              />
            </div>
            {/* Rodapé (mantido conforme pedido) */}
            <DialogFooter>
              {/* Status do Usuário movido para o rodapé - travado como Ativo */}
              <div className="flex items-center space-x-2 mr-auto">
                <Label htmlFor="ativo-switch" className="text-sm font-medium">
                  Status:
                </Label>
                <span className="text-sm text-green-600 font-medium">
                  Ativo
                </span>
                <Switch
                  id="ativo-switch"
                  checked={true}
                  disabled={true}
                  className="opacity-50"
                />
              </div>

              <Button variant="outline" onClick={resetForm}>
                Limpar Campos
              </Button>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button className="btn-govto-primary" onClick={handleCreateUser}>
                Criar Usuário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Edição/Visualização de Usuário */}
        <Dialog open={showEditModal} onOpenChange={(open) => {
          setShowEditModal(open);
          if (!open) {
            setIsViewModeUser(false);
            setFormData(prev => ({ ...prev, currentStep: 1 }));
          }
        }}>
          <DialogContent className="sm:max-w-[1200px] max-h-[90vh] flex flex-col">
            <DialogHeader className="space-y-4">
              <DialogTitle>{isViewModeUser ? 'Visualizar Usuário' : 'Editar Usuário'}</DialogTitle>
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-muted-foreground">Progresso do cadastro</div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((formData.currentStep || 1) / 6) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  {[
                    { id: 1, title: 'Acesso', icon: Key },
                    { id: 2, title: 'Pessoal e Contatos', icon: Users },
                    { id: 3, title: 'Endereço', icon: MapPin },
                    { id: 4, title: 'Lotação', icon: Building2 },
                    { id: 5, title: 'Funcionais', icon: FileText },
                    { id: 6, title: 'Revisão', icon: Eye }
                  ].map((step, index) => {
                    const isActive = (formData.currentStep || 1) === step.id;
                    const isCompleted = (formData.currentStep || 1) > step.id;
                    const Icon = step.icon;
                    return (
                      <div key={step.id} className="flex items-center">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded ${isActive ? 'bg-blue-50' : ''}`}>
                          <div className={`w-7 h-7 rounded-full border flex items-center justify-center ${isActive ? 'border-blue-600 bg-white text-blue-600' : isCompleted ? 'border-green-600 bg-green-50 text-green-600' : 'border-gray-300 bg-white text-gray-500'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`text-sm ${isActive ? 'text-blue-700 font-medium' : 'text-gray-600'}`}>{step.title}</span>
                        </div>
                        {index < 5 && (
                          <div className={`w-12 h-0.5 mx-2 ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const currentStep = formData.currentStep || 1;
                      if (currentStep > 1) {
                        setFormData(prev => ({ ...prev, currentStep: currentStep - 1 }));
                      }
                    }}
                    disabled={(formData.currentStep || 1) === 1}
                    className="gap-2 h-9"
                  >
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </Button>
                  <div className="text-xs text-muted-foreground">Etapa {formData.currentStep || 1} de 6</div>
                  <div className="flex gap-3">
                    {(formData.currentStep || 1) < 6 && (
                      <Button
                        onClick={() => {
                          const currentStep = formData.currentStep || 1;
                          if (currentStep < 6) {
                            setFormData(prev => ({ ...prev, currentStep: currentStep + 1 }));
                          }
                        }}
                        className="btn-govto-primary gap-2 h-9"
                      >
                        {(formData.currentStep || 1) === 5 ? 'Finalizar' : 'Próximo'}
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </>
            </DialogHeader>
            <div className="py-3 flex-1 overflow-y-auto">
              <div className={isViewModeUser ? 'pointer-events-none' : ''}>
                <NovoUsuarioWizard
                  formData={formData}
                  setFormData={setFormData}
                  onCancel={() => setShowEditModal(false)}
                  onCreateUser={handleCreateUser}
                  onUpdateUser={handleUpdateUser}
                  isEditMode={true}
                  selectedUser={selectedUser}
                  setores={setoresData}
                />
              </div>
            </div>
            {/* Rodapé igual ao da tela de novo usuário */}
            <DialogFooter>
              {isViewModeUser ? (
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Fechar
                </Button>
              ) : (
                <>
                  <div className="flex items-center space-x-2 mr-auto">
                    <Label htmlFor="ativo-switch-edit" className="text-sm font-medium">
                      Status:
                    </Label>
                    <span className={`text-sm font-medium ${formData.ativo ? 'text-green-600' : 'text-red-600'}`}>
                      {formData.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                    <Switch
                      id="ativo-switch-edit"
                      checked={formData.ativo || false}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
                    />
                  </div>
                  <Button variant="outline" onClick={resetForm}>
                    Limpar Campos
                  </Button>
                  <Button variant="outline" onClick={() => setShowEditModal(false)}>
                    Cancelar
                  </Button>
                  <Button className="btn-govto-primary" onClick={handleUpdateUser}>
                    Atualizar Usuário
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialogs CRUD Setores */}
        <Dialog open={showCreateSetorModal} onOpenChange={setShowCreateSetorModal}>
          <DialogContent className="sm:max-w-[1200px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Setor</DialogTitle>
            </DialogHeader>
            <div className="flex gap-6 py-4">
              {/* Formulário à esquerda */}
              <div className="flex-1 grid gap-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="setor-codigo">Código do Setor *</Label>
                    <Input
                      id="setor-codigo"
                      name="codigoSetor"
                      value={setorFormData.codigoSetor || ''}
                      onChange={handleSetorChange}
                      required
                      placeholder="Ex: 013.SUTIF"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="setor-nome">Nome do Setor *</Label>
                    <Input
                      id="setor-nome"
                      name="nomeSetor"
                      value={setorFormData.nomeSetor || ''}
                      onChange={handleSetorChange}
                      required
                      placeholder="Ex: Superintendência de Tecnol e Inov Fazendária"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="setor-orgao">Órgão *</Label>
                  <Input
                    id="setor-orgao"
                    name="orgao"
                    value={setorFormData.orgao || ''}
                    onChange={handleSetorChange}
                    required
                    placeholder="Ex: Secretaria da Fazenda"
                  />
                </div>

                {/* Campo Adicional removido conforme solicitação */}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="setor-telefone">Telefone</Label>
                    <Input
                      id="setor-telefone"
                      name="telefone"
                      value={setorFormData.telefone}
                      onChange={handleSetorChange}
                      placeholder="(00) 0000-0000"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="setor-email">Email</Label>
                    <Input
                      id="setor-email"
                      name="email"
                      type="email"
                      value={setorFormData.email}
                      onChange={handleSetorChange}
                      placeholder="setor@sefaz.to.gov.br"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="setor-cep">CEP</Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="setor-cep"
                        name="cep"
                        value={setorFormData.cep}
                        onChange={handleSetorChange}
                        placeholder="00000-000"
                        maxLength={9}
                      />
                      {cepLoading && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>
                    <Button type="button" variant="outline" onClick={() => setManualAddressEdit(prev => !prev)}>
                      {manualAddressEdit ? 'Editar via CEP' : 'Editar endereço'}
                    </Button>
                  </div>
                  {cepError && (
                    <p className="text-sm text-red-500">{cepError}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="setor-logradouro">Logradouro</Label>
                    <Input
                      id="setor-logradouro"
                      name="logradouro"
                      value={setorFormData.logradouro}
                      onChange={handleSetorChange}
                      disabled={!manualAddressEdit && !!setorFormData.logradouro && setorFormData.cep}
                      className={!manualAddressEdit && !!setorFormData.logradouro && setorFormData.cep ? "bg-gray-100" : ""}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="setor-numero">Número</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="setor-numero"
                        name="numero"
                        value={setorFormData.semNumero ? "sem número" : setorFormData.numero}
                        onChange={handleSetorChange}
                        disabled={setorFormData.semNumero}
                        className={setorFormData.semNumero ? "bg-gray-100" : ""}
                        placeholder="123"
                      />
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="sem-numero"
                          checked={setorFormData.semNumero || false}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSetorFormData(prev => ({
                              ...prev,
                              semNumero: checked,
                              numero: checked ? "sem número" : ""
                            }));
                          }}
                          className="rounded"
                        />
                        <Label htmlFor="sem-numero" className="text-sm">S/N</Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="setor-complemento">Complemento</Label>
                    <Input
                      id="setor-complemento"
                      name="complemento"
                      value={setorFormData.complemento}
                      onChange={handleSetorChange}
                      placeholder="Sala, Andar, etc."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="setor-bairro">Bairro</Label>
                    <Input
                      id="setor-bairro"
                      name="bairro"
                      value={setorFormData.bairro}
                      onChange={handleSetorChange}
                      disabled={!manualAddressEdit && !!setorFormData.bairro && setorFormData.cep}
                      className={!manualAddressEdit && !!setorFormData.bairro && setorFormData.cep ? "bg-gray-100" : ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="setor-cidade">Cidade</Label>
                    <Input
                      id="setor-cidade"
                      name="cidade"
                      value={setorFormData.cidade}
                      onChange={handleSetorChange}
                      disabled={!!setorFormData.cidade && setorFormData.cep}
                      className={!!setorFormData.cidade && setorFormData.cep ? "bg-gray-100" : ""}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="setor-uf">Estado</Label>
                    <Input
                      id="setor-uf"
                      name="estado"
                      value={setorFormData.estado}
                      onChange={handleSetorChange}
                      maxLength={2}
                      placeholder="Ex: SC"
                      disabled={!!setorFormData.estado && setorFormData.cep}
                      className={!!setorFormData.estado && setorFormData.cep ? "bg-gray-100" : ""}
                    />
                  </div>
                </div>

              </div>

              {/* Mapa à direita */}
              <MapaSetor
                cep={setorFormData.cep}
                latitude={setorFormData.latitude}
                longitude={setorFormData.longitude}
                className="w-96 h-96"
                allowSelection={true}
                onCoordinatesChange={(coordinates) => {
                  setSetorFormData(prev => ({
                    ...prev,
                    latitude: coordinates.lat,
                    longitude: coordinates.lng
                  }));
                }}
                onFallbackStateChange={(isFallback) => {
                  setIsFallbackCoordinatesModal(isFallback);
                }}
              />
            </div>
            <DialogFooter>
              {/* Status do Setor movido para o rodapé - travado como Ativo */}
              <div className="flex items-center space-x-2 mr-auto">
                <Label htmlFor="ativo-switch-setor" className="text-sm font-medium">
                  Status:
                </Label>
                <span className="text-sm text-green-600 font-medium">
                  Ativo
                </span>
                <Switch
                  id="ativo-switch-setor"
                  checked={true}
                  disabled={true}
                  className="opacity-50"
                />
              </div>

              <Button variant="outline" onClick={resetSetorForm}>
                Limpar Campos
              </Button>
              <Button variant="outline" onClick={() => setShowCreateSetorModal(false)}>Cancelar</Button>
              <Button className="btn-govto-primary" onClick={handleCreateSetor}>Criar Setor</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditSetorModal} onOpenChange={(open) => {
          setShowEditSetorModal(open);
          if (!open) setIsViewModeSetor(false);
        }}>
          <DialogContent className="sm:max-w-[1200px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isViewModeSetor ? 'Visualizar Setor' : 'Editar Setor'}</DialogTitle>
            </DialogHeader>
            <div className={`flex gap-6 py-4 ${isViewModeSetor ? 'pointer-events-none' : ''}`}>
              {/* Formulário à esquerda */}
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="edit-setor-codigo">Código do Setor *</Label>
                    <Input
                      id="edit-setor-codigo"
                      name="codigoSetor"
                      value={setorFormData.codigoSetor}
                      onChange={handleSetorChange}
                      placeholder="Ex: SETOR001"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-setor-orgao">Órgão *</Label>
                    <Input
                      id="edit-setor-orgao"
                      name="orgao"
                      value={setorFormData.orgao}
                      onChange={handleSetorChange}
                      placeholder="Ex: Governo do Estado do Tocantins"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-setor-nome">Nome do Setor *</Label>
                  <Input
                    id="edit-setor-nome"
                    name="nomeSetor"
                    value={setorFormData.nomeSetor}
                    onChange={handleSetorChange}
                    placeholder="Ex: Secretaria de Administração"
                    required
                  />
                </div>

                {/* Campo Adicional removido conforme solicitação */}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="edit-setor-telefone">Telefone</Label>
                    <Input
                      id="edit-setor-telefone"
                      name="telefone"
                      value={setorFormData.telefone}
                      onChange={handleSetorChange}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-setor-email">Email</Label>
                    <Input
                      id="edit-setor-email"
                      name="email"
                      type="email"
                      value={setorFormData.email}
                      onChange={handleSetorChange}
                      placeholder="setor@exemplo.com"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-setor-cep">CEP</Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="edit-setor-cep"
                        name="cep"
                        value={setorFormData.cep}
                        onChange={handleSetorChange}
                        placeholder="00000-000"
                        maxLength={9}
                      />
                      {cepLoading && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                          <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>
                    <Button type="button" variant="outline" onClick={() => setManualAddressEdit(prev => !prev)}>
                      {manualAddressEdit ? 'Editar via CEP' : 'Editar endereço'}
                    </Button>
                  </div>
                  {cepError && (
                    <p className="text-sm text-red-500">{cepError}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="edit-setor-logradouro">Logradouro</Label>
                    <Input
                      id="edit-setor-logradouro"
                      name="logradouro"
                      value={setorFormData.logradouro}
                      onChange={handleSetorChange}
                      disabled={!manualAddressEdit && !!setorFormData.logradouro && cepLoading === false}
                      className={!manualAddressEdit && !!setorFormData.logradouro && cepLoading === false ? "bg-gray-100" : ""}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-setor-numero">Número</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="edit-setor-numero"
                        name="numero"
                        value={setorFormData.semNumero ? "sem número" : setorFormData.numero}
                        onChange={handleSetorChange}
                        disabled={setorFormData.semNumero}
                        className={setorFormData.semNumero ? "bg-gray-100" : ""}
                      />
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="edit-sem-numero"
                          checked={setorFormData.semNumero}
                          onChange={(e) => setSetorFormData(prev => ({
                            ...prev,
                            semNumero: e.target.checked,
                            numero: e.target.checked ? "sem número" : ""
                          }))}
                          className="rounded"
                        />
                        <Label htmlFor="edit-sem-numero" className="text-sm">S/N</Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="edit-setor-complemento">Complemento</Label>
                    <Input
                      id="edit-setor-complemento"
                      name="complemento"
                      value={setorFormData.complemento}
                      onChange={handleSetorChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-setor-bairro">Bairro</Label>
                    <Input
                      id="edit-setor-bairro"
                      name="bairro"
                      value={setorFormData.bairro}
                      onChange={handleSetorChange}
                      disabled={!manualAddressEdit && !!setorFormData.bairro && cepLoading === false}
                      className={!manualAddressEdit && !!setorFormData.bairro && cepLoading === false ? "bg-gray-100" : ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="edit-setor-cidade">Cidade</Label>
                    <Input
                      id="edit-setor-cidade"
                      name="cidade"
                      value={setorFormData.cidade}
                      onChange={handleSetorChange}
                      disabled={!!setorFormData.cidade && cepLoading === false}
                      className={!!setorFormData.cidade && cepLoading === false ? "bg-gray-100" : ""}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-setor-uf">Estado</Label>
                    <Input
                      id="edit-setor-uf"
                      name="estado"
                      value={setorFormData.estado}
                      onChange={handleSetorChange}
                      maxLength={2}
                      placeholder="Ex: SC"
                      disabled={!!setorFormData.estado && cepLoading === false}
                      className={!!setorFormData.estado && cepLoading === false ? "bg-gray-100" : ""}
                    />
                  </div>
                </div>

              </div>

              {/* Mapa à direita */}
              <MapaSetor
                cep={setorFormData.cep}
                latitude={setorFormData.latitude}
                longitude={setorFormData.longitude}
                className="w-96 h-96"
                allowSelection={true}
                onCoordinatesChange={(coordinates) => {
                  setSetorFormData(prev => ({
                    ...prev,
                    latitude: coordinates.lat,
                    longitude: coordinates.lng
                  }));
                }}
                onFallbackStateChange={(isFallback) => {
                  setIsFallbackCoordinatesModal(isFallback);
                }}
              />
            </div>
            <DialogFooter>
              {isViewModeSetor ? (
                <Button variant="outline" onClick={() => setShowEditSetorModal(false)}>Fechar</Button>
              ) : (
                <>
                  <div className="flex items-center space-x-2 mr-auto">
                    <Label htmlFor="ativo-switch-edit-setor" className="text-sm font-medium">
                      Status:
                    </Label>
                    <span className={`text-sm font-medium ${setorFormData.ativo ? 'text-green-600' : 'text-red-600'}`}>
                      {setorFormData.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                    <Switch
                      id="ativo-switch-edit-setor"
                      checked={setorFormData.ativo || false}
                      onCheckedChange={(checked) => setSetorFormData(prev => ({ ...prev, ativo: checked }))}
                    />
                  </div>
                  <Button variant="outline" onClick={resetSetorForm}>
                    Limpar Campos
                  </Button>
                  <Button variant="outline" onClick={() => setShowEditSetorModal(false)}>Cancelar</Button>
                  <Button className="btn-govto-primary" onClick={handleUpdateSetor}>Atualizar Setor</Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Teste LDAP */}
        <LdapTestModal
          isOpen={showLdapTestModal}
          onClose={() => setShowLdapTestModal(false)}
        />

        {/* Modal de Notificação Global */}
        <NotificationModal
          isOpen={isOpen}
          onClose={hideNotification}
          title={notification?.title || ''}
          description={notification?.description || ''}
          variant={notification?.variant}
        />
      </div>
    </Layout>
  );
};

export default Configuracoes;
