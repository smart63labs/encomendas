import React, { useMemo, useState } from 'react';
import { User, MapPin, FileText, Key, ChevronLeft, ChevronRight, Check, Eye, EyeOff, Building2, ChevronUp, ChevronDown, RefreshCw, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import MapaUsuario from './MapaUsuario';
import MapaSetor from '@/components/ui/MapaSetor';
import { useCepSearch } from '@/hooks/useCepSearch';
import { GeocodingService } from '@/services/geocoding.service';

interface NovoUsuarioWizardProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onCancel?: () => void;
  onCreateUser?: () => void | Promise<void>;
  onUpdateUser?: () => void | Promise<void>;
  setores?: any[];
  isEditMode?: boolean;
  selectedUser?: any;
}

const NovoUsuarioWizard: React.FC<NovoUsuarioWizardProps> = ({
  formData,
  setFormData,
  onCancel,
  onCreateUser,
  onUpdateUser,
  setores = [],
  isEditMode = false,
  selectedUser,
}) => {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mapaExpanded, setMapaExpanded] = useState(true);
  const [acessoExpanded, setAcessoExpanded] = useState(true);
  const [pessoalExpanded, setPessoalExpanded] = useState(true);
  const [enderecoExpanded, setEnderecoExpanded] = useState(true);
  const [setorExpanded, setSetorExpanded] = useState(true);
  const [funcionaisExpanded, setFuncionaisExpanded] = useState(true);
  const [manualAddressEdit, setManualAddressEdit] = useState(false);
  const [setorComboboxOpen, setSetorComboboxOpen] = useState(false);

  // Usar currentStep do formData
  const currentStep = formData.currentStep || 1;

  // Hook para busca de CEP
  const { searchCep, loading: cepLoading, error: cepError, clearError } = useCepSearch();

  const steps = [
    { id: 1, title: 'Acesso', icon: Key },
    { id: 2, title: 'Pessoal e Contatos', icon: User },
    { id: 3, title: 'Endereço', icon: MapPin },
    { id: 4, title: 'Lotação', icon: Building2 },
    { id: 5, title: 'Funcionais', icon: FileText },
    { id: 6, title: 'Revisão', icon: Check },
  ];

  const progress = (currentStep / steps.length) * 100;

  // Setor selecionado para exibir no mapa
  const selectedSetor = useMemo(() => {
    if (!formData?.setor_id || !Array.isArray(setores)) return null;
    return setores.find((s: any) => s && (s.ID || s.id) && String(s.ID ?? s.id) === String(formData.setor_id));
  }, [formData?.setor_id, setores]);

  const setField = (name: string, value: any) => {
    if (name === 'telefone') {
      const clean = String(value).replace(/\D/g, '').slice(0, 10);
      let masked = '';
      if (clean.length > 0) {
        if (clean.length <= 2) masked = `(${clean}`;
        else if (clean.length <= 6) masked = `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
        else masked = `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
      }
      setFormData((prev: any) => ({ ...prev, [name]: masked }));
      return;
    }
    
    if (name === 'cep_endereco') {
      const clean = String(value).replace(/\D/g, '').slice(0, 8);
      let masked = '';
      if (clean.length > 0) {
        if (clean.length <= 5) masked = clean;
        else masked = `${clean.slice(0, 5)}-${clean.slice(5)}`;
      }
      setFormData((prev: any) => ({ ...prev, [name]: masked }));
      return;
    }
    
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  // Função para buscar CEP
  const handleCepSearch = async (cep: string) => {
    if (!cep || cep.length < 8) return;
    
    clearError();
    setIsFallbackCoordinates(false);
    
    try {
      // Primeiro, tenta buscar coordenadas do GeocodingService
      let coordinates = null;
      try {
        coordinates = await GeocodingService.geocodeByCep(cep);
      } catch (error) {
        console.log('GeocodingService não retornou coordenadas, tentando BrasilAPI...');
      }

      // Se não conseguiu coordenadas, usa o hook useCepSearch (BrasilAPI)
      const cepData = await searchCep(cep);
      if (cepData) {
        let finalCoordinates = coordinates;
        
        // Se ainda não tem coordenadas, tenta usar as do BrasilAPI
        if (!finalCoordinates && cepData.location?.coordinates) {
          if (cepData.location.coordinates.latitude !== 'N/A' && cepData.location.coordinates.longitude !== 'N/A') {
            finalCoordinates = {
              latitude: cepData.location.coordinates.latitude,
              longitude: cepData.location.coordinates.longitude
            };
          }
        }

        // Se ainda não tem coordenadas, tenta buscar pela cidade
        if (!finalCoordinates && cepData.city && cepData.state) {
          try {
            const cityCoordinates = await GeocodingService.geocodeByAddress(`${cepData.city}, ${cepData.state}`);
            if (cityCoordinates) {
              finalCoordinates = cityCoordinates;
              setIsFallbackCoordinates(true);
            }
          } catch (error) {
            console.log('Não foi possível obter coordenadas da cidade');
          }
        }

        setFormData((prev: any) => ({
          ...prev,
          endereco: cepData.street || '',
          bairro_endereco: cepData.neighborhood || '',
          cidade_endereco: cepData.city || '',
          uf_endereco: cepData.state || '',
          cep_endereco: cep,
          latitude_endereco: finalCoordinates?.latitude || null,
          longitude_endereco: finalCoordinates?.longitude || null,
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };

  const validateStep = (step: number) => {
    const errors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.e_mail && !formData.email) errors.e_mail = 'E-mail é obrigatório';
      if (!formData.perfil && !formData.role) errors.perfil = 'Perfil é obrigatório';
    } else if (step === 2) {
      if (!formData.nome) errors.nome = 'Nome é obrigatório';
      if (!formData.cpf) errors.cpf = 'CPF é obrigatório';
    } else if (step === 3) {
      if (!formData.endereco) errors.endereco = 'Endereço é obrigatório';
      if (!formData.cidade_endereco) errors.cidade_endereco = 'Cidade é obrigatória';
      if (!formData.uf_endereco) errors.uf_endereco = 'UF é obrigatória';
    } else if (step === 4) {
      if (!formData.setor_id) errors.setor_id = 'Setor é obrigatório';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;
    const nextStep = Math.min(currentStep + 1, steps.length);
    setFormData((prev: any) => ({ ...prev, currentStep: nextStep }));
  };

  const handlePrevious = () => {
    const prevStep = Math.max(currentStep - 1, 1);
    setFormData((prev: any) => ({ ...prev, currentStep: prevStep }));
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      setFormData((prev: any) => ({ ...prev, currentStep: 5 }));
      return;
    }
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await onUpdateUser?.();
      } else {
        await onCreateUser?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="e_mail">E-mail *</Label>
              <Input
                id="e_mail"
                value={formData.e_mail || formData.email || ''}
                onChange={(e) => {
                  setField('e_mail', e.target.value);
                  setField('email', e.target.value);
                }}
                placeholder="usuario@dominio.gov.br"
                className={validationErrors.e_mail ? 'border-red-500 focus:border-red-500' : ''}
              />
              {validationErrors.e_mail && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.e_mail}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="perfil">Perfil *</Label>
              <Select
                value={formData.perfil || formData.role || ''}
                onValueChange={(value) => {
                  setField('perfil', value);
                  setField('role', value);
                  // Gerar senha automaticamente baseada no perfil apenas no modo de criação
                  if (!isEditMode) {
                    const senhaAutomatica = value === 'admin' ? 'Admin@123' : 'User@123';
                    setField('senha', senhaAutomatica);
                  }
                }}
              >
                <SelectTrigger className={validationErrors.perfil ? 'border-red-500 focus:border-red-500' : ''}>
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="user">Usuário</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.perfil && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.perfil}</p>
              )}
            </div>
            <div className="col-span-2 space-y-2">
              {!isEditMode ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700">
                    <strong>Senha gerada automaticamente:</strong> {formData.perfil === 'admin' ? 'Admin@123' : formData.perfil === 'user' ? 'User@123' : 'Selecione um perfil para gerar a senha'}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    A senha será gerada automaticamente com base no perfil selecionado.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="senha">Nova Senha (deixe em branco para manter a atual)</Label>
                  <div className="relative">
                    <Input
                      id="senha"
                      type={showPassword ? "text" : "password"}
                      value={formData.senha || ''}
                      onChange={(e) => setField('senha', e.target.value)}
                      placeholder="Digite nova senha ou deixe em branco"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={formData.nome || ''}
                onChange={(e) => setField('nome', e.target.value)}
                placeholder="Nome completo"
                className={validationErrors.nome ? 'border-red-500 focus:border-red-500' : ''}
              />
              {validationErrors.nome && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.nome}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={formData.cpf || ''}
                onChange={(e) => setField('cpf', e.target.value)}
                placeholder="000.000.000-00"
                className={validationErrors.cpf ? 'border-red-500 focus:border-red-500' : ''}
              />
              {validationErrors.cpf && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.cpf}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pis">PIS/PASEP</Label>
              <Input
                id="pis"
                value={formData['pis/pasep'] || ''}
                onChange={(e) => setField('pis/pasep', e.target.value)}
                placeholder="Número do PIS/PASEP"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_nascimento">Data de Nascimento</Label>
              <Input
                id="data_nascimento"
                type="date"
                value={formData.data_nascimento || ''}
                onChange={(e) => setField('data_nascimento', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sexo">Sexo</Label>
              <Select
                value={formData.sexo || ''}
                onValueChange={(value) => setField('sexo', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado_civil">Estado Civil</Label>
              <Select
                value={formData.estado_civil || ''}
                onValueChange={(value) => setField('estado_civil', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                  <SelectItem value="casado">Casado(a)</SelectItem>
                  <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                  <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone || ''}
                onChange={(e) => setField('telefone', e.target.value)}
                placeholder="(63) 0000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pai">Nome do Pai</Label>
              <Input
                id="pai"
                value={formData.pai || ''}
                onChange={(e) => setField('pai', e.target.value)}
                placeholder="Nome completo do pai"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mae">Nome da Mãe</Label>
              <Input
                id="mae"
                value={formData.mae || ''}
                onChange={(e) => setField('mae', e.target.value)}
                placeholder="Nome completo da mãe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rg">RG</Label>
              <Input
                id="rg"
                value={formData.rg || ''}
                onChange={(e) => setField('rg', e.target.value)}
                placeholder="Número do RG"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo_rg">Tipo de RG</Label>
              <Select
                value={formData.tipo_rg || ''}
                onValueChange={(value) => setField('tipo_rg', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RG">RG</SelectItem>
                  <SelectItem value="CNH">CNH</SelectItem>
                  <SelectItem value="CTPS">CTPS</SelectItem>
                  <SelectItem value="PASSAPORTE">Passaporte</SelectItem>
                  <SelectItem value="OUTROS">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgao_expeditor">Órgão Expeditor</Label>
              <Input
                id="orgao_expeditor"
                value={formData.orgao_expeditor || ''}
                onChange={(e) => setField('orgao_expeditor', e.target.value)}
                placeholder="Ex: SSP, DETRAN, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uf_rg">UF do RG</Label>
              <Select
                value={formData.uf_rg || ''}
                onValueChange={(value) => setField('uf_rg', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a UF" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TO">TO</SelectItem>
                  <SelectItem value="AC">AC</SelectItem>
                  <SelectItem value="AL">AL</SelectItem>
                  <SelectItem value="AP">AP</SelectItem>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="BA">BA</SelectItem>
                  <SelectItem value="CE">CE</SelectItem>
                  <SelectItem value="DF">DF</SelectItem>
                  <SelectItem value="ES">ES</SelectItem>
                  <SelectItem value="GO">GO</SelectItem>
                  <SelectItem value="MA">MA</SelectItem>
                  <SelectItem value="MT">MT</SelectItem>
                  <SelectItem value="MS">MS</SelectItem>
                  <SelectItem value="MG">MG</SelectItem>
                  <SelectItem value="PA">PA</SelectItem>
                  <SelectItem value="PB">PB</SelectItem>
                  <SelectItem value="PR">PR</SelectItem>
                  <SelectItem value="PE">PE</SelectItem>
                  <SelectItem value="PI">PI</SelectItem>
                  <SelectItem value="RJ">RJ</SelectItem>
                  <SelectItem value="RN">RN</SelectItem>
                  <SelectItem value="RS">RS</SelectItem>
                  <SelectItem value="RO">RO</SelectItem>
                  <SelectItem value="RR">RR</SelectItem>
                  <SelectItem value="SC">SC</SelectItem>
                  <SelectItem value="SP">SP</SelectItem>
                  <SelectItem value="SE">SE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expedicao_rg">Data de Expedição do RG</Label>
              <Input
                id="expedicao_rg"
                type="date"
                value={formData.expedicao_rg || ''}
                onChange={(e) => setField('expedicao_rg', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidade_nascimento">Cidade de Nascimento</Label>
              <Input
                id="cidade_nascimento"
                value={formData.cidade_nascimento || ''}
                onChange={(e) => setField('cidade_nascimento', e.target.value)}
                placeholder="Cidade onde nasceu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uf_nascimento">UF de Nascimento</Label>
              <Select
                value={formData.uf_nascimento || ''}
                onValueChange={(value) => setField('uf_nascimento', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a UF" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TO">TO</SelectItem>
                  <SelectItem value="AC">AC</SelectItem>
                  <SelectItem value="AL">AL</SelectItem>
                  <SelectItem value="AP">AP</SelectItem>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="BA">BA</SelectItem>
                  <SelectItem value="CE">CE</SelectItem>
                  <SelectItem value="DF">DF</SelectItem>
                  <SelectItem value="ES">ES</SelectItem>
                  <SelectItem value="GO">GO</SelectItem>
                  <SelectItem value="MA">MA</SelectItem>
                  <SelectItem value="MT">MT</SelectItem>
                  <SelectItem value="MS">MS</SelectItem>
                  <SelectItem value="MG">MG</SelectItem>
                  <SelectItem value="PA">PA</SelectItem>
                  <SelectItem value="PB">PB</SelectItem>
                  <SelectItem value="PR">PR</SelectItem>
                  <SelectItem value="PE">PE</SelectItem>
                  <SelectItem value="PI">PI</SelectItem>
                  <SelectItem value="RJ">RJ</SelectItem>
                  <SelectItem value="RN">RN</SelectItem>
                  <SelectItem value="RS">RS</SelectItem>
                  <SelectItem value="RO">RO</SelectItem>
                  <SelectItem value="RR">RR</SelectItem>
                  <SelectItem value="SC">SC</SelectItem>
                  <SelectItem value="SP">SP</SelectItem>
                  <SelectItem value="SE">SE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo_sanguineo">Tipo Sanguíneo</Label>
              <Select
                value={formData.tipo_sanguineo || ''}
                onValueChange={(value) => setField('tipo_sanguineo', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="raca_cor">Raça/Cor</Label>
              <Select
                value={formData.raca_cor || ''}
                onValueChange={(value) => setField('raca_cor', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRANCA">Branca</SelectItem>
                  <SelectItem value="PRETA">Preta</SelectItem>
                  <SelectItem value="PARDA">Parda</SelectItem>
                  <SelectItem value="AMARELA">Amarela</SelectItem>
                  <SelectItem value="INDIGENA">Indígena</SelectItem>
                  <SelectItem value="NAO_DECLARADO">Não declarado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pne">Pessoa com Necessidades Especiais (PNE)</Label>
              <Select
                value={formData.pne || ''}
                onValueChange={(value) => setField('pne', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIM">Sim</SelectItem>
                  <SelectItem value="NAO">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna esquerda - Inputs do endereço */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cep_endereco">CEP</Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="cep_endereco"
                      value={formData.cep_endereco || ''}
                      onChange={(e) => setField('cep_endereco', e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    {cepLoading && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>
                  <Button type="button" variant="outline" onClick={() => setManualAddressEdit(prev => !prev)}>
                    {manualAddressEdit ? 'Editar via CEP' : 'Editar endereço'}
                  </Button>
                </div>
                {cepError && (
                  <p className="text-sm text-red-500">{cepError}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endereco">Logradouro</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco || ''}
                    onChange={(e) => setField('endereco', e.target.value)}
                    disabled={!manualAddressEdit && !!formData.endereco && formData.cep_endereco}
                    className={!manualAddressEdit && !!formData.endereco && formData.cep_endereco ? "bg-gray-100" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero_endereco">Número</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="numero_endereco"
                      value={formData.semNumero ? "sem número" : formData.numero_endereco}
                      onChange={(e) => setField('numero_endereco', e.target.value)}
                      disabled={formData.semNumero}
                      className={formData.semNumero ? "bg-gray-100" : ""}
                      placeholder="123"
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="sem-numero"
                        checked={formData.semNumero || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setField('semNumero', checked);
                          setField('numero_endereco', checked ? "sem número" : "");
                        }}
                        className="rounded"
                      />
                      <Label htmlFor="sem-numero" className="text-sm">S/N</Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="complemento_endereco">Complemento</Label>
                  <Input
                    id="complemento_endereco"
                    value={formData.complemento_endereco || ''}
                    onChange={(e) => setField('complemento_endereco', e.target.value)}
                    placeholder="Sala, Andar, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bairro_endereco">Bairro</Label>
                  <Input
                    id="bairro_endereco"
                    value={formData.bairro_endereco || ''}
                    onChange={(e) => setField('bairro_endereco', e.target.value)}
                    disabled={!manualAddressEdit && !!formData.bairro_endereco && formData.cep_endereco}
                    className={!manualAddressEdit && !!formData.bairro_endereco && formData.cep_endereco ? "bg-gray-100" : ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidade_endereco">Cidade</Label>
                  <Input
                    id="cidade_endereco"
                    value={formData.cidade_endereco || ''}
                    onChange={(e) => setField('cidade_endereco', e.target.value)}
                    disabled={!!formData.cidade_endereco && formData.cep_endereco}
                    className={!!formData.cidade_endereco && formData.cep_endereco ? "bg-gray-100" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uf_endereco">Estado</Label>
                  <Input
                    id="uf_endereco"
                    value={formData.uf_endereco || ''}
                    onChange={(e) => setField('uf_endereco', e.target.value)}
                    maxLength={2}
                    placeholder="Ex: SC"
                    disabled={!!formData.uf_endereco && formData.cep_endereco}
                    className={!!formData.uf_endereco && formData.cep_endereco ? "bg-gray-100" : ""}
                  />
                </div>
              </div>
            </div>

            {/* Coluna direita - Mapa do endereço */}
            <div className="flex flex-col space-y-2 min-w-0">
              <MapaUsuario 
                cep={formData.cep_endereco}
                className="w-full"
                onCoordinatesChange={(coordinates) => {
                  setFormData(prev => ({
                    ...prev,
                    latitude_endereco: coordinates.lat,
                    longitude_endereco: coordinates.lng
                  }));
                }}
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="grid grid-cols-2 gap-6">
            {/* Coluna esquerda - Input da lotação */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="setor_id">Lotação *</Label>
                <Popover open={setorComboboxOpen} onOpenChange={setSetorComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={setorComboboxOpen}
                      className={`w-full justify-between ${validationErrors.setor_id ? 'border-red-500 focus:border-red-500' : ''}`}
                    >
                      {formData.setor_id
                        ? (() => {
                            const setor = (setores || []).find((s: any) => String(s.ID ?? s.id) === String(formData.setor_id));
                            return setor ? (setor.NOME_SETOR || setor.nome_setor || setor.nome || 'Lotação') : 'Selecione a lotação';
                          })()
                        : 'Selecione a lotação'
                      }
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Pesquisar lotação..." />
                      <CommandList>
                        <CommandEmpty>Nenhuma lotação encontrada.</CommandEmpty>
                        <CommandGroup>
                          {(setores || []).filter((s: any) => s && (s.ID || s.id)).map((s: any) => (
                            <CommandItem
                              key={String(s.ID ?? s.id)}
                              value={s.NOME_SETOR || s.nome_setor || s.nome || 'Lotação'}
                              onSelect={() => {
                                setField('setor_id', String(s.ID ?? s.id));
                                setSetorComboboxOpen(false);
                              }}
                            >
                              {s.NOME_SETOR || s.nome_setor || s.nome || 'Lotação'}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {validationErrors.setor_id && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.setor_id}</p>
                )}
              </div>
            </div>

            {/* Coluna direita - Mapa da lotação selecionada */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-muted-foreground">Mapa da Lotação Selecionada</div>
                <Button variant="outline" size="sm" onClick={() => setMapaExpanded((v) => !v)}>
                  {mapaExpanded ? 'Ocultar' : 'Exibir'}
                </Button>
              </div>
              {selectedSetor && mapaExpanded ? (
                <div className="w-full h-[400px] rounded-lg border overflow-hidden">
                  <MapaSetor
                    cep={selectedSetor.CEP || selectedSetor.cep || '77066-014'}
                    latitude={selectedSetor.LATITUDE || selectedSetor.latitude || null}
                    longitude={selectedSetor.LONGITUDE || selectedSetor.longitude || null}
                    allowSelection={false}
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-full h-80 border rounded-lg bg-gray-50 flex items-center justify-center">
                  <p className="text-sm text-gray-500 italic text-center px-4">
                    Selecione uma lotação para visualizar sua localização no mapa.
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="matricula">Matrícula</Label>
              <Input
                id="matricula"
                value={formData.matricula || ''}
                onChange={(e) => setField('matricula', e.target.value)}
                placeholder="Número funcional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vinculo_funcional">Vínculo Funcional</Label>
              <Input
                id="vinculo_funcional"
                value={formData.vinculo_funcional || ''}
                onChange={(e) => setField('vinculo_funcional', e.target.value)}
                placeholder="Ex: Efetivo, Comissionado, Terceirizado"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo_vinculo">Tipo de Vínculo</Label>
              <Select
                value={formData.tipo_vinculo || ''}
                onValueChange={(value) => setField('tipo_vinculo', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de vínculo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EFETIVO">Efetivo</SelectItem>
                  <SelectItem value="COMISSIONADO">Comissionado</SelectItem>
                  <SelectItem value="TERCEIRIZADO">Terceirizado</SelectItem>
                  <SelectItem value="ESTAGIARIO">Estagiário</SelectItem>
                  <SelectItem value="TEMPORARIO">Temporário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={formData.categoria || ''}
                onValueChange={(value) => setField('categoria', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SERVIDOR">Servidor</SelectItem>
                  <SelectItem value="EMPREGADO">Empregado</SelectItem>
                  <SelectItem value="MILITAR">Militar</SelectItem>
                  <SelectItem value="TERCEIRIZADO">Terceirizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="regime_juridico">Regime Jurídico</Label>
              <Select
                value={formData.regime_juridico || ''}
                onValueChange={(value) => setField('regime_juridico', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o regime jurídico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ESTATUTARIO">Estatutário</SelectItem>
                  <SelectItem value="CLT">CLT</SelectItem>
                  <SelectItem value="MILITAR">Militar</SelectItem>
                  <SelectItem value="TEMPORARIO">Temporário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="regime_previdenciario">Regime Previdenciário</Label>
              <Select
                value={formData.regime_previdenciario || ''}
                onValueChange={(value) => setField('regime_previdenciario', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o regime previdenciário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RPPS">RPPS - Regime Próprio</SelectItem>
                  <SelectItem value="RGPS">RGPS - Regime Geral</SelectItem>
                  <SelectItem value="MILITAR">Militar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo_evento">Tipo de Evento</Label>
              <Select
                value={formData.tipo_evento || ''}
                onValueChange={(value) => setField('tipo_evento', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMISSAO">Admissão</SelectItem>
                  <SelectItem value="NOMEACAO">Nomeação</SelectItem>
                  <SelectItem value="CONTRATACAO">Contratação</SelectItem>
                  <SelectItem value="DESIGNACAO">Designação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                value={formData.cargo || ''}
                onChange={(e) => setField('cargo', e.target.value)}
                placeholder="Cargo ocupado"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo_cargo">Código do Cargo</Label>
              <Input
                id="codigo_cargo"
                value={formData.codigo_cargo || ''}
                onChange={(e) => setField('codigo_cargo', e.target.value)}
                placeholder="Código do cargo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="escolaridade_cargo">Escolaridade do Cargo</Label>
              <Select
                value={formData.escolaridade_cargo || ''}
                onValueChange={(value) => setField('escolaridade_cargo', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a escolaridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FUNDAMENTAL">Ensino Fundamental</SelectItem>
                  <SelectItem value="MEDIO">Ensino Médio</SelectItem>
                  <SelectItem value="TECNICO">Técnico</SelectItem>
                  <SelectItem value="SUPERIOR">Ensino Superior</SelectItem>
                  <SelectItem value="ESPECIALIZACAO">Especialização</SelectItem>
                  <SelectItem value="MESTRADO">Mestrado</SelectItem>
                  <SelectItem value="DOUTORADO">Doutorado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="escolaridade_servidor">Escolaridade do Servidor</Label>
              <Select
                value={formData.escolaridade_servidor || ''}
                onValueChange={(value) => setField('escolaridade_servidor', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a escolaridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FUNDAMENTAL">Ensino Fundamental</SelectItem>
                  <SelectItem value="MEDIO">Ensino Médio</SelectItem>
                  <SelectItem value="TECNICO">Técnico</SelectItem>
                  <SelectItem value="SUPERIOR">Ensino Superior</SelectItem>
                  <SelectItem value="ESPECIALIZACAO">Especialização</SelectItem>
                  <SelectItem value="MESTRADO">Mestrado</SelectItem>
                  <SelectItem value="DOUTORADO">Doutorado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="formacao_profissional_1">Formação Profissional 1</Label>
              <Input
                id="formacao_profissional_1"
                value={formData.formacao_profissional_1 || ''}
                onChange={(e) => setField('formacao_profissional_1', e.target.value)}
                placeholder="Primeira formação profissional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="formacao_profissional_2">Formação Profissional 2</Label>
              <Input
                id="formacao_profissional_2"
                value={formData.formacao_profissional_2 || ''}
                onChange={(e) => setField('formacao_profissional_2', e.target.value)}
                placeholder="Segunda formação profissional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jornada">Jornada de Trabalho</Label>
              <Select
                value={formData.jornada || ''}
                onValueChange={(value) => setField('jornada', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a jornada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20H">20 horas</SelectItem>
                  <SelectItem value="30H">30 horas</SelectItem>
                  <SelectItem value="40H">40 horas</SelectItem>
                  <SelectItem value="44H">44 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nivel_referencia">Nível/Referência</Label>
              <Input
                id="nivel_referencia"
                value={formData.nivel_referencia || ''}
                onChange={(e) => setField('nivel_referencia', e.target.value)}
                placeholder="Nível ou referência do cargo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comissao_funcao">Comissão/Função</Label>
              <Input
                id="comissao_funcao"
                value={formData.comissao_funcao || ''}
                onChange={(e) => setField('comissao_funcao', e.target.value)}
                placeholder="Comissão ou função exercida"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="forma_provimento">Forma de Provimento</Label>
              <Select
                value={formData.forma_provimento || ''}
                onValueChange={(value) => setField('forma_provimento', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de provimento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONCURSO">Concurso Público</SelectItem>
                  <SelectItem value="NOMEACAO">Nomeação</SelectItem>
                  <SelectItem value="CONTRATACAO">Contratação</SelectItem>
                  <SelectItem value="DESIGNACAO">Designação</SelectItem>
                  <SelectItem value="ELEICAO">Eleição</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_ini_comissao">Data Inicial de Comissão</Label>
              <Input
                id="data_ini_comissao"
                type="date"
                value={formData.data_ini_comissao || ''}
                onChange={(e) => setField('data_ini_comissao', e.target.value)}
              />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Revisão dos Dados</h3>
              <p className="text-sm text-gray-600">Verifique todas as informações antes de finalizar o cadastro</p>
            </div>
            
            {/* Seção Acesso */}
             <Card className="border-l-4 border-l-blue-500">
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm flex items-center gap-2 cursor-pointer" onClick={() => setAcessoExpanded(!acessoExpanded)}>
                    <Key className="w-4 h-4 text-blue-600" />
                    Dados de Acesso
                    {acessoExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </CardTitle>
                </CardHeader>
                {acessoExpanded && (
                 <CardContent className="pt-0 text-sm space-y-1">
                   <div><strong>E-mail:</strong> {formData.e_mail || formData.email || 'Não informado'}</div>
                   <div><strong>Perfil:</strong> {formData.perfil === 'admin' ? 'Administrador' : formData.perfil === 'user' ? 'Usuário' : 'Não informado'}</div>
                   <div><strong>Ativo:</strong> {formData.ativo ? 'Sim' : 'Não'}</div>
                 </CardContent>
               )}
             </Card>

             {/* Seção Pessoal */}
             <Card className="border-l-4 border-l-green-500">
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm flex items-center gap-2 cursor-pointer" onClick={() => setPessoalExpanded(!pessoalExpanded)}>
                   <User className="w-4 h-4 text-green-600" />
                   Dados Pessoais e Contatos
                   {pessoalExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                 </CardTitle>
               </CardHeader>
               {pessoalExpanded && (
                 <CardContent className="pt-0 text-sm space-y-1">
                   <div><strong>Nome:</strong> {formData.nome || 'Não informado'}</div>
                   <div><strong>CPF:</strong> {formData.cpf || 'Não informado'}</div>
                   <div><strong>PIS/PASEP:</strong> {formData['pis/pasep'] || 'Não informado'}</div>
                   <div><strong>Data de Nascimento:</strong> {formData.data_nascimento || 'Não informado'}</div>
                   <div><strong>Telefone:</strong> {formData.telefone || 'Não informado'}</div>
                   <div><strong>Celular:</strong> {formData.celular || 'Não informado'}</div>
                 </CardContent>
               )}
             </Card>

             {/* Seção Endereço */}
             <Card className="border-l-4 border-l-purple-500">
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm flex items-center gap-2 cursor-pointer" onClick={() => setEnderecoExpanded(!enderecoExpanded)}>
                   <MapPin className="w-4 h-4 text-purple-600" />
                   Endereço
                   {enderecoExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                 </CardTitle>
               </CardHeader>
               {enderecoExpanded && (
                 <CardContent className="pt-0 text-sm space-y-1">
                   <div><strong>CEP:</strong> {formData.cep || 'Não informado'}</div>
                   <div><strong>Endereço:</strong> {formData.endereco ? `${formData.endereco}, ${formData.numero_endereco || 'S/N'}` : 'Não informado'}</div>
                   <div><strong>Bairro:</strong> {formData.bairro_endereco || 'Não informado'}</div>
                   <div><strong>Cidade:</strong> {formData.cidade_endereco || 'Não informado'}</div>
                   <div><strong>UF:</strong> {formData.uf_endereco || 'Não informado'}</div>
                   <div><strong>Complemento:</strong> {formData.complemento_endereco || 'Não informado'}</div>
                 </CardContent>
               )}
             </Card>

             {/* Seção Setor */}
             <Card className="border-l-4 border-l-orange-500">
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm flex items-center gap-2 cursor-pointer" onClick={() => setSetorExpanded(!setorExpanded)}>
                   <Building2 className="w-4 h-4 text-orange-600" />
                   Setor
                   {setorExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                 </CardTitle>
               </CardHeader>
               {setorExpanded && (
                 <CardContent className="pt-0 text-sm space-y-1">
                   <div><strong>Setor:</strong> {selectedSetor ? (selectedSetor.NOME_SETOR || selectedSetor.nome_setor || selectedSetor.nome) : 'Não informado'}</div>
                   <div><strong>Setor Livre:</strong> {formData.setor_nome_livre || 'Não informado'}</div>
                 </CardContent>
               )}
             </Card>

             {/* Seção Funcionais */}
             <Card className="border-l-4 border-l-red-500">
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm flex items-center gap-2 cursor-pointer" onClick={() => setFuncionaisExpanded(!funcionaisExpanded)}>
                   <FileText className="w-4 h-4 text-red-600" />
                   Dados Funcionais
                   {funcionaisExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                 </CardTitle>
               </CardHeader>
               {funcionaisExpanded && (
                 <CardContent className="pt-0 text-sm space-y-1">
                   <div><strong>Matrícula:</strong> {formData.matricula || 'Não informado'}</div>
                   <div><strong>Vínculo Funcional:</strong> {formData.vinculo_funcional || 'Não informado'}</div>
                   <div><strong>Cargo:</strong> {formData.cargo || 'Não informado'}</div>
                   <div><strong>Código do Cargo:</strong> {formData.codigo_cargo || 'Não informado'}</div>
                   <div><strong>Forma de Provimento:</strong> {formData.forma_provimento || 'Não informado'}</div>
                   <div><strong>Data Inicial de Comissão:</strong> {formData.data_ini_comissao || 'Não informado'}</div>
                 </CardContent>
               )}
             </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Conteúdo da etapa */}
      <Card className="card-govto">
        <CardContent className="p-4">
          {renderStepContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default NovoUsuarioWizard;