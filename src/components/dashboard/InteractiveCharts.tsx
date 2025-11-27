import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Activity } from "lucide-react";

// Dados simulados para os gráficos
const documentosData = [
  { mes: "Jan", documentos: 120, processos: 45, tramitacoes: 78 },
  { mes: "Fev", documentos: 135, processos: 52, tramitacoes: 85 },
  { mes: "Mar", documentos: 147, processos: 48, tramitacoes: 92 },
  { mes: "Abr", documentos: 162, processos: 61, tramitacoes: 88 },
  { mes: "Mai", documentos: 158, processos: 55, tramitacoes: 95 },
  { mes: "Jun", documentos: 171, processos: 63, tramitacoes: 102 }
];

const encomendasData = [
  { dia: "Seg", entregues: 23, pendentes: 12, transito: 8 },
  { dia: "Ter", entregues: 31, pendentes: 15, transito: 12 },
  { dia: "Qua", entregues: 28, pendentes: 9, transito: 15 },
  { dia: "Qui", entregues: 35, pendentes: 18, transito: 10 },
  { dia: "Sex", entregues: 42, pendentes: 14, transito: 7 },
  { dia: "Sab", entregues: 18, pendentes: 6, transito: 4 },
  { dia: "Dom", entregues: 12, pendentes: 3, transito: 2 }
];

const departamentosData = [
  { name: "Jurídico", value: 35, color: "#3b82f6" },
  { name: "Administrativo", value: 28, color: "#10b981" },
  { name: "Financeiro", value: 22, color: "#f59e0b" },
  { name: "RH", value: 15, color: "#ef4444" }
];

const eficienciaData = [
  { semana: "S1", eficiencia: 92 },
  { semana: "S2", eficiencia: 88 },
  { semana: "S3", eficiencia: 94 },
  { semana: "S4", eficiencia: 91 },
  { semana: "S5", eficiencia: 96 },
  { semana: "S6", eficiencia: 89 }
];

const InteractiveCharts = () => {
  const [periodo, setPeriodo] = useState("6meses");

  return (
    <div className="space-y-6">
      {/* Controles de Período */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground font-heading">
          Análise de Dados
        </h2>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecionar período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7dias">Últimos 7 dias</SelectItem>
            <SelectItem value="30dias">Últimos 30 dias</SelectItem>
            <SelectItem value="6meses">Últimos 6 meses</SelectItem>
            <SelectItem value="1ano">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="documentos" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="documentos" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="encomendas" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Encomendas
          </TabsTrigger>
          <TabsTrigger value="departamentos" className="flex items-center gap-2">
            <PieChartIcon className="w-4 h-4" />
            Departamentos
          </TabsTrigger>
          <TabsTrigger value="eficiencia" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Eficiência
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Documentos e Processos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={documentosData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="documentos" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Documentos"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="processos" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Processos"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tramitacoes" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name="Tramitações"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="encomendas">
          <Card>
            <CardHeader>
              <CardTitle>Status de Encomendas por Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={encomendasData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="entregues" fill="#10b981" name="Entregues" />
                  <Bar dataKey="pendentes" fill="#f59e0b" name="Pendentes" />
                  <Bar dataKey="transito" fill="#3b82f6" name="Em Trânsito" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departamentos">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Departamento</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={departamentosData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {departamentosData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eficiencia">
          <Card>
            <CardHeader>
              <CardTitle>Taxa de Eficiência Semanal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={eficienciaData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semana" />
                  <YAxis domain={[80, 100]} />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="eficiencia" 
                    stroke="#10b981" 
                    fill="#10b981"
                    fillOpacity={0.3}
                    name="Eficiência (%)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InteractiveCharts;