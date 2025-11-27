import { 
  FileText, 
  FolderOpen, 
  Send, 
  Package, 
  BarChart3, 
  Archive,
  Clock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
  activeModule?: string;
  onModuleChange?: (module: string) => void;
}

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: BarChart3,
    description: "Visão geral do sistema",
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100",
    activeBgColor: "bg-blue-600"
  },
  {
    id: "documentos",
    label: "Documentos",
    icon: FileText,
    description: "Cadastro e gestão de documentos",
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 hover:bg-cyan-100",
    activeBgColor: "bg-cyan-600"
  },
  {
    id: "processos",
    label: "Processos",
    icon: FolderOpen,
    description: "Gestão de processos administrativos",
    color: "text-orange-600",
    bgColor: "bg-orange-50 hover:bg-orange-100",
    activeBgColor: "bg-orange-600"
  },
  {
    id: "tramitacao",
    label: "Tramitação",
    icon: Send,
    description: "Controle de tramitação interna",
    color: "text-purple-600",
    bgColor: "bg-purple-50 hover:bg-purple-100",
    activeBgColor: "bg-purple-600"
  },
  {
    id: "encomendas",
    label: "Encomendas",
    icon: Package,
    description: "Módulo de encomendas e malotes",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 hover:bg-indigo-100",
    activeBgColor: "bg-indigo-600"
  },
  {
    id: "arquivo",
    label: "Arquivo",
    icon: Archive,
    description: "Gestão eletrônica de documentos",
    color: "text-gray-600",
    bgColor: "bg-gray-50 hover:bg-gray-100",
    activeBgColor: "bg-gray-600"
  },
  {
    id: "prazos",
    label: "Prazos",
    icon: Clock,
    description: "Controle de prazos e vencimentos",
    color: "text-lime-600",
    bgColor: "bg-lime-50 hover:bg-lime-100",
    activeBgColor: "bg-lime-600"
  },
  {
    id: "relatorios",
    label: "Relatórios",
    icon: BarChart3,
    description: "Relatórios e análises",
    color: "text-amber-600",
    bgColor: "bg-amber-50 hover:bg-amber-100",
    activeBgColor: "bg-amber-600"
  }
];

const Sidebar = ({ activeModule = "dashboard", onModuleChange }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside className={cn(
      "bg-white shadow-card transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className="p-4">
        {/* Toggle Button */}
        <div className="flex justify-end mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            
            if (isCollapsed) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onModuleChange?.(item.id)}
                      className={cn(
                        "w-full flex items-center justify-center p-2 rounded-lg transition-smooth",
                        isActive 
                          ? `${item.activeBgColor} text-white shadow-sm` 
                          : `${item.bgColor} transition-colors`
                      )}
                    >
                      <Icon className={cn(
                        "w-12 h-12",
                        isActive ? "text-white" : item.color
                      )} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            }
            
            return (
              <button
                key={item.id}
                onClick={() => onModuleChange?.(item.id)}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-smooth",
                  isActive 
                    ? `${item.activeBgColor} text-white shadow-sm` 
                    : `${item.bgColor} transition-colors`
                )}
              >
                <Icon className={cn(
                  "w-12 h-12 flex-shrink-0",
                  isActive ? "text-white" : item.color
                )} />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    isActive ? "text-white" : "text-gray-900"
                  )}>
                    {item.label}
                  </p>
                  <p className={cn(
                    "text-xs truncate",
                    isActive ? "text-white/80" : "text-gray-600"
                  )}>
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;