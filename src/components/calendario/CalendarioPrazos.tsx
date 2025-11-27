import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import type { Prazo } from "@/lib/mock-backend";

interface CalendarioPrazosProps {
  prazos: Prazo[];
  onPrazoClick?: (prazo: Prazo) => void;
}

type ViewType = 'diario' | 'semanal' | 'mensal' | 'anual';

const CalendarioPrazos = ({ prazos, onPrazoClick }: CalendarioPrazosProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('mensal');

  // Funções de navegação
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (viewType) {
      case 'diario':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'semanal':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'mensal':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'anual':
        newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Função para obter prazos de uma data específica
  const getPrazosForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return prazos.filter(prazo => {
      const prazoDate = new Date(prazo.dataVencimento).toISOString().split('T')[0];
      return prazoDate === dateStr;
    });
  };

  // Função para obter badge de status
  const getStatusBadge = (status: string, size: 'sm' | 'xs' = 'xs') => {
    const className = size === 'xs' ? 'text-xs px-1 py-0.5' : '';
    switch (status) {
      case "vencido":
        return <Badge className={`bg-red-500 text-white ${className}`}><AlertTriangle className="w-2 h-2 mr-1" />Vencido</Badge>;
      case "em_andamento":
        return <Badge className={`bg-blue-500 text-white ${className}`}><Clock className="w-2 h-2 mr-1" />Em Andamento</Badge>;
      case "concluido":
        return <Badge className={`bg-green-500 text-white ${className}`}><CheckCircle className="w-2 h-2 mr-1" />Concluído</Badge>;
      default:
        return <Badge className={`bg-gray-500 text-white ${className}`}><Clock className="w-2 h-2 mr-1" />Pendente</Badge>;
    }
  };

  // Renderização da visualização diária
  const renderDailyView = () => {
    const dayPrazos = getPrazosForDate(currentDate);
    
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">
            {currentDate.toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
        </div>
        
        <div className="space-y-2">
          {dayPrazos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum prazo para este dia
            </div>
          ) : (
            dayPrazos.map(prazo => (
              <Card key={prazo.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onPrazoClick?.(prazo)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{prazo.titulo}</h4>
                      <p className="text-sm text-gray-600">{prazo.descricao}</p>
                      <p className="text-xs text-gray-500 mt-1">Responsável: {prazo.responsavel}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(prazo.status, 'sm')}
                      <Badge className={prazo.prioridade === 'alta' ? 'bg-red-100 text-red-800' : prazo.prioridade === 'media' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                        {prazo.prioridade}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  };

  // Renderização da visualização semanal
  const renderWeeklyView = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push(date);
    }

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">
            Semana de {weekDays[0].toLocaleDateString('pt-BR')} a {weekDays[6].toLocaleDateString('pt-BR')}
          </h3>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
            <div key={day} className="text-center font-medium p-2 bg-gray-50 rounded">
              {day}
            </div>
          ))}
          
          {weekDays.map((date, index) => {
            const dayPrazos = getPrazosForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <div key={index} className={`min-h-32 p-2 border rounded ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
                <div className={`text-sm font-medium mb-2 ${isToday ? 'text-blue-600' : ''}`}>
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayPrazos.slice(0, 3).map(prazo => (
                    <div key={prazo.id} className="text-xs p-1 bg-gray-100 rounded cursor-pointer hover:bg-gray-200" onClick={() => onPrazoClick?.(prazo)}>
                      <div className="font-medium truncate">{prazo.titulo}</div>
                      <div className="flex items-center gap-1">
                        {getStatusBadge(prazo.status)}
                      </div>
                    </div>
                  ))}
                  {dayPrazos.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">+{dayPrazos.length - 3} mais</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Renderização da visualização mensal
  const renderMonthlyView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);
    
    while (current <= lastDay || days.length % 7 !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">
            {currentDate.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' })}
          </h3>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div key={day} className="text-center font-medium p-2 bg-gray-50">
              {day}
            </div>
          ))}
          
          {days.map((date, index) => {
            const dayPrazos = getPrazosForDate(date);
            const isCurrentMonth = date.getMonth() === month;
            const isToday = date.toDateString() === new Date().toDateString();
            
            return (
              <div key={index} className={`min-h-24 p-1 border ${
                isToday ? 'bg-blue-50 border-blue-200' : 
                isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
              }`}>
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                  {date.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayPrazos.slice(0, 2).map(prazo => (
                    <div key={prazo.id} className="text-xs p-0.5 bg-gray-100 rounded cursor-pointer hover:bg-gray-200" onClick={() => onPrazoClick?.(prazo)}>
                      <div className="truncate font-medium">{prazo.titulo}</div>
                    </div>
                  ))}
                  {dayPrazos.length > 2 && (
                    <div className="text-xs text-gray-500 text-center">+{dayPrazos.length - 2}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Renderização da visualização anual
  const renderYearlyView = () => {
    const year = currentDate.getFullYear();
    const months = [];
    
    for (let i = 0; i < 12; i++) {
      months.push(new Date(year, i, 1));
    }

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">{year}</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {months.map((month, index) => {
            const monthPrazos = prazos.filter(prazo => {
              const prazoDate = new Date(prazo.dataVencimento);
              return prazoDate.getFullYear() === year && prazoDate.getMonth() === index;
            });
            
            return (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                setCurrentDate(new Date(year, index, 1));
                setViewType('mensal');
              }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {month.toLocaleDateString('pt-BR', { month: 'long' })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold text-center mb-2">{monthPrazos.length}</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Vencidos:</span>
                      <span className="text-red-600">{monthPrazos.filter(p => p.status === 'vencido').length}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Em andamento:</span>
                      <span className="text-blue-600">{monthPrazos.filter(p => p.status === 'em_andamento').length}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Concluídos:</span>
                      <span className="text-green-600">{monthPrazos.filter(p => p.status === 'concluido').length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCurrentView = () => {
    switch (viewType) {
      case 'diario':
        return renderDailyView();
      case 'semanal':
        return renderWeeklyView();
      case 'mensal':
        return renderMonthlyView();
      case 'anual':
        return renderYearlyView();
      default:
        return renderMonthlyView();
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles do Calendário */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        <Select value={viewType} onValueChange={(value: ViewType) => setViewType(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="diario">Diário</SelectItem>
            <SelectItem value="semanal">Semanal</SelectItem>
            <SelectItem value="mensal">Mensal</SelectItem>
            <SelectItem value="anual">Anual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Visualização do Calendário */}
      <Card>
        <CardContent className="p-6">
          {renderCurrentView()}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarioPrazos;