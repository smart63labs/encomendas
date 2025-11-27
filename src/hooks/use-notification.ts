import { useState, useCallback } from 'react';

export interface NotificationData {
  title: string;
  description: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
}

export const useNotification = () => {
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const showNotification = useCallback((data: NotificationData) => {
    setNotification(data);
    setIsOpen(true);
  }, []);

  const hideNotification = useCallback(() => {
    setIsOpen(false);
    // Aguarda um pouco antes de limpar os dados para permitir a animação de fechamento
    setTimeout(() => {
      setNotification(null);
    }, 200);
  }, []);

  // Funções de conveniência para diferentes tipos de notificação
  const showSuccess = useCallback((title: string, description: string) => {
    showNotification({ title, description, variant: 'success' });
  }, [showNotification]);

  const showError = useCallback((title: string, description: string) => {
    showNotification({ title, description, variant: 'error' });
  }, [showNotification]);

  const showWarning = useCallback((title: string, description: string) => {
    showNotification({ title, description, variant: 'warning' });
  }, [showNotification]);

  const showInfo = useCallback((title: string, description: string) => {
    showNotification({ title, description, variant: 'info' });
  }, [showNotification]);

  return {
    notification,
    isOpen,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};