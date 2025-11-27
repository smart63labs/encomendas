import { useState } from 'react';
import { api } from '@/lib/api';
import type {
    ConfigGeral,
    ConfigSeguranca,
    ConfigAutenticacao,
    ConfigNotificacoes,
    ConfigSistema,
    ConfigAparencia,
    ConfigApis
} from '../types/configuracoes.types';

interface UseConfiguracaoReturn {
    // Estados de configurações
    configGeral: ConfigGeral;
    configSeguranca: ConfigSeguranca;
    configAutenticacao: ConfigAutenticacao;
    configNotificacoes: ConfigNotificacoes;
    configSistema: ConfigSistema;
    configAparencia: ConfigAparencia;
    configApis: ConfigApis;
    loadingConfigs: boolean;
    savingConfigs: boolean;

    // Setters
    setConfigGeral: React.Dispatch<React.SetStateAction<ConfigGeral>>;
    setConfigSeguranca: React.Dispatch<React.SetStateAction<ConfigSeguranca>>;
    setConfigAutenticacao: React.Dispatch<React.SetStateAction<ConfigAutenticacao>>;
    setConfigNotificacoes: React.Dispatch<React.SetStateAction<ConfigNotificacoes>>;
    setConfigSistema: React.Dispatch<React.SetStateAction<ConfigSistema>>;
    setConfigAparencia: React.Dispatch<React.SetStateAction<ConfigAparencia>>;
    setConfigApis: React.Dispatch<React.SetStateAction<ConfigApis>>;

    // Funções
    carregarConfiguracoes: () => Promise<void>;
    salvarConfiguracoes: (categoria: string, dados: any) => Promise<void>;
}

