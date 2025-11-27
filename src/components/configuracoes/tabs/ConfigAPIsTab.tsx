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
import { Save, Database } from "lucide-react";
import { useModuleTheme } from "@/lib/theme-config";

interface ConfigAPIsTabProps {
    configApis: any;
    setConfigApis: React.Dispatch<React.SetStateAction<any>>;
    salvarConfigApis: () => Promise<void>;
    savingConfigs: boolean;
}

export const ConfigAPIsTab: React.FC<ConfigAPIsTabProps> = ({
    configApis,
    setConfigApis,
    salvarConfigApis,
    savingConfigs
}) => {
    const classes = useModuleTheme("configuracoes");

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="w-5 h-5" /> Configurações de APIs
                            </CardTitle>
                            <CardDescription>
                                Configure as chaves de API para integração com serviços externos
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        {/* Google Maps API */}
                        <div className="space-y-4 p-4 border rounded-lg">
                            <div className="flex items-center gap-2">
                                <Database className="w-4 h-4 text-blue-600" />
                                <h3 className="font-semibold text-lg">Google Maps API</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Chave de API necessária para funcionalidades de mapa, geocodificação e rotas
                            </p>
                            <div className="space-y-2">
                                <Label htmlFor="googleMapsApiKey">API Key do Google Maps</Label>
                                <Input
                                    id="googleMapsApiKey"
                                    type="password"
                                    value={configApis.googleMapsApiKey}
                                    onChange={(e) => setConfigApis((prev: any) => ({ ...prev, googleMapsApiKey: e.target.value }))}
                                    placeholder="Digite sua chave de API do Google Maps"
                                    className="font-mono"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="googleMapsEnabled"
                                    checked={configApis.googleMapsAtivo}
                                    onCheckedChange={(checked) => setConfigApis((prev: any) => ({ ...prev, googleMapsAtivo: checked }))}
                                />
                                <Label htmlFor="googleMapsEnabled">Habilitar Google Maps</Label>
                            </div>
                        </div>

                        {/* OpenRouteService API */}
                        <div className="space-y-4 p-4 border rounded-lg">
                            <div className="flex items-center gap-2">
                                <Database className="w-4 h-4 text-purple-600" />
                                <h3 className="font-semibold text-lg">OpenRouteService API</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Chave de API utilizada para cálculo de rotas e matrizes de distância
                            </p>
                            <div className="space-y-2">
                                <Label htmlFor="openRouteServiceApiKey">API Key do OpenRouteService</Label>
                                <Input
                                    id="openRouteServiceApiKey"
                                    type="password"
                                    value={configApis.openRouteServiceApiKey}
                                    onChange={(e) => setConfigApis((prev: any) => ({ ...prev, openRouteServiceApiKey: e.target.value }))}
                                    placeholder="Digite sua chave de API do OpenRouteService"
                                    className="font-mono"
                                />
                            </div>
                        </div>

                        {/* API de Busca de CEP */}
                        <div className="space-y-4 p-4 border rounded-lg">
                            <div className="flex items-center gap-2">
                                <Database className="w-4 h-4 text-green-600" />
                                <h3 className="font-semibold text-lg">API de Busca de CEP</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Configure o serviço de busca de CEP para preenchimento automático de endereços
                            </p>
                            <div className="space-y-2">
                                <Label htmlFor="cepApiUrl">URL da API</Label>
                                <Input
                                    id="cepApiUrl"
                                    value={configApis.cepApiUrl}
                                    onChange={(e) => setConfigApis((prev: any) => ({ ...prev, cepApiUrl: e.target.value }))}
                                    placeholder="URL base da API de CEP"
                                    className="font-mono"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="cepApiEnabled"
                                    checked={configApis.cepApiAtivo}
                                    onCheckedChange={(checked) => setConfigApis((prev: any) => ({ ...prev, cepApiAtivo: checked }))}
                                />
                                <Label htmlFor="cepApiEnabled">Habilitar busca de CEP</Label>
                            </div>
                        </div>

                        {/* Configurações Gerais de API */}
                        <div className="space-y-4 p-4 border rounded-lg">
                            <div className="flex items-center gap-2">
                                <Database className="w-4 h-4 text-orange-600" />
                                <h3 className="font-semibold text-lg">Configurações Gerais</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Configure parâmetros gerais para todas as APIs
                            </p>
                            <div className="space-y-2">
                                <Label htmlFor="timeoutApi">Timeout das APIs (segundos)</Label>
                                <Input
                                    id="timeoutApi"
                                    type="number"
                                    value={configApis.timeoutApi}
                                    onChange={(e) => setConfigApis((prev: any) => ({ ...prev, timeoutApi: e.target.value }))}
                                    placeholder="30"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={salvarConfigApis}
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
