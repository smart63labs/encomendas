import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determinar módulo ativo baseado na rota atual
  const getActiveModule = () => {
    const path = location.pathname;
    if (path === "/documentos") return "documentos";
    if (path === "/processos") return "processos";
    if (path === "/tramitacao") return "tramitacao";
    if (path === "/encomendas") return "encomendas";
    if (path === "/arquivo") return "arquivo";
    if (path === "/prazos") return "prazos";
    if (path === "/relatorios") return "relatorios";
    if (path === "/usuarios") return "usuarios";
    if (path === "/configuracoes") return "configuracoes";
    return "dashboard";
  };

  const [activeModule, setActiveModule] = useState(getActiveModule());

  // Atualizar módulo ativo quando a rota mudar
  useEffect(() => {
    setActiveModule(getActiveModule());
  }, [location.pathname]);

  const handleModuleChange = (module: string) => {
    setActiveModule(module);
    
    // Navegação para as rotas
    switch (module) {
      case "documentos":
        navigate("/documentos");
        break;
      case "processos":
        navigate("/processos");
        break;
      case "encomendas":
        navigate("/encomendas");
        break;
      case "prazos":
        navigate("/prazos");
        break;
      case "arquivo":
        navigate("/arquivo");
        break;
      case "tramitacao":
        navigate("/tramitacao");
        break;
      case "relatorios":
        navigate("/relatorios");
        break;
      case "usuarios":
        navigate("/usuarios");
        break;
      case "configuracoes":
        navigate("/configuracoes");
        break;
      case "dashboard":
        navigate("/");
        break;
      default:
        navigate("/");
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      <Header />
      <div className="flex-1 overflow-y-auto">
        <div className="flex pt-16">
          <Sidebar 
            activeModule={activeModule} 
            onModuleChange={handleModuleChange}
          />
          <div className="flex-1 flex flex-col">
            <main className="flex-1 flex flex-col">
              <div className="flex-1">
                {children}
              </div>
            </main>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
