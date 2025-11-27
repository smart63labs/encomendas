import React, { useState, useRef } from 'react';
import Layout from "@/components/layout/Layout";
import { useModuleTheme } from "@/lib/theme-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpandableCard } from "@/components/ui/expandable-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Archive, 
  Folder, 
  FileText, 
  Search, 
  Upload, 
  Download, 
  Eye, 
  Lock, 
  Unlock,
  Calendar,
  User,
  HardDrive,
  FolderOpen,
  Filter,
  Clock,
  FileImage,
  FileVideo,
  X,
  Plus,
  Grid3X3,
  List,
  Trash2
} from "lucide-react";
import { mockBackend } from '@/lib/mock-backend';
import { useNotification } from '@/hooks/use-notification';
import NotificationModal from '@/components/ui/notification-modal';

const Arquivo = () => {
  const { applyTheme, classes } = useModuleTheme('arquivo');
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("todos");
  const [estruturaView, setEstruturaView] = useState("pastas");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isVisualizarOpen, setIsVisualizarOpen] = useState(false);
  const [isEditarOpen, setIsEditarOpen] = useState(false);
  const [isExcluirOpen, setIsExcluirOpen] = useState(false);
  const [documentoSelecionado, setDocumentoSelecionado] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [editarDocumento, setEditarDocumento] = useState({
    nome: '',
    categoria: '',
    descricao: '',
    tags: '',
    pasta: '',
    nivelAcesso: 'publico',
    autor: '',
    assunto: '',
    status: 'ativo'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { notification, isOpen, showError, showSuccess, showInfo, showWarning, hideNotification } = useNotification();

  // Carregar documentos do backend
  React.useEffect(() => {
    const loadDocumentos = async () => {
      try {
        const docs = await mockBackend.getDocumentos();
        setDocumentos(docs);
      } catch (error) {
        console.error('Erro ao carregar documentos:', error);
      }
    };
    loadDocumentos();
  }, []);

  // Função para upload de arquivo
  const handleFileUpload = async (files: FileList | null, metadata: any) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Simular progresso de upload
        for (let progress = 0; progress <= 100; progress += 20) {
          setUploadProgress(progress);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const documento = {
          nome: file.name,
          tipo: file.type || 'application/octet-stream',
          extensao: file.name.substring(file.name.lastIndexOf('.')) || '',
          tamanho: file.size,
          categoria: metadata.categoria || 'Geral',
          descricao: metadata.descricao || '',
          tags: metadata.tags ? metadata.tags.split(',').map((tag: string) => tag.trim()) : [],
          pasta: metadata.pasta || 'Raiz',
          nivelAcesso: metadata.nivelAcesso || 'publico',
          dataUpload: new Date().toISOString(),
          uploadedBy: 'Usuário Atual',
          versao: 1,
          status: 'ativo',
          metadados: {
            autor: metadata.autor || '',
            assunto: metadata.assunto || '',
            palavrasChave: metadata.tags ? metadata.tags.split(',').map((tag: string) => tag.trim()) : [],
            dataDocumento: new Date().toISOString(),
            origem: 'Upload Manual'
          },
          historico: [{
            data: new Date().toISOString(),
            acao: 'criacao',
            usuario: 'Usuário Atual',
            observacao: 'Documento enviado via upload'
          }],
          permissoes: {
            visualizar: ['todos'],
            editar: ['admin', 'usuario'],
            excluir: ['admin']
          }
        };

        await mockBackend.createDocumento(documento);
      }

      // Recarregar documentos
      const docs = await mockBackend.getDocumentos();
      setDocumentos(docs);

      showInfo("Upload concluído", `${files.length} arquivo(s) enviado(s) com sucesso.`);

      setIsUploadModalOpen(false);
    } catch (error) {
      showError("Erro no upload", "Ocorreu um erro ao enviar os arquivos.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Função para visualizar documento
  const handleVisualizarDocumento = (documento: any) => {
    setDocumentoSelecionado(documento);
    setIsVisualizarOpen(true);
  };

  // Função para editar documento
  const handleEditarDocumento = (documento: any) => {
    setDocumentoSelecionado(documento);
    setEditarDocumento({
      nome: documento.nome,
      categoria: documento.categoria,
      descricao: documento.descricao || '',
      tags: documento.tags ? documento.tags.join(', ') : '',
      pasta: documento.pasta,
      nivelAcesso: documento.nivelAcesso,
      autor: documento.metadados?.autor || '',
      assunto: documento.metadados?.assunto || '',
      status: documento.status
    });
    setIsEditarOpen(true);
  };

  // Função para salvar edição
  const handleSalvarEdicao = async () => {
    try {
      if (!documentoSelecionado) return;

      const documentoAtualizado = {
        ...documentoSelecionado,
        nome: editarDocumento.nome,
        categoria: editarDocumento.categoria,
        descricao: editarDocumento.descricao,
        tags: editarDocumento.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        pasta: editarDocumento.pasta,
        nivelAcesso: editarDocumento.nivelAcesso,
        status: editarDocumento.status,
        metadados: {
          ...documentoSelecionado.metadados,
          autor: editarDocumento.autor,
          assunto: editarDocumento.assunto
        },
        historico: [
          ...documentoSelecionado.historico,
          {
            data: new Date().toISOString(),
            acao: 'edicao',
            usuario: 'Usuário Atual',
            observacao: 'Documento editado'
          }
        ]
      };

      await mockBackend.updateDocumento(documentoSelecionado.id, documentoAtualizado);
      const docs = await mockBackend.getDocumentos();
      setDocumentos(docs);
      
      setIsEditarOpen(false);
      setDocumentoSelecionado(null);
      
      showInfo("Documento atualizado", "As alterações foram salvas com sucesso.");
    } catch (error) {
      showError("Erro", "Não foi possível salvar as alterações.");
    }
  };

  // Função para confirmar exclusão
  const handleExcluirDocumento = (documento: any) => {
    setDocumentoSelecionado(documento);
    setIsExcluirOpen(true);
  };

  // Função para excluir documento
  const handleConfirmarExclusao = async () => {
    try {
      if (!documentoSelecionado) return;

      await mockBackend.deleteDocumento(documentoSelecionado.id);
      const docs = await mockBackend.getDocumentos();
      setDocumentos(docs);
      
      setIsExcluirOpen(false);
      setDocumentoSelecionado(null);
      
      showInfo("Documento excluído", "O documento foi removido com sucesso.");
    } catch (error) {
      showError("Erro", "Não foi possível excluir o documento.");
    }
  };

  // Função para formatar tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Componente do Modal de Upload
  const UploadModal = ({ onUpload, isUploading, uploadProgress }: any) => {
    const [uploadData, setUploadData] = useState({
      categoria: '',
      descricao: '',
      tags: '',
      pasta: 'Raiz',
      nivelAcesso: 'publico',
      autor: '',
      assunto: ''
    });
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onUpload(selectedFiles, uploadData);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedFiles(e.target.files);
    };

    return (
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload de Documento</DialogTitle>
          <DialogDescription>
            Selecione os arquivos e preencha as informações do documento.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="files">Arquivos</Label>
            <Input
              id="files"
              type="file"
              multiple
              onChange={handleFileSelect}
              disabled={isUploading}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="categoria">Categoria</Label>
            <Select value={uploadData.categoria} onValueChange={(value) => setUploadData({...uploadData, categoria: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Geral">Geral</SelectItem>
                <SelectItem value="Contratos">Contratos</SelectItem>
                <SelectItem value="Relatórios">Relatórios</SelectItem>
                <SelectItem value="Correspondências">Correspondências</SelectItem>
                <SelectItem value="Processos">Processos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="pasta">Pasta</Label>
            <Select value={uploadData.pasta} onValueChange={(value) => setUploadData({...uploadData, pasta: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Raiz">Raiz</SelectItem>
                <SelectItem value="Administrativo">Administrativo</SelectItem>
                <SelectItem value="Jurídico">Jurídico</SelectItem>
                <SelectItem value="Financeiro">Financeiro</SelectItem>
                <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="nivelAcesso">Nível de Acesso</Label>
            <Select value={uploadData.nivelAcesso} onValueChange={(value) => setUploadData({...uploadData, nivelAcesso: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="publico">Público</SelectItem>
                <SelectItem value="restrito">Restrito</SelectItem>
                <SelectItem value="confidencial">Confidencial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="autor">Autor</Label>
            <Input
              id="autor"
              value={uploadData.autor}
              onChange={(e) => setUploadData({...uploadData, autor: e.target.value})}
              placeholder="Nome do autor do documento"
              disabled={isUploading}
            />
          </div>

          <div>
            <Label htmlFor="assunto">Assunto</Label>
            <Input
              id="assunto"
              value={uploadData.assunto}
              onChange={(e) => setUploadData({...uploadData, assunto: e.target.value})}
              placeholder="Assunto principal do documento"
              disabled={isUploading}
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={uploadData.descricao}
              onChange={(e) => setUploadData({...uploadData, descricao: e.target.value})}
              placeholder="Descrição do documento..."
              disabled={isUploading}
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input
              id="tags"
              value={uploadData.tags}
              onChange={(e) => setUploadData({...uploadData, tags: e.target.value})}
              placeholder="tag1, tag2, tag3"
              disabled={isUploading}
            />
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Enviando...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={!selectedFiles || isUploading} className="flex-1">
              {isUploading ? 'Enviando...' : 'Fazer Upload'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsUploadModalOpen(false)} disabled={isUploading}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    );
  };

  const mockDocumentos = [
    {
      id: 1,
      nome: "Contrato de Prestação de Serviços - 2024",
      tipo: "contrato",
      pasta: "/Contratos/2024",
      tamanho: "2.4 MB",
      formato: "PDF",
      dataUpload: "2024-12-01",
      usuario: "João Silva",
      versao: "1.2",
      status: "ativo",
      acesso: "restrito"
    },
    {
      id: 2,
      nome: "Parecer Técnico - Infraestrutura",
      tipo: "parecer",
      pasta: "/Pareceres/Técnicos",
      tamanho: "1.8 MB",
      formato: "PDF",
      dataUpload: "2024-11-28",
      usuario: "Maria Santos",
      versao: "1.0",
      status: "ativo",
      acesso: "publico"
    },
    {
      id: 3,
      nome: "Ata de Reunião - Dezembro",
      tipo: "ata",
      pasta: "/Atas/2024",
      tamanho: "856 KB",
      formato: "DOCX",
      dataUpload: "2024-12-05",
      usuario: "Pedro Costa",
      versao: "1.0",
      status: "arquivado",
      acesso: "restrito"
    }
  ];

  const estruturaPastas = [
    {
      nome: "Contratos",
      subpastas: ["2024", "2023", "Templates"],
      documentos: 45,
      tipo: "pasta"
    },
    {
      nome: "Pareceres", 
      subpastas: ["Técnicos", "Jurídicos", "Administrativos"],
      documentos: 32,
      tipo: "pasta"
    },
    {
      nome: "Atas",
      subpastas: ["2024", "2023"],
      documentos: 28,
      tipo: "pasta"
    }
  ];

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case "contrato":
        return <Badge className={classes.badge}>Contrato</Badge>;
      case "parecer":
        return <Badge className={classes.badgeSecondary}>Parecer</Badge>;
      case "ata":
        return <Badge className={classes.badgeOutline}>Ata</Badge>;
      default:
        return <Badge className={classes.badgeOutline}>{tipo}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativo":
        return <Badge className="bg-green-500 text-white">Ativo</Badge>;
      case "arquivado":
        return <Badge className={classes.badgeSecondary}>Arquivado</Badge>;
      default:
        return <Badge className={classes.badgeOutline}>Rascunho</Badge>;
    }
  };

  const getAcessoIcon = (acesso: string) => {
    return acesso === "restrito" ? (
      <Lock className="w-4 h-4 text-destructive" />
    ) : (
      <Unlock className="w-4 h-4 text-success" />
    );
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Arquivo Digital</h1>
            <p className="text-foreground-muted">Gestão e organização do arquivo digital</p>
          </div>
          <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
            <DialogTrigger asChild>
              <Button className={`flex items-center gap-2 ${classes.button} text-white`}>
                <Upload className="w-4 h-4" />
                Upload de Documento
              </Button>
            </DialogTrigger>
            <UploadModal onUpload={handleFileUpload} isUploading={isUploading} uploadProgress={uploadProgress} />
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground-secondary">
                Total de Documentos
              </CardTitle>
              <FileText className="h-4 w-4 text-foreground-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">1,247</div>
              <p className="text-xs text-foreground-muted">
                +18 este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground-secondary">
                Pastas Ativas
              </CardTitle>
              <Folder className="h-4 w-4 text-foreground-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">85</div>
              <p className="text-xs text-foreground-muted">
                Organizados em categorias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground-secondary">
                Espaço Usado
              </CardTitle>
              <HardDrive className="h-4 w-4 text-foreground-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">2.3 GB</div>
              <p className="text-xs text-foreground-muted">
                de 10 GB disponível
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground-secondary">
                Downloads Mês
              </CardTitle>
              <Download className="h-4 w-4 text-foreground-muted" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">324</div>
              <p className="text-xs text-foreground-muted">
                +12% vs mês anterior
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
                    placeholder="Buscar documentos, pastas ou conteúdo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as categorias</SelectItem>
                  <SelectItem value="Geral">Geral</SelectItem>
                  <SelectItem value="Contratos">Contratos</SelectItem>
                  <SelectItem value="Relatórios">Relatórios</SelectItem>
                  <SelectItem value="Correspondências">Correspondências</SelectItem>
                  <SelectItem value="Processos">Processos</SelectItem>
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
        <Tabs defaultValue="documentos" className="w-full">
          <TabsList>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
            <TabsTrigger value="estrutura">Estrutura de Pastas</TabsTrigger>
            <TabsTrigger value="pesquisa">Busca Avançada</TabsTrigger>
          </TabsList>

          <TabsContent value="documentos" className="mt-6">
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
              {mockDocumentos
                .filter(doc => {
                  const matchesSearch = doc.nome.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesType = tipoFilter === 'todos' || doc.tipo === tipoFilter;
                  return matchesSearch && matchesType;
                })
                .map((doc) => (
                <ExpandableCard
                  key={doc.id}
                  className={viewMode === 'grid' ? 'h-fit' : ''}
                  header={
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm text-foreground">{doc.nome}</span>
                      {getTipoBadge(doc.tipo)}
                      {getStatusBadge(doc.status)}
                      {getAcessoIcon(doc.acesso)}
                    </div>
                  }
                  actions={
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleVisualizarDocumento(doc)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditarDocumento(doc)}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleExcluirDocumento(doc)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  }
                  details={
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <FolderOpen className="w-4 h-4" />
                          <span className="text-xs text-foreground-muted">{doc.pasta}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span className="text-xs text-foreground-muted">{doc.usuario}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span className="text-xs text-foreground-muted">{new Date(doc.dataUpload).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-foreground-muted">
                        <span>Formato: {doc.formato}</span>
                        <span>Tamanho: {doc.tamanho}</span>
                        <span>Versão: {doc.versao}</span>
                      </div>
                    </div>
                  }
                >
                  {/* Conteúdo resumido opcional */}
                </ExpandableCard>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="estrutura" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Archive className="w-5 h-5" />
                  Estrutura de Pastas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {estruturaPastas.map((pasta, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Folder className="w-6 h-6 text-primary" />
                          <div>
                            <h3 className="font-medium text-foreground">{pasta.nome}</h3>
                            <p className="text-sm text-foreground-muted">
                              {pasta.documentos} documentos • {pasta.subpastas.length} subpastas
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Abrir
                        </Button>
                      </div>
                      <div className="mt-3 ml-9">
                        <div className="flex flex-wrap gap-2">
                          {pasta.subpastas.map((sub, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {sub}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pesquisa" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Busca Avançada com OCR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-foreground-muted">
                  Funcionalidade de OCR e busca textual em desenvolvimento
                </div>
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>

        {/* Modal de Visualização */}
        {isVisualizarOpen && documentoSelecionado && (
          <Dialog open={isVisualizarOpen} onOpenChange={setIsVisualizarOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Visualizar Documento</DialogTitle>
                <DialogDescription>
                  Detalhes completos do documento
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label className="text-sm font-medium">Nome do Arquivo</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded mt-1">{documentoSelecionado.nome}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Categoria</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded mt-1">{documentoSelecionado.categoria}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tipo</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded mt-1">{documentoSelecionado.tipo}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tamanho</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded mt-1">{formatFileSize(documentoSelecionado.tamanho)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded mt-1">{documentoSelecionado.status}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Nível de Acesso</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded mt-1">{documentoSelecionado.nivelAcesso}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium">Descrição</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded mt-1">{documentoSelecionado.descricao || 'Sem descrição'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Data de Upload</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded mt-1">{new Date(documentoSelecionado.dataUpload).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Enviado por</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded mt-1">{documentoSelecionado.uploadedBy}</p>
                </div>
                {documentoSelecionado.tags && documentoSelecionado.tags.length > 0 && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {documentoSelecionado.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Seção de Processo Vinculado */}
              <div className="mt-6 border-t pt-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Processo Vinculado
                </h3>
                {documentoSelecionado.processoId ? (() => {
                  const processo = mockBackend.getProcessoById(documentoSelecionado.processoId);
                  return processo ? (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FolderOpen className="h-4 w-4 text-blue-500" />
                        <div>
                          <div className="font-medium text-sm">{processo.numero}</div>
                          <div className="text-xs text-gray-600">{processo.assunto}</div>
                          <div className="text-xs text-gray-500">
                            {processo.tipo} • {processo.status} • {processo.responsavel}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            // Navegar para a página de processos (implementar navegação se necessário)
                            console.log('Navegar para processo:', processo.id);
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver Processo
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            if (documentoSelecionado?.id) {
                              mockBackend.desvincularDocumentoProcesso(documentoSelecionado.id);
                              // Recarregar dados
                              const documentoAtualizado = mockBackend.getDocumentoById(documentoSelecionado.id);
                              if (documentoAtualizado) {
                                setDocumentoSelecionado(documentoAtualizado);
                              }
                              loadDocumentos();
                            }
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                      Processo vinculado não encontrado (ID: {documentoSelecionado.processoId})
                    </div>
                  );
                })() : (
                  <div className="text-center py-6 text-gray-500">
                    <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Este documento não está vinculado a nenhum processo</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => {
                        // Implementar modal de seleção de processo
                        console.log('Abrir modal para vincular processo');
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Vincular Processo
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-6">
                <Button onClick={() => setIsVisualizarOpen(false)}>Fechar</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Modal de Edição */}
        {isEditarOpen && documentoSelecionado && (
          <Dialog open={isEditarOpen} onOpenChange={setIsEditarOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Documento</DialogTitle>
                <DialogDescription>
                  Altere as informações do documento
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="nome">Nome do Arquivo *</Label>
                  <Input
                    id="nome"
                    value={editarDocumento.nome}
                    onChange={(e) => setEditarDocumento({...editarDocumento, nome: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select value={editarDocumento.categoria} onValueChange={(value) => setEditarDocumento({...editarDocumento, categoria: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Geral">Geral</SelectItem>
                      <SelectItem value="Administrativo">Administrativo</SelectItem>
                      <SelectItem value="Jurídico">Jurídico</SelectItem>
                      <SelectItem value="Financeiro">Financeiro</SelectItem>
                      <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pasta">Pasta</Label>
                  <Input
                    id="pasta"
                    value={editarDocumento.pasta}
                    onChange={(e) => setEditarDocumento({...editarDocumento, pasta: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="nivelAcesso">Nível de Acesso</Label>
                  <Select value={editarDocumento.nivelAcesso} onValueChange={(value) => setEditarDocumento({...editarDocumento, nivelAcesso: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="publico">Público</SelectItem>
                      <SelectItem value="restrito">Restrito</SelectItem>
                      <SelectItem value="confidencial">Confidencial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={editarDocumento.status} onValueChange={(value) => setEditarDocumento({...editarDocumento, status: value})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="arquivado">Arquivado</SelectItem>
                      <SelectItem value="rascunho">Rascunho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="autor">Autor</Label>
                  <Input
                    id="autor"
                    value={editarDocumento.autor}
                    onChange={(e) => setEditarDocumento({...editarDocumento, autor: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={editarDocumento.descricao}
                    onChange={(e) => setEditarDocumento({...editarDocumento, descricao: e.target.value})}
                    className="mt-1 h-20"
                  />
                </div>
                <div>
                  <Label htmlFor="assunto">Assunto</Label>
                  <Input
                    id="assunto"
                    value={editarDocumento.assunto}
                    onChange={(e) => setEditarDocumento({...editarDocumento, assunto: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                  <Input
                    id="tags"
                    value={editarDocumento.tags}
                    onChange={(e) => setEditarDocumento({...editarDocumento, tags: e.target.value})}
                    className="mt-1"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsEditarOpen(false)}>Cancelar</Button>
                <Button onClick={handleSalvarEdicao}>Salvar Alterações</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Modal de Exclusão */}
        {isExcluirOpen && documentoSelecionado && (
          <Dialog open={isExcluirOpen} onOpenChange={setIsExcluirOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-red-600">Confirmar Exclusão</DialogTitle>
                <DialogDescription>
                  Esta ação não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              
              <div className="mt-4">
                <p className="text-gray-700 mb-2">
                  Tem certeza que deseja excluir o documento:
                </p>
                <p className="font-semibold">{documentoSelecionado.nome}</p>
                <p className="text-sm text-gray-600">{documentoSelecionado.categoria}</p>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsExcluirOpen(false)}>Cancelar</Button>
                <Button variant="destructive" onClick={handleConfirmarExclusao}>
                  Excluir Documento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
};

export default Arquivo;