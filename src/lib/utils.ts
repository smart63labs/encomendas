import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formata matrícula + vínculo no padrão "123456-02"
// Aceita objeto de usuário ou valores literais
export function formatMatriculaVinculo(user: any): string {
  if (!user) return '';
  
  // Buscar matrícula em diferentes formatos possíveis
  const matricula = user.matricula || user.MATRICULA || user.numero_funcional || user.numeroFuncional || '';
  
  // Buscar vínculo funcional em diferentes formatos possíveis (após conversão camelCase)
  const vinculo = user.vinculoFuncional || user.VINCULO_FUNCIONAL || user.vinculo_funcional || '';
  
  if (!matricula) return '';
  
  if (!vinculo) return matricula;
  
  // Usar apenas os códigos reais do banco (01, 02, 03, 04)
  const resultado = `${matricula}-${vinculo}`;
  
  return resultado;
}

// Normaliza texto removendo acentos para busca
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Padroniza cores de badge para perfis de usuário em todo o sistema
export function getProfileBadgeClass(perfilEntrada?: string): string {
  const perfil = (perfilEntrada || '').toLowerCase();
  switch (perfil) {
    case 'admin':
    case 'administrador':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'manager':
    case 'gerente':
    case 'gestor':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'moderator':
    case 'moderador':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'user':
    case 'usuario':
    case 'usuário':
      return 'bg-green-100 text-green-700 border-green-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

// Formata data para padrão PT-BR
export function formatDatePTBR(date: string | Date | null | undefined): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Verifica se a data é válida
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.warn('Erro ao formatar data:', error);
    return '';
  }
}
