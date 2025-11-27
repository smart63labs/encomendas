import React from 'react';
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    Mail,
    Plus,
    Search,
    Grid3X3,
    List,
    RefreshCw,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Check,
    ChevronsUpDown,
    MapPin,
    Save,
    Truck
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ExpandableCard from "@/components/ui/expandable-card";
import MapaMalote from "@/components/ui/MapaMalote";
import { useMalotes } from '../hooks/useMalotes';
import { useNotification } from '@/hooks/use-notification';
import { useModuleTheme } from "@/lib/theme-config";
import { formatDatePTBR } from "@/lib/utils";

interface ConfigMaloteTabProps {
    setoresData: any[];
    configGeral: any;
    setConfigGeral: React.Dispatch<React.SetStateAction<any>>;
    salvarConfiguracoes: (categoria: string, dados: any) => Promise<void>;
    savingConfigs: boolean;
}

export const ConfigMaloteTab: React.FC<ConfigMaloteTabProps> = ({
    setoresData,
    configGeral,
    setConfigGeral,
    salvarConfiguracoes,
    savingConfigs
}) => {
    const {
        loadingMalotes,
        malotesData,
        showCreateMaloteModal,
        setShowCreateMaloteModal,
        showHubModal,
        setShowHubModal,
        showViewMaloteModal,
        setShowViewMaloteModal,
        viewMaloteData,
        isEditingMalote,
        searchTermMalote,
        setSearchTermMalote,
        statusFilterMalote,
        setStatusFilterMalote,
        viewModeMalote,
        setViewModeMalote,
        currentPageMalote,
        setCurrentPageMalote,
        setorOrigemMalote,
        setSetorOrigemMalote,
        setorDestinoMalote,
        setSetorDestinoMalote,
        maloteConfig,
        setMaloteConfig,
        currentStepMalote,
        stepsMalote,
        progressMalote,
        setorOrigemComboboxOpen,
        setSetorOrigemComboboxOpen,
        setorDestinoComboboxOpen,
        setSetorDestinoComboboxOpen,
        editandoDadosContrato,
        setEditandoDadosContrato,
        diasSemanaPopoverOpen,
        setDiasSemanaPopoverOpen,
        diasSemanaSelecionados,
        setDiasSemanaSelecionados,
        handleCreateMalotePersist,
        openEditMalote,
        openViewMalote,
        handleNextMalote,
        handlePreviousMalote,
        resetMaloteForm,
        filteredAndSortedMalotes,
        malotesAgrupadosPorSetorDestino,
        totalPagesMalote,
        paginatedMalotes,
        fetchMalotes
    } = useMalotes(setoresData);

    const classes = useModuleTheme("configuracoes");

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="w-5 h-5" /> Configurações de Malote
                            </CardTitle>
                            <CardDescription>
                                Gerencie as rotas e configurações de malote entre setores
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowHubModal(true)}
                                className="gap-2"
                            >
                                <Truck className="w-4 h-4" />
                                Centro Logístico
                            </Button>
                            <Button
                                onClick={() => {
                                    resetMaloteForm();
                                    setShowCreateMaloteModal(true);
                                }}
                                className={`${classes.button} text-white`}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Novo Malote
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
                                    placeholder="Buscar por nº malote, setor ou código..."
                                    value={searchTermMalote}
                                    onChange={(e) => setSearchTermMalote(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Select value={statusFilterMalote} onValueChange={setStatusFilterMalote}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos</SelectItem>
                                    <SelectItem value="ativo">Ativo</SelectItem>
                                    <SelectItem value="inativo">Inativo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Contador de Resultados */}
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-muted-foreground">
                            Exibindo {paginatedMalotes.length} de {filteredAndSortedMalotes.length} malotes
                        </p>
                        <div className="flex items-center gap-2">
                            {(searchTermMalote || statusFilterMalote !== "todos") && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSearchTermMalote("");
                                        setStatusFilterMalote("todos");
                                        setCurrentPageMalote(1);
                                    }}
                                >
                                    Limpar Filtros
                                </Button>
                            )}
                            <div className="flex border rounded-md">
                                <Button
                                    variant={viewModeMalote === 'grid' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewModeMalote('grid')}
                                    className="rounded-r-none border-r"
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant={viewModeMalote === 'list' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewModeMalote('list')}
                                    className="rounded-l-none"
                                >
                                    <List className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-md border">
                        {viewModeMalote === 'list' ? (
                            <div className="space-y-4 p-4">
                                {loadingMalotes ? (
                                    <div className="flex justify-center p-8">
                                        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : filteredAndSortedMalotes.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Nenhum malote encontrado.
                                    </div>
                                ) : (
                                    Object.entries(malotesAgrupadosPorSetorDestino).map(([setorDestinoId, grupo]) => (
                                        <Card key={setorDestinoId} className="overflow-hidden border-l-4 border-l-blue-500">
                                            <CardHeader className="bg-muted/30 py-3 px-4">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-blue-600" />
                                                        <h3 className="font-semibold text-sm">Destino: {grupo.setorNome}</h3>
                                                        <span className="text-xs text-muted-foreground ml-2">CEP: {grupo.cepDestino}</span>
                                                    </div>
                                                    <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                                        {grupo.malotes.length} malote(s)
                                                    </span>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                <div className="divide-y">
                                                    {grupo.malotes.map((malote: any) => (
                                                        <div key={malote.id || malote.ID} className="p-3 hover:bg-muted/20 transition-colors flex items-center justify-between group">
                                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                                                                <div>
                                                                    <div className="text-xs text-muted-foreground">Nº Malote</div>
                                                                    <div className="font-medium text-sm">{malote.numeroMalote || '-'}</div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs text-muted-foreground">Origem</div>
                                                                    <div className="text-sm truncate" title={malote.setorOrigemNome}>
                                                                        {malote.setorOrigemNome || '-'}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs text-muted-foreground">Percurso</div>
                                                                    <div className="text-sm">{malote.percurso || malote.numeroPercurso || '-'}</div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs text-muted-foreground">Status</div>
                                                                    <div className={`text-xs font-medium ${malote.ativo ? 'text-green-600' : 'text-red-600'}`}>
                                                                        {malote.ativo ? 'Ativo' : 'Inativo'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openViewMalote(malote)}>
                                                                    <Eye className="w-4 h-4 text-muted-foreground" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditMalote(malote)}>
                                                                    <Edit className="w-4 h-4 text-blue-600" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                                {loadingMalotes ? (
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
                                ) : paginatedMalotes.length === 0 ? (
                                    <div className="col-span-full text-center py-8 text-muted-foreground">
                                        Nenhum malote encontrado
                                    </div>
                                ) : (
                                    paginatedMalotes.map((malote: any) => (
                                        <ExpandableCard
                                            key={malote.id || malote.ID}
                                            className="hover:shadow-md transition-shadow"
                                            header={
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold text-base truncate" title={`Malote: ${malote.numeroMalote}`}>
                                                        Malote: {malote.numeroMalote || '-'}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground truncate" title={malote.setorDestinoNome}>
                                                        Destino: {malote.setorDestinoNome || '-'}
                                                    </p>
                                                </div>
                                            }
                                            actions={
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${malote.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {malote.ativo ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Abrir menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => openViewMalote(malote)}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                Visualizar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => openEditMalote(malote)}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Editar
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
                                                            <span className="font-medium block">Origem:</span>
                                                            <span className="text-muted-foreground">{malote.setorOrigemNome || '-'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Truck className="w-3 h-3 text-muted-foreground shrink-0" />
                                                        <span>Percurso: {malote.percurso || malote.numeroPercurso || '-'}</span>
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
                    {totalPagesMalote > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>
                                    Mostrando {((currentPageMalote - 1) * 10) + 1} a {Math.min(currentPageMalote * 10, filteredAndSortedMalotes.length)} de {filteredAndSortedMalotes.length} malotes
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPageMalote(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPageMalote === 1}
                                >
                                    Anterior
                                </Button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPagesMalote }, (_, i) => i + 1)
                                        .filter(page => {
                                            const distance = Math.abs(page - currentPageMalote);
                                            return distance === 0 || distance === 1 || page === 1 || page === totalPagesMalote;
                                        })
                                        .map((page, index, array) => {
                                            const prevPage = array[index - 1];
                                            const showDots = prevPage && page - prevPage > 1;
                                            return (
                                                <React.Fragment key={page}>
                                                    {showDots && <span className="px-1">...</span>}
                                                    <Button
                                                        variant={page === currentPageMalote ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => setCurrentPageMalote(page)}
                                                    >
                                                        {page}
                                                    </Button>
                                                </React.Fragment>
                                            );
                                        })}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPageMalote(prev => Math.min(prev + 1, totalPagesMalote))}
                                    disabled={currentPageMalote === totalPagesMalote}
                                >
                                    Próximo
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal: Novo Malote */}
            <Dialog open={showCreateMaloteModal} onOpenChange={setShowCreateMaloteModal}>
                <DialogContent className="sm:max-w-[1200px] max-h-[90vh] flex flex-col overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>{isEditingMalote ? 'Editar Malote' : 'Novo Malote'}</DialogTitle>
                    </DialogHeader>

                    {/* Cabeçalho do Wizard */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-muted-foreground">
                                Etapa {currentStepMalote} de {stepsMalote.length}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={handlePreviousMalote} disabled={currentStepMalote === 1} className="gap-2 h-8">
                                    <ChevronLeft className="w-4 h-4" />
                                    Anterior
                                </Button>
                                {currentStepMalote < stepsMalote.length ? (
                                    <Button size="sm" onClick={handleNextMalote} className={`${classes.button} text-white gap-2 h-8`}>
                                        Próximo
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                ) : (
                                    <Button size="sm" onClick={handleCreateMalotePersist} className={`${classes.button} text-white gap-2 h-8`}>
                                        Finalizar
                                        <Save className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                        <Progress value={progressMalote} className="mb-3" />
                        <div className="flex items-center justify-between">
                            {stepsMalote.map((step, index) => {
                                const Icon = step.icon;
                                const isActive = currentStepMalote === step.id;
                                const isCompleted = currentStepMalote > step.id;
                                return (
                                    <div key={step.id} className="flex items-center">
                                        <div className={`flex items-center gap-2 ${isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${isActive ? 'bg-primary text-white' : isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200 text-muted-foreground'}`}>
                                                {isCompleted ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                                            </div>
                                            <span className="text-xs font-medium hidden sm:block">{step.title}</span>
                                        </div>
                                        {index < stepsMalote.length - 1 && (
                                            <div className={`w-12 h-0.5 mx-2 ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Conteúdo do Wizard */}
                    <div className="flex-1 overflow-hidden">
                        {currentStepMalote === 1 && (
                            <div className="h-full flex gap-6">
                                {/* Mapa à esquerda */}
                                <div className="w-1/2 flex flex-col">
                                    <MapaMalote
                                        setorOrigemData={setorOrigemMalote.setorId ? {
                                            ID: parseInt(setorOrigemMalote.setorId),
                                            NOME: setorOrigemMalote.setorNome,
                                            LOGRADOURO: setorOrigemMalote.enderecoSetor.logradouro,
                                            NUMERO: setorOrigemMalote.enderecoSetor.numero,
                                            COMPLEMENTO: setorOrigemMalote.enderecoSetor.complemento,
                                            BAIRRO: setorOrigemMalote.enderecoSetor.bairro,
                                            CIDADE: setorOrigemMalote.enderecoSetor.cidade,
                                            ESTADO: setorOrigemMalote.enderecoSetor.estado,
                                            CEP: setorOrigemMalote.enderecoSetor.cep,
                                            LATITUDE: setorOrigemMalote.latitude,
                                            LONGITUDE: setorOrigemMalote.longitude
                                        } : null}
                                        setorDestinoData={setorDestinoMalote.setorId ? {
                                            ID: parseInt(setorDestinoMalote.setorId),
                                            NOME: setorDestinoMalote.setorNome,
                                            LOGRADOURO: setorDestinoMalote.enderecoSetor.logradouro,
                                            NUMERO: setorDestinoMalote.enderecoSetor.numero,
                                            COMPLEMENTO: setorDestinoMalote.enderecoSetor.complemento,
                                            BAIRRO: setorDestinoMalote.enderecoSetor.bairro,
                                            CIDADE: setorDestinoMalote.enderecoSetor.cidade,
                                            ESTADO: setorDestinoMalote.enderecoSetor.estado,
                                            CEP: setorDestinoMalote.enderecoSetor.cep,
                                            LATITUDE: setorDestinoMalote.latitude,
                                            LONGITUDE: setorDestinoMalote.longitude
                                        } : null}
                                    />
                                </div>

                                {/* Campos à direita */}
                                <div className="w-1/2 overflow-y-auto space-y-6">
                                    {/* Dados do Malote */}
                                    <div className="space-y-4">
                                        {/* Endereço do Setor de uso do Malote */}
                                        <div className="space-y-4">
                                            {/* Setor Origem */}
                                            <div className="space-y-2">
                                                <Label htmlFor="setor-origem">Setor Origem</Label>
                                                <Popover open={setorOrigemComboboxOpen} onOpenChange={setSetorOrigemComboboxOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" role="combobox" aria-expanded={setorOrigemComboboxOpen} className="w-full justify-between">
                                                            {setorOrigemMalote.setorNome || 'Selecione o setor origem'}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="p-0 w-[360px]" align="start">
                                                        <Command>
                                                            <CommandInput placeholder="Pesquisar setor origem..." />
                                                            <CommandList>
                                                                <CommandEmpty>Nenhum setor encontrado.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {Array.isArray(setoresData) && setoresData.map((s: any) => (
                                                                        <CommandItem
                                                                            key={String(s.ID || s.id)}
                                                                            value={s.NOME_SETOR || s.SETOR || 'Setor'}
                                                                            onSelect={() => {
                                                                                const value = String(s.ID || s.id);
                                                                                setSetorOrigemMalote(prev => ({
                                                                                    ...prev,
                                                                                    setorId: value,
                                                                                    setorNome: s.NOME_SETOR || s.SETOR || '',
                                                                                    latitude: s.LATITUDE || null,
                                                                                    longitude: s.LONGITUDE || null,
                                                                                    enderecoSetor: {
                                                                                        logradouro: s.LOGRADOURO || '',
                                                                                        numero: s.NUMERO || '',
                                                                                        complemento: s.COMPLEMENTO || '',
                                                                                        bairro: s.BAIRRO || '',
                                                                                        cidade: s.CIDADE || '',
                                                                                        estado: s.ESTADO || '',
                                                                                        cep: s.CEP || '',
                                                                                    }
                                                                                }));
                                                                                // Atualizar CEP Origem no maloteConfig
                                                                                setMaloteConfig(prev => ({
                                                                                    ...prev,
                                                                                    cepOrigem: s.CEP || ''
                                                                                }));
                                                                                setSetorOrigemComboboxOpen(false);
                                                                            }}
                                                                        >
                                                                            {s.NOME_SETOR || s.SETOR || 'Setor'}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                                {setorOrigemMalote.setorId && (
                                                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                                                        <div className="font-medium">Endereço:</div>
                                                        <div>
                                                            {setorOrigemMalote.enderecoSetor.logradouro && `${setorOrigemMalote.enderecoSetor.logradouro}`}
                                                            {setorOrigemMalote.enderecoSetor.numero && `, ${setorOrigemMalote.enderecoSetor.numero}`}
                                                            {setorOrigemMalote.enderecoSetor.complemento && ` - ${setorOrigemMalote.enderecoSetor.complemento}`}
                                                        </div>
                                                        <div>
                                                            {setorOrigemMalote.enderecoSetor.bairro && `${setorOrigemMalote.enderecoSetor.bairro}, `}
                                                            {setorOrigemMalote.enderecoSetor.cidade && `${setorOrigemMalote.enderecoSetor.cidade}`}
                                                            {setorOrigemMalote.enderecoSetor.estado && ` - ${setorOrigemMalote.enderecoSetor.estado}`}
                                                        </div>
                                                        {setorOrigemMalote.enderecoSetor.cep && (
                                                            <div className="font-medium text-blue-600">CEP: {setorOrigemMalote.enderecoSetor.cep}</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Setor Destino */}
                                            <div className="space-y-2">
                                                <Label htmlFor="setor-destino">Setor Destino</Label>
                                                <Popover open={setorDestinoComboboxOpen} onOpenChange={setSetorDestinoComboboxOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" role="combobox" aria-expanded={setorDestinoComboboxOpen} className="w-full justify-between">
                                                            {setorDestinoMalote.setorNome || 'Selecione o setor destino'}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="p-0 w-[360px]" align="start">
                                                        <Command>
                                                            <CommandInput placeholder="Pesquisar setor destino..." />
                                                            <CommandList>
                                                                <CommandEmpty>Nenhum setor encontrado.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {Array.isArray(setoresData) && setoresData.map((s: any) => (
                                                                        <CommandItem
                                                                            key={String(s.ID || s.id)}
                                                                            value={s.NOME_SETOR || s.SETOR || 'Setor'}
                                                                            onSelect={() => {
                                                                                const value = String(s.ID || s.id);
                                                                                setSetorDestinoMalote(prev => ({
                                                                                    ...prev,
                                                                                    setorId: value,
                                                                                    setorNome: s.NOME_SETOR || s.SETOR || '',
                                                                                    latitude: s.LATITUDE || null,
                                                                                    longitude: s.LONGITUDE || null,
                                                                                    enderecoSetor: {
                                                                                        logradouro: s.LOGRADOURO || '',
                                                                                        numero: s.NUMERO || '',
                                                                                        complemento: s.COMPLEMENTO || '',
                                                                                        bairro: s.BAIRRO || '',
                                                                                        cidade: s.CIDADE || '',
                                                                                        estado: s.ESTADO || '',
                                                                                        cep: s.CEP || '',
                                                                                    }
                                                                                }));
                                                                                // Atualizar CEP Destino no maloteConfig
                                                                                setMaloteConfig(prev => ({
                                                                                    ...prev,
                                                                                    cepDestino: s.CEP || ''
                                                                                }));
                                                                                setSetorDestinoComboboxOpen(false);
                                                                            }}
                                                                        >
                                                                            {s.NOME_SETOR || s.SETOR || 'Setor'}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                                {setorDestinoMalote.setorId && (
                                                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                                                        <div className="font-medium">Endereço:</div>
                                                        <div>
                                                            {setorDestinoMalote.enderecoSetor.logradouro && `${setorDestinoMalote.enderecoSetor.logradouro}`}
                                                            {setorDestinoMalote.enderecoSetor.numero && `, ${setorDestinoMalote.enderecoSetor.numero}`}
                                                            {setorDestinoMalote.enderecoSetor.complemento && ` - ${setorDestinoMalote.enderecoSetor.complemento}`}
                                                        </div>
                                                        <div>
                                                            {setorDestinoMalote.enderecoSetor.bairro && `${setorDestinoMalote.enderecoSetor.bairro}, `}
                                                            {setorDestinoMalote.enderecoSetor.cidade && `${setorDestinoMalote.enderecoSetor.cidade}`}
                                                            {setorDestinoMalote.enderecoSetor.estado && ` - ${setorDestinoMalote.enderecoSetor.estado}`}
                                                        </div>
                                                        {setorDestinoMalote.enderecoSetor.cep && (
                                                            <div className="font-medium text-blue-600">CEP: {setorDestinoMalote.enderecoSetor.cep}</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStepMalote === 2 && (
                            <div className="space-y-6">
                                {/* Dados do Malote */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Dados do Malote</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="num-malote">
                                                Nº Malote <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="num-malote"
                                                value={maloteConfig.numeroMalote}
                                                onChange={(e) => setMaloteConfig(prev => ({ ...prev, numeroMalote: e.target.value }))}
                                                placeholder="Digite o número do malote"
                                                className={!maloteConfig.numeroMalote ? 'border-red-300' : ''}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="percurso">
                                                Percurso <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="percurso"
                                                value={maloteConfig.percurso}
                                                onChange={(e) => setMaloteConfig(prev => ({ ...prev, percurso: e.target.value }))}
                                                placeholder="Digite o percurso"
                                                className={!maloteConfig.percurso ? 'border-red-300' : ''}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="ida">Ida</Label>
                                            <Input
                                                id="ida"
                                                value={maloteConfig.ida}
                                                onChange={(e) => setMaloteConfig(prev => ({ ...prev, ida: e.target.value }))}
                                                placeholder="1"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="tamanho">Tamanho</Label>
                                            <Input
                                                id="tamanho"
                                                value={maloteConfig.tamanho}
                                                onChange={(e) => setMaloteConfig(prev => ({ ...prev, tamanho: e.target.value }))}
                                                placeholder="G"
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Dias de Serviço</Label>
                                            <Popover open={diasSemanaPopoverOpen} onOpenChange={setDiasSemanaPopoverOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between"
                                                    >
                                                        {diasSemanaSelecionados.length > 0
                                                            ? diasSemanaSelecionados.join(', ')
                                                            : 'Selecione os dias da semana'}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-full p-4" align="start">
                                                    <div className="space-y-2">
                                                        <div className="text-sm font-medium mb-3">Selecione os dias de serviço:</div>
                                                        {['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'].map((dia) => (
                                                            <div key={dia} className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id={`dia-${dia}`}
                                                                    checked={diasSemanaSelecionados.includes(dia)}
                                                                    onCheckedChange={(checked) => {
                                                                        if (checked) {
                                                                            const novosDias = [...diasSemanaSelecionados, dia];
                                                                            setDiasSemanaSelecionados(novosDias);
                                                                            setMaloteConfig(prev => ({ ...prev, diasServico: novosDias.join(', ') }));
                                                                        } else {
                                                                            const novosDias = diasSemanaSelecionados.filter(d => d !== dia);
                                                                            setDiasSemanaSelecionados(novosDias);
                                                                            setMaloteConfig(prev => ({ ...prev, diasServico: novosDias.join(', ') }));
                                                                        }
                                                                    }}
                                                                />
                                                                <Label
                                                                    htmlFor={`dia-${dia}`}
                                                                    className="text-sm font-normal cursor-pointer"
                                                                >
                                                                    {dia}
                                                                </Label>
                                                            </div>
                                                        ))}
                                                        <div className="flex gap-2 mt-4 pt-3 border-t">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="flex-1"
                                                                onClick={() => {
                                                                    const todosDias = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
                                                                    setDiasSemanaSelecionados(todosDias);
                                                                    setMaloteConfig(prev => ({ ...prev, diasServico: todosDias.join(', ') }));
                                                                }}
                                                            >
                                                                Dias Úteis
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="flex-1"
                                                                onClick={() => {
                                                                    setDiasSemanaSelecionados([]);
                                                                    setMaloteConfig(prev => ({ ...prev, diasServico: '' }));
                                                                }}
                                                            >
                                                                Limpar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="estacao">Estação</Label>
                                            <Input
                                                id="estacao"
                                                value={maloteConfig.estacao}
                                                onChange={(e) => setMaloteConfig(prev => ({ ...prev, estacao: e.target.value }))}
                                                placeholder="A"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="distritos">Distritos</Label>
                                            <Input
                                                id="distritos"
                                                value={maloteConfig.distritos}
                                                onChange={(e) => setMaloteConfig(prev => ({ ...prev, distritos: e.target.value }))}
                                                placeholder="307"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Dados do Contrato */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold">Dados do Contrato</h3>
                                        <Button
                                            type="button"
                                            variant={editandoDadosContrato ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setEditandoDadosContrato(!editandoDadosContrato)}
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            {editandoDadosContrato ? 'Bloquear Edição' : 'Editar'}
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="num-contrato">Nº Contrato</Label>
                                            <Input
                                                id="num-contrato"
                                                value={maloteConfig.numeroContrato}
                                                onChange={(e) => setMaloteConfig(prev => ({ ...prev, numeroContrato: e.target.value }))}
                                                disabled={!editandoDadosContrato}
                                                className={!editandoDadosContrato ? 'bg-gray-50' : ''}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="codigo-emissao">Código de Emissão</Label>
                                            <Input
                                                id="codigo-emissao"
                                                value={maloteConfig.codigoEmissao}
                                                onChange={(e) => setMaloteConfig(prev => ({ ...prev, codigoEmissao: e.target.value }))}
                                                disabled={!editandoDadosContrato}
                                                className={!editandoDadosContrato ? 'bg-gray-50' : ''}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="data-emissao">Data de Emissão</Label>
                                            <Input
                                                id="data-emissao"
                                                value={maloteConfig.dataEmissao}
                                                onChange={(e) => setMaloteConfig(prev => ({ ...prev, dataEmissao: e.target.value }))}
                                                disabled={!editandoDadosContrato}
                                                className={!editandoDadosContrato ? 'bg-gray-50' : ''}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="validade">Validade</Label>
                                            <Input
                                                id="validade"
                                                value={maloteConfig.validade}
                                                onChange={(e) => setMaloteConfig(prev => ({ ...prev, validade: e.target.value }))}
                                                disabled={!editandoDadosContrato}
                                                className={!editandoDadosContrato ? 'bg-gray-50' : ''}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Rodapé igual ao do modal Novo Setor */}
                    <DialogFooter>
                        {/* Status do Malote movido para o rodapé - travado como Ativo */}
                        <div className="flex items-center space-x-2 mr-auto">
                            <Label htmlFor="ativo-switch-malote" className="text-sm font-medium">
                                Status:
                            </Label>
                            <span className="text-sm text-green-600 font-medium">
                                Ativo
                            </span>
                            <Switch
                                id="ativo-switch-malote"
                                checked={true}
                                disabled={true}
                                className="opacity-50"
                            />
                        </div>

                        <Button variant="outline" onClick={resetMaloteForm}>
                            Limpar Campos
                        </Button>
                        <Button variant="outline" onClick={() => setShowCreateMaloteModal(false)}>Cancelar</Button>
                        {currentStepMalote < stepsMalote.length ? (
                            <Button className="bg-primary text-white" onClick={handleNextMalote}>
                                Próximo
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button className="bg-primary text-white" onClick={handleCreateMalotePersist}>
                                Criar Malote
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal: Centro Logistico (Setar/Alterar Setor Hub) */}
            <Dialog open={showHubModal} onOpenChange={setShowHubModal}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Centro Logistico</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Setor</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between">
                                        {(() => {
                                            const hubId = configGeral.HUB_SETOR_ID;
                                            if (!hubId) return 'Selecione o setor';
                                            const setor = Array.isArray(setoresData) ? setoresData.find((s: any) => String(s.ID ?? s.id) === String(hubId)) : null;
                                            return setor?.NOME_SETOR || setor?.SETOR || 'Selecione o setor';
                                        })()}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0 w-[400px]" align="start">
                                    <Command>
                                        <CommandInput placeholder="Pesquisar setor..." />
                                        <CommandList>
                                            <CommandEmpty>Nenhum setor encontrado.</CommandEmpty>
                                            <CommandGroup>
                                                {Array.isArray(setoresData) && setoresData.map((s: any) => (
                                                    <CommandItem key={String(s.ID ?? s.id)} onSelect={() => setConfigGeral((prev: any) => ({ ...prev, HUB_SETOR_ID: Number(s.ID ?? s.id) }))}>
                                                        {s.NOME_SETOR || s.SETOR || 'Setor'}
                                                    </CommandItem>
                                                ))}
                                                <CommandItem onSelect={() => setConfigGeral((prev: any) => ({ ...prev, HUB_SETOR_ID: '' }))}>
                                                    Sem setor
                                                </CommandItem>
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowHubModal(false)}>Cancelar</Button>
                        <Button
                            onClick={async () => {
                                await salvarConfiguracoes('geral', { HUB_SETOR_ID: configGeral.HUB_SETOR_ID });
                                setShowHubModal(false);
                            }}
                            disabled={savingConfigs || !configGeral.HUB_SETOR_ID}
                            className={`${classes.button} text-white`}
                        >
                            <Save className="w-4 h-4" />
                            {savingConfigs ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal: Visualizar Malote */}
            <Dialog open={showViewMaloteModal} onOpenChange={setShowViewMaloteModal}>
                <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Visualizar Malote</DialogTitle>
                    </DialogHeader>
                    {viewMaloteData ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Nº Malote</Label>
                                    <div className="text-sm p-2 border rounded bg-muted/30">{viewMaloteData.numeroMalote || '-'}</div>
                                </div>
                                <div>
                                    <Label>Contrato</Label>
                                    <div className="text-sm p-2 border rounded bg-muted/30">{viewMaloteData.numeroContrato || '-'}</div>
                                </div>
                                <div>
                                    <Label>Setor Origem</Label>
                                    <div className="text-sm p-2 border rounded bg-muted/30">{viewMaloteData.setorOrigemNome || viewMaloteData.setorNome || '-'}</div>
                                </div>
                                <div>
                                    <Label>Setor Destino</Label>
                                    <div className="text-sm p-2 border rounded bg-muted/30">{viewMaloteData.setorDestinoNome || '-'}</div>
                                </div>
                                <div>
                                    <Label>Percurso</Label>
                                    <div className="text-sm p-2 border rounded bg-muted/30">{viewMaloteData.percurso || viewMaloteData.numeroPercurso || '-'}</div>
                                </div>
                                <div>
                                    <Label>Código Emissão</Label>
                                    <div className="text-sm p-2 border rounded bg-muted/30">{viewMaloteData.codigoEmissao || '-'}</div>
                                </div>
                                <div>
                                    <Label>Data Emissão</Label>
                                    <div className="text-sm p-2 border rounded bg-muted/30">{formatDatePTBR(viewMaloteData.dataEmissao)}</div>
                                </div>
                                <div>
                                    <Label>Validade</Label>
                                    <div className="text-sm p-2 border rounded bg-muted/30">{formatDatePTBR(viewMaloteData.validade || viewMaloteData.dataValidade)}</div>
                                </div>
                                <div>
                                    <Label>Estação</Label>
                                    <div className="text-sm p-2 border rounded bg-muted/30">{viewMaloteData.estacao || '-'}</div>
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <div className="text-sm p-2 border rounded bg-muted/30">{viewMaloteData.ativo ? 'Ativo' : 'Inativo'}</div>
                                </div>
                                <div>
                                    <Label>CEP Origem</Label>
                                    <div className="text-sm p-2 border rounded bg-muted/30">{viewMaloteData.cepOrigem || '-'}</div>
                                </div>
                                <div>
                                    <Label>CEP Destino</Label>
                                    <div className="text-sm p-2 border rounded bg-muted/30">{viewMaloteData.cepDestino || '-'}</div>
                                </div>
                                <div>
                                    <Label>Ida</Label>
                                    <div className="text-sm p-2 border rounded bg-muted/30">{viewMaloteData.ida || '-'}</div>
                                </div>
                                <div>
                                    <Label>Tamanho</Label>
                                    <div className="text-sm p-2 border rounded bg-muted/30">{viewMaloteData.tamanho || '-'}</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Mapa Origem/Destino</Label>
                                <MapaMalote
                                    setorOrigemData={viewMaloteData.setorOrigemId ? {
                                        ID: parseInt(String(viewMaloteData.setorOrigemId)),
                                        NOME: viewMaloteData.setorOrigemNome,
                                        LOGRADOURO: viewMaloteData.setorOrigemLogradouro,
                                        NUMERO: viewMaloteData.setorOrigemNumero,
                                        COMPLEMENTO: viewMaloteData.setorOrigemComplemento,
                                        BAIRRO: viewMaloteData.setorOrigemBairro,
                                        CIDADE: viewMaloteData.setorOrigemCidade,
                                        ESTADO: viewMaloteData.setorOrigemEstado,
                                        CEP: viewMaloteData.cepOrigem,
                                        LATITUDE: viewMaloteData.setorOrigemLatitude,
                                        LONGITUDE: viewMaloteData.setorOrigemLongitude
                                    } : null}
                                    setorDestinoData={viewMaloteData.setorDestinoId ? {
                                        ID: parseInt(String(viewMaloteData.setorDestinoId)),
                                        NOME: viewMaloteData.setorDestinoNome,
                                        LOGRADOURO: viewMaloteData.setorDestinoLogradouro,
                                        NUMERO: viewMaloteData.setorDestinoNumero,
                                        COMPLEMENTO: viewMaloteData.setorDestinoComplemento,
                                        BAIRRO: viewMaloteData.setorDestinoBairro,
                                        CIDADE: viewMaloteData.setorDestinoCidade,
                                        ESTADO: viewMaloteData.setorDestinoEstado,
                                        CEP: viewMaloteData.cepDestino,
                                        LATITUDE: viewMaloteData.setorDestinoLatitude,
                                        LONGITUDE: viewMaloteData.setorDestinoLongitude
                                    } : null}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">Carregando dados do malote...</div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};
