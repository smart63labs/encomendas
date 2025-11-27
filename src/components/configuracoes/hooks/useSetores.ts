import { useState } from 'react';
import { api } from '@/lib/api';
import { GeocodingService } from '@/services/geocoding.service';
import { useCepSearch } from '@/hooks/useCepSearch';
import type { Setor, SetorFormData } from '../types/configuracoes.types';

interface UseSetoresReturn {
    // Estados
    setoresData: Setor[];
    loadingSetores: boolean;
    setorFormData: SetorFormData;
    selectedSetor: Setor | null;
    showCreateSetorModal: boolean;
    showEditSetorModal: boolean;
    isViewModeSetor: boolean;
    manualAddressEdit: boolean;
    isFallbackCoordinatesModal: boolean;

    // Setters
    setSetoresData: React.Dispatch<React.SetStateAction<Setor[]>>;
    setSetorFormData: React.Dispatch<React.SetStateAction<SetorFormData>>;
    setSelectedSetor: React.Dispatch<React.SetStateAction<Setor | null>>;
    setShowCreateSetorModal: React.Dispatch<React.SetStateAction<boolean>>;
    setShowEditSetorModal: React.Dispatch<React.SetStateAction<boolean>>;
    setIsViewModeSetor: React.Dispatch<React.SetStateAction<boolean>>;
    setManualAddressEdit: React.Dispatch<React.SetStateAction<boolean>>;
    setIsFallbackCoordinatesModal: React.Dispatch<React.SetStateAction<boolean>>;

    // Funções
    fetchSetores: () => Promise<void>;
    resetSetorForm: () => void;
    handleSetorChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleCepSearch: (cep: string) => Promise<void>;
    handleCreateSetor: (showInfo: Function, showError: Function) => Promise<void>;
    handleUpdateSetor: (showInfo: Function, showError: Function, showWarning: Function) => Promise<void>;
    handleDeleteSetor: (id: number, showInfo: Function, showError: Function) => Promise<void>;
    handleEditSetor: (setor: Setor) => void;
    handleViewSetor: (setor: Setor) => void;
}

