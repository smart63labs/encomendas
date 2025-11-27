import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ExpandableCard from '@/components/ui/expandable-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useModuleTheme } from '@/hooks/useModuleTheme';
import { mockBackend, Documento } from '@/lib/mock-backend';
import Layout from '@/components/layout/Layout';
import { useDocumentViewer } from '@/components/visualizadores';
import { getDocumentoStatusColor } from '@/utils/badge-colors';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  FolderOpen,
  Clock,
  User,
  Tag,
  Shield,
  History,
  FileCheck,
  AlertCircle,
  Archive,
  Grid3X3,
  List
} from 'lucide-react';

const Documentos: React.FC = () => {
  const theme = useModuleTheme('documentos');
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isNovoDocumentoOpen, setIsNovoDocumentoOpen] = useState(false);
  const [selectedDocumento, setSelectedDocumento] = useState<Documento | null>(null);
  const { openViewer, ViewerComponent } = useDocumentViewer();

  const [novoDocumento, setNovoDocumento] = useState({
    nome: '',
    extensao: '',
    categoria: '',
    descricao: '',
    tags: '',
    nivelAcesso: 'publico' as const
  });

  useEffect(() => {
    carregarDocumentos();
  }, []);

  const carregarDocumentos = () => {
    setLoading(true);
    try {
      const docs = mockBackend.getDocumentos();
      setDocumentos(docs);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const documentosFiltrados = documentos.filter(doc => {
    const matchBusca = !busca || 
      doc.nome.toLowerCase().includes(busca.toLowerCase()) ||
      doc.descricao?.toLowerCase().includes(busca.toLowerCase());
    
    const matchCategoria = filtroCategoria === 'todas' || !filtroCategoria || doc.categoria === filtroCategoria;
    const matchStatus = filtroStatus === 'todos' || !filtroStatus || doc.status === filtroStatus;
    
    return matchBusca && matchCategoria && matchStatus;
  });

  const handleCriarDocumento = () => {
    try {
      const documento = {
        id: Date.now().toString(),
        nome: novoDocumento.nome,
        extensao: novoDocumento.extensao,
        categoria: novoDocumento.categoria,
        descricao: novoDocumento.descricao,
        tags: novoDocumento.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        nivelAcesso: novoDocumento.nivelAcesso,
        status: 'ativo' as const,
        dataCriacao: new Date().toISOString(),
        dataModificacao: new Date().toISOString(),
        tamanho: 0,
        historico: [{
          acao: 'criacao',
          usuario: 'Usuário Atual',
          data: new Date().toISOString()
        }],
        permissoes: {
          visualizar: ['todos'],
          editar: ['admin'],
          excluir: ['admin']
        }
      };
      mockBackend.createDocumento(documento);
      carregarDocumentos();
      resetFormulario();
      setIsNovoDocumentoOpen(false);
    } catch (error) {
      console.error('Erro ao criar documento:', error);
    }
  };

  const resetFormulario = () => {
    setNovoDocumento({
      nome: '',
      extensao: '',
      categoria: '',
      descricao: '',
      tags: '',
      nivelAcesso: 'publico'
    });
  };

  const getFileIcon = (extensao: string | undefined) => {
    if (!extensao) return '📄';
    switch (extensao.toLowerCase()) {
      case 'pdf': return '📕';
      case 'doc': case 'docx': return '📘';
      case 'xls': case 'xlsx': return '📗';
      case 'ppt': case 'pptx': return '📙';
      default: return '📄';
    }
  };

  const stats = {
    total: documentos.length,
    ativos: documentos.filter(d => d.status === 'ativo').length,
    arquivados: documentos.filter(d => d.status === 'arquivado').length,
    rascunhos: documentos.filter(d => d.status === 'rascunho').length
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          <div className="text-center">Carregando...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-6" style={{ backgroundColor: theme.background, color: theme.text }}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" style={{ color: theme.primary }} />
              Gestão de Documentos
            </h1>
            <p className="text-muted-foreground">Controle e organização de documentos administrativos</p>
          </div>
          <Dialog open={isNovoDocumentoOpen} onOpenChange={setIsNovoDocumentoOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" style={{ backgroundColor: theme.primary, color: 'white' }}>
                <Plus className="h-4 w-4" />
                Novo Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Documento</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome do Documento</Label>
                    <Input
                      id="nome"
                      value={novoDocumento.nome}
                      onChange={(e) => setNovoDocumento({...novoDocumento, nome: e.target.value})}
                      placeholder="Digite o nome do documento"
                    />
                  </div>
                  <div>
                    <Label htmlFor="extensao">Extensão</Label>
                    <Input
                      id="extensao"
                      value={novoDocumento.extensao}
                      onChange={(e) => setNovoDocumento({...novoDocumento, extensao: e.target.value})}
                      placeholder="pdf, doc, xlsx..."
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select value={novoDocumento.categoria} onValueChange={(value) => setNovoDocumento({...novoDocumento, categoria: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="oficio">Ofício</SelectItem>
                        <SelectItem value="memorando">Memorando</SelectItem>
                        <SelectItem value="relatorio">Relatório</SelectItem>
                        <SelectItem value="ata">Ata</SelectItem>
                        <SelectItem value="contrato">Contrato</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="nivelAcesso">Nível de Acesso</Label>
                    <Select value={novoDocumento.nivelAcesso} onValueChange={(value: any) => setNovoDocumento({...novoDocumento, nivelAcesso: value})}>
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
                </div>
                
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={novoDocumento.descricao}
                    onChange={(e) => setNovoDocumento({...novoDocumento, descricao: e.target.value})}
                    placeholder="Descrição do documento"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                  <Input
                    id="tags"
                    value={novoDocumento.tags}
                    onChange={(e) => setNovoDocumento({...novoDocumento, tags: e.target.value})}
                    placeholder="urgente, importante, fiscal..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsNovoDocumentoOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCriarDocumento} style={{ backgroundColor: theme.primary, color: 'white' }}>
                  Criar Documento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.ativos}</p>
                </div>
                <FileCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Arquivados</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.arquivados}</p>
                </div>
                <Archive className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rascunhos</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.rascunhos}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
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
                    placeholder="Buscar documentos..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filtroCategoria} onValueChange={(value) => setFiltroCategoria(value === 'todas' ? '' : value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="oficio">Ofício</SelectItem>
                  <SelectItem value="memorando">Memorando</SelectItem>
                  <SelectItem value="relatorio">Relatório</SelectItem>
                  <SelectItem value="ata">Ata</SelectItem>
                  <SelectItem value="contrato">Contrato</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroStatus} onValueChange={(value) => setFiltroStatus(value === 'todos' ? '' : value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="arquivado">Arquivado</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
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

        {/* Lista de Documentos */}
        <Card>
          <CardHeader>
            <CardTitle>Documentos ({documentosFiltrados.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {documentosFiltrados.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum documento encontrado</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
                {documentosFiltrados.map((documento) => (
                  <ExpandableCard
                    key={documento.id}
                    header={
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getFileIcon(documento.extensao)}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground">{documento.nome}</span>
                          <Badge variant="outline" className="text-xs">{documento.categoria}</Badge>
                          <Badge className={`${getDocumentoStatusColor(documento.status)} text-xs px-2 py-0`}>{documento.status}</Badge>
                        </div>
                      </div>
                    }
                    actions={
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          const fileUrl = documento.url || `/api/documentos/${documento.id}/download`;
                          openViewer(fileUrl, documento.nome, documento.extensao);
                        }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    }
                    details={
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          {documento.tags && documento.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {documento.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {documento.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{documento.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                          {documento.descricao && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {documento.descricao}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center justify-between">
                            <span>Data</span>
                            <span>{new Date(documento.dataCriacao).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Tamanho</span>
                            <span>{documento.tamanho ? `${(documento.tamanho / 1024).toFixed(1)} KB` : '0 KB'}</span>
                          </div>
                        </div>
                      </div>
                    }
                  >
                    {/* Conteúdo principal resumido pode ficar vazio para padrão de cards */}
                  </ExpandableCard>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visualizador de Documentos */}
        {ViewerComponent}
      </div>
    </Layout>
  );
};

export default Documentos;