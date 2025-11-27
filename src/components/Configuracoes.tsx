import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Settings,
    Users,
    MapPin,
    Package,
    Lock,
    Bell,
    Monitor,
    Shield,
    Key,
    Database,
    FileText
} from "lucide-react";
import { useModuleTheme } from "@/lib/theme-config";

// Hooks
import { useConfiguracao } from './configuracoes/hooks/useConfiguracao';
import { useSetores } from './configuracoes/hooks/useSetores';

// Componentes de Abas
import { ConfigGeralTab } from './configuracoes/tabs/ConfigGeralTab';
import { ConfigUsuariosTab } from './configuracoes/tabs/ConfigUsuariosTab';
import { ConfigSetoresTab } from './configuracoes/tabs/ConfigSetoresTab';
import { ConfigMaloteTab } from './configuracoes/tabs/ConfigMaloteTab';
import { ConfigLacreTab } from './configuracoes/tabs/ConfigLacreTab';
import { ConfigSegurancaTab } from './configuracoes/tabs/ConfigSegurancaTab';
import { ConfigAutenticacaoTab } from './configuracoes/tabs/ConfigAutenticacaoTab';
import { ConfigNotificacoesTab } from './configuracoes/tabs/ConfigNotificacoesTab';
import { ConfigSistemaTab } from './configuracoes/tabs/ConfigSistemaTab';
import { ConfigAparenciaTab } from './configuracoes/tabs/ConfigAparenciaTab';
import { ConfigAPIsTab } from './configuracoes/tabs/ConfigAPIsTab';

