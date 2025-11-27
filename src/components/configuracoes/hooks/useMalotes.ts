import { useState, useEffect, useMemo } from 'react';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Malote, Setor } from '../types/configuracoes.types';
import { MailMinus as MailMinusIcon, FileText } from 'lucide-react';

export function useMalotes(setoresData: Setor[]) {
    const { toast } = useToast();

    // Estados para Malotes
    const [loadingMalotes, setLoadingMalotes] = useState(false);
    const [malotesData, setMalotesData] = useState<Malote[]>([]);
    const [showCreateMaloteModal, setShowCreateMaloteModal] = useState(false);
    const [showHubModal, setShowHubModal] = useState(false);
    const [showViewMaloteModal, setShowViewMaloteModal] = useState(false);
    const [viewMaloteData, setViewMaloteData] = useState<Malote | null>(null);
    const [isEditingMalote, setIsEditingMalote] = useState(false);
    const [editingMaloteId, setEditingMaloteId] = useState<number | null>(null);
    const [searchTermMalote, setSearchTermMalote] = useState("");
    const [statusFilterMalote, setStatusFilterMalote] = useState("todos");
    const [viewModeMalote, setViewModeMalote] = useState<'grid' | 'list'>('list');
    const [currentPageMalote, setCurrentPageMalote] = useState(1);
    const [itemsPerPageMalote] = useState(10);

    // Estado: Configurações de Malote - Setor Origem
    const [setorOrigemMalote, setSetorOrigemMalote] = useState({
        setorId: '',
        setorNome: '',
        latitude: null as number | null,
        longitude: null as number | null,
        enderecoSetor: {
            logradouro: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: '',
            cep: ''
        }
    });

    // Estado: Configurações de Malote - Setor Destino
    const [setorDestinoMalote, setSetorDestinoMalote] = useState({
        setorId: '',
        setorNome: '',
        latitude: null as number | null,
        longitude: null as number | null,
        enderecoSetor: {
            logradouro: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: '',
            cep: ''
        }
    });

    // Estado: Configurações de Malote - Dados Gerais
    const [maloteConfig, setMaloteConfig] = useState({
        // Dados do Contrato (fictícios)
        numeroContrato: '9912565780',
        percurso: '',
        codigoEmissao: 'VG275SIGMA',
        dataEmissao: '24/02/2022',
        validade: '24/02/2027',
        // Dados do Malote (com valores padrão sugeridos)
        ida: '1',
        numeroMalote: '',
        tamanho: 'G',
        diasServico: 'Segunda-feira, Terça-feira, Quarta-feira, Quinta-feira, Sexta-feira',
        estacao: 'A',
        distritos: '307',
        ativo: true,
        cepOrigem: '',
        cepDestino: ''
    });

    // Wizard: Novo Malote (2 etapas)
    const [currentStepMalote, setCurrentStepMalote] = useState(1);
    const stepsMalote = [
        { id: 1, title: 'Origem / Destino', icon: MailMinusIcon },
        { id: 2, title: 'Malote / Contrato', icon: FileText }
    ];
    const progressMalote = (currentStepMalote / stepsMalote.length) * 100;

    const [setorComboboxOpenMalote, setSetorComboboxOpenMalote] = useState(false);
    const [setorOrigemComboboxOpen, setSetorOrigemComboboxOpen] = useState(false);
    const [setorDestinoComboboxOpen, setSetorDestinoComboboxOpen] = useState(false);
    const [editandoDadosContrato, setEditandoDadosContrato] = useState(false);
    const [diasSemanaPopoverOpen, setDiasSemanaPopoverOpen] = useState(false);
    const [diasSemanaSelecionados, setDiasSemanaSelecionados] = useState<string[]>(['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira']);

    // Estado para controlar expansão dos grupos de malotes
    const [expandedMaloteGroups, setExpandedMaloteGroups] = useState<Record<string, boolean>>({});

    // Helpers de Toast
    const showError = (title: string, description: string) => {
        toast({ variant: "destructive", title, description });
    };

    const showSuccess = (title: string, description: string) => {
        toast({ title, description, className: "bg-green-500 text-white" });
    };

    // Normaliza registros vindos da API para o shape da UI
    const normalizeMaloteFromApi = (item: any) => {
        // Derivar nome do setor a partir de setoresData e setorId/SETOR_ID
        const setorIdFromItem = item?.setorId ?? item?.SETOR_ID;
        let setorNomeDerivado = '';
        if (setorIdFromItem && Array.isArray(setoresData) && setoresData.length > 0) {
            const setorMatch = (setoresData || []).find((s: any) => {
                const sid = s?.ID ?? s?.id;
                return sid && String(sid) === String(setorIdFromItem);
            });
            if (setorMatch) {
                setorNomeDerivado = setorMatch.NOME_SETOR || setorMatch.SETOR || setorMatch.NOME || '';
            }
        }

        // Derivar Setor Origem/Destino a partir de IDs/CEPs quando possível
        const origemId = item?.setorOrigemId ?? item?.SETOR_ORIGEM_ID ?? setorIdFromItem;
        const destinoId = item?.setorDestinoId ?? item?.SETOR_DESTINO_ID;
        const cepOrigem = item?.cepOrigem ?? item?.CEP_ORIGEM;
        const cepDestino = item?.cepDestino ?? item?.CEP_DESTINO;

        const findSetorNome = (id?: any, cep?: any) => {
            if (!Array.isArray(setoresData) || setoresData.length === 0) return '';
            let match: any = null;
            if (id) {
                match = (setoresData || []).find((s: any) => {
                    const sid = s?.ID ?? s?.id;
                    return sid && String(sid) === String(id);
                });
            }
            if (!match && cep) {
                match = (setoresData || []).find((s: any) => {
                    const scep = s?.CEP ?? s?.cep;
                    return scep && String(scep).replace(/\D/g, '') === String(cep).replace(/\D/g, '');
                });
            }
            return match ? (match.NOME_SETOR || match.SETOR || match.NOME || '') : '';
        };

        const setorOrigemNomeDerivado = findSetorNome(origemId, cepOrigem);
        const setorDestinoNomeDerivado = findSetorNome(destinoId, cepDestino);

        return {
            ...item,
            percurso: item.percurso ?? item.numeroPercurso,
            validade: item.validade ?? item.dataValidade,
            setorNome: item.setorNome ?? setorNomeDerivado ?? '',
            // Priorizar nomes que vêm do JOIN do backend (SETOR_ORIGEM_NOME, SETOR_DESTINO_NOME)
            setorOrigemNome: item.setorOrigemNome ?? item.SETOR_ORIGEM_NOME ?? setorOrigemNomeDerivado ?? '',
            setorDestinoNome: item.setorDestinoNome ?? item.SETOR_DESTINO_NOME ?? setorDestinoNomeDerivado ?? '',
            // Garantir que os IDs também estejam disponíveis
            setorDestinoId: item.setorDestinoId ?? item.SETOR_DESTINO_ID,
            setorOrigemId: item.setorOrigemId ?? item.SETOR_ORIGEM_ID
        };
    };

    // Carrega lista de malotes do backend
    const fetchMalotes = async () => {
        try {
            setLoadingMalotes(true);
            // Passando limit=1000 para carregar todos os registros
            const response = await api.get('/malotes', { limit: 1000 });
            console.log('🔍 Resposta da API de malotes:', response.data);
            const data = response.data.success ? response.data.data : response.data;
            console.log('🔍 Data extraída:', data);
            const lista = Array.isArray(data) ? data : [];
            console.log('🔍 Lista de malotes (antes normalização):', lista);
            // Normalizar cada registro para incluir setorNome derivado
            const normalizada = lista.map((x: any) => {
                const norm = normalizeMaloteFromApi(x);
                console.log('🔍 Malote normalizado:', { original: x, normalizado: norm });
                return norm;
            });
            console.log('🔍 Malotes normalizados (total):', normalizada.length);
            setMalotesData(normalizada);
        } catch (error) {
            console.error('❌ Erro ao buscar malotes:', error);
            setMalotesData([]);
            showError("Erro ao carregar malotes", "Não foi possível carregar a lista de malotes.");
        } finally {
            setLoadingMalotes(false);
        }
    };

    // Monta o payload alinhado aos campos fillable do backend
    const buildMalotePayload = () => {
        const setorOrigemIdVal = (setorOrigemMalote as any)?.setorId || (maloteConfig as any)?.setorId || '';
        const setorDestinoIdVal = (setorDestinoMalote as any)?.setorId || '';
        return {
            numeroContrato: maloteConfig.numeroContrato,
            numeroPercurso: (maloteConfig as any).percurso,
            codigoEmissao: maloteConfig.codigoEmissao,
            dataEmissao: maloteConfig.dataEmissao,
            dataValidade: (maloteConfig as any).validade,
            numeroMalote: maloteConfig.numeroMalote,
            cepOrigem: (maloteConfig as any).cepOrigem,
            cepDestino: (maloteConfig as any).cepDestino,
            ida: maloteConfig.ida,
            tamanho: maloteConfig.tamanho,
            diasServico: maloteConfig.diasServico,
            estacao: maloteConfig.estacao,
            distritos: maloteConfig.distritos,
            ativo: maloteConfig.ativo,
            // Campos exigidos pelo backend (Oracle: SETOR_ORIGEM_ID é NOT NULL)
            setorOrigemId: setorOrigemIdVal ? parseInt(setorOrigemIdVal) : undefined,
            setorDestinoId: setorDestinoIdVal ? parseInt(setorDestinoIdVal) : undefined,
        } as any;
    };

    const resetMaloteForm = () => {
        setMaloteConfig({
            setorId: '', // Added missing property
            setorNome: '', // Added missing property
            enderecoSetor: { // Added missing property
                logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: ''
            },
            numeroContrato: '9912565780',
            percurso: '',
            codigoEmissao: 'VG275SIGMA',
            dataEmissao: '24/02/2022',
            validade: '24/02/2027',
            ida: '1',
            numeroMalote: '',
            tamanho: 'G',
            diasServico: 'Segunda-feira, Terça-feira, Quarta-feira, Quinta-feira, Sexta-feira',
            estacao: 'A',
            distritos: '307',
            ativo: true,
            cepOrigem: '',
            cepDestino: ''
        } as any);
        setSetorOrigemMalote({
            setorId: '',
            setorNome: '',
            latitude: null,
            longitude: null,
            enderecoSetor: { logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' }
        });
        setSetorDestinoMalote({
            setorId: '',
            setorNome: '',
            latitude: null,
            longitude: null,
            enderecoSetor: { logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' }
        });
        setCurrentStepMalote(1);
        setIsEditingMalote(false);
        setEditingMaloteId(null);
    };

    const handleCreateMalote = async () => {
        try {
            // Validar setor origem obrigatório (SETOR_ORIGEM_ID é NOT NULL no Oracle)
            const origemIdStr = (setorOrigemMalote as any)?.setorId || (maloteConfig as any)?.setorId || '';
            const origemId = origemIdStr ? parseInt(origemIdStr) : NaN;
            if (!origemId || Number.isNaN(origemId)) {
                showError('Validação', 'Selecione o Setor Origem antes de criar o malote.');
                return;
            }
            const payload = buildMalotePayload();
            const resp = await api.createMalote(payload);
            const sucesso = (resp as any)?.data?.success ?? (resp as any)?.success;
            const dado = (resp as any)?.data?.data ?? (resp as any)?.data;
            if (sucesso && dado) {
                const novo = normalizeMaloteFromApi(dado);
                setMalotesData(prev => [novo, ...prev]);
                setShowCreateMaloteModal(false);
                showSuccess('Malote criado', 'O malote foi criado com sucesso.');
                resetMaloteForm();
            } else {
                throw new Error((resp as any)?.data?.message || 'Falha ao criar malote');
            }
        } catch (error: any) {
            console.error('Erro ao criar malote:', error);
            showError('Erro', 'Não foi possível criar o malote.');
        }
    };

    // Persistência backend: criação de malote com CEPs sincronizados
    const handleCreateMalotePersist = async () => {
        try {
            // Validação dos campos obrigatórios do Step 2
            if (!maloteConfig.numeroMalote || !maloteConfig.percurso) {
                showError('Campos obrigatórios', 'Preencha o Nº Malote e o Percurso antes de criar o malote.');
                return;
            }

            // Validar setores origem e destino do Step 1
            const setorOrigemId = String(setorOrigemMalote?.setorId || '').trim();
            const setorDestinoId = String(setorDestinoMalote?.setorId || '').trim();
            const cepOrigem = String(setorOrigemMalote?.enderecoSetor?.cep || maloteConfig.cepOrigem || '').trim();
            const cepDestino = String(setorDestinoMalote?.enderecoSetor?.cep || maloteConfig.cepDestino || '').trim();

            if (!setorOrigemId) {
                showError('Setor Origem obrigatório', 'Selecione o setor de origem no Step 1.');
                return;
            }
            if (!setorDestinoId) {
                showError('Setor Destino obrigatório', 'Selecione o setor de destino no Step 1.');
                return;
            }
            if (!cepOrigem) {
                showError('CEP Origem obrigatório', 'O CEP do setor de origem não foi encontrado.');
                return;
            }
            if (!cepDestino) {
                showError('CEP Destino obrigatório', 'O CEP do setor de destino não foi encontrado.');
                return;
            }

            const payload = {
                numeroContrato: maloteConfig.numeroContrato,
                numeroPercurso: (maloteConfig as any).percurso,
                codigoEmissao: maloteConfig.codigoEmissao,
                dataEmissao: maloteConfig.dataEmissao,
                dataValidade: (maloteConfig as any).validade,
                numeroMalote: maloteConfig.numeroMalote,
                cepOrigem,
                cepDestino,
                ida: maloteConfig.ida,
                tamanho: maloteConfig.tamanho,
                diasServico: maloteConfig.diasServico,
                estacao: maloteConfig.estacao,
                distritos: maloteConfig.distritos,
                ativo: Boolean(maloteConfig.ativo),
                setorOrigemId: Number(setorOrigemId),
                setorDestinoId: Number(setorDestinoId),
            } as any;

            const resp = isEditingMalote
                ? await api.updateMalote(String(editingMaloteId ?? ''), payload)
                : await api.createMalote(payload);

            // Recarregar dados do backend para garantir sincronização
            await fetchMalotes();

            setShowCreateMaloteModal(false);
            showSuccess(isEditingMalote ? 'Malote atualizado' : 'Malote criado', isEditingMalote ? 'Alterações salvas com sucesso.' : 'Malote salvo no backend com CEPs sincronizados.');
            resetMaloteForm();
        } catch (error: any) {
            console.error('Erro ao persistir malote:', error);
            const msg = String(error?.message || 'Erro ao salvar malote');
            showError(isEditingMalote ? 'Falha ao atualizar malote' : 'Falha ao criar malote', msg);
        }
    };

    const prefillMaloteForEdit = (malote: any) => {
        // Preencher Step 1: Origem e Destino
        setSetorOrigemMalote({
            setorId: String(malote.setorOrigemId || ''),
            setorNome: malote.setorOrigemNome || '',
            latitude: null,
            longitude: null,
            enderecoSetor: {
                logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: malote.cepOrigem || ''
            }
        });

        setSetorDestinoMalote({
            setorId: String(malote.setorDestinoId || ''),
            setorNome: malote.setorDestinoNome || '',
            latitude: null,
            longitude: null,
            enderecoSetor: {
                logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: malote.cepDestino || ''
            }
        });

        // Preencher Step 2: Dados do Malote
        setMaloteConfig({
            numeroContrato: malote.numeroContrato || '9912565780',
            percurso: malote.percurso || malote.numeroPercurso || '',
            codigoEmissao: malote.codigoEmissao || 'VG275SIGMA',
            dataEmissao: malote.dataEmissao || '24/02/2022',
            validade: malote.validade || malote.dataValidade || '24/02/2027',
            ida: malote.ida || '1',
            numeroMalote: malote.numeroMalote || '',
            tamanho: malote.tamanho || 'G',
            diasServico: malote.diasServico || 'Segunda-feira, Terça-feira, Quarta-feira, Quinta-feira, Sexta-feira',
            estacao: malote.estacao || 'A',
            distritos: malote.distritos || '307',
            ativo: malote.ativo !== undefined ? malote.ativo : true,
            cepOrigem: malote.cepOrigem || '',
            cepDestino: malote.cepDestino || '',
            // Campos extras para compatibilidade
            setorId: String(malote.setorOrigemId || ''),
            setorNome: malote.setorOrigemNome || '',
            enderecoSetor: { logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: malote.cepOrigem || '' }
        } as any);
    };

    const openEditMalote = (m: any) => {
        try {
            const norm = normalizeMaloteFromApi(m);
            setIsEditingMalote(true);
            const idVal = Number(norm.id ?? norm.ID);
            setEditingMaloteId(Number.isFinite(idVal) ? idVal : null);
            prefillMaloteForEdit(norm);
            setShowCreateMaloteModal(true);
            setCurrentStepMalote(1);
        } catch (error) {
            console.error('Erro ao preparar edição de malote:', error);
            showError('Erro', 'Não foi possível abrir o editor do malote.');
        }
    };

    const openViewMalote = (m: any) => {
        try {
            const norm = normalizeMaloteFromApi(m);
            setViewMaloteData(norm);
            setShowViewMaloteModal(true);
        } catch (error) {
            console.error('Erro ao abrir visualização de malote:', error);
            showError('Erro', 'Não foi possível abrir a visualização do malote.');
        }
    };

    const handleNextMalote = () => {
        // Validação do Step 1: Setores Origem e Destino são obrigatórios
        if (currentStepMalote === 1) {
            if (!setorOrigemMalote.setorId) {
                showError('Setor Origem obrigatório', 'Selecione o setor de origem antes de continuar.');
                return;
            }
            if (!setorDestinoMalote.setorId) {
                showError('Setor Destino obrigatório', 'Selecione o setor de destino antes de continuar.');
                return;
            }
        }

        // Validação do Step 2: Nº Malote e Percurso são obrigatórios
        if (currentStepMalote === 2) {
            if (!maloteConfig.numeroMalote || !maloteConfig.percurso) {
                showError('Campos obrigatórios', 'Preencha o Nº Malote e o Percurso antes de continuar.');
                return;
            }
        }
        setCurrentStepMalote(prev => Math.min(prev + 1, stepsMalote.length));
    };

    const handlePreviousMalote = () => setCurrentStepMalote(prev => Math.max(prev - 1, 1));

    // Filtros e ordenação para malotes
    const filteredAndSortedMalotes = useMemo(() => {
        let filtered = [...malotesData];

        if (searchTermMalote) {
            const term = searchTermMalote.toLowerCase();
            filtered = filtered.filter((m: any) => {
                const num = String(m.numeroMalote || '').toLowerCase();
                const setor = String(m.setorNome || '').toLowerCase();
                const setorOrigem = String(m.setorOrigemNome || '').toLowerCase();
                const setorDestino = String(m.setorDestinoNome || '').toLowerCase();
                const codigo = String(m.codigoEmissao || '').toLowerCase();
                return (
                    num.includes(term) ||
                    setor.includes(term) ||
                    setorOrigem.includes(term) ||
                    setorDestino.includes(term) ||
                    codigo.includes(term)
                );
            });
        }

        if (statusFilterMalote !== 'todos') {
            const ativo = statusFilterMalote === 'ativo';
            filtered = filtered.filter((m: any) => Boolean(m.ativo) === ativo);
        }

        return filtered;
    }, [malotesData, searchTermMalote, statusFilterMalote]);

    // Agrupamento de malotes por Setor Destino para o cardlist
    const malotesAgrupadosPorSetorDestino = useMemo(() => {
        const grupos: Record<string, { setorNome: string; cepDestino: string; malotes: any[] }> = {};

        filteredAndSortedMalotes.forEach((malote: any) => {
            // ID do setor destino (vem do backend via JOIN com tabela SETORES)
            const setorDestinoId = malote.setorDestinoId || malote.SETOR_DESTINO_ID;

            // Nome do setor (vem do JOIN - já normalizado pela função normalizeMaloteFromApi)
            const setorDestinoNome = malote.setorDestinoNome || malote.setorNome;

            const cepDestino = malote.cepDestino || '-';

            // Só agrupa se tiver ID do setor (obrigatório no banco)
            if (setorDestinoId) {
                if (!grupos[setorDestinoId]) {
                    grupos[setorDestinoId] = {
                        setorNome: setorDestinoNome,
                        cepDestino: cepDestino,
                        malotes: []
                    };
                }
                grupos[setorDestinoId].malotes.push(malote);
            }
        });

        return grupos;
    }, [filteredAndSortedMalotes]);

    const totalPagesMalote = Math.ceil(filteredAndSortedMalotes.length / itemsPerPageMalote);
    const startIndexMalote = (currentPageMalote - 1) * itemsPerPageMalote;
    const endIndexMalote = startIndexMalote + itemsPerPageMalote;
    const paginatedMalotes = filteredAndSortedMalotes.slice(startIndexMalote, endIndexMalote);

    // Quando setores forem carregados/atualizados, re-derivar setorNome nos malotes
    useEffect(() => {
        if (Array.isArray(malotesData) && malotesData.length > 0 && Array.isArray(setoresData) && setoresData.length > 0) {
            setMalotesData(prev => prev.map(x => normalizeMaloteFromApi(x)));
        }
    }, [setoresData]);

    return {
        loadingMalotes,
        malotesData,
        showCreateMaloteModal,
        setShowCreateMaloteModal,
        showHubModal,
        setShowHubModal,
        showViewMaloteModal,
        setShowViewMaloteModal,
        viewMaloteData,
        setViewMaloteData,
        isEditingMalote,
        editingMaloteId,
        searchTermMalote,
        setSearchTermMalote,
        statusFilterMalote,
        setStatusFilterMalote,
        viewModeMalote,
        setViewModeMalote,
        currentPageMalote,
        setCurrentPageMalote,
        itemsPerPageMalote,
        setorOrigemMalote,
        setSetorOrigemMalote,
        setorDestinoMalote,
        setSetorDestinoMalote,
        maloteConfig,
        setMaloteConfig,
        currentStepMalote,
        setCurrentStepMalote,
        stepsMalote,
        progressMalote,
        setorComboboxOpenMalote,
        setSetorComboboxOpenMalote,
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
        expandedMaloteGroups,
        setExpandedMaloteGroups,
        fetchMalotes,
        handleCreateMalote,
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
        normalizeMaloteFromApi
    };
}
