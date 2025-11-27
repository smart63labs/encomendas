import { FileText, Send, Package, Clock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { getStatusColor, getStatusLabel } from "@/utils/badge-colors";

const recentActivities = [
  {
    id: 1,
    type: "documento",
    title: "Ofício 2024/001 - Solicitação de Material",
    description: "Documento protocolado por João Silva",
    time: "2 minutos atrás",
    status: "novo",
    icon: FileText
  },
  {
    id: 2,
    type: "tramitacao",
    title: "Processo 2024/0045",
    description: "Tramitado para Departamento Jurídico",
    time: "15 minutos atrás", 
    status: "tramitado",
    icon: Send
  },
  {
    id: 3,
    type: "encomenda",
    title: "Malote Externo ME-2024-089",
    description: "Entregue para Maria Santos",
    time: "1 hora atrás",
    status: "entregue",
    icon: Package
  },
  {
    id: 4,
    type: "processo",
    title: "Processo 2024/0038",
    description: "Prazo vencendo em 2 dias",
    time: "2 horas atrás",
    status: "urgente",
    icon: Clock
  },
  {
    id: 5,
    type: "usuario",
    title: "Novo usuário cadastrado",
    description: "Carlos Oliveira - Setor Administrativo",
    time: "3 horas atrás",
    status: "info",
    icon: User
  }
];

const RecentActivity = () => {
  const navigate = useNavigate();

  const getRouteByType = (type: string) => {
    switch (type) {
      case "documento":
        return "/documentos";
      case "tramitacao":
        return "/tramitacao";
      case "encomenda":
        return "/encomendas";
      case "processo":
        return "/processos";
      case "usuario":
        return "/usuarios";
      default:
        return "/";
    }
  };

  const handleActivityClick = (type: string) => {
    const route = getRouteByType(type);
    navigate(route);
  };

  return (
    <Card className="card-govto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-foreground font-heading">
          <Clock className="w-5 h-5 text-primary" />
          <span>Atividades Recentes</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div 
                key={activity.id} 
                className="flex items-start space-x-4 p-3 rounded-lg hover:bg-muted/30 transition-smooth cursor-pointer"
                onClick={() => handleActivityClick(activity.type)}
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground truncate">
                      {activity.title}
                    </p>
                    <Badge className={`ml-2 text-xs ${getStatusColor(activity.status)}`}>
                      {getStatusLabel(activity.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground-secondary">
                    {activity.description}
                  </p>
                  <p className="text-xs text-foreground-muted mt-1">
                    {activity.time}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;