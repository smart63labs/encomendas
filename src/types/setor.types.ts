export interface Setor {
  id?: number;
  codigo_setor: string;
  nome_setor: string;
  orgao?: string;
  ativo: boolean;
  logradouro?: string;
  numero?: string;
  coluna1?: string; // Campo genérico conforme nova estrutura
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  data_criacao?: string;
  data_atualizacao?: string;
  latitude?: number;
  longitude?: number;
}

export interface SetorWithCoordinates extends Setor {
  coordenadas?: {
    lat: number;
    lng: number;
  };
}