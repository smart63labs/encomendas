import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { User, Package, MapPin, FileText, QrCode, Search, ChevronLeft, ChevronRight, Printer, Download, Share2, Check, Trash2, Info, ChevronDown, ChevronUp, ArrowDownLeft } from 'lucide-react';
import MapaWizard from './MapaWizard';
import SelectLacreMaloteModal from './SelectLacreMaloteModal';
import EtiquetaEncomenda from './EtiquetaEncomenda';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNotification } from '@/hooks/use-notification';
import NotificationModal from '@/components/ui/notification-modal';
import { api, handleApiError } from '@/lib/api';
import { getEnderecoSetor } from '@/services/setores.service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface NovaEncomendaWizardProps {
  onSuccess?: () => void;
  currentStep?: number;
  onStepChange?: (step: number) => void;
}

const NovaEncomendaWizard = forwardRef<any, NovaEncomendaWizardProps>((props, ref) => {
  const { onSuccess, currentStep: externalCurrentStep, onStepChange } = props;
  const { notification, isOpen, showError, showSuccess, showInfo, showWarning, hideNotification } = useNotification();

  const initialFormData = {
    tipo: '',
    remetente: '',
    remetenteId: null,
    destinatario: '',
    destinatarioId: null,
    setor_destino: '',
    descricao: '',
    observacoes: '',
    urgente: false,
    peso: '',
    dimensoes: '',
    valor_declarado: '',
    setor_origem: '',
    codigoLacremalote: '',
    lacreId: null,
    maloteId: null,
    maloteNumero: '',
    // Dados de matrícula e vínculo
    remetenteMatricula: '',
    remetenteVinculo: '',
    destinatarioMatricula: '',
    destinatarioVinculo: '',
    // Campo AR para correspondência
    avisoRecebimento: ''
  };

  // Usar currentStep externo se fornecido, senão usar interno
  const currentStep = externalCurrentStep || 1;
  const setCurrentStep = onStepChange || (() => { });

  const [formData, setFormData] = useState(initialFormData);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [encomendaData, setEncomendaData] = useState<any>(null);

  const [searchingRemetente, setSearchingRemetente] = useState(false);
  const [searchingDestinatario, setSearchingDestinatario] = useState(false);
  const [suggestedRemetentes, setSuggestedRemetentes] = useState<any[]>([]);
  const [suggestedDestinatarios, setSuggestedDestinatarios] = useState<any[]>([]);
  const [setorOrigemData, setSetorOrigemData] = useState<any>(null);
  const [setorDestinoData, setSetorDestinoData] = useState<any>(null);
  const [loadingSetorOrigem, setLoadingSetorOrigem] = useState(false);
  const [loadingSetorDestino, setLoadingSetorDestino] = useState(false);
  const [mapaExpanded, setMapaExpanded] = useState(false);
  const [selectModalOpen, setSelectModalOpen] = useState(false);

  // Estados para endereços dinâmicos
  const [enderecoSetorOrigem, setEnderecoSetorOrigem] = useState<string>('Carregando endereço...');
  const [enderecoSetorDestino, setEnderecoSetorDestino] = useState<string>('Carregando endereço...');

  const remetenteRef = useRef<HTMLDivElement>(null);
  const destinatarioRef = useRef<HTMLDivElement>(null);
  const etiquetaRef = useRef<HTMLDivElement>(null);

  // Usuário logado para aplicar regra de setor no remetente
  const { user } = useAuth();

  // Expor funções para o componente pai
  useImperativeHandle(ref, () => ({
    handleNext,
    handlePrevious
  }));

  const steps = [
    { id: 1, title: 'Tipo de Encomenda', icon: Package },
    { id: 2, title: 'Remetente e Destinatario', icon: User },
    { id: 3, title: 'Dados da Encomenda', icon: FileText },
    { id: 4, title: 'Protocolo Gerado', icon: QrCode }
  ];

  const progress = (currentStep / steps.length) * 100;

  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) return { data: [], message: null };

    try {
      const response = await api.searchUsersAndSectors(query);
      return {
        data: response.data.data || [],
        message: response.data.message || null,
        sectorsWithoutUsers: response.data.sectorsWithoutUsers || null
      };
    } catch (error) {
      console.error('Erro ao buscar usuarios e setores:', error);
      showError("Erro na busca", "Não foi possível buscar usuários e setores. Tente novamente.");
      return { data: [], message: null };
    }
  };

  const debouncedSearchUsers = debounce(async (query: string, type: 'remetente' | 'destinatario') => {
    console.log('🔍 debouncedSearchUsers executado:', { query, type, queryLength: query.length });

    // Validação adicional para evitar chamadas desnecessárias
    if (!query || query.length < 2) {
      console.log('🔍 Query inválida ou muito curta, cancelando busca');
      if (type === 'remetente') {
        setSuggestedRemetentes([]);
        setSearchingRemetente(false);
      } else {
        setSuggestedDestinatarios([]);
        setSearchingDestinatario(false);
      }
      return;
    }

    try {
      console.log('🔍 Chamando searchUsersAndSectors...');
      const searchResult = await api.searchUsersAndSectors(query);

      // Verificar se a resposta tem a estrutura esperada
      if (!searchResult || !searchResult.data) {
        console.warn('🔍 Resposta da API inválida:', searchResult);
        if (type === 'remetente') {
          setSuggestedRemetentes([]);
          setSearchingRemetente(false);
        } else {
          setSuggestedDestinatarios([]);
          setSearchingDestinatario(false);
        }
        return;
      }

      const results = searchResult.data.data || searchResult.data;

      console.log('🔍 Resultados recebidos:', { results, count: results?.length });

      // Verificar se results é um array válido
      if (!Array.isArray(results)) {
        console.warn('🔍 Resultados não são um array válido:', results);
        if (type === 'remetente') {
          setSuggestedRemetentes([]);
          setSearchingRemetente(false);
        } else {
          setSuggestedDestinatarios([]);
          setSearchingDestinatario(false);
        }
        return;
      }

      // Remove duplicatas baseado no ID e tipo
      const uniqueResults = results.filter((item, index, self) =>
        index === self.findIndex(i => i.id === item.id && i.tipo === item.tipo)
      );

      // Regra: para remetente, exibir APENAS usuários do mesmo setor do usuário logado
      const normalize = (s: any) => (s == null ? '' : String(s).toLowerCase().trim());
      const loggedSetorId = (user as any)?.setor_id ?? (user as any)?.setorId ?? null;
      const loggedSetorNome = normalize((user as any)?.setor ?? (user as any)?.NOME_SETOR ?? '');
      let filteredResults = uniqueResults;
      if (type === 'remetente' && (loggedSetorId != null || loggedSetorNome)) {
        filteredResults = uniqueResults.filter((item: any) => {
          // Apenas usuários
          if (item?.tipo !== 'user') return false;
          const itemSetorId = item?.setor_id ?? item?.setorId ?? item?.SETOR_ID ?? null;
          const itemSetorNome = normalize(item?.setor ?? item?.setor_nome ?? item?.NOME_SETOR ?? '');
          const idMatch = loggedSetorId != null && itemSetorId != null && String(itemSetorId) === String(loggedSetorId);
          const nomeMatch = !!loggedSetorNome && !!itemSetorNome && loggedSetorNome === itemSetorNome;
          return idMatch || nomeMatch;
        });
      }

      console.log('🔍 Resultados únicos:', { uniqueResults: uniqueResults.length });

      if (type === 'remetente') {
        console.log('🔍 Definindo sugestões para remetente');
        setSuggestedRemetentes(filteredResults);
        setSearchingRemetente(false);
      } else {
        console.log('🔍 Definindo sugestões para destinatario');
        setSuggestedDestinatarios(uniqueResults);
        setSearchingDestinatario(false);
      }
    } catch (error) {
      console.error('🔍 Erro em debouncedSearchUsers:', error);

      // Tratamento específico para diferentes tipos de erro
      const errorMessage = handleApiError(error as any);

      // Não mostrar notificação para erros de validação (query muito curta)
      if (!errorMessage.includes('validação') && !errorMessage.includes('muito curta')) {
        showError("Erro na busca", `Não foi possível buscar usuários: ${errorMessage}`);
      }

      if (type === 'remetente') {
        setSuggestedRemetentes([]);
        setSearchingRemetente(false);
      } else {
        setSuggestedDestinatarios([]);
        setSearchingDestinatario(false);
      }
    }
  }, 300);

  const buscarDadosSetor = async (setorId: number, type: 'origem' | 'destino') => {
    try {
      if (type === 'origem') {
        setLoadingSetorOrigem(true);
      } else {
        setLoadingSetorDestino(true);
      }

      const response = await api.getSetorById(setorId);
      const setorData = response.data.data;

      if (type === 'origem') {
        setSetorOrigemData(setorData);
      } else {
        setSetorDestinoData(setorData);
      }

      // Para o input, mostrar apenas o nome do setor (sem endereço)
      const nomeSetor = setorData.NOME_SETOR || 'Setor não informado';

      // Atualizar o formData apenas com o nome do setor no input
      setFormData(prev => ({
        ...prev,
        ...(type === 'origem' ? { setor_origem: nomeSetor } : { setor_destino: nomeSetor })
      }));

      return setorData;
    } catch (error) {
      console.error('Erro ao buscar dados do setor:', error);
      showError("Erro ao buscar setor", "Não foi possível carregar os dados do setor.");
      return null;
    } finally {
      if (type === 'origem') {
        setLoadingSetorOrigem(false);
      } else {
        setLoadingSetorDestino(false);
      }
    }
  };

  // Preencher automaticamente Remetente e Setor de Origem com o usuário logado
  useEffect(() => {
    if (!user) return;

    const nomeUsuario = (user as any)?.nome || (user as any)?.name || '';
    const matricula = (user as any)?.matricula || (user as any)?.NUMERO_FUNCIONAL || '';
    const vinculo = (user as any)?.vinculo_funcional || (user as any)?.VINCULO_FUNCIONAL || '';
    const setorId = (user as any)?.setor_id ?? (user as any)?.setorId ?? null;
    const setorNome = (user as any)?.setor || '';

    setFormData(prev => ({
      ...prev,
      remetente: nomeUsuario || prev.remetente,
      remetenteId: (user as any)?.id ?? prev.remetenteId,
      remetenteMatricula: matricula || prev.remetenteMatricula,
      remetenteVinculo: vinculo || prev.remetenteVinculo,
      ...(setorId == null && setorNome ? { setor_origem: setorNome } : {})
    }));

    // Resolver dados completos do setor de origem quando houver ID
    if (setorId != null) {
      buscarDadosSetor(Number(setorId), 'origem');
    }
  }, [user]);

  const selectUser = async (item: any, type: 'remetente' | 'destinatario') => {
    const itemId = item.id || item.ID;

    // Verificar se o item selecionado já está sendo usado no outro campo
    const otherType = type === 'remetente' ? 'destinatario' : 'remetente';
    const otherItemId = type === 'remetente' ? formData.destinatarioId : formData.remetenteId;

    if (itemId && otherItemId && itemId === otherItemId) {
      showError("Erro de Validação", "O remetente e o destinatário não podem ser a mesma pessoa ou setor.");
      return;
    }

    // Se for um setor, tratar diferente de usuário
    if (item.tipo === 'sector') {
      const nomeSetor = item.NOME_SETOR || item.nome_setor || 'Setor não informado';
      const codigoSetor = item.CODIGO_SETOR || item.codigo_setor || '';
      const orgao = item.ORGAO || item.orgao || '';

      // Formato para setor: código - nome (órgão)
      let displayName = nomeSetor;
      if (codigoSetor && orgao) {
        displayName = `${codigoSetor} - ${nomeSetor} (${orgao})`;
      } else if (codigoSetor) {
        displayName = `${codigoSetor} - ${nomeSetor}`;
      }

      setFormData(prev => ({
        ...prev,
        [type]: displayName,
        [`${type}Id`]: itemId,
        ...(type === 'remetente' ? {
          setor_origem: nomeSetor,
          remetenteMatricula: '',
          remetenteVinculo: ''
        } : {}),
        ...(type === 'destinatario' ? {
          setor_destino: nomeSetor,
          destinatarioMatricula: '',
          destinatarioVinculo: ''
        } : {})
      }));

      // Buscar dados completos do setor
      const tipoSetor = type === 'remetente' ? 'origem' : 'destino';
      await buscarDadosSetor(itemId, tipoSetor);
    } else {
      // Tratamento para usuário (código original)
      const matricula = item.NUMERO_FUNCIONAL || item.numero_funcional || item.numeroFuncional || item.matricula || item.MATRICULA;
      const vinculo = item.VINCULO_FUNCIONAL || item.vinculo_funcional;
      let nomeCompleto = item.nome || item.name || 'Nome não informado';

      // Não formatar o nome aqui - deixar para o componente EtiquetaEncomenda fazer a formatação
      // Isso evita duplicação de matrícula na etiqueta

      // Para o setor, buscar dados completos mas não incluir endereço no input
      let setorCompleto = item.setor || 'Setor não informado';

      setFormData(prev => ({
        ...prev,
        [type]: nomeCompleto,
        [`${type}Id`]: itemId,
        ...(type === 'remetente' ? {
          setor_origem: setorCompleto,
          remetenteMatricula: matricula || '',
          remetenteVinculo: vinculo || ''
        } : {}),
        ...(type === 'destinatario' ? {
          setor_destino: setorCompleto,
          destinatarioMatricula: matricula || '',
          destinatarioVinculo: vinculo || ''
        } : {})
      }));

      // Buscar dados completos do setor se o usuário tiver setorId (com fallback para SETOR_ID)
      const setorIdCandidate = (item as any).setorId || (item as any).setor_id || (item as any).SETOR_ID;
      if (setorIdCandidate) {
        const tipoSetor = type === 'remetente' ? 'origem' : 'destino';
        await buscarDadosSetor(Number(setorIdCandidate), tipoSetor);
      }
    }

    if (type === 'remetente') {
      setSuggestedRemetentes([]);
      setSearchingRemetente(false);
    } else {
      setSuggestedDestinatarios([]);
      setSearchingDestinatario(false);
    }

    if (validationErrors[type]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[type];
        return newErrors;
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    console.log('🔍 handleInputChange chamado:', { field, value, valueType: typeof value, valueLength: typeof value === 'string' ? value.length : 'N/A' });

    setFormData(prev => ({ ...prev, [field]: value }));

    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    if (field === 'remetente' && typeof value === 'string') {
      console.log('🔍 Processando remetente:', { value, length: value.length });

      if (value.length >= 2) {
        setSearchingRemetente(true);
        console.log('🔍 Chamando debouncedSearchUsers para remetente');
        debouncedSearchUsers(value, 'remetente');
      } else {
        console.log('🔍 Valor muito curto, limpando sugestões');
        setSuggestedRemetentes([]);
        setSearchingRemetente(false);
      }
    }

    if (field === 'destinatario' && typeof value === 'string') {
      console.log('🔍 Processando destinatario:', { value, length: value.length });

      if (value.length >= 2) {
        setSearchingDestinatario(true);
        console.log('🔍 Chamando debouncedSearchUsers para destinatario');
        debouncedSearchUsers(value, 'destinatario');
      } else {
        console.log('🔍 Valor muito curto, limpando sugestões');
        setSuggestedDestinatarios([]);
        setSearchingDestinatario(false);
      }
    }
  };

  const validateStep = (step: number): Record<string, string> => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.tipo) {
          errors.tipo = 'Selecione o tipo de encomenda';
        }
        break;
      case 2:
        if (!formData.remetente) {
          errors.remetente = 'Selecione o remetente';
        }
        // Exigir seleção válida (ID presente) para evitar texto solto sem vínculo
        if (!formData.remetenteId) {
          errors.remetente = 'Selecione o remetente a partir da lista (ID obrigatório)';
        }
        if (!formData.destinatario) {
          errors.destinatario = 'Selecione o destinatario';
        }
        if (!formData.destinatarioId) {
          errors.destinatario = 'Selecione o destinatario a partir da lista (ID obrigatório)';
        }
        if (!formData.setor_destino) {
          errors.setor_destino = 'Selecione o setor de destino';
        }
        // Garantir setor origem resolvido (ID) antes de ir para seleção de malote/lacre
        if (!setorOrigemData?.ID || typeof setorOrigemData.ID !== 'number') {
          errors.setor_origem = 'Defina o setor de origem (resolvido) selecionando um usuário ou setor válidos';
        }
        break;
      case 3:
        if (!formData.descricao || formData.descricao.trim() === '') {
          errors.descricao = 'A descricao do conteudo e obrigatoria';
        }
        break;
    }

    return errors;
  };

  const handleNext = async () => {
    const errors = validateStep(currentStep);

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);

      const errorMessages = Object.values(errors);
      showError('Campos obrigatorios', errorMessages.length === 1 ? errorMessages[0] : `${errorMessages.length} campos precisam ser corrigidos`);
      return;
    }

    // Limpar erros de validação quando não há erros
    setValidationErrors({});

    if (currentStep === 3) {
      await handleSubmit();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Validação: exige lacre e malote selecionados apenas para tipo "malote"
      if (formData.tipo === 'malote' && (!formData.lacreId || !formData.maloteId)) {
        showError("Seleção obrigatória", "Você deve escolher um Malote e um Lacre no passo 3 antes de concluir.");
        setIsSubmitting(false);
        return;
      }
      // Reforçar que remetenteId e setor origem devem estar definidos antes do envio
      if (!formData.remetenteId || !setorOrigemData?.ID) {
        showError('Validação', 'Remetente e setor de origem precisam estar corretamente selecionados antes de concluir.');
        setIsSubmitting(false);
        return;
      }

      const encomendaData = {
        tipo: formData.tipo,
        remetente: formData.remetente,
        remetenteId: formData.remetenteId,
        destinatario: formData.destinatario,
        destinatarioId: formData.destinatarioId,
        setorOrigem: formData.setor_origem || 'Nao informado',
        setorDestino: formData.setor_destino || 'Nao informado',
        setorOrigemId: setorOrigemData?.ID ?? null,
        setorDestinoId: setorDestinoData?.ID ?? null,
        descricao: formData.descricao,
        observacoes: formData.observacoes || '',
        prioridade: formData.urgente ? 'alta' : 'normal',
        urgente: formData.urgente,
        peso: parseFloat(formData.peso) || 0,
        dimensoes: formData.dimensoes || '',
        valorDeclarado: parseFloat(formData.valor_declarado) || 0,
        codigoLacremalote: formData.codigoLacremalote || '',
        lacreId: formData.lacreId || undefined,
        maloteId: formData.maloteId || undefined,
        avisoRecebimento: formData.avisoRecebimento || undefined
      };

      // Reforço: garantir que remetente e setor de origem são do usuário logado
      if (user) {
        const nomeUsuario = (user as any)?.nome || (user as any)?.name || encomendaData.remetente;
        const usuarioId = (user as any)?.id ?? encomendaData.remetenteId;
        const setorId = (user as any)?.setor_id ?? (user as any)?.setorId ?? encomendaData.setorOrigemId;
        const setorNome = (user as any)?.setor ?? encomendaData.setorOrigem;
        encomendaData.remetente = nomeUsuario;
        encomendaData.remetenteId = usuarioId;
        if (setorId) encomendaData.setorOrigemId = setorId;
        if (setorNome) encomendaData.setorOrigem = setorNome;
      }

      const response = await api.post('/encomendas/wizard', encomendaData);
      const apiResponse = response.data;
      const encomendaCriada = apiResponse.data; // Os dados estão em response.data.data

      setGeneratedCode(encomendaCriada.codigo);
      setEncomendaData(encomendaCriada);

      showInfo("Encomenda cadastrada com sucesso!", `Codigo: ${encomendaCriada.codigo}`);

      setCurrentStep(4);

    } catch (error) {
      showError("Erro ao cadastrar encomenda", handleApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectLacre = (l: any) => {
    const id = l.id ?? l.ID ?? null;
    const codigo = l.codigo ?? l.CODIGO ?? '';
    setFormData(prev => ({
      ...prev,
      lacreId: id,
      codigoLacremalote: codigo || prev.codigoLacremalote,
    }));
  };

  const handleSelectMalote = (m: any) => {
    const id = m.id ?? m.ID ?? null;
    const numero = m.numeroMalote ?? m.NUMERO_MALOTE ?? '';
    setFormData(prev => ({
      ...prev,
      maloteId: id,
      maloteNumero: numero,
    }));
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDownloadPDF = async () => {
    if (!etiquetaRef.current || !generatedCode) {
      showError("Erro", "Etiqueta não encontrada para download.");
      return;
    }

    try {
      const temp = document.createElement('div');
      temp.style.width = '160mm';
      temp.style.maxWidth = '160mm';
      temp.style.padding = '0';
      temp.style.margin = '0';
      temp.style.background = '#ffffff';
      temp.style.position = 'fixed';
      temp.style.left = '-9999px';
      temp.style.top = '0';
      temp.innerHTML = etiquetaRef.current.innerHTML;
      document.body.appendChild(temp);

      const canvas = await html2canvas(temp, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      document.body.removeChild(temp);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = 160;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const positionX = (pageWidth - imgWidth) / 2;
      let positionY = 10;

      pdf.addImage(imgData, 'PNG', positionX, positionY, imgWidth, imgHeight);

      let heightLeft = imgHeight - (pageHeight - positionY);
      while (heightLeft > 0) {
        pdf.addPage();
        positionY = 10;
        pdf.addImage(imgData, 'PNG', positionX, positionY - heightLeft, imgWidth, imgHeight);
        heightLeft -= (pageHeight - positionY);
      }

      pdf.save(`etiqueta-${generatedCode}.pdf`);

      showInfo("Download concluído", "O PDF da etiqueta foi baixado com sucesso.");
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      showError("Erro no download", "Não foi possível gerar o PDF da etiqueta.");
    }
  };

  const handlePrint = () => {
    if (!etiquetaRef.current) {
      showError("Erro", "Etiqueta não encontrada para impressão.");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showError("Erro", "Não foi possível abrir a janela de impressão.");
      return;
    }

    const etiquetaHTML = etiquetaRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiqueta - ${generatedCode}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @media print {
              @page { size: A4; margin: 10mm; }
              body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .etiqueta-container { width: 160mm !important; max-width: 160mm !important; min-height: auto !important; height: auto !important; page-break-inside: avoid !important; }
            }
            .etiqueta-container { width: 160mm; max-width: 160mm; min-height: auto; font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>
          <div class="etiqueta-container">${etiquetaHTML}</div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 800);

    showInfo("Impressão iniciada", "A janela de impressão foi aberta.");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Protocolo de Encomenda',
          text: `Protocolo: ${generatedCode}`,
          url: window.location.href
        });
      } catch (error) {
        navigator.clipboard.writeText(generatedCode || '');
        showInfo("Copiado!", "Codigo do protocolo copiado para a area de transferencia.");
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (remetenteRef.current && !remetenteRef.current.contains(event.target as Node)) {
        setSuggestedRemetentes([]);
        setSearchingRemetente(false);
      }
      if (destinatarioRef.current && !destinatarioRef.current.contains(event.target as Node)) {
        setSuggestedDestinatarios([]);
        setSearchingDestinatario(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // useEffect para carregar endereços dos setores dinamicamente
  useEffect(() => {
    if (formData.setor_origem) {
      getEnderecoSetor(formData.setor_origem).then(setEnderecoSetorOrigem);
    }
    if (formData.setor_destino) {
      getEnderecoSetor(formData.setor_destino).then(setEnderecoSetorDestino);
    }
  }, [formData.setor_origem, formData.setor_destino]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-1">
            <div className="text-center mb-1">
              <Package className="w-10 h-10 text-primary mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-primary font-heading">Tipo de Encomenda</h3>
              <p className="text-sm text-foreground-secondary">Selecione o tipo de encomenda que deseja enviar</p>
            </div>

            <div className="space-y-3">
              <TooltipProvider>
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="urgente"
                    checked={formData.urgente}
                    onCheckedChange={(checked) => handleInputChange('urgente', checked)}
                  />
                  <Label htmlFor="urgente" className="text-sm flex items-center gap-1">
                    Marcar como urgente
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-sm">
                          Encomendas marcadas como urgentes recebem prioridade no processamento e tramitação,
                          sendo processadas antes das demais encomendas regulares na fila de atendimento.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                </div>
              </TooltipProvider>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Encomenda *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => handleInputChange('tipo', value)}
                >
                  <SelectTrigger className={`h-10 ${validationErrors.tipo ? 'border-red-500 focus:border-red-500' : ''}`}>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="malote">Malote</SelectItem>
                    <SelectItem value="correspondencia">Correspondência</SelectItem>
                    <SelectItem value="documento">Documento</SelectItem>
                    <SelectItem value="equipamento">Equipamento</SelectItem>
                    <SelectItem value="material_escritorio">Material de Escritório</SelectItem>
                    <SelectItem value="material_limpeza">Material de Limpeza</SelectItem>
                    <SelectItem value="material_consumo">Material de Consumo</SelectItem>
                    <SelectItem value="insumo_tecnico">Insumo Técnico / TI</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.tipo && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.tipo}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-0">
            <div className="text-center mb-0">
              <User className="w-6 h-6 text-primary mx-auto mb-0" />
              <h3 className="text-lg font-semibold text-primary font-heading">Remetente e Destinatario</h3>
              <p className="text-sm text-foreground-secondary">Informe os dados do remetente e destinatario</p>
            </div>

            {/* Layout reorganizado: dados à esquerda, mapa à direita */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Coluna da esquerda: Dados do Remetente e Destinatário */}
              <div className="space-y-0">
                {/* Dados do Remetente */}
                <div className="space-y-0">
                  <h4 className="text-base font-semibold text-primary font-heading flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Dados do Remetente
                  </h4>
                  <div className="space-y-0">
                  <div className="space-y-0.5 relative" ref={remetenteRef}>
                    <Label htmlFor="remetente">Dados do Remetente *</Label>
                    <div className="relative">
                      <Input
                        id="remetente"
                        value={formData.remetente}
                        onChange={(e) => handleInputChange('remetente', e.target.value)}
                        placeholder="Digite o nome do servidor ou do setor ..."
                        readOnly
                        className={`pr-8 h-10 ${validationErrors.remetente ? 'border-red-500 focus:border-red-500' : ''}`}
                        title=""
                      />
                      {searchingRemetente && (
                        <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                      )}
                    </div>
                      {validationErrors.remetente && (
                        <p className="text-sm text-red-600 mt-1">{validationErrors.remetente}</p>
                      )}
                      {suggestedRemetentes.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                          {suggestedRemetentes.map((item, index) => (
                            <div
                              key={item.id || `remetente-${index}`}
                              className={`px-3 py-2 border-b border-gray-100 last:border-b-0 ${item.tipo === 'user'
                                  ? 'cursor-pointer hover:bg-gray-100'
                                  : 'cursor-not-allowed bg-gray-50'
                                }`}
                              onClick={() => item.tipo === 'user' && selectUser(item, 'remetente')}
                            >
                              {item.tipo === 'user' ? (
                                // Exibir usuário
                                <>
                                  <div className="font-medium text-sm flex items-center gap-2">
                                    <User className="w-3 h-3 text-blue-600" />
                                    {item.nome}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {item.numero_funcional} - {item.orgao}
                                    {item.setor && ` - ${item.setor}`}
                                  </div>
                                </>
                              ) : (
                                // Exibir setor (não clicável)
                                <>
                                  <div className="font-semibold text-sm flex items-center gap-2 text-gray-600">
                                    <MapPin className="w-3 h-3 text-green-600" />
                                    {item.NOME_SETOR || item.nome_setor}
                                  </div>
                                  <div className="text-xs text-gray-400 flex items-center gap-1">
                                    {item.CODIGO_SETOR && `${item.CODIGO_SETOR} - `}
                                    {item.ORGAO || item.orgao}
                                    <ArrowDownLeft className="w-3 h-3 text-blue-500 ml-2" />
                                    <span className="text-blue-600 font-medium">Clique no nome da pessoa abaixo</span>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <Label htmlFor="setor_origem">Setor de Origem</Label>
                      <Input
                        id="setor_origem"
                        value={formData.setor_origem}
                        onChange={(e) => handleInputChange('setor_origem', e.target.value)}
                        placeholder="Preenchido automaticamente"
                        readOnly
                        className="bg-gray-50 h-10"
                      />
                      {loadingSetorOrigem && (
                        <div className="text-xs text-blue-600 flex items-center gap-1">
                          <Search className="w-3 h-3 animate-spin" />
                          Carregando endereço...
                        </div>
                      )}
                      {setorOrigemData && (
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                          <div className="font-medium">Endereço:</div>
                          <div>
                            {setorOrigemData.LOGRADOURO && `${setorOrigemData.LOGRADOURO}`}
                            {setorOrigemData.NUMERO && `, ${setorOrigemData.NUMERO}`}
                            {setorOrigemData.COMPLEMENTO && ` - ${setorOrigemData.COMPLEMENTO}`}
                          </div>
                          <div>
                            {setorOrigemData.BAIRRO && `${setorOrigemData.BAIRRO}, `}
                            {setorOrigemData.CIDADE && `${setorOrigemData.CIDADE}`}
                            {setorOrigemData.ESTADO && ` - ${setorOrigemData.ESTADO}`}
                          </div>
                          {setorOrigemData.CEP && (
                            <div className="font-medium text-blue-600">CEP: {setorOrigemData.CEP}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dados do Destinatário - agora embaixo do Remetente */}
                <div className="space-y-0.5">
                  <h4 className="text-base font-semibold text-primary font-heading flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Dados do Destinatario
                  </h4>
                  <div className="space-y-0.5">
                    <div className="space-y-2 relative" ref={destinatarioRef}>
                      <Label htmlFor="destinatario">Dados do Destinatario *</Label>
                      <div className="relative">
                        <Input
                          id="destinatario"
                          value={formData.destinatario}
                          onChange={(e) => handleInputChange('destinatario', e.target.value)}
                          placeholder="Digite o nome do servidor ou do setor ..."
                          className={`pr-8 h-10 ${validationErrors.destinatario ? 'border-red-500 focus:border-red-500' : ''}`}
                          title=""
                        />
                        {searchingDestinatario && (
                          <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                        )}
                      </div>
                      {validationErrors.destinatario && (
                        <p className="text-sm text-red-600 mt-1">{validationErrors.destinatario}</p>
                      )}
                      {suggestedDestinatarios.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                          {suggestedDestinatarios.map((item, index) => (
                            <div
                              key={item.id || `destinatario-${index}`}
                              className={`px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${item.isGroup ? 'bg-gray-50 hover:bg-gray-100' : 'hover:bg-gray-100'
                                } ${item.isChildOfGroup ? 'ml-4 border-l-2 border-blue-200' : ''}`}
                              onClick={() => !item.isGroup && selectUser(item, 'destinatario')}
                            >
                              {item.isGroup ? (
                                // Exibir cabeçalho do setor
                                <div className="font-semibold text-sm flex items-center gap-2 text-gray-700">
                                  <MapPin className="w-4 h-4 text-green-600" />
                                  {item.NOME_SETOR}
                                  <span className="text-xs text-gray-500 ml-auto">
                                    {item.CODIGO_SETOR && `${item.CODIGO_SETOR} - `}
                                    {item.ORGAO}
                                  </span>
                                </div>
                              ) : item.tipo === 'user' ? (
                                // Exibir usuário
                                <>
                                  <div className="font-medium text-sm flex items-center gap-2">
                                    <User className="w-3 h-3 text-blue-600" />
                                    {item.nome}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {item.numero_funcional} - {item.orgao}
                                    {item.setor && ` - ${item.setor}`}
                                  </div>
                                </>
                              ) : (
                                // Exibir setor individual (fallback)
                                <>
                                  <div className="font-medium text-sm flex items-center gap-2">
                                    <MapPin className="w-3 h-3 text-green-600" />
                                    {item.NOME_SETOR || item.nome_setor}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {item.CODIGO_SETOR && `${item.CODIGO_SETOR} - `}
                                    {item.ORGAO || item.orgao}
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-0">
                      <Label htmlFor="setor_destino">Setor de Destino</Label>
                      <Input
                        id="setor_destino"
                        value={formData.setor_destino}
                        onChange={(e) => handleInputChange('setor_destino', e.target.value)}
                        placeholder="Preenchido automaticamente"
                        readOnly
                        className={`bg-gray-50 h-10 ${validationErrors.setor_destino ? 'border-red-500' : ''}`}
                      />
                      {validationErrors.setor_destino && (
                        <p className="text-sm text-red-600 mt-1">{validationErrors.setor_destino}</p>
                      )}
                      {loadingSetorDestino && (
                        <div className="text-xs text-blue-600 flex items-center gap-1">
                          <Search className="w-3 h-3 animate-spin" />
                          Carregando endereço...
                        </div>
                      )}
                      {setorDestinoData && (
                        <div className="text-xs text-gray-600 bg-gray-50 p-1 rounded border">
                          <div className="font-medium">Endereço:</div>
                          <div>
                            {setorDestinoData.LOGRADOURO && `${setorDestinoData.LOGRADOURO}`}
                            {setorDestinoData.NUMERO && `, ${setorDestinoData.NUMERO}`}
                            {setorDestinoData.COMPLEMENTO && ` - ${setorDestinoData.COMPLEMENTO}`}
                          </div>
                          <div>
                            {setorDestinoData.BAIRRO && `${setorDestinoData.BAIRRO}, `}
                            {setorDestinoData.CIDADE && `${setorDestinoData.CIDADE}`}
                            {setorDestinoData.ESTADO && ` - ${setorDestinoData.ESTADO}`}
                          </div>
                          {setorDestinoData.CEP && (
                            <div className="font-medium text-blue-600">CEP: {setorDestinoData.CEP}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna da direita: Mapa */}
              <div className="mt-0">
                <MapaWizard
                  setorOrigem={formData.setor_origem}
                  setorDestino={formData.setor_destino}
                  setorOrigemData={setorOrigemData}
                  setorDestinoData={setorDestinoData}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-3">
            <div className="text-center mb-2">
              <FileText className="w-8 h-8 text-primary mx-auto mb-1" />
              <h3 className="text-lg font-semibold text-primary font-heading">Descrição da Mercadoria</h3>
              <p className="text-sm text-foreground-secondary">Informe os detalhes da mercadoria</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="descricao">Descrição do Conteúdo *</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  placeholder="Descreva detalhadamente o conteúdo da encomenda..."
                  rows={3}
                  className={`resize-none ${validationErrors.descricao ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {validationErrors.descricao && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.descricao}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="peso">Peso (kg)</Label>
                  <Input
                    id="peso"
                    type="number"
                    step="0.1"
                    value={formData.peso}
                    onChange={(e) => handleInputChange('peso', e.target.value)}
                    placeholder="0.0"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dimensoes">Dimensões (cm)</Label>
                  <Input
                    id="dimensoes"
                    value={formData.dimensoes}
                    onChange={(e) => handleInputChange('dimensoes', e.target.value)}
                    placeholder="C x L x A"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="valor">Valor Declarado (R$)</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={formData.valor_declarado}
                    onChange={(e) => handleInputChange('valor_declarado', e.target.value)}
                    placeholder="0.00"
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Informações adicionais sobre a encomenda (opcional)..."
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* Seletor de Malote e Lacre - apenas para tipo "malote" */}
              {formData.tipo === 'malote' && (
                <div className="space-y-1">
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <Button type="button" variant="outline" size="sm" onClick={() => setSelectModalOpen(true)}>
                      Selecionar Malote e Lacre
                    </Button>
                    {/* Mostrar primeiro o Malote, depois o Lacre, em badges com cores distintas */}
                    {formData.maloteNumero && (
                      <Badge variant="default" className="shadow-sm">
                        Malote #{formData.maloteNumero}
                      </Badge>
                    )}
                    {formData.codigoLacremalote && (
                      <Badge
                        variant="outline"
                        className="shadow-sm bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200"
                      >
                        Lacre {formData.codigoLacremalote}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Campo AR - apenas para tipo "correspondencia" */}
              {formData.tipo === 'correspondencia' && (
                <div className="space-y-1">
                  <Label htmlFor="avisoRecebimento">AR - Aviso de Recebimento</Label>
                  <Input
                    id="avisoRecebimento"
                    value={formData.avisoRecebimento}
                    onChange={(e) => handleInputChange('avisoRecebimento', e.target.value)}
                    placeholder="Ex: BR201521105BR"
                    className="h-9"
                    maxLength={13}
                  />
                  <p className="text-xs text-muted-foreground">
                    Código de rastreamento do AR (opcional)
                  </p>
                </div>
              )}
            </div>
            <SelectLacreMaloteModal
              isOpen={selectModalOpen}
              onClose={() => setSelectModalOpen(false)}
              setorOrigemId={setorOrigemData?.ID ?? null}
              setorDestinoId={setorDestinoData?.ID ?? null}
              onSelectLacre={handleSelectLacre}
              onSelectMalote={handleSelectMalote}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-0">
            <div className="text-center mb-0">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-0">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <h3 className="text-base font-semibold text-primary font-heading mb-0">Protocolo Gerado</h3>
              <p className="text-xs text-foreground-secondary mb-1">Sua encomenda foi cadastrada com sucesso!</p>
            </div>

            {generatedCode && encomendaData ? (
              <div className="flex flex-col lg:flex-row justify-center items-start gap-2">
                {/* Espaçador para manter a etiqueta centrada sob o título em telas grandes */}
                <div className="hidden lg:block lg:w-40" aria-hidden="true" />
                {/* Etiqueta da Encomenda (coluna central) */}
                <div className="mx-auto w-fit" ref={etiquetaRef}>
                  <EtiquetaEncomenda
                    codigo={generatedCode}
                    remetente={formData.remetente}
                    destinatario={formData.destinatario}
                    setorOrigem={formData.setor_origem}
                    setorDestino={formData.setor_destino}
                    descricao={formData.descricao}
                    observacoes={formData.observacoes}
                    dataPostagem={new Date().toISOString()}
                    codigoLacre={formData.codigoLacremalote}
                    numeroMalote={formData.maloteNumero}
                    numeroAR={formData.avisoRecebimento}
                    qrCodeData={encomendaData.qrCode}
                    enderecoSetor={encomendaData.enderecoSetor}
                    enderecoSetorOrigem={enderecoSetorOrigem}
                    enderecoSetorDestino={enderecoSetorDestino}
                    urgente={formData.urgente}
                    remetenteMatricula={formData.remetenteMatricula}
                    remetenteVinculo={formData.remetenteVinculo}
                    destinatarioMatricula={formData.destinatarioMatricula}
                    destinatarioVinculo={formData.destinatarioVinculo}
                  />
                </div>

                {/* Botões de Ação (coluna direita) */}
                <div className="flex flex-col gap-1 w-full lg:w-40">
                  <Button
                    variant="outline"
                    onClick={handlePrint}
                    className="btn-govto-secondary gap-1 text-xs h-6 w-full"
                  >
                    <Printer className="w-2 h-2" />
                    Imprimir Etiqueta
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownloadPDF}
                    className="btn-govto-secondary gap-1 text-xs h-6 w-full"
                  >
                    <Download className="w-2 h-2" />
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="btn-govto-secondary gap-1 text-xs h-6 w-full"
                  >
                    <Share2 className="w-2 h-2" />
                    Compartilhar
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="card-govto">
                <CardContent className="p-2">
                  <div className="text-center space-y-2">
                    <div className="text-lg font-bold text-primary font-heading">
                      EN-XXXX-XXXXXX
                    </div>
                    <div className="flex justify-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <QrCode className="w-10 h-10 text-foreground-muted" />
                      </div>
                    </div>
                    <p className="text-xs text-foreground-muted">
                      Etiqueta será gerada após cadastro
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Conteúdo com scroll */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-1">
          <Card className="card-govto">
            <CardContent className="p-2">
              <div className="w-full">
                {/* Conteúdo principal do wizard - ocupa toda a largura */}
                <div className="w-full">
                  {renderStepContent()}
                </div>

                {/* Mapa customizado será adicionado aqui */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
});

NovaEncomendaWizard.displayName = 'NovaEncomendaWizard';

export default NovaEncomendaWizard;