import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { useModuleTheme } from "@/lib/theme-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNotification } from '@/hooks/use-notification';
import NotificationModal from '@/components/ui/notification-modal';
import { mockBackend, type Tramitacao as TramitacaoType } from "@/lib/mock-backend";
import { Search, Filter, Clock, CheckCircle, AlertCircle, XCircle, Eye, Edit, ArrowRight, Plus, Send, Trash2, Grid3X3, List } from "lucide-react";

const Tramitacao = () => {
  const classes = useModuleTheme('tramitacao');
  const { notification, isOpen, showError, showSuccess, showInfo, showWarning, hideNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [tramitacoes, setTramitacoes] = useState<TramitacaoType[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTramitacao, setSelectedTramitacao] = useState<TramitacaoType | null>(null);
  const [formData, setFormData] = useState({
    numeroProtocolo: '',
    assunto: '',
    remetente: '',
    destinatario: '',
    status: 'pendente' as const,
    prioridade: 'media' as const,
    dataInicio: new Date().toISOString().split('T')[0],
    dataVencimento: '',
    observacoes: '',
    documentos: [] as string[]
  });

  // Carregar tramitações do backend simulado
  useEffect(() => {
    loadTramitacoes();
  }, []);

  const loadTramitacoes = () => {
    const data = mockBackend.getTramitacoes();
    setTramitacoes(data);
  };

  const resetForm = () => {
    setFormData({
      numeroProtocolo: '',
      assunto: '',
      remetente: '',
      destinatario: '',
      status: 'pendente',
      prioridade: 'media',
      dataInicio: new Date().toISOString().split('T')[0],
      dataVencimento: '',
      observacoes: '',
      documentos: []
    });
  };

  const handleCreate = () => {
    try {
      mockBackend.createTramitacao(formData);
      loadTramitacoes();
      setIsCreateModalOpen(false);
      resetForm();
      showSuccess("Sucesso", "Tramitação criada com sucesso!");
    } catch (error) {
      showError("Erro", "Erro ao criar tramitação. Tente novamente.");
    }
  };

  const handleEdit = () => {
    if (!selectedTramitacao) return;
    
    try {
      mockBackend.updateTramitacao(selectedTramitacao.id, formData);
      loadTramitacoes();
      setIsEditModalOpen(false);
      setSelectedTramitacao(null);
      resetForm();
      showSuccess("Sucesso", "Tramitação atualizada com sucesso!");
    } catch (error) {
      showError("Erro", "Erro ao atualizar tramitação. Tente novamente.");
    }
  };

  const handleView = (tramitacao: TramitacaoType) => {
    setSelectedTramitacao(tramitacao);
    setIsViewModalOpen(true);
  };

  const handleEditClick = (tramitacao: TramitacaoType) => {
    setSelectedTramitacao(tramitacao);
    setFormData({
      numeroProtocolo: tramitacao.numeroProtocolo,
      assunto: tramitacao.assunto,
      remetente: tramitacao.remetente,
      destinatario: tramitacao.destinatario,
      status: tramitacao.status,
      prioridade: tramitacao.prioridade,
      dataInicio: tramitacao.dataInicio.split('T')[0],
      dataVencimento: tramitacao.dataVencimento?.split('T')[0] || '',
      observacoes: tramitacao.observacoes || '',
      documentos: tramitacao.documentos
    });
    setIsEditModalOpen(true);
  };

  const handleEncaminhar = (tramitacao: TramitacaoType) => {
    try {
      mockBackend.updateTramitacao(tramitacao.id, { status: 'em_andamento' });
      loadTramitacoes();
      showSuccess("Sucesso", "Tramitação encaminhada com sucesso!");
    } catch (error) {
      showError("Erro", "Erro ao encaminhar tramitação. Tente novamente.");
    }
  };

  const handleDelete = (tramitacao: TramitacaoType) => {
    if (window.confirm('Tem certeza que deseja excluir esta tramitação?')) {
      try {
        mockBackend.deleteTramitacao(tramitacao.id);
        loadTramitacoes();
        showSuccess("Sucesso", "Tramitação excluída com sucesso!");
      } catch (error) {
        showError("Erro", "Erro ao excluir tramitação. Tente novamente.");
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { label: "Pendente", className: classes.badgeSecondary, icon: Clock },
      em_andamento: { label: "Em Andamento", className: classes.badge, icon: AlertCircle },
      concluida: { label: "Concluída", className: "bg-green-500 text-white", icon: CheckCircle },
      cancelada: { label: "Cancelada", className: "bg-red-500 text-white", icon: XCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;
    
    const Icon = config.icon;
    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const prioridadeConfig = {
      alta: { label: "Alta", className: "bg-red-500 text-white" },
      normal: { label: "Normal", className: classes.badgeSecondary },
      baixa: { label: "Baixa", className: classes.badgeOutline }
    };
    
    const config = prioridadeConfig[prioridade as keyof typeof prioridadeConfig];
    if (!config) return null;
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const filteredTramitacoes = tramitacoes.filter(tramitacao => {
    const matchesSearch = tramitacao.numeroProtocolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tramitacao.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tramitacao.remetente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tramitacao.destinatario.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || tramitacao.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: tramitacoes.length,
    pendentes: tramitacoes.filter(t => t.status === "pendente").length,
    emAndamento: tramitacoes.filter(t => t.status === "em_andamento").length,
    concluidas: tramitacoes.filter(t => t.status === "concluida").length
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tramitação</h1>
            <p className="text-muted-foreground">Gerencie o fluxo de documentos e processos</p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className={`${classes.button} text-white`}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Tramitação
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">tramitações</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendentes}</div>
              <p className="text-xs text-muted-foreground">aguardando</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.emAndamento}</div>
              <p className="text-xs text-muted-foreground">processando</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.concluidas}</div>
              <p className="text-xs text-muted-foreground">finalizadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por protocolo, assunto, remetente ou destinatário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              {/* Botões de Visualização */}
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
          </CardContent>
        </Card>

        {/* Conteúdo Principal */}
        <Tabs defaultValue="lista" className="space-y-4">
          <TabsList>
            <TabsTrigger value="lista">Lista de Tramitações</TabsTrigger>
            <TabsTrigger value="fluxo">Fluxo de Trabalho</TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="space-y-4">
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'grid gap-4'}>
              {filteredTramitacoes.map((tramitacao) => (
                <Card key={tramitacao.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{tramitacao.assunto}</CardTitle>
                        <CardDescription>Protocolo: {tramitacao.numeroProtocolo}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(tramitacao.status)}
                        {getPrioridadeBadge(tramitacao.prioridade)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={`grid gap-4 text-sm ${viewMode === 'grid' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
                      <div>
                        <span className="font-medium text-muted-foreground">Remetente:</span>
                        <p className="mt-1">{tramitacao.remetente}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Destinatário:</span>
                        <p className="mt-1">{tramitacao.destinatario}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Data Início:</span>
                        <p className="mt-1">{new Date(tramitacao.dataInicio).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Vencimento:</span>
                        <p className="mt-1">{tramitacao.dataVencimento ? new Date(tramitacao.dataVencimento).toLocaleDateString('pt-BR') : 'Não definido'}</p>
                      </div>
                    </div>
                    {tramitacao.observacoes && (
                      <div className="mt-4 pt-4 border-t">
                        <span className="font-medium text-muted-foreground">Observações:</span>
                        <p className="mt-1 text-sm">{tramitacao.observacoes}</p>
                      </div>
                    )}
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Button 
                        className={`${classes.buttonSecondary} text-white`} 
                        size="sm"
                        onClick={() => handleView(tramitacao)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button 
                        className={`${classes.buttonSecondary} text-white`} 
                        size="sm"
                        onClick={() => handleEditClick(tramitacao)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button 
                        className={`${classes.button} text-white`} 
                        size="sm"
                        onClick={() => handleEncaminhar(tramitacao)}
                        disabled={tramitacao.status === 'concluida'}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Encaminhar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(tramitacao)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="fluxo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fluxo de Trabalho</CardTitle>
                <CardDescription>Visualize o fluxo completo das tramitações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-12">
                  <ArrowRight className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Funcionalidade de fluxo de trabalho em desenvolvimento</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Criação */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Tramitação</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar uma nova tramitação
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numeroProtocolo">Número do Protocolo</Label>
                  <Input
                    id="numeroProtocolo"
                    value={formData.numeroProtocolo}
                    onChange={(e) => setFormData({...formData, numeroProtocolo: e.target.value})}
                    placeholder="Ex: PROT-001/2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prioridade">Prioridade</Label>
                  <Select value={formData.prioridade} onValueChange={(value: any) => setFormData({...formData, prioridade: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assunto">Assunto</Label>
                <Input
                  id="assunto"
                  value={formData.assunto}
                  onChange={(e) => setFormData({...formData, assunto: e.target.value})}
                  placeholder="Descreva o assunto da tramitação"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="remetente">Remetente</Label>
                  <Input
                    id="remetente"
                    value={formData.remetente}
                    onChange={(e) => setFormData({...formData, remetente: e.target.value})}
                    placeholder="Setor/Pessoa remetente"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destinatario">Destinatário</Label>
                  <Input
                    id="destinatario"
                    value={formData.destinatario}
                    onChange={(e) => setFormData({...formData, destinatario: e.target.value})}
                    placeholder="Setor/Pessoa destinatária"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data de Início</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => setFormData({...formData, dataInicio: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataVencimento">Data de Vencimento</Label>
                  <Input
                    id="dataVencimento"
                    type="date"
                    value={formData.dataVencimento}
                    onChange={(e) => setFormData({...formData, dataVencimento: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  placeholder="Observações adicionais (opcional)"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} className={`${classes.button} text-white`}>
                Criar Tramitação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Visualização */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Tramitação</DialogTitle>
              <DialogDescription>
                Informações completas da tramitação
              </DialogDescription>
            </DialogHeader>
            {selectedTramitacao && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Protocolo</Label>
                    <p className="mt-1">{selectedTramitacao.numeroProtocolo}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedTramitacao.status)}</div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Assunto</Label>
                  <p className="mt-1">{selectedTramitacao.assunto}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Remetente</Label>
                    <p className="mt-1">{selectedTramitacao.remetente}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Destinatário</Label>
                    <p className="mt-1">{selectedTramitacao.destinatario}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Data de Início</Label>
                    <p className="mt-1">{new Date(selectedTramitacao.dataInicio).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Vencimento</Label>
                    <p className="mt-1">{selectedTramitacao.dataVencimento ? new Date(selectedTramitacao.dataVencimento).toLocaleDateString('pt-BR') : 'Não definido'}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Prioridade</Label>
                  <div className="mt-1">{getPrioridadeBadge(selectedTramitacao.prioridade)}</div>
                </div>
                {selectedTramitacao.observacoes && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Observações</Label>
                    <p className="mt-1">{selectedTramitacao.observacoes}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Edição */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Tramitação</DialogTitle>
              <DialogDescription>
                Atualize os dados da tramitação
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-numeroProtocolo">Número do Protocolo</Label>
                  <Input
                    id="edit-numeroProtocolo"
                    value={formData.numeroProtocolo}
                    onChange={(e) => setFormData({...formData, numeroProtocolo: e.target.value})}
                    placeholder="Ex: PROT-001/2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="concluida">Concluída</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-assunto">Assunto</Label>
                <Input
                  id="edit-assunto"
                  value={formData.assunto}
                  onChange={(e) => setFormData({...formData, assunto: e.target.value})}
                  placeholder="Descreva o assunto da tramitação"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-remetente">Remetente</Label>
                  <Input
                    id="edit-remetente"
                    value={formData.remetente}
                    onChange={(e) => setFormData({...formData, remetente: e.target.value})}
                    placeholder="Setor/Pessoa remetente"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-destinatario">Destinatário</Label>
                  <Input
                    id="edit-destinatario"
                    value={formData.destinatario}
                    onChange={(e) => setFormData({...formData, destinatario: e.target.value})}
                    placeholder="Setor/Pessoa destinatária"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-prioridade">Prioridade</Label>
                  <Select value={formData.prioridade} onValueChange={(value: any) => setFormData({...formData, prioridade: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dataVencimento">Data de Vencimento</Label>
                  <Input
                    id="edit-dataVencimento"
                    type="date"
                    value={formData.dataVencimento}
                    onChange={(e) => setFormData({...formData, dataVencimento: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-observacoes">Observações</Label>
                <Textarea
                  id="edit-observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  placeholder="Observações adicionais (opcional)"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEdit} className={`${classes.button} text-white`}>
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Tramitacao;