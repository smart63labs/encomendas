import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export interface Notification {
  id: number;
  numeroEncomenda: string;
  descricao: string;
  status: string;
  dataCriacao: string;
  urgente: boolean;
  remetenteNome: string;
  remetenteMatricula: string;
  // Opcional: algumas respostas da API já trazem o vínculo do remetente
  remetenteVinculo?: string;
  setorOrigemNome: string;
}

export interface NotificationsResponse {
  data: Notification[];
  count: number;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/encomendas/notifications/${user.id}`);
      // A API retorna { success: true, data: { data: [...], count: number }, message: string }
      const apiResponse = response.data;
      const notificationsData = apiResponse?.data?.data;
      if (Array.isArray(notificationsData)) {
        setNotifications(notificationsData);
      } else {
        console.warn('Resposta da API não contém um array válido:', apiResponse);
        setNotifications([]);
      }
    } catch (err: any) {
      console.error('Erro ao buscar notificações:', err);
      setError('Erro ao carregar notificações');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const confirmReceipt = useCallback(async (encomendaId: number) => {
    try {
      await api.put(`/encomendas/${encomendaId}/confirm-receipt`);
      
      // Remove a notificação da lista após confirmação
      setNotifications(prev => prev.filter(notification => notification.id !== encomendaId));
      
      return { success: true };
    } catch (err: any) {
      console.error('Erro ao confirmar recebimento:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || 'Erro ao confirmar recebimento' 
      };
    }
  }, []);

  const getNotificationCount = useCallback(() => {
    return notifications.length;
  }, [notifications]);

  const getUrgentNotificationCount = useCallback(() => {
    return notifications.filter(notification => notification.urgente).length;
  }, [notifications]);

  const confirmAllReceipts = useCallback(async () => {
    const ids = notifications.map(n => n.id);
    if (!ids.length) return { success: true, processed: 0 };
    try {
      const results = await Promise.allSettled(ids.map(id => api.put(`/encomendas/${id}/confirm-receipt`)));
      const succeededIds: number[] = [];
      const failed: { id: number; error: string }[] = [];
      results.forEach((r, idx) => {
        const id = ids[idx];
        if (r.status === 'fulfilled') {
          succeededIds.push(id);
        } else {
          const reason: any = (r as any).reason;
          failed.push({ id, error: reason?.response?.data?.message || 'Falha ao confirmar' });
        }
      });
      if (succeededIds.length) {
        setNotifications(prev => prev.filter(n => !succeededIds.includes(n.id)));
      }
      return { success: failed.length === 0, processed: succeededIds.length, failed };
    } catch (err: any) {
      return { success: false, processed: 0, failed: [{ id: 0, error: err?.message || 'Erro inesperado' }] };
    }
  }, [notifications]);

  // Buscar notificações quando o usuário estiver logado
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id, fetchNotifications]);

  // Polling para atualizar notificações a cada 30 segundos
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [user?.id, fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    fetchNotifications,
    confirmReceipt,
    confirmAllReceipts,
    getNotificationCount,
    getUrgentNotificationCount,
    refetch: fetchNotifications
  };
};
