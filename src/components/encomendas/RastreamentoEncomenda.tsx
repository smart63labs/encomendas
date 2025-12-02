import { useState } from "react";
import { Search, Package, MapPin, Calendar, Clock, User, Truck, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useNotification } from '@/hooks/use-notification';
import NotificationModal from '@/components/ui/notification-modal';
import type { Encomenda, mapearStatus } from "@/types/encomenda.types";
import { getStatusColor, getStatusLabel } from "@/utils/badge-colors";

const RastreamentoEncomenda = () => {
  const { notification, isOpen, showError, showSuccess, showInfo, showWarning, hideNotification } = useNotification();
  const [codigoRastreamento, setCodigoRastreamento] = useState("");
  const [dadosRastreamento, setDadosRastreamento] = useState<Encomenda | null>(null);
  const [loading, setLoading] = useState(false);



  const handleRastrear = async () => {
    if (!codigoRastreamento.trim()) {
      showError("Código obrigatório", "Por favor, digite um código para rastrear.");
      return;
    }

    setLoading(true);
    
    try {
      // Buscar todas as encomendas da API real
      const response = await api.getEncomendas();
      
      if (response.data.success && response.data.data) {
        const encomendas = response.data.data;
        const encomendaEncontrada = encomendas.find((e: any) => 
          e.codigo === codigoRastreamento.trim() || 
          e.codigoRastreamento === codigoRastreamento.trim() ||
          e.numeroEncomenda === codigoRastreamento.trim()
        );
        
        if (encomendaEncontrada) {
          // Mapear status do backend para frontend
          const statusMapeado = mapearStatus(encomendaEncontrada.status);
          const encomendaMapeada = {
            ...encomendaEncontrada,
            status: statusMapeado
          };
          
          setDadosRastreamento(encomendaMapeada);
          showInfo("Encomenda encontrada!", `Status: ${getStatusLabel(statusMapeado)}`);
        } else {
          setDadosRastreamento(null);
          showError("Encomenda não encontrada", "Verifique o código informado e tente novamente.");
        }
      } else {
        setDadosRastreamento(null);
        showError("Erro ao buscar encomendas", "Não foi possível acessar os dados das encomendas.");
      }
    } catch (error) {
      console.error('Erro ao rastrear encomenda:', error);
      showError("Erro ao rastrear", "Ocorreu um erro inesperado. Tente novamente.");
      setDadosRastreamento(null);
    } finally {
      setLoading(false);
    }
  };

  // Usar a função de mapeamento importada

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pendente": return "Pendente";
      case "preparando": return "Preparando";
      case "transito": return "Em Trânsito";
      case "entregue": return "Entregue";
      case "devolvido": return "Devolvido";
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "cadastrada":
      case "encomenda cadastrada":
        return <Package className="w-4 h-4 text-primary" />;
      case "saiu para entrega":
      case "em trânsito":
        return <Truck className="w-4 h-4 text-accent-orange" />;
      case "entregue":
        return <CheckCircle className="w-4 h-4 text-accent-green" />;
      case "tentativa de entrega":
        return <Clock className="w-4 h-4 text-accent-red" />;
      default:
        return <MapPin className="w-4 h-4 text-foreground-muted" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulário de Rastreamento */}
      <Card className="card-govto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Rastreamento de Encomendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Digite o código da encomenda ou código de rastreamento..."
                value={codigoRastreamento}
                onChange={(e) => setCodigoRastreamento(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-foreground-muted mt-2">
                Ex: EN-2024-001246 ou BR987654321TO
              </p>
            </div>
            <Button 
              onClick={handleRastrear}
              disabled={!codigoRastreamento || loading}
              className="btn-govto-primary"
            >
              {loading ? "Rastreando..." : "Rastrear"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados do Rastreamento */}
      {dadosRastreamento && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações da Encomenda */}
          <div className="lg:col-span-1">
            <Card className="card-govto">
              <CardHeader>
                <CardTitle className="text-lg">Dados da Encomenda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-foreground-secondary font-medium">Protocolo</p>
                  <p className="text-lg font-bold text-primary font-heading">
                    {dadosRastreamento.codigo}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground-secondary">Status:</span>
                    <Badge className={getStatusColor(dadosRastreamento.status)}>
                      {getStatusLabel(dadosRastreamento.status)}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground-secondary">Tipo:</span>
                    <span className="text-sm font-medium">{dadosRastreamento.tipo}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground-secondary">Prioridade:</span>
                    <span className="text-sm font-medium">{dadosRastreamento.prioridade}</span>
                  </div>

                  {dadosRastreamento.peso && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground-secondary">Peso:</span>
                      <span className="text-sm font-medium">{dadosRastreamento.peso}kg</span>
                    </div>
                  )}

                  {dadosRastreamento.valorDeclarado && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground-secondary">Valor:</span>
                      <span className="text-sm font-medium">R$ {dadosRastreamento.valorDeclarado.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-foreground-muted" />
                      <div>
                        <p className="text-xs text-foreground-secondary">Remetente</p>
                        <p className="text-sm font-medium">{dadosRastreamento.remetente}</p>
                        {dadosRastreamento.setorOrigem && (
                          <p className="text-xs text-foreground-muted">{dadosRastreamento.setorOrigem}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-foreground-muted" />
                      <div>
                        <p className="text-xs text-foreground-secondary">Destinatário</p>
                        <p className="text-sm font-medium">{dadosRastreamento.destinatario}</p>
                        <p className="text-xs text-foreground-muted">{dadosRastreamento.setorDestino}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-foreground-muted" />
                    <div>
                      <p className="text-xs text-foreground-secondary">Data de Envio</p>
                      <p className="text-sm font-medium">
                        {new Date(dadosRastreamento.dataEnvio).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(dadosRastreamento.dataEnvio).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Data de Entrega */}
                  <div className="flex items-center gap-2 mt-3">
                    <Package className="w-4 h-4 text-foreground-muted" />
                    <div>
                      <p className="text-xs text-foreground-secondary">Data de Entrega</p>
                      <p className="text-sm font-medium">
                        {dadosRastreamento.dataEntrega ? (
                          <>
                            {new Date(dadosRastreamento.dataEntrega).toLocaleDateString('pt-BR')} às{' '}
                            {new Date(dadosRastreamento.dataEntrega).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </>
                        ) : (
                          <span className="text-foreground-muted">Não entregue</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detalhes da Encomenda */}
          <div className="lg:col-span-2">
            <Card className="card-govto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Detalhes da Encomenda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground-secondary">Código de Rastreamento</p>
                    <p className="text-lg font-mono bg-muted px-3 py-2 rounded">
                      {dadosRastreamento.codigoRastreamento}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground-secondary">Status Atual</p>
                    <Badge className={getStatusColor(dadosRastreamento.status)} size="lg">
                      {getStatusIcon(dadosRastreamento.status)}
                      <span className="ml-2">{getStatusLabel(dadosRastreamento.status)}</span>
                    </Badge>
                  </div>
                </div>

                {(dadosRastreamento.numeroAR || dadosRastreamento.numeroMalote || dadosRastreamento.numeroLacre) && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-foreground mb-3">Identificador</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {dadosRastreamento.numeroAR && (
                        <div>
                          <p className="text-xs text-foreground-secondary">AR</p>
                          <p className="text-sm font-mono">{dadosRastreamento.numeroAR}</p>
                        </div>
                      )}
                      {dadosRastreamento.numeroMalote && (
                        <div>
                          <p className="text-xs text-foreground-secondary">Malote</p>
                          <p className="text-sm font-mono">{dadosRastreamento.numeroMalote}</p>
                        </div>
                      )}
                      {dadosRastreamento.numeroLacre && (
                        <div>
                          <p className="text-xs text-foreground-secondary">Lacre</p>
                          <p className="text-sm font-mono">{dadosRastreamento.numeroLacre}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-medium text-foreground mb-3">Descrição do Conteúdo</h4>
                  <p className="text-sm text-foreground-secondary bg-muted p-3 rounded">
                    {dadosRastreamento.descricao}
                  </p>
                  {dadosRastreamento.observacoes && (
                    <div className="mt-3">
                      <h5 className="font-medium text-foreground-secondary text-sm mb-2">Observações</h5>
                      <p className="text-sm text-foreground-muted">
                        {dadosRastreamento.observacoes}
                      </p>
                    </div>
                  )}
                </div>
                
                {(dadosRastreamento.dimensoes || dadosRastreamento.peso || dadosRastreamento.valorDeclarado) && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-foreground mb-3">Informações Físicas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {dadosRastreamento.dimensoes && (
                        <div>
                          <p className="text-xs text-foreground-secondary">Dimensões</p>
                          <p className="text-sm font-medium">{dadosRastreamento.dimensoes}</p>
                        </div>
                      )}
                      {dadosRastreamento.peso && (
                        <div>
                          <p className="text-xs text-foreground-secondary">Peso</p>
                          <p className="text-sm font-medium">{dadosRastreamento.peso} kg</p>
                        </div>
                      )}
                      {dadosRastreamento.valorDeclarado && (
                        <div>
                          <p className="text-xs text-foreground-secondary">Valor Declarado</p>
                          <p className="text-sm font-medium">R$ {dadosRastreamento.valorDeclarado.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Estado sem resultados */}
      {dadosRastreamento === null && codigoRastreamento && !loading && (
        <Card className="card-govto">
          <CardContent className="text-center py-12">
            <Package className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Encomenda não encontrada
            </h3>
            <p className="text-foreground-secondary">
              Verifique o código informado e tente novamente.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      {!dadosRastreamento && (
        <Card className="card-govto">
          <CardHeader>
            <CardTitle className="text-lg">Como Rastrear sua Encomenda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Códigos Aceitos:</h4>
                <ul className="space-y-2 text-sm text-foreground-secondary">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    Protocolo interno (Ex: EN-2024-001246)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-accent-orange rounded-full"></div>
                    Código dos Correios (Ex: BR123456789TO)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-accent-green rounded-full"></div>
                    QR Code da encomenda
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Informações Disponíveis:</h4>
                <ul className="space-y-2 text-sm text-foreground-secondary">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent-green" />
                    Status atual da encomenda
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent-green" />
                    Histórico completo de movimentações
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent-green" />
                    Previsão de entrega
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RastreamentoEncomenda;
