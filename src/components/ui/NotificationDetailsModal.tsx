import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, User, MapPin, Calendar, AlertTriangle } from "lucide-react";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import NotificationModal from "./notification-modal";
import { useNotification } from "@/hooks/use-notification";
import { useModuleTheme } from "@/lib/theme-config";

interface NotificationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: Notification | null;
  // Quando fornecido, abre o modal de confirmação em vez de confirmar direto
  onConfirmReceipt?: () => void;
}

export const NotificationDetailsModal: React.FC<NotificationDetailsModalProps> = ({
  isOpen,
  onClose,
  notification,
  onConfirmReceipt,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const { confirmReceipt } = useNotifications();
  const { notification: appNotification, isOpen: isNotifOpen, showSuccess, showError, hideNotification } = useNotification();
  const { applyTheme } = useModuleTheme('encomendas');

  const handleConfirmReceipt = async () => {
    // Se o callback foi fornecido, delega para abrir o modal de confirmação
    if (onConfirmReceipt) {
      onConfirmReceipt();
      return;
    }

    if (!notification) return;

    setIsConfirming(true);
    
    try {
      const result = await confirmReceipt(notification.id);
      
      if (result.success) {
        onClose();
        showSuccess('Recebimento confirmado', 'A encomenda foi marcada como entregue.');
      } else {
        showError('Erro ao confirmar recebimento', result.error || 'Tente novamente mais tarde.');
      }
    } catch (error) {
      console.error('Erro ao confirmar recebimento:', error);
      showError('Erro inesperado', 'Ocorreu um erro ao confirmar o recebimento.');
    } finally {
      setIsConfirming(false);
    }
  };

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

  const getStatusBadgeVariant = (status: string) => {
    const s = String(status || '').toLowerCase();
    // Apenas dois estados visíveis: entregue e em_transito
    return s === 'entregue' ? 'default' : 'secondary';
  };

  const getStatusLabel = (status: string) => {
    const s = String(status || '').toLowerCase();
    return s === 'entregue' ? 'Entregue' : 'Em Trânsito';
  };

  if (!notification) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Confirmar Recebimento de Encomenda
          </DialogTitle>
          <DialogDescription>
            Confirme o recebimento da encomenda abaixo. Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações da Encomenda */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                Encomenda #{notification.numeroEncomenda}
              </h3>
              <div className="flex gap-2">
                <Badge variant={getStatusBadgeVariant(notification.status)}>
                  {getStatusLabel(notification.status)}
                </Badge>
                {notification.urgente && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Urgente
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Package className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Descrição:</p>
                  <p className="text-sm text-gray-600">{notification.descricao}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Remetente:</p>
                  <p className="text-sm text-gray-600">
                    {notification.remetenteNome} - {notification.remetenteMatricula}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Setor de Origem:</p>
                  <p className="text-sm text-gray-600">{notification.setorOrigemNome}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Data de Criação:</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(notification.dataCriacao)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Aviso */}
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Atenção!</p>
                <p className="text-yellow-700">
                  Ao confirmar o recebimento, o status da encomenda será alterado para "Entregue" 
                  e esta ação não poderá ser desfeita.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isConfirming}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmReceipt}
            disabled={isConfirming}
            className="bg-[#18489A] text-white hover:opacity-90"
          >
            {onConfirmReceipt ? "Confirmar Recebimento" : (isConfirming ? "Confirmando..." : "Confirmar Recebimento")}
          </Button>
        </DialogFooter>

        {appNotification && (
          <NotificationModal
            isOpen={isNotifOpen}
            onClose={hideNotification}
            title={appNotification.title}
            description={appNotification.description}
            variant={appNotification.variant}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NotificationDetailsModal;