import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Save, Bell } from "lucide-react";
import { useModuleTheme } from "@/lib/theme-config";

interface ConfigNotificacoesTabProps {
    configNotificacoes: any;
    setConfigNotificacoes: React.Dispatch<React.SetStateAction<any>>;
    salvarConfigNotificacoes: () => Promise<void>;
    savingConfigs: boolean;
}

export const ConfigNotificacoesTab: React.FC<ConfigNotificacoesTabProps> = ({
    configNotificacoes,
    setConfigNotificacoes,
    salvarConfigNotificacoes,
    savingConfigs
}) => {
    const classes = useModuleTheme("configuracoes");

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5" /> Configurações de Notificações
                    </CardTitle>
                    <CardDescription>
                        Configure como e quando receber notificações
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Notificações por e-mail</Label>
                                <p className="text-sm text-muted-foreground">
                                    Receber notificações importantes por e-mail
                                </p>
                            </div>
                            <Switch
                                checked={configNotificacoes.notificacoesEmail}
                                onCheckedChange={(checked) => setConfigNotificacoes((prev: any) => ({ ...prev, notificacoesEmail: checked }))}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Notificações push</Label>
                                <p className="text-sm text-muted-foreground">
                                    Receber notificações push no navegador
                                </p>
                            </div>
                            <Switch
                                checked={configNotificacoes.notificacoesPush}
                                onCheckedChange={(checked) => setConfigNotificacoes((prev: any) => ({ ...prev, notificacoesPush: checked }))}
                            />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>E-mail para processos</Label>
                                <p className="text-sm text-muted-foreground">
                                    Notificações sobre novos processos
                                </p>
                            </div>
                            <Switch
                                checked={configNotificacoes.emailProcessos}
                                onCheckedChange={(checked) => setConfigNotificacoes((prev: any) => ({ ...prev, emailProcessos: checked }))}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>E-mail para prazos</Label>
                                <p className="text-sm text-muted-foreground">
                                    Notificações sobre prazos vencendo
                                </p>
                            </div>
                            <Switch
                                checked={configNotificacoes.emailPrazos}
                                onCheckedChange={(checked) => setConfigNotificacoes((prev: any) => ({ ...prev, emailPrazos: checked }))}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>E-mail para documentos</Label>
                                <p className="text-sm text-muted-foreground">
                                    Notificações sobre novos documentos
                                </p>
                            </div>
                            <Switch
                                checked={configNotificacoes.emailDocumentos}
                                onCheckedChange={(checked) => setConfigNotificacoes((prev: any) => ({ ...prev, emailDocumentos: checked }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="frequenciaRelatorios">
                                Frequência de resumo
                            </Label>
                            <Select
                                value={configNotificacoes.frequenciaResumo}
                                onValueChange={(value) => setConfigNotificacoes((prev: any) => ({ ...prev, frequenciaResumo: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="diario">Diário</SelectItem>
                                    <SelectItem value="semanal">Semanal</SelectItem>
                                    <SelectItem value="mensal">Mensal</SelectItem>
                                    <SelectItem value="nunca">Nunca</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={salvarConfigNotificacoes}
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
