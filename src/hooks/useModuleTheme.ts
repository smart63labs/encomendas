import { useState, useEffect } from 'react';

interface ModuleTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
}

const moduleThemes: Record<string, ModuleTheme> = {
  processos: {
    primary: 'hsl(221.2 83.2% 53.3%)',
    secondary: 'hsl(210 40% 96%)',
    accent: 'hsl(210 40% 90%)',
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(222.2 84% 4.9%)'
  },
  documentos: {
    primary: 'hsl(142.1 76.2% 36.3%)',
    secondary: 'hsl(138 76% 97%)',
    accent: 'hsl(138 76% 92%)',
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(222.2 84% 4.9%)'
  },
  arquivo: {
    primary: 'hsl(24.6 95% 53.1%)',
    secondary: 'hsl(24 100% 97%)',
    accent: 'hsl(24 100% 92%)',
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(222.2 84% 4.9%)'
  },
  tramitacao: {
    primary: 'hsl(262.1 83.3% 57.8%)',
    secondary: 'hsl(270 95% 97%)',
    accent: 'hsl(270 95% 92%)',
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(222.2 84% 4.9%)'
  },
  usuarios: {
    primary: 'hsl(346.8 77.2% 49.8%)',
    secondary: 'hsl(355 100% 97%)',
    accent: 'hsl(355 100% 92%)',
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(222.2 84% 4.9%)'
  },
  configuracoes: {
    primary: 'hsl(47.9 95.8% 53.1%)',
    secondary: 'hsl(48 100% 97%)',
    accent: 'hsl(48 100% 92%)',
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(222.2 84% 4.9%)'
  },
  default: {
    primary: 'hsl(221.2 83.2% 53.3%)',
    secondary: 'hsl(210 40% 96%)',
    accent: 'hsl(210 40% 90%)',
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(222.2 84% 4.9%)'
  }
};

export const useModuleTheme = (moduleName: string) => {
  const [theme, setTheme] = useState<ModuleTheme>(moduleThemes[moduleName] || moduleThemes.default);

  useEffect(() => {
    const selectedTheme = moduleThemes[moduleName] || moduleThemes.default;
    setTheme(selectedTheme);
  }, [moduleName]);

  return { theme };
};

export default useModuleTheme;