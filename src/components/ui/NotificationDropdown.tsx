import React, { useState } from 'react';
import { 
  Bell, 
  Package, 
  User, 
  MapPin, 
  Calendar, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { type Notification } from "@/hooks/useNotifications";
import { getPrioridadeColor, getStatusColor } from '@/utils/badge-colors';
import { formatMatriculaVinculo } from '@/lib/utils';
import { api } from '@/lib/api';

interface NotificationDropdownProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onReceiveAll?: () => void | Promise<void>;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onNotificationClick,
  onReceiveAll
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalItems = notifications.length;
  const currentNotification = notifications[currentIndex];
  const [fullRemetenteMatricula, setFullRemetenteMatricula] = useState<string>('');

  // Reset index quando as notificações mudarem
  React.useEffect(() => {
    if (notifications.length > 0 && currentIndex >= notifications.length) {
      setCurrentIndex(0);
    }
  }, [notifications.length, currentIndex]);

  // Garantir exibição de matrícula completa do remetente (matricula-vinculo)
  React.useEffect(() => {
    if (!currentNotification) {
      setFullRemetenteMatricula('');
      return;
    }
    const baseMat = currentNotification.remetenteMatricula;
    const vincLocal = (currentNotification as any)?.remetenteVinculo || (currentNotification as any)?.remetente_vinculo || '';
    const formattedLocal = formatMatriculaVinculo({ matricula: baseMat, vinculo_funcional: vincLocal });
    if (vincLocal && formattedLocal) {
      setFullRemetenteMatricula(formattedLocal);
      return;
    }
    (async () => {
      try {
        const resp = await api.getEncomendaById(String(currentNotification.id));
        const raw = (resp as any)?.data?.data?.data || (resp as any)?.data?.data || {};
        const mat = raw.remetenteMatricula || raw.remetente_matricula || baseMat;
        const vinc = raw.remetenteVinculo || raw.remetente_vinculo || raw.VINCULO_FUNCIONAL || raw.vinculo_funcional || '';
        const formatted = formatMatriculaVinculo({ matricula: mat, vinculo_funcional: vinc });
        setFullRemetenteMatricula(formatted || mat || baseMat);
      } catch (e) {
        setFullRemetenteMatricula(baseMat || '');
      }
    })();
  }, [currentNotification]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Função para obter variante do badge de status usando as cores do sistema
  const getStatusBadgeVariant = (status: string) => {
    const s = String(status || '').toLowerCase();
    // Normalizar para apenas dois estados visíveis
    return getStatusColor(s === 'entregue' ? 'entregue' : 'em_transito');
  };

  // Função para obter cor do badge de urgência usando as cores do sistema
  const getUrgentBadgeColor = () => {
    return getPrioridadeColor('urgente');
  };

  const getStatusLabel = (status: string) => {
    const s = String(status || '').toLowerCase();
    return s === 'entregue' ? 'Entregue' : 'Em Trânsito';
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="w-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Bell className="h-5 w-5 text-[#18489A]" />
          Notificações
          {notifications.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {notifications.length}
            </Badge>
          )}
        </h3>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma notificação</p>
          </div>
        ) : (
          <div className="p-2">
            {/* Exibir apenas a notificação atual */}
            {currentNotification && (
              <Card 
                key={currentNotification.id}
                className="cursor-pointer hover:bg-gray-50 transition-colors border-l-4 border-[#18489A]"
                onClick={() => onNotificationClick(currentNotification)}
              >
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {/* Cabeçalho no padrão do modal com badges abaixo do número */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-3 h-3" />
                        <span className="font-medium text-muted-foreground text-xs">Código</span>
                      </div>
                      <p className="font-mono text-nowrap text-xs mb-2">{currentNotification.numeroEncomenda || '-'}</p>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={getStatusBadgeVariant(currentNotification.status)} 
                          className={`text-xs ${getStatusBadgeVariant(currentNotification.status)}`}
                        >
                          {getStatusLabel(currentNotification.status)}
                        </Badge>
                        {currentNotification.urgente && (
                          <Badge className={`text-xs flex items-center gap-1 ${getUrgentBadgeColor()}`}>
                            <AlertTriangle className="h-3 w-3" />
                            Urgente
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Bloco de informações no padrão do modal (sem Descrição) */}
                    <div className="bg-gray-50 p-2 rounded-lg space-y-2">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Remetente:</p>
                          <p className="text-sm text-gray-600">
                            {currentNotification.remetenteNome} - {fullRemetenteMatricula || currentNotification.remetenteMatricula}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Setor de Origem:</p>
                          <p className="text-sm text-gray-600">{currentNotification.setorOrigemNome}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Data de Criação:</p>
                          <p className="text-sm text-gray-600">{formatDate(currentNotification.dataCriacao)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Navegação por ícones no padrão dos pop-ups - sempre visível */}
      {totalItems > 0 && (
        <div className="p-3 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 w-7 p-0 text-[#18489A] hover:bg-[#18489A]/10 ${(currentIndex === 0 || totalItems <= 1) ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
              disabled={currentIndex === 0 || totalItems <= 1}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>

            <span className="text-xs text-gray-600 font-medium">
              {currentIndex + 1} de {totalItems}
            </span>

            <Button
              variant="ghost"
              size="sm"
              className={`h-7 w-7 p-0 text-[#18489A] hover:bg-[#18489A]/10 ${(currentIndex === totalItems - 1 || totalItems <= 1) ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => setCurrentIndex(prev => Math.min(prev + 1, totalItems - 1))}
              disabled={currentIndex === totalItems - 1 || totalItems <= 1}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              variant="default"
              size="sm"
              className="bg-[#18489A] text-white hover:opacity-90"
              onClick={() => onReceiveAll && onReceiveAll()}
            >
              Receber todas
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