export const useConfiguracao = (): UseConfiguracaoReturn => {
    // Estados de configurações
    const [configGeral, setConfigGeral] = useState<ConfigGeral>({
        SISTEMA_NOME: '',
        nomeInstituicao: '',
        HUB_SETOR_ID: ''
    });

    const [configSeguranca, setConfigSeguranca] = useState<ConfigSeguranca>({});
    const [configAutenticacao, setConfigAutenticacao] = useState<ConfigAutenticacao>({
        LDAP_ENABLED: false,
        LDAP_URL: '',
        LDAP_BASE_DN: '',
        LDAP_BIND_DN: '',
        LDAP_BIND_PASSWORD: ''
    });
    const [configNotificacoes, setConfigNotificacoes] = useState<ConfigNotificacoes>({});
    const [configSistema, setConfigSistema] = useState<ConfigSistema>({});
    const [configAparencia, setConfigAparencia] = useState<ConfigAparencia>({});
    const [configApis, setConfigApis] = useState<ConfigApis>({
        GOOGLE_MAPS_API_KEY: ''
    });

    const [loadingConfigs, setLoadingConfigs] = useState(false);
    const [savingConfigs, setSavingConfigs] = useState(false);

    // Normalização de boolean vindos do backend
    const toBool = (v: any) => v === true || v === 'true' || v === '1' || v === 1 || v === 'S' || v === 'sim';

    // Função para carregar configurações do banco de dados
    const carregarConfiguracoes = async () => {
        try {
            setLoadingConfigs(true);
            console.log('🔄 Carregando configurações...');
            const response = await api.getConfiguracoes();

            const sucesso = (response as any)?.data?.success ?? (response as any)?.success;
            const dados = (response as any)?.data?.data ?? (response as any)?.data;

            console.log('📡 Resposta da API:', response);

            if (sucesso && dados) {
                const configs = Array.isArray(dados) ? dados : [dados];
                console.log('📋 Configurações recebidas:', configs);

                // Organizar configurações por categoria
                const configsPorCategoria = configs.reduce((acc: any, config: any) => {
                    if (!acc[config.categoria]) {
                        acc[config.categoria] = {};
                    }
                    acc[config.categoria][config.chave] = config.valor;
                    return acc;
                }, {});

                console.log('🗂️ Configurações por categoria:', configsPorCategoria);

                // Atualizar estados das abas
                if (configsPorCategoria.geral) {
                    const configGeralMapeada = {
                        SISTEMA_NOME: configsPorCategoria.geral.SISTEMA_NOME || '',
                        cnpj: configsPorCategoria.geral.cnpj || '',
                        endereco: configsPorCategoria.geral.endereco || '',
                        telefone: configsPorCategoria.geral.telefone || '',
                        email: configsPorCategoria.geral.email || '',
                        descricao: configsPorCategoria.geral.descricao || '',
                        HUB_SETOR_ID: (() => {
                            const v = (configsPorCategoria.geral as any).HUB_SETOR_ID;
                            if (typeof v === 'number') return v;
                            const n = parseInt(v);
                            return Number.isFinite(n) ? n : '';
                        })()
                    };

                    setConfigGeral(prev => ({ ...prev, ...configGeralMapeada }));
                }

                if (configsPorCategoria.seguranca) {
                    setConfigSeguranca(prev => ({ ...prev, ...configsPorCategoria.seguranca }));
                }

                if (configsPorCategoria.notificacoes) {
                    setConfigNotificacoes(prev => ({ ...prev, ...configsPorCategoria.notificacoes }));
                }

                if (configsPorCategoria.sistema) {
                    setConfigSistema(prev => ({ ...prev, ...configsPorCategoria.sistema }));
                }

                if (configsPorCategoria.aparencia) {
                    setConfigAparencia(prev => ({ ...prev, ...configsPorCategoria.aparencia }));
                }

                if (configsPorCategoria.apis) {
                    setConfigApis(prev => ({ ...prev, ...configsPorCategoria.apis }));
                }

                // Carregar configurações específicas de APIs
                try {
                    const respApis = await api.getConfiguracoesApis(1);
                    const dadosApis = (respApis as any)?.data?.data ?? (respApis as any)?.data;
                    const sucessoApis = (respApis as any)?.data?.success ?? (respApis as any)?.success;

                    if (sucessoApis && dadosApis) {
                        setConfigApis(prev => ({
                            ...prev,
                            GOOGLE_MAPS_API_KEY: dadosApis.GOOGLE_MAPS_API_KEY || prev.GOOGLE_MAPS_API_KEY || ''
                        }));
                    }
                } catch (error) {
                    console.error('Erro ao carregar configurações de APIs:', error);
                }

                // Carregar configurações de autenticação LDAP
                try {
                    const respLdap = await api.getConfiguracoesLdap(1);
                    const dadosLdap = (respLdap as any)?.data?.data ?? (respLdap as any)?.data;
                    const sucessoLdap = (respLdap as any)?.data?.success ?? (respLdap as any)?.success;

                    if (sucessoLdap && dadosLdap) {
                        setConfigAutenticacao({
                            LDAP_ENABLED: toBool(dadosLdap.LDAP_ENABLED),
                            LDAP_URL: dadosLdap.LDAP_URL || '',
                            LDAP_BASE_DN: dadosLdap.LDAP_BASE_DN || '',
                            LDAP_BIND_DN: dadosLdap.LDAP_BIND_DN || '',
                            LDAP_BIND_PASSWORD: dadosLdap.LDAP_BIND_PASSWORD || ''
                        });
                    }
                } catch (error) {
                    console.error('Erro ao carregar configurações LDAP:', error);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        } finally {
            setLoadingConfigs(false);
        }
    };

    // Função para salvar configurações
    const salvarConfiguracoes = async (categoria: string, dados: any) => {
        try {
            setSavingConfigs(true);

            if (categoria === 'apis') {
                await api.updateConfiguracoesApis(1, dados);
            } else if (categoria === 'autenticacao') {
                await api.updateConfiguracoesLdap(1, dados);
            } else {
                const configsArray = Object.entries(dados).map(([chave, valor]) => ({
                    categoria,
                    chave,
                    valor: String(valor)
                }));

                for (const config of configsArray) {
                    await api.saveConfiguracao(config);
                }
            }

            await carregarConfiguracoes();
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            throw error;
        } finally {
            setSavingConfigs(false);
        }
    };

    return {
        // Estados
        configGeral,
        configSeguranca,
        configAutenticacao,
        configNotificacoes,
        configSistema,
        configAparencia,
        configApis,
        loadingConfigs,
        savingConfigs,

        // Setters
        setConfigGeral,
        setConfigSeguranca,
        setConfigAutenticacao,
        setConfigNotificacoes,
        setConfigSistema,
        setConfigAparencia,
        setConfigApis,

        // Funções
        carregarConfiguracoes,
        salvarConfiguracoes
    };
};