export const useSetores = (): UseSetoresReturn => {
    const { searchCep, clearError } = useCepSearch();

    // Estados
    const [setoresData, setSetoresData] = useState<Setor[]>([]);
    const [loadingSetores, setLoadingSetores] = useState(false);
    const [showCreateSetorModal, setShowCreateSetorModal] = useState(false);
    const [showEditSetorModal, setShowEditSetorModal] = useState(false);
    const [isViewModeSetor, setIsViewModeSetor] = useState(false);
    const [selectedSetor, setSelectedSetor] = useState<Setor | null>(null);
    const [manualAddressEdit, setManualAddressEdit] = useState(false);
    const [isFallbackCoordinatesModal, setIsFallbackCoordinatesModal] = useState(false);

    const [setorFormData, setSetorFormData] = useState<SetorFormData>({
        codigoSetor: '',
        nomeSetor: '',
        orgao: '',
        telefone: '',
        email: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        latitude: null,
        longitude: null,
        semNumero: false,
        ativo: true
    });

    // Funções
    const fetchSetores = async () => {
        try {
            setLoadingSetores(true);
            const response = await api.get('/setores', { limit: 1000, ativo: 'all' });
            console.log('Resposta da API de setores:', response.data);
            const data = response.data.success ? response.data.data : response.data;
            setSetoresData(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Erro ao buscar setores:', error);
            setSetoresData([]);
        } finally {
            setLoadingSetores(false);
        }
    };

    const resetSetorForm = () => {
        setSetorFormData({
            codigoSetor: '',
            nomeSetor: '',
            orgao: '',
            telefone: '',
            email: '',
            cep: '',
            logradouro: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: '',
            latitude: null,
            longitude: null,
            semNumero: false,
            ativo: true
        });
        setManualAddressEdit(false);
    };

    const handleSetorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'codigoSetor') {
            const cleanValue = value.replace(/[^A-Za-z0-9.]/g, '').toUpperCase();
            const limitedValue = cleanValue.slice(0, 12);
            setSetorFormData(prev => ({ ...prev, [name]: limitedValue }));
        } else if (name === 'cep') {
            const cleanCep = value.replace(/\D/g, '');
            const limitedCep = cleanCep.slice(0, 8);
            const maskedCep = limitedCep.replace(/(\d{5})(\d{3})/, '$1-$2');
            setSetorFormData(prev => ({ ...prev, [name]: maskedCep }));

            if (limitedCep.length === 8) {
                handleCepSearch(limitedCep);
            }
        } else if (name === 'telefone') {
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

            setSetorFormData(prev => ({ ...prev, [name]: maskedPhone }));
        } else {
            setSetorFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCepSearch = async (cep: string) => {
        clearError();

        try {
            const geocodingResult = await GeocodingService.geocodeByCep(cep);
            const cepData = await searchCep(cep);

            if (cepData) {
                let latitude = null;
                let longitude = null;

                if (geocodingResult.coordenadas) {
                    latitude = geocodingResult.coordenadas.lat;
                    longitude = geocodingResult.coordenadas.lng;
                    console.log('✅ Coordenadas obtidas via GeocodingService:', geocodingResult.coordenadas);
                } else if (cepData.location?.coordinates &&
                    cepData.location.coordinates.latitude !== 'N/A' &&
                    cepData.location.coordinates.longitude !== 'N/A' &&
                    cepData.location.coordinates.latitude !== '0' &&
                    cepData.location.coordinates.longitude !== '0') {
                    latitude = parseFloat(cepData.location.coordinates.latitude);
                    longitude = parseFloat(cepData.location.coordinates.longitude);
                    console.log('✅ Coordenadas obtidas via BrasilAPI (useCepSearch):', { latitude, longitude });
                } else {
                    console.log('⚠️ Coordenadas específicas não disponíveis, tentando obter coordenadas da cidade...');
                    const smartFallback = await GeocodingService.getSmartFallbackCoordinates(cepData);
                    if (smartFallback) {
                        latitude = smartFallback.lat;
                        longitude = smartFallback.lng;
                        console.log('🏙️ Usando coordenadas da cidade como fallback:', smartFallback);
                    }
                }

                const logradouro = cepData.street || '';
                const bairro = cepData.neighborhood || '';
                const cidade = cepData.city || '';
                const estado = cepData.state || '';

                const logradouroFinal = logradouro || (cidade ? `Centro de ${cidade}` : '');
                const bairroFinal = bairro || 'Centro';

                setSetorFormData(prev => ({
                    ...prev,
                    cep: cep.replace(/(\d{5})(\d{3})/, '$1-$2'),
                    logradouro: logradouroFinal,
                    bairro: bairroFinal,
                    cidade: cidade,
                    estado: estado,
                    latitude: latitude,
                    longitude: longitude
                }));

                setManualAddressEdit(false);
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
        }
    };

    const handleCreateSetor = async (showInfo: Function, showError: Function) => {
        if (isFallbackCoordinatesModal) {
            return;
        }

        try {
            const nome = setorFormData.nomeSetor;
            await api.post('/setores', setorFormData);
            await fetchSetores();
            setShowCreateSetorModal(false);
            resetSetorForm();
            showInfo("Setor criado com sucesso!", `O setor ${nome} foi adicionado ao sistema.`);
        } catch (error) {
            console.error('Erro ao criar setor:', error);
            showError("Erro ao criar setor", "Ocorreu um erro ao tentar criar o setor. Tente novamente.");
        }
    };

    const handleUpdateSetor = async (showInfo: Function, showError: Function, showWarning: Function) => {
        if (!selectedSetor) return;

        if (isFallbackCoordinatesModal) {
            showWarning(
                "Coordenadas inválidas",
                "Não é possível salvar o setor com coordenadas de fallback. Por favor, marque um ponto no mapa ou pesquise por uma cidade válida."
            );
            return;
        }

        try {
            const nome = setorFormData.nomeSetor;
            await api.put(`/setores/${selectedSetor.ID}`, setorFormData);
            await fetchSetores();
            setShowEditSetorModal(false);
            setSelectedSetor(null);
            resetSetorForm();
            showInfo("Setor atualizado com sucesso!", `Os dados do setor ${nome} foram atualizados.`);
        } catch (error) {
            console.error('Erro ao atualizar setor:', error);
            showError("Erro ao atualizar setor", "Ocorreu um erro ao tentar atualizar o setor. Tente novamente.");
        }
    };

    const handleDeleteSetor = async (id: number, showInfo: Function, showError: Function) => {
        const setorToDelete = setoresData.find(setor => setor.ID === id);
        if (!setorToDelete) return;

        try {
            await api.delete(`/setores/${id}`);
            await fetchSetores();
            showInfo("Setor excluído com sucesso!", `O setor ${setorToDelete.NOME_SETOR || setorToDelete.SETOR} foi removido do sistema.`);
        } catch (error) {
            console.error('Erro ao excluir setor:', error);
            showError("Erro ao excluir setor", "Ocorreu um erro ao tentar excluir o setor. Tente novamente.");
        }
    };

    const handleEditSetor = (setor: Setor) => {
        setSelectedSetor(setor);
        setSetorFormData({
            codigoSetor: (setor as any).CODIGO_SETOR || (setor as any).codigo_setor || (setor as any).codigoSetor || '',
            nomeSetor: setor.NOME_SETOR || setor.SETOR || (setor as any).nome_setor || (setor as any).nomeSetor || '',
            orgao: setor.ORGAO || (setor as any).orgao || '',
            telefone: setor.TELEFONE || (setor as any).telefone || '',
            email: setor.EMAIL || (setor as any).email || '',
            cep: setor.CEP || (setor as any).cep || '',
            logradouro: setor.LOGRADOURO || (setor as any).logradouro || '',
            numero: setor.NUMERO || (setor as any).numero || '',
            complemento: setor.COMPLEMENTO || (setor as any).complemento || '',
            bairro: setor.BAIRRO || (setor as any).bairro || '',
            cidade: setor.CIDADE || (setor as any).cidade || '',
            estado: setor.ESTADO || (setor as any).estado || '',
            latitude: setor.LATITUDE !== undefined && setor.LATITUDE !== null ? setor.LATITUDE :
                ((setor as any).latitude !== undefined && (setor as any).latitude !== null ? (setor as any).latitude : null),
            longitude: setor.LONGITUDE !== undefined && setor.LONGITUDE !== null ? setor.LONGITUDE :
                ((setor as any).longitude !== undefined && (setor as any).longitude !== null ? (setor as any).longitude : null),
            semNumero: false,
            ativo: setor.ATIVO !== undefined ? setor.ATIVO : ((setor as any).ativo !== undefined ? (setor as any).ativo : true)
        });
        setManualAddressEdit(false);
        setShowEditSetorModal(true);
    };

    const handleViewSetor = (setor: Setor) => {
        setSelectedSetor(setor);
        setSetorFormData({
            codigoSetor: (setor as any).CODIGO_SETOR || (setor as any).codigo_setor || (setor as any).codigoSetor || '',
            nomeSetor: setor.NOME_SETOR || setor.SETOR || (setor as any).nome_setor || (setor as any).nomeSetor || '',
            orgao: setor.ORGAO || (setor as any).orgao || '',
            telefone: setor.TELEFONE || (setor as any).telefone || '',
            email: setor.EMAIL || (setor as any).email || '',
            cep: setor.CEP || (setor as any).cep || '',
            logradouro: setor.LOGRADOURO || (setor as any).logradouro || '',
            numero: setor.NUMERO || (setor as any).numero || '',
            complemento: setor.COMPLEMENTO || (setor as any).complemento || '',
            bairro: setor.BAIRRO || (setor as any).bairro || '',
            cidade: setor.CIDADE || (setor as any).cidade || '',
            estado: setor.ESTADO || (setor as any).estado || '',
            latitude: setor.LATITUDE !== undefined && setor.LATITUDE !== null ? setor.LATITUDE :
                ((setor as any).latitude !== undefined && (setor as any).latitude !== null ? (setor as any).latitude : null),
            longitude: setor.LONGITUDE !== undefined && setor.LONGITUDE !== null ? setor.LONGITUDE :
                ((setor as any).longitude !== undefined && (setor as any).longitude !== null ? (setor as any).longitude : null),
            semNumero: false,
            ativo: setor.ATIVO !== undefined ? setor.ATIVO : ((setor as any).ativo !== undefined ? (setor as any).ativo : true)
        });
        setIsViewModeSetor(true);
        setShowEditSetorModal(true);
    };

    return {
        // Estados
        setoresData,
        loadingSetores,
        setorFormData,
        selectedSetor,
        showCreateSetorModal,
        showEditSetorModal,
        isViewModeSetor,
        manualAddressEdit,
        isFallbackCoordinatesModal,

        // Setters
        setSetoresData,
        setSetorFormData,
        setSelectedSetor,
        setShowCreateSetorModal,
        setShowEditSetorModal,
        setIsViewModeSetor,
        setManualAddressEdit,
        setIsFallbackCoordinatesModal,

        // Funções
        fetchSetores,
        resetSetorForm,
        handleSetorChange,
        handleCepSearch,
        handleCreateSetor,
        handleUpdateSetor,
        handleDeleteSetor,
        handleEditSetor,
        handleViewSetor
    };
};
