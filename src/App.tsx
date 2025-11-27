import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Documentos from "./pages/Documentos";
import Processos from "./pages/Processos";
import Encomendas from "./pages/Encomendas";
import Prazos from "./pages/Prazos";
import Arquivo from "./pages/Arquivo";
import Tramitacao from "./pages/Tramitacao";
import Relatorios from "./pages/Relatorios";

import { Configuracoes } from "./pages/Configuracoes";
import ConfigSetor from "./pages/ConfigSetor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Rota pública de login */}
              <Route path="/login" element={<Login />} />
              
              {/* Rotas protegidas */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/documentos" element={
                <ProtectedRoute>
                  <Documentos />
                </ProtectedRoute>
              } />
              <Route path="/processos" element={
                <ProtectedRoute>
                  <Processos />
                </ProtectedRoute>
              } />
              <Route path="/encomendas" element={
                <ProtectedRoute>
                  <Encomendas />
                </ProtectedRoute>
              } />
              <Route path="/prazos" element={
                <ProtectedRoute>
                  <Prazos />
                </ProtectedRoute>
              } />
              <Route path="/arquivo" element={
                <ProtectedRoute>
                  <Arquivo />
                </ProtectedRoute>
              } />
              <Route path="/tramitacao" element={
                <ProtectedRoute>
                  <Tramitacao />
                </ProtectedRoute>
              } />
              <Route path="/relatorios" element={
                <ProtectedRoute>
                  <Relatorios />
                </ProtectedRoute>
              } />

              <Route path="/configuracoes" element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <Configuracoes />
                </ProtectedRoute>
              } />
              <Route path="/configuracoes/setor" element={
                <ProtectedRoute allowedRoles={["USER"]}>
                  <ConfigSetor />
                </ProtectedRoute>
              } />
              
              {/* Rota 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
            <Sonner />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
