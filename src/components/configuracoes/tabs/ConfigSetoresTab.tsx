import React, { useState, useMemo } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
    Settings,
    Plus,
    Search,
    MapPin,
    Grid3X3,
    List,
    RefreshCw,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    ChevronUp,
    ChevronDown,
    Phone,
    Mail,
    Building2
} from "lucide-react";
import ExpandableCard from "@/components/ui/expandable-card";
import MapModal from "@/components/ui/MapModal";
import MapaGeralSetores from "@/components/configuracoes/MapaGeralSetores";
import MapaSetor from "@/components/ui/MapaSetor";
import { useSetores } from '../hooks/useSetores';
import { useNotification } from '@/hooks/use-notification';
import { normalizeText } from "@/lib/utils";
import { useModuleTheme } from "@/lib/theme-config";

export const ConfigSetoresTab: React.FC = () => {
    const {
        setoresData,
        loadingSetores,
        setorFormData,
        selectedSetor,
        showCreateSetorModal,
        showEditSetorModal,
        isViewModeSetor,
        manualAddressEdit,
        isFallbackCoordinatesModal,
        setSetorFormData,
        setShowCreateSetorModal,
        setShowEditSetorModal,
        setIsViewModeSetor,
        setManualAddressEdit,
        resetSetorForm,
        handleSetorChange,
        handleCreateSetor,
        handleUpdateSetor,
        handleDeleteSetor,
        handleEditSetor,
        handleViewSetor
    } = useSetores();

    const { showInfo, showError, showWarning } = useNotification();
    const classes = useModuleTheme("configuracoes");

    // Estados locais para filtros e paginação
    const [searchTermSetores, setSearchTermSetores] = useState("");
    const [statusFilterSetores, setStatusFilterSetores] = useState("todos");
    const [orgaoFilterSetores, setOrgaoFilterSetores] = useState("todos");
    const [viewModeSetores, setViewModeSetores] = useState<'grid' | 'list'>('list');
    const [currentPageSetores, setCurrentPageSetores] = useState(1);
    const [itemsPerPageSetores] = useState(10);
    const [sortConfigSetores, setSortConfigSetores] = useState<{
        key: string;
        direction: 'asc' | 'desc';
    } | null>(null);

    const [showMapaSetoresModal, setShowMapaSetoresModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Função para ordenar colunas de setores
    const handleSortSetores = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfigSetores && sortConfigSetores.key === key && sortConfigSetores.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfigSetores({ key, direction });
    };

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

    // Filtrar, ordenar e paginar setores
    const filteredAndSortedSetores = useMemo(() => {
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
                    aValue = (a as any)[sortConfigSetores.key];
                    bValue = (b as any)[sortConfigSetores.key];
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
    }, [setoresData, searchTermSetores, statusFilterSetores, orgaoFilterSetores, sortConfigSetores]);

    const totalPagesSetores = Math.ceil(filteredAndSortedSetores.length / itemsPerPageSetores);
    const startIndexSetores = (currentPageSetores - 1) * itemsPerPageSetores;
    const endIndexSetores = startIndexSetores + itemsPerPageSetores;
    const paginatedSetores = filteredAndSortedSetores.slice(startIndexSetores, endIndexSetores);

    return (
        <div className="space-y-4">
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
                                        paginatedSetores.map((setor) => (
                                            <TableRow key={setor.ID}>
                                                <TableCell className="font-medium truncate" title={setor.NOME_SETOR || setor.SETOR}>
                                                    {setor.NOME_SETOR || setor.SETOR}
                                                </TableCell>
                                                <TableCell className="truncate" title={setor.ORGAO}>
                                                    {setor.ORGAO}
                                                </TableCell>
                                                <TableCell className="truncate" title={`${setor.LOGRADOURO || ''}, ${setor.NUMERO || ''} - ${setor.BAIRRO || ''}`}>
                                                    <div className="flex flex-col text-xs">
                                                        <span className="font-medium">{setor.LOGRADOURO}, {setor.NUMERO}</span>
                                                        <span className="text-muted-foreground">{setor.BAIRRO} - {setor.CIDADE}/{setor.ESTADO}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="truncate text-xs">
                                                    {setor.TELEFONE || '-'}
                                                </TableCell>
                                                <TableCell className="truncate text-xs" title={setor.EMAIL}>
                                                    {setor.EMAIL || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={setor.ATIVO ? "default" : "secondary"} size="sm">
                                                        {setor.ATIVO ? 'Ativo' : 'Inativo'}
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
                                                            <DropdownMenuItem onClick={() => handleViewSetor(setor)}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                Visualizar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleEditSetor(setor)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDeleteSetor(setor.ID, showInfo, showError)}
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
                                {loadingSetores ? (
                                    Array.from({ length: 6 }).map((_, index) => (
                                        <Card key={index} className="animate-pulse">
                                            <CardContent className="p-4">
                                                <div className="space-y-3">
                                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : paginatedSetores.length === 0 ? (
                                    <div className="col-span-full text-center py-8 text-muted-foreground">
                                        Nenhum setor encontrado
                                    </div>
                                ) : (
                                    paginatedSetores.map((setor) => (
                                        <ExpandableCard
                                            key={setor.ID}
                                            className="hover:shadow-md transition-shadow"
                                            header={
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold text-base truncate" title={setor.NOME_SETOR || setor.SETOR}>
                                                        {setor.NOME_SETOR || setor.SETOR}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground truncate" title={setor.ORGAO}>
                                                        {setor.ORGAO}
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
                                                            <DropdownMenuItem onClick={() => handleDeleteSetor(setor.ID, showInfo, showError)} className="text-red-600">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Excluir
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            }
                                        >
                                            <Separator />
                                            <div className="grid grid-cols-1 gap-3 text-xs">
                                                <div className="space-y-2">
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="w-3 h-3 mt-0.5 text-muted-foreground shrink-0" />
                                                        <div>
                                                            <span className="font-medium block">{setor.LOGRADOURO}, {setor.NUMERO}</span>
                                                            <span className="text-muted-foreground">{setor.BAIRRO} - {setor.CIDADE}/{setor.ESTADO}</span>
                                                            <span className="text-muted-foreground block text-[10px]">{setor.CEP}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                                                        <span>{setor.TELEFONE || 'Não informado'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                                                        <span className="truncate" title={setor.EMAIL}>{setor.EMAIL || 'Não informado'}</span>
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

            {/* Modal de Criação de Setor */}
            <Dialog open={showCreateSetorModal} onOpenChange={setShowCreateSetorModal}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Novo Setor</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="codigoSetor">Código do Setor</Label>
                                <Input
                                    id="codigoSetor"
                                    name="codigoSetor"
                                    value={setorFormData.codigoSetor}
                                    onChange={handleSetorChange}
                                    placeholder="Ex: GAB-SEC"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nomeSetor">Nome do Setor *</Label>
                                <Input
                                    id="nomeSetor"
                                    name="nomeSetor"
                                    value={setorFormData.nomeSetor}
                                    onChange={handleSetorChange}
                                    placeholder="Ex: Gabinete do Secretário"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="orgao">Órgão</Label>
                                <Input
                                    id="orgao"
                                    name="orgao"
                                    value={setorFormData.orgao}
                                    onChange={handleSetorChange}
                                    placeholder="Ex: SEFAZ"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="telefone">Telefone</Label>
                                <Input
                                    id="telefone"
                                    name="telefone"
                                    value={setorFormData.telefone}
                                    onChange={handleSetorChange}
                                    placeholder="(00) 0000-0000"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={setorFormData.email}
                                onChange={handleSetorChange}
                                placeholder="setor@exemplo.com"
                            />
                        </div>

                        <Separator className="my-2" />
                        <h3 className="font-semibold flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Endereço e Localização
                        </h3>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cep">CEP</Label>
                                <Input
                                    id="cep"
                                    name="cep"
                                    value={setorFormData.cep}
                                    onChange={handleSetorChange}
                                    placeholder="00000-000"
                                    maxLength={9}
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="logradouro">Logradouro</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="logradouro"
                                        name="logradouro"
                                        value={setorFormData.logradouro}
                                        onChange={handleSetorChange}
                                        readOnly={!manualAddressEdit}
                                        className={!manualAddressEdit ? "bg-gray-100" : ""}
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setManualAddressEdit(!manualAddressEdit)}
                                        title={manualAddressEdit ? "Bloquear edição manual" : "Editar manualmente"}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="numero">Número</Label>
                                <Input
                                    id="numero"
                                    name="numero"
                                    value={setorFormData.numero}
                                    onChange={handleSetorChange}
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="complemento">Complemento</Label>
                                <Input
                                    id="complemento"
                                    name="complemento"
                                    value={setorFormData.complemento}
                                    onChange={handleSetorChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="bairro">Bairro</Label>
                                <Input
                                    id="bairro"
                                    name="bairro"
                                    value={setorFormData.bairro}
                                    onChange={handleSetorChange}
                                    readOnly={!manualAddressEdit}
                                    className={!manualAddressEdit ? "bg-gray-100" : ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cidade">Cidade</Label>
                                <Input
                                    id="cidade"
                                    name="cidade"
                                    value={setorFormData.cidade}
                                    onChange={handleSetorChange}
                                    readOnly={!manualAddressEdit}
                                    className={!manualAddressEdit ? "bg-gray-100" : ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="estado">Estado</Label>
                                <Input
                                    id="estado"
                                    name="estado"
                                    value={setorFormData.estado}
                                    onChange={handleSetorChange}
                                    readOnly={!manualAddressEdit}
                                    className={!manualAddressEdit ? "bg-gray-100" : ""}
                                />
                            </div>
                        </div>

                        <div className="h-[300px] w-full mt-4 rounded-md border overflow-hidden">
                            <MapaSetor
                                setorData={setorFormData}
                                onLocationSelect={(lat, lng) => {
                                    setSetorFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                                }}
                            />
                        </div>
                        {isFallbackCoordinatesModal && (
                            <div className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                <span>Localização aproximada (cidade). Por favor, ajuste o pino no mapa.</span>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateSetorModal(false)}>Cancelar</Button>
                        <Button className="bg-primary text-white" onClick={() => handleCreateSetor(showInfo, showError)}>Criar Setor</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Edição/Visualização de Setor */}
            <Dialog open={showEditSetorModal} onOpenChange={(open) => {
                setShowEditSetorModal(open);
                if (!open) setIsViewModeSetor(false);
            }}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isViewModeSetor ? 'Visualizar Setor' : 'Editar Setor'}</DialogTitle>
                    </DialogHeader>
                    <div className={`grid gap-4 py-4 ${isViewModeSetor ? 'pointer-events-none opacity-90' : ''}`}>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="codigoSetor-edit">Código do Setor</Label>
                                <Input
                                    id="codigoSetor-edit"
                                    name="codigoSetor"
                                    value={setorFormData.codigoSetor}
                                    onChange={handleSetorChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nomeSetor-edit">Nome do Setor *</Label>
                                <Input
                                    id="nomeSetor-edit"
                                    name="nomeSetor"
                                    value={setorFormData.nomeSetor}
                                    onChange={handleSetorChange}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="orgao-edit">Órgão</Label>
                                <Input
                                    id="orgao-edit"
                                    name="orgao"
                                    value={setorFormData.orgao}
                                    onChange={handleSetorChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="telefone-edit">Telefone</Label>
                                <Input
                                    id="telefone-edit"
                                    name="telefone"
                                    value={setorFormData.telefone}
                                    onChange={handleSetorChange}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email-edit">Email</Label>
                            <Input
                                id="email-edit"
                                name="email"
                                type="email"
                                value={setorFormData.email}
                                onChange={handleSetorChange}
                            />
                        </div>

                        <Separator className="my-2" />
                        <h3 className="font-semibold flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Endereço e Localização
                        </h3>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cep-edit">CEP</Label>
                                <Input
                                    id="cep-edit"
                                    name="cep"
                                    value={setorFormData.cep}
                                    onChange={handleSetorChange}
                                    maxLength={9}
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="logradouro-edit">Logradouro</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="logradouro-edit"
                                        name="logradouro"
                                        value={setorFormData.logradouro}
                                        onChange={handleSetorChange}
                                        readOnly={!manualAddressEdit}
                                        className={!manualAddressEdit ? "bg-gray-100" : ""}
                                    />
                                    {!isViewModeSetor && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setManualAddressEdit(!manualAddressEdit)}
                                            title={manualAddressEdit ? "Bloquear edição manual" : "Editar manualmente"}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="numero-edit">Número</Label>
                                <Input
                                    id="numero-edit"
                                    name="numero"
                                    value={setorFormData.numero}
                                    onChange={handleSetorChange}
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="complemento-edit">Complemento</Label>
                                <Input
                                    id="complemento-edit"
                                    name="complemento"
                                    value={setorFormData.complemento}
                                    onChange={handleSetorChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="bairro-edit">Bairro</Label>
                                <Input
                                    id="bairro-edit"
                                    name="bairro"
                                    value={setorFormData.bairro}
                                    onChange={handleSetorChange}
                                    readOnly={!manualAddressEdit}
                                    className={!manualAddressEdit ? "bg-gray-100" : ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cidade-edit">Cidade</Label>
                                <Input
                                    id="cidade-edit"
                                    name="cidade"
                                    value={setorFormData.cidade}
                                    onChange={handleSetorChange}
                                    readOnly={!manualAddressEdit}
                                    className={!manualAddressEdit ? "bg-gray-100" : ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="estado-edit">Estado</Label>
                                <Input
                                    id="estado-edit"
                                    name="estado"
                                    value={setorFormData.estado}
                                    onChange={handleSetorChange}
                                    readOnly={!manualAddressEdit}
                                    className={!manualAddressEdit ? "bg-gray-100" : ""}
                                />
                            </div>
                        </div>

                        <div className={`h-[300px] w-full mt-4 rounded-md border overflow-hidden ${isViewModeSetor ? 'pointer-events-auto' : ''}`}>
                            <MapaSetor
                                setorData={setorFormData}
                                onLocationSelect={(lat, lng) => {
                                    if (!isViewModeSetor) {
                                        setSetorFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                                    }
                                }}
                                readOnly={isViewModeSetor}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        {isViewModeSetor ? (
                            <Button variant="outline" onClick={() => setShowEditSetorModal(false)}>Fechar</Button>
                        ) : (
                            <>
                                <div className="flex items-center space-x-2 mr-auto">
                                    <Label htmlFor="ativo-switch-setor">Status:</Label>
                                    <span className={`text-sm font-medium ${setorFormData.ativo ? 'text-green-600' : 'text-red-600'}`}>
                                        {setorFormData.ativo ? 'Ativo' : 'Inativo'}
                                    </span>
                                    <Switch
                                        id="ativo-switch-setor"
                                        checked={setorFormData.ativo}
                                        onCheckedChange={(checked) => setSetorFormData(prev => ({ ...prev, ativo: checked }))}
                                    />
                                </div>
                                <Button variant="outline" onClick={() => setShowEditSetorModal(false)}>Cancelar</Button>
                                <Button className="bg-primary text-white" onClick={() => handleUpdateSetor(showInfo, showError, showWarning)}>Salvar Alterações</Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
