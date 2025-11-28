import { Bell, Search, User, Menu, LogOut, Settings, Building2, IdCard, BadgeCheck, Mail, ChevronLeft, ChevronRight, QrCode, AlertTriangle, AlertCircle, MapPin, Calendar, Hash, Info, Package, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { menuItems } from "./Sidebar";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useConfiguracoes } from "@/hooks/use-configuracoes";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { ConfirmReceiptModal } from "@/components/encomendas/ConfirmReceiptModal";
import NotificationDropdown from "@/components/ui/NotificationDropdown";
import NotificationDetailsModal from "@/components/ui/NotificationDetailsModal";
import { useNotification } from "@/hooks/use-notification";
import NotificationModal from "@/components/ui/notification-modal";
import { useEffect, useState } from "react";
import logoSefaz from "@/assets/logo-sefaz-tocantins.png";
import { formatMatriculaVinculo } from "@/lib/utils";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getStatusColor, getStatusLabel, getTipoColor, getTipoLabel, getPrioridadeColor, getPrioridadeLabel, getEntregaColor } from "@/utils/badge-colors";
import { getEnderecoSetor } from "@/services/setores.service";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { getConfiguracao } = useConfiguracoes();
  const { getNotificationCount, notifications = [], confirmAllReceipts } = useNotifications();
  const { notification: appNotification, isOpen: isNotifOpen, showSuccess, showError, showWarning, hideNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [sectorName, setSectorName] = useState<string | null>(null);
  const [showConfirmAllModal, setShowConfirmAllModal] = useState(false);
  const [batchIndex, setBatchIndex] = useState(0);
  const [enderecoSetorOrigemBatch, setEnderecoSetorOrigemBatch] = useState<string>("");
  const [enderecoSetorDestinoBatch, setEnderecoSetorDestinoBatch] = useState<string>("");
  const [detalhesBatch, setDetalhesBatch] = useState<any | null>(null);

  useEffect(() => {
    const resolveSector = async () => {
      if (!user) {
        setSectorName(null);
        return;
      }
      const directName = (user as any)?.setor ?? (user as any)?.SETOR ?? (user as any)?.nome_setor ?? (user as any)?.NOME_SETOR;
      if (directName) {
        setSectorName(String(directName));
        return;
      }
      const setorId = (user as any)?.setor_id ?? (user as any)?.setorId ?? (user as any)?.SETOR_ID;
      if (setorId) {
        try {
          const response = await api.getSetorById(setorId);
          const data = response?.data?.data;
          const name = data?.NOME_SETOR ?? data?.nome_setor ?? data?.SETOR ?? data?.setor;
          if (name) setSectorName(String(name));
        } catch (_) {
          setSectorName(null);
        }
      } else {
        setSectorName(null);
      }
    };
    resolveSector();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Navegar para a página de processos com o termo de pesquisa
      navigate(`/processos?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(e as any);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const cleanName = name.trim();
    if (cleanName.length === 0) return 'U';
    
    const words = cleanName.split(' ').filter(word => word.length > 0);
    if (words.length === 0) return 'U';
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    
    // Pega a primeira letra do primeiro e segundo nome
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    // Abrir diretamente o modal de confirmação ao clicar na notificação
    setShowConfirmModal(true);
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    setSelectedNotification(null);
  };

  const handleReceiveAll = () => {
    if (!notifications.length) return;
    setBatchIndex(0);
    setShowConfirmAllModal(true);
  };

  const handleConfirmAllReceipts = async () => {
    try {
      const result = await confirmAllReceipts();
      if ((result as any)?.success) {
        setShowConfirmAllModal(false);
        showSuccess('Recebimento em lote', 'Todas as encomendas foram recebidas.');
      } else if ((result as any)?.processed > 0) {
        setShowConfirmAllModal(false);
        showWarning('Recebimento parcial', `Recebidas ${(result as any)?.processed}. Falhas: ${((result as any)?.failed?.length || 0)}.`);
      } else {
        showError('Falha no recebimento', 'Não foi possível receber as encomendas.');
      }
    } catch (e) {
      showError('Erro inesperado', 'Ocorreu um erro ao receber todas as encomendas.');
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  const normalizeStatus = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'em_transito') return 'transito';
    if (s === 'recebido') return 'entregue';
    return s;
  };

  useEffect(() => {
    if (!showConfirmAllModal) {
      setEnderecoSetorOrigemBatch("");
      setEnderecoSetorDestinoBatch("");
      setDetalhesBatch(null);
      return;
    }
    const n = notifications[batchIndex];
    if (!n) return;
    if (n.setorOrigemNome) {
      getEnderecoSetor(n.setorOrigemNome).then(setEnderecoSetorOrigemBatch).catch(() => setEnderecoSetorOrigemBatch(""));
    } else {
      setEnderecoSetorOrigemBatch("");
    }
    (async () => {
      try {
        const resp = await api.getEncomendaById(String(n.id));
        const raw = (resp as any)?.data?.data?.data || (resp as any)?.data?.data || {};
        const mapped = {
          remetente: raw.remetente || raw.REMETENTE || '',
          remetenteMatricula: raw.remetenteMatricula || raw.remetente_matricula || '',
          remetenteVinculo: raw.remetenteVinculo || raw.remetente_vinculo || '',
          destinatario: raw.destinatario || raw.DESTINATARIO || '',
          destinatarioMatricula: raw.destinatarioMatricula || raw.destinatario_matricula || '',
          destinatarioVinculo: raw.destinatarioVinculo || raw.destinatario_vinculo || '',
          setorDestino: raw.setorDestino || raw.SETOR_DESTINO || raw.destino || '',
          descricao: raw.descricao || raw.DESCRICAO || '',
          observacoes: raw.observacoes || raw.OBSERVACOES || raw.observations || ''
        };
        setDetalhesBatch(mapped);
        if (mapped.setorDestino) {
          const end = await getEnderecoSetor(mapped.setorDestino);
          setEnderecoSetorDestinoBatch(end);
        } else {
          setEnderecoSetorDestinoBatch("");
        }
      } catch {
        setDetalhesBatch(null);
        setEnderecoSetorDestinoBatch("");
      }
    })();
  }, [showConfirmAllModal, batchIndex, notifications]);

  return (
    <header className="header-govto">
      <div className="w-full px-6">
        <div className="flex items-center justify-between h-16">
          {/* Menu Mobile */}
          <div className="md:hidden mr-2">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85%] sm:w-[350px] p-0 overflow-y-auto bg-white">
                <div className="p-4">
                  <nav className="space-y-2 mt-4">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = item.id === 'dashboard' 
                        ? location.pathname === '/' 
                        : location.pathname.startsWith(`/${item.id}`);
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            navigate(item.id === 'dashboard' ? '/' : `/${item.id}`);
                            setIsSheetOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-smooth",
                            isActive 
                              ? `${item.activeBgColor} text-white shadow-sm` 
                              : `${item.bgColor} transition-colors`
                          )}
                        >
                          <Icon className={cn(
                            "w-12 h-12 flex-shrink-0",
                            isActive ? "text-white" : item.color
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-sm font-medium truncate",
                              isActive ? "text-white" : "text-gray-900"
                            )}>
                              {item.label}
                            </p>
                            <p className={cn(
                              "text-xs truncate",
                              isActive ? "text-white/80" : "text-gray-600"
                            )}>
                              {item.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo */}
          <div className="flex items-center">
            <img 
              src={getConfiguracao('aparencia', 'logo_header_url') || logoSefaz} 
              alt="Logo da Instituição"
              className="h-12 object-contain bg-transparent"
              style={{ backgroundColor: 'transparent' }}
              onError={(e) => {
                // Fallback para o logo padrão se a URL configurada falhar
                const target = e.target as HTMLImageElement;
                if (target.src !== logoSefaz) {
                  target.src = logoSefaz;
                }
              }}
            />
          </div>

          {/* Barra de Pesquisa */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input 
                placeholder="Pesquisar documentos, processos..."
                className="pl-10 bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-blue-300"
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyPress={handleKeyPress}
              />
            </form>
          </div>

          {/* Menu Ações */}
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-100 relative">
                  <Bell className="w-5 h-5" />
                  {getNotificationCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {getNotificationCount()}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-96" align="end">
                <NotificationDropdown 
                  notifications={notifications}
                  onNotificationClick={handleNotificationClick}
                  onReceiveAll={handleReceiveAll}
                />
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 rounded-full pl-2 pr-3 flex items-center space-x-2 text-gray-700 hover:bg-gray-100">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={user?.nome || user?.name || ''} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.nome ? getInitials(user.nome) : (user?.name ? getInitials(user.name) : 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-xs font-medium leading-tight">{user?.nome || user?.name || 'Usuário'}</span>
                    {sectorName && (
                      <span className="text-[11px] text-muted-foreground leading-tight">{sectorName}</span>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72 p-2" align="end" forceMount>
                <DropdownMenuLabel className="font-normal bg-gray-50 rounded-md p-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none text-gray-900">
                      {user?.nome || user?.name || 'Usuário'}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {sectorName && (
                        <Badge variant="secondary" className="flex items-center gap-1 px-2 py-0.5 text-[11px]">
                          <Building2 className="h-3 w-3" />
                          {sectorName}
                        </Badge>
                      )}
                      {(() => {
                        const rawRole = (user as any)?.role ?? (user as any)?.ROLE ?? '';
                        const roleText = rawRole?.toString();
                        return roleText ? (
                          <Badge variant={['ADMIN','ADMINISTRADOR'].includes(roleText.toUpperCase()) ? 'destructive' : 'outline'} className="px-2 py-0.5 text-[11px]">
                            {roleText}
                          </Badge>
                        ) : null;
                      })()}
                      {user?.cpf && (
                        <Badge variant="outline" className="flex items-center gap-1 px-2 py-0.5 text-[11px]">
                          <IdCard className="h-3 w-3" />
                          CPF: {user.cpf}
                        </Badge>
                      )}
                      <Badge className="flex items-center gap-1 px-2 py-0.5 text-[11px]">
                        <BadgeCheck className="h-3 w-3" />
                        Matrícula: {formatMatriculaVinculo(user)}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1 px-2 py-0.5 text-[11px]">
                        <Mail className="h-3 w-3" />
                        {user?.e_mail || user?.email || 'email@exemplo.com'}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(() => {
                  const rawRole = (user as any)?.role ?? (user as any)?.ROLE ?? '';
                  const userRole = rawRole?.toString()?.toUpperCase();
                  const canSeeSettings = ['ADMIN', 'ADMINISTRADOR'].includes(userRole);
                  const isUserRole = userRole === 'USER';
                  return (
                    <>
                      {canSeeSettings && (
                        <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Configurações</span>
                        </DropdownMenuItem>
                      )}
                      {isUserRole && (
                        <DropdownMenuItem onClick={() => navigate('/configuracoes/setor')}>
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Configurações</span>
                        </DropdownMenuItem>
                      )}
                    </>
                  );
                })()}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-100 md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Recebimento */}
      <ConfirmReceiptModal
        isOpen={showConfirmModal}
        onClose={handleCloseModal}
        notification={selectedNotification}
      />

      {/* Modal de Detalhes da Notificação */}
      <NotificationDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        notification={selectedNotification}
        onConfirmReceipt={() => {
          setIsDetailsModalOpen(false);
          setShowConfirmModal(true);
        }}
      />

      {appNotification && (
      <NotificationModal
        isOpen={isNotifOpen}
        onClose={hideNotification}
        title={appNotification.title}
        description={appNotification.description}
        variant={appNotification.variant}
      />
      )}

      <Dialog open={showConfirmAllModal} onOpenChange={setShowConfirmAllModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Confirmar Recebimento de Encomenda(s)</DialogTitle>
            <DialogDescription>Revise as encomendas antes de confirmar</DialogDescription>
          </DialogHeader>
          {notifications.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 w-7 p-0 ${(batchIndex === 0 || notifications.length <= 1) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => setBatchIndex(prev => Math.max(prev - 1, 0))}
                  disabled={batchIndex === 0 || notifications.length <= 1}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <span className="text-xs text-muted-foreground">{batchIndex + 1} de {notifications.length}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 w-7 p-0 ${(batchIndex === notifications.length - 1 || notifications.length <= 1) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => setBatchIndex(prev => Math.min(prev + 1, notifications.length - 1))}
                  disabled={batchIndex === notifications.length - 1 || notifications.length <= 1}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
              {(() => {
                const n = notifications[batchIndex];
                return (
                  <div className="space-y-2">
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
                          <p className="font-mono text-nowrap text-xs">{n.numeroEncomenda || '-'}</p>
                        </div>
                        <div className="ml-8">
                          <label className="font-medium text-muted-foreground flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Status
                          </label>
                          <div>
                            <Badge className={`text-xs ${getStatusColor(normalizeStatus(String(n.status)))}`}>
                              {getStatusLabel(normalizeStatus(String(n.status)))}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <label className="font-medium text-muted-foreground flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            Tipo
                          </label>
                          <Badge className={getTipoColor('encomenda')}>
                            {getTipoLabel('encomenda')}
                          </Badge>
                        </div>
                        <div>
                          <label className="font-medium text-muted-foreground flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            Prioridade
                          </label>
                          <div>
                            <Badge className={`text-xs ${getPrioridadeColor(n.urgente ? 'urgente' : 'normal')}`}>
                              {getPrioridadeLabel(n.urgente ? 'urgente' : 'normal')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
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
                          <p className="text-sm font-medium">{formatDateTime(n.dataCriacao)}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            Entrega
                          </label>
                          <div className="text-sm font-medium">
                            <Badge className="bg-gray-100 text-gray-600">Não entregue</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <User className="w-3 h-3" />
                        Remetente e Destinatário
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-green-50 border border-green-200 p-2 rounded-lg">
                          <h5 className="text-xs font-semibold text-green-800 mb-1 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            🏢 Origem
                          </h5>
                          <div className="mb-2">
                            <label className="text-xs font-medium text-green-700 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              Remetente
                            </label>
                            <p className="text-xs font-medium text-green-900">{n.remetenteNome}</p>
                            <p className="text-xs text-green-600">Mat: {formatMatriculaVinculo({ matricula: detalhesBatch?.remetenteMatricula || n.remetenteMatricula, vinculo_funcional: detalhesBatch?.remetenteVinculo }) || (n.remetenteMatricula || '-')}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-green-700 flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              Setor
                            </label>
                            <p className="text-xs font-medium text-green-900">{n.setorOrigemNome}</p>
                            <div className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-green-500" />
                              <p className="text-xs text-green-600">{enderecoSetorOrigemBatch ? enderecoSetorOrigemBatch.split(',').slice(-2).join(',').trim() : 'Carregando...'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg">
                          <h5 className="text-xs font-semibold text-blue-800 mb-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            🎯 Destino
                          </h5>
                          <div className="mb-2">
                            <label className="text-xs font-medium text-blue-700 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              Destinatário
                            </label>
                            <p className="text-xs font-medium text-blue-900">{detalhesBatch?.destinatario || 'N/A'}</p>
                            <p className="text-xs text-blue-600">Mat: {formatMatriculaVinculo({ matricula: detalhesBatch?.destinatarioMatricula, vinculo_funcional: detalhesBatch?.destinatarioVinculo }) || '-'}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-blue-700 flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              Setor
                            </label>
                            <p className="text-xs font-medium text-blue-900">{detalhesBatch?.setorDestino || 'N/A'}</p>
                            <div className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-blue-500" />
                              <p className="text-xs text-blue-600">{enderecoSetorDestinoBatch ? enderecoSetorDestinoBatch : 'Endereço não disponível'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          Descrição
                        </h4>
                        <p className="text-xs text-gray-800 break-words">
                          {detalhesBatch?.descricao || n.descricao || 'Nenhuma descrição fornecida.'}
                        </p>
                      </div>
                      {detalhesBatch?.observacoes && detalhesBatch.observacoes.trim() !== '' && (
                        <div className="bg-gray-50 p-2 rounded-lg">
                          <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Observações
                          </h4>
                          <p className="text-xs text-gray-800 break-words">
                            {detalhesBatch.observacoes}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-yellow-800">Atenção!</p>
                          <p className="text-yellow-700">Ao confirmar o recebimento, o status da encomenda será alterado para "Entregue" e esta ação não poderá ser desfeita.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmAllModal(false)}>Cancelar</Button>
            <Button className="bg-[#18489A] text-white hover:opacity-90" onClick={handleConfirmAllReceipts}>Confirmar Recebimento(s)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;
