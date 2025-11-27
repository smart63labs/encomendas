// Tipos para Encomendas baseados no backend real

export interface Encomenda {
  id?: number;
  numeroEncomenda?: string;
  codigoRastreamento?: string;
  codigo?: string;
  tipo?: string;
  remetente?: string;
  destinatario?: string;
  setorOrigem?: string;
  setorDestino?: string;
  status?: 'pendente' | 'postado' | 'em_transito' | 'entregue' | 'devolvido';
  prioridade?: 'normal' | 'urgente';
  urgente?: boolean;
  dataPostagem?: string;
  dataEnvio?: string;
  dataEntrega?: string;
  valorDeclarado?: number;
  peso?: number;
  descricao?: string;
  observacoes?: string;
  remetenteMatricula?: string;
  remetenteVinculo?: string;
  destinatarioMatricula?: string;
  destinatarioVinculo?: string;
  // Identificadores e vinculações
  numeroMalote?: string;
  numeroLacre?: string;
  numeroAR?: string;
  codigoLacreMalote?: string;
  // Alias usados em componentes existentes
  codigoLacre?: string;
  qrCodeData?: string;
  qrCode?: string;
  codigoBarras?: string;
  // Campos adicionais para coordenadas (usados nos mapas)
  encomendaPaiId?: number | null;
  encomendaPaiNumero?: string | null;
  setorOrigemCoordenadas?: {
    latitude: number | null;
    longitude: number | null;
  };
  setorDestinoCoordenadas?: {
    latitude: number | null;
    longitude: number | null;
  };
  // Campos de endereço dos setores (usados nos mapas)
  setorOrigemEndereco?: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };
  setorDestinoEndereco?: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };
}

// Interface para encomenda com coordenadas (usada nos mapas)
export interface EncomendaComCoordenadas extends Encomenda {
  coordOrigem?: {
    lat: number;
    lng: number;
  };
  coordDestino?: {
    lat: number;
    lng: number;
  };
}

// Tipos de status mapeados para o frontend
export type StatusEncomenda = 'preparando' | 'transito' | 'entregue' | 'devolvido';

// Função utilitária para mapear status do backend para frontend
export const mapearStatus = (statusBackend: string): StatusEncomenda => {
  const s = String(statusBackend || '').toLowerCase();
  switch (s) {
    case 'entregue':
      return 'entregue';
    // Compactar todos os demais em "Em Trânsito"
    case 'em_transito':
    case 'transito':
    case 'postado':
    case 'pendente':
    case 'devolvido':
    default:
      return 'transito';
  }
};
