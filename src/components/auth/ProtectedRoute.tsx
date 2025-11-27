import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';


interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // Optional role gating
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Redirecionar para login se não estiver autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role-based gating when allowedRoles provided
  if (allowedRoles && allowedRoles.length > 0) {
    // Normalizar comparação para UPPERCASE alinhado com valores do banco (ex.: 'ADMIN')
    const userRole = (user?.role || user?.perfil || '').toString().toUpperCase();
    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());
    const isAllowed = !!userRole && normalizedAllowed.includes(userRole);
    if (!isAllowed) {
      // Se usuário autenticado porém sem permissão, redirecionar para página inicial
      return <Navigate to="/" replace />;
    }
  }

  // Renderizar conteúdo autenticado
  return <>{children}</>;
};

export default ProtectedRoute;