const Configuracoes: React.FC = () => {
    const classes = useModuleTheme("configuracoes");
    const [activeTab, setActiveTab] = useState("geral");

    // Estado local para modal de teste LDAP (necessário para ConfigAutenticacaoTab)
    const [showLdapTestModal, setShowLdapTestModal] = useState(false);

    // Hook de Configurações Gerais
    const {
        configGeral,
        configSeguranca,
        configAutenticacao,
        configNotificacoes,
        configSistema,
        configAparencia,
        configApis,
        loadingConfigs,
        savingConfigs,
        setConfigGeral,
        setConfigSeguranca,
        setConfigAutenticacao,
        setConfigNotificacoes,
        setConfigSistema,
        setConfigAparencia,
        setConfigApis,
        carregarConfiguracoes,
        salvarConfiguracoes
    } = useConfiguracao();

    // Hook de Setores (necessário para várias abas)
    const { setoresData, carregarSetores } = useSetores();

    // Carregar dados iniciais
    useEffect(() => {
        carregarConfiguracoes();
        carregarSetores();
    }, []);

    // Funções de salvamento específicas para cada aba
    const handleSalvarGeral = () => salvarConfiguracoes('geral', configGeral);
    const handleSalvarSeguranca = () => salvarConfiguracoes('seguranca', configSeguranca);
    const handleSalvarAutenticacao = () => salvarConfiguracoes('autenticacao', configAutenticacao);
    const handleSalvarNotificacoes = () => salvarConfiguracoes('notificacoes', configNotificacoes);
    const handleSalvarSistema = () => salvarConfiguracoes('sistema', configSistema);
    const handleSalvarAparencia = () => salvarConfiguracoes('aparencia', configAparencia);
    const handleSalvarApis = () => salvarConfiguracoes('apis', configApis);

    if (loadingConfigs) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h1>
                <p className="text-muted-foreground">
                    Gerencie todas as configurações, usuários e preferências do sistema em um só lugar.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="w-full overflow-x-auto pb-2">
                    <TabsList className="inline-flex h-auto p-1 bg-muted/50 rounded-lg">
                        <TabsTrigger value="geral" className="gap-2 py-2">
                            <Settings className="w-4 h-4" /> Geral
                        </TabsTrigger>
                        <TabsTrigger value="usuarios" className="gap-2 py-2">
                            <Users className="w-4 h-4" /> Usuários
                        </TabsTrigger>
                        <TabsTrigger value="setores" className="gap-2 py-2">
                            <MapPin className="w-4 h-4" /> Setores
                        </TabsTrigger>
                        <TabsTrigger value="malotes" className="gap-2 py-2">
                            <Package className="w-4 h-4" /> Malotes
                        </TabsTrigger>
                        <TabsTrigger value="lacres" className="gap-2 py-2">
                            <FileText className="w-4 h-4" /> Lacres
                        </TabsTrigger>
                        <TabsTrigger value="seguranca" className="gap-2 py-2">
                            <Shield className="w-4 h-4" /> Segurança
                        </TabsTrigger>
                        <TabsTrigger value="autenticacao" className="gap-2 py-2">
                            <Key className="w-4 h-4" /> Autenticação
                        </TabsTrigger>
                        <TabsTrigger value="notificacoes" className="gap-2 py-2">
                            <Bell className="w-4 h-4" /> Notificações
                        </TabsTrigger>
                        <TabsTrigger value="sistema" className="gap-2 py-2">
                            <Monitor className="w-4 h-4" /> Sistema
                        </TabsTrigger>
                        <TabsTrigger value="aparencia" className="gap-2 py-2">
                            <Monitor className="w-4 h-4" /> Aparência
                        </TabsTrigger>
                        <TabsTrigger value="apis" className="gap-2 py-2">
                            <Database className="w-4 h-4" /> APIs
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Aba Geral */}
                <TabsContent value="geral" className="space-y-4">
                    <ConfigGeralTab
                        configGeral={configGeral}
                        setConfigGeral={setConfigGeral}
                        salvarConfigGeral={handleSalvarGeral}
                        savingConfigs={savingConfigs}
                    />
                </TabsContent>

                {/* Aba Usuários */}
                <TabsContent value="usuarios" className="space-y-4">
                    <ConfigUsuariosTab setoresData={setoresData} />
                </TabsContent>

                {/* Aba Setores */}
                <TabsContent value="setores" className="space-y-4">
                    <ConfigSetoresTab />
                </TabsContent>

                {/* Aba Malotes */}
                <TabsContent value="malotes" className="space-y-4">
                    <ConfigMaloteTab
                        setoresData={setoresData}
                        configGeral={configGeral}
                        setConfigGeral={setConfigGeral}
                        salvarConfiguracoes={salvarConfiguracoes}
                        savingConfigs={savingConfigs}
                    />
                </TabsContent>

                {/* Aba Lacres */}
                <TabsContent value="lacres" className="space-y-4">
                    <ConfigLacreTab setoresData={setoresData} />
                </TabsContent>

                {/* Aba Segurança */}
                <TabsContent value="seguranca" className="space-y-4">
                    <ConfigSegurancaTab
                        configSeguranca={configSeguranca}
                        setConfigSeguranca={setConfigSeguranca}
                        salvarConfigSeguranca={handleSalvarSeguranca}
                        savingConfigs={savingConfigs}
                    />
                </TabsContent>

                {/* Aba Autenticação */}
                <TabsContent value="autenticacao" className="space-y-4">
                    <ConfigAutenticacaoTab
                        configLdap={configAutenticacao}
                        setConfigLdap={setConfigAutenticacao}
                        salvarConfigLdap={handleSalvarAutenticacao}
                        savingConfigs={savingConfigs}
                        showLdapTestModal={showLdapTestModal}
                        setShowLdapTestModal={setShowLdapTestModal}
                    />
                </TabsContent>

                {/* Aba Notificações */}
                <TabsContent value="notificacoes" className="space-y-4">
                    <ConfigNotificacoesTab
                        configNotificacoes={configNotificacoes}
                        setConfigNotificacoes={setConfigNotificacoes}
                        salvarConfigNotificacoes={handleSalvarNotificacoes}
                        savingConfigs={savingConfigs}
                    />
                </TabsContent>

                {/* Aba Sistema */}
                <TabsContent value="sistema" className="space-y-4">
                    <ConfigSistemaTab
                        configSistema={configSistema}
                        setConfigSistema={setConfigSistema}
                        salvarConfigSistema={handleSalvarSistema}
                        savingConfigs={savingConfigs}
                    />
                </TabsContent>

                {/* Aba Aparência */}
                <TabsContent value="aparencia" className="space-y-4">
                    <ConfigAparenciaTab
                        configAparencia={configAparencia}
                        setConfigAparencia={setConfigAparencia}
                        salvarConfigAparencia={handleSalvarAparencia}
                        savingConfigs={savingConfigs}
                    />
                </TabsContent>

                {/* Aba APIs */}
                <TabsContent value="apis" className="space-y-4">
                    <ConfigAPIsTab
                        configApis={configApis}
                        setConfigApis={setConfigApis}
                        salvarConfigApis={handleSalvarApis}
                        savingConfigs={savingConfigs}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Configuracoes;
