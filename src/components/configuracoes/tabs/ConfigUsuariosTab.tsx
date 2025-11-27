import React, { useState, useEffect } from 'react';
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
    Users,
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
    Key,
    Building2,
    FileText,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import ExpandableCard from "@/components/ui/expandable-card";
import MapModal from "@/components/ui/MapModal";
import MapaGeralUsuarios from "@/components/configuracoes/MapaGeralUsuarios";
import NovoUsuarioWizard from "@/components/usuarios/NovoUsuarioWizard";
import { useUsuarios } from '../hooks/useUsuarios';
import { formatMatriculaVinculo, getProfileBadgeClass } from "@/lib/utils";
import type { Setor, Usuario } from '../types/configuracoes.types';

interface ConfigUsuariosTabProps {
    setoresData: Setor[];
    limitToSetorId?: number;
    limitToSetorName?: string;
    readOnly?: boolean;
}

export const ConfigUsuariosTab: React.FC<ConfigUsuariosTabProps> = ({ setoresData, limitToSetorId, limitToSetorName, readOnly = false }) => {
    const {
        usuariosData,
        loadingUsuarios,
        showCreateModal,
        showEditModal,
        selectedUser,
        formData,
        searchTerm,
        statusFilter,
        perfilFilter,
        currentPage,
        itemsPerPage,
        viewModeUsuarios,
        filteredAndSortedUsuarios,
        paginatedUsuarios,
        totalPages,
        setUsuariosData,
        setShowCreateModal,
        setShowEditModal,
        setSelectedUser,
        setFormData,
        setSearchTerm,
        setStatusFilter,
        setPerfilFilter,
        setCurrentPage,
        setViewModeUsuarios,
        setSortConfig,
        sortConfig,
        resetForm,
        handleCreateUser,
        handleUpdateUser,
        handleDeleteUser,
        handleEditUser,
        fetchUsuarios,
    } = useUsuarios(setoresData, limitToSetorId, limitToSetorName);

    const [showMapaUsuariosModal, setShowMapaUsuariosModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isViewModeUser, setIsViewModeUser] = useState(false);

    useEffect(() => {
        fetchUsuarios();
    }, []);

    useEffect(() => {
        setViewModeUsuarios('list');
    }, []);

    useEffect(() => {
        setViewModeUsuarios('list');
    }, [limitToSetorId, limitToSetorName]);

    // Helper para renderizar cabeçalho ordenável
    const renderSortableHeader = (key: string, label: string, className?: string) => (
        <TableHead
            className={`cursor-pointer hover:bg-muted/50 transition-colors ${className}`}
            onClick={() => {
                setSortConfig(current => ({
                    key,
                    direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
                }));
            }}
        >
            <div className="flex items-center gap-2">
                {label}
                {sortConfig?.key === key && (
                    <span className="text-xs text-muted-foreground">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                )}
            </div>
        </TableHead>
    );

    const handleViewUser = (user: Usuario) => {
        setIsViewModeUser(true);
        handleEditUser(user, setoresData);
    };

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" /> Configurações de Usuários
                            </CardTitle>
                            <CardDescription>
                                Gerencie os usuários do sistema
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            {!readOnly && (
                                <Button
                                    onClick={() => {
                                        resetForm();
                                        setShowCreateModal(true);
                                    }}
                                    className="bg-primary text-white hover:bg-primary/90"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Novo Usuário
                                </Button>
                            )}
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
                                    placeholder="Buscar por nome, email, matrícula ou setor..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
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
                            Exibindo {paginatedUsuarios.length} de {filteredAndSortedUsuarios.length} usuários
                        </p>
                        <div className="flex items-center gap-2">
                            {(searchTerm || statusFilter !== "todos") && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSearchTerm("");
                                        setStatusFilter("todos");
                                        setPerfilFilter("todos");
                                    }}
                                >
                                    Limpar Filtros
                                </Button>
                            )}
                                
                            <div className="flex border rounded-md">
                                <Button
                                    variant={viewModeUsuarios === 'grid' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewModeUsuarios('grid')}
                                    className="rounded-r-none border-r"
                                >
                                    <Grid3X3 className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant={viewModeUsuarios === 'list' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewModeUsuarios('list')}
                                    className="rounded-l-none"
                                >
                                    <List className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-md border overflow-x-auto">
                        {viewModeUsuarios === 'list' ? (
                            <Table className="min-w-full">
                                <TableHeader>
                                    <TableRow>
                                        {renderSortableHeader('nome', 'Nome', 'min-w-[200px] w-[200px]')}
                                        {renderSortableHeader('numero_funcional', 'Matrícula', 'min-w-[120px] w-[120px]')}
                                        {renderSortableHeader('email', 'Email', 'min-w-[200px] w-[200px]')}
                                        {renderSortableHeader('perfil', 'Perfil', 'min-w-[100px] w-[100px]')}
                                        {renderSortableHeader('ativo', 'Status', 'min-w-[80px] w-[80px]')}
                                        {renderSortableHeader('setor', 'Setor', 'min-w-[150px] w-[150px]')}
                                        {renderSortableHeader('created_at', 'Criado em', 'min-w-[140px] w-[140px]')}
                                        <TableHead className="text-right min-w-[100px] w-[100px]">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingUsuarios ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center">
                                                <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
                                            </TableCell>
                                        </TableRow>
                                    ) : !Array.isArray(filteredAndSortedUsuarios) || filteredAndSortedUsuarios.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center">
                                                {usuariosData.length === 0
                                                    ? "Nenhum usuário encontrado."
                                                    : "Nenhum usuário corresponde aos filtros aplicados."
                                                }
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedUsuarios.map((u) => (
                                            <TableRow key={u.ID || u.id}>
                                                <TableCell className="font-medium min-w-[200px] w-[200px] py-2 px-3">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="truncate block text-xs">
                                                                    {u.nome || u.NAME || '-'}
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{u.nome || u.NAME || '-'}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </TableCell>
                                                <TableCell className="text-blue-600 font-medium min-w-[120px] w-[120px] py-2 px-3">
                                                    <span className="text-xs">{formatMatriculaVinculo(u)}</span>
                                                </TableCell>
                                                <TableCell className="min-w-[200px] w-[200px] py-2 px-3">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="truncate block text-xs">
                                                                    {u.email || u.EMAIL || '-'}
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{u.email || u.EMAIL || '-'}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </TableCell>
                                                <TableCell className="min-w-[100px] w-[100px] py-2 px-3">
                                                    <Badge className={getProfileBadgeClass(u.perfil || u.ROLE || 'USER')}>
                                                        <span className="text-xs">{u.perfil || u.ROLE || 'USER'}</span>
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="min-w-[80px] w-[80px] py-2 px-3">
                                                    <Badge variant={u.ativo ? "default" : "secondary"} size="sm">
                                                        <span className="text-xs">{u.ativo ? 'Ativo' : 'Inativo'}</span>
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="min-w-[150px] w-[150px] py-2 px-3">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="text-xs truncate block">{u.setor || u.SETOR || u.setorNome || u.SETOR_NOME || u.setor_nome || '-'}</span>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{u.setor || u.SETOR || u.setorNome || u.SETOR_NOME || u.setor_nome || '-'}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </TableCell>
                                                <TableCell className="min-w-[140px] w-[140px] py-2 px-3">
                                                    {(() => {
                                                        const dateValue = u.CREATED_AT || u.created_at || u.createdAt;
                                                        if (!dateValue) return <span className="text-sm">N/A</span>;

                                                        try {
                                                            let date;
                                                            if (typeof dateValue === 'string' && dateValue.includes('/')) {
                                                                const [datePart] = dateValue.split(' ');
                                                                const [day, month, year] = datePart.split('/');
                                                                const fullYear = year.length === 2 ? `20${year}` : year;
                                                                date = new Date(`${fullYear}-${month}-${day}`);
                                                            } else {
                                                                date = new Date(dateValue);
                                                            }

                                                            if (isNaN(date.getTime())) return <span className="text-xs">N/A</span>;

                                                            return (
                                                                <span className="text-xs">
                                                                    {date.toLocaleDateString('pt-BR')}
                                                                </span>
                                                            );
                                                        } catch (error) {
                                                            return <span className="text-xs">N/A</span>;
                                                        }
                                                    })()}
                                                </TableCell>
                                                <TableCell className="text-right min-w-[100px] w-[100px] py-2 px-2">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Abrir menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleViewUser(u)}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                Visualizar
                                                            </DropdownMenuItem>
                                                            {!readOnly && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleEditUser(u, setoresData)}
                                                                >
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Editar
                                                                </DropdownMenuItem>
                                                            )}
                                                            {!readOnly && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleDeleteUser(u.id || u.ID, () => { }, () => { })}
                                                                    className="text-red-600"
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Excluir
                                                                </DropdownMenuItem>
                                                            )}
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
                                {loadingUsuarios ? (
                                    Array.from({ length: 6 }).map((_, index) => (
                                        <Card key={index} className="animate-pulse">
                                            <CardContent className="p-4">
                                                <div className="space-y-3">
                                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : filteredAndSortedUsuarios.length === 0 ? (
                                    <div className="col-span-full text-center py-8 text-muted-foreground">
                                        Nenhum usuário encontrado
                                    </div>
                                ) : (
                                    paginatedUsuarios.map((u) => (
                                        <ExpandableCard
                                            key={u.id || u.ID}
                                            className="hover:shadow-md transition-shadow"
                                            header={
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold text-base truncate" title={u.nome || u.NAME}>
                                                        {u.nome || u.NAME || "Nome não informado"}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground truncate" title={u.email || u.EMAIL}>
                                                        {u.email || u.EMAIL || "Email não informado"}
                                                    </p>
                                                </div>
                                            }
                                            actions={
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={u.ativo ? "default" : "secondary"} className="text-xs shrink-0">
                                                        {u.ativo ? 'Ativo' : 'Inativo'}
                                                    </Badge>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Abrir menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleViewUser(u)}>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                Visualizar
                                                            </DropdownMenuItem>
                                                            {!readOnly && (
                                                                <DropdownMenuItem onClick={() => handleEditUser(u, setoresData)}>
                                                                    <Edit className="mr-2 h-4 w-4" />
                                                                    Editar
                                                                </DropdownMenuItem>
                                                            )}
                                                            {!readOnly && (
                                                                <DropdownMenuItem onClick={() => handleDeleteUser(u.id || u.ID, () => { }, () => { })} className="text-red-600">
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Excluir
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            }
                                        >
                                            <Separator />
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div className="space-y-2">
                                                    <div>
                                                        <span className="text-muted-foreground block">Matrícula:</span>
                                                        <span className="font-medium">{formatMatriculaVinculo(u)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground block">Perfil:</span>
                                                        <Badge className={getProfileBadgeClass(u.perfil || u.ROLE || "USER")}>
                                                            <span className="text-xs capitalize">{u.perfil || u.ROLE || "USER"}</span>
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div>
                                                        <span className="text-muted-foreground block">Setor:</span>
                                                        <span className="font-medium text-xs leading-tight" title={u.setor || u.department || "N/A"}>
                                                            {u.setor || u.department || "N/A"}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground block">Criado em:</span>
                                                        <span className="font-medium">
                                                            {(() => {
                                                                const dateValue = u.createdAt || u.created_at || u.CREATED_AT;
                                                                if (!dateValue) return "N/A";

                                                                try {
                                                                    let date;
                                                                    if (typeof dateValue === 'string') {
                                                                        if (dateValue.includes('/') && dateValue.includes(',')) {
                                                                            const [datePart, timePart] = dateValue.split(' ');
                                                                            const [day, month, year] = datePart.split('/');
                                                                            const fullYear = year.length === 2 ? `20${year}` : year;
                                                                            const timeWithoutNanos = timePart.split(',')[0];
                                                                            date = new Date(`${fullYear}-${month}-${day}T${timeWithoutNanos}`);
                                                                        } else {
                                                                            date = new Date(dateValue);
                                                                        }
                                                                    } else {
                                                                        date = new Date(dateValue);
                                                                    }

                                                                    if (isNaN(date.getTime())) return "N/A";

                                                                    return date.toLocaleDateString('pt-BR');
                                                                } catch {
                                                                    return "N/A";
                                                                }
                                                            })()}
                                                        </span>
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
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>
                                    Mostrando {startIndex + 1} a {Math.min(endIndex, filteredAndSortedUsuarios.length)} de {filteredAndSortedUsuarios.length} usuários
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    Anterior
                                </Button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(page => {
                                            const distance = Math.abs(page - currentPage);
                                            return distance === 0 || distance === 1 || page === 1 || page === totalPages;
                                        })
                                        .map((page, index, array) => {
                                            const prevPage = array[index - 1];
                                            const showEllipsis = prevPage && page - prevPage > 1;

                                            return (
                                                <div key={page} className="flex items-center gap-1">
                                                    {showEllipsis && <span className="text-muted-foreground">...</span>}
                                                    <Button
                                                        variant={currentPage === page ? "default" : "outline"}
                                                        size="sm"
                                                        className="w-8 h-8 p-0"
                                                        onClick={() => setCurrentPage(page)}
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
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    Próximo
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal do Mapa Geral de Usuários */}
            <MapModal
                isOpen={showMapaUsuariosModal}
                onClose={() => setShowMapaUsuariosModal(false)}
                title="Mapa Geral dos Usuários"
                size="large"
            >
                <MapaGeralUsuarios
                    usuarios={usuariosData}
                    setores={setoresData}
                    isVisible={true}
                    refreshTrigger={refreshTrigger}
                />
            </MapModal>

            {/* Dialogs CRUD Usuário */}
            <Dialog open={showCreateModal} onOpenChange={(open) => {
                setShowCreateModal(open);
                if (!open) {
                    setFormData(prev => ({ ...prev, currentStep: 1 }));
                }
            }}>
                <DialogContent className="sm:max-w-[1200px] max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Novo Usuário</DialogTitle>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-sm text-muted-foreground">Progresso do cadastro</div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${((formData.currentStep || 1) / 6) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-center">
                            {[
                                { id: 1, title: 'Acesso', icon: Key },
                                { id: 2, title: 'Pessoal e Contatos', icon: Users },
                                { id: 3, title: 'Endereço', icon: MapPin },
                                { id: 4, title: 'Lotação', icon: Building2 },
                                { id: 5, title: 'Funcionais', icon: FileText },
                                { id: 6, title: 'Revisão', icon: Eye }
                            ].map((step, index) => {
                                const isActive = (formData.currentStep || 1) === step.id;
                                const isCompleted = (formData.currentStep || 1) > step.id;
                                const Icon = step.icon;
                                return (
                                    <div key={step.id} className="flex items-center">
                                        <div className={`flex items-center gap-2 px-3 py-1 rounded ${isActive ? 'bg-blue-50' : ''}`}>
                                            <div className={`w-7 h-7 rounded-full border flex items-center justify-center ${isActive ? 'border-blue-600 bg-white text-blue-600' : isCompleted ? 'border-green-600 bg-green-50 text-green-600' : 'border-gray-300 bg-white text-gray-500'}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <span className={`text-sm ${isActive ? 'text-blue-700 font-medium' : 'text-gray-600'}`}>{step.title}</span>
                                        </div>
                                        {index < 5 && (
                                            <div className={`w-12 h-0.5 mx-2 ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between items-center">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    const currentStep = formData.currentStep || 1;
                                    if (currentStep > 1) {
                                        setFormData(prev => ({ ...prev, currentStep: currentStep - 1 }));
                                    }
                                }}
                                disabled={(formData.currentStep || 1) === 1}
                                className="gap-2 h-9"
                            >
                                <ChevronLeft className="w-4 h-4" /> Anterior
                            </Button>
                            <div className="text-xs text-muted-foreground">Etapa {formData.currentStep || 1} de 6</div>
                            <div className="flex gap-3">
                                {(formData.currentStep || 1) < 6 && (
                                    <Button
                                        onClick={() => {
                                            const currentStep = formData.currentStep || 1;
                                            if (currentStep < 6) {
                                                setFormData(prev => ({ ...prev, currentStep: currentStep + 1 }));
                                            }
                                        }}
                                        className="bg-primary text-white gap-2 h-9"
                                    >
                                        {(formData.currentStep || 1) === 5 ? 'Finalizar' : 'Próximo'}
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="py-3 flex-1 overflow-y-auto">
                        <NovoUsuarioWizard
                            formData={formData}
                            setFormData={setFormData}
                            setores={setoresData}
                            onCancel={() => setShowCreateModal(false)}
                            onCreateUser={() => handleCreateUser(() => { }, () => { })}
                        />
                    </div>
                    <DialogFooter>
                        <div className="flex items-center space-x-2 mr-auto">
                            <Label htmlFor="ativo-switch" className="text-sm font-medium">
                                Status:
                            </Label>
                            <span className="text-sm text-green-600 font-medium">
                                Ativo
                            </span>
                            <Switch
                                id="ativo-switch"
                                checked={true}
                                disabled={true}
                                className="opacity-50"
                            />
                        </div>

                        <Button variant="outline" onClick={resetForm}>
                            Limpar Campos
                        </Button>
                        <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                            Cancelar
                        </Button>
                        <Button className="bg-primary text-white" onClick={() => handleCreateUser(() => { }, () => { })}>
                            Criar Usuário
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Edição/Visualização de Usuário */}
            <Dialog open={showEditModal} onOpenChange={(open) => {
                setShowEditModal(open);
                if (!open) {
                    setIsViewModeUser(false);
                    setFormData(prev => ({ ...prev, currentStep: 1 }));
                }
            }}>
                <DialogContent className="sm:max-w-[1200px] max-h-[90vh] flex flex-col">
                    <DialogHeader className="space-y-4">
                        <DialogTitle>{isViewModeUser ? 'Visualizar Usuário' : 'Editar Usuário'}</DialogTitle>
                        <>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm text-muted-foreground">Progresso do cadastro</div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${((formData.currentStep || 1) / 6) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-center">
                                {[
                                    { id: 1, title: 'Acesso', icon: Key },
                                    { id: 2, title: 'Pessoal e Contatos', icon: Users },
                                    { id: 3, title: 'Endereço', icon: MapPin },
                                    { id: 4, title: 'Lotação', icon: Building2 },
                                    { id: 5, title: 'Funcionais', icon: FileText },
                                    { id: 6, title: 'Revisão', icon: Eye }
                                ].map((step, index) => {
                                    const isActive = (formData.currentStep || 1) === step.id;
                                    const isCompleted = (formData.currentStep || 1) > step.id;
                                    const Icon = step.icon;
                                    return (
                                        <div key={step.id} className="flex items-center">
                                            <div className={`flex items-center gap-2 px-3 py-1 rounded ${isActive ? 'bg-blue-50' : ''}`}>
                                                <div className={`w-7 h-7 rounded-full border flex items-center justify-center ${isActive ? 'border-blue-600 bg-white text-blue-600' : isCompleted ? 'border-green-600 bg-green-50 text-green-600' : 'border-gray-300 bg-white text-gray-500'}`}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <span className={`text-sm ${isActive ? 'text-blue-700 font-medium' : 'text-gray-600'}`}>{step.title}</span>
                                            </div>
                                            {index < 5 && (
                                                <div className={`w-12 h-0.5 mx-2 ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}`} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex justify-between items-center">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        const currentStep = formData.currentStep || 1;
                                        if (currentStep > 1) {
                                            setFormData(prev => ({ ...prev, currentStep: currentStep - 1 }));
                                        }
                                    }}
                                    disabled={(formData.currentStep || 1) === 1}
                                    className="gap-2 h-9"
                                >
                                    <ChevronLeft className="w-4 h-4" /> Anterior
                                </Button>
                                <div className="text-xs text-muted-foreground">Etapa {formData.currentStep || 1} de 6</div>
                                <div className="flex gap-3">
                                    {(formData.currentStep || 1) < 6 && (
                                        <Button
                                            onClick={() => {
                                                const currentStep = formData.currentStep || 1;
                                                if (currentStep < 6) {
                                                    setFormData(prev => ({ ...prev, currentStep: currentStep + 1 }));
                                                }
                                            }}
                                            className="bg-primary text-white gap-2 h-9"
                                        >
                                            {(formData.currentStep || 1) === 5 ? 'Finalizar' : 'Próximo'}
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </>
                    </DialogHeader>
                    <div className="py-3 flex-1 overflow-y-auto">
                        <div className={isViewModeUser ? 'pointer-events-none' : ''}>
                            <NovoUsuarioWizard
                                formData={formData}
                                setFormData={setFormData}
                                onCancel={() => setShowEditModal(false)}
                                onCreateUser={() => handleCreateUser(() => { }, () => { })}
                                onUpdateUser={() => handleUpdateUser(() => { }, () => { })}
                                isEditMode={true}
                                selectedUser={selectedUser}
                                setores={setoresData}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        {isViewModeUser ? (
                            <Button variant="outline" onClick={() => setShowEditModal(false)}>
                                Fechar
                            </Button>
                        ) : (
                            <>
                                <div className="flex items-center space-x-2 mr-auto">
                                    <Label htmlFor="ativo-switch-edit" className="text-sm font-medium">
                                        Status:
                                    </Label>
                                    <span className={`text-sm font-medium ${formData.ativo ? 'text-green-600' : 'text-red-600'}`}>
                                        {formData.ativo ? 'Ativo' : 'Inativo'}
                                    </span>
                                    <Switch
                                        id="ativo-switch-edit"
                                        checked={formData.ativo || false}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
                                    />
                                </div>
                                <Button variant="outline" onClick={resetForm}>
                                    Limpar Campos
                                </Button>
                                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                                    Cancelar
                                </Button>
                                <Button className="bg-primary text-white" onClick={() => handleUpdateUser(() => { }, () => { })}>
                                    Atualizar Usuário
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
