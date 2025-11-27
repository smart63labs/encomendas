import { FileText, FolderOpen, Send, Package, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, handleApiError } from "@/lib/api";

type EncomendaStats = {
  total: number;
  emTransito: number;
  entreguesHoje: number;
  pendentes: number;
  urgentes: number;
};

const StatsCards = () => {
  const navigate = useNavigate();
  const [encomendaStats, setEncomendaStats] = useState<EncomendaStats>({
    total: 0,
    emTransito: 0,
    entreguesHoje: 0,
    pendentes: 0,
    urgentes: 0,
  });

  useEffect(() => {
    let es: EventSource | null = null;

    const fetchStats = async () => {
      try {
        const resp = await api.getEncomendaStats();
        const raw = resp?.data?.data;
        const data = raw?.data ?? raw; // compat com sendSuccess envelopado
        const stats = {
          total: Number(data?.total) || 0,
          emTransito: Number(data?.emTransito) || 0,
          entreguesHoje: Number(data?.entreguesHoje) || 0,
          pendentes: Number(data?.pendentes) || 0,
          urgentes: Number(data?.urgentes) || 0,
        } as EncomendaStats;
        setEncomendaStats(stats);
      } catch (error) {
        console.error("Erro ao carregar estatísticas de encomendas:", error);
      }
    };

    // Carregar inicialmente
    fetchStats();

    // Assinar SSE para reagir a criação/edição/exclusão/entrega
    try {
      es = api.subscribeEncomendas(() => {
        fetchStats();
      }, (err) => {
        console.error("Erro SSE em encomendas:", err);
      });
    } catch (error) {
      console.error("Falha ao assinar SSE de encomendas:", handleApiError(error));
    }

    return () => {
      if (es) {
        try { es.close(); } catch { /* noop */ }
      }
    };
  }, []);

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case "positive":
        return "text-accent-green";
      case "negative":
        return "text-accent-red";
      case "warning":
        return "text-accent-orange";
      default:
        return "text-foreground-muted";
    }
  };

  const statsData = [
    {
      title: "Documentos Hoje",
      value: "147",
      change: "+12%",
      changeType: "positive" as const,
      icon: FileText,
      description: "Novos protocolos registrados",
      route: "/documentos",
    },
    {
      title: "Processos Ativos",
      value: "89",
      change: "+5%",
      changeType: "positive" as const,
      icon: FolderOpen,
      description: "Em tramitação",
      route: "/processos",
    },
    {
      title: "Tramitações Pendentes",
      value: "23",
      change: "-8%",
      changeType: "negative" as const,
      icon: Send,
      description: "Aguardando recebimento",
      route: "/tramitacao",
    },
    {
      title: "Encomendas em Trânsito",
      value: String(encomendaStats.emTransito),
      change: "+18%",
      changeType: "positive" as const,
      icon: Package,
      description: "Malotes e encomendas",
      route: "/encomendas",
    },
    {
      title: "Prazos Vencendo",
      value: "7",
      change: "2 hoje",
      changeType: "warning" as const,
      icon: Clock,
      description: "Próximos 7 dias",
      route: "/prazos",
    },
    {
      title: "Taxa de Eficiência",
      value: "94%",
      change: "+2%",
      changeType: "positive" as const,
      icon: TrendingUp,
      description: "Processos no prazo",
      route: "/processos",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={index} 
            className="card-govto hover:shadow-lg transition-smooth hover-scale animate-fade-in cursor-pointer"
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => handleCardClick(stat.route)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground-secondary">
                {stat.title}
              </CardTitle>
              <Icon className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline space-x-2">
                <div className="text-3xl font-bold text-foreground font-heading">
                  {stat.value}
                </div>
                <span className={`text-sm font-medium ${getChangeColor(stat.changeType)}`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-xs text-foreground-muted mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsCards;