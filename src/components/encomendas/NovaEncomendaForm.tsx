import { useState, useEffect, useRef } from "react";
import { User, Package, MapPin, Calendar, FileText, QrCode, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

import { useNotification } from "@/hooks/use-notification";
import NotificationModal from "@/components/ui/notification-modal";
import { api, handleApiError } from "@/lib/api";

interface NovaEncomendaFormProps {
  onSuccess?: () => void;
}

const NovaEncomendaForm = ({ onSuccess }: NovaEncomendaFormProps = {}) => {
  const { notification, isOpen, showError, showSuccess, hideNotification } = useNotification();
  const [formData, setFormData] = useState({
    tipo: "",
    remetente: "",
    remetenteId: null,
    destinatario: "",
    destinatarioId: null,
    setor_destino: "",
    descricao: "",
    observacoes: "",
    urgente: false,
    peso: "",
    dimensoes: "",
    valor_declarado: "",
    setor_origem: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  
  // Estados para busca de usuários
  const [remetenteSuggestions, setRemetenteSuggestions] = useState<any[]>([]);
  const [destinatarioSuggestions, setDestinatarioSuggestions] = useState<any[]>([]);
  const [setorSuggestions, setSetorSuggestions] = useState<any[]>([]);
  const [showRemetenteSuggestions, setShowRemetenteSuggestions] = useState(false);
  const [showDestinatarioSuggestions, setShowDestinatarioSuggestions] = useState(false);
  const [showSetorSuggestions, setShowSetorSuggestions] = useState(false);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isSearchingSetores, setIsSearchingSetores] = useState(false);
  
  // Refs para controle de foco
  const remetenteRef = useRef<HTMLInputElement>(null);
  const destinatarioRef = useRef<HTMLInputElement>(null);
  const setorRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.tipo || !formData.remetente || !formData.destinatario || !formData.setor_destino || !formData.descricao) {
      showError("Erro de validação", "Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const novaEncomenda = {
        tipo: formData.tipo,
        remetente: formData.remetente,
        destinatario: formData.destinatario,
        setorOrigem: formData.setor_origem || "Não informado",
        setorDestino: formData.setor_destino,
        descricao: formData.descricao,
        observacoes: formData.observacoes,
        prioridade: formData.urgente ? "alta" : "normal",
        peso: formData.peso ? parseFloat(formData.peso) : undefined,
        dimensoes: formData.dimensoes,
        valorDeclarado: formData.valor_declarado ? parseFloat(formData.valor_declarado) : undefined
      };

      const response = await api.createEncomenda(novaEncomenda);
      const encomendaCriada = response.data.data;
      setGeneratedCode(encomendaCriada.codigo);
      
      showSuccess("Encomenda cadastrada com sucesso!", `Código: ${encomendaCriada.codigo}`);
      
      // Limpar formulário após sucesso
      setFormData({
        tipo: "",
        remetente: "",
        destinatario: "",
        setor_destino: "",
        descricao: "",
        observacoes: "",
        urgente: false,
        peso: "",
        dimensoes: "",
        valor_declarado: "",
        setor_origem: ""
      });
      
      // Chamar callback de sucesso se fornecido
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      showError("Erro ao cadastrar encomenda", handleApiError(error as any));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearForm = () => {
    setFormData({
      tipo: "",
      remetente: "",
      destinatario: "",
      setor_destino: "",
      descricao: "",
      observacoes: "",
      urgente: false,
      peso: "",
      dimensoes: "",
      valor_declarado: "",
      setor_origem: ""
    });
    setGeneratedCode(null);
    
    // Limpar sugestões
    setRemetenteSuggestions([]);
    setDestinatarioSuggestions([]);
    setSetorSuggestions([]);
    setShowRemetenteSuggestions(false);
    setShowDestinatarioSuggestions(false);
    setShowSetorSuggestions(false);
  };

  // Função de debounce para otimizar buscas
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Buscar usuários por nome
  const searchUsers = async (query: string) => {
    if (query.length < 2) return [];
    
    try {
      setIsSearchingUsers(true);
      const response = await api.searchUsersAndSectors(query);
      return response.data.data || [];
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      showError("Erro na busca", handleApiError(error as any));
      return [];
    } finally {
      setIsSearchingUsers(false);
    }
  };

  // Buscar setores por nome
  const searchSetores = async (query: string) => {
    if (query.length < 2) return [];
    
    try {
      setIsSearchingSetores(true);
      const response = await api.searchSetores({ nome: query });
      return response.data.data || [];
    } catch (error) {
      console.error('Erro ao buscar setores:', error);
      showError("Erro na busca", handleApiError(error as any));
      return [];
    } finally {
      setIsSearchingSetores(false);
    }
  };

  // Debounced search functions
  const debouncedSearchUsers = debounce(async (query: string, type: 'remetente' | 'destinatario') => {
    // Usar o helper que já normaliza o retorno (array)
    const users = await searchUsers(query);
    if (type === 'remetente') {
      setRemetenteSuggestions(users || []);
      setShowRemetenteSuggestions(true);
    } else {
      setDestinatarioSuggestions(users || []);
      setShowDestinatarioSuggestions(true);
    }
  }, 300);

  const debouncedSearchSetores = debounce(async (query: string) => {
    const setores = await searchSetores(query);
    setSetorSuggestions(setores);
    setShowSetorSuggestions(true);
  }, 300);

  // Selecionar usuário das sugestões
  const selectUser = (item: any, type: 'remetente' | 'destinatario') => {
    const itemId = item.id || item.ID;
    
    // Verificar se o item selecionado já está sendo usado no outro campo
    const otherType = type === 'remetente' ? 'destinatario' : 'remetente';
    const otherItemId = type === 'remetente' ? formData.destinatarioId : formData.remetenteId;
    
    if (itemId && otherItemId && itemId === otherItemId) {
      showError("Erro de Validação", "O remetente e o destinatário não podem ser a mesma pessoa.");
      return;
    }
    
    let nomeCompleto = item.nome || item.name || 'Nome não informado';
    
    // Se for um setor, usar apenas o nome do setor
    if (item.tipo === 'sector') {
      nomeCompleto = item.nome;
    } else {
      // Se for um usuário, construir nome completo com matrícula
      const matricula = item.NUMERO_FUNCIONAL || item.numero_funcional || item.numeroFuncional || item.matricula || item.MATRICULA;
      const vinculo = item.VINCULO_FUNCIONAL || item.vinculo_funcional;
      
      // Formato: matrícula-vínculo - nome (igual à aba usuários)
      if (matricula && vinculo) {
        nomeCompleto = `${matricula}-${vinculo} - ${nomeCompleto}`;
      } else if (matricula) {
        nomeCompleto = `${matricula} - ${nomeCompleto}`;
      }
    }
    
    // Para o setor, usar apenas o nome do setor (sem endereço)
    const nomeSetor = item.setor || item.SETOR || '';
    
    setFormData(prev => ({
      ...prev,
      [type]: nomeCompleto,
      [`${type}Id`]: itemId,
      ...(type === 'remetente' && nomeSetor ? { setor_origem: nomeSetor } : {}),
      ...(type === 'destinatario' && nomeSetor ? { setor_destino: nomeSetor } : {})
    }));
    
    if (type === 'remetente') {
      setShowRemetenteSuggestions(false);
      setRemetenteSuggestions([]);
    } else {
      setShowDestinatarioSuggestions(false);
      setDestinatarioSuggestions([]);
    }
  };

  // Selecionar setor das sugestões
  const selectSetor = (setor: any) => {
    const setorCompleto = `${setor.orgao} - ${setor.nome}`;
    setFormData(prev => ({
      ...prev,
      setor_destino: setorCompleto
    }));
    setShowSetorSuggestions(false);
    setSetorSuggestions([]);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Trigger search for user fields
    if (field === 'remetente' && typeof value === 'string') {
      if (value.length >= 2) {
        debouncedSearchUsers(value, 'remetente');
      } else {
        setShowRemetenteSuggestions(false);
        setRemetenteSuggestions([]);
      }
    }
    
    if (field === 'destinatario' && typeof value === 'string') {
      if (value.length >= 2) {
        debouncedSearchUsers(value, 'destinatario');
      } else {
        setShowDestinatarioSuggestions(false);
        setDestinatarioSuggestions([]);
      }
    }
  };

  // Handle setor destino search (for input version)
  const handleSetorSearch = (value: string) => {
    setFormData(prev => ({ ...prev, setor_destino: value }));
    if (value.length >= 2) {
      debouncedSearchSetores(value);
    } else {
      setShowSetorSuggestions(false);
      setSetorSuggestions([]);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (remetenteRef.current && !remetenteRef.current.contains(event.target as Node)) {
        setShowRemetenteSuggestions(false);
      }
      if (destinatarioRef.current && !destinatarioRef.current.contains(event.target as Node)) {
        setShowDestinatarioSuggestions(false);
      }
      if (setorRef.current && !setorRef.current.contains(event.target as Node)) {
        setShowSetorSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Formulário Principal */}
      <div className="lg:col-span-2">
        <Card className="card-govto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Cadastrar Nova Encomenda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo de Encomenda */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Encomenda *</Label>
                  <Select 
                    value={formData.tipo} 
                    onValueChange={(value) => handleInputChange("tipo", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="malote_interno">Malote Interno</SelectItem>
                      <SelectItem value="malote_externo">Malote Externo</SelectItem>
                      <SelectItem value="documento">Documento</SelectItem>
                      <SelectItem value="equipamento">Equipamento</SelectItem>
                      <SelectItem value="material">Material de Escritório</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox 
                    id="urgente" 
                    checked={formData.urgente}
                    onCheckedChange={(checked) => handleInputChange("urgente", checked)}
                  />
                  <Label htmlFor="urgente" className="text-sm">
                    Encomenda Urgente
                  </Label>
                </div>
              </div>

              {/* Dados do Remetente */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary font-heading flex items-center gap-2">
            <User className="w-3 h-3" />
                  Dados do Remetente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 relative" ref={remetenteRef}>
                    <Label htmlFor="remetente">Nome do Remetente *</Label>
                    <div className="relative">
                      <Input
                        id="remetente"
                        value={formData.remetente}
                        onChange={(e) => handleInputChange("remetente", e.target.value)}
                        placeholder="Digite o nome do servidor..."
                        className="pr-8"
                      />
                      {isSearchingUsers && (
                        <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                      )}
                    </div>
                    {showRemetenteSuggestions && remetenteSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {remetenteSuggestions.map((item, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => selectUser(item, 'remetente')}
                          >
                            <div className="font-medium text-sm flex items-center gap-2">
                              {item.tipo === 'sector' ? (
                                <>
                                  <MapPin className="w-3 h-3 text-green-600" />
                                  {item.nome}
                                </>
                              ) : (
                                <>
                                  <User className="w-3 h-3 text-blue-600" />
                                  {item.nome}
                                </>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.tipo === 'sector' ? (
                                `Setor • ${item.setor}`
                              ) : (
                                `${(item.numero_funcional ?? item.numeroFuncional) ? `${item.numero_funcional ?? item.numeroFuncional} • ` : ''}${item.orgao || ''} - ${item.setor || ''}`
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="setor_origem">Setor de Origem</Label>
                    <Input
                      id="setor_origem"
                      value={formData.setor_origem}
                      onChange={(e) => handleInputChange("setor_origem", e.target.value)}
                      placeholder="Preenchido automaticamente"
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Dados do Destinatário */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary font-heading flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Dados do Destinatário
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 relative" ref={destinatarioRef}>
                    <Label htmlFor="destinatario">Nome do Destinatário *</Label>
                    <div className="relative">
                      <Input
                        id="destinatario"
                        value={formData.destinatario}
                        onChange={(e) => handleInputChange("destinatario", e.target.value)}
                        placeholder="Digite o nome do servidor..."
                        className="pr-8"
                      />
                      {isSearchingUsers && (
                        <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                      )}
                    </div>
                    {showDestinatarioSuggestions && destinatarioSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {destinatarioSuggestions.map((item, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => selectUser(item, 'destinatario')}
                          >
                            <div className="font-medium text-sm flex items-center gap-2">
                              {item.tipo === 'sector' ? (
                                <>
                                  <MapPin className="w-3 h-3 text-green-600" />
                                  {item.nome}
                                </>
                              ) : (
                                <>
                                  <User className="w-3 h-3 text-blue-600" />
                                  {item.nome}
                                </>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.tipo === 'sector' ? (
                                `Setor • ${item.setor}`
                              ) : (
                                `${(item.numero_funcional ?? item.numeroFuncional) ? `${item.numero_funcional ?? item.numeroFuncional} • ` : ''}${item.orgao || ''} - ${item.setor || ''}`
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 relative" ref={setorRef}>
                    <Label htmlFor="setor_destino">Setor de Destino *</Label>
                    <div className="relative">
                      <Input
                        id="setor_destino"
                        value={formData.setor_destino}
                        onChange={(e) => handleSetorSearch(e.target.value)}
                        placeholder="Digite o nome do setor..."
                        className="pr-8"
                      />
                      {isSearchingSetores && (
                        <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                      )}
                    </div>
                    {showSetorSuggestions && setorSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {setorSuggestions.map((setor, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => selectSetor(setor)}
                          >
                            <div className="font-medium text-sm">{setor.nome}</div>
                            <div className="text-xs text-gray-500">
                              {setor.orgao} • {setor.municipio_lotacao}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Descrição da Encomenda */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary font-heading flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Detalhes da Encomenda
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição do Conteúdo *</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => handleInputChange("descricao", e.target.value)}
                      placeholder="Descreva detalhadamente o conteúdo da encomenda..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="peso">Peso (kg)</Label>
                      <Input
                        id="peso"
                        type="number"
                        step="0.1"
                        value={formData.peso}
                        onChange={(e) => handleInputChange("peso", e.target.value)}
                        placeholder="0.0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dimensoes">Dimensões (cm)</Label>
                      <Input
                        id="dimensoes"
                        value={formData.dimensoes}
                        onChange={(e) => handleInputChange("dimensoes", e.target.value)}
                        placeholder="C x L x A"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valor">Valor Declarado (R$)</Label>
                      <Input
                        id="valor"
                        type="number"
                        step="0.01"
                        value={formData.valor_declarado}
                        onChange={(e) => handleInputChange("valor_declarado", e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => handleInputChange("observacoes", e.target.value)}
                      placeholder="Informações adicionais, instruções especiais..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-4 pt-6">
                <Button type="submit" className="btn-govto-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Cadastrando..." : "Cadastrar Encomenda"}
                </Button>
                <Button type="button" variant="outline" onClick={handleClearForm}>
                  Limpar Formulário
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Painel Lateral */}
      <div className="space-y-6">
        {/* Protocolo Gerado */}
        <Card className="card-govto">
          <CardHeader>
            <CardTitle className="text-sm">Protocolo Gerado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-3">
              <div className="text-2xl font-bold text-primary font-heading">
                {generatedCode || "EN-XXXX-XXXXXX"}
              </div>
              <div className="flex justify-center">
                <QrCode className="w-16 h-16 text-foreground-muted" />
              </div>
              <p className="text-xs text-foreground-muted">
                {generatedCode ? "Código gerado com sucesso!" : "Código será gerado após cadastro"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Informações */}
        <Card className="card-govto">
          <CardHeader>
            <CardTitle className="text-sm">Informações Importantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-accent-orange rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-foreground-secondary">
                Encomendas urgentes têm prioridade na tramitação
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-accent-green rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-foreground-secondary">
                O código de rastreamento será gerado automaticamente
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-foreground-secondary">
                Comprovante de recebimento será enviado por email
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tipos de Encomenda */}
        <Card className="card-govto">
          <CardHeader>
            <CardTitle className="text-sm">Tipos de Encomenda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Badge variant="outline" className="w-full justify-start">
              Malote Interno
            </Badge>
            <Badge variant="outline" className="w-full justify-start">
              Malote Externo
            </Badge>
            <Badge variant="outline" className="w-full justify-start">
              Documento
            </Badge>
            <Badge variant="outline" className="w-full justify-start">
              Equipamento
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Notificação */}
      {notification && (
        <NotificationModal
          isOpen={isOpen}
          onClose={hideNotification}
          title={notification.title}
          description={notification.description}
          variant={notification.variant}
        />
      )}
    </div>
  );
};

export default NovaEncomendaForm;