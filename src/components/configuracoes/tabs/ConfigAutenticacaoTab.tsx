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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Save, Key, Database } from "lucide-react";
import LdapTestModal from '@/components/ui/ldap-test-modal';
import { useModuleTheme } from "@/lib/theme-config";

interface ConfigAutenticacaoTabProps {
    configLdap: any;
    setConfigLdap: React.Dispatch<React.SetStateAction<any>>;
    salvarConfigLdap: () => Promise<void>;
    savingConfigs: boolean;
    showLdapTestModal: boolean;
    setShowLdapTestModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ConfigAutenticacaoTab: React.FC<ConfigAutenticacaoTabProps> = ({
    configLdap,
    setConfigLdap,
    salvarConfigLdap,
    savingConfigs,
    showLdapTestModal,
    setShowLdapTestModal
}) => {
    const classes = useModuleTheme("configuracoes");

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="w-5 h-5" /> Configurações de Autenticação
                    </CardTitle>
                    <CardDescription>
                        Configure os métodos de autenticação do sistema, incluindo LDAP
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Toggle principal para LDAP */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                            <div className="space-y-0.5">
                                <Label className="text-base font-medium">Autenticação LDAP</Label>
                                <p className="text-sm text-muted-foreground">
                                    Habilite a autenticação via LDAP. O método de autenticação padrão permanecerá como fallback.
                                </p>
                            </div>
                            <Switch
                                checked={configLdap.ldapAtivo}
                                onCheckedChange={(checked) => setConfigLdap((prev: any) => ({ ...prev, ldapAtivo: checked }))}
                            />
                        </div>

                        {/* Configurações LDAP - só aparecem quando LDAP está ativo */}
                        {configLdap.ldapAtivo && (
                            <div className="space-y-6 p-4 border rounded-lg">
                                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Configurações do Servidor LDAP</h3>

                                {/* Informações básicas do servidor */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="nomeServidor">Nome do Servidor</Label>
                                        <Input
                                            id="nomeServidor"
                                            value={configLdap.nomeServidor}
                                            onChange={(e) => setConfigLdap((prev: any) => ({ ...prev, nomeServidor: e.target.value }))}
                                            placeholder="srv-acdc"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="servidor">Endereço do Servidor</Label>
                                        <Input
                                            id="servidor"
                                            value={configLdap.servidor}
                                            onChange={(e) => setConfigLdap((prev: any) => ({ ...prev, servidor: e.target.value }))}
                                            placeholder="10.9.7.106"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="porta">Porta LDAP</Label>
                                        <Input
                                            id="porta"
                                            type="number"
                                            value={configLdap.porta}
                                            onChange={(e) => setConfigLdap((prev: any) => ({ ...prev, porta: parseInt(e.target.value) || 389 }))}
                                            placeholder="389"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="campoLogin">Campo de Login</Label>
                                        <Input
                                            id="campoLogin"
                                            value={configLdap.campoLogin}
                                            onChange={(e) => setConfigLdap((prev: any) => ({ ...prev, campoLogin: e.target.value }))}
                                            placeholder="samaccountname"
                                        />
                                    </div>
                                </div>

                                {/* BaseDN e Filtros */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="baseDN">BaseDN</Label>
                                        <Input
                                            id="baseDN"
                                            value={configLdap.baseDN}
                                            onChange={(e) => setConfigLdap((prev: any) => ({ ...prev, baseDN: e.target.value }))}
                                            placeholder="OU=CONTAS;dc=sefaz;dc=to;dc=gov;dc=br"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Unidade organizacional onde estão os usuários
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="filtroConexao">Filtro da Conexão</Label>
                                        <Textarea
                                            id="filtroConexao"
                                            value={configLdap.filtroConexao}
                                            onChange={(e) => setConfigLdap((prev: any) => ({ ...prev, filtroConexao: e.target.value }))}
                                            placeholder="(&(objectClass=user)(objectCategory=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))"
                                            rows={3}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Filtro LDAP para buscar usuários ativos
                                        </p>
                                    </div>
                                </div>

                                {/* Configurações de Bind */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Usar Bind (ligações não-anônimas)</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Necessário para autenticação com credenciais
                                            </p>
                                        </div>
                                        <Switch
                                            checked={configLdap.usarBind}
                                            onCheckedChange={(checked) => setConfigLdap((prev: any) => ({ ...prev, usarBind: checked }))}
                                        />
                                    </div>

                                    {configLdap.usarBind && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="rootDN">RootDN (usuário de bind)</Label>
                                                <Input
                                                    id="rootDN"
                                                    value={configLdap.rootDN}
                                                    onChange={(e) => setConfigLdap((prev: any) => ({ ...prev, rootDN: e.target.value }))}
                                                    placeholder="sefaz\glpi"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="senhaRootDN">Senha do RootDN</Label>
                                                <Input
                                                    id="senhaRootDN"
                                                    type="password"
                                                    value={configLdap.senhaRootDN}
                                                    onChange={(e) => setConfigLdap((prev: any) => ({ ...prev, senhaRootDN: e.target.value }))}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Configurações adicionais */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Servidor Padrão</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Definir como servidor LDAP principal
                                            </p>
                                        </div>
                                        <Switch
                                            checked={configLdap.servidorPadrao}
                                            onCheckedChange={(checked) => setConfigLdap((prev: any) => ({ ...prev, servidorPadrao: checked }))}
                                        />
                                    </div>
                                </div>

                                {/* Botão de teste de conexão */}
                                <div className="flex gap-2 pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        className="flex items-center gap-2"
                                        onClick={() => setShowLdapTestModal(true)}
                                    >
                                        <Database className="w-4 h-4" />
                                        Testar Conexão
                                    </Button>
                                    <Button
                                        onClick={salvarConfigLdap}
                                        disabled={savingConfigs}
                                        className="flex items-center gap-2"
                                    >
                                        <Save className="w-4 h-4" />
                                        {savingConfigs ? 'Salvando...' : 'Salvar Configurações LDAP'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Informações sobre fallback */}
                        <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                                ℹ️ Método de Autenticação Híbrido
                            </h4>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                Quando o LDAP estiver ativo, o sistema tentará autenticar primeiro via LDAP.
                                Se a autenticação LDAP falhar ou não estiver disponível, o sistema utilizará
                                automaticamente o método de autenticação padrão (banco de dados local).
                                O sistema manterá sempre o login e senha de admin como padrão, mesmo quando o LDAP estiver funcionando.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <LdapTestModal
                isOpen={showLdapTestModal}
                onClose={() => setShowLdapTestModal(false)}
                config={configLdap}
            />
        </div>
    );
};
