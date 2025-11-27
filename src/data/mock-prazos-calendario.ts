import type { Prazo } from "@/lib/mock-backend";

// Função auxiliar para gerar datas
const getDate = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

// Dados mockados para o componente CalendarioPrazos
export const mockPrazosCalendario: Prazo[] = [
  // Prazos para hoje
  {
    id: "prazo-hoje-1",
    titulo: "Entrega de Relatório Mensal",
    descricao: "Relatório de atividades do mês anterior deve ser entregue até hoje",
    dataVencimento: getDate(0),
    status: "em_andamento",
    responsavel: "Maria Silva",
    prioridade: "alta",
    notificado: true
  },
  {
    id: "prazo-hoje-2",
    titulo: "Revisão de Contratos",
    descricao: "Análise e revisão dos contratos pendentes",
    dataVencimento: getDate(0),
    status: "pendente",
    responsavel: "João Santos",
    prioridade: "media",
    notificado: false
  },
  
  // Prazos para amanhã
  {
    id: "prazo-amanha-1",
    titulo: "Reunião com Fornecedores",
    descricao: "Apresentação de propostas para novo contrato",
    dataVencimento: getDate(1),
    status: "pendente",
    responsavel: "Ana Costa",
    prioridade: "alta",
    notificado: true
  },
  
  // Prazos para esta semana
  {
    id: "prazo-semana-1",
    titulo: "Auditoria Interna",
    descricao: "Preparação de documentos para auditoria",
    dataVencimento: getDate(3),
    status: "em_andamento",
    responsavel: "Carlos Oliveira",
    prioridade: "alta",
    notificado: true
  },
  {
    id: "prazo-semana-2",
    titulo: "Treinamento de Equipe",
    descricao: "Capacitação em novos procedimentos",
    dataVencimento: getDate(5),
    status: "pendente",
    responsavel: "Lucia Ferreira",
    prioridade: "media",
    notificado: false
  },
  {
    id: "prazo-semana-3",
    titulo: "Atualização do Sistema",
    descricao: "Implementação de melhorias no sistema",
    dataVencimento: getDate(6),
    status: "em_andamento",
    responsavel: "Pedro Almeida",
    prioridade: "baixa",
    notificado: true
  },
  
  // Prazos para próxima semana
  {
    id: "prazo-proxima-semana-1",
    titulo: "Licitação Pública",
    descricao: "Abertura do processo licitatório",
    dataVencimento: getDate(10),
    status: "pendente",
    responsavel: "Roberto Lima",
    prioridade: "alta",
    notificado: false
  },
  {
    id: "prazo-proxima-semana-2",
    titulo: "Inventário de Materiais",
    descricao: "Contagem e catalogação de materiais",
    dataVencimento: getDate(12),
    status: "pendente",
    responsavel: "Sandra Rocha",
    prioridade: "media",
    notificado: false
  },
  
  // Prazos para este mês
  {
    id: "prazo-mes-1",
    titulo: "Fechamento Contábil",
    descricao: "Consolidação das informações contábeis",
    dataVencimento: getDate(20),
    status: "pendente",
    responsavel: "Fernando Dias",
    prioridade: "alta",
    notificado: false
  },
  {
    id: "prazo-mes-2",
    titulo: "Planejamento Estratégico",
    descricao: "Definição de metas para próximo trimestre",
    dataVencimento: getDate(25),
    status: "pendente",
    responsavel: "Mariana Souza",
    prioridade: "media",
    notificado: false
  },
  {
    id: "prazo-mes-3",
    titulo: "Manutenção Preventiva",
    descricao: "Verificação de equipamentos e sistemas",
    dataVencimento: getDate(28),
    status: "pendente",
    responsavel: "Gustavo Pereira",
    prioridade: "baixa",
    notificado: false
  },
  
  // Prazos para próximo mês
  {
    id: "prazo-proximo-mes-1",
    titulo: "Renovação de Licenças",
    descricao: "Processo de renovação de licenças operacionais",
    dataVencimento: getDate(35),
    status: "pendente",
    responsavel: "Beatriz Martins",
    prioridade: "alta",
    notificado: false
  },
  {
    id: "prazo-proximo-mes-2",
    titulo: "Avaliação de Desempenho",
    descricao: "Ciclo de avaliação de desempenho dos funcionários",
    dataVencimento: getDate(40),
    status: "pendente",
    responsavel: "Ricardo Gomes",
    prioridade: "media",
    notificado: false
  },
  
  // Prazos vencidos (para testar visualização)
  {
    id: "prazo-vencido-1",
    titulo: "Relatório Trimestral",
    descricao: "Relatório que deveria ter sido entregue na semana passada",
    dataVencimento: getDate(-5),
    status: "vencido",
    responsavel: "Claudia Nunes",
    prioridade: "alta",
    notificado: true
  },
  {
    id: "prazo-vencido-2",
    titulo: "Atualização de Cadastros",
    descricao: "Atualização que estava pendente há 10 dias",
    dataVencimento: getDate(-10),
    status: "vencido",
    responsavel: "Marcos Ribeiro",
    prioridade: "media",
    notificado: true
  },
  
  // Prazos concluídos
  {
    id: "prazo-concluido-1",
    titulo: "Backup de Dados",
    descricao: "Backup mensal dos dados do sistema",
    dataVencimento: getDate(-2),
    status: "concluido",
    responsavel: "Thiago Barbosa",
    prioridade: "alta",
    notificado: true
  },
  {
    id: "prazo-concluido-2",
    titulo: "Capacitação em Segurança",
    descricao: "Treinamento sobre normas de segurança",
    dataVencimento: getDate(-7),
    status: "concluido",
    responsavel: "Vanessa Torres",
    prioridade: "media",
    notificado: true
  },
  
  // Prazos distribuídos para visualização anual
  {
    id: "prazo-futuro-1",
    titulo: "Planejamento Orçamentário",
    descricao: "Elaboração do orçamento para próximo ano",
    dataVencimento: getDate(60),
    status: "pendente",
    responsavel: "Helena Castro",
    prioridade: "alta",
    notificado: false
  },
  {
    id: "prazo-futuro-2",
    titulo: "Revisão de Políticas",
    descricao: "Atualização das políticas internas",
    dataVencimento: getDate(90),
    status: "pendente",
    responsavel: "Daniel Moreira",
    prioridade: "media",
    notificado: false
  },
  {
    id: "prazo-futuro-3",
    titulo: "Certificação ISO",
    descricao: "Processo de certificação de qualidade",
    dataVencimento: getDate(120),
    status: "pendente",
    responsavel: "Isabela Cardoso",
    prioridade: "alta",
    notificado: false
  }
];

