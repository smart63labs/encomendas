import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Lacre, Setor, LacreFormData, DistribuicaoLacreFormData, DestruicaoLacreFormData, DestruicaoLacreIndividualFormData, EditarLacreFormData } from '../types/configuracoes.types';

interface UseLacresReturn {
    // Estados
    lacreList: Lacre[];
    lacreLoading: boolean;
    lacreFilters: { status: string; setorId: string; busca: string };
    lacreForm: LacreFormData;
    distFormLacre: DistribuicaoLacreFormData;
    distAutoSetores: string[];
    distSetoresSearch: string;
    distSetoresPage: number;
    distSetoresPerPage: number;
    currentPageLacre: number;
    itemsPerPageLacre: number;
    itemsPerPageKanban: number;
    kanbanDisponiveisPage: number;
    kanbanAtribuidosPage: number;
    kanbanUtilizadosPage: number;
    kanbanDestruidosLotePage: number;
    kanbanDestruidosIndividuaisPage: number;
    kanbanDestruidosTab: 'lote' | 'individual';
    showGerarLacresModal: boolean;
    showDistribuirLacresModal: boolean;
    distWizardStep: number;
    showDestruirLacresModal: boolean;
    showDestruirLacreIndividualModal: boolean;
    showVisualizarLacreModal: boolean;
    showEditarLacreModal: boolean;
    lacreSelecionado: Lacre | null;
    editFormLacre: EditarLacreFormData;
    expandedAtribuidosSetores: Record<string, boolean>;
    expandedUtilizadosSetores: Record<string, boolean>;
    destruirFormLacre: DestruicaoLacreFormData;
    destruirIndividualForm: DestruicaoLacreIndividualFormData;
    openDestruirLoteCombo: boolean;

    // Dados processados
    filteredLacres: Lacre[];
    lacreStatusLabels: Record<string, string>;
    lacreValidTransitions: Record<string, string[]>;
    isAdmin: boolean;

    // Setters
    setLacreList: React.Dispatch<React.SetStateAction<Lacre[]>>;
    setLacreFilters: React.Dispatch<React.SetStateAction<{ status: string; setorId: string; busca: string }>>;
    setLacreForm: React.Dispatch<React.SetStateAction<LacreFormData>>;
    setDistFormLacre: React.Dispatch<React.SetStateAction<DistribuicaoLacreFormData>>;
    setDistAutoSetores: React.Dispatch<React.SetStateAction<string[]>>;
    setDistSetoresSearch: React.Dispatch<React.SetStateAction<string>>;
    setDistSetoresPage: React.Dispatch<React.SetStateAction<number>>;
    setCurrentPageLacre: React.Dispatch<React.SetStateAction<number>>;
    setKanbanDisponiveisPage: React.Dispatch<React.SetStateAction<number>>;
    setKanbanAtribuidosPage: React.Dispatch<React.SetStateAction<number>>;
    setKanbanUtilizadosPage: React.Dispatch<React.SetStateAction<number>>;
    setKanbanDestruidosLotePage: React.Dispatch<React.SetStateAction<number>>;
    setKanbanDestruidosIndividuaisPage: React.Dispatch<React.SetStateAction<number>>;
    setKanbanDestruidosTab: React.Dispatch<React.SetStateAction<'lote' | 'individual'>>;
    setShowGerarLacresModal: React.Dispatch<React.SetStateAction<boolean>>;
    setShowDistribuirLacresModal: React.Dispatch<React.SetStateAction<boolean>>;
    setDistWizardStep: React.Dispatch<React.SetStateAction<number>>;
    setShowDestruirLacresModal: React.Dispatch<React.SetStateAction<boolean>>;
    setShowDestruirLacreIndividualModal: React.Dispatch<React.SetStateAction<boolean>>;
    setShowVisualizarLacreModal: React.Dispatch<React.SetStateAction<boolean>>;
    setShowEditarLacreModal: React.Dispatch<React.SetStateAction<boolean>>;
    setLacreSelecionado: React.Dispatch<React.SetStateAction<Lacre | null>>;
    setEditFormLacre: React.Dispatch<React.SetStateAction<EditarLacreFormData>>;
    setExpandedAtribuidosSetores: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    setExpandedUtilizadosSetores: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    setDestruirFormLacre: React.Dispatch<React.SetStateAction<DestruicaoLacreFormData>>;
    setDestruirIndividualForm: React.Dispatch<React.SetStateAction<DestruicaoLacreIndividualFormData>>;
    setOpenDestruirLoteCombo: React.Dispatch<React.SetStateAction<boolean>>;

