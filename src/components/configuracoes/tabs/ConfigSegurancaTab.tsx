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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Save, Shield } from "lucide-react";
import { useModuleTheme } from "@/lib/theme-config";

interface ConfigSegurancaTabProps {
    configSeguranca: any;
    setConfigSeguranca: React.Dispatch<React.SetStateAction<any>>;
    salvarConfigSeguranca: () => Promise<void>;
    savingConfigs: boolean;
}

export const ConfigSegurancaTab: React.FC<ConfigSegurancaTabProps> = ({
    configSeguranca,
    setConfigSeguranca,
    salvarConfigSeguranca,
    savingConfigs
}) => {
    const classes = useModuleTheme("configuracoes");

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" /> Configurações de Segurança
                    </CardTitle>
                    <CardDescription>
                        Configure as políticas de segurança do sistema
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Autenticação em duas etapas</Label>
                                <p className="text-sm text-muted-foreground">
                                    Ative a autenticação 2FA para maior segurança
                                </p>
                            </div>
                            <Switch
                                checked={configSeguranca.autenticacaoDuasEtapas}
                                onCheckedChange={(checked) => setConfigSeguranca((prev: any) => ({ ...prev, autenticacaoDuasEtapas: checked }))}
                            />
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label htmlFor="senhaComplexidade">Complexidade de senha</Label>
                            <Select
                                value={configSeguranca.senhaComplexidade}
                                onValueChange={(value) => setConfigSeguranca((prev: any) => ({ ...prev, senhaComplexidade: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="baixa">
                                        Baixa (mínimo 6 caracteres)
                                    </SelectItem>
                                    <SelectItem value="media">
                                        Média (mínimo 8 caracteres + números)
                                    </SelectItem>
                                    <SelectItem value="alta">
                                        Alta (mínimo 12 caracteres + símbolos)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expiracaoSessao">
                                Expiração de sessão (minutos)
                            </Label>
                            <Input
                                id="expiracaoSessao"
                                type="number"
                                value={configSeguranca.tempoSessao}
                                onChange={(e) => setConfigSeguranca((prev: any) => ({ ...prev, tempoSessao: parseInt(e.target.value) || 0 }))}
                                placeholder="60"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tentativasLogin">
                                Máximo de tentativas de login
                            </Label>
                            <Input
                                id="tentativasLogin"
                                type="number"
                                value={configSeguranca.tentativasLogin}
                                onChange={(e) => setConfigSeguranca((prev: any) => ({ ...prev, tentativasLogin: parseInt(e.target.value) || 0 }))}
                                placeholder="5"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bloqueioTempo">
                                Tempo de bloqueio (minutos)
                            </Label>
                            <Input
                                id="bloqueioTempo"
                                type="number"
                                value={configSeguranca.bloqueioTempo}
                                onChange={(e) => setConfigSeguranca((prev: any) => ({ ...prev, bloqueioTempo: parseInt(e.target.value) || 0 }))}
                                placeholder="15"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Log de auditoria</Label>
                                <p className="text-sm text-muted-foreground">
                                    Registrar todas as ações dos usuários
                                </p>
                            </div>
                            <Switch
                                checked={configSeguranca.logAuditoria}
                                onCheckedChange={(checked) => setConfigSeguranca((prev: any) => ({ ...prev, logAuditoria: checked }))}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={salvarConfigSeguranca}
                            disabled={savingConfigs}
                            className="flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {savingConfigs ? 'Salvando...' : 'Salvar Configurações'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