// Função para filtrar prazos por período
export const getPrazosPorPeriodo = (periodo: 'hoje' | 'semana' | 'mes' | 'vencidos' | 'concluidos') => {
  const hoje = new Date();
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - hoje.getDay());
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 6);
  
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  
  return mockPrazosCalendario.filter(prazo => {
    const dataPrazo = new Date(prazo.dataVencimento);
    
    switch (periodo) {
      case 'hoje':
        return dataPrazo.toDateString() === hoje.toDateString();
      case 'semana':
        return dataPrazo >= inicioSemana && dataPrazo <= fimSemana;
      case 'mes':
        return dataPrazo >= inicioMes && dataPrazo <= fimMes;
      case 'vencidos':
        return prazo.status === 'vencido';
      case 'concluidos':
        return prazo.status === 'concluido';
      default:
        return true;
    }
  });
};

// Função para obter estatísticas dos prazos
export const getEstatisticasPrazos = () => {
  const total = mockPrazosCalendario.length;
  const pendentes = mockPrazosCalendario.filter(p => p.status === 'pendente').length;
  const emAndamento = mockPrazosCalendario.filter(p => p.status === 'em_andamento').length;
  const concluidos = mockPrazosCalendario.filter(p => p.status === 'concluido').length;
  const vencidos = mockPrazosCalendario.filter(p => p.status === 'vencido').length;
  
  const altaPrioridade = mockPrazosCalendario.filter(p => p.prioridade === 'alta').length;
  const mediaPrioridade = mockPrazosCalendario.filter(p => p.prioridade === 'media').length;
  const baixaPrioridade = mockPrazosCalendario.filter(p => p.prioridade === 'baixa').length;
  
  return {
    total,
    porStatus: {
      pendentes,
      emAndamento,
      concluidos,
      vencidos
    },
    porPrioridade: {
      alta: altaPrioridade,
      media: mediaPrioridade,
      baixa: baixaPrioridade
    }
  };
};