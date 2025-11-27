import React, { useMemo } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Settings,
    Plus,
    Trash2,
    Search,
    MoreHorizontal,
    FileText,
    Edit,
    XCircle,
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Check,
    ChevronsUpDown
} from "lucide-react";
import { useModuleTheme } from "@/lib/theme-config";
import { useLacres } from '../hooks/useLacres';
import { cn } from "@/lib/utils";

interface ConfigLacreTabProps {
    setoresData: any[];
}

export const ConfigLacreTab: React.FC<ConfigLacreTabProps> = ({ setoresData }) => {
    const classes = useModuleTheme("configuracoes");
    const {
        lacreList,
        lacreLoading,
        lacreFilters,
        setLacreFilters,
        lacreForm,
        setLacreForm,
        distFormLacre,
        setDistFormLacre,
        distAutoSetores,
        setDistAutoSetores,
        distSetoresSearch,
        setDistSetoresSearch,
        distSetoresPage,
        setDistSetoresPage,
        currentPageLacre,
        setCurrentPageLacre,
        kanbanDisponiveisPage,
        setKanbanDisponiveisPage,
        kanbanAtribuidosPage,
        setKanbanAtribuidosPage,
        kanbanUtilizadosPage,
        setKanbanUtilizadosPage,
        kanbanDestruidosLotePage,
        setKanbanDestruidosLotePage,
        kanbanDestruidosIndividuaisPage,
        setKanbanDestruidosIndividuaisPage,
        kanbanDestruidosTab,
        setKanbanDestruidosTab,
        showGerarLacresModal,
        setShowGerarLacresModal,
        showDistribuirLacresModal,
        setShowDistribuirLacresModal,
        distWizardStep,
        setDistWizardStep,
        showDestruirLacresModal,
        setShowDestruirLacresModal,
        showDestruirLacreIndividualModal,
        setShowDestruirLacreIndividualModal,
        showVisualizarLacreModal,
        setShowVisualizarLacreModal,
        showEditarLacreModal,
        setShowEditarLacreModal,
        lacreSelecionado,
        setLacreSelecionado,
        editFormLacre,
        setEditFormLacre,
        expandedAtribuidosSetores,
        setExpandedAtribuidosSetores,
        expandedUtilizadosSetores,
        setExpandedUtilizadosSetores,
        destruirFormLacre,
        setDestruirFormLacre,
        destruirIndividualForm,
        setDestruirIndividualForm,
        openDestruirLoteCombo,
        setOpenDestruirLoteCombo,
        filteredLacres,
        lotesElegiveis,
        disponiveisCount,
        isAdmin,
        avancarWizardDistribuicao,
        voltarWizardDistribuicao,
        getLacreStatusLabel,
        gerarLacres,
        distribuirLacresManual,
        distribuirLacresAuto,
        aplicarTransicaoLacre,
        vincularLacreAEncomenda,
        destruirLacre,
        destruirLacresPorLote,
        openEditarLacre,
        salvarEdicaoLacre,
        calcularDistribuicaoAutomatica
    } = useLacres(setoresData);

    const itemsPerPageLacre = 24;
    const itemsPerPageKanban = 5;
    const distSetoresPerPage = 10;

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

    // Agrupamento e lógica de exibição do Kanban
    const {
        visibleDisponiveis,
        totalPagesDisponiveis,
        visibleSetorGroups,
        totalPagesAtribuidos,
        visibleSetorUtilizadosGroups,
        totalPagesUtilizados,
        visibleDestruidosLote,
        totalPagesDestruidosLote,
        visibleDestruidosIndividuais,
        totalPagesDestruidosIndividuais
    } = useMemo(() => {
        const assignedStatuses = new Set(['atribuido', 'reservado', 'vinculado', 'extraviado', 'danificado']);
        const groupDisponiveis = filteredLacres.filter((l: any) => l.status === 'disponivel');
        const groupUtilizados = filteredLacres.filter((l: any) => l.status === 'utilizado');
        const groupAtribuidos = filteredLacres.filter((l: any) => assignedStatuses.has(l.status));
        const groupDestruidos = filteredLacres.filter((l: any) => ['destruido', 'extraviado', 'danificado'].includes(String(l.status)));

        const groupDestruidosLote = groupDestruidos.filter((l: any) => (l.setorId == null || String(l.setorId) === '') && (l.encomendaId == null || String(l.encomendaId) === ''));
        const groupDestruidosIndividuais = groupDestruidos.filter((l: any) => !((l.setorId == null || String(l.setorId) === '') && (l.encomendaId == null || String(l.encomendaId) === '')));

        // Disponíveis
        const totalPagesDisponiveis = Math.max(1, Math.ceil(groupDisponiveis.length / itemsPerPageKanban));
        const startIndexDisponiveis = (kanbanDisponiveisPage - 1) * itemsPerPageKanban;
        const endIndexDisponiveis = Math.min(startIndexDisponiveis + itemsPerPageKanban, groupDisponiveis.length);
        const visibleDisponiveis = groupDisponiveis.slice(startIndexDisponiveis, endIndexDisponiveis);

        // Atribuídos
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

        // Utilizados
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

        // Destruídos
        const totalPagesDestruidosLote = Math.max(1, Math.ceil(groupDestruidosLote.length / itemsPerPageKanban));
        const startIndexDestruidosLote = (kanbanDestruidosLotePage - 1) * itemsPerPageKanban;
        const endIndexDestruidosLote = Math.min(startIndexDestruidosLote + itemsPerPageKanban, groupDestruidosLote.length);
        const visibleDestruidosLote = groupDestruidosLote.slice(startIndexDestruidosLote, endIndexDestruidosLote);

        const totalPagesDestruidosIndividuais = Math.max(1, Math.ceil(groupDestruidosIndividuais.length / itemsPerPageKanban));
        const startIndexDestruidosIndividuais = (kanbanDestruidosIndividuaisPage - 1) * itemsPerPageKanban;
        const endIndexDestruidosIndividuais = Math.min(startIndexDestruidosIndividuais + itemsPerPageKanban, groupDestruidosIndividuais.length);
        const visibleDestruidosIndividuais = groupDestruidosIndividuais.slice(startIndexDestruidosIndividuais, endIndexDestruidosIndividuais);

        return {
            visibleDisponiveis,
            totalPagesDisponiveis,
            visibleSetorGroups,
            totalPagesAtribuidos,
            visibleSetorUtilizadosGroups,
            totalPagesUtilizados,
            visibleDestruidosLote,
            totalPagesDestruidosLote,
            visibleDestruidosIndividuais,
            totalPagesDestruidosIndividuais
        };
    }, [filteredLacres, kanbanDisponiveisPage, kanbanAtribuidosPage, kanbanUtilizadosPage, kanbanDestruidosLotePage, kanbanDestruidosIndividuaisPage, setoresData]);

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
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => { setLacreSelecionado(l); setShowVisualizarLacreModal(true); }}>
                                    <FileText className="mr-2 h-4 w-4" /> Detalhes
                                </DropdownMenuItem>
                                {isAdmin && (
                                    <>
                                        <DropdownMenuItem onClick={() => openEditarLacre(l)}>
                                            <Edit className="mr-2 h-4 w-4" /> Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        {l.status === 'disponivel' && (
                                            <DropdownMenuItem onClick={() => aplicarTransicaoLacre(l.id, 'danificado')}>
                                                <AlertTriangle className="mr-2 h-4 w-4" /> Marcar Danificado
                                            </DropdownMenuItem>
                                        )}
                                        {l.status === 'atribuido' && (
                                            <>
                                                <DropdownMenuItem onClick={() => vincularLacreAEncomenda(l.id)}>
                                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Vincular Encomenda
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => aplicarTransicaoLacre(l.id, 'extraviado')}>
                                                    <AlertTriangle className="mr-2 h-4 w-4" /> Marcar Extraviado
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                        {['disponivel', 'danificado', 'extraviado'].includes(l.status) && (
                                            <DropdownMenuItem onClick={() => {
                                                setLacreSelecionado(l);
                                                setDestruirIndividualForm({ motivo: '', status: 'destruido' });
                                                setShowDestruirLacreIndividualModal(true);
                                            }} className="text-red-600">
                                                <Trash2 className="mr-2 h-4 w-4" /> Destruir
                                            </DropdownMenuItem>
                                        )}
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                {l.loteNumero && (
                    <div className="text-xs text-muted-foreground">
                        Lote: {l.loteNumero}
                    </div>
                )}
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-4">
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
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-muted-foreground">
                            Exibindo {filteredLacres.length} lacres
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

                    {/* Kanban Board */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full min-h-[600px]">
                        {/* Coluna 1: Disponíveis */}
                        <div className="flex flex-col bg-muted/30 rounded-lg p-2 border border-border/50">
                            <div className="flex items-center justify-between mb-3 px-2">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    Disponíveis
                                </h3>
                                <Badge variant="secondary" className="text-xs">{filteredLacres.filter(l => l.status === 'disponivel').length}</Badge>
                            </div>
                            <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)] px-1">
                                {visibleDisponiveis.map(renderCard)}
                                {visibleDisponiveis.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        Nenhum lacre disponível
                                    </div>
                                )}
                            </div>
                            {totalPagesDisponiveis > 1 && (
                                <div className="flex justify-center gap-2 mt-2 pt-2 border-t">
                                    <Button variant="ghost" size="sm" onClick={() => setKanbanDisponiveisPage(p => Math.max(1, p - 1))} disabled={kanbanDisponiveisPage === 1}>&lt;</Button>
                                    <span className="text-xs flex items-center">{kanbanDisponiveisPage}/{totalPagesDisponiveis}</span>
                                    <Button variant="ghost" size="sm" onClick={() => setKanbanDisponiveisPage(p => Math.min(totalPagesDisponiveis, p + 1))} disabled={kanbanDisponiveisPage === totalPagesDisponiveis}>&gt;</Button>
                                </div>
                            )}
                        </div>

                        {/* Coluna 2: Atribuídos */}
                        <div className="flex flex-col bg-muted/30 rounded-lg p-2 border border-border/50">
                            <div className="flex items-center justify-between mb-3 px-2">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    Atribuídos
                                </h3>
                                <Badge variant="secondary" className="text-xs">{filteredLacres.filter(l => ['atribuido', 'reservado', 'vinculado', 'extraviado', 'danificado'].includes(l.status)).length}</Badge>
                            </div>
                            <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)] px-1">
                                {visibleSetorGroups.map(([setorNome, items]) => (
                                    <div key={setorNome} className="space-y-1">
                                        <div
                                            className="flex items-center justify-between px-2 py-1 bg-background rounded border cursor-pointer hover:bg-accent/50 transition-colors"
                                            onClick={() => setExpandedAtribuidosSetores(prev => ({ ...prev, [setorNome]: !prev[setorNome] }))}
                                        >
                                            <span className="text-xs font-medium truncate flex-1" title={setorNome}>{setorNome}</span>
                                            <div className="flex items-center gap-1">
                                                <Badge variant="outline" className="text-[10px] h-4 px-1">{items.length}</Badge>
                                                {expandedAtribuidosSetores[setorNome] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                            </div>
                                        </div>
                                        {expandedAtribuidosSetores[setorNome] && (
                                            <div className="pl-2 space-y-2 border-l-2 border-muted ml-1">
                                                {items.map(renderCard)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {visibleSetorGroups.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        Nenhum lacre atribuído
                                    </div>
                                )}
                            </div>
                            {totalPagesAtribuidos > 1 && (
                                <div className="flex justify-center gap-2 mt-2 pt-2 border-t">
                                    <Button variant="ghost" size="sm" onClick={() => setKanbanAtribuidosPage(p => Math.max(1, p - 1))} disabled={kanbanAtribuidosPage === 1}>&lt;</Button>
                                    <span className="text-xs flex items-center">{kanbanAtribuidosPage}/{totalPagesAtribuidos}</span>
                                    <Button variant="ghost" size="sm" onClick={() => setKanbanAtribuidosPage(p => Math.min(totalPagesAtribuidos, p + 1))} disabled={kanbanAtribuidosPage === totalPagesAtribuidos}>&gt;</Button>
                                </div>
                            )}
                        </div>

                        {/* Coluna 3: Utilizados */}
                        <div className="flex flex-col bg-muted/30 rounded-lg p-2 border border-border/50">
                            <div className="flex items-center justify-between mb-3 px-2">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                                    Utilizados
                                </h3>
                                <Badge variant="secondary" className="text-xs">{filteredLacres.filter(l => l.status === 'utilizado').length}</Badge>
                            </div>
                            <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)] px-1">
                                {visibleSetorUtilizadosGroups.map(([setorNome, items]) => (
                                    <div key={setorNome} className="space-y-1">
                                        <div
                                            className="flex items-center justify-between px-2 py-1 bg-background rounded border cursor-pointer hover:bg-accent/50 transition-colors"
                                            onClick={() => setExpandedUtilizadosSetores(prev => ({ ...prev, [setorNome]: !prev[setorNome] }))}
                                        >
                                            <span className="text-xs font-medium truncate flex-1" title={setorNome}>{setorNome}</span>
                                            <div className="flex items-center gap-1">
                                                <Badge variant="outline" className="text-[10px] h-4 px-1">{items.length}</Badge>
                                                {expandedUtilizadosSetores[setorNome] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                            </div>
                                        </div>
                                        {expandedUtilizadosSetores[setorNome] && (
                                            <div className="pl-2 space-y-2 border-l-2 border-muted ml-1">
                                                {items.map(renderCard)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {visibleSetorUtilizadosGroups.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        Nenhum lacre utilizado
                                    </div>
                                )}
                            </div>
                            {totalPagesUtilizados > 1 && (
                                <div className="flex justify-center gap-2 mt-2 pt-2 border-t">
                                    <Button variant="ghost" size="sm" onClick={() => setKanbanUtilizadosPage(p => Math.max(1, p - 1))} disabled={kanbanUtilizadosPage === 1}>&lt;</Button>
                                    <span className="text-xs flex items-center">{kanbanUtilizadosPage}/{totalPagesUtilizados}</span>
                                    <Button variant="ghost" size="sm" onClick={() => setKanbanUtilizadosPage(p => Math.min(totalPagesUtilizados, p + 1))} disabled={kanbanUtilizadosPage === totalPagesUtilizados}>&gt;</Button>
                                </div>
                            )}
                        </div>

                        {/* Coluna 4: Destruídos */}
                        <div className="flex flex-col bg-muted/30 rounded-lg p-2 border border-border/50">
                            <div className="flex items-center justify-between mb-3 px-2">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    Destruídos
                                </h3>
                                <Badge variant="secondary" className="text-xs">{filteredLacres.filter(l => ['destruido', 'extraviado', 'danificado'].includes(l.status)).length}</Badge>
                            </div>

                            {/* Tabs internas para Destruídos */}
                            <div className="flex p-1 bg-background rounded-md mb-2 mx-1">
                                <button
                                    className={cn("flex-1 text-xs py-1 rounded-sm transition-colors", kanbanDestruidosTab === 'lote' ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted/50")}
                                    onClick={() => setKanbanDestruidosTab('lote')}
                                >
                                    Por Lote
                                </button>
                                <button
                                    className={cn("flex-1 text-xs py-1 rounded-sm transition-colors", kanbanDestruidosTab === 'individual' ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted/50")}
                                    onClick={() => setKanbanDestruidosTab('individual')}
                                >
                                    Individual
                                </button>
                            </div>

                            <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-300px)] px-1">
                                {kanbanDestruidosTab === 'lote' ? (
                                    <>
                                        {visibleDestruidosLote.map(renderCard)}
                                        {visibleDestruidosLote.length === 0 && (
                                            <div className="text-center py-8 text-muted-foreground text-sm">
                                                Nenhum lacre destruído em lote
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {visibleDestruidosIndividuais.map(renderCard)}
                                        {visibleDestruidosIndividuais.length === 0 && (
                                            <div className="text-center py-8 text-muted-foreground text-sm">
                                                Nenhum lacre destruído individualmente
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {kanbanDestruidosTab === 'lote' ? (
                                totalPagesDestruidosLote > 1 && (
                                    <div className="flex justify-center gap-2 mt-2 pt-2 border-t">
                                        <Button variant="ghost" size="sm" onClick={() => setKanbanDestruidosLotePage(p => Math.max(1, p - 1))} disabled={kanbanDestruidosLotePage === 1}>&lt;</Button>
                                        <span className="text-xs flex items-center">{kanbanDestruidosLotePage}/{totalPagesDestruidosLote}</span>
                                        <Button variant="ghost" size="sm" onClick={() => setKanbanDestruidosLotePage(p => Math.min(totalPagesDestruidosLote, p + 1))} disabled={kanbanDestruidosLotePage === totalPagesDestruidosLote}>&gt;</Button>
                                    </div>
                                )
                            ) : (
                                totalPagesDestruidosIndividuais > 1 && (
                                    <div className="flex justify-center gap-2 mt-2 pt-2 border-t">
                                        <Button variant="ghost" size="sm" onClick={() => setKanbanDestruidosIndividuaisPage(p => Math.max(1, p - 1))} disabled={kanbanDestruidosIndividuaisPage === 1}>&lt;</Button>
                                        <span className="text-xs flex items-center">{kanbanDestruidosIndividuaisPage}/{totalPagesDestruidosIndividuais}</span>
                                        <Button variant="ghost" size="sm" onClick={() => setKanbanDestruidosIndividuaisPage(p => Math.min(totalPagesDestruidosIndividuais, p + 1))} disabled={kanbanDestruidosIndividuaisPage === totalPagesDestruidosIndividuais}>&gt;</Button>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Modal Gerar Lacres */}
            <Dialog open={showGerarLacresModal} onOpenChange={setShowGerarLacresModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Gerar Novos Lacres</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Prefixo</Label>
                                <Input
                                    value={lacreForm.prefixo}
                                    onChange={(e) => setLacreForm(prev => ({ ...prev, prefixo: e.target.value.toUpperCase() }))}
                                    placeholder="LACRE"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Número do Lote</Label>
                                <Input
                                    value={lacreForm.loteNumero}
                                    onChange={(e) => setLacreForm(prev => ({ ...prev, loteNumero: e.target.value }))}
                                    placeholder="Opcional"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Início</Label>
                                <Input
                                    type="number"
                                    value={lacreForm.inicio}
                                    onChange={(e) => setLacreForm(prev => ({ ...prev, inicio: parseInt(e.target.value) }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Fim</Label>
                                <Input
                                    type="number"
                                    value={lacreForm.fim || ''}
                                    onChange={(e) => setLacreForm(prev => ({ ...prev, fim: parseInt(e.target.value) }))}
                                    placeholder="Opcional"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowGerarLacresModal(false)}>Cancelar</Button>
                        <Button onClick={gerarLacres} disabled={lacreLoading}>
                            {lacreLoading ? 'Gerando...' : 'Gerar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Distribuir Lacres (Wizard) */}
            <Dialog open={showDistribuirLacresModal} onOpenChange={setShowDistribuirLacresModal}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Distribuir Lacres</DialogTitle>
                    </DialogHeader>

                    {/* Steps */}
                    <div className="flex justify-between mb-8 relative">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -z-10" />
                        {[1, 2, 3, 4].map((step) => (
                            <div key={step} className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors bg-background border-2",
                                distWizardStep >= step ? "border-primary text-primary" : "border-muted text-muted-foreground",
                                distWizardStep === step && "ring-2 ring-primary ring-offset-2"
                            )}>
                                {step}
                            </div>
                        ))}
                    </div>

                    <div className="py-4 min-h-[300px]">
                        {distWizardStep === 1 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-center mb-6">Selecione o modo de distribuição</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        className={cn(
                                            "p-6 border rounded-lg cursor-pointer hover:border-primary transition-all text-center space-y-3",
                                            distFormLacre.modo === 'manual' && "border-primary bg-primary/5 ring-1 ring-primary"
                                        )}
                                        onClick={() => setDistFormLacre(prev => ({ ...prev, modo: 'manual' }))}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                                            <Edit className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">Manual</h4>
                                            <p className="text-sm text-muted-foreground mt-1">Escolha um setor e a quantidade específica</p>
                                        </div>
                                    </div>

                                    <div
                                        className={cn(
                                            "p-6 border rounded-lg cursor-pointer hover:border-primary transition-all text-center space-y-3",
                                            distFormLacre.modo === 'auto' && "border-primary bg-primary/5 ring-1 ring-primary"
                                        )}
                                        onClick={() => setDistFormLacre(prev => ({ ...prev, modo: 'auto' }))}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                                            <Settings className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">Automático</h4>
                                            <p className="text-sm text-muted-foreground mt-1">Distribua igualmente entre vários setores</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {distWizardStep === 2 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-center mb-4">
                                    {distFormLacre.modo === 'manual' ? 'Selecione o Setor' : 'Selecione os Setores'}
                                </h3>

                                <div className="relative mb-4">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar setor..."
                                        value={distSetoresSearch}
                                        onChange={(e) => { setDistSetoresSearch(e.target.value); setDistSetoresPage(1); }}
                                        className="pl-8"
                                    />
                                </div>

                                <div className="border rounded-md max-h-[300px] overflow-y-auto">
                                    {(() => {
                                        const filtered = setoresData.filter(s =>
                                            (s.NOME_SETOR || s.SETOR || '').toLowerCase().includes(distSetoresSearch.toLowerCase())
                                        );
                                        const totalPages = Math.ceil(filtered.length / distSetoresPerPage);
                                        const start = (distSetoresPage - 1) * distSetoresPerPage;
                                        const pageItems = filtered.slice(start, start + distSetoresPerPage);

                                        return (
                                            <div className="divide-y">
                                                {pageItems.map(s => (
                                                    <div
                                                        key={s.ID}
                                                        className={cn(
                                                            "flex items-center p-3 hover:bg-accent/50 cursor-pointer transition-colors",
                                                            distFormLacre.modo === 'manual'
                                                                ? distFormLacre.setorId === String(s.ID) && "bg-accent"
                                                                : distAutoSetores.includes(String(s.ID)) && "bg-accent"
                                                        )}
                                                        onClick={() => {
                                                            if (distFormLacre.modo === 'manual') {
                                                                setDistFormLacre(prev => ({ ...prev, setorId: String(s.ID) }));
                                                            } else {
                                                                setDistAutoSetores(prev => {
                                                                    const id = String(s.ID);
                                                                    return prev.includes(id)
                                                                        ? prev.filter(x => x !== id)
                                                                        : [...prev, id];
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        <div className={cn(
                                                            "w-4 h-4 mr-3 border rounded flex items-center justify-center",
                                                            distFormLacre.modo === 'manual'
                                                                ? "rounded-full"
                                                                : "rounded-sm"
                                                        )}>
                                                            {distFormLacre.modo === 'manual'
                                                                ? distFormLacre.setorId === String(s.ID) && <div className="w-2 h-2 rounded-full bg-primary" />
                                                                : distAutoSetores.includes(String(s.ID)) && <Check className="w-3 h-3 text-primary" />
                                                            }
                                                        </div>
                                                        <span className="text-sm">{s.NOME_SETOR || s.SETOR}</span>
                                                    </div>
                                                ))}
                                                {filtered.length === 0 && (
                                                    <div className="p-4 text-center text-muted-foreground text-sm">
                                                        Nenhum setor encontrado
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}

                        {distWizardStep === 3 && distFormLacre.modo === 'manual' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-medium text-center">Definir Quantidade</h3>

                                <div className="max-w-xs mx-auto space-y-4">
                                    <div className="p-4 bg-muted rounded-lg text-center">
                                        <span className="text-sm text-muted-foreground block mb-1">Disponíveis</span>
                                        <span className="text-2xl font-bold">{disponiveisCount}</span>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Quantidade a distribuir</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={disponiveisCount}
                                            value={distFormLacre.quantidade}
                                            onChange={(e) => setDistFormLacre(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 0 }))}
                                            className="text-center text-lg"
                                        />
                                    </div>

                                    <div className="text-center text-sm text-muted-foreground">
                                        Setor selecionado: <br />
                                        <span className="font-medium text-foreground">
                                            {setoresData.find(s => String(s.ID) === distFormLacre.setorId)?.NOME_SETOR || 'Desconhecido'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {distWizardStep === 4 && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-medium text-center">Confirmar Distribuição</h3>

                                <div className="max-w-md mx-auto bg-muted/30 p-6 rounded-lg border space-y-4">
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-muted-foreground">Modo</span>
                                        <span className="font-medium capitalize">{distFormLacre.modo === 'manual' ? 'Manual' : 'Automático'}</span>
                                    </div>

                                    {distFormLacre.modo === 'manual' ? (
                                        <>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">Setor</span>
                                                <span className="font-medium text-right">
                                                    {setoresData.find(s => String(s.ID) === distFormLacre.setorId)?.NOME_SETOR}
                                                </span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b">
                                                <span className="text-muted-foreground">Quantidade</span>
                                                <span className="font-medium">{distFormLacre.quantidade}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-2 border-b pb-2">
                                                <span className="text-muted-foreground block mb-2">Setores ({distAutoSetores.length})</span>
                                                <div className="max-h-[150px] overflow-y-auto space-y-1 pr-2">
                                                    {calcularDistribuicaoAutomatica(disponiveisCount, distAutoSetores).map(item => (
                                                        <div key={item.setorId} className="flex justify-between text-sm">
                                                            <span className="truncate flex-1 mr-2">
                                                                {setoresData.find(s => String(s.ID) === item.setorId)?.NOME_SETOR}
                                                            </span>
                                                            <span className="font-mono text-muted-foreground">{item.quantidade}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex justify-between py-2 pt-4">
                                                <span className="text-muted-foreground">Total a distribuir</span>
                                                <span className="font-medium">{disponiveisCount}</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-md">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-sm">Esta ação não pode ser desfeita facilmente.</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex justify-between sm:justify-between">
                        <Button variant="ghost" onClick={voltarWizardDistribuicao} disabled={distWizardStep === 1}>
                            Voltar
                        </Button>
                        {distWizardStep < 4 ? (
                            <Button onClick={avancarWizardDistribuicao}>
                                Próximo
                            </Button>
                        ) : (
                            <Button onClick={distFormLacre.modo === 'manual' ? distribuirLacresManual : distribuirLacresAuto}>
                                Confirmar Distribuição
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Destruir Lacres (Lote) */}
            <Dialog open={showDestruirLacresModal} onOpenChange={setShowDestruirLacresModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Destruir Lote de Lacres</DialogTitle>
                        <CardDescription>
                            Apenas lotes sem nenhum lacre distribuído podem ser destruídos.
                        </CardDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Lote</Label>
                            <Popover open={openDestruirLoteCombo} onOpenChange={setOpenDestruirLoteCombo}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openDestruirLoteCombo}
                                        className="w-full justify-between"
                                    >
                                        {destruirFormLacre.loteNumero
                                            ? lotesElegiveis.find((l) => l.lote === destruirFormLacre.loteNumero)?.lote
                                            : "Selecione um lote..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Buscar lote..." />
                                        <CommandList>
                                            <CommandEmpty>Nenhum lote elegível encontrado.</CommandEmpty>
                                            <CommandGroup>
                                                {lotesElegiveis.map((lote) => (
                                                    <CommandItem
                                                        key={lote.lote}
                                                        value={lote.lote}
                                                        onSelect={(currentValue) => {
                                                            setDestruirFormLacre(prev => ({ ...prev, loteNumero: currentValue }));
                                                            setOpenDestruirLoteCombo(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                destruirFormLacre.loteNumero === lote.lote ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {lote.lote} ({lote.total} lacres)
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label>Motivo</Label>
                            <Input
                                value={destruirFormLacre.motivo}
                                onChange={(e) => setDestruirFormLacre(prev => ({ ...prev, motivo: e.target.value }))}
                                placeholder="Motivo da destruição"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDestruirLacresModal(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={destruirLacresPorLote}>
                            Destruir Lote
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Destruir Lacre Individual */}
            <Dialog open={showDestruirLacreIndividualModal} onOpenChange={setShowDestruirLacreIndividualModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Destruir Lacre Individual</DialogTitle>
                        <CardDescription>
                            Informe o motivo e o status final do lacre.
                        </CardDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-muted rounded-lg">
                            <span className="text-sm font-medium">Lacre: {lacreSelecionado?.codigo}</span>
                        </div>
                        <div className="space-y-2">
                            <Label>Status Final</Label>
                            <Select
                                value={destruirIndividualForm.status}
                                onValueChange={(v: any) => setDestruirIndividualForm(prev => ({ ...prev, status: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="destruido">Destruído</SelectItem>
                                    <SelectItem value="extraviado">Extraviado</SelectItem>
                                    <SelectItem value="danificado">Danificado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Motivo</Label>
                            <Input
                                value={destruirIndividualForm.motivo}
                                onChange={(e) => setDestruirIndividualForm(prev => ({ ...prev, motivo: e.target.value }))}
                                placeholder="Descreva o motivo..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDestruirLacreIndividualModal(false)}>Cancelar</Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (lacreSelecionado) {
                                    destruirLacre(lacreSelecionado.id);
                                    setShowDestruirLacreIndividualModal(false);
                                }
                            }}
                        >
                            Confirmar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Visualizar Lacre */}
            <Dialog open={showVisualizarLacreModal} onOpenChange={setShowVisualizarLacreModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detalhes do Lacre</DialogTitle>
                    </DialogHeader>
                    {lacreSelecionado && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Código</Label>
                                    <div className="font-medium text-lg">{lacreSelecionado.codigo}</div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Status</Label>
                                    <div>
                                        <Badge variant={lacreSelecionado.status === 'disponivel' ? 'secondary' : 'default'}>
                                            {lacreStatusLabels[lacreSelecionado.status] || lacreSelecionado.status}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Lote</Label>
                                    <div>{lacreSelecionado.loteNumero || '-'}</div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Setor</Label>
                                    <div>{lacreSelecionado.setorNome || '-'}</div>
                                </div>
                                {lacreSelecionado.encomendaId && (
                                    <div>
                                        <Label className="text-muted-foreground">Encomenda Vinculada</Label>
                                        <div>#{lacreSelecionado.encomendaId}</div>
                                    </div>
                                )}
                            </div>

                            {lacreSelecionado.historico && lacreSelecionado.historico.length > 0 && (
                                <div className="mt-6">
                                    <Label className="mb-2 block">Histórico</Label>
                                    <div className="border rounded-lg max-h-[200px] overflow-y-auto divide-y">
                                        {lacreSelecionado.historico.map((h: any, idx: number) => (
                                            <div key={idx} className="p-3 text-sm">
                                                <div className="flex justify-between text-muted-foreground text-xs mb-1">
                                                    <span>{new Date(h.data).toLocaleString()}</span>
                                                    <span className="uppercase">{h.acao}</span>
                                                </div>
                                                <div>{h.detalhes}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setShowVisualizarLacreModal(false)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Editar Lacre */}
            <Dialog open={showEditarLacreModal} onOpenChange={setShowEditarLacreModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Lacre</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={editFormLacre.status}
                                onValueChange={(v) => setEditFormLacre(prev => ({ ...prev, status: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="disponivel">Disponível</SelectItem>
                                    <SelectItem value="atribuido">Atribuído</SelectItem>
                                    <SelectItem value="reservado">Reservado</SelectItem>
                                    <SelectItem value="vinculado">Vinculado</SelectItem>
                                    <SelectItem value="utilizado">Utilizado</SelectItem>
                                    <SelectItem value="extraviado">Extraviado</SelectItem>
                                    <SelectItem value="danificado">Danificado</SelectItem>
                                    <SelectItem value="destruido">Destruído</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Setor</Label>
                            <Select
                                value={editFormLacre.setorId}
                                onValueChange={(v) => setEditFormLacre(prev => ({ ...prev, setorId: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um setor..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Nenhum</SelectItem>
                                    {setoresData.map((s: any) => (
                                        <SelectItem key={String(s.ID)} value={String(s.ID)}>{s.NOME_SETOR || s.SETOR}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditarLacreModal(false)}>Cancelar</Button>
                        <Button onClick={salvarEdicaoLacre}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
