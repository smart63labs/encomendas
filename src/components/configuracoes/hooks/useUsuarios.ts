import { useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { normalizeText, formatMatriculaVinculo } from '@/lib/utils';
import type { Usuario, Setor, SortConfig, PaginationConfig } from '../types/configuracoes.types';

interface UseUsuariosReturn {
    // Estados
    usuariosData: Usuario[];
    loadingUsuarios: boolean;
    showCreateModal: boolean;
    showEditModal: boolean;
    selectedUser: Usuario | null;
    formData: any; // Usando any por enquanto devido à complexidade do form
    searchTerm: string;
    statusFilter: 'todos' | 'ativo' | 'inativo';
    perfilFilter: string;
    currentPage: number;
    itemsPerPage: number;
    viewModeUsuarios: 'grid' | 'list';
    showPassword: boolean;

    // Dados processados
    filteredAndSortedUsuarios: Usuario[];
    paginatedUsuarios: Usuario[];
    totalPages: number;
    selectedSetorUsuario: Setor | null;

    // Setters
    setUsuariosData: React.Dispatch<React.SetStateAction<Usuario[]>>;
    setShowCreateModal: React.Dispatch<React.SetStateAction<boolean>>;
    setShowEditModal: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedUser: React.Dispatch<React.SetStateAction<Usuario | null>>;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
    setStatusFilter: React.Dispatch<React.SetStateAction<'todos' | 'ativo' | 'inativo'>>;
    setPerfilFilter: React.Dispatch<React.SetStateAction<string>>;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    setItemsPerPage: React.Dispatch<React.SetStateAction<number>>;
    setViewModeUsuarios: React.Dispatch<React.SetStateAction<'grid' | 'list'>>;
    setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
    setSortConfig: React.Dispatch<React.SetStateAction<SortConfig | null>>;
    sortConfig: SortConfig | null;

    // Funções
    fetchUsuarios: () => Promise<void>;
    resetForm: () => void;
    handleUsuarioChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleCreateUser: (showInfo: Function, showError: Function) => Promise<void>;
    handleUpdateUser: (showInfo: Function, showError: Function) => Promise<void>;
    handleDeleteUser: (id: number, showInfo: Function, showError: Function) => Promise<void>;
    handleEditUser: (user: Usuario, setoresData: Setor[]) => Promise<void>;
    fetchUserById: (userId: string | number, showError: Function) => Promise<any>;
}

export const useUsuarios = (setoresData: Setor[] = [], limitSetorId?: number, limitSetorName?: string): UseUsuariosReturn => {
    // Estados
    const [usuariosData, setUsuariosData] = useState<Usuario[]>([]);
    const [loadingUsuarios, setLoadingUsuarios] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'inativo'>("todos");
    const [perfilFilter, setPerfilFilter] = useState("todos");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [viewModeUsuarios, setViewModeUsuarios] = useState<'grid' | 'list'>('list');
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        // Campos principais conforme estrutura da tabela USUARIOS
        nome: "",
        e_mail: "",
        senha: "",
        role: "",
        usuario_ativo: true,
        setor_id: "",
        matricula: "",
        vinculo_funcional: "",
        // Dados pessoais
        cpf: "",
        'pis/pasep': "",
        sexo: "",
        estado_civil: "",
        data_nascimento: "",
        pai: "",
        mae: "",
        // Documentos
        rg: "",
        tipo_rg: "",
        orgao_expeditor: "",
        uf_rg: "",
        expedicao_rg: "",
        cidade_nascimento: "",
        uf_nascimento: "",
        tipo_sanguineo: "",
        raca_cor: "",
        pne: 0,
        // Dados funcionais
        tipo_vinculo: "",
        categoria: "",
        regime_juridico: "",
        regime_previdenciario: "",
        tipo_evento: "",
        forma_provimento: "",
        codigo_cargo: "",
        cargo: "",
        escolaridade_cargo: "",
        escolaridade_servidor: "",
        formacao_profissional_1: "",
        formacao_profissional_2: "",
        jornada: "",
        nivel_referencia: "",
        comissao_funcao: "",
        data_ini_comissao: "",
        // Contato e endereço
        telefone: "",
        endereco: "",
        logradouro: "",
        numero_endereco: "",
        complemento_endereco: "",
        bairro_endereco: "",
        cidade_endereco: "",
        uf_endereco: "",
        cep_endereco: "",
        // Campos de compatibilidade
        email: "",
        perfil: "",
        ativo: true,
    });

    // Setor selecionado para o usuário
    const selectedSetorUsuario = useMemo(() => {
        if (!formData?.setor_id) return null;
        return (setoresData || []).find((s: any) => s && (s.ID || s.id) && String(s.ID ?? s.id) === String(formData.setor_id)) || null;
    }, [formData?.setor_id, setoresData]);

    const resetForm = () =>
        setFormData({
            nome: "",
            e_mail: "",
            senha: "",
            role: "",
            usuario_ativo: true,
            setor_id: "",
            matricula: "",
            vinculo_funcional: "",
            cpf: "",
            'pis/pasep': "",
            sexo: "",
            estado_civil: "",
            data_nascimento: "",
            pai: "",
            mae: "",
            rg: "",
            tipo_rg: "",
            orgao_expeditor: "",
            uf_rg: "",
            expedicao_rg: "",
            cidade_nascimento: "",
            uf_nascimento: "",
            tipo_sanguineo: "",
            raca_cor: "",
            pne: 0,
            tipo_vinculo: "",
            categoria: "",
            regime_juridico: "",
            regime_previdenciario: "",
            tipo_evento: "",
            forma_provimento: "",
            codigo_cargo: "",
            cargo: "",
            escolaridade_cargo: "",
            escolaridade_servidor: "",
            formacao_profissional_1: "",
            formacao_profissional_2: "",
            jornada: "",
            nivel_referencia: "",
            comissao_funcao: "",
            data_ini_comissao: "",
            telefone: "",
            endereco: "",
            logradouro: "",
            numero_endereco: "",
            complemento_endereco: "",
            bairro_endereco: "",
            cidade_endereco: "",
            uf_endereco: "",
            cep_endereco: "",
            email: "",
            perfil: "",
            ativo: true,
        });

    const fetchUsuarios = async () => {
        try {
            setLoadingUsuarios(true);
            let allUsers: any[] = [];
            let page = 1;
            let hasMorePages = true;

            console.log('🔄 Iniciando carregamento de TODOS os usuários...');

            while (hasMorePages) {
                const response = await api.get('/users/with-org-data', {
                    limit: 100,
                    page: page
                });

                if (response.data.success && response.data.data) {
                    const pageData = response.data.data;
                    const pagination = response.data.pagination;

                    allUsers = [...allUsers, ...pageData];

                    if (pagination && pagination.totalPages) {
                        hasMorePages = page < pagination.totalPages;
                    } else if (pageData.length < 100) {
                        hasMorePages = false;
                    } else {
                        hasMorePages = true;
                    }

                    page++;

                    if (page > 50) {
                        console.warn('⚠️ Limite de segurança atingido (50 páginas), parando...');
                        hasMorePages = false;
                    }
                } else {
                    hasMorePages = false;
                }
            }

            setUsuariosData(allUsers);
        } catch (error) {
            console.error("❌ Erro ao carregar usuários:", error);
            setUsuariosData([]);
        } finally {
            setLoadingUsuarios(false);
        }
    };

    const handleUsuarioChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'telefone') {
            const cleanPhone = value.replace(/\D/g, '');
            const limitedPhone = cleanPhone.slice(0, 10);
            let maskedPhone = '';

            if (limitedPhone.length > 0) {
                if (limitedPhone.length <= 2) {
                    maskedPhone = `(${limitedPhone}`;
                } else if (limitedPhone.length <= 6) {
                    maskedPhone = `(${limitedPhone.slice(0, 2)}) ${limitedPhone.slice(2)}`;
                } else {
                    maskedPhone = `(${limitedPhone.slice(0, 2)}) ${limitedPhone.slice(2, 6)}-${limitedPhone.slice(6)}`;
                }
            }

            setFormData((prev: any) => ({ ...prev, [name]: maskedPhone }));
        } else {
            setFormData((prev: any) => ({ ...prev, [name]: value }));
        }
    };

    const handleCreateUser = async (showInfo: Function, showError: Function) => {
        try {
            const createData = { ...formData };

            if (createData.perfil) {
                createData.perfil = createData.perfil.toUpperCase();
            }
            if (createData.role) {
                createData.role = createData.role.toUpperCase();
            }

            await api.createUser(createData);
            await fetchUsuarios();
            setShowCreateModal(false);
            resetForm();
            showInfo("Usuário criado com sucesso!", `O usuário ${formData.nome} foi adicionado ao sistema.`);
        } catch (error) {
            console.error("Erro ao criar usuário", error);
            showError("Erro ao criar usuário", "Ocorreu um erro ao tentar criar o usuário. Tente novamente.");
        }
    };

    const fetchUserById = async (userId: string | number, showError: Function) => {
        try {
            const response = await api.getUserById(userId);
            return response.data;
        } catch (error) {
            console.error("Erro ao buscar dados do usuário:", error);
            showError("Erro ao carregar dados", "Não foi possível carregar os dados completos do usuário.");
            return null;
        }
    };

    const handleUpdateUser = async (showInfo: Function, showError: Function) => {
        if (!selectedUser) return;
        try {
            const updateData = { ...formData };

            const originalPasswordHash = selectedUser.senha || (selectedUser as any).passwordHash || "";
            if (updateData.senha === originalPasswordHash || !updateData.senha || updateData.senha.trim() === "") {
                delete updateData.senha;
            }

            if (updateData.perfil) {
                updateData.perfil = updateData.perfil.toUpperCase();
            }
            if (updateData.role) {
                updateData.role = updateData.role.toUpperCase();
            }

            await api.updateUser(selectedUser.id || selectedUser.ID, updateData);
            await fetchUsuarios();
            setShowEditModal(false);
            setSelectedUser(null);
            resetForm();
            showInfo("Usuário atualizado com sucesso!", `Os dados do usuário ${formData.nome} foram atualizados.`);
        } catch (error) {
            console.error("Erro ao atualizar usuário", error);
            showError("Erro ao atualizar usuário", "Ocorreu um erro ao tentar atualizar o usuário. Tente novamente.");
        }
    };

    const handleDeleteUser = async (id: number, showInfo: Function, showError: Function) => {
        const userToDelete = usuariosData.find(user => user.id === id || user.ID === id);
        if (!confirm("Confirma a exclusão deste usuário?")) return;
        try {
            await api.deleteUser(id);
            await fetchUsuarios();
            showInfo("Usuário excluído com sucesso!", `O usuário ${userToDelete?.nome || 'selecionado'} foi removido do sistema.`);
        } catch (error) {
            console.error("Erro ao excluir usuário", error);
            showError("Erro ao excluir usuário", "Ocorreu um erro ao tentar excluir o usuário. Tente novamente.");
        }
    };

    const handleEditUser = async (user: Usuario, setoresData: Setor[]) => {
        setSelectedUser(user);

        let fetchedUser: any = null;
        try {
            if (user.id || user.ID) {
                const resp = await api.getUserById(user.id || user.ID);
                fetchedUser = (resp as any)?.data?.data ?? null;
            }
        } catch (e) {
            console.error('Falha ao carregar usuário por ID, usando dados da lista.', e);
        }

        const source = { ...(user || {}), ...(fetchedUser || {}) } as any;

        const normStr = (v: any) => {
            if (v === undefined || v === null) return '';
            return String(v).trim();
        };
        const upper = (v: any) => (v ? normStr(v).toUpperCase() : '');
        const lower = (v: any) => (v ? normStr(v).toLowerCase() : '');
        const stripAccents = (s: string) => (s ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : s);

        const mapEstadoCivil = (v: any) => {
            const x = lower(v);
            if (!x) return '';
            if (x.includes('sol')) return 'solteiro';
            if (x.includes('cas')) return 'casado';
            if (x.includes('div')) return 'divorciado';
            if (x.includes('viu')) return 'viuvo';
            return x;
        };
        const mapTipoVinculo = (v: any) => {
            const x = upper(v);
            if (!x) return '';
            if (x.includes('EFET')) return 'EFETIVO';
            if (x.includes('COMISS')) return 'COMISSIONADO';
            if (x.includes('TERCE')) return 'TERCEIRIZADO';
            if (x.includes('ESTAG')) return 'ESTAGIARIO';
            if (x.includes('TEMP')) return 'TEMPORARIO';
            return x;
        };
        const mapCategoria = (v: any) => {
            const x = upper(v);
            if (!x) return '';
            if (x.includes('SERV')) return 'SERVIDOR';
            if (x.includes('EMP')) return 'EMPREGADO';
            if (x.includes('MILIT')) return 'MILITAR';
            if (x.includes('TERCE')) return 'TERCEIRIZADO';
            return x;
        };
        const mapRegimeJuridico = (v: any) => {
            const x = upper(v);
            if (!x) return '';
            if (x.includes('ESTAT')) return 'ESTATUTARIO';
            if (x.includes('CLT')) return 'CLT';
            if (x.includes('MILIT')) return 'MILITAR';
            if (x.includes('TEMP')) return 'TEMPORARIO';
            return x;
        };
        const mapRegimePrev = (v: any) => {
            const x = upper(v);
            if (!x) return '';
            if (x.includes('RPPS')) return 'RPPS';
            if (x.includes('RGPS')) return 'RGPS';
            if (x.includes('MILIT')) return 'MILITAR';
            return x;
        };
        const mapTipoEvento = (v: any) => {
            const x = upper(stripAccents(normStr(v)));
            if (!x) return '';
            if (x.includes('ADMIS')) return 'ADMISSAO';
            if (x.includes('NOMEA')) return 'NOMEACAO';
            if (x.includes('CONTRAT')) return 'CONTRATACAO';
            if (x.includes('DESIG')) return 'DESIGNACAO';
            if (x.includes('ELEI')) return 'ELEICAO';
            return x;
        };
        const mapEscolaridade = (v: any) => {
            const x = upper(v);
            if (!x) return '';
            if (x.includes('FUND')) return 'FUNDAMENTAL';
            if (x.includes('MEDIO')) return 'MEDIO';
            if (x.includes('TEC')) return 'TECNICO';
            if (x.includes('SUP')) return 'SUPERIOR';
            if (x.includes('ESP')) return 'ESPECIALIZACAO';
            if (x.includes('MEST')) return 'MESTRADO';
            if (x.includes('DOUT')) return 'DOUTORADO';
            return x;
        };
        const mapJornada = (v: any) => {
            const x = normStr(v);
            if (!x) return '';
            const num = x.replace(/\D/g, '');
            if (['20', '30', '40', '44'].includes(num)) return num + 'H';
            return upper(x);
        };
        const mapPne = (v: any) => {
            if (v === undefined || v === null || String(v).trim() === '') return '';
            return (v === true || v === 'true' || v === '1' || v === 1 || v === 'S' || v === 'sim') ? 'SIM' : 'NAO';
        };

        const toDateInput = (v: any): string => {
            if (v === undefined || v === null) return '';
            try {
                if (v instanceof Date) {
                    return new Date(v).toISOString().slice(0, 10);
                }
                const s = String(v).trim();
                if (!s) return '';
                if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
                    return s.slice(0, 10);
                }
                const m1 = s.match(/^(\d{2})[\/](\d{2})[\/](\d{4})$/);
                if (m1) {
                    const [_, dd, mm, yyyy] = m1;
                    return `${yyyy}-${mm}-${dd}`;
                }
                const m2 = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
                if (m2) {
                    const [_, dd, mm, yyyy] = m2;
                    return `${yyyy}-${mm}-${dd}`;
                }
                const d = new Date(s);
                if (!isNaN(d.getTime())) {
                    return d.toISOString().slice(0, 10);
                }
            } catch (e) { }
            return '';
        };

        const mapTipoRg = (v: any): string => {
            const x = upper(stripAccents(v));
            if (!x) return '';
            if (x.includes('PASS')) return 'PASSAPORTE';
            if (x.includes('CTPS') || x.includes('TRABALHO')) return 'CTPS';
            if (x.includes('CNH') || x.includes('HABILIT')) return 'CNH';
            if (x.includes('RG') || x.includes('IDENTID')) return 'RG';
            return 'OUTROS';
        };

        const mapTipoSanguineo = (v: any): string => {
            const x = upper(stripAccents(v));
            if (!x) return '';
            const hasPos = x.includes('+') || x.includes('POS');
            const hasNeg = x.includes('-') || x.includes('NEG');
            const base = x.includes('ZERO') ? 'O' : x.replace(/[^ABO]/g, '');
            if (base.startsWith('AB')) {
                if (hasPos) return 'AB+';
                if (hasNeg) return 'AB-';
            } else if (base.startsWith('A')) {
                if (hasPos) return 'A+';
                if (hasNeg) return 'A-';
            } else if (base.startsWith('B')) {
                if (hasPos) return 'B+';
                if (hasNeg) return 'B-';
            } else if (base.startsWith('O')) {
                if (hasPos) return 'O+';
                if (hasNeg) return 'O-';
            }
            if (/^AB\s*\+/.test(x) || x.includes('AB POS')) return 'AB+';
            if (/^AB\s*-/.test(x) || x.includes('AB NEG')) return 'AB-';
            if (/^A\s*\+/.test(x) || x.includes('A POS')) return 'A+';
            if (/^A\s*-/.test(x) || x.includes('A NEG')) return 'A-';
            if (/^B\s*\+/.test(x) || x.includes('B POS')) return 'B+';
            if (/^B\s*-/.test(x) || x.includes('B NEG')) return 'B-';
            if (/^O\s*\+/.test(x) || x.includes('O POS')) return 'O+';
            if (/^O\s*-/.test(x) || x.includes('O NEG')) return 'O-';
            return '';
        };

        const estadoCivilNormalized = mapEstadoCivil(source.estado_civil || source.ESTADO_CIVIL || '');
        const tipoVinculoNormalized = mapTipoVinculo(source.tipo_vinculo || source.TIPO_VINCULO || '');
        const categoriaNormalized = mapCategoria(source.categoria || source.CATEGORIA || '');
        const regimeJuridicoNormalized = mapRegimeJuridico(source.regime_juridico || source.REGIME_JURIDICO || '');
        const regimePrevNormalized = mapRegimePrev(source.regime_previdenciario || source.REGIME_PREVIDENCIARIO || '');
        const tipoEventoNormalized = mapTipoEvento(source.tipo_evento || source.TIPO_EVENTO || source.evento_tipo || source.EVENTO_TIPO || '');
        const escolaridadeCargoNormalized = mapEscolaridade(source.escolaridade_cargo || source.ESCOLARIDADE_CARGO || '');
        const escolaridadeServidorNormalized = mapEscolaridade(source.escolaridade_servidor || source.ESCOLARIDADE_SERVIDOR || '');
        const jornadaNormalized = mapJornada(source.jornada || source.JORNADA || '');
        const pneNormalized = mapPne(source.pne ?? source.PNE);

        let setorIdDerivado = source.setor_id || source.SETOR_ID || '';
        const setorNomeOrig = source.setor || source.SETOR || source.departamento || source.DEPARTAMENTO || '';
        if (!setorIdDerivado && setorNomeOrig && Array.isArray(setoresData) && setoresData.length > 0) {
            const match = (setoresData || []).find((s: any) => {
                const nome = s.NOME_SETOR || s.nome_setor || s.nome;
                return nome && String(nome).trim().toLowerCase() === String(setorNomeOrig).trim().toLowerCase();
            });
            if (match) {
                setorIdDerivado = String(match.ID ?? match.id ?? '');
            }
        }

        const enderecoFromSource = source.endereco || source.ENDERECO || source.logradouro || source.LOGRADOURO || '';

        setFormData({
            nome: source.nome || source.name || source.NOME || "",
            email: source.email || source.e_mail || source.E_MAIL || "",
            perfil: (source.perfil || source.role || source.ROLE || "").toLowerCase(),
            ativo: source.ativo !== undefined ? source.ativo : (source.isActive !== undefined ? source.isActive : (source.USUARIO_ATIVO === 1)),
            cpf: source.cpf || source.CPF || "",
            'pis/pasep': source['pis/pasep'] || source.pis || source.PIS || "",
            data_nascimento: toDateInput(source.data_nascimento || source.DATA_NASCIMENTO || ""),
            sexo: source.sexo || source.SEXO || "",
            estado_civil: estadoCivilNormalized,
            rg: source.rg || source.RG || "",
            orgao_expeditor: source.orgao_expeditor || source.ORGAO_EXPEDITOR || "",
            uf_rg: source.uf_rg || source.UF_RG || "",
            expedicao_rg: toDateInput(source.expedicao_rg || source.EXPEDICAO_RG || ""),
            tipo_sanguineo: mapTipoSanguineo(source.tipo_sanguineo || source.TIPO_SANGUINEO || ""),
            raca_cor: source.raca_cor || source.RACA_COR || source.cor_raca || "",
            pne: pneNormalized,
            deficiencia: source.deficiencia || source.DEFICIENCIA || "",
            telefone: source.telefone || source.phone || source.TELEFONE || "",
            celular: source.celular || source.CELULAR || "",
            telefone_comercial: source.telefone_comercial || source.TELEFONE_COMERCIAL || "",
            email_pessoal: source.email_pessoal || source.EMAIL_PESSOAL || "",
            cep_endereco: source.cep_endereco || source.CEP_ENDERECO || source.cep || source.CEP || "",
            cidade_endereco: source.cidade_endereco || source.CIDADE_ENDERECO || source.cidade || source.CIDADE || "",
            uf_endereco: source.uf_endereco || source.UF_ENDERECO || source.uf || source.UF || "",
            endereco: enderecoFromSource,
            logradouro: enderecoFromSource,
            numero_endereco: source.numero_endereco || source.NUMERO_ENDERECO || source.numero || source.NUMERO || "",
            complemento_endereco: source.complemento_endereco || source.COMPLEMENTO_ENDERECO || source.complemento || source.COMPLEMENTO || "",
            bairro_endereco: source.bairro_endereco || source.BAIRRO_ENDERECO || source.bairro || source.BAIRRO || "",
            cep: (source.cep_endereco || source.CEP_ENDERECO || source.cep || source.CEP || ""),
            matricula: source.matricula || source.MATRICULA || "",
            vinculo_funcional: source.vinculo_funcional || source.VINCULO_FUNCIONAL || "",
            setor_id: setorIdDerivado,
            setor_nome_livre: setorNomeOrig || "",
            setor: source.setor || source.SETOR || source.departamento || source.DEPARTAMENTO || "",
            cargo: source.cargo || source.CARGO || source.role || source.ROLE || "",
            orgao: source.orgao || source.ORGAO || "",
            lotacao: source.lotacao || source.LOTACAO || "",
            hierarquia_setor: source.hierarquia_setor || source.HIERARQUIA_SETOR || "",
            municipio_lotacao: source.municipio_lotacao || source.MUNICIPIO_LOTACAO || "",
            codigo_setor: source.codigo_setor || source.CODIGO_SETOR || "",
            categoria: categoriaNormalized,
            regime_juridico: regimeJuridicoNormalized,
            regime_previdenciario: regimePrevNormalized,
            tipo_evento: tipoEventoNormalized,
            forma_provimento: source.forma_provimento || source.FORMA_PROVIMENTO || "",
            codigo_cargo: source.codigo_cargo || source.CODIGO_CARGO || "",
            escolaridade_cargo: escolaridadeCargoNormalized,
            escolaridade_servidor: escolaridadeServidorNormalized,
            formacao_profissional_1: source.formacao_profissional_1 || source.FORMACAO_PROFISSIONAL_1 || "",
            formacao_profissional_2: source.formacao_profissional_2 || source.FORMACAO_PROFISSIONAL_2 || "",
            jornada: jornadaNormalized,
            nivel_referencia: source.nivel_referencia || source.NIVEL_REFERENCIA || "",
            comissao_funcao: source.comissao_funcao || source.COMISSAO_FUNCAO || source['comissao_funçao'] || "",
            data_ini_comissao: source.data_ini_comissao || source.DATA_INI_COMISSAO || "",
            banco: source.banco || source.BANCO || "",
            agencia: source.agencia || source.AGENCIA || "",
            conta: source.conta || source.CONTA || "",
            tipo_conta: source.tipo_conta || source.TIPO_CONTA || "",
            pai: source.pai || source.PAI || "",
            mae: source.mae || source.MAE || "",
            cidade_nascimento: source.cidade_nascimento || source.CIDADE_NASCIMENTO || "",
            uf_nascimento: source.uf_nascimento || source.UF_NASCIMENTO || "",
            tipo_rg: mapTipoRg(source.tipo_rg || source.TIPO_RG || ""),
            tipo_vinculo: tipoVinculoNormalized
        });
        setShowEditModal(true);
    };

    const filteredAndSortedUsuarios = useMemo(() => {
        let filtered = usuariosData.filter((usuario) => {
            const roleString = (usuario.ROLE || usuario.perfil || '').toString();
            const createdRaw = usuario.CREATED_AT || usuario.created_at || usuario.createdAt;
            let createdString = '';
            if (createdRaw) {
                try {
                    const d = typeof createdRaw === 'string' ? new Date(createdRaw) : new Date(createdRaw as any);
                    createdString = isNaN(d.getTime()) ? String(createdRaw) : d.toLocaleDateString('pt-BR');
                } catch {
                    createdString = String(createdRaw);
                }
            }

            const search = normalizeText(searchTerm);
            const searchTerms = search.split(/\s+/).filter(Boolean);

            const perfilVal = usuario.perfil || usuario.PERFIL || usuario.ROLE || '';
            const setorVal = usuario.setor || usuario.SETOR || usuario.setorNome || usuario.SETOR_NOME || usuario.setor_nome || usuario.department || '';
            
            const matriculaVinculo = String(formatMatriculaVinculo(usuario) || '');
            const matriculaVinculoClean = matriculaVinculo.replace(/[^0-9]/g, '');

            const candidates = [
                usuario.NOME || usuario.nome || usuario.NAME || '',
                usuario.E_MAIL || usuario.EMAIL || usuario.email || '',
                matriculaVinculo,
                matriculaVinculoClean,
                String(usuario.MATRICULA || ''),
                String(usuario.numero_funcional || usuario.numeroFuncional || ''),
                String(usuario.VINCULO_FUNCIONAL || usuario.vinculo_funcional || usuario.vinculoFuncional || ''),
                setorVal,
                usuario.CARGO || usuario.cargo || '',
                perfilVal,
                (() => {
                    const raw = (usuario as any).IS_ACTIVE ?? (usuario as any).USUARIO_ATIVO ?? (usuario as any).ATIVO ?? (usuario as any).ativo;
                    const s = String(raw ?? '').trim().toLowerCase();
                    const active = (s === '1' || s === 'true' || s === 's' || s === 'sim' || s === 'y' || s === 'yes')
                      || (typeof raw === 'number' ? raw !== 0 : (typeof raw === 'boolean' ? raw : false));
                    return active ? 'ativo' : 'inativo';
                })(),
                createdString,
            ];
            
            const matchesSearch = !searchTerm || searchTerms.every(term => 
                candidates.some(c => normalizeText(String(c)).includes(term))
            );

            const rawActive = (usuario as any).IS_ACTIVE ?? (usuario as any).USUARIO_ATIVO ?? (usuario as any).ATIVO ?? (usuario as any).ativo;
            const sActive = String(rawActive ?? '').trim().toLowerCase();
            const isActive = (sActive === '1' || sActive === 'true' || sActive === 's' || sActive === 'sim' || sActive === 'y' || sActive === 'yes')
              || (typeof rawActive === 'number' ? rawActive !== 0 : (typeof rawActive === 'boolean' ? rawActive : false));

            const matchesStatus =
                statusFilter === 'todos' ||
                (statusFilter === 'ativo' && isActive) ||
                (statusFilter === 'inativo' && !isActive);

            const matchesPerfil = true;

            return matchesSearch && matchesStatus && matchesPerfil;
        });

        if (typeof limitSetorId === 'number' && !Number.isNaN(limitSetorId)) {
            const s = String(limitSetorId);
            filtered = filtered.filter((usuario: any) => {
                const setorIdRaw = usuario.SETOR_ID ?? usuario.setor_id ?? usuario.setorId;
                return String(setorIdRaw ?? '').trim() === s;
            });
        }

        if (limitSetorName && String(limitSetorName).trim().length > 0) {
            const alvo = normalizeText(String(limitSetorName));
            filtered = filtered.filter((usuario: any) => {
                const setorNomeCandidates = [
                    usuario.NOME_SETOR,
                    usuario.SETOR,
                    usuario.setor,
                    usuario.setorNome,
                    usuario.SETOR_NOME,
                    usuario.setor_nome,
                    usuario.department,
                ]
                    .filter(Boolean)
                    .map((v: any) => normalizeText(String(v)));
                return setorNomeCandidates.some((n: string) => n === alvo);
            });
        }

        if (sortConfig) {
            filtered.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                switch (sortConfig.key) {
                    case 'nome':
                        aValue = a.NOME || a.NAME || '';
                        bValue = b.NOME || b.NAME || '';
                        break;
                    case 'email':
                        aValue = a.E_MAIL || a.EMAIL || '';
                        bValue = b.E_MAIL || b.EMAIL || '';
                        break;
                    case 'matricula':
                        aValue = a.MATRICULA || 0;
                        bValue = b.MATRICULA || 0;
                        break;
                    case 'vinculo':
                        aValue = a.VINCULO_FUNCIONAL || 0;
                        bValue = b.VINCULO_FUNCIONAL || 0;
                        break;
                    case 'setor':
                        aValue = a.NOME_SETOR || '';
                        bValue = b.NOME_SETOR || '';
                        break;
                    case 'cargo':
                        aValue = a.CARGO || '';
                        bValue = b.CARGO || '';
                        break;
                    case 'ativo': {
                        const aRaw = (a as any).IS_ACTIVE ?? (a as any).USUARIO_ATIVO ?? (a as any).ATIVO ?? (a as any).ativo;
                        const bRaw = (b as any).IS_ACTIVE ?? (b as any).USUARIO_ATIVO ?? (b as any).ATIVO ?? (b as any).ativo;
                        const toBool = (raw: any) => {
                            const s = String(raw ?? '').trim().toLowerCase();
                            return (s === '1' || s === 'true' || s === 's' || s === 'sim' || s === 'y' || s === 'yes')
                              || (typeof raw === 'number' ? raw !== 0 : (typeof raw === 'boolean' ? raw : false));
                        };
                        aValue = toBool(aRaw);
                        bValue = toBool(bRaw);
                        break;
                    }
                    case 'role':
                    case 'perfil':
                        aValue = a.ROLE || a.PERFIL || '';
                        bValue = b.ROLE || b.PERFIL || '';
                        break;
                    case 'data_criacao':
                    case 'created_at':
                        aValue = a.DATA_CRIACAO || a.created_at || '';
                        bValue = b.DATA_CRIACAO || b.created_at || '';
                        break;
                    default:
                        aValue = (a as any)[sortConfig.key];
                        bValue = (b as any)[sortConfig.key];
                }

                if (sortConfig.key.includes('data') || sortConfig.key === 'created_at' || sortConfig.key === 'DATA_CRIACAO') {
                    const aDate = new Date(aValue as string).getTime();
                    const bDate = new Date(bValue as string).getTime();
                    return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
                }

                if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
                    return sortConfig.direction === 'asc'
                        ? (aValue === bValue ? 0 : aValue ? 1 : -1)
                        : (aValue === bValue ? 0 : aValue ? -1 : 1);
                }

                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
                }

                const aStr = normalizeText(String(aValue || ''));
                const bStr = normalizeText(String(bValue || ''));

                if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }, [usuariosData, searchTerm, statusFilter, perfilFilter, sortConfig, limitSetorId, limitSetorName]);

    const totalPages = Math.ceil(filteredAndSortedUsuarios.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUsuarios = filteredAndSortedUsuarios.slice(startIndex, endIndex);

    return {
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
        showPassword,
        filteredAndSortedUsuarios,
        paginatedUsuarios,
        totalPages,
        selectedSetorUsuario,
        setUsuariosData,
        setShowCreateModal,
        setShowEditModal,
        setSelectedUser,
        setFormData,
        setSearchTerm,
        setStatusFilter,
        setPerfilFilter,
        setCurrentPage,
        setItemsPerPage,
        setViewModeUsuarios,
        setShowPassword,
        setSortConfig,
        sortConfig,
        fetchUsuarios,
        resetForm,
        handleUsuarioChange,
        handleCreateUser,
        handleUpdateUser,
        handleDeleteUser,
        handleEditUser,
        fetchUserById
    };
};
