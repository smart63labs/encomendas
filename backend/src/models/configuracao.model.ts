/**
 * Modelo para Configurações do Sistema
 * 
 * Este modelo define as interfaces e tipos para o gerenciamento
 * de configurações dinâmicas do sistema.
 */

export interface Configuracao {
  id?: number;
  categoria: string;
  chave: string;
  valor: string;
  tipo: 'string' | 'number' | 'boolean' | 'json' | 'date';
  descricao?: string;
  obrigatoria: boolean;
  editavel: boolean;
  ordemExibicao: number;
  usuarioCriacaoId?: number | null;
  usuarioAlteracaoId?: number | null;
  dataCriacao?: Date | null;
  dataAlteracao?: Date | null;
  ativo: boolean;
}

export interface ConfiguracaoInput {
  categoria: string;
  chave: string;
  valor: string;
  tipo?: 'string' | 'number' | 'boolean' | 'json' | 'date';
  descricao?: string;
  obrigatoria?: boolean;
  editavel?: boolean;
  ordemExibicao?: number;
}

export interface ConfiguracaoUpdate {
  valor?: string;
  descricao?: string;
  editavel?: boolean;
  ordemExibicao?: number;
  ativo?: boolean;
}

export interface ConfiguracaoResponse {
  success: boolean;
  data?: Configuracao | Configuracao[];
  message?: string;
  total?: number;
}

/**
 * Categorias válidas para configurações
 */
export const CATEGORIAS_CONFIG = {
  GERAL: 'geral',
  SEGURANCA: 'seguranca',
  NOTIFICACOES: 'notificacoes',
  SISTEMA: 'sistema',
  APARENCIA: 'aparencia'
} as const;

export type CategoriaConfig = typeof CATEGORIAS_CONFIG[keyof typeof CATEGORIAS_CONFIG];

/**
 * Tipos válidos para valores de configuração
 */
export const TIPOS_CONFIG = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  JSON: 'json',
  DATE: 'date'
} as const;

export type TipoConfig = typeof TIPOS_CONFIG[keyof typeof TIPOS_CONFIG];

/**
 * Utilitários para conversão de valores
 */
export class ConfiguracaoUtils {
  /**
   * Converte valor string do banco para o tipo apropriado
   */
  static parseValue(valor: string, tipo: TipoConfig): any {
    switch (tipo) {
      case 'boolean':
        return valor.toUpperCase() === 'S' || valor.toLowerCase() === 'true';
      case 'number':
        return parseFloat(valor);
      case 'json':
        try {
          return JSON.parse(valor);
        } catch {
          return valor;
        }
      case 'date':
        return new Date(valor);
      default:
        return valor;
    }
  }

  /**
   * Converte valor para string para armazenar no banco
   */
  static stringifyValue(valor: any, tipo: TipoConfig): string {
    switch (tipo) {
      case 'boolean':
        return valor ? 'S' : 'N';
      case 'number':
        return valor.toString();
      case 'json':
        return JSON.stringify(valor);
      case 'date':
        return valor instanceof Date ? valor.toISOString() : valor;
      default:
        return valor.toString();
    }
  }

  /**
   * Valida se um valor é válido para o tipo especificado
   */
  static validateValue(valor: any, tipo: TipoConfig): boolean {
    switch (tipo) {
      case 'boolean':
        return typeof valor === 'boolean' ||
          (typeof valor === 'string' && ['true', 'false'].includes(valor.toLowerCase()));
      case 'number':
        return !isNaN(Number(valor));
      case 'json':
        if (typeof valor === 'string') {
          try {
            JSON.parse(valor);
            return true;
          } catch {
            return false;
          }
        }
        return typeof valor === 'object';
      case 'date':
        return !isNaN(Date.parse(valor));
      default:
        return true; // string sempre é válido
    }
  }
}

/**
 * Interface para filtros de busca
 */
export interface ConfiguracaoFiltros {
  categoria?: string;
  chave?: string;
  ativo?: boolean;
  editavel?: boolean;
  obrigatoria?: boolean;
}

/**
 * Interface para ordenação
 */
export interface ConfiguracaoOrdenacao {
  campo: 'categoria' | 'chave' | 'ordemExibicao' | 'dataCriacao' | 'dataAlteracao';
  direcao: 'ASC' | 'DESC';
}