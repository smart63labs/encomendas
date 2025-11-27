# Dados Mockados para Calendário de Prazos

Este arquivo contém dados mockados especificamente criados para testar e demonstrar o componente `CalendarioPrazos`. Os dados incluem prazos distribuídos estrategicamente ao longo do tempo para testar todas as funcionalidades do calendário.

## 📁 Arquivos

- `mock-prazos-calendario.ts` - Dados mockados e funções utilitárias
- `../examples/CalendarioExample.tsx` - Exemplo completo de uso

## 🎯 Características dos Dados Mockados

### Distribuição Temporal
Os dados incluem prazos distribuídos em:
- **Hoje**: 2 prazos (1 em andamento, 1 pendente)
- **Amanhã**: 1 prazo pendente
- **Esta semana**: 3 prazos (variados status)
- **Próxima semana**: 2 prazos pendentes
- **Este mês**: 3 prazos pendentes
- **Próximo mês**: 2 prazos pendentes
- **Prazos vencidos**: 2 prazos para testar alertas
- **Prazos concluídos**: 2 prazos para histórico
- **Prazos futuros**: 3 prazos para visualização anual

### Status dos Prazos
- `pendente` - Prazos ainda não iniciados
- `em_andamento` - Prazos sendo executados
- `concluido` - Prazos finalizados com sucesso
- `vencido` - Prazos que passaram da data limite

### Níveis de Prioridade
- `alta` - Prazos críticos e urgentes
- `media` - Prazos importantes mas não críticos
- `baixa` - Prazos de menor urgência

## 🚀 Como Usar

### Importação Básica
```typescript
import { mockPrazosCalendario } from '@/data/mock-prazos-calendario';
import CalendarioPrazos from '@/components/calendario/CalendarioPrazos';

// Uso básico
<CalendarioPrazos 
  prazos={mockPrazosCalendario} 
  onPrazoClick={(prazo) => console.log(prazo)}
/>
```

### Filtragem por Período
```typescript
import { getPrazosPorPeriodo } from '@/data/mock-prazos-calendario';

// Obter prazos específicos
const prazosHoje = getPrazosPorPeriodo('hoje');
const prazosSemana = getPrazosPorPeriodo('semana');
const prazosMes = getPrazosPorPeriodo('mes');
const prazosVencidos = getPrazosPorPeriodo('vencidos');
const prazosConcluidos = getPrazosPorPeriodo('concluidos');
```

### Estatísticas
```typescript
import { getEstatisticasPrazos } from '@/data/mock-prazos-calendario';

const stats = getEstatisticasPrazos();
console.log(stats);
// Retorna:
// {
//   total: 20,
//   porStatus: {
//     pendentes: 12,
//     emAndamento: 4,
//     concluidos: 2,
//     vencidos: 2
//   },
//   porPrioridade: {
//     alta: 8,
//     media: 8,
//     baixa: 4
//   }
// }
```

## 📊 Visualizações Testadas

### Visualização Diária
- Mostra todos os prazos de um dia específico
- Cards detalhados com status e prioridade
- Informações do responsável

### Visualização Semanal
- Grade de 7 dias com prazos distribuídos
- Destaque para o dia atual
- Limite de 3 prazos por dia (com contador de extras)

### Visualização Mensal
- Calendário completo do mês
- Prazos em miniatura
- Navegação entre meses

### Visualização Anual
- 12 cards representando os meses
- Estatísticas por mês
- Contadores por status
- Clique para navegar para o mês

## 🎨 Funcionalidades Demonstradas

### Interatividade
- **Clique em prazos**: Todos os prazos são clicáveis
- **Navegação**: Botões para navegar entre períodos
- **Filtros**: Diferentes tipos de visualização
- **Responsividade**: Layout adaptável

### Indicadores Visuais
- **Badges de status**: Cores diferentes para cada status
- **Badges de prioridade**: Indicação visual da urgência
- **Destaque do dia atual**: Fundo diferenciado
- **Prazos vencidos**: Alertas visuais em vermelho

### Dados Realistas
- **Nomes brasileiros**: Responsáveis com nomes típicos
- **Descrições contextuais**: Cenários reais de trabalho
- **Datas distribuídas**: Cobertura de diferentes períodos
- **Variedade de status**: Todos os estados possíveis

## 🔧 Personalização

### Adicionando Novos Prazos
```typescript
const novoPrazo: Prazo = {
  id: "prazo-custom-1",
  titulo: "Meu Novo Prazo",
  descricao: "Descrição detalhada",
  dataVencimento: "2024-12-31",
  status: "pendente",
  responsavel: "Nome do Responsável",
  prioridade: "alta",
  notificado: false
};

const prazosPersonalizados = [...mockPrazosCalendario, novoPrazo];
```

### Modificando Datas
```typescript
// A função getDate() facilita a criação de datas relativas
const getDate = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

// Exemplos:
getDate(0);   // Hoje
getDate(1);   // Amanhã
getDate(-1);  // Ontem
getDate(7);   // Próxima semana
```

## 📝 Exemplo Completo

Veja o arquivo `../examples/CalendarioExample.tsx` para um exemplo completo que inclui:
- Implementação do componente
- Modal de detalhes
- Cards de estatísticas
- Diferentes filtros
- Instruções de uso

## 🧪 Casos de Teste Cobertos

✅ **Visualização Diária**
- Dias com múltiplos prazos
- Dias sem prazos
- Dia atual destacado

✅ **Visualização Semanal**
- Semanas com prazos distribuídos
- Overflow de prazos (mais de 3 por dia)
- Navegação entre semanas

✅ **Visualização Mensal**
- Meses com diferentes quantidades de prazos
- Navegação entre meses
- Dias de outros meses

✅ **Visualização Anual**
- Distribuição ao longo do ano
- Estatísticas por mês
- Navegação para visualização mensal

✅ **Estados dos Prazos**
- Todos os status possíveis
- Todas as prioridades
- Prazos vencidos e concluídos

✅ **Interações**
- Cliques em prazos
- Navegação temporal
- Mudança de visualização

## 🎯 Próximos Passos

Para usar em produção:
1. Substitua `mockPrazosCalendario` pelos dados reais da API
2. Implemente a função `onPrazoClick` conforme necessário
3. Adicione validações e tratamento de erros
4. Configure notificações para prazos vencidos
5. Implemente funcionalidades de edição inline