import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import {
  BarChart3,
  FileText,
  Users,
  Clock,
  Archive,
  Package,
  FolderOpen,
  Download,
  Filter,
  Calendar,
  TrendingUp,
  PieChart,
  Activity,
  Grid3X3,
  List
} from 'lucide-react';

const Relatorios: React.FC = () => {
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState('mes');
  const [busca, setBusca] = useState('');
  const [modoVisualizacao, setModoVisualizacao] = useState<'grid' | 'lista'>('grid');

  const relatoriosDisponiveis = [
    {
      id: 'documentos-geral',
      titulo: 'Relatório Geral de Documentos',
      categoria: 'documentos',
      descricao: 'Estatísticas gerais sobre documentos cadastrados, por categoria e status',
      icone: FileText,
      cor: 'text-blue-600',
      status: 'disponivel'
    },
    {
      id: 'processos-andamento',
      titulo: 'Processos em Andamento',
      categoria: 'processos',
      descricao: 'Relatório de processos ativos, fases e prazos',
      icone: Activity,
      cor: 'text-green-600',
      status: 'disponivel'
    },
    {
      id: 'tramitacao-fluxo',
      titulo: 'Fluxo de Tramitação',
      categoria: 'tramitacao',
      descricao: 'Análise do fluxo de documentos entre departamentos',
      icone: TrendingUp,
      cor: 'text-purple-600',
      status: 'disponivel'
    },
    {
      id: 'encomendas-status',
      titulo: 'Status de Encomendas',
      categoria: 'encomendas',
      descricao: 'Relatório de encomendas por status e destinatário',
      icone: Package,
      cor: 'text-orange-600',
      status: 'disponivel'
    },
    {
      id: 'arquivo-auditoria',
      titulo: 'Auditoria de Arquivo',
      categoria: 'arquivo',
      descricao: 'Relatório de uso e auditoria do sistema de arquivo',
      icone: Archive,
      cor: 'text-gray-600',
      status: 'disponivel'
    },
    {
      id: 'prazos-vencimento',
      titulo: 'Controle de Prazos',
      categoria: 'prazos',
      descricao: 'Relatório de prazos vencidos e próximos ao vencimento',
      icone: Clock,
      cor: 'text-red-600',
      status: 'disponivel'
    },
    {
      id: 'usuarios-atividade',
      titulo: 'Atividade de Usuários',
      categoria: 'usuarios',
      descricao: 'Relatório de atividades e permissões dos usuários',
      icone: Users,
      cor: 'text-indigo-600',
      status: 'disponivel'
    }
  ];

  const estatisticas = {
    totalRelatorios: relatoriosDisponiveis.length,
    geradosHoje: 3,
    agendados: 2,
    emProcessamento: 1
  };

  const relatoriosFiltrados = relatoriosDisponiveis.filter(relatorio => {
    const matchesBusca = relatorio.titulo.toLowerCase().includes(busca.toLowerCase()) ||
                        relatorio.descricao.toLowerCase().includes(busca.toLowerCase());
    const matchesTipo = filtroTipo === 'todos' || relatorio.categoria === filtroTipo;
    return matchesBusca && matchesTipo;
  });

  const handleGerarRelatorio = (relatorioId: string) => {
    console.log(`Gerando relatório: ${relatorioId}`);
    // Aqui seria implementada a lógica de geração do relatório
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      disponivel: { label: 'Disponível', variant: 'default' as const },
      processando: { label: 'Processando', variant: 'secondary' as const },
      erro: { label: 'Erro', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.disponivel;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-primary" />
              Relatórios
            </h1>
            <p className="text-muted-foreground">Central de relatórios e análises do sistema</p>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Relatórios</p>
                  <p className="text-2xl font-bold">{estatisticas.totalRelatorios}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gerados Hoje</p>
                  <p className="text-2xl font-bold text-green-600">{estatisticas.geradosHoje}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Agendados</p>
                  <p className="text-2xl font-bold text-blue-600">{estatisticas.agendados}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Em Processamento</p>
                  <p className="text-2xl font-bold text-orange-600">{estatisticas.emProcessamento}</p>
                </div>
                <Activity className="h-8 w-8 text-orange-600" />
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
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar relatórios..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as Categorias</SelectItem>
                  <SelectItem value="documentos">Documentos</SelectItem>
                  <SelectItem value="processos">Processos</SelectItem>
                  <SelectItem value="tramitacao">Tramitação</SelectItem>
                  <SelectItem value="encomendas">Encomendas</SelectItem>
                  <SelectItem value="arquivo">Arquivo</SelectItem>
                  <SelectItem value="prazos">Prazos</SelectItem>
                  <SelectItem value="usuarios">Usuários</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Esta Semana</SelectItem>
                  <SelectItem value="mes">Este Mês</SelectItem>
                  <SelectItem value="trimestre">Trimestre</SelectItem>
                  <SelectItem value="ano">Este Ano</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Botões de Visualização */}
              <div className="flex border rounded-md">
                <Button
                  variant={modoVisualizacao === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setModoVisualizacao('grid')}
                  className="rounded-r-none border-r"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={modoVisualizacao === 'lista' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setModoVisualizacao('lista')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo Principal */}
        <Tabs defaultValue="disponiveis" className="space-y-4">
          <TabsList>
            <TabsTrigger value="disponiveis">Relatórios Disponíveis</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="agendados">Agendamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="disponiveis" className="space-y-4">
            {/* Visualização em Grid */}
            {modoVisualizacao === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatoriosFiltrados.map((relatorio) => {
                  const IconeRelatorio = relatorio.icone;
                  return (
                    <Card key={relatorio.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <IconeRelatorio className={`w-8 h-8 ${relatorio.cor}`} />
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{relatorio.titulo}</h3>
                              <Badge variant="outline" className="capitalize text-xs">
                                {relatorio.categoria}
                              </Badge>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2">{relatorio.descricao}</p>
                          
                          <div className="flex items-center justify-between">
                            {getStatusBadge(relatorio.status)}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex-1"
                              onClick={() => handleGerarRelatorio(relatorio.id)}
                            >
                              <BarChart3 className="w-4 h-4 mr-1" />
                              Gerar
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex-1"
                              disabled={relatorio.status !== 'disponivel'}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Baixar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            
            {/* Visualização em Lista */}
            {modoVisualizacao === 'lista' && (
              <div className="space-y-2">
                {relatoriosFiltrados.map((relatorio) => {
                  const IconeRelatorio = relatorio.icone;
                  return (
                    <Card key={relatorio.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <IconeRelatorio className={`w-6 h-6 ${relatorio.cor}`} />
                            <div className="flex-1">
                              <h3 className="font-semibold">{relatorio.titulo}</h3>
                              <p className="text-sm text-muted-foreground">{relatorio.descricao}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(relatorio.status)}
                              <Badge variant="outline" className="capitalize">
                                {relatorio.categoria}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleGerarRelatorio(relatorio.id)}
                            >
                              <BarChart3 className="w-4 h-4 mr-1" />
                              Gerar
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled={relatorio.status !== 'disponivel'}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Baixar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="historico" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Relatórios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  Histórico de relatórios em desenvolvimento
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agendados" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios Agendados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  Sistema de agendamento em desenvolvimento
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Relatorios;