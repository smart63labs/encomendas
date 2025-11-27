import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { useModuleTheme } from "@/lib/theme-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ExpandableCard from "@/components/ui/expandable-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Clock, AlertTriangle, CheckCircle, Search, Calendar, FileText, User, Plus, Edit, Trash2, Eye, Grid3X3, List } from "lucide-react";
import { mockBackend } from "@/lib/mock-backend";
import type { Prazo } from "@/lib/mock-backend";
import CalendarioPrazos from "@/components/calendario/CalendarioPrazos";
import { mockPrazosCalendario } from "@/data/mock-prazos-calendario";

const Prazos = () => {
  const { applyTheme, classes } = useModuleTheme('prazos');
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [prazos, setPrazos] = useState<Prazo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPrazo, setSelectedPrazo] = useState<Prazo | null>(null);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    responsavel: "",
    dataVencimento: "",
    status: "pendente" as const,
    prioridade: "media" as const,
    notificado: false
  });

  useEffect(() => {
    loadPrazos();
  }, []);

  const loadPrazos = async () => {
    try {
      setLoading(true);
      // Usando dados mockados para demonstração
      const data = mockPrazosCalendario;
      setPrazos(data);
    } catch (error) {
      toast.error("Erro ao carregar prazos");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: "",
      descricao: "",
      responsavel: "",
      dataVencimento: "",
      status: "pendente",
      prioridade: "media",
      notificado: false
    });
  };

  const handleCreate = async () => {
    try {
      await mockBackend.createPrazo(formData);
      toast.success("Prazo criado com sucesso!");
      setIsCreateModalOpen(false);
      resetForm();
      loadPrazos();
    } catch (error) {
      toast.error("Erro ao criar prazo");
    }
  };

  const handleEdit = async () => {
    if (!selectedPrazo) return;
    try {
      await mockBackend.updatePrazo(selectedPrazo.id, formData);
      toast.success("Prazo atualizado com sucesso!");
      setIsEditModalOpen(false);
      resetForm();
      setSelectedPrazo(null);
      loadPrazos();
    } catch (error) {
      toast.error("Erro ao atualizar prazo");
    }
  };

  const handleView = (prazo: Prazo) => {
    setSelectedPrazo(prazo);
    setIsViewModalOpen(true);
  };

  const handleEditClick = (prazo: Prazo) => {
    setSelectedPrazo(prazo);
    setFormData({
      titulo: prazo.titulo,
      descricao: prazo.descricao,
      responsavel: prazo.responsavel,
      dataVencimento: prazo.dataVencimento,
      status: prazo.status,
      prioridade: prazo.prioridade,
      notificado: prazo.notificado
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este prazo?")) {
      try {
        await mockBackend.deletePrazo(id);
        toast.success("Prazo excluído com sucesso!");
        loadPrazos();
      } catch (error) {
        toast.error("Erro ao excluir prazo");
      }
    }
  };

  const filteredPrazos = prazos.filter(prazo => {
    const matchesSearch = prazo.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prazo.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prazo.responsavel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || prazo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "vencido":
        return <Badge className="bg-red-500 text-white flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Vencido</Badge>;
      case "em_andamento":
        return <Badge className={`${classes.badge} flex items-center gap-1`}><Clock className="w-3 h-3" />Em Andamento</Badge>;
      case "concluido":
        return <Badge className="bg-green-500 text-white flex items-center gap-1"><CheckCircle className="w-3 h-3" />Concluído</Badge>;
      default:
        return <Badge className={`${classes.badgeOutline} flex items-center gap-1`}><Clock className="w-3 h-3" />Pendente</Badge>;
    }
  };

  const getPrioridadeBadge = (prioridade: string) => {
    switch (prioridade) {
      case "alta":
        return <Badge className="bg-red-500 text-white">Alta</Badge>;
      case "media":
        return <Badge className={classes.badgeSecondary}>Média</Badge>;
      default:
        return <Badge className={classes.badgeOutline}>Baixa</Badge>;
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Controle de Prazos</h1>
            <p className="text-foreground-muted">Monitoramento e gestão de prazos processuais</p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className={classes.button}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Prazo
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground-secondary">
                Total de Prazos
              </CardTitle>
              <Clock className="h-4 w-4 text-foreground-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{prazos.length}</div>
              <p className="text-xs text-foreground-muted">
                Prazos cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground-secondary">
                Vencidos
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{prazos.filter(p => p.status === 'vencido').length}</div>
              <p className="text-xs text-foreground-muted">
                Requer atenção
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground-secondary">
                Em Andamento
              </CardTitle>
              <Calendar className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{prazos.filter(p => p.status === 'em_andamento').length}</div>
              <p className="text-xs text-foreground-muted">
                Em execução
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground-secondary">
                Concluídos
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{prazos.filter(p => p.status === 'concluido').length}</div>
              <p className="text-xs text-foreground-muted">
                Finalizados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-foreground-muted" />
              <Input
                placeholder="Buscar por processo, descrição ou responsável..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
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

        {/* Tabs */}
        <Tabs defaultValue="lista" className="w-full">
          <TabsList>
            <TabsTrigger value="lista">Lista de Prazos</TabsTrigger>
            <TabsTrigger value="calendario">Calendário</TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="mt-6">
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
              {loading ? (
                <div className="text-center py-12 text-foreground-muted col-span-full">
                  Carregando prazos...
                </div>
              ) : filteredPrazos.length === 0 ? (
                <div className="text-center py-12 text-foreground-muted col-span-full">
                  Nenhum prazo encontrado
                </div>
              ) : (
                filteredPrazos.map((prazo) => (
                  <ExpandableCard
                    key={prazo.id}
                    className={viewMode === 'grid' ? 'h-fit' : ''}
                    header={
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm text-foreground">{prazo.titulo}</span>
                        {getStatusBadge(prazo.status)}
                        {getPrioridadeBadge(prazo.prioridade)}
                      </div>
                    }
                    actions={
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleView(prazo)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(prazo)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(prazo.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    }
                    details={
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <h5 className="font-semibold text-muted-foreground mb-1">Detalhes</h5>
                          <p className="text-foreground-secondary">{prazo.descricao || 'Sem descrição.'}</p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span className="text-xs text-foreground-muted">{prazo.responsavel}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs text-foreground-muted">Vencimento: {new Date(prazo.dataVencimento).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                    }
                  >
                    <div className="space-y-2">
                      <p className="text-xs text-foreground-secondary">{prazo.descricao}</p>
                      <div className="flex items-center gap-3 text-xs text-foreground-muted">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{prazo.responsavel}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Vencimento: {new Date(prazo.dataVencimento).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  </ExpandableCard>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="calendario" className="mt-6">
            <CalendarioPrazos 
              prazos={filteredPrazos} 
              onPrazoClick={handleView}
            />
          </TabsContent>


        </Tabs>

        {/* Modal de Criação */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Prazo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  placeholder="Título do prazo"
                />
              </div>
              <div>
                <Label htmlFor="responsavel">Responsável</Label>
                <Input
                  id="responsavel"
                  value={formData.responsavel}
                  onChange={(e) => setFormData({...formData, responsavel: e.target.value})}
                  placeholder="Nome do responsável"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                placeholder="Descrição do prazo"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="dataVencimento">Data de Vencimento</Label>
                <Input
                  id="dataVencimento"
                  type="date"
                  value={formData.dataVencimento}
                  onChange={(e) => setFormData({...formData, dataVencimento: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="prioridade">Prioridade</Label>
                <Select value={formData.prioridade} onValueChange={(value: any) => setFormData({...formData, prioridade: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate}>
                Criar Prazo
              </Button>
            </div>
          </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Edição */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Prazo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-titulo">Título</Label>
                <Input
                  id="edit-titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  placeholder="Título do prazo"
                />
              </div>
                <div>
                  <Label htmlFor="edit-responsavel">Responsável</Label>
                  <Input
                    id="edit-responsavel"
                    value={formData.responsavel}
                    onChange={(e) => setFormData({...formData, responsavel: e.target.value})}
                    placeholder="Nome do responsável"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-descricao">Descrição</Label>
                <Textarea
                  id="edit-descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  placeholder="Descrição do prazo"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-dataVencimento">Data de Vencimento</Label>
                  <Input
                    id="edit-dataVencimento"
                    type="date"
                    value={formData.dataVencimento}
                    onChange={(e) => setFormData({...formData, dataVencimento: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="vencido">Vencido</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-prioridade">Prioridade</Label>
                  <Select value={formData.prioridade} onValueChange={(value: any) => setFormData({...formData, prioridade: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleEdit}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Visualização */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Prazo</DialogTitle>
            </DialogHeader>
            {selectedPrazo && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                  <Label className="text-sm font-medium text-foreground-secondary">Título</Label>
                  <p className="text-foreground">{selectedPrazo.titulo}</p>
                </div>
                  <div>
                    <Label className="text-sm font-medium text-foreground-secondary">Responsável</Label>
                    <p className="text-foreground">{selectedPrazo.responsavel}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground-secondary">Descrição</Label>
                  <p className="text-foreground">{selectedPrazo.descricao}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-foreground-secondary">Data de Vencimento</Label>
                    <p className="text-foreground">{new Date(selectedPrazo.dataVencimento).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-foreground-secondary">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedPrazo.status)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-foreground-secondary">Prioridade</Label>
                    <div className="mt-1">{getPrioridadeBadge(selectedPrazo.prioridade)}</div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Prazos;