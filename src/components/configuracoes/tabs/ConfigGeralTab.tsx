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
import { Save, Settings } from "lucide-react";
import ImageUploadEditor from "@/components/ui/image-upload-editor";
import { useModuleTheme } from "@/lib/theme-config";

interface ConfigGeralTabProps {
    configGeral: any;
    setConfigGeral: React.Dispatch<React.SetStateAction<any>>;
    salvarConfigGeral: () => Promise<void>;
    savingConfigs: boolean;
}

export const ConfigGeralTab: React.FC<ConfigGeralTabProps> = ({
    configGeral,
    setConfigGeral,
    salvarConfigGeral,
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
                                <Settings className="w-5 h-5" /> Configurações Gerais
                            </CardTitle>
                            <CardDescription>
                                Informações básicas da instituição e do sistema
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Seção: Informações da Instituição */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground border-b pb-2">Informações da Instituição</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="nomeInstituicao">Nome da Instituição</Label>
                                <Input
                                    id="nomeInstituicao"
                                    value={configGeral.nomeInstituicao}
                                    onChange={(e) => setConfigGeral((prev: any) => ({ ...prev, nomeInstituicao: e.target.value }))}
                                    placeholder="Ex: Secretaria da Fazenda"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cnpj">CNPJ</Label>
                                <Input
                                    id="cnpj"
                                    value={configGeral.cnpj}
                                    onChange={(e) => setConfigGeral((prev: any) => ({ ...prev, cnpj: e.target.value }))}
                                    placeholder="00.000.000/0000-00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="enderecoCompleto">Endereço Completo</Label>
                                <Input
                                    id="enderecoCompleto"
                                    value={configGeral.enderecoCompleto}
                                    onChange={(e) => setConfigGeral((prev: any) => ({ ...prev, enderecoCompleto: e.target.value }))}
                                    placeholder="Endereço completo com CEP"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Seção: Contato */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground border-b pb-2">Informações de Contato</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="telefone">Telefone</Label>
                                <Input
                                    id="telefone"
                                    value={configGeral.telefone}
                                    onChange={(e) => setConfigGeral((prev: any) => ({ ...prev, telefone: e.target.value }))}
                                    placeholder="(63) 3000-0000"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="whatsapp">WhatsApp</Label>
                                <Input
                                    id="whatsapp"
                                    value={configGeral.whatsapp}
                                    onChange={(e) => setConfigGeral((prev: any) => ({ ...prev, whatsapp: e.target.value }))}
                                    placeholder="(63) 99999-9999"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail Institucional</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={configGeral.email}
                                    onChange={(e) => setConfigGeral((prev: any) => ({ ...prev, email: e.target.value }))}
                                    placeholder="contato@to.gov.br"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="emailContato">E-mail de Contato</Label>
                                <Input
                                    id="emailContato"
                                    type="email"
                                    value={configGeral.emailContato}
                                    onChange={(e) => setConfigGeral((prev: any) => ({ ...prev, emailContato: e.target.value }))}
                                    placeholder="contato@instituicao.gov.br"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Seção: URLs e Redes Sociais */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground border-b pb-2">URLs e Redes Sociais</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="siteUrl">Site Institucional</Label>
                                <Input
                                    id="siteUrl"
                                    type="url"
                                    value={configGeral.siteUrl}
                                    onChange={(e) => setConfigGeral((prev: any) => ({ ...prev, siteUrl: e.target.value }))}
                                    placeholder="https://www.instituicao.gov.br"
                                />
                            </div>
                            <ImageUploadEditor
                                value={configGeral.logoHeaderUrl}
                                onChange={(url) => setConfigGeral((prev: any) => ({ ...prev, logoHeaderUrl: url }))}
                                label="URL do Logo (Header)"
                                placeholder="https://exemplo.com/logo.png"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="facebookUrl">Facebook</Label>
                                <Input
                                    id="facebookUrl"
                                    type="url"
                                    value={configGeral.facebookUrl}
                                    onChange={(e) => setConfigGeral((prev: any) => ({ ...prev, facebookUrl: e.target.value }))}
                                    placeholder="https://facebook.com/instituicao"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="instagramUrl">Instagram</Label>
                                <Input
                                    id="instagramUrl"
                                    type="url"
                                    value={configGeral.instagramUrl}
                                    onChange={(e) => setConfigGeral((prev: any) => ({ ...prev, instagramUrl: e.target.value }))}
                                    placeholder="https://instagram.com/instituicao"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="twitterUrl">Twitter/X</Label>
                            <Input
                                id="twitterUrl"
                                type="url"
                                value={configGeral.twitterUrl}
                                onChange={(e) => setConfigGeral((prev: any) => ({ ...prev, twitterUrl: e.target.value }))}
                                placeholder="https://twitter.com/instituicao"
                            />
                        </div>
                    </div>

                    {/* Seção: Configurações Adicionais */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground border-b pb-2">Configurações Adicionais</h3>
                        <div className="space-y-2">
                            <Label htmlFor="textoCopyright">Texto de Copyright</Label>
                            <Input
                                id="textoCopyright"
                                value={configGeral.textoCopyright}
                                onChange={(e) => setConfigGeral((prev: any) => ({ ...prev, textoCopyright: e.target.value }))}
                                placeholder="© 2024 Instituição. Todos os direitos reservados."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={salvarConfigGeral}
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
