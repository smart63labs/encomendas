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
import { Save, Palette } from "lucide-react";
import { useModuleTheme } from "@/lib/theme-config";

interface ConfigAparenciaTabProps {
    configAparencia: any;
    setConfigAparencia: React.Dispatch<React.SetStateAction<any>>;
    salvarConfigAparencia: () => Promise<void>;
    savingConfigs: boolean;
}

export const ConfigAparenciaTab: React.FC<ConfigAparenciaTabProps> = ({
    configAparencia,
    setConfigAparencia,
    salvarConfigAparencia,
    savingConfigs
}) => {
    const classes = useModuleTheme("configuracoes");

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="w-5 h-5" /> Configurações de Aparência
                    </CardTitle>
                    <CardDescription>Personalize a aparência do sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="tema">Tema</Label>
                            <Select
                                value={configAparencia.tema}
                                onValueChange={(value) => setConfigAparencia((prev: any) => ({ ...prev, tema: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="claro">Claro</SelectItem>
                                    <SelectItem value="escuro">Escuro</SelectItem>
                                    <SelectItem value="auto">Automático</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="idioma">Idioma</Label>
                            <Select
                                value={configAparencia.idioma}
                                onValueChange={(value) => setConfigAparencia((prev: any) => ({ ...prev, idioma: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                                    <SelectItem value="en-US">English (US)</SelectItem>
                                    <SelectItem value="es-ES">Español</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="formatoData">Formato de data</Label>
                            <Select
                                value={configAparencia.formatoData}
                                onValueChange={(value) => setConfigAparencia((prev: any) => ({ ...prev, formatoData: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dd/mm/yyyy">DD/MM/AAAA</SelectItem>
                                    <SelectItem value="mm/dd/yyyy">MM/DD/AAAA</SelectItem>
                                    <SelectItem value="yyyy-mm-dd">AAAA-MM-DD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="densidade">Densidade da interface</Label>
                            <Select
                                value={configAparencia.densidade}
                                onValueChange={(value) => setConfigAparencia((prev: any) => ({ ...prev, densidade: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="compacta">Compacta</SelectItem>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="confortavel">Confortável</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="corPrimaria">Cor primária</Label>
                            <Select
                                value={configAparencia.corPrimaria}
                                onValueChange={(value) => setConfigAparencia((prev: any) => ({ ...prev, corPrimaria: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="azul">Azul</SelectItem>
                                    <SelectItem value="verde">Verde</SelectItem>
                                    <SelectItem value="roxo">Roxo</SelectItem>
                                    <SelectItem value="vermelho">Vermelho</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Animações</Label>
                                <p className="text-sm text-muted-foreground">
                                    Ativar animações na interface
                                </p>
                            </div>
                            <Switch
                                checked={configAparencia.animacoes}
                                onCheckedChange={(checked) => setConfigAparencia((prev: any) => ({ ...prev, animacoes: checked }))}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Sidebar compacta</Label>
                                <p className="text-sm text-muted-foreground">
                                    Usar sidebar em modo compacto
                                </p>
                            </div>
                            <Switch
                                checked={configAparencia.sidebarCompacta}
                                onCheckedChange={(checked) => setConfigAparencia((prev: any) => ({ ...prev, sidebarCompacta: checked }))}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={salvarConfigAparencia}
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
