import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useModuleTheme } from "@/lib/theme-config";
import { mockBackend } from "@/lib/mock-backend";
import type { Processo } from "@/lib/mock-backend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useDocumentViewer } from "../components/visualizadores";
import { DocumentViewer, type DocumentFile } from "@/components/ui/document-viewer";
import { 
  FolderOpen, 
  Search, 
  Plus, 
  Calendar, 
  User, 
  Clock, 
  Hash, 
  Eye,
  Edit,
  Archive,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Folder,
  FileText,
  Grid3X3,
  List,
  Trash2,
  X
} from "lucide-react";

const Processos = () => {
  const { classes } = useModuleTheme('processos');
  const { openViewer, ViewerComponent } = useDocumentViewer();
  const location = useLocation();
  
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isNovoProcessoOpen, setIsNovoProcessoOpen] = useState(false);
  const [isVisualizarOpen, setIsVisualizarOpen] = useState(false);
  const [isEditarOpen, setIsEditarOpen] = useState(false);
  const [isExcluirOpen, setIsExcluirOpen] = useState(false);
  const [processoSelecionado, setProcessoSelecionado] = useState<Processo | null>(null);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoProcesso, setNovoProcesso] = useState({
    tipo: '',
    assunto: '',
    interessado: '',
    responsavel: '',
    prazoLimite: '',
    volumes: 1,
    observacoes: '',
    prioridade: 'media' as 'alta' | 'media' | 'baixa'
  });
  const [editarProcesso, setEditarProcesso] = useState({
    tipo: '',
    assunto: '',
    interessado: '',
    responsavel: '',
    prazoLimite: '',
    volumes: 1,
    observacoes: '',
    prioridade: 'media' as 'alta' | 'media' | 'baixa',
    status: 'em_andamento' as 'em_andamento' | 'concluido' | 'arquivado' | 'suspenso',
    fase: '',
    progresso: 0
  });

  useEffect(() => {
    carregarProcessos();
    
    // Verificar se há parâmetro de pesquisa na URL
    const searchParams = new URLSearchParams(location.search);
    const searchTerm = searchParams.get('search');
    if (searchTerm) {
      setBusca(decodeURIComponent(searchTerm));
    }
  }, [location.search]);

  const carregarProcessos = async () => {
    try {
      setLoading(true);
      const data = await mockBackend.getProcessos();
      setProcessos(data);
    } catch (error) {
      console.error('Erro ao carregar processos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCriarProcesso = async () => {
    try {
      if (!novoProcesso.tipo || !novoProcesso.assunto || !novoProcesso.interessado || !novoProcesso.responsavel) {
        alert('Preencha todos os campos obrigatórios');
        return;
      }

      // Gerar número do processo
      const ano = new Date().getFullYear();
      const numeroSequencial = String(processos.length + 1).padStart(6, '0');
      const numeroProcesso = `${ano}.001.${numeroSequencial}`;

      await mockBackend.createProcesso({
        ...novoProcesso,
        numero: numeroProcesso,
        dataAbertura: new Date().toISOString().split('T')[0],
        status: 'em_andamento',
        fase: 'Iniciado',
        progresso: 0,
        documentos: [],
        historico: [{
          data: new Date().toISOString().split('T')[0],
          acao: 'Abertura do processo',
          usuario: novoProcesso.responsavel
        }]
      });

      setNovoProcesso({
        tipo: '',
        assunto: '',
        interessado: '',
        responsavel: '',
        prazoLimite: '',
        volumes: 1,
        observacoes: '',
        prioridade: 'media'
      });
      setIsNovoProcessoOpen(false);
      carregarProcessos();
    } catch (error) {
      console.error('Erro ao criar processo:', error);
      alert('Erro ao criar processo');
    }
  };

  const handleVisualizarProcesso = (processo: Processo) => {
    setProcessoSelecionado(processo);
    setIsVisualizarOpen(true);
  };

  const handleEditarProcesso = (processo: Processo) => {
    setProcessoSelecionado(processo);
    setEditarProcesso({
      tipo: processo.tipo,
      assunto: processo.assunto,
      interessado: processo.interessado,
      responsavel: processo.responsavel,
      prazoLimite: processo.prazoLimite || '',
      volumes: processo.volumes,
      observacoes: processo.observacoes || '',
      prioridade: processo.prioridade,
      status: processo.status,
      fase: processo.fase,
      progresso: processo.progresso
    });
    setIsEditarOpen(true);
  };

  const handleSalvarEdicao = async () => {
    try {
      if (!processoSelecionado) return;

      await mockBackend.updateProcesso(processoSelecionado.id, {
        ...editarProcesso,
        historico: [
          ...processoSelecionado.historico,
          {
            data: new Date().toISOString().split('T')[0],
            acao: 'Processo editado',
            usuario: editarProcesso.responsavel
          }
        ]
      });

      setIsEditarOpen(false);
      setProcessoSelecionado(null);
      carregarProcessos();
    } catch (error) {
      console.error('Erro ao editar processo:', error);
      alert('Erro ao editar processo');
    }
  };

  const handleExcluirProcesso = (processo: Processo) => {
    setProcessoSelecionado(processo);
    setIsExcluirOpen(true);
  };

  const handleConfirmarExclusao = async () => {
    try {
      if (!processoSelecionado) return;

      await mockBackend.deleteProcesso(processoSelecionado.id);
      setIsExcluirOpen(false);
      setProcessoSelecionado(null);
      carregarProcessos();
    } catch (error) {
      console.error('Erro ao excluir processo:', error);
      alert('Erro ao excluir processo');
    }
  };

  const processosFiltrados = processos.filter(processo => {
    const matchBusca = !busca || 
      processo.numero.toLowerCase().includes(busca.toLowerCase()) ||
      processo.assunto.toLowerCase().includes(busca.toLowerCase()) ||
      processo.interessado.toLowerCase().includes(busca.toLowerCase());
    
    const matchTipo = !filtroTipo || filtroTipo === 'todos-tipos' || processo.tipo === filtroTipo;
    const matchStatus = !filtroStatus || filtroStatus === 'todos-status' || processo.status === filtroStatus;
    
    return matchBusca && matchTipo && matchStatus;
  });

  const stats = {
    total: processos.length,
    emAndamento: processos.filter(p => p.status === 'em_andamento').length,
    suspensos: processos.filter(p => p.status === 'suspenso').length,
    concluidos: processos.filter(p => p.status === 'concluido').length
  };

  // Documentos de exemplo para demonstração
  const documentosExemplo: DocumentFile[] = [
    {
      id: "1",
      name: "Edital_Licitacao_2024.pdf",
      type: "pdf",
      url: "/docs/edital_exemplo.pdf",
      size: "2.4 MB",
      uploadDate: "15/11/2024"
    },
    {
      id: "2",
      name: "Termo_Referencia.pdf",
      type: "pdf",
      url: "/docs/termo_referencia.pdf",
      size: "1.8 MB",
      uploadDate: "15/11/2024"
    },
    {
      id: "3",
      name: "Planta_Baixa.jpg",
      type: "image",
      url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      size: "856 KB",
      uploadDate: "16/11/2024"
    },
    {
      id: "4",
      name: "Orcamento_Detalhado.pdf",
      type: "pdf",
      url: "/docs/orcamento.pdf",
      size: "3.2 MB",
      uploadDate: "18/11/2024"
    }
  ];



  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case "licitacao":
        return <Badge className={classes.badge}>Licitação</Badge>;
      case "administrativa":
        return <Badge className={classes.badgeSecondary}>Administrativo</Badge>;
      case "compras":
        return <Badge className={classes.badgeOutline}>Compras</Badge>;
      case "juridico":
        return <Badge className={classes.badgeOutline}>Jurídico</Badge>;
      default:
        return <Badge className={classes.badgeOutline}>{tipo}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "em_andamento":
        return <Badge className={`${classes.badge} flex items-center gap-1`}>
          <Play className="w-3 h-3" />Em Andamento
        </Badge>;
      case "suspenso":
        return <Badge className={`${classes.badgeSecondary} flex items-center gap-1`}>
          <Pause className="w-3 h-3" />Suspenso
        </Badge>;
      case "concluido":
        return <Badge className="bg-green-500 text-white flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />Concluído
        </Badge>;
      case "arquivado":
        return <Badge className={`${classes.badgeOutline} flex items-center gap-1`}>
          <Archive className="w-3 h-3" />Arquivado
        </Badge>;
      default:
        return <Badge className={classes.badgeOutline}>{status}</Badge>;
    }
  };

  const getPrioridadeBadge = (prioridade: string) => {
    switch (prioridade) {
      case "alta":
        return <Badge className="bg-red-500 text-white">Alta</Badge>;
      case "media":
        return <Badge className={classes.badgeSecondary}>Média</Badge>;
      case "normal":
        return <Badge className={classes.badgeOutline}>Normal</Badge>;
      default:
        return <Badge className={classes.badgeOutline}>{prioridade}</Badge>;
    }
  };

  const getProgressColor = (progresso: number) => {
    if (progresso >= 80) return "bg-success";
    if (progresso >= 50) return "bg-primary";
    if (progresso >= 25) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestão de Processos Administrativos</h1>
            <p className="text-foreground-muted">Abertura, controle e tramitação de processos</p>
          </div>
          <Dialog open={isNovoProcessoOpen} onOpenChange={setIsNovoProcessoOpen}>
            <DialogTrigger asChild>
              <Button className={`flex items-center gap-2 ${classes.button} text-white`}>
                <Plus className="w-4 h-4" />
                Novo Processo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Abertura de Novo Processo</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo de Processo</Label>
                    <Select value={novoProcesso.tipo} onValueChange={(value) => setNovoProcesso({...novoProcesso, tipo: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="licitacao">Licitação</SelectItem>
                        <SelectItem value="administrativa">Administrativo</SelectItem>
                        <SelectItem value="compras">Compras</SelectItem>
                        <SelectItem value="juridico">Jurídico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prioridade">Prioridade</Label>
                    <Select value={novoProcesso.prioridade} onValueChange={(value: 'alta' | 'media' | 'baixa') => setNovoProcesso({...novoProcesso, prioridade: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="baixa">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assunto">Assunto do Processo</Label>
                  <Input 
                    placeholder="Digite o assunto do processo" 
                    value={novoProcesso.assunto}
                    onChange={(e) => setNovoProcesso({...novoProcesso, assunto: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interessado">Interessado/Solicitante</Label>
                    <Input 
                      placeholder="Nome do interessado" 
                      value={novoProcesso.interessado}
                      onChange={(e) => setNovoProcesso({...novoProcesso, interessado: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsavel">Responsável</Label>
                    <Input 
                      placeholder="Nome do responsável" 
                      value={novoProcesso.responsavel}
                      onChange={(e) => setNovoProcesso({...novoProcesso, responsavel: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prazoLimite">Prazo Limite</Label>
                    <Input 
                      type="date" 
                      value={novoProcesso.prazoLimite}
                      onChange={(e) => setNovoProcesso({...novoProcesso, prazoLimite: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="volumes">Número de Volumes</Label>
                    <Input 
                      type="number" 
                      placeholder="1" 
                      min="1" 
                      value={novoProcesso.volumes}
                      onChange={(e) => setNovoProcesso({...novoProcesso, volumes: parseInt(e.target.value) || 1})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea 
                    placeholder="Observações iniciais do processo" 
                    value={novoProcesso.observacoes}
                    onChange={(e) => setNovoProcesso({...novoProcesso, observacoes: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsNovoProcessoOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCriarProcesso}>
                  Abrir Processo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground-secondary">
                Total de Processos
              </CardTitle>
              <FolderOpen className="h-4 w-4 text-foreground-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <p className="text-xs text-foreground-muted">
                Total de processos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground-secondary">
                Em Andamento
              </CardTitle>
              <Play className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.emAndamento}</div>
              <p className="text-xs text-foreground-muted">
                Tramitando normalmente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground-secondary">
                Com Atraso
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.suspensos}</div>
              <p className="text-xs text-foreground-muted">
                Processos suspensos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground-secondary">
                Concluídos Mês
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.concluidos}</div>
              <p className="text-xs text-foreground-muted">
                Processos finalizados
              </p>
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
                    placeholder="Buscar por número, assunto ou interessado..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos-tipos">Todos os Tipos</SelectItem>
                  <SelectItem value="licitacao">Licitação</SelectItem>
                  <SelectItem value="administrativa">Administrativo</SelectItem>
                  <SelectItem value="compras">Compras</SelectItem>
                  <SelectItem value="juridico">Jurídico</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos-status">Todos os Status</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="arquivado">Arquivado</SelectItem>
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

        {/* Tabs */}
        <Tabs defaultValue="lista" className="w-full">
          <TabsList>
            <TabsTrigger value="lista">Lista de Processos</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="fases">Controle de Fases</TabsTrigger>
            <TabsTrigger value="volumes">Gestão de Volumes</TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="mt-6">
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-foreground-muted">Carregando processos...</p>
                </div>
              ) : processosFiltrados.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-foreground-muted">Nenhum processo encontrado</p>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                  {processosFiltrados.map((processo) => (
                    <Card key={processo.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex items-center gap-2">
                                <Hash className="w-4 h-4 text-primary" />
                                <span className="font-mono text-sm text-primary font-medium">{processo.numero}</span>
                              </div>
                              {getTipoBadge(processo.tipo)}
                              {getStatusBadge(processo.status)}
                              {getPrioridadeBadge(processo.prioridade)}
                            </div>
                            
                            <h3 className="font-medium text-foreground">{processo.assunto}</h3>
                            
                            <div className={`grid gap-4 text-sm text-foreground-muted ${viewMode === 'grid' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span className="font-medium">Interessado:</span> {processo.interessado}
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span className="font-medium">Responsável:</span> {processo.responsavel}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span className="font-medium">Abertura:</span> {new Date(processo.dataAbertura).toLocaleDateString('pt-BR')}
                              </div>
                              <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">Prazo:</span> {new Date(processo.prazoLimite).toLocaleDateString('pt-BR')}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-foreground-muted">Fase Atual: <span className="font-medium text-foreground">{processo.fase}</span></span>
                            <span className="text-foreground-muted">{processo.progresso}% concluído</span>
                          </div>
                          <Progress value={processo.progresso} className="h-2" />
                        </div>

                        <div className="flex items-center gap-4 text-xs text-foreground-muted">
                          <div className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {processo.documentos?.length || 0} documento{(processo.documentos?.length || 0) > 1 ? 's' : ''}
                          </div>
                          <div className="flex items-center gap-1">
                            <Folder className="w-3 h-3" />
                            {processo.volumes} volume{processo.volumes > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleVisualizarProcesso(processo)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditarProcesso(processo)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleExcluirProcesso(processo)}
                        >
                          <Archive className="w-4 h-4 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="documentos" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Visualizador de Documentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Demonstração do componente de visualização de documentos com suporte a PDFs e imagens.
                  </p>
                  <DocumentViewer documents={documentosExemplo} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="fases" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Controle de Fases por Tipo de Processo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-foreground-muted">
                  Gestão de fases processuais em desenvolvimento
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="volumes" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Controle de Volumes (Físico e Digital)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-foreground-muted">
                  Gestão de volumes em desenvolvimento
                </div>
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
        
        {/* Visualizador de Documentos */}
        {ViewerComponent}

        {/* Modal de Visualização */}
        {isVisualizarOpen && processoSelecionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Visualizar Processo</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsVisualizarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Número</label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{processoSelecionado.numero}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo</label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{processoSelecionado.tipo}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Assunto</label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{processoSelecionado.assunto}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Interessado</label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{processoSelecionado.interessado}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Responsável</label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{processoSelecionado.responsavel}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{processoSelecionado.status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Prioridade</label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{processoSelecionado.prioridade}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data de Abertura</label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{processoSelecionado.dataAbertura}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fase Atual</label>
                  <p className="text-sm bg-gray-50 p-2 rounded">{processoSelecionado.fase}</p>
                </div>
                {processoSelecionado.observacoes && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Observações</label>
                    <p className="text-sm bg-gray-50 p-2 rounded">{processoSelecionado.observacoes}</p>
                  </div>
                )}
              </div>
              
              {/* Seção de Documentos Vinculados */}
              <div className="mb-6">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documentos Vinculados ({processoSelecionado?.documentos?.length || 0})
                </h3>
                {processoSelecionado?.documentos && processoSelecionado.documentos.length > 0 ? (
                  <div className="space-y-2">
                    {processoSelecionado.documentos.map((docId) => {
                      const documento = mockBackend.getDocumentoById(docId);
                      if (!documento) return null;
                      return (
                        <div key={docId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-blue-500" />
                            <div>
                              <div className="font-medium text-sm">{documento.nome}</div>
                              <div className="text-xs text-gray-500">
                                {documento.categoria} • {(documento.tamanho / 1024).toFixed(1)} KB
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                if (documento.url) {
                                  openViewer(documento.url, documento.nome, documento.tipo);
                                }
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                if (processoSelecionado?.id) {
                                  mockBackend.desvincularDocumentoProcesso(docId);
                                  // Recarregar dados
                                  const processoAtualizado = mockBackend.getProcessoById(processoSelecionado.id);
                                  if (processoAtualizado) {
                                    setProcessoSelecionado(processoAtualizado);
                                  }
                                }
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum documento vinculado a este processo</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => setIsVisualizarOpen(false)}>Fechar</Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edição */}
        {isEditarOpen && processoSelecionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Editar Processo</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsEditarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo *</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={editarProcesso.tipo}
                    onChange={(e) => setEditarProcesso({...editarProcesso, tipo: e.target.value})}
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="Administrativo">Administrativo</option>
                    <option value="Jurídico">Jurídico</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="Recursos Humanos">Recursos Humanos</option>
                    <option value="Licitação">Licitação</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Prioridade</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={editarProcesso.prioridade}
                    onChange={(e) => setEditarProcesso({...editarProcesso, prioridade: e.target.value as 'alta' | 'media' | 'baixa'})}
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Assunto *</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md"
                    value={editarProcesso.assunto}
                    onChange={(e) => setEditarProcesso({...editarProcesso, assunto: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Interessado *</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md"
                    value={editarProcesso.interessado}
                    onChange={(e) => setEditarProcesso({...editarProcesso, interessado: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Responsável *</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md"
                    value={editarProcesso.responsavel}
                    onChange={(e) => setEditarProcesso({...editarProcesso, responsavel: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={editarProcesso.status}
                    onChange={(e) => setEditarProcesso({...editarProcesso, status: e.target.value as 'em_andamento' | 'concluido' | 'arquivado' | 'suspenso'})}
                  >
                    <option value="em_andamento">Em Andamento</option>
                    <option value="concluido">Concluído</option>
                    <option value="arquivado">Arquivado</option>
                    <option value="suspenso">Suspenso</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fase Atual</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-md"
                    value={editarProcesso.fase}
                    onChange={(e) => setEditarProcesso({...editarProcesso, fase: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Observações</label>
                  <textarea 
                    className="w-full p-2 border rounded-md h-20"
                    value={editarProcesso.observacoes}
                    onChange={(e) => setEditarProcesso({...editarProcesso, observacoes: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditarOpen(false)}>Cancelar</Button>
                <Button onClick={handleSalvarEdicao}>Salvar Alterações</Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Exclusão */}
        {isExcluirOpen && processoSelecionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-red-600">Confirmar Exclusão</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsExcluirOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Tem certeza que deseja excluir o processo:
                </p>
                <p className="font-semibold">{processoSelecionado.numero}</p>
                <p className="text-sm text-gray-600">{processoSelecionado.assunto}</p>
                <p className="text-red-600 text-sm mt-2">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsExcluirOpen(false)}>Cancelar</Button>
                <Button 
                  variant="destructive" 
                  onClick={handleConfirmarExclusao}
                >
                  Excluir Processo
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Processos;