import React, { useState, useEffect } from "react";
import StatsCards from "@/components/dashboard/StatsCards";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import InteractiveCharts from "@/components/dashboard/InteractiveCharts";
import Layout from "@/components/layout/Layout";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/hooks/use-notification";
import NotificationModal from "@/components/ui/notification-modal";

const Index = () => {
  const { isDefaultPassword, markPasswordChanged } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
  const [dismissBanner, setDismissBanner] = useState(false);
  const { notification, isOpen, showSuccess, showWarning, hideNotification } = useNotification();

  // Não abrir modal automaticamente; apenas exibir aviso opcional
  useEffect(() => {
    // Quando o usuário decidir, ele pode abrir o modal pelo banner
  }, []);

  const handlePasswordChanged = () => {
    setShowPasswordModal(false);
    markPasswordChanged();
    showSuccess(
      'Senha alterada com sucesso!',
      'Sua senha foi alterada com segurança. Agora você pode usar o sistema normalmente.'
    );
  };

  const handleSkipPassword = () => {
    setShowSkipConfirmation(true);
  };

  const confirmSkipPassword = () => {
    setShowPasswordModal(false);
    setShowSkipConfirmation(false);
    markPasswordChanged();
    showWarning(
      'Troca de senha adiada',
      'Lembre-se de alterar sua senha padrão o quanto antes por questões de segurança.'
    );
  };

  const cancelSkipPassword = () => {
    setShowSkipConfirmation(false);
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="w-full space-y-6 animate-fade-in">
          {/* Aviso para senha padrão, sem bloquear uso */}
          {isDefaultPassword && !dismissBanner && (
            <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 p-4 text-yellow-900">
              <div className="flex items-center justify-between">
                <p className="text-sm">
                  Atenção: você está usando uma senha padrão. Por segurança, altere quando possível.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center rounded-md bg-yellow-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-yellow-700"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    Alterar senha
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center rounded-md border border-yellow-300 px-3 py-1.5 text-sm font-medium text-yellow-900 hover:bg-yellow-100"
                    onClick={() => setDismissBanner(true)}
                  >
                    Agora não
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Cabeçalho da Página */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground font-heading mb-2">
              Dashboard - Sistema de Protocolo
            </h1>
            <p className="text-foreground-secondary">
              Visão geral das atividades e indicadores do sistema
            </p>
          </div>

          {/* Cards de Estatísticas */}
          <StatsCards />

          {/* Gráficos Interativos */}
          <InteractiveCharts />

          {/* Layout com duas colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ações Rápidas - 2 colunas */}
            <div className="lg:col-span-2">
              <QuickActions />
            </div>
            
            {/* Atividades Recentes - 1 coluna */}
            <div className="lg:col-span-1">
              <RecentActivity />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Troca de Senha */}
      <ChangePasswordModal
        show={showPasswordModal}
        onHide={() => setShowPasswordModal(false)}
        onPasswordChanged={handlePasswordChanged}
      />

      {/* Modal de Confirmação para Pular Troca de Senha */}
      {showSkipConfirmation && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={cancelSkipPassword} />

          {/* Modal */}
          <div className="relative z-50 flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md rounded-lg border bg-card text-card-foreground shadow-lg">
              <div className="flex items-center justify-between border-b p-6">
                <h3 className="text-xl font-semibold">Confirmar Ação</h3>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Tem certeza de que deseja pular a troca de senha? 
                </p>
                <p className="text-sm text-destructive font-medium">
                  ⚠️ Manter a senha padrão pode comprometer a segurança da sua conta.
                </p>
                <p className="text-sm text-muted-foreground">
                  Recomendamos fortemente que você altere sua senha agora.
                </p>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={cancelSkipPassword}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    onClick={cancelSkipPassword}
                  >
                    Alterar Agora
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
                    onClick={confirmSkipPassword}
                  >
                    Pular Mesmo Assim
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Notificação */}
      {notification && (
        <NotificationModal
          isOpen={isOpen}
          onClose={hideNotification}
          title={notification.title}
          description={notification.description}
          variant={notification.variant}
        />
      )}
    </Layout>
  );
};

export default Index;
