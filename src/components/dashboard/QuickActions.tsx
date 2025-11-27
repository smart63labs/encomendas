import { Plus, FileText, FolderOpen, Send, Package, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useModuleTheme } from "@/lib/theme-config";
import { useNavigate } from "react-router-dom";

const quickActions = [
  {
    id: "novo-documento",
    label: "Novo Documento",
    description: "Registrar entrada de documento",
    icon: FileText,
    color: "btn-govto-primary",
    route: "/documentos"
  },
  {
    id: "novo-processo",
    label: "Novo Processo",
    description: "Abrir processo administrativo",
    icon: FolderOpen,
    color: "btn-govto-orange",
    route: "/processos"
  },
  {
    id: "enviar-malote",
    label: "Enviar Malote",
    description: "Criar nova encomenda",
    icon: Package,
    color: "btn-govto-secondary",
    route: "/encomendas"
  },
  {
    id: "tramitar",
    label: "Tramitar",
    description: "Enviar para outro setor",
    icon: Send,
    color: "btn-govto-primary",
    route: "/tramitacao"
  },
  {
    id: "digitalizar",
    label: "Digitalizar",
    description: "Upload de documentos",
    icon: Upload,
    color: "btn-govto-orange",
    route: "/documentos"
  }
];

const QuickActions = () => {
  const { classes } = useModuleTheme('dashboard');
  const navigate = useNavigate();

  const handleActionClick = (route: string) => {
    navigate(route);
  };
  return (
    <Card className="card-govto animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-foreground font-heading">
          <Plus className="w-5 h-5 text-primary" />
          <span>Ações Rápidas</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                className={`h-auto p-4 flex flex-col items-center space-y-2 transition-smooth hover-scale micro-bounce animate-fade-in ${classes.card} ${classes.cardBorder} ${classes.hover}`}
                style={{ animationDelay: `${(index + 1) * 150}ms` }}
                onClick={() => handleActionClick(action.route)}
              >
                <Icon className={`w-6 h-6 ${classes.text}`} />
                <div className="text-center">
                  <p className={`font-medium text-sm ${classes.text}`}>{action.label}</p>
                  <p className={`text-xs ${classes.textSecondary}`}>{action.description}</p>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;