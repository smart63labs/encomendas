// Script para migrar dados mockados para o banco Oracle
const axios = require('axios');

// URL base da API
const API_BASE = 'http://localhost:3001/api';

const endpoints = {
  users: `${API_BASE}/users`,
  processes: `${API_BASE}/processes`,
  documentos: `${API_BASE}/documentos`,
  tramitacoes: `${API_BASE}/tramitacoes`,
  encomendas: `${API_BASE}/encomendas`,
  prazos: `${API_BASE}/prazos`
};

// Dados mockados extraídos do frontend
const mockData = {
  usuarios: [
    {
      nome: 'João Silva',
      email: 'joao.silva@sefaz.to.gov.br',
      cargo: 'Analista Administrativo',
      departamento: 'Administrativo',
      ativo: true,
      permissoes: ['visualizar', 'editar'],
      dataCriacao: '2024-01-15'
    },
    {
      nome: 'Maria Santos',
      email: 'maria.santos@sefaz.to.gov.br',
      cargo: 'Coordenadora Financeira',
      departamento: 'Financeiro',
      ativo: true,
      permissoes: ['visualizar', 'editar', 'aprovar'],
      dataCriacao: '2024-02-10'
    },
    {
      nome: 'Carlos Mendes',
      email: 'carlos.mendes@sefaz.to.gov.br',
      cargo: 'Advogado',
      departamento: 'Jurídico',
      ativo: true,
      permissoes: ['visualizar', 'editar', 'aprovar'],
      dataCriacao: '2024-01-20'
    },
    {
      nome: 'Ana Paula Costa',
      email: 'ana.costa@sefaz.to.gov.br',
      cargo: 'Gerente de RH',
      departamento: 'Recursos Humanos',
      ativo: true,
      permissoes: ['visualizar', 'editar', 'aprovar', 'admin'],
      dataCriacao: '2024-01-10'
    },
    {
      nome: 'Roberto Lima',
      email: 'roberto.lima@sefaz.to.gov.br',
      cargo: 'Auditor Interno',
      departamento: 'Auditoria',
      ativo: true,
      permissoes: ['visualizar', 'editar'],
      dataCriacao: '2024-03-01'
    }
  ],

  processos: [
    {
      numero: '2024.001.000123',
      tipo: 'licitacao',
      assunto: 'Licitação para contratação de serviços de limpeza',
      interessado: 'Departamento Administrativo',
      responsavel: 'João Silva',
      dataAbertura: '2024-10-15',
      prazoLimite: '2024-12-15',
      status: 'em_andamento',
      fase: 'Análise de propostas',
      progresso: 65,
      prioridade: 'alta',
      volumes: 2,
      observacoes: 'Processo em fase de análise das propostas recebidas'
    },
    {
      numero: '2024.001.000124',
      tipo: 'administrativa',
      assunto: 'Solicitação de licença para construção',
      interessado: 'Empresa XYZ Ltda',
      responsavel: 'Ana Paula Costa',
      dataAbertura: '2024-11-01',
      prazoLimite: '2024-12-01',
      status: 'em_andamento',
      fase: 'Análise técnica',
      progresso: 30,
      prioridade: 'media',
      volumes: 1,
      observacoes: 'Aguardando documentação complementar'
    },
    {
      numero: '2024.001.000125',
      tipo: 'contrato',
      assunto: 'Renovação de contrato de fornecimento de material de escritório',
      interessado: 'Departamento de Compras',
      responsavel: 'Maria Santos',
      dataAbertura: '2024-11-05',
      status: 'concluido',
      fase: 'Finalizado',
      progresso: 100,
      prioridade: 'baixa',
      volumes: 1,
      observacoes: 'Contrato renovado por mais 12 meses'
    }
  ],

  documentos: [
    {
      nome: 'Documento de Exemplo.txt',
      tipo: 'text/plain',
      extensao: '.txt',
      tamanho: 2048,
      categoria: 'Geral',
      descricao: 'Documento de texto de exemplo para demonstração do visualizador',
      tags: 'exemplo,texto,demonstração',
      pasta: 'Exemplos',
      nivelAcesso: 'publico',
      dataUpload: new Date().toISOString().split('T')[0],
      uploadedBy: 'Admin Sistema',
      versao: 1,
      status: 'ativo',
      url: '/exemplos/documento-exemplo.txt'
    },
    {
      nome: 'Manual do Sistema.pdf',
      tipo: 'application/pdf',
      extensao: '.pdf',
      tamanho: 2048576,
      categoria: 'Geral',
      descricao: 'Manual de instruções do sistema de protocolo',
      tags: 'manual,sistema,instruções',
      pasta: 'Administrativo',
      nivelAcesso: 'publico',
      dataUpload: new Date().toISOString().split('T')[0],
      uploadedBy: 'Admin Sistema',
      versao: 1,
      status: 'ativo',
      url: '/exemplos/manual-sistema.pdf'
    },
    {
      nome: 'Contrato de Prestação de Serviços.docx',
      tipo: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extensao: '.docx',
      tamanho: 1024000,
      categoria: 'Contratos',
      descricao: 'Modelo de contrato para prestação de serviços',
      tags: 'contrato,modelo,serviços',
      pasta: 'Jurídico',
      nivelAcesso: 'restrito',
      dataUpload: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      uploadedBy: 'Admin Sistema',
      versao: 2,
      status: 'ativo',
      url: '/exemplos/contrato-modelo.docx'
    }
  ],

  tramitacoes: [
    {
      numeroProtocolo: '2024.001.000123',
      assunto: 'Análise de proposta comercial',
      remetente: 'João Silva',
      destinatario: 'Maria Santos',
      status: 'em_andamento',
      prioridade: 'alta',
      dataInicio: '2024-11-15',
      dataVencimento: '2024-12-15',
      observacoes: 'Proposta para contratação de serviços de consultoria'
    },
    {
      numeroProtocolo: '2024.001.000124',
      assunto: 'Solicitação de documentos complementares',
      remetente: 'Ana Paula Costa',
      destinatario: 'Carlos Mendes',
      status: 'pendente',
      prioridade: 'media',
      dataInicio: '2024-11-20',
      dataVencimento: '2024-12-05',
      observacoes: 'Documentos necessários para análise jurídica'
    },
    {
      numeroProtocolo: '2024.001.000125',
      assunto: 'Aprovação de contrato renovado',
      remetente: 'Maria Santos',
      destinatario: 'Roberto Lima',
      status: 'concluida',
      prioridade: 'baixa',
      dataInicio: '2024-11-10',
      dataVencimento: '2024-11-25',
      observacoes: 'Contrato de material de escritório aprovado'
    }
  ],

  encomendas: [
    {
      codigo: '2024.ENC.000001',
      codigoRastreamento: 'ENC001-2024',
      tipo: 'Documento',
      remetente: 'João Silva',
      destinatario: 'Maria Santos',
      setorOrigem: 'Administrativo',
      setorDestino: 'Financeiro',
      status: 'entregue',
      prioridade: 'alta',
      dataPostagem: '2024-11-15',
      dataEnvio: '2024-11-15',
      dataEntrega: '2024-11-18',
      valorDeclarado: 150.00,
      peso: 2.5,
      descricao: 'Documentos para análise financeira urgente',
      observacoes: 'Documentos urgentes'
    },
    {
      codigo: '2024.ENC.000002',
      codigoRastreamento: 'ENC002-2024',
      tipo: 'Documento',
      remetente: 'Ana Paula Costa',
      destinatario: 'Carlos Mendes',
      setorOrigem: 'RH',
      setorDestino: 'Recursos Humanos',
      status: 'entregue',
      prioridade: 'normal',
      dataPostagem: '2024-11-20',
      dataEnvio: '2024-11-20',
      dataEntrega: '2024-11-22',
      valorDeclarado: 75.50,
      peso: 1.2,
      descricao: 'Documentos administrativos para processamento',
      observacoes: 'Documentos administrativos'
    },
    {
      codigo: '2024.ENC.000003',
      codigoRastreamento: 'ENC003-2024',
      tipo: 'Equipamento',
      remetente: 'Departamento de TI',
      destinatario: 'Carlos Mendes',
      setorOrigem: 'TI',
      setorDestino: 'Financeiro',
      status: 'postado',
      prioridade: 'alta',
      dataPostagem: '2024-11-28',
      dataEnvio: '2024-11-28',
      valorDeclarado: 300.00,
      peso: 5.0,
      descricao: 'Equipamentos de informática para instalação',
      observacoes: 'Equipamentos de informática'
    }
  ],

  prazos: [
    {
      titulo: 'Análise Jurídica - Processo Licitatório',
      descricao: 'Concluir análise jurídica do processo licitatório para contratação de serviços de limpeza',
      dataVencimento: '2024-12-10',
      status: 'em_andamento',
      responsavel: 'Carlos Mendes',
      prioridade: 'alta',
      notificado: true
    },
    {
      titulo: 'Relatório Mensal de Atividades',
      descricao: 'Preparar e submeter relatório mensal de atividades do departamento para a diretoria',
      dataVencimento: '2024-12-15',
      status: 'pendente',
      responsavel: 'Maria Santos',
      prioridade: 'media',
      notificado: false
    },
    {
      titulo: 'Renovação de Contrato - Material de Escritório',
      descricao: 'Processar renovação do contrato de fornecimento de material de escritório',
      dataVencimento: '2024-11-30',
      status: 'vencido',
      responsavel: 'João Silva',
      prioridade: 'media',
      notificado: true
    },
    {
      titulo: 'Auditoria Interna - Departamento Financeiro',
      descricao: 'Realizar auditoria interna dos processos financeiros e elaborar relatório de conformidade',
      dataVencimento: '2024-12-20',
      status: 'pendente',
      responsavel: 'Roberto Lima',
      prioridade: 'alta',
      notificado: false
    },
    {
      titulo: 'Prestação de Contas - Convênio Federal',
      descricao: 'Preparar e enviar prestação de contas do convênio federal 123456/2024',
      dataVencimento: '2024-12-06',
      status: 'em_andamento',
      responsavel: 'Eduardo Ferreira',
      prioridade: 'alta',
      notificado: true
    }
  ]
};

