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
import { Save, Database, RefreshCw } from "lucide-react";
import { useModuleTheme } from "@/lib/theme-config";

interface ConfigSistemaTabProps {
    configSistema: any;
    setConfigSistema: React.Dispatch<React.SetStateAction<any>>;
    salvarConfigSistema: () => Promise<void>;
    savingConfigs: boolean;
}

export const ConfigSistemaTab: React.FC<ConfigSistemaTabProps> = ({
    configSistema,
    setConfigSistema,
    salvarConfigSistema,
    savingConfigs
}) => {
    const classes = useModuleTheme("configuracoes");

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5" /> Configurações do Sistema
                    </CardTitle>
                    <CardDescription>
                        Configure parâmetros técnicos do sistema
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Backup automático</Label>
                                <p className="text-sm text-muted-foreground">
                                    Realizar backup automático dos dados
                                </p>
                            </div>
                            <Switch
                                checked={configSistema.backupAutomatico}
                                onCheckedChange={(checked) => setConfigSistema((prev: any) => ({ ...prev, backupAutomatico: checked }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="frequenciaBackup">Frequência do backup</Label>
                            <Select
                                value={configSistema.frequenciaBackup}
                                onValueChange={(value) => setConfigSistema((prev: any) => ({ ...prev, frequenciaBackup: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="6h">A cada 6 horas</SelectItem>
                                    <SelectItem value="diario">Diário</SelectItem>
                                    <SelectItem value="semanal">Semanal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="retencaoLogs">Retenção de logs (dias)</Label>
                            <Input
                                id="retencaoLogs"
                                type="number"
                                value={configSistema.retencaoLogs}
                                onChange={(e) => setConfigSistema((prev: any) => ({ ...prev, retencaoLogs: e.target.value }))}
                                placeholder="90"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tamanhoMaxArquivo">
                                Tamanho máximo de arquivo (MB)
                            </Label>
                            <Input
                                id="tamanhoMaxArquivo"
                                type="number"
                                value={configSistema.tamanhoMaxArquivo}
                                onChange={(e) => setConfigSistema((prev: any) => ({ ...prev, tamanhoMaxArquivo: e.target.value }))}
                                placeholder="10"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="timeoutSessao">Timeout de sessão (minutos)</Label>
                            <Input
                                id="timeoutSessao"
                                type="number"
                                value={configSistema.timeoutSessao}
                                onChange={(e) => setConfigSistema((prev: any) => ({ ...prev, timeoutSessao: e.target.value }))}
                                placeholder="30"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Modo de manutenção</Label>
                                <p className="text-sm text-muted-foreground">
                                    Ativar modo de manutenção do sistema
                                </p>
                            </div>
                            <Switch
                                checked={configSistema.modoManutencao}
                                onCheckedChange={(checked) => setConfigSistema((prev: any) => ({ ...prev, modoManutencao: checked }))}
                            />
                        </div>

                        <Separator />

                        <div className="flex gap-4">
                            <Button className={`${classes.buttonSecondary} text-white`}>
                                <RefreshCw className="w-4 h-4 mr-2" /> Limpar Cache
                            </Button>
                            <Button className={`${classes.buttonSecondary} text-white`}>
                                <Database className="w-4 h-4 mr-2" /> Backup Manual
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={salvarConfigSistema}
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