    // Funções
    fetchLacres: () => Promise<void>;
    getLacreStatusLabel: (l: any) => string;
    getNumeroDoCodigo: (codigo: any) => number;
    getUltimoNumeroPorPrefixo: (prefixo: string) => number;
    gerarLacres: (showSuccess: Function, showError: Function, showWarning: Function) => Promise<void>;
    distribuirLacresManual: (showSuccess: Function, showError: Function) => Promise<void>;
    distribuirLacresAuto: (setoresData: Setor[], showSuccess: Function, showError: Function) => Promise<void>;
    calcularDistribuicaoAutomatica: (totalLacres: number, setoresSelecionados: string[]) => { setorId: string, quantidade: number }[];
    aplicarTransicaoLacre: (lacreId: string, novoStatus: string, showError: Function) => void;
    vincularLacreAEncomenda: (lacreId: string, showSuccess: Function, showError: Function) => Promise<void>;
    destruirLacre: (lacreId: string, showSuccess: Function, showError: Function) => Promise<void>;
    destruirLacresPorLote: (showSuccess: Function, showError: Function, showWarning: Function) => Promise<void>;
    openEditarLacre: (lacre: any, showError: Function) => void;
    salvarEdicaoLacre: (setoresData: Setor[], showSuccess: Function, showError: Function) => Promise<void>;
}