// Função para fazer requisições com retry
async function makeRequest(method, url, data = null, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const config = {
        method,
        url,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (data) {
        config.data = data;
      }
      
      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.log(`Tentativa ${i + 1} falhou:`, error.message);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// Função principal de migração
async function migrateMockData() {
  console.log('🚀 Iniciando migração dos dados mockados para o banco Oracle...');
  
  try {
    // Verificar se a API está funcionando
    console.log('\n📡 Verificando conexão com a API...');
    await makeRequest('GET', `${API_BASE}/database/check-tables`);
    console.log('✅ API está funcionando!');
    
    let totalInseridos = 0;
    let totalErros = 0;
    
    // Função auxiliar para inserir dados
    const insertData = async (endpoint, item, tipo) => {
      try {
        await makeRequest('POST', endpoint, item);
        totalInseridos++;
        console.log(`   ✅ ${tipo} inserido: ${item.nome || item.titulo || item.assunto || item.numeroProtocolo || item.codigoRastreamento || 'ID: ' + item.id}`);
      } catch (error) {
        totalErros++;
        console.log(`   ❌ Erro ao inserir ${tipo}: ${error.message}`);
      }
    };

    // Inserir usuários
     if (mockData.usuarios && mockData.usuarios.length > 0) {
       console.log('\n👥 Inserindo usuários...');
       for (const usuario of mockData.usuarios) {
         await insertData(endpoints.users, usuario, 'usuário');
       }
     }
     
     // Inserir processos
     if (mockData.processos && mockData.processos.length > 0) {
       console.log('\n📋 Inserindo processos...');
       for (const processo of mockData.processos) {
         await insertData(endpoints.processes, processo, 'processo');
       }
     }
    
    // Inserir documentos
    if (mockData.documentos && mockData.documentos.length > 0) {
      console.log('\n📄 Inserindo documentos...');
      for (const documento of mockData.documentos) {
        await insertData(endpoints.documentos, documento, 'documento');
      }
    }
    
    // Inserir tramitações
    if (mockData.tramitacoes && mockData.tramitacoes.length > 0) {
      console.log('\n🔄 Inserindo tramitações...');
      for (const tramitacao of mockData.tramitacoes) {
        await insertData(endpoints.tramitacoes, tramitacao, 'tramitação');
      }
    }
    
    // Inserir encomendas
    if (mockData.encomendas && mockData.encomendas.length > 0) {
      console.log('\n📦 Inserindo encomendas...');
      for (const encomenda of mockData.encomendas) {
        await insertData(endpoints.encomendas, encomenda, 'encomenda');
      }
    }
    
    // Inserir prazos
    if (mockData.prazos && mockData.prazos.length > 0) {
      console.log('\n⏰ Inserindo prazos...');
      for (const prazo of mockData.prazos) {
        await insertData(endpoints.prazos, prazo, 'prazo');
      }
    }
    
    console.log('\n🎉 Migração concluída!');
    console.log(`📊 Resumo: ${totalInseridos} registros inseridos, ${totalErros} erros`);
    
    // Verificação final
    console.log('\n🔍 Verificando dados inseridos...');
    const checks = [
       { name: 'usuários', endpoint: endpoints.users },
       { name: 'processos', endpoint: endpoints.processes },
       { name: 'documentos', endpoint: endpoints.documentos },
       { name: 'tramitações', endpoint: endpoints.tramitacoes },
       { name: 'encomendas', endpoint: endpoints.encomendas },
       { name: 'prazos', endpoint: endpoints.prazos }
     ];
    
    for (const check of checks) {
      try {
        const response = await makeRequest('GET', check.endpoint);
        const count = response.length || response.data?.length || response.data?.data?.length || 'N/A';
        console.log(`   ${check.name}: ${count} registros`);
      } catch (error) {
        console.log(`   ${check.name}: Erro ao verificar - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
    process.exit(1);
  }
}

// Executar migração
if (require.main === module) {
  migrateMockData();
}

module.exports = { migrateMockData, mockData };