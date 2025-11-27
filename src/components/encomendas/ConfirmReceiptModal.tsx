import React, { useEffect, useState } from 'react';
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
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import NotificationModal from "@/components/ui/notification-modal";
import { useNotification } from "@/hooks/use-notification";
import { QrCode, Hash, Info, AlertCircle, Package, User, MapPin, Building2, Clock, Calendar, AlertTriangle } from "lucide-react";
import {
  getStatusColor,
  getStatusLabel,
  getTipoColor,
  getTipoLabel,
  getPrioridadeColor,
  getPrioridadeLabel,
  getEntregaColor,
} from "@/utils/badge-colors";
import { api } from "@/lib/api";
import { formatMatriculaVinculo } from "@/lib/utils";
import { useModuleTheme } from "@/lib/theme-config";
import { getEnderecoSetor } from '@/services/setores.service';

interface ConfirmReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: Notification | null;
}

export const ConfirmReceiptModal: React.FC<ConfirmReceiptModalProps> = ({
  isOpen,
  onClose,
  notification
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const { confirmReceipt } = useNotifications();
  const { notification: appNotification, isOpen: isNotifOpen, showSuccess, showError, hideNotification } = useNotification();
  const { applyTheme } = useModuleTheme('encomendas');

  // Endereços dos setores (cache simples)
  const [enderecoSetorOrigem, setEnderecoSetorOrigem] = useState<string>('Carregando endereço...');
  const [enderecoSetorDestino, setEnderecoSetorDestino] = useState<string>('');
  const [detalhes, setDetalhes] = useState<any | null>(null);

  // Buscar endereço de setores quando abrir
  useEffect(() => {
    // Endereço do setor de origem via notification
    if (isOpen && notification?.setorOrigemNome) {
      getEnderecoSetor(notification.setorOrigemNome).then(setEnderecoSetorOrigem);
    } else {
      setEnderecoSetorOrigem('Endereço não disponível');
    }

    // Carregar detalhes completos da encomenda para preencher destino
    const carregarDetalhes = async () => {
      if (!isOpen || !notification?.id) {
        setDetalhes(null);
        setEnderecoSetorDestino('');
        return;
      }
      try {
        const resp = await api.getEncomendaById(String(notification.id));
        const raw = (resp as any)?.data?.data?.data || (resp as any)?.data?.data || {};
        const mapped = {
          remetente: raw.remetente || raw.REMETENTE || '',
          remetenteMatricula: raw.remetenteMatricula || raw.remetente_matricula || '',
          remetenteVinculo: raw.remetenteVinculo || raw.remetente_vinculo || '',
          destinatario: raw.destinatario || raw.DESTINATARIO || '',
          destinatarioMatricula: raw.destinatarioMatricula || raw.destinatario_matricula || '',
          destinatarioVinculo: raw.destinatarioVinculo || raw.destinatario_vinculo || '',
          setorDestino: raw.setorDestino || raw.SETOR_DESTINO || raw.destino || '',
          descricao: raw.descricao || raw.DESCRICAO || '',
          observacoes: raw.observacoes || raw.OBSERVACOES || raw.observations || ''
        };
        setDetalhes(mapped);

        if (mapped.setorDestino) {
          const end = await getEnderecoSetor(mapped.setorDestino);
          setEnderecoSetorDestino(end);
        } else {
          setEnderecoSetorDestino('Endereço não disponível');
        }
      } catch (err) {
        console.error('Erro ao carregar detalhes da encomenda:', err);
        setDetalhes(null);
        setEnderecoSetorDestino('Endereço não disponível');
      }
    };

    carregarDetalhes();
  }, [isOpen, notification]);

  const handleConfirmReceipt = async () => {
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

  const normalizeStatus = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'em_transito') return 'transito';
    if (s === 'recebido') return 'entregue';
    return s;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'pendente': 'Pendente',
      'postado': 'Postado',
      'em_transito': 'Em Trânsito',
      'entregue': 'Entregue',
      'devolvido': 'Devolvido'
    };
    return statusMap[status] || status;
  };

  if (!notification) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirmar Recebimento de Encomenda</DialogTitle>
          <DialogDescription>
            Informações completas da encomenda
          </DialogDescription>
        </DialogHeader>

        {notification && (
          <div className="space-y-2">
            {/* Informações Básicas */}
            <div className="bg-gray-50 p-2 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Informações Básicas
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                <div className="max-w-[200px]">
                  <label className="font-medium text-muted-foreground flex items-center gap-1">
                    <QrCode className="w-3 h-3" />
                    Código
                  </label>
                  <p className="font-mono text-nowrap text-xs">{notification.numeroEncomenda || '-'}</p>
                </div>
                <div className="ml-8">
                  <label className="font-medium text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Status
                  </label>
                  <div>
                    <Badge className={`text-xs ${getStatusColor(normalizeStatus(notification.status))}`}>
                      {getStatusLabel(normalizeStatus(notification.status))}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="font-medium text-muted-foreground flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    Tipo
                  </label>
                  <Badge className={getTipoColor('encomenda')}>
                    {getTipoLabel('encomenda')}
                  </Badge>
                </div>
                <div>
                  <label className="font-medium text-muted-foreground flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Prioridade
                  </label>
                  <div>
                    <Badge className={`text-xs ${getPrioridadeColor(notification.urgente ? 'urgente' : 'normal')}`}>
                      {getPrioridadeLabel(notification.urgente ? 'urgente' : 'normal')}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Datas */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Datas
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Envio
                  </label>
                  <p className="text-sm font-medium">{formatDate(notification.dataCriacao)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    Entrega
                  </label>
                  <div className="text-sm font-medium">
                    {false ? (
                      <Badge className={getEntregaColor('' as any)}>{/* nunca cai aqui */}</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600">Não entregue</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Remetente e Destinatário */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <User className="w-3 h-3" />
                Remetente e Destinatário
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Origem */}
                <div className="bg-green-50 border border-green-200 p-2 rounded-lg">
                  <h5 className="text-xs font-semibold text-green-800 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    🏢 Origem
                  </h5>
                  <div className="mb-2">
                    <label className="text-xs font-medium text-green-700 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Remetente
                    </label>
                    <p className="text-xs font-medium text-green-900">{notification.remetenteNome}</p>
                    <p className="text-xs text-green-600">Mat: {formatMatriculaVinculo({ matricula: detalhes?.remetenteMatricula || notification.remetenteMatricula, vinculo_funcional: detalhes?.remetenteVinculo }) || (notification.remetenteMatricula || '-')}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-green-700 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      Setor
                    </label>
                    <p className="text-xs font-medium text-green-900">{notification.setorOrigemNome}</p>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-green-500" />
                      <p className="text-xs text-green-600">{enderecoSetorOrigem && enderecoSetorOrigem !== 'Carregando endereço...' ? enderecoSetorOrigem.split(',').slice(-2).join(',').trim() : 'Carregando...'}</p>
                    </div>
                  </div>
                </div>

                {/* Destino */}
                <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg">
                  <h5 className="text-xs font-semibold text-blue-800 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    🎯 Destino
                  </h5>
                  <div className="mb-2">
                    <label className="text-xs font-medium text-blue-700 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Destinatário
                    </label>
                    <p className="text-xs font-medium text-blue-900">{detalhes?.destinatario || 'N/A'}</p>
                    <p className="text-xs text-blue-600">Mat: {formatMatriculaVinculo({ matricula: detalhes?.destinatarioMatricula, vinculo_funcional: detalhes?.destinatarioVinculo }) || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-blue-700 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      Setor
                    </label>
                    <p className="text-xs font-medium text-blue-900">{detalhes?.setorDestino || 'N/A'}</p>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-blue-500" />
                      <p className="text-xs text-blue-600">{enderecoSetorDestino ? enderecoSetorDestino : 'Endereço não disponível'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Descrição e Observações */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div className="bg-gray-50 p-2 rounded-lg">
                <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  Descrição
                </h4>
                <p className="text-xs text-gray-800 break-words">
                  {detalhes?.descricao || notification.descricao || 'Nenhuma descrição fornecida.'}
                </p>
              </div>
              {detalhes?.observacoes && detalhes.observacoes.trim() !== '' && (
                <div className="bg-gray-50 p-2 rounded-lg">
                  <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Observações
                  </h4>
                  <p className="text-xs text-gray-800 break-words">
                    {detalhes.observacoes}
                  </p>
                </div>
              )}
            </div>

            {/* Mapa removido conforme solicitado */}

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
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isConfirming}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmReceipt} disabled={isConfirming} className="bg-[#18489A] text-white hover:opacity-90">
            {isConfirming ? 'Confirmando...' : 'Confirmar Recebimento'}
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