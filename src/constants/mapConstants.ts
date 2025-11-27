// Constantes compartilhadas para mapas
export interface Coordenadas {
  lat: number;
  lng: number;
}

// Coordenadas padrão do Tocantins
export const COORDENADAS_TOCANTINS: Coordenadas = { lat: -10.25, lng: -48.25 };
export const ZOOM_TOCANTINS = 8;

// Coordenadas de Palmas
export const COORDENADAS_PALMAS: Coordenadas = { lat: -10.184, lng: -48.333 };

// Tolerância para considerar coordenadas como "iguais" (em graus decimais)
export const TOLERANCIA_COORDENADAS = 0.0001; // ~11 metros