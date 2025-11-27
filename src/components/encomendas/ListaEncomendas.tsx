import { useState, useEffect, Fragment } from "react";
import { Package, MapPin, Calendar, User, Eye, Edit, Trash2, QrCode, Building2, Hash, Clock, Weight, Info, AlertCircle, Printer, MoreHorizontal, Filter, ChevronUp, ChevronDown, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api, handleApiError } from "@/lib/api";
import { obterEnderecoSetorSync, precarregarEnderecosParaNomes } from '@/services/setores.service';
import { useNotification } from '@/hooks/use-notification';
import NotificationModal from '@/components/ui/notification-modal';
import { ConfirmReceiptModal } from '@/components/encomendas/ConfirmReceiptModal';
import type { Notification } from '@/hooks/useNotifications';
import type { Encomenda } from "@/types/encomenda.types";
import { mapearStatus } from "@/types/encomenda.types";
import MapaSetores from "./MapaSetores";
import { ModalReimpressaoEtiqueta } from './EtiquetaEncomenda';
import { useAuth } from '@/contexts/AuthContext';
import {
  getStatusColor,
  getStatusLabel,
  getTipoColor,
  getTipoLabel,
  getPrioridadeColor,
  getPrioridadeLabel,
  getEntregaColor,
  getEntregaLabel
} from "@/utils/badge-colors";

// Removido cache local e funções duplicadas; usando serviço compartilhado

interface ListaEncomendaProps {
  searchTerm: string;
  statusFilter: string;
  viewMode: 'grid' | 'list';
  refreshTrigger?: number; // Prop para forçar atualização
  onTrack?: (codigoRastreamento: string) => void; // Callback para abrir modal de rastreamento
}