export const useLacres = (setoresData: Setor[] = []): UseLacresReturn => {
    const { user } = useAuth();

    // Estados
    const [lacreForm, setLacreForm] = useState<LacreFormData>({ prefixo: 'LACRE', inicio: 1, fim: undefined, loteNumero: '' });
    const [lacreList, setLacreList] = useState<Lacre[]>([]);
    const [lacreLoading, setLacreLoading] = useState(false);
    const [lacreFilters, setLacreFilters] = useState({ status: 'todos', setorId: 'todos', busca: '' });
    const [distFormLacre, setDistFormLacre] = useState<DistribuicaoLacreFormData>({ setorId: '', quantidade: 0, modo: 'manual' });
    const [distAutoSetores, setDistAutoSetores] = useState<string[]>([]);
    const [distSetoresSearch, setDistSetoresSearch] = useState("");
    const [distSetoresPage, setDistSetoresPage] = useState(1);
    const distSetoresPerPage = 10;
    const [currentPageLacre, setCurrentPageLacre] = useState(1);
    const [itemsPerPageLacre] = useState(24);
    const itemsPerPageKanban = 5;
    const [kanbanDisponiveisPage, setKanbanDisponiveisPage] = useState(1);
    const [kanbanAtribuidosPage, setKanbanAtribuidosPage] = useState(1);
    const [kanbanUtilizadosPage, setKanbanUtilizadosPage] = useState(1);
    const [kanbanDestruidosLotePage, setKanbanDestruidosLotePage] = useState(1);
    const [kanbanDestruidosIndividuaisPage, setKanbanDestruidosIndividuaisPage] = useState(1);
    const [kanbanDestruidosTab, setKanbanDestruidosTab] = useState<'lote' | 'individual'>('lote');
    const [showGerarLacresModal, setShowGerarLacresModal] = useState(false);
    const [showDistribuirLacresModal, setShowDistribuirLacresModal] = useState(false);
    const [distWizardStep, setDistWizardStep] = useState<number>(1);
    const [showDestruirLacresModal, setShowDestruirLacresModal] = useState(false);
    const [showDestruirLacreIndividualModal, setShowDestruirLacreIndividualModal] = useState(false);
    const [showVisualizarLacreModal, setShowVisualizarLacreModal] = useState(false);
    const [showEditarLacreModal, setShowEditarLacreModal] = useState(false);
    const [lacreSelecionado, setLacreSelecionado] = useState<Lacre | null>(null);
    const [editFormLacre, setEditFormLacre] = useState<EditarLacreFormData>({ status: '', setorId: '' });
    const [expandedAtribuidosSetores, setExpandedAtribuidosSetores] = useState<Record<string, boolean>>({});
    const [expandedUtilizadosSetores, setExpandedUtilizadosSetores] = useState<Record<string, boolean>>({});
    const [destruirFormLacre, setDestruirFormLacre] = useState<DestruicaoLacreFormData>({ loteNumero: '', motivo: '' });
    const [destruirIndividualForm, setDestruirIndividualForm] = useState<DestruicaoLacreIndividualFormData>({ motivo: '', status: 'destruido' });
    const [openDestruirLoteCombo, setOpenDestruirLoteCombo] = useState(false);

    const isAdmin = useMemo(() => {
        const role = String((user as any)?.ROLE || (user as any)?.role || (user as any)?.cargo || (user as any)?.perfil || '').toUpperCase();
        return ['ADMINISTRADOR', 'ADMIN', 'GERENTE'].includes(role);
    }, [user]);

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

    const lacreValidTransitions: Record<string, string[]> = {
        disponivel: ['atribuido', 'reservado', 'vinculado', 'danificado', 'extraviado', 'destruido'],
        reservado: ['vinculado', 'disponivel'],
        atribuido: ['vinculado', 'disponivel'],
        vinculado: ['utilizado', 'extraviado', 'danificado'],
        utilizado: [],
        extraviado: ['destruido'],
        danificado: ['destruido'],
        destruido: []
    };

    const filteredLacres = useMemo(() => {
        let list = [...lacreList];
        const term = (lacreFilters.busca || '').toLowerCase();
        if (term) {
            list = list.filter((l) => {
                const codigo = String(l.codigo || '').toLowerCase();
                const setor = String(l.setorNome || '').toLowerCase();
                return codigo.includes(term) || setor.includes(term);
            });
        }
        if (lacreFilters.status && lacreFilters.status !== 'todos') {
            list = list.filter((l) => l.status === lacreFilters.status);
        }
        if (lacreFilters.setorId && lacreFilters.setorId !== 'todos') {
            list = list.filter((l) => String(l.setorId || '') === String(lacreFilters.setorId));
        }

        // Reset de paginações Kanban ao mudar filtros
        // Nota: Isso pode causar loops se não for controlado, mas estava no useMemo original
        // Idealmente deveria ser um useEffect que observa lacreFilters
        return list;
    }, [lacreList, lacreFilters]);

    // Efeito para resetar paginação quando filtros mudam
    useEffect(() => {
        setKanbanDisponiveisPage(1);
        setKanbanAtribuidosPage(1);
        setKanbanUtilizadosPage(1);
        setKanbanDestruidosLotePage(1);
        setKanbanDestruidosIndividuaisPage(1);
    }, [lacreFilters]);

    const fetchLacres = async () => {
        try {
            setLacreLoading(true);
            const resp = await api.listLacres({ page: 1, limit: 1000 });
            const data = (resp as any)?.data?.data ?? (resp as any)?.data ?? [];
            setLacreList(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Erro ao carregar lacres:', error);
        } finally {
            setLacreLoading(false);
        }
    };

    const getLacreStatusLabel = (l: any): string => {
        const st = String(l?.status || '').toLowerCase();
        switch (st) {
            case 'disponivel': return 'DISPONÍVEL';
            case 'atribuido': return 'ATRIBUÍDO';
            case 'reservado': return (l?.setorId != null && String(l?.setorId) !== '') ? 'ATRIBUÍDO' : 'RESERVADO';
            case 'vinculado': return 'VINCULADO';
            case 'utilizado': return 'UTILIZADO';
            case 'extraviado': return 'EXTRAVIADO';
            case 'danificado': return 'DANIFICADO';
            case 'destruido': return 'DESTRUÍDO';
            default: return String(st);
        }
    };

    const getNumeroDoCodigo = (codigo: any): number => {
        const str = String(codigo || '').trim();
        const m = str.match(/(\d+)\s*$/);
        return m ? Number(m[1]) : NaN;
    };

    const getUltimoNumeroPorPrefixo = (prefixo: string): number => {
        const pref = String(prefixo || '').toUpperCase().trim();
        let max = 0;
        for (const l of lacreList) {
            const codigo = String(l.codigo || l.CODIGO || '').toUpperCase();
            if (!pref || codigo.startsWith(pref)) {
                const n = getNumeroDoCodigo(codigo);
                if (!isNaN(n) && n > max) max = n;
            }
        }
        return max;
    };

    // Efeitos para ajuste automático de números
    useEffect(() => {
        if (showGerarLacresModal) {
            const ultimo = getUltimoNumeroPorPrefixo(lacreForm.prefixo);
            const sugerido = ultimo > 0 ? ultimo + 1 : 1;
            setLacreForm(prev => ({ ...prev, inicio: sugerido }));
        }
    }, [showGerarLacresModal]);

    useEffect(() => {
        if (showGerarLacresModal) {
            const ultimo = getUltimoNumeroPorPrefixo(lacreForm.prefixo);
            const sugerido = ultimo > 0 ? ultimo + 1 : 1;
            setLacreForm(prev => ({ ...prev, inicio: sugerido }));
        }
    }, [lacreForm.prefixo]);

    // Efeito para resetar wizard
    useEffect(() => {
        if (showDistribuirLacresModal) {
            setDistWizardStep(1);
        }
    }, [showDistribuirLacresModal]);

    // Efeito para pré-preencher lote na destruição
    useEffect(() => {
        if (showDestruirLacresModal) {
            let inicial = '';
            if (lacreSelecionado?.loteNumero) {
                inicial = String(lacreSelecionado.loteNumero);
            } else {
                const porLote: Record<string, { total: number; distribuidos: number }> = {};
                for (const l of lacreList) {
                    const lote = String(l.loteNumero || '').trim();
                    if (!lote) continue;
                    if (!porLote[lote]) porLote[lote] = { total: 0, distribuidos: 0 };
                    porLote[lote].total++;
                    const distribuido = (l.status && l.status !== 'disponivel') || (l.setorId != null && String(l.setorId) !== '') || (l.encomendaId != null && String(l.encomendaId) !== '');
                    if (distribuido) porLote[lote].distribuidos++;
                }
                const lotesElegiveis = Object.keys(porLote).filter(k => porLote[k].total > 0 && porLote[k].distribuidos === 0);
                if (lotesElegiveis.length === 1) {
                    inicial = lotesElegiveis[0];
                }
            }
            if (inicial && !String(destruirFormLacre.loteNumero || '').trim()) {
                setDestruirFormLacre(prev => ({ ...prev, loteNumero: inicial }));
            }
        }
    }, [showDestruirLacresModal, lacreSelecionado, lacreList]);

    const gerarLacres = async (showSuccess: Function, showError: Function, showWarning: Function) => {
        try {
            const inicio = Number(lacreForm.inicio);
            let fim = (typeof lacreForm.fim === 'number' && !isNaN(lacreForm.fim)) ? lacreForm.fim : inicio;
            let prefixo = String(lacreForm.prefixo || '').trim();

            if (!prefixo) {
                prefixo = 'LACRE';
                setLacreForm(prev => ({ ...prev, prefixo }));
            }

            if (isNaN(inicio)) {
                showError('Dados inválidos', 'Número inicial inválido.');
                return;
            }

            if (isNaN(fim) || fim < inicio) {
                fim = inicio;
                setLacreForm(prev => ({ ...prev, fim: inicio }));
            }

            const ultimo = getUltimoNumeroPorPrefixo(prefixo);
            const proximoEsperado = ultimo > 0 ? ultimo + 1 : 1;
            if (inicio !== proximoEsperado) {
                showWarning('Sequência inválida', `O início deve ser ${proximoEsperado}. Ajuste o intervalo.`);
                setLacreForm(prev => ({
                    ...prev,
                    inicio: proximoEsperado,
                    fim: (typeof prev.fim === 'number' && !isNaN(prev.fim) && prev.fim >= proximoEsperado) ? prev.fim : proximoEsperado
                }));
                return;
            }

            const numerosExistentes = new Set<number>();
            for (const l of lacreList) {
                const codigo = String(l.codigo || l.CODIGO || '').toUpperCase();
                if (prefixo && codigo.startsWith(prefixo.toUpperCase())) {
                    const n = getNumeroDoCodigo(codigo);
                    if (!isNaN(n)) numerosExistentes.add(n);
                }
            }
            for (let n = inicio; n <= fim; n++) {
                if (numerosExistentes.has(n)) {
                    showError('Intervalo conflitante', `O número ${n} já existe para o prefixo ${prefixo}.`);
                    return;
                }
            }

            await api.generateLacres({ prefixo, inicio, fim, loteNumero: lacreForm.loteNumero });
            await fetchLacres();
            showSuccess('Lacres gerados', `Intervalo ${inicio}–${fim} processado com sucesso.`);
        } catch (e) {
            console.error('Erro ao gerar lacres', e);
            showError('Erro', 'Falha ao gerar lacres.');
        }
    };

    const distribuirLacresManual = async (showSuccess: Function, showError: Function) => {
        if (!distFormLacre.setorId) {
            showError('Setor obrigatório', 'Selecione o setor para distribuir.');
            return;
        }
        const qtd = Number(distFormLacre.quantidade);
        if (isNaN(qtd) || qtd <= 0) {
            showError('Quantidade inválida', 'Informe uma quantidade válida.');
            return;
        }
        try {
            await api.distribuirLacresManual({ setorId: distFormLacre.setorId, quantidade: qtd });
            await fetchLacres();
            showSuccess('Distribuição realizada', `Distribuição manual concluída para o setor.`);
        } catch (error) {
            console.error('Erro ao distribuir lacres manualmente:', error);
            showError('Erro', 'Falha ao distribuir lacres manualmente.');
        }
    };

    const distribuirLacresAuto = async (setoresData: Setor[], showSuccess: Function, showError: Function) => {
        if (!Array.isArray(setoresData) || setoresData.length === 0) {
            showError('Sem setores', 'Carregue os setores antes da distribuição automática.');
            return;
        }
        const setoresSelecionados = (Array.isArray(distAutoSetores) ? distAutoSetores : []).filter(Boolean);
        if (setoresSelecionados.length < 2) {
            showError('Seleção insuficiente', 'Selecione pelo menos 2 setores para distribuição automática.');
            return;
        }
        try {
            const setorIdsNum = setoresSelecionados.map((s) => Number(s)).filter((v) => !!v);
            await api.distribuirLacresAuto({ setorIds: setorIdsNum, totalLacres: null });
            await fetchLacres();
            showSuccess('Distribuição automática', `Distribuição concluída entre ${setoresSelecionados.length} setores.`);
        } catch (error) {
            console.error('Erro na distribuição automática:', error);
            showError('Erro', 'Falha ao distribuir lacres automaticamente.');
        }
    };

    const calcularDistribuicaoAutomatica = (totalLacres: number, setoresSelecionados: string[]) => {
        const k = setoresSelecionados.length;
        if (k === 0) return [] as { setorId: string, quantidade: number }[];
        const base = Math.floor(totalLacres / k);
        const resto = totalLacres % k;
        return setoresSelecionados.map((setorId, idx) => ({
            setorId,
            quantidade: base + (idx < resto ? 1 : 0)
        }));
    };

    const aplicarTransicaoLacre = (lacreId: string, novoStatus: string, showError: Function) => {
        setLacreList(prev => prev.map(l => {
            if (l.id !== lacreId) return l;
            const permitidos = lacreValidTransitions[l.status] || [];
            if (!permitidos.includes(novoStatus)) {
                showError('Transição inválida', `Não é possível mover de ${getLacreStatusLabel(l)} para ${lacreStatusLabels[novoStatus] || novoStatus}.`);
                return l;
            }
            return {
                ...l,
                status: novoStatus as any,
                historico: [...(l.historico || []), { data: new Date().toISOString(), acao: 'status', detalhes: `${getLacreStatusLabel(l)} → ${lacreStatusLabels[novoStatus]}` }]
            };
        }));
    };

    const vincularLacreAEncomenda = async (lacreId: string, showSuccess: Function, showError: Function) => {
        const encomendaId = window.prompt('Informe o ID da encomenda para vincular:');
        if (!encomendaId) return;
        try {
            await api.updateLacre(lacreId, { status: 'vinculado', encomendaId: Number(encomendaId) });
            await fetchLacres();
            showSuccess('Lacre vinculado', `Lacre vinculado à encomenda ${encomendaId}.`);
        } catch (error) {
            console.error('Erro ao vincular lacre à encomenda:', error);
            showError('Erro', 'Falha ao vincular lacre à encomenda.');
        }
    };

    const destruirLacre = async (lacreId: string, showSuccess: Function, showError: Function) => {
        const motivo = window.prompt('Informe o motivo da destruição:');
        if (!motivo) return;
        try {
            await api.updateLacre(lacreId, { status: 'destruido', motivoDestruicao: motivo });
            await fetchLacres();
            showSuccess('Lacre destruído', 'O lacre foi destruído.');
        } catch (error) {
            console.error('Erro ao destruir lacre:', error);
            showError('Erro', 'Falha ao destruir lacre.');
        }
    };

    const destruirLacresPorLote = async (showSuccess: Function, showError: Function, showWarning: Function) => {
        try {
            const loteAlvo = String(destruirFormLacre.loteNumero || '').trim();
            const motivo = String(destruirFormLacre.motivo || '').trim();
            if (!loteAlvo) { showError('Lote obrigatório', 'Informe o número do lote a ser destruído.'); return; }

            const lacresDoLote = lacreList.filter(l => String(l.loteNumero || '') === loteAlvo);
            if (lacresDoLote.length === 0) {
                showWarning('Lote não encontrado', 'Nenhum lacre do lote informado foi carregado na listagem.');
                return;
            }
            const possuiDistribuidos = lacresDoLote.some(l => (l.status && l.status !== 'disponivel') || (l.setorId != null && String(l.setorId) !== '') || (l.encomendaId != null && String(l.encomendaId) !== ''));
            if (possuiDistribuidos) {
                showError('Destruição não permitida', 'Este lote contém lacres já distribuídos ou vinculados.');
                return;
            }
            await api.destruirLacresPorLote({ loteNumero: loteAlvo, motivo });
            setShowDestruirLacresModal(false);
            setDestruirFormLacre({ loteNumero: '', motivo: '' });
            await fetchLacres();
            showSuccess('Destruição concluída', `Lacres do lote ${loteAlvo} marcados como destruídos.`);
        } catch (e) {
            console.error('Erro ao destruir lacres por lote', e);
            showError('Erro', 'Falha ao destruir lacres em lote.');
        }
    };

    const openEditarLacre = (lacre: any, showError: Function) => {
        try {
            if (!isAdmin) {
                showError('Permissão negada', 'Apenas administradores podem editar lacres.');
                return;
            }
            setLacreSelecionado(lacre);
            setEditFormLacre({ status: String(lacre.status || ''), setorId: String(lacre.setorId || '') });
            setShowEditarLacreModal(true);
        } catch (e) {
            console.error('Erro ao abrir edição do lacre:', e);
            showError('Erro', 'Não foi possível abrir o modal de edição.');
        }
    };

    const salvarEdicaoLacre = async (setoresData: Setor[], showSuccess: Function, showError: Function) => {
        try {
            if (!isAdmin) {
                showError('Permissão negada', 'Apenas administradores podem salvar alterações em lacres.');
                return;
            }
            if (!lacreSelecionado) return;

            const atual = lacreSelecionado as any;
            const novoStatus = String(editFormLacre.status || atual.status);
            const setorId = String(editFormLacre.setorId || '');

            if (novoStatus !== atual.status) {
                const permitidos = lacreValidTransitions[atual.status] || [];
                if (!permitidos.includes(novoStatus)) {
                    showError('Transição inválida', `Não é possível mover de ${getLacreStatusLabel(atual)} para ${lacreStatusLabels[novoStatus] || novoStatus}.`);
                    return;
                }
            }

            await api.updateLacre(atual.id, { status: novoStatus, setorId: setorId ? Number(setorId) : null });
            setShowEditarLacreModal(false);
            setLacreSelecionado(null);
            await fetchLacres();
            showSuccess('Lacre atualizado', 'Alterações salvas com sucesso.');
        } catch (e) {
            console.error('Erro ao salvar edição de lacre:', e);
            showError('Erro', 'Não foi possível salvar as alterações.');
        }
    };

    return {
        lacreList,
        lacreLoading,
        lacreFilters,
        lacreForm,
        distFormLacre,
        distAutoSetores,
        distSetoresSearch,
        distSetoresPage,
        distSetoresPerPage,
        currentPageLacre,
        itemsPerPageLacre,
        itemsPerPageKanban,
        kanbanDisponiveisPage,
        kanbanAtribuidosPage,
        kanbanUtilizadosPage,
        kanbanDestruidosLotePage,
        kanbanDestruidosIndividuaisPage,
        kanbanDestruidosTab,
        showGerarLacresModal,
        showDistribuirLacresModal,
        distWizardStep,
        showDestruirLacresModal,
        showDestruirLacreIndividualModal,
        showVisualizarLacreModal,
        showEditarLacreModal,
        lacreSelecionado,
        editFormLacre,
        expandedAtribuidosSetores,
        expandedUtilizadosSetores,
        destruirFormLacre,
        destruirIndividualForm,
        openDestruirLoteCombo,
        filteredLacres,
        lacreStatusLabels,
        lacreValidTransitions,
        isAdmin,
        setLacreList,
        setLacreFilters,
        setLacreForm,
        setDistFormLacre,
        setDistAutoSetores,
        setDistSetoresSearch,
        setDistSetoresPage,
        setCurrentPageLacre,
        setKanbanDisponiveisPage,
        setKanbanAtribuidosPage,
        setKanbanUtilizadosPage,
        setKanbanDestruidosLotePage,
        setKanbanDestruidosIndividuaisPage,
        setKanbanDestruidosTab,
        setShowGerarLacresModal,
        setShowDistribuirLacresModal,
        setDistWizardStep,
        setShowDestruirLacresModal,
        setShowDestruirLacreIndividualModal,
        setShowVisualizarLacreModal,
        setShowEditarLacreModal,
        setLacreSelecionado,
        setEditFormLacre,
        setExpandedAtribuidosSetores,
        setExpandedUtilizadosSetores,
        setDestruirFormLacre,
        setDestruirIndividualForm,
        setOpenDestruirLoteCombo,
        fetchLacres,
        getLacreStatusLabel,
        getNumeroDoCodigo,
        getUltimoNumeroPorPrefixo,
        gerarLacres,
        distribuirLacresManual,
        distribuirLacresAuto,
        calcularDistribuicaoAutomatica,
        aplicarTransicaoLacre,
        vincularLacreAEncomenda,
        destruirLacre,
        destruirLacresPorLote,
        openEditarLacre,
        salvarEdicaoLacre
    };
};
