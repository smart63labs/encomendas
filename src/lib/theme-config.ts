// Configuração de temas por módulo do sistema
// Baseado nas cores definidas na sidebar para manter consistência visual

export interface ModuleTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    hover: string;
    text: string;
    textSecondary: string;
    // Classes para componentes específicos
    button: string;
    buttonHover: string;
    badge: string;
    badgeText: string;
    card: string;
    cardBorder: string;
  };
}

export const moduleThemes: Record<string, ModuleTheme> = {
  dashboard: {
    id: "dashboard",
    name: "Dashboard",
    colors: {
      primary: "bg-blue-600",
      secondary: "bg-blue-50",
      accent: "border-blue-200",
      hover: "hover:bg-blue-100",
      text: "text-blue-900",
      textSecondary: "text-blue-700",
      button: "bg-blue-600 hover:bg-blue-700",
      buttonHover: "hover:bg-blue-700",
      badge: "bg-blue-100 border-blue-200",
      badgeText: "text-blue-800",
      card: "bg-blue-50/50",
      cardBorder: "border-blue-200"
    }
  },
  documentos: {
    id: "documentos",
    name: "Documentos",
    colors: {
      primary: "bg-green-600",
      secondary: "bg-green-50",
      accent: "border-green-200",
      hover: "hover:bg-green-100",
      text: "text-green-900",
      textSecondary: "text-green-700",
      button: "bg-green-600 hover:bg-green-700",
      buttonHover: "hover:bg-green-700",
      badge: "bg-green-100 border-green-200",
      badgeText: "text-green-800",
      card: "bg-green-50/50",
      cardBorder: "border-green-200"
    }
  },
  processos: {
    id: "processos",
    name: "Processos",
    colors: {
      primary: "bg-orange-600",
      secondary: "bg-orange-50",
      accent: "border-orange-200",
      hover: "hover:bg-orange-100",
      text: "text-orange-900",
      textSecondary: "text-orange-700",
      button: "bg-orange-600 hover:bg-orange-700",
      buttonHover: "hover:bg-orange-700",
      badge: "bg-orange-100 border-orange-200",
      badgeText: "text-orange-800",
      card: "bg-orange-50/50",
      cardBorder: "border-orange-200"
    }
  },
  tramitacao: {
    id: "tramitacao",
    name: "Tramitação",
    colors: {
      primary: "bg-purple-600",
      secondary: "bg-purple-50",
      accent: "border-purple-200",
      background: "bg-gradient-to-br from-purple-50 to-purple-100/50",
      hover: "hover:bg-purple-100",
      text: "text-purple-900",
      textSecondary: "text-purple-700"
    }
  },
  encomendas: {
    id: "encomendas",
    name: "Encomendas",
    colors: {
      primary: "bg-indigo-600",
      secondary: "bg-indigo-50",
      accent: "border-indigo-200",
      background: "bg-gradient-to-br from-indigo-50 to-indigo-100/50",
      hover: "hover:bg-indigo-100",
      text: "text-indigo-900",
      textSecondary: "text-indigo-700"
    }
  },
  arquivo: {
    id: "arquivo",
    name: "Arquivo",
    colors: {
      primary: "bg-gray-600",
      secondary: "bg-gray-50",
      accent: "border-gray-200",
      hover: "hover:bg-gray-100",
      text: "text-gray-900",
      textSecondary: "text-gray-700",
      button: "bg-gray-600 hover:bg-gray-700",
      buttonHover: "hover:bg-gray-700",
      badge: "bg-gray-100 border-gray-200",
      badgeText: "text-gray-800",
      card: "bg-gray-50/50",
      cardBorder: "border-gray-200"
    }
  },
  prazos: {
    id: "prazos",
    name: "Prazos",
    colors: {
      primary: "bg-purple-600",
      secondary: "bg-purple-50",
      accent: "border-purple-200",
      hover: "hover:bg-purple-100",
      text: "text-purple-900",
      textSecondary: "text-purple-700",
      button: "bg-purple-600 hover:bg-purple-700",
      buttonHover: "hover:bg-purple-700",
      badge: "bg-purple-100 border-purple-200",
      badgeText: "text-purple-800",
      card: "bg-purple-50/50",
      cardBorder: "border-purple-200"
    }
  },
  usuarios: {
    id: "usuarios",
    name: "Usuários",
    colors: {
      primary: "bg-teal-600",
      secondary: "bg-teal-50",
      accent: "border-teal-200",
      background: "bg-gradient-to-br from-teal-50 to-teal-100/50",
      hover: "hover:bg-teal-100",
      text: "text-teal-900",
      textSecondary: "text-teal-700"
    }
  },
  configuracoes: {
    id: "configuracoes",
    name: "Configurações",
    colors: {
      primary: "bg-slate-600",
      secondary: "bg-slate-50",
      accent: "border-slate-200",
      background: "bg-gradient-to-br from-slate-50 to-slate-100/50",
      hover: "hover:bg-slate-100",
      text: "text-slate-900",
      textSecondary: "text-slate-700"
    }
  }
};

// Função utilitária para obter o tema de um módulo
export const getModuleTheme = (moduleId: string): ModuleTheme => {
  return moduleThemes[moduleId] || moduleThemes.dashboard;
};

// Função para obter classes CSS do tema
export const getThemeClasses = (moduleId: string) => {
  const theme = getModuleTheme(moduleId);
  return {
    primary: theme.colors.primary,
    secondary: theme.colors.secondary,
    accent: theme.colors.accent,
    hover: theme.colors.hover,
    text: theme.colors.text,
    textSecondary: theme.colors.textSecondary,
    button: theme.colors.button,
    buttonHover: theme.colors.buttonHover,
    badge: theme.colors.badge,
    badgeText: theme.colors.badgeText,
    card: theme.colors.card,
    cardBorder: theme.colors.cardBorder
  };
};

// Hook personalizado para usar temas
export const useModuleTheme = (moduleId: string) => {
  const theme = getModuleTheme(moduleId);
  const classes = getThemeClasses(moduleId);
  
  return {
    theme,
    classes,
    // Função para aplicar classes condicionalmente
    applyTheme: (element: 'header' | 'card' | 'button' | 'background') => {
      switch (element) {
        case 'header':
          return `${classes.background} ${classes.text}`;
        case 'card':
          return `${classes.secondary} ${classes.accent} ${classes.hover}`;
        case 'button':
          return `${classes.primary} text-white hover:opacity-90`;
        case 'background':
          return classes.background;
        default:
          return '';
      }
    }
  };
};