const ListaEncomendas = ({ searchTerm, statusFilter, viewMode, refreshTrigger, onTrack }: ListaEncomendaProps) => {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [selectedEncomenda, setSelectedEncomenda] = useState<Encomenda | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [encomendaToDelete, setEncomendaToDelete] = useState<Encomenda | null>(null);
  const [isReimpressaoModalOpen, setIsReimpressaoModalOpen] = useState(false);
  const [encomendaParaReimpressao, setEncomendaParaReimpressao] = useState<Encomenda | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  // Estado para controlar linhas expandidas
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Definir itens por página - 10 itens para ambos os modos
  const itemsPerPage = 10;
  const [enderecosTick, setEnderecosTick] = useState(0);

  // Estados para ordenação das colunas
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Controla se o mapa está expandido para ajustar o overflow do modal
  const [isMapaExpanded, setIsMapaExpanded] = useState(false);

  const { notification, isOpen, showError, showSuccess, showInfo, showWarning, hideNotification } = useNotification();
  const { user } = useAuth();
  const [hubSetorId, setHubSetorId] = useState<number | null>(null);

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

  // Alternar expansão de uma linha
  const toggleRow = (id?: string | number) => {
    if (!id) return;
    const key = id.toString();
    setExpandedRows(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isOwnerOf = (encomenda: Encomenda) => {
    const userMatricula = (user?.matricula || '').toString();
    const userVinculo = (user?.vinculo_funcional || '').toString();
    const remetenteMatricula = (encomenda.remetenteMatricula || '').toString();
    const remetenteVinculo = (encomenda.remetenteVinculo || '').toString();
    return (userMatricula && remetenteMatricula && userMatricula === remetenteMatricula) ||
      (userVinculo && remetenteVinculo && userVinculo === remetenteVinculo);
  };

  const canReceive = (encomenda: Encomenda) => {
    const userMatricula = (user?.matricula || '').toString();
    const userVinculo = (user?.vinculo_funcional || '').toString();
    const destMatricula = (encomenda.destinatarioMatricula || (encomenda as any).destinatario_matricula || '').toString();
    const destVinculo = (encomenda.destinatarioVinculo || (encomenda as any).destinatario_vinculo || '').toString();
    const userSetorId = getUserSetorId();
    const setorDestinoId = (encomenda as any).setorDestinoId as number | undefined;
    const setorDestinoNome = normalizeSetorName(encomenda.setorDestino || '');
    const userSetorNome = normalizeSetorName(getUserSetorNome());
    const setorMatch = (userSetorId != null && setorDestinoId != null && userSetorId === setorDestinoId) ||
      (!!userSetorNome && !!setorDestinoNome && (userSetorNome === setorDestinoNome || setorDestinoNome.includes(userSetorNome)));
    const hasDestIdentity = !!destMatricula || !!destVinculo;
    const userMatch = (userMatricula && destMatricula && userMatricula === destMatricula) ||
      (userVinculo && destVinculo && userVinculo === destVinculo);
    return setorMatch && (userMatch || !hasDestIdentity);
  };

  // Função para ordenar colunas
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Função para renderizar cabeçalho com ordenação
  const renderSortableHeader = (key: string, label: string, className?: string) => {
    const isActive = sortConfig?.key === key;
    const direction = sortConfig?.direction;

    return (
      <TableHead className={`cursor-pointer hover:bg-muted/50 text-xs ${className || ''}`} onClick={() => handleSort(key)}>
        <div className="flex items-center gap-1">
          <span className="text-xs">{label}</span>
          <div className="flex flex-col">
            <ChevronUp className={`w-4 h-4 ${isActive && direction === 'asc' ? 'text-primary' : 'text-muted-foreground'}`} />
            <ChevronDown className={`w-4 h-4 -mt-1 ${isActive && direction === 'desc' ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
        </div>
      </TableHead>
    );
  };

  // Função para formatar matrícula e vínculo funcional (igual à tela de configurações)
  const formatMatriculaVinculo = (usuario: any) => {
    const matricula = usuario.NUMERO_FUNCIONAL || usuario.numero_funcional || usuario.numeroFuncional || usuario.matricula || usuario.MATRICULA;
    const vinculo = usuario.VINCULO_FUNCIONAL || usuario.vinculo_funcional;

    if (matricula && vinculo) {
      return `${matricula}-${vinculo}`;
    } else if (matricula) {
      return matricula.toString();
    } else if (vinculo) {
      return vinculo;
    }
    return '-';
  };

  useEffect(() => {
    loadEncomendas();
  }, [refreshTrigger]);

  const loadEncomendas = async () => {
    try {
      console.log('🚀 Carregando encomendas...');

      // Tentar múltiplas estratégias para pegar TODAS as encomendas
      let response = await api.getEncomendas();

      // Log da resposta inicial
      console.log('📡 Resposta inicial:', response.data);

      // Se temos exatamente 10 itens, pode ser que haja mais páginas
      // Vamos tentar carregar mais dados
      if (response.data.success && response.data.data) {
        const initialData = Array.isArray(response.data.data.data)
          ? response.data.data.data
          : response.data.data;

        console.log(`📊 Dados iniciais: ${initialData.length} encomendas`);

        // Se temos exatamente 10, tentar buscar mais
        if (initialData.length === 10) {
          console.log('🔍 Tentando buscar mais dados...');

          // Tentar diferentes estratégias
          const strategies = [
            { page: 2 },
            { offset: 10 },
            { skip: 10 },
            { start: 10 }
          ];

          for (const params of strategies) {
            try {
              console.log(`🧪 Testando parâmetros:`, params);
              const moreResponse = await api.getEncomendas(params);

              if (moreResponse.data.success && moreResponse.data.data) {
                const moreData = Array.isArray(moreResponse.data.data.data)
                  ? moreResponse.data.data.data
                  : moreResponse.data.data;

                if (moreData.length > 0) {
                  console.log(`✅ Encontrados mais ${moreData.length} itens!`);

                  // Combinar os dados
                  const combinedData = [...initialData, ...moreData];

                  // Atualizar a resposta
                  response = {
                    ...response,
                    data: {
                      ...response.data,
                      data: combinedData
                    }
                  };
                  break; // Parar no primeiro que funcionar
                }
              }
            } catch (error) {
              console.log(`❌ Estratégia ${JSON.stringify(params)} falhou`);
            }
          }
        }
      }

      if (response.data.success && response.data.data) {
        // Usar função de mapeamento importada

        // Verificar se data.data é um array ou se os dados estão diretamente em data.data
        const encomendas = Array.isArray(response.data.data.data) ? response.data.data.data : response.data.data;



        const encomendasMapeadas = encomendas.map((encomenda: any) => {
          const setorOrigemId = (() => {
            const v = encomenda.setorOrigemId ?? encomenda.SETOR_ORIGEM_ID ?? encomenda.setor_origem_id;
            const n = Number(v);
            return Number.isNaN(n) ? undefined : n;
          })();
          const setorDestinoId = (() => {
            const v = encomenda.setorDestinoId ?? encomenda.SETOR_DESTINO_ID ?? encomenda.setor_destino_id;
            const n = Number(v);
            return Number.isNaN(n) ? undefined : n;
          })();
          return {
            id: encomenda.id?.toString() || '',
            codigo: encomenda.numeroEncomenda || '',
            codigoRastreamento: encomenda.numeroEncomenda || '',
            tipo: ((encomenda as any).tipo ?? (encomenda as any).TIPO) ?? (((encomenda as any).numeroMalote ?? (encomenda as any).NUMERO_MALOTE ?? (encomenda as any).maloteId ?? (encomenda as any).MALOTE_ID) ? 'Malote' : 'Encomenda'),
            remetente: encomenda.remetente,
            destinatario: encomenda.destinatario,
            setorOrigem: encomenda.setorOrigem ?? encomenda.SETOR_ORIGEM ?? encomenda.setor_origem ?? '',
            setorDestino: encomenda.setorDestino ?? encomenda.SETOR_DESTINO ?? encomenda.setor_destino ?? '',
            setorOrigemId,
            setorDestinoId,
            status: mapearStatus(encomenda.status || 'pendente'),
            prioridade: encomenda.urgente ? 'urgente' : 'normal',
            dataPostagem: encomenda.dataCriacao ? new Date(encomenda.dataCriacao).toISOString().split('T')[0] : '',
            dataEnvio: encomenda.dataCriacao ? new Date(encomenda.dataCriacao).toISOString().split('T')[0] : '',
            dataEntrega: encomenda.dataEntrega ? new Date(encomenda.dataEntrega).toISOString().split('T')[0] : undefined,
            valorDeclarado: 0,
            peso: 0,
            descricao: encomenda.descricao || '',
            observacoes: encomenda.observacoes || '',
            // Identificadores
            numeroMalote: encomenda.numeroMalote ?? encomenda.NUMERO_MALOTE ?? '',
            numeroLacre: encomenda.numeroLacre ?? encomenda.NUMERO_LACRE ?? '',
            numeroAR: encomenda.numeroAR ?? encomenda.NUMERO_AR ?? '',
            codigoLacreMalote: encomenda.numeroLacre ?? encomenda.NUMERO_LACRE ?? '',
            // Dados de matrícula e vínculo do remetente (usar camelCase no frontend)
            remetenteMatricula: encomenda.remetenteMatricula ?? encomenda.remetente_matricula ?? encomenda.REMETENTE_MATRICULA ?? '',
            remetenteVinculo: encomenda.remetenteVinculo ?? encomenda.remetente_vinculo ?? encomenda.REMETENTE_VINCULO ?? '',
            // Manter aliases com underscore para compatibilidade caso sejam usados em outros componentes
            remetente_matricula: encomenda.remetenteMatricula ?? encomenda.remetente_matricula ?? encomenda.REMETENTE_MATRICULA ?? '',
            remetente_vinculo: encomenda.remetenteVinculo ?? encomenda.remetente_vinculo ?? encomenda.REMETENTE_VINCULO ?? '',
            // Dados de matrícula e vínculo do destinatário
            destinatarioMatricula: encomenda.destinatarioMatricula ?? encomenda.destinatario_matricula ?? encomenda.DESTINATARIO_MATRICULA ?? '',
            destinatarioVinculo: encomenda.destinatarioVinculo ?? encomenda.destinatario_vinculo ?? encomenda.DESTINATARIO_VINCULO ?? '',
            // Aliases com underscore
            destinatario_matricula: encomenda.destinatarioMatricula ?? encomenda.destinatario_matricula ?? encomenda.DESTINATARIO_MATRICULA ?? '',
            destinatario_vinculo: encomenda.destinatarioVinculo ?? encomenda.destinatario_vinculo ?? encomenda.DESTINATARIO_VINCULO ?? '',
            // Coordenadas dos setores
            setorOrigemCoordenadas: encomenda.setorOrigemCoordenadas,
            setorDestinoCoordenadas: encomenda.setorDestinoCoordenadas
          };
        });

        // Remover possíveis duplicidades vindas do backend (páginas/estratégias diferentes)
        const seen = new Set<string>();
        const encomendasUnicas = encomendasMapeadas.filter((e) => {
          const chaveBase = e.id?.toString() || e.codigo || `${e.numeroAR || ''}-${e.numeroMalote || ''}-${e.numeroLacre || ''}`;
          const chave = String(chaveBase);
          if (!chave) return true; // mantém itens sem chave definível
          if (seen.has(chave)) return false;
          seen.add(chave);
          return true;
        });

        setEncomendas(encomendasUnicas);
      } else {
        setEncomendas([]);
      }
    } catch (error) {
      console.error('Erro ao carregar encomendas:', error);
      showError("Erro", "Erro ao carregar encomendas do servidor");
      setEncomendas([]);
    }
  };

  const handleView = (encomenda: Encomenda) => {
    setSelectedEncomenda(encomenda);
    setIsViewModalOpen(true);
  };

  const handleDelete = (encomenda: Encomenda) => {
    // Regra de ouro: somente Admin pode excluir
    if (!isAdminUser()) {
      showError("Permissão negada", "Apenas usuários com perfil Admin podem excluir.");
      return;
    }
    setEncomendaToDelete(encomenda);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!encomendaToDelete) return;

    try {
      const resp = await api.deleteEncomenda(encomendaToDelete.id);
      if (resp && resp.status >= 200 && resp.status < 300) {
        // Remover do estado local
        setEncomendas((prev) => prev.filter((e) => e.id !== encomendaToDelete.id));
        showSuccess("Excluída", "Encomenda excluída com sucesso");
      } else {
        const msg = (resp?.data?.message || (typeof resp?.data?.error === 'string' ? resp.data.error : resp?.statusText) || 'Erro ao excluir encomenda').toString();
        showError("Erro", msg);
      }
      setIsDeleteModalOpen(false);
      setEncomendaToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir encomenda:', error);
      const msg = handleApiError(error);
      showError("Erro", msg);
    }
  };

  const handleTrack = (codigoRastreamento: string) => {
    if (onTrack) {
      onTrack(codigoRastreamento);
    } else {
      // Fallback para o comportamento anterior
      showInfo("Rastreamento", `Rastreando: ${codigoRastreamento}`);
    }
  };

  const handlePrintLabel = async (encomenda: Encomenda) => {
    try {
      // Buscar dados completos da encomenda
      const response = await api.getEncomendaById(encomenda.id);
      if (response.data.success && response.data.data) {
        const encomendaBackend = response.data.data.data; // Corrigido: dados estão em data.data.data

        // Debug: Verificar dados do QR Code e código de barras do backend
        console.log('Dados do backend para reimpressão:', {
          qrCode: encomendaBackend.qrCode,
          codigoBarras: encomendaBackend.codigoBarras,
          numeroEncomenda: encomendaBackend.numeroEncomenda
        });

        // Dados recebidos do backend com sucesso

        // Mapear dados do backend (IEncomenda) para o formato esperado pelo modal
        // IMPORTANTE: Usar os dados exatos do backend para QR Code e código de barras
        const encomendaCompleta = {
          id: encomendaBackend.id?.toString() || encomenda.id,
          codigo: encomendaBackend.numeroEncomenda || encomenda.codigo || '',
          remetente: encomendaBackend.remetente || '',
          destinatario: encomendaBackend.destinatario || '',
          setorOrigem: encomendaBackend.setorOrigem || '',
          setorDestino: encomendaBackend.setorDestino || '',
          descricao: encomendaBackend.descricao || '',
          observacoes: encomendaBackend.observacoes || '', // Incluir observações do backend
          // Usar os dados do QR Code e código de barras EXATAMENTE como vêm do backend
          qrCode: encomendaBackend.qrCode || '', // Dados completos do QR Code do backend
          qrCodeData: encomendaBackend.qrCode || '', // Alias para compatibilidade com EtiquetaEncomenda
          codigoBarras: encomendaBackend.codigoBarras || encomendaBackend.numeroEncomenda || '', // Código de barras do backend
          codigoLacreMalote: encomendaBackend.codigoLacreMalote || '',
          codigoLacre: encomendaBackend.codigoLacreMalote || '',
          numeroMalote: encomendaBackend.numeroMalote || encomenda.numeroMalote || '',
          dataPostagem: encomendaBackend.dataPostagem || (encomendaBackend.dataCriacao ? new Date(encomendaBackend.dataCriacao).toISOString() : ''),
          prioridade: encomendaBackend.prioridade || (encomendaBackend.urgente ? 'urgente' : 'normal'),
          urgente: encomendaBackend.urgente || false,
          // Adicionar dados de matrícula e vínculo
          remetenteMatricula: encomendaBackend.remetenteMatricula || '',
          remetenteVinculo: encomendaBackend.remetenteVinculo || '',
          destinatarioMatricula: encomendaBackend.destinatarioMatricula || '',
          destinatarioVinculo: encomendaBackend.destinatarioVinculo || ''
        };

        setEncomendaParaReimpressao(encomendaCompleta);
        setIsReimpressaoModalOpen(true);
      } else {
        showError("Erro", "Não foi possível carregar os dados da encomenda");
      }
    } catch (error) {
      console.error('Erro ao buscar dados da encomenda:', error);
      showError("Erro", "Erro ao carregar dados da encomenda");
    }
  };

  const openConfirmModal = (encomenda: Encomenda) => {
    const notif: Notification = {
      id: Number(encomenda.id) || 0,
      numeroEncomenda: encomenda.codigo || '',
      descricao: encomenda.descricao || '',
      status: String((encomenda as any).statusRaw || encomenda.status || ''),
      dataCriacao: encomenda.dataEnvio || encomenda.dataPostagem || '',
      urgente: encomenda.prioridade === 'urgente',
      remetenteNome: encomenda.remetente || '',
      remetenteMatricula: encomenda.remetenteMatricula || '',
      remetenteVinculo: (encomenda as any).remetenteVinculo || '',
      setorOrigemNome: encomenda.setorOrigem || ''
    };
    setSelectedNotification(notif);
    setShowConfirmModal(true);
  };



  // Filtrar e ordenar encomendas
  const filteredAndSortedEncomendas = encomendas
    .filter(encomenda => {
      // Regra de visibilidade: Admin e HUB veem todas; USER vê apenas se setor é remetente ou destinatário
      const adminOrHub = isAdminUser() || isHubUser();
      if (!adminOrHub) {
        const userSetorNome = normalizeSetorName(getUserSetorNome());
        const userSetorId = getUserSetorId();
        const origemVal: any = encomenda.setorOrigem || '';
        const destinoVal: any = encomenda.setorDestino || '';
        const origemNome = normalizeSetorName(origemVal);
        const destinoNome = normalizeSetorName(destinoVal);
        const origemId = (encomenda as any).setorOrigemId;
        const destinoId = (encomenda as any).setorDestinoId;
        const idMatch = userSetorId != null && (
          origemId === userSetorId || destinoId === userSetorId
        );
        const nomeMatch = userSetorNome && (
          userSetorNome === origemNome ||
          userSetorNome === destinoNome ||
          origemNome.includes(userSetorNome) ||
          destinoNome.includes(userSetorNome)
        );
        if (!(idMatch || nomeMatch)) return false;
      }
      const term = searchTerm.toLowerCase();
      const matchesSearch = term === "" ||
        (encomenda.codigo && encomenda.codigo.toLowerCase().includes(term)) ||
        (encomenda.destinatario && encomenda.destinatario.toLowerCase().includes(term)) ||
        (encomenda.descricao && encomenda.descricao.toLowerCase().includes(term)) ||
        (encomenda.numeroAR && encomenda.numeroAR.toLowerCase().includes(term)) ||
        (encomenda.numeroMalote && encomenda.numeroMalote.toLowerCase().includes(term)) ||
        (encomenda.numeroLacre && encomenda.numeroLacre.toLowerCase().includes(term)) ||
        (encomenda.codigoLacreMalote && encomenda.codigoLacreMalote.toLowerCase().includes(term));

      const matchesStatus = statusFilter === "todos" || encomenda.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;

      const { key, direction } = sortConfig;
      let aValue: any = a[key as keyof Encomenda];
      let bValue: any = b[key as keyof Encomenda];

      // Tratamento especial para datas
      if (key === 'dataEnvio' || key === 'dataEntrega') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      }

      // Tratamento especial para coluna 'entregue' (baseado na existência de dataEntrega)
      if (key === 'entregue') {
        aValue = a.dataEntrega ? 1 : 0;
        bValue = b.dataEntrega ? 1 : 0;
      }

      // Tratamento para strings
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

  // Calcular paginação
  const totalPages = Math.ceil(filteredAndSortedEncomendas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEncomendas = filteredAndSortedEncomendas.slice(startIndex, endIndex);





  // Pré-carregar endereços APENAS para setores visíveis na tela
  useEffect(() => {
    const nomesVisiveis = paginatedEncomendas.flatMap((e) => [e.setorOrigem, e.setorDestino]).filter(Boolean);
    if (nomesVisiveis.length) {
      precarregarEnderecosParaNomes(nomesVisiveis).then(() => {
        setEnderecosTick((t) => t + 1); // força re-render ao atualizar cache
      });
    }
  }, [startIndex, endIndex, paginatedEncomendas.length, sortConfig, searchTerm, statusFilter, viewMode]);

  // Reset página quando filtros ou modo de visualização mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, viewMode]);

  // Funções de navegação
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };


  return (
    <div className="space-y-6">
      {/* Paginação Superior */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-foreground-muted">
            Mostrando {startIndex + 1}-{Math.min(endIndex, filteredAndSortedEncomendas.length)} de {filteredAndSortedEncomendas.length} encomendas
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant="outline"
                size="sm"
                onClick={() => goToPage(page)}
                className={currentPage === page ? "bg-primary text-primary-foreground" : ""}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
            >
              Próximo
            </Button>
          </div>
        </div>
      )}

      {/* Tabela de Encomendas */}
      <Card className="card-govto">
        <CardContent className="p-0">
          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    {/* Coluna de toggle para expandir/recolher detalhes */}
                    <TableHead className="w-[36px] text-xs"></TableHead>
                    {renderSortableHeader('codigo', 'Protocolo', 'w-[160px]')}
                    {renderSortableHeader('numeroAR', 'AR', 'w-[110px]')}
                    {renderSortableHeader('numeroMalote', 'Malote', 'w-[110px]')}
                    {renderSortableHeader('numeroLacre', 'Lacre', 'w-[110px]')}
                    
                    {renderSortableHeader('status', 'Status', 'w-[80px]')}
                    {renderSortableHeader('tipo', 'Tipo', 'w-[70px]')}
                    {renderSortableHeader('prioridade', 'Prioridade', 'w-[80px]')}
                    {renderSortableHeader('dataEnvio', 'Data Envio', 'w-[80px]')}
                    {renderSortableHeader('dataEntrega', 'Data Entrega', 'w-[80px]')}
                    {renderSortableHeader('entregue', 'Entregue', 'w-[70px]')}
                    <TableHead className="w-[60px] text-xs">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEncomendas.map((encomenda) => (
                    <Fragment key={encomenda.id?.toString() || encomenda.codigo || `${encomenda.numeroAR || ''}-${encomenda.numeroMalote || ''}-${encomenda.numeroLacre || ''}`}>
                    <TableRow key={`${encomenda.id}-row`} className="hover:bg-muted/30">
                      <TableCell className="w-[36px] py-2 px-1">
                        <Button
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          aria-label={expandedRows[encomenda.id?.toString() || ''] ? 'Recolher detalhes' : 'Expandir detalhes'}
                          onClick={() => toggleRow(encomenda.id)}
                        >
                          {expandedRows[encomenda.id?.toString() || ''] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="w-[160px] max-w-[160px] py-2 px-2">
                        <div className="font-medium text-primary text-nowrap text-xs">
                          {encomenda.codigo}
                        </div>
                        {encomenda.numeroAR && (
                          <div className="mt-0.5 space-y-0.5">
                            {encomenda.numeroAR && (
                              <div className="text-[10px] text-foreground-muted truncate">AR: {encomenda.numeroAR}</div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-2 px-2 w-[110px]">
                        <span className="text-xs font-mono truncate" title={encomenda.numeroAR || '-' }>
                          {encomenda.numeroAR || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 px-2 w-[110px]">
                        <span className="text-xs font-mono truncate" title={encomenda.numeroMalote || '-' }>
                          {encomenda.numeroMalote || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="py-2 px-2 w-[110px]">
                        <span className="text-xs font-mono truncate" title={encomenda.numeroLacre || '-' }>
                          {encomenda.numeroLacre || '-'}
                        </span>
                      </TableCell>
                      
                      
                      <TableCell className="py-2 px-2">
                        <Badge className={getStatusColor(encomenda.status)} size="sm">
                          <span className="text-xs">{getStatusLabel(encomenda.status)}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        <Badge className={getTipoColor(encomenda.tipo)} size="sm">
                          <span className="text-xs">{getTipoLabel(encomenda.tipo)}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        <Badge className={getPrioridadeColor(encomenda.prioridade)} size="sm">
                          <span className="text-xs">{getPrioridadeLabel(encomenda.prioridade)}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 flex-shrink-0 text-foreground-muted" />
                          <span className="text-xs">
                            {new Date(encomenda.dataEnvio).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 flex-shrink-0 text-foreground-muted" />
                          <span className="text-xs">
                            {encomenda.dataEntrega ? new Date(encomenda.dataEntrega).toLocaleDateString('pt-BR') : '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        <Badge className={getEntregaColor(encomenda.dataEntrega)} size="sm">
                          <span className="text-xs">{encomenda.dataEntrega ? 'Sim' : 'Não'}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-6 w-6 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(encomenda)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTrack(encomenda.codigoRastreamento)}>
                              <QrCode className="mr-2 h-4 w-4" />
                              Rastrear
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePrintLabel(encomenda)}>
                              <Printer className="mr-2 h-4 w-4" />
                              Reimprimir Etiqueta
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled={!canReceive(encomenda)} onClick={() => canReceive(encomenda) && openConfirmModal(encomenda)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Receber
                            </DropdownMenuItem>
                            {isAdminUser() && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(encomenda)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    {expandedRows[encomenda.id?.toString() || ''] && (
                      <TableRow key={`${encomenda.id}-details`} className="bg-muted/20">
                        {/* Abrange todas as colunas exceto a de toggle */}
                        <TableCell colSpan={11} className="py-3 px-4">
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
                                    <QrCode className="w-4 h-4 flex-shrink-0" />
                                    Código
                                  </label>
                                  <p className="font-mono text-nowrap text-xs">{encomenda.codigo}</p>
                                </div>
                                <div className="ml-8">
                                  <label className="font-medium text-muted-foreground flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    Status
                                  </label>
                                  <div>
                                    <Badge className={`text-xs ${getStatusColor(encomenda.status)}`}>
                                      {getStatusLabel(encomenda.status)}
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <label className="font-medium text-muted-foreground flex items-center gap-1">
                                    <Package className="w-4 h-4 flex-shrink-0" />
                                    Tipo
                                  </label>
                                  <Badge className={getTipoColor(encomenda.tipo)}>
                                    {getTipoLabel(encomenda.tipo)}
                                  </Badge>
                                </div>
                                <div>
                                  <label className="font-medium text-muted-foreground flex items-center gap-1">
                                    <Info className="w-4 h-4 flex-shrink-0" />
                                    Prioridade
                                  </label>
                                  <div>
                                    <Badge className={`text-xs ${getPrioridadeColor(encomenda.prioridade)}`}>
                                      {getPrioridadeLabel(encomenda.prioridade)}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Identificadores */}
                            {(encomenda.numeroAR || encomenda.numeroMalote || encomenda.numeroLacre) && (
                              <div className="bg-gray-50 p-2 rounded-lg">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                  <Hash className="w-4 h-4" />
                                  Identificadores
                                </h4>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                                  {encomenda.numeroAR && (
                                    <div>
                                      <label className="font-medium text-muted-foreground">AR</label>
                                      <p className="text-xs font-mono truncate">{encomenda.numeroAR}</p>
                                    </div>
                                  )}
                                  {encomenda.numeroMalote && (
                                    <div>
                                      <label className="font-medium text-muted-foreground">Malote</label>
                                      <p className="text-xs font-mono truncate">{encomenda.numeroMalote}</p>
                                    </div>
                                  )}
                                  {encomenda.numeroLacre && (
                                    <div>
                                      <label className="font-medium text-muted-foreground">Lacre</label>
                                      <p className="text-xs font-mono truncate">{encomenda.numeroLacre}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Datas */}
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4 flex-shrink-0" />
                                Datas
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-4 h-4 flex-shrink-0" />
                                    Envio
                                  </label>
                                  <p className="text-sm font-medium">{new Date(encomenda.dataEnvio).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                    <Package className="w-4 h-4 flex-shrink-0" />
                                    Entrega
                                  </label>
                                  <div className="text-sm font-medium">
                                    {encomenda.dataEntrega ? (
                                      <Badge className={getEntregaColor(encomenda.dataEntrega)}>
                                        {new Date(encomenda.dataEntrega).toLocaleDateString('pt-BR')}
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
                                <User className="w-4 h-4" />
                                Remetente e Destinatário
                              </h4>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Dados de Origem */}
                                <div className="bg-green-50 border border-green-200 p-2 rounded-lg">
                                  <h5 className="text-xs font-semibold text-green-800 mb-1 flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    🏢 Origem
                                  </h5>

                                  {/* Dados do Remetente */}
                                  <div className="mb-2">
                                    <label className="text-xs font-medium text-green-700 flex items-center gap-1">
                                      <User className="w-4 h-4" />
                                      Remetente
                                    </label>
                                    <p className="text-xs font-medium text-green-900">{encomenda.remetente}</p>
                                    <p className="text-xs text-green-600">Mat: {formatMatriculaVinculo({ matricula: encomenda.remetenteMatricula, vinculo_funcional: encomenda.remetenteVinculo })}</p>
                                  </div>

                                  {/* Setor Origem */}
                                  <div>
                                    <label className="text-xs font-medium text-green-700 flex items-center gap-1">
                                      <Building2 className="w-4 h-4" />
                                      Setor
                                    </label>
                                    <p className="text-xs font-medium text-green-900">{encomenda.setorOrigem}</p>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center gap-1 cursor-help">
                                            <AlertCircle className="w-4 h-4 text-green-500 hover:text-green-600" />
                                            <p className="text-xs text-green-600">{obterEnderecoSetorSync(encomenda.setorOrigem) !== 'Carregando endereço...' ? obterEnderecoSetorSync(encomenda.setorOrigem).split(',').slice(-2).join(',').trim() : 'Carregando...'}</p>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="whitespace-pre-line">{obterEnderecoSetorSync(encomenda.setorOrigem)}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </div>

                                {/* Dados de Destino */}
                                <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg">
                                  <h5 className="text-xs font-semibold text-blue-800 mb-1 flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    🎯 Destino
                                  </h5>

                                  {/* Dados do Destinatário */}
                                  <div className="mb-2">
                                    <label className="text-xs font-medium text-blue-700 flex items-center gap-1">
                                      <User className="w-4 h-4" />
                                      Destinatário
                                    </label>
                                    <p className="text-xs font-medium text-blue-900">{encomenda.destinatario}</p>
                                    <p className="text-xs text-blue-600">Mat: {formatMatriculaVinculo({ matricula: encomenda.destinatarioMatricula, vinculo_funcional: encomenda.destinatarioVinculo })}</p>
                                  </div>

                                  {/* Setor Destino */}
                                  <div>
                                    <label className="text-xs font-medium text-blue-700 flex items-center gap-1">
                                      <Building2 className="w-4 h-4" />
                                      Setor
                                    </label>
                                    <p className="text-xs font-medium text-blue-900">{encomenda.setorDestino}</p>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center gap-1 cursor-help">
                                            <AlertCircle className="w-4 h-4 text-blue-500 hover:text-blue-600" />
                                            <p className="text-xs text-blue-600">{obterEnderecoSetorSync(encomenda.setorDestino) !== 'Carregando endereço...' ? obterEnderecoSetorSync(encomenda.setorDestino).split(',').slice(-2).join(',').trim() : 'Carregando...'}</p>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="whitespace-pre-line">{obterEnderecoSetorSync(encomenda.setorDestino)}</p>
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
                                  <Package className="w-4 h-4" />
                                  Descrição
                                </h4>
                                <p className="text-xs text-gray-600 line-clamp-2">
                                  {encomenda.descricao || 'Nenhuma descrição fornecida.'}
                                </p>
                              </div>

                              <div className="bg-gray-50 p-2 rounded-lg">
                                <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                                  <AlertCircle className="w-4 h-4" />
                                  Observações
                                </h4>
                                <p className="text-xs text-gray-600 line-clamp-2">
                                  {encomenda.observacoes || 'Nenhuma observação registrada.'}
                                </p>
                              </div>
                            </div>

                            
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {paginatedEncomendas.map((encomenda) => (
                <Card
                  key={encomenda.id?.toString() || encomenda.codigo || `${encomenda.numeroAR || ''}-${encomenda.numeroMalote || ''}-${encomenda.numeroLacre || ''}`}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="space-y-1">
                        <div className="font-medium text-primary text-nowrap text-sm">
                          {encomenda.codigo}
                        </div>
                        {(encomenda.numeroAR || encomenda.numeroMalote || encomenda.numeroLacre) && (
                          <div className="mt-0.5 space-y-0.5">
                            {encomenda.numeroAR && (
                              <div className="text-[11px] text-foreground-muted truncate">AR: {encomenda.numeroAR}</div>
                            )}
                            {encomenda.numeroMalote && (
                              <div className="text-[11px] text-foreground-muted truncate">Malote: {encomenda.numeroMalote}</div>
                            )}
                            {encomenda.numeroLacre && (
                              <div className="text-[11px] text-foreground-muted truncate">Lacre: {encomenda.numeroLacre}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getStatusColor(encomenda.status)} size="sm">
                          {getStatusLabel(encomenda.status)}
                        </Badge>
                        <Badge className={getTipoColor(encomenda.tipo)} size="sm">
                          {getTipoLabel(encomenda.tipo)}
                        </Badge>
                        <Badge className={getPrioridadeColor(encomenda.prioridade)} size="sm">
                          {getPrioridadeLabel(encomenda.prioridade)}
                        </Badge>
                      </div>

                      {/* Seção Remetente */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          <span className="text-xs font-semibold text-green-800 uppercase tracking-wide">Remetente</span>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 text-sm mb-1 cursor-help">
                                <User className="w-4 h-4 flex-shrink-0 text-green-600" />
                                <span className="truncate font-medium text-green-900">{encomenda.remetente}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{encomenda.remetente}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <div className="flex items-center gap-2 text-xs">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Building2 className="w-4 h-4 flex-shrink-0 text-green-600 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="whitespace-pre-line">{obterEnderecoSetorSync(encomenda.setorOrigem)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="truncate text-green-700 cursor-help">{encomenda.setorOrigem || 'Setor não informado'}</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{encomenda.setorOrigem || 'Setor não informado'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>

                      {/* Seção Destinatário */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Destinatário</span>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 text-sm mb-1 cursor-help">
                                <User className="w-4 h-4 flex-shrink-0 text-blue-600" />
                                <span className="truncate font-medium text-blue-900">{encomenda.destinatario}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{encomenda.destinatario}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <div className="flex items-center gap-2 text-xs">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Building2 className="w-4 h-4 flex-shrink-0 text-blue-600 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="whitespace-pre-line">{obterEnderecoSetorSync(encomenda.setorDestino)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="truncate text-blue-700 cursor-help">{encomenda.setorDestino}</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{encomenda.setorDestino}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm pt-2">
                        <Calendar className="w-4 h-4 flex-shrink-0 text-foreground-muted" />
                        <span>Envio: {new Date(encomenda.dataEnvio).toLocaleDateString('pt-BR')}</span>
                      </div>

                      {/* Data Entrega */}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 flex-shrink-0 text-foreground-muted" />
                        <span>Entrega: {encomenda.dataEntrega ? new Date(encomenda.dataEntrega).toLocaleDateString('pt-BR') : '-'}</span>
                      </div>

                      {/* Status Entregue */}
                      <div className="flex items-center gap-2 text-sm">
                        <Badge className={getEntregaColor(encomenda.dataEntrega)} size="sm">
                          Entregue: {encomenda.dataEntrega ? 'Sim' : 'Não'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm text-foreground-muted">
                        <Package className="w-4 h-4 flex-shrink-0" />
                        <span>Ações</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(encomenda)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTrack(encomenda.codigoRastreamento)}>
                            <QrCode className="mr-2 h-4 w-4" />
                            Rastrear
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrintLabel(encomenda)}>
                            <Printer className="mr-2 h-4 w-4" />
                            Reimprimir Etiqueta
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={!canReceive(encomenda)} onClick={() => canReceive(encomenda) && openConfirmModal(encomenda)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Receber
                          </DropdownMenuItem>
                          {isAdminUser() && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(encomenda)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>







      {/* Modal de Visualização */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className={"max-w-4xl max-h-[85vh] " + (isMapaExpanded ? "overflow-y-auto" : "overflow-y-hidden")}> 
          <DialogHeader>
            <DialogTitle>Detalhes da Encomenda</DialogTitle>
            <DialogDescription>
              Informações completas da encomenda
            </DialogDescription>
          </DialogHeader>
          {selectedEncomenda && (
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
                      <QrCode className="w-4 h-4 flex-shrink-0" />
                      Código
                    </label>
                    <p className="font-mono text-nowrap text-xs">{selectedEncomenda.codigo}</p>
                  </div>
                  <div className="ml-8">
                    <label className="font-medium text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      Status
                    </label>
                    <div>
                      <Badge className={`text-xs ${getStatusColor(selectedEncomenda.status)}`}>
                        {getStatusLabel(selectedEncomenda.status)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="font-medium text-muted-foreground flex items-center gap-1">
                      <Package className="w-4 h-4 flex-shrink-0" />
                      Tipo
                    </label>
                    <Badge className={getTipoColor(selectedEncomenda.tipo)}>
                      {getTipoLabel(selectedEncomenda.tipo)}
                    </Badge>
                  </div>
                  <div>
                    <label className="font-medium text-muted-foreground flex items-center gap-1">
                      <Info className="w-4 h-4 flex-shrink-0" />
                      Prioridade
                    </label>
                    <div>
                      <Badge className={`text-xs ${getPrioridadeColor(selectedEncomenda.prioridade)}`}>
                        {getPrioridadeLabel(selectedEncomenda.prioridade)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Identificadores */}
              {(selectedEncomenda.numeroAR || selectedEncomenda.numeroMalote || selectedEncomenda.numeroLacre) && (
                <div className="bg-gray-50 p-2 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Identificadores
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                    {selectedEncomenda.numeroAR && (
                      <div>
                        <label className="font-medium text-muted-foreground">AR</label>
                        <p className="text-xs font-mono truncate">{selectedEncomenda.numeroAR}</p>
                      </div>
                    )}
                    {selectedEncomenda.numeroMalote && (
                      <div>
                        <label className="font-medium text-muted-foreground">Malote</label>
                        <p className="text-xs font-mono truncate">{selectedEncomenda.numeroMalote}</p>
                      </div>
                    )}
                    {selectedEncomenda.numeroLacre && (
                      <div>
                        <label className="font-medium text-muted-foreground">Lacre</label>
                        <p className="text-xs font-mono truncate">{selectedEncomenda.numeroLacre}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Datas */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  Datas
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      Envio
                    </label>
                    <p className="text-sm font-medium">{new Date(selectedEncomenda.dataEnvio).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Package className="w-4 h-4 flex-shrink-0" />
                      Entrega
                    </label>
                    <div className="text-sm font-medium">
                      {selectedEncomenda.dataEntrega ? (
                        <Badge className={getEntregaColor(selectedEncomenda.dataEntrega)}>
                          {new Date(selectedEncomenda.dataEntrega).toLocaleDateString('pt-BR')}
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
                  <User className="w-4 h-4" />
                  Remetente e Destinatário
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Dados de Origem */}
                  <div className="bg-green-50 border border-green-200 p-2 rounded-lg">
                    <h5 className="text-xs font-semibold text-green-800 mb-1 flex items-center gap-1">
                      <User className="w-4 h-4" />
                      🏢 Origem
                    </h5>

                    {/* Dados do Remetente */}
                    <div className="mb-2">
                      <label className="text-xs font-medium text-green-700 flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Remetente
                      </label>
                      <p className="text-xs font-medium text-green-900">{selectedEncomenda.remetente}</p>
                      <p className="text-xs text-green-600">Mat: {formatMatriculaVinculo({ matricula: selectedEncomenda.remetenteMatricula, vinculo_funcional: selectedEncomenda.remetenteVinculo })}</p>
                    </div>

                    {/* Setor Origem */}
                    <div>
                      <label className="text-xs font-medium text-green-700 flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        Setor
                      </label>
                      <p className="text-xs font-medium text-green-900">{selectedEncomenda.setorOrigem}</p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 cursor-help">
                              <AlertCircle className="w-4 h-4 text-green-500 hover:text-green-600" />
                              <p className="text-xs text-green-600">{obterEnderecoSetorSync(selectedEncomenda.setorOrigem) !== 'Carregando endereço...' ? obterEnderecoSetorSync(selectedEncomenda.setorOrigem).split(',').slice(-2).join(',').trim() : 'Carregando...'}</p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="whitespace-pre-line">{obterEnderecoSetorSync(selectedEncomenda.setorOrigem)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  {/* Dados de Destino */}
                  <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg">
                    <h5 className="text-xs font-semibold text-blue-800 mb-1 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      🎯 Destino
                    </h5>

                    {/* Dados do Destinatário */}
                    <div className="mb-2">
                      <label className="text-xs font-medium text-blue-700 flex items-center gap-1">
                        <User className="w-4 h-4" />
                        Destinatário
                      </label>
                      <p className="text-xs font-medium text-blue-900">{selectedEncomenda.destinatario}</p>
                      <p className="text-xs text-blue-600">Mat: {formatMatriculaVinculo({ matricula: selectedEncomenda.destinatarioMatricula, vinculo_funcional: selectedEncomenda.destinatarioVinculo })}</p>
                    </div>

                    {/* Setor Destino */}
                    <div>
                      <label className="text-xs font-medium text-blue-700 flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        Setor
                      </label>
                      <p className="text-xs font-medium text-blue-900">{selectedEncomenda.setorDestino}</p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 cursor-help">
                              <AlertCircle className="w-4 h-4 text-blue-500 hover:text-blue-600" />
                              <p className="text-xs text-blue-600">{obterEnderecoSetorSync(selectedEncomenda.setorDestino) !== 'Carregando endereço...' ? obterEnderecoSetorSync(selectedEncomenda.setorDestino).split(',').slice(-2).join(',').trim() : 'Carregando...'}</p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="whitespace-pre-line">{obterEnderecoSetorSync(selectedEncomenda.setorDestino)}</p>
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
                    <Package className="w-4 h-4" />
                    Descrição
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {selectedEncomenda.descricao || 'Nenhuma descrição fornecida.'}
                  </p>
                </div>

                <div className="bg-gray-50 p-2 rounded-lg">
                  <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Observações
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {selectedEncomenda.observacoes || 'Nenhuma observação registrada.'}
                  </p>
                </div>
              </div>

              {/* Mapa dos Setores (sem criação de novo componente) */}
              <div className="mb-2">
                <MapaSetores
                  setorOrigem={selectedEncomenda.setorOrigem}
                  setorDestino={selectedEncomenda.setorDestino}
                  onExpandedChange={setIsMapaExpanded}
                />
              </div>
            </div>
          )}

        </DialogContent>
      </Dialog>
      <ConfirmReceiptModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        notification={selectedNotification}
      />

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta encomenda? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {encomendaToDelete && (
            <div className="py-3 space-y-3">
              {/* Básico */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="font-medium text-muted-foreground flex items-center gap-1">
                    <QrCode className="w-4 h-4 flex-shrink-0" />
                    Código
                  </label>
                  <p className="font-mono text-sm truncate">{encomendaToDelete.codigo}</p>
                </div>
                <div>
                  <label className="font-medium text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    Status
                  </label>
                  <div>
                    <Badge className={`text-xs ${getStatusColor(encomendaToDelete.status)}`}>
                      {getStatusLabel(encomendaToDelete.status)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="font-medium text-muted-foreground flex items-center gap-1">
                    <Package className="w-4 h-4 flex-shrink-0" />
                    Tipo
                  </label>
                  <Badge className={getTipoColor(encomendaToDelete.tipo)}>
                    {getTipoLabel(encomendaToDelete.tipo)}
                  </Badge>
                </div>
                <div>
                  <label className="font-medium text-muted-foreground flex items-center gap-1">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    Prioridade
                  </label>
                  <Badge className={`text-xs ${getPrioridadeColor(encomendaToDelete.prioridade)}`}>
                    {getPrioridadeLabel(encomendaToDelete.prioridade)}
                  </Badge>
                </div>
              </div>

              {/* Identificadores */}
              {(encomendaToDelete.numeroAR || encomendaToDelete.numeroMalote || encomendaToDelete.numeroLacre) && (
                <div className="bg-gray-50 p-2 rounded">
                  <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Identificadores
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    {encomendaToDelete.numeroAR && (
                      <div>
                        <label className="font-medium text-muted-foreground">AR</label>
                        <p className="font-mono truncate">{encomendaToDelete.numeroAR}</p>
                      </div>
                    )}
                    {encomendaToDelete.numeroMalote && (
                      <div>
                        <label className="font-medium text-muted-foreground">Malote</label>
                        <p className="font-mono truncate">{encomendaToDelete.numeroMalote}</p>
                      </div>
                    )}
                    {encomendaToDelete.numeroLacre && (
                      <div>
                        <label className="font-medium text-muted-foreground">Lacre</label>
                        <p className="font-mono truncate">{encomendaToDelete.numeroLacre}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Remetente/Destinatário */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="font-medium text-muted-foreground flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Remetente
                  </label>
                  <p className="truncate">{encomendaToDelete.remetente || '-'}</p>
                  <p className="text-muted-foreground truncate">{(encomendaToDelete.remetenteMatricula || '') + (encomendaToDelete.remetenteVinculo ? '-' + encomendaToDelete.remetenteVinculo : '')}</p>
                </div>
                <div>
                  <label className="font-medium text-muted-foreground flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Destinatário
                  </label>
                  <p className="truncate">{encomendaToDelete.destinatario || '-'}</p>
                  <p className="text-muted-foreground truncate">{(encomendaToDelete.destinatarioMatricula || '') + (encomendaToDelete.destinatarioVinculo ? '-' + encomendaToDelete.destinatarioVinculo : '')}</p>
                </div>
              </div>

              {/* Setores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 flex-shrink-0 text-blue-600" />
                  <span className="truncate">Origem: {encomendaToDelete.setorOrigem || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 flex-shrink-0 text-blue-600" />
                  <span className="truncate">Destino: {encomendaToDelete.setorDestino || '-'}</span>
                </div>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 flex-shrink-0 text-foreground-muted" />
                  <span>Envio: {encomendaToDelete.dataEnvio ? new Date(encomendaToDelete.dataEnvio).toLocaleDateString('pt-BR') : '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 flex-shrink-0 text-foreground-muted" />
                  <span>Entrega: {encomendaToDelete.dataEntrega ? new Date(encomendaToDelete.dataEntrega).toLocaleDateString('pt-BR') : '-'}</span>
                </div>
              </div>

              {/* Descrição/Observações */}
              <div className="space-y-1">
                {encomendaToDelete.descricao && (
                  <p className="text-sm"><strong>Descrição:</strong> {encomendaToDelete.descricao}</p>
                )}
                {encomendaToDelete.observacoes && (
                  <p className="text-sm text-muted-foreground"><strong>Observações:</strong> {encomendaToDelete.observacoes}</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Reimpressão de Etiqueta */}
      <ModalReimpressaoEtiqueta
        isOpen={isReimpressaoModalOpen}
        onClose={() => {
          setIsReimpressaoModalOpen(false);
          setEncomendaParaReimpressao(null);
        }}
        encomenda={encomendaParaReimpressao}
      />
    </div>
  );
};

export default ListaEncomendas;
