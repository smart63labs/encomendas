/**
 * Utilitário centralizado para cores de badges do sistema
 * Garante consistência visual em todas as telas
 */

// Cores para Status de Encomendas
export const getStatusColor = (status: string) => {
  switch (status) {
    case "entregue":
      return "bg-accent-green text-white";
    case "transito":
      return "bg-accent-orange text-white";
    case "preparando":
      return "bg-primary text-primary-foreground";
    case "devolvido":
      return "bg-accent-red text-white";
    default:
      return "bg-muted text-foreground";
  }
};

export const getStatusLabel = (status: string) => {
  switch (status) {
    case "entregue":
      return "Entregue";
    case "transito":
      return "Em Trânsito";
    case "preparando":
      return "Preparando";
    case "devolvido":
      return "Devolvido";
    default:
      return status;
  }
};

// Cores para Tipo de Encomendas
export const getTipoColor = (tipo: string) => {
  switch (tipo?.toLowerCase()) {
    case 'malote':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'correspondencia':
      return 'bg-teal-100 text-teal-800 hover:bg-teal-200';
    case 'malote_interno':
    case 'malote interno':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'malote_externo':
    case 'malote externo':
      return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
    case 'documento':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'equipamento':
      return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
    case 'material':
    case 'material de escritório':
    case 'material_escritorio':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case 'material_limpeza':
      return 'bg-lime-100 text-lime-800 hover:bg-lime-200';
    case 'material_consumo':
      return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
    case 'insumo_tecnico':
    case 'insumo técnico':
      return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200';
    case 'outros':
      return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200';
    default:
      return 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200';
  }
};

export const getTipoLabel = (tipo: string) => {
  switch (tipo?.toLowerCase()) {
    case 'malote':
      return 'Malote';
    case 'correspondencia':
      return 'Correspondência';
    case 'malote_interno':
      return 'Malote Interno';
    case 'malote_externo':
      return 'Malote Externo';
    case 'documento':
      return 'Documento';
    case 'equipamento':
      return 'Equipamento';
    case 'material':
    case 'material de escritório':
    case 'material_escritorio':
      return 'Material';
    case 'material_limpeza':
      return 'Material de Limpeza';
    case 'material_consumo':
      return 'Material de Consumo';
    case 'insumo_tecnico':
    case 'insumo técnico':
      return 'Insumo Técnico / TI';
    case 'outros':
      return 'Outros';
    default:
      return tipo || 'Encomenda';
  }
};

// Cores para Prioridade
export const getPrioridadeColor = (prioridade: string) => {
  switch (prioridade?.toLowerCase()) {
    case 'urgente':
    case 'alta':
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    case 'media':
    case 'média':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case 'normal':
    case 'baixa':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    default:
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
  }
};

export const getPrioridadeLabel = (prioridade: string) => {
  switch (prioridade?.toLowerCase()) {
    case 'urgente':
    case 'alta':
      return 'Urgente';
    case 'media':
    case 'média':
      return 'Média';
    case 'normal':
    case 'baixa':
      return 'Normal';
    default:
      return prioridade || 'Normal';
  }
};

// Cores para Status de Entrega
export const getEntregaColor = (dataEntrega: string | undefined) => {
  if (dataEntrega) {
    return 'bg-green-500 text-white';
  } else {
    return 'bg-red-500 text-white';
  }
};

export const getEntregaLabel = (dataEntrega: string | undefined) => {
  if (dataEntrega) {
    return new Date(dataEntrega).toLocaleDateString('pt-BR');
  } else {
    return 'Não entregue';
  }
};

// Cores para Status de Documentos (padronizado)
export const getDocumentoStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'ativo':
      return 'bg-green-100 text-green-800';
    case 'inativo':
      return 'bg-red-100 text-red-800';
    case 'pendente':
      return 'bg-yellow-100 text-yellow-800';
    case 'arquivado':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

// Cores para Status de Processos/Prazos (padronizado)
export const getProcessoStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'vencido':
      return 'bg-red-500 text-white';
    case 'em_andamento':
      return 'bg-blue-500 text-white';
    case 'concluido':
      return 'bg-green-500 text-white';
    case 'pendente':
    default:
      return 'bg-gray-500 text-white';
  }
};

// Cores para Prioridade de Processos/Prazos (padronizado)
export const getProcessoPrioridadeColor = (prioridade: string) => {
  switch (prioridade?.toLowerCase()) {
    case 'alta':
      return 'bg-red-500 text-white';
    case 'media':
    case 'média':
      return 'bg-yellow-500 text-white';
    case 'baixa':
    default:
      return 'bg-green-500 text-white';
  }
};

// Cores para Status de Upload de Arquivos
export const getUploadStatusColor = (status: 'uploading' | 'success' | 'error') => {
  switch (status) {
    case 'uploading':
      return 'bg-blue-100 text-blue-800';
    case 'success':
      return 'bg-green-100 text-green-800';
    case 'error':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
