// Sistema de Backend Simulado com LocalStorage
// Simula operações CRUD para todas as entidades do sistema

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  // Campos principais
  setor_id?: number;
  role?: 'ADMIN' | 'USER';
  senha?: string;
  tentativas_login?: number;
  data_criacao?: string;
  data_atualizacao?: string;
  bloqueado_ate?: string;
  matricula?: number;
  vinculo_funcional?: number;
  cpf?: number;
  pis_pasep?: number;
  sexo?: 'M' | 'F';
  estado_civil?: string;
  data_nascimento?: string;
  pai?: string;
  mae?: string;
  // Documentos
  rg?: string;
  tipo_rg?: string;
  orgao_expeditor?: string;
  uf_rg?: string;
  expedicao_rg?: string;
  cidade_nascimento?: string;
  uf_nascimento?: string;
  // Características pessoais
  tipo_sanguineo?: string;
  raca_cor?: string;
  pne?: string;
  // Dados funcionais
  tipo_vinculo?: string;
  categoria?: string;
  regime_juridico?: string;
  regime_previdenciario?: string;
  evento_tipo?: string;
  forma_provimento?: string;
  codigo_cargo?: string;
  cargo?: string;
  escolaridade_cargo?: string;
  escolaridade_servidor?: string;
  formacao_profissional_1?: string;
  formacao_profissional_2?: string;
  jornada?: string;
  nivel_referencia?: string;
  comissao_funcao?: string;
  data_ini_comissao?: string;
  telefone?: string;
  // Endereço
  endereco?: string;
  numero_endereco?: string;
  complemento_endereco?: string;
  bairro_endereco?: string;
  cidade_endereco?: string;
  uf_endereco?: string;
  cep_endereco?: string;
  // Campos legados para compatibilidade
  departamento?: string;
  ativo: boolean;
  permissoes: string[];
  dataCriacao: string;
}

export interface Tramitacao {
  id: string;
  numeroProtocolo: string;
  assunto: string;
  remetente: string;
  destinatario: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  dataInicio: string;
  dataVencimento?: string;
  observacoes?: string;
  documentos: string[];
}

export interface Encomenda {
  id: string;
  codigo?: string;
  codigoRastreamento: string;
  tipo?: string;
  remetente: string;
  destinatario: string;
  setorOrigem?: string;
  setorDestino?: string;
  setorOrigemCep?: string;
  setorDestinoCep?: string;
  setorOrigemCoordenadas?: {
    latitude: number | null;
    longitude: number | null;
  };
  setorDestinoCoordenadas?: {
    latitude: number | null;
    longitude: number | null;
  };
  status: 'postado' | 'em_transito' | 'entregue' | 'devolvido';
  prioridade?: 'baixa' | 'normal' | 'alta' | 'urgente';
  dataPostagem: string;
  dataEnvio?: string;
  dataEntrega?: string;
  valorDeclarado?: number;
  peso?: number;
  descricao?: string;
  observacoes?: string;
  // Dados de matrícula e vínculo do remetente
  remetente_matricula?: string;
  remetente_vinculo?: string;
  // Dados de matrícula e vínculo do destinatário
  destinatario_matricula?: string;
  destinatario_vinculo?: string;
}

export interface Documento {
  id: string;
  nome: string;
  tipo: string;
  extensao: string;
  tamanho: number;
  categoria: string;
  descricao?: string;
  tags: string[];
  pasta: string;
  nivelAcesso: 'publico' | 'restrito' | 'confidencial';
  dataUpload: string;
  dataModificacao?: string;
  uploadedBy: string;
  modificadoPor?: string;
  url?: string;
  versao: number;
  versaoAnterior?: string;
  status: 'ativo' | 'arquivado' | 'excluido';
  processoId?: string;
  tramitacaoId?: string;
  metadados: {
    autor?: string;
    assunto?: string;
    palavrasChave?: string[];
    dataDocumento?: string;
    numeroDocumento?: string;
    origem?: string;
    destinatario?: string;
  };
  historico: {
    data: string;
    acao: 'criacao' | 'edicao' | 'visualizacao' | 'download' | 'arquivamento';
    usuario: string;
    observacao?: string;
  }[];
  permissoes: {
    visualizar: string[];
    editar: string[];
    excluir: string[];
  };
}

export interface Prazo {
  id: string;
  titulo: string;
  descricao: string;
  dataVencimento: string;
  status: 'pendente' | 'em_andamento' | 'concluido' | 'vencido';
  responsavel: string;
  prioridade: 'baixa' | 'media' | 'alta';
  notificado: boolean;
}

export interface Processo {
  id: string;
  numero: string;
  tipo: 'licitacao' | 'administrativa' | 'judicial' | 'contrato' | 'outros';
  assunto: string;
  interessado: string;
  responsavel: string;
  dataAbertura: string;
  prazoLimite?: string;
  status: 'em_andamento' | 'concluido' | 'arquivado' | 'suspenso';
  fase: string;
  progresso: number;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  documentos: string[];
  volumes: number;
  observacoes?: string;
  historico: {
    data: string;
    acao: string;
    usuario: string;
    observacao?: string;
  }[];
}

export interface Configuracao {
  id: string;
  categoria: 'geral' | 'seguranca' | 'notificacoes' | 'sistema' | 'aparencia';
  chave: string;
  valor: any;
  descricao: string;
}

class MockBackend {
  private getStorageKey(entity: string): string {
    return `protocolo_${entity}`;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Métodos genéricos CRUD
  private getAll<T>(entity: string): T[] {
    const data = localStorage.getItem(this.getStorageKey(entity));
    return data ? JSON.parse(data) : [];
  }

  private save<T>(entity: string, items: T[]): void {
    localStorage.setItem(this.getStorageKey(entity), JSON.stringify(items));
  }

  private create<T extends { id: string }>(entity: string, item: Omit<T, 'id'>): T {
    const items = this.getAll<T>(entity);
    const newItem = { ...item, id: this.generateId() } as T;
    items.push(newItem);
    this.save(entity, items);
    return newItem;
  }

  private update<T extends { id: string }>(entity: string, id: string, updates: Partial<T>): T | null {
    const items = this.getAll<T>(entity);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    items[index] = { ...items[index], ...updates };
    this.save(entity, items);
    return items[index];
  }

  private delete(entity: string, id: string): boolean {
    const items = this.getAll(entity);
    const filteredItems = items.filter(item => item.id !== id);
    if (filteredItems.length === items.length) return false;
    
    this.save(entity, filteredItems);
    return true;
  }

  private findById<T extends { id: string }>(entity: string, id: string): T | null {
    const items = this.getAll<T>(entity);
    return items.find(item => item.id === id) || null;
  }

  // Métodos específicos para Usuários
  getUsuarios(): Usuario[] {
    return this.getAll<Usuario>('usuarios');
  }

  createUsuario(usuario: Omit<Usuario, 'id'>): Usuario {
    return this.create<Usuario>('usuarios', usuario);
  }

  updateUsuario(id: string, updates: Partial<Usuario>): Usuario | null {
    return this.update<Usuario>('usuarios', id, updates);
  }

  deleteUsuario(id: string): boolean {
    return this.delete('usuarios', id);
  }

  getUsuarioById(id: string): Usuario | null {
    return this.findById<Usuario>('usuarios', id);
  }

  // Métodos específicos para Tramitações
  getTramitacoes(): Tramitacao[] {
    return this.getAll<Tramitacao>('tramitacoes');
  }

  createTramitacao(tramitacao: Omit<Tramitacao, 'id'>): Tramitacao {
    return this.create<Tramitacao>('tramitacoes', tramitacao);
  }

  updateTramitacao(id: string, updates: Partial<Tramitacao>): Tramitacao | null {
    return this.update<Tramitacao>('tramitacoes', id, updates);
  }

  deleteTramitacao(id: string): boolean {
    return this.delete('tramitacoes', id);
  }

  getTramitacaoById(id: string): Tramitacao | null {
    return this.findById<Tramitacao>('tramitacoes', id);
  }

  // Métodos específicos para Encomendas
  getEncomendas(): Encomenda[] {
    return this.getAll<Encomenda>('encomendas');
  }

  createEncomenda(encomenda: Omit<Encomenda, 'id'>): Encomenda {
    return this.create<Encomenda>('encomendas', encomenda);
  }

  updateEncomenda(id: string, updates: Partial<Encomenda>): Encomenda | null {
    return this.update<Encomenda>('encomendas', id, updates);
  }

  deleteEncomenda(id: string): boolean {
    return this.delete('encomendas', id);
  }

  getEncomendaById(id: string): Encomenda | null {
    return this.findById<Encomenda>('encomendas', id);
  }

  rastrearEncomenda(codigo: string): Encomenda | null {
    const encomendas = this.getEncomendas();
    return encomendas.find(e => e.codigoRastreamento === codigo) || null;
  }

  // Métodos específicos para Documentos
  getDocumentos(): Documento[] {
    return this.getAll<Documento>('documentos');
  }

  createDocumento(documento: Omit<Documento, 'id'>): Documento {
    return this.create<Documento>('documentos', documento);
  }

  updateDocumento(id: string, updates: Partial<Documento>): Documento | null {
    return this.update<Documento>('documentos', id, updates);
  }

  deleteDocumento(id: string): boolean {
    return this.delete('documentos', id);
  }

  getDocumentoById(id: string): Documento | null {
    return this.findById<Documento>('documentos', id);
  }

  // Métodos avançados para Documentos
  getDocumentosByProcesso(processoId: string): Documento[] {
    return this.getDocumentos().filter(doc => doc.processoId === processoId);
  }

  getDocumentosByTramitacao(tramitacaoId: string): Documento[] {
    return this.getDocumentos().filter(doc => doc.tramitacaoId === tramitacaoId);
  }

  buscarDocumentos(termo: string): Documento[] {
    const documentos = this.getDocumentos();
    const termoLower = termo.toLowerCase();
    
    return documentos.filter(doc => 
      doc.nome.toLowerCase().includes(termoLower) ||
      doc.descricao?.toLowerCase().includes(termoLower) ||
      doc.tags.some(tag => tag.toLowerCase().includes(termoLower)) ||
      doc.metadados.assunto?.toLowerCase().includes(termoLower) ||
      doc.metadados.autor?.toLowerCase().includes(termoLower)
    );
  }

  criarVersaoDocumento(documentoId: string, novoDocumento: Omit<Documento, 'id' | 'versao' | 'versaoAnterior' | 'historico'>): Documento | null {
    const documentoOriginal = this.getDocumentoById(documentoId);
    if (!documentoOriginal) return null;

    const novaVersao = this.createDocumento({
      ...novoDocumento,
      versao: documentoOriginal.versao + 1,
      versaoAnterior: documentoOriginal.id,
      historico: [{
        data: new Date().toISOString().split('T')[0],
        acao: 'criacao',
        usuario: novoDocumento.uploadedBy,
        observacao: `Nova versão do documento ${documentoOriginal.nome}`
      }]
    });

    // Arquivar versão anterior
    this.updateDocumento(documentoId, { status: 'arquivado' });

    return novaVersao;
  }

  // Métodos de integração Processo-Documento
  vincularDocumentoProcesso(documentoId: string, processoId: string): boolean {
    const documento = this.getDocumentoById(documentoId);
    const processo = this.getProcessoById(processoId);
    
    if (!documento || !processo) return false;
    
    // Atualizar documento com processoId
    this.updateDocumento(documentoId, { processoId });
    
    // Adicionar documento ao array de documentos do processo se não existir
    if (!processo.documentos.includes(documentoId)) {
      const documentosAtualizados = [...processo.documentos, documentoId];
      this.updateProcesso(processoId, { documentos: documentosAtualizados });
    }
    
    // Adicionar ao histórico do documento
    const documentoAtualizado = this.getDocumentoById(documentoId);
    if (documentoAtualizado) {
      const novoHistorico = {
        data: new Date().toISOString(),
        acao: 'edicao' as const,
        usuario: 'Sistema',
        observacao: `Documento vinculado ao processo ${processo.numero}`
      };
      
      const historicoAtualizado = [...documentoAtualizado.historico, novoHistorico];
      this.updateDocumento(documentoId, { historico: historicoAtualizado });
    }
    
    return true;
  }
  
  desvincularDocumentoProcesso(documentoId: string): boolean {
    const documento = this.getDocumentoById(documentoId);
    if (!documento || !documento.processoId) return false;
    
    const processo = this.getProcessoById(documento.processoId);
    
    // Remover processoId do documento
    this.updateDocumento(documentoId, { processoId: undefined });
    
    // Remover documento do array de documentos do processo
    if (processo) {
      const documentosAtualizados = processo.documentos.filter(id => id !== documentoId);
      this.updateProcesso(documento.processoId, { documentos: documentosAtualizados });
    }
    
    // Adicionar ao histórico do documento
    const novoHistorico = {
      data: new Date().toISOString(),
      acao: 'edicao' as const,
      usuario: 'Sistema',
      observacao: processo ? `Documento desvinculado do processo ${processo.numero}` : 'Documento desvinculado de processo'
    };
    
    const historicoAtualizado = [...documento.historico, novoHistorico];
    this.updateDocumento(documentoId, { historico: historicoAtualizado });
    
    return true;
  }
  
  getProcessosByDocumento(documentoId: string): Processo[] {
    const documento = this.getDocumentoById(documentoId);
    if (!documento || !documento.processoId) return [];
    
    const processo = this.getProcessoById(documento.processoId);
    return processo ? [processo] : [];
  }

  getHistoricoDocumento(documentoId: string): Documento['historico'] {
    const documento = this.getDocumentoById(documentoId);
    return documento?.historico || [];
  }

  adicionarHistoricoDocumento(documentoId: string, acao: Documento['historico'][0]['acao'], usuario: string, observacao?: string): boolean {
    const documento = this.getDocumentoById(documentoId);
    if (!documento) return false;

    const novoHistorico = {
      data: new Date().toISOString().split('T')[0],
      acao,
      usuario,
      observacao
    };

    documento.historico.push(novoHistorico);
    this.updateDocumento(documentoId, { historico: documento.historico });
    return true;
  }

  getDocumentosPorCategoria(categoria: string): Documento[] {
    return this.getDocumentos().filter(doc => doc.categoria === categoria);
  }

  getDocumentosPorNivelAcesso(nivelAcesso: Documento['nivelAcesso']): Documento[] {
    return this.getDocumentos().filter(doc => doc.nivelAcesso === nivelAcesso);
  }

  verificarPermissaoDocumento(documentoId: string, usuario: string, acao: 'visualizar' | 'editar' | 'excluir'): boolean {
    const documento = this.getDocumentoById(documentoId);
    if (!documento) return false;

    return documento.permissoes[acao].includes(usuario) || documento.uploadedBy === usuario;
  }

  // Métodos específicos para Prazos
  getPrazos(): Prazo[] {
    return this.getAll<Prazo>('prazos');
  }

  createPrazo(prazo: Omit<Prazo, 'id'>): Prazo {
    return this.create<Prazo>('prazos', prazo);
  }

  updatePrazo(id: string, updates: Partial<Prazo>): Prazo | null {
    return this.update<Prazo>('prazos', id, updates);
  }

  deletePrazo(id: string): boolean {
    return this.delete('prazos', id);
  }

  getPrazoById(id: string): Prazo | null {
    return this.findById<Prazo>('prazos', id);
  }

  // Métodos para Processos
  getProcessos(): Processo[] {
    return this.getAll<Processo>('processos');
  }

  createProcesso(processo: Omit<Processo, 'id'>): Processo {
    return this.create<Processo>('processos', processo);
  }

  updateProcesso(id: string, updates: Partial<Processo>): Processo | null {
    return this.update<Processo>('processos', id, updates);
  }

  deleteProcesso(id: string): boolean {
    return this.delete('processos', id);
  }

  getProcessoById(id: string): Processo | null {
    return this.findById<Processo>('processos', id);
  }

  getProcessoByNumero(numero: string): Processo | null {
    const processos = this.getProcessos();
    return processos.find(p => p.numero === numero) || null;
  }

  // Métodos para Configurações
  getConfiguracoes(): Configuracao[] {
    return this.getAll<Configuracao>('configuracoes');
  }

  updateConfiguracao(chave: string, valor: any): boolean {
    const configs = this.getConfiguracoes();
    const index = configs.findIndex(c => c.chave === chave);
    
    if (index !== -1) {
      configs[index].valor = valor;
      this.save('configuracoes', configs);
      return true;
    }
    return false;
  }

  getConfiguracaoByChave(chave: string): Configuracao | null {
    const configs = this.getConfiguracoes();
    return configs.find(c => c.chave === chave) || null;
  }

  // Método para inicializar dados de exemplo
  initializeSampleData(): void {
    // Inicializar usuários de exemplo
    if (this.getUsuarios().length === 0) {
      this.createUsuario({
        nome: 'Admin Sistema',
        email: 'admin@protocolo.gov.br',
        cargo: 'Administrador',
        departamento: 'TI',
        matricula: '12345',
        vinculo_funcional: 'Efetivo',
        ativo: true,
        permissoes: ['admin', 'create', 'read', 'update', 'delete'],
        dataCriacao: new Date().toISOString()
      });

      this.createUsuario({
        nome: 'Maria Silva',
        email: 'maria.silva@protocolo.gov.br',
        cargo: 'Analista',
        departamento: 'Protocolo',
        matricula: '67890',
        vinculo_funcional: 'Comissionado',
        ativo: true,
        permissoes: ['create', 'read', 'update'],
        dataCriacao: new Date().toISOString()
      });

      this.createUsuario({
        nome: 'João Santos',
        email: 'joao.santos@protocolo.gov.br',
        cargo: 'Técnico',
        departamento: 'Arquivo',
        matricula: '54321',
        vinculo_funcional: 'Terceirizado',
        ativo: true,
        permissoes: ['read'],
        dataCriacao: new Date().toISOString()
      });

      this.createUsuario({
        nome: 'Ana Costa',
        email: 'ana.costa@protocolo.gov.br',
        cargo: 'Coordenadora',
        departamento: 'Gestão',
        matricula: '98765',
        vinculo_funcional: 'Efetivo',
        ativo: false,
        permissoes: ['create', 'read', 'update', 'delete'],
        dataCriacao: new Date().toISOString()
      });
    }

    // Inicializar configurações padrão
    if (this.getConfiguracoes().length === 0) {
      const configsPadrao: Omit<Configuracao, 'id'>[] = [
        { categoria: 'geral', chave: 'nome_sistema', valor: 'Sistema de Protocolo', descricao: 'Nome do sistema' },
        { categoria: 'notificacoes', chave: 'email_enabled', valor: true, descricao: 'Habilitar notificações por email' },
        { categoria: 'sistema', chave: 'backup_automatico', valor: true, descricao: 'Backup automático diário' },
        { categoria: 'aparencia', chave: 'tema_escuro', valor: false, descricao: 'Tema escuro por padrão' }
      ];
      
      configsPadrao.forEach(config => {
        this.create<Configuracao>('configuracoes', config);
      });
    }

    // Inicializar processos de exemplo
    if (this.getProcessos().length === 0) {
      const processosExemplo: Omit<Processo, 'id'>[] = [
        {
          numero: '2024.001.000123',
          tipo: 'licitacao',
          assunto: 'Processo Licitatório para contratação de serviços de limpeza',
          interessado: 'Secretaria de Administração',
          responsavel: 'Ana Paula Costa',
          dataAbertura: '2024-11-15',
          prazoLimite: '2024-12-30',
          status: 'em_andamento',
          fase: 'Análise Jurídica',
          progresso: 65,
          prioridade: 'alta',
          documentos: ['proc_001'],
          volumes: 2,
          observacoes: 'Processo em análise pela equipe jurídica',
          historico: [
            {
              data: '2024-11-15',
              acao: 'Abertura do processo',
              usuario: 'Ana Paula Costa',
              observacao: 'Processo iniciado'
            },
            {
              data: '2024-11-20',
              acao: 'Encaminhado para análise jurídica',
              usuario: 'Ana Paula Costa'
            }
          ]
        },
        {
          numero: '2024.001.000124',
          tipo: 'administrativa',
          assunto: 'Processo administrativo disciplinar - Servidor João Silva',
          interessado: 'Secretaria de RH',
          responsavel: 'Carlos Mendes',
          dataAbertura: '2024-11-10',
          prazoLimite: '2024-12-15',
          status: 'em_andamento',
          fase: 'Instrução Processual',
          progresso: 40,
          prioridade: 'media',
          documentos: ['proc_002'],
          volumes: 1,
          observacoes: 'Aguardando manifestação do servidor',
          historico: [
            {
              data: '2024-11-10',
              acao: 'Abertura do processo',
              usuario: 'Carlos Mendes'
            }
          ]
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
          documentos: [],
          volumes: 1,
          observacoes: 'Contrato renovado por mais 12 meses',
          historico: [
            {
              data: '2024-11-05',
              acao: 'Abertura do processo',
              usuario: 'Maria Santos'
            },
            {
              data: '2024-11-25',
              acao: 'Processo finalizado',
              usuario: 'Maria Santos',
              observacao: 'Contrato assinado'
            }
          ]
        }
      ];
      
      processosExemplo.forEach(processo => {
        this.createProcesso(processo);
      });
    }

    // Inicializar documentos de exemplo
    if (this.getDocumentos().length === 0) {
      const documentosExemplo: Omit<Documento, 'id'>[] = [
        {
          nome: 'Documento de Exemplo.txt',
          tipo: 'text/plain',
          extensao: '.txt',
          tamanho: 2048,
          categoria: 'Geral',
          descricao: 'Documento de texto de exemplo para demonstração do visualizador',
          tags: ['exemplo', 'texto', 'demonstração'],
          pasta: 'Exemplos',
          nivelAcesso: 'publico',
          dataUpload: new Date().toISOString(),
          dataModificacao: new Date().toISOString(),
          uploadedBy: 'Admin Sistema',
          modificadoPor: 'Admin Sistema',
          versao: 1,
          status: 'ativo',
          url: '/exemplos/documento-exemplo.txt',
          metadados: {
            autor: 'Sistema de Protocolo Digital',
            assunto: 'Documento de Exemplo',
            palavrasChave: ['exemplo', 'texto', 'demonstração'],
            dataDocumento: new Date().toISOString().split('T')[0],
            numeroDocumento: 'EX-001-2024',
            origem: 'Sistema'
          },
          historico: [
            {
              data: new Date().toISOString(),
              acao: 'criacao',
              usuario: 'Admin Sistema',
              observacao: 'Documento de exemplo criado'
            }
          ],
          permissoes: {
            visualizar: ['todos'],
            editar: ['admin', 'ti'],
            excluir: ['admin']
          }
        },
        {
          nome: 'Configuração do Sistema.json',
          tipo: 'application/json',
          extensao: '.json',
          tamanho: 4096,
          categoria: 'Configuração',
          descricao: 'Arquivo de configuração do sistema em formato JSON',
          tags: ['configuração', 'json', 'sistema'],
          pasta: 'Exemplos',
          nivelAcesso: 'publico',
          dataUpload: new Date().toISOString(),
          dataModificacao: new Date().toISOString(),
          uploadedBy: 'Admin Sistema',
          modificadoPor: 'Admin Sistema',
          versao: 1,
          status: 'ativo',
          url: '/exemplos/configuracao-exemplo.json',
          metadados: {
            autor: 'Equipe de TI',
            assunto: 'Configuração do Sistema',
            palavrasChave: ['configuração', 'json', 'sistema'],
            dataDocumento: new Date().toISOString().split('T')[0],
            numeroDocumento: 'CONF-001-2024',
            origem: 'Departamento de TI'
          },
          historico: [
            {
              data: new Date().toISOString(),
              acao: 'criacao',
              usuario: 'Admin Sistema',
              observacao: 'Arquivo de configuração criado'
            }
          ],
          permissoes: {
            visualizar: ['todos'],
            editar: ['admin', 'ti'],
            excluir: ['admin']
          }
        },
        {
          nome: 'Manual do Sistema.pdf',
          tipo: 'application/pdf',
          extensao: '.pdf',
          tamanho: 2048576,
          categoria: 'Geral',
          descricao: 'Manual de instruções do sistema de protocolo',
          tags: ['manual', 'sistema', 'instruções'],
          pasta: 'Administrativo',
          nivelAcesso: 'publico',
          dataUpload: new Date().toISOString(),
          dataModificacao: new Date().toISOString(),
          uploadedBy: 'Admin Sistema',
          modificadoPor: 'Admin Sistema',
          versao: 1,
          status: 'ativo',
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          metadados: {
            autor: 'Equipe de TI',
            assunto: 'Manual de Instruções',
            palavrasChave: ['manual', 'sistema', 'protocolo'],
            dataDocumento: '2024-11-01',
            numeroDocumento: 'MAN-001-2024',
            origem: 'Departamento de TI'
          },
          historico: [
            {
              data: new Date().toISOString(),
              acao: 'criacao',
              usuario: 'Admin Sistema',
              observacao: 'Documento criado'
            }
          ],
          permissoes: {
            visualizar: ['todos'],
            editar: ['admin', 'ti'],
            excluir: ['admin']
          }
        },
        {
          nome: 'Logo SEFAZ.png',
          tipo: 'image/png',
          extensao: '.png',
          tamanho: 256000,
          categoria: 'Imagens',
          descricao: 'Logo oficial da SEFAZ/TO para demonstração do visualizador de imagens',
          tags: ['logo', 'sefaz', 'imagem'],
          pasta: 'Exemplos',
          nivelAcesso: 'publico',
          dataUpload: new Date(Date.now() - 86400000).toISOString(),
          dataModificacao: new Date(Date.now() - 43200000).toISOString(),
          uploadedBy: 'Admin Sistema',
          modificadoPor: 'Admin Sistema',
          versao: 1,
          status: 'ativo',
          processoId: 'proc_001',
          url: 'https://via.placeholder.com/800x600/0066cc/ffffff?text=SEFAZ+TO+Logo+Exemplo',
          metadados: {
            autor: 'Departamento de Comunicação',
            assunto: 'Logo Oficial SEFAZ/TO',
            palavrasChave: ['logo', 'sefaz', 'tocantins', 'oficial'],
            dataDocumento: '2024-10-15',
            numeroDocumento: 'IMG-001-2024',
            origem: 'Departamento de Comunicação'
          },
          historico: [
            {
              data: new Date(Date.now() - 86400000).toISOString(),
              acao: 'criacao',
              usuario: 'Admin Sistema',
              observacao: 'Imagem de exemplo criada'
            }
          ],
          permissoes: {
            visualizar: ['todos'],
            editar: ['admin', 'comunicacao'],
            excluir: ['admin']
          }
        },
        {
          nome: 'Contrato de Prestação de Serviços.docx',
          tipo: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          extensao: '.docx',
          tamanho: 1024000,
          categoria: 'Contratos',
          descricao: 'Modelo de contrato para prestação de serviços',
          tags: ['contrato', 'modelo', 'serviços'],
          pasta: 'Jurídico',
          nivelAcesso: 'restrito',
          dataUpload: new Date(Date.now() - 86400000).toISOString(),
          dataModificacao: new Date(Date.now() - 43200000).toISOString(),
          uploadedBy: 'Admin Sistema',
          modificadoPor: 'Ana Paula Costa',
          versao: 2,
          versaoAnterior: '1',
          status: 'ativo',
          processoId: 'proc_002',
          url: '/exemplos/documento-exemplo.txt',
          metadados: {
            autor: 'Departamento Jurídico',
            assunto: 'Contrato de Prestação de Serviços',
            palavrasChave: ['contrato', 'prestação', 'serviços', 'modelo'],
            dataDocumento: '2024-10-15',
            numeroDocumento: 'CONT-002-2024',
            origem: 'Departamento Jurídico',
            destinatario: 'Fornecedores'
          },
          historico: [
            {
              data: new Date(Date.now() - 86400000).toISOString(),
              acao: 'criacao',
              usuario: 'Admin Sistema',
              observacao: 'Documento criado'
            },
            {
              data: new Date(Date.now() - 43200000).toISOString(),
              acao: 'edicao',
              usuario: 'Ana Paula Costa',
              observacao: 'Atualização de cláusulas contratuais'
            }
          ],
          permissoes: {
            visualizar: ['juridico', 'admin', 'gestores'],
            editar: ['juridico', 'admin'],
            excluir: ['admin']
          }
        },
        {
          nome: 'Relatório Mensal - Janeiro.xlsx',
          tipo: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          extensao: '.xlsx',
          tamanho: 512000,
          categoria: 'Relatórios',
          descricao: 'Relatório de atividades do mês de janeiro',
          tags: ['relatório', 'janeiro', 'mensal'],
          pasta: 'Financeiro',
          nivelAcesso: 'confidencial',
          dataUpload: new Date(Date.now() - 172800000).toISOString(),
          uploadedBy: 'Admin Sistema',
          versao: 1,
          status: 'ativo',
          url: '/exemplos/configuracao-exemplo.json',
          metadados: {
            autor: 'Departamento Financeiro',
            assunto: 'Relatório Mensal de Atividades',
            palavrasChave: ['relatório', 'mensal', 'janeiro', 'financeiro'],
            dataDocumento: '2024-01-31',
            numeroDocumento: 'REL-001-2024',
            origem: 'Departamento Financeiro'
          },
          historico: [
            {
              data: new Date(Date.now() - 172800000).toISOString(),
              acao: 'criacao',
              usuario: 'Admin Sistema',
              observacao: 'Relatório mensal gerado'
            },
            {
              data: new Date(Date.now() - 86400000).toISOString(),
              acao: 'visualizacao',
              usuario: 'Maria Santos',
              observacao: 'Consulta para análise'
            }
          ],
          permissoes: {
            visualizar: ['financeiro', 'admin', 'diretoria'],
            editar: ['financeiro', 'admin'],
            excluir: ['admin']
          }
        }
      ];
      
      documentosExemplo.forEach(doc => {
        this.create<Documento>('documentos', doc);
      });
    }

    // Inicializar tramitações de exemplo
    if (this.getTramitacoes().length === 0) {
      const tramitacoesExemplo: Omit<Tramitacao, 'id'>[] = [
        {
          numeroProtocolo: '2024.001.000123',
          assunto: 'Análise de processo licitatório - Serviços de limpeza',
          remetente: 'Secretaria de Administração',
          destinatario: 'Departamento Jurídico',
          status: 'em_andamento',
          prioridade: 'alta',
          dataInicio: '2024-11-20',
          dataVencimento: '2024-12-05',
          observacoes: 'Processo necessita de análise jurídica urgente para cumprimento dos prazos licitatórios',
          documentos: []
        },
        {
          numeroProtocolo: '2024.001.000124',
          assunto: 'Encaminhamento de processo disciplinar',
          remetente: 'Secretaria de RH',
          destinatario: 'Comissão Disciplinar',
          status: 'pendente',
          prioridade: 'media',
          dataInicio: '2024-11-18',
          dataVencimento: '2024-12-18',
          observacoes: 'Aguardando designação de membros da comissão para dar início à instrução processual',
          documentos: []
        },
        {
          numeroProtocolo: '2024.001.000125',
          assunto: 'Renovação contratual - Material de escritório',
          remetente: 'Departamento de Compras',
          destinatario: 'Secretaria de Administração',
          status: 'concluida',
          prioridade: 'baixa',
          dataInicio: '2024-11-05',
          dataVencimento: '2024-11-25',
          observacoes: 'Contrato renovado com sucesso. Documentação arquivada conforme procedimentos',
          documentos: []
        },
        {
          numeroProtocolo: '2024.002.000001',
          assunto: 'Solicitação de licença para construção',
          remetente: 'Departamento de Obras',
          destinatario: 'Secretaria de Planejamento',
          status: 'em_andamento',
          prioridade: 'media',
          dataInicio: '2024-11-22',
          dataVencimento: '2024-12-22',
          observacoes: 'Análise técnica em andamento. Aguardando parecer da equipe de engenharia',
          documentos: []
        },
        {
          numeroProtocolo: '2024.002.000002',
          assunto: 'Recurso administrativo - Multa de trânsito',
          remetente: 'Departamento de Trânsito',
          destinatario: 'Junta de Recursos',
          status: 'pendente',
          prioridade: 'baixa',
          dataInicio: '2024-11-25',
          dataVencimento: '2025-01-25',
          observacoes: 'Recurso protocolado pelo contribuinte. Aguardando análise da junta recursal',
          documentos: []
        },
        {
          numeroProtocolo: '2024.003.000001',
          assunto: 'Aprovação de projeto arquitetônico',
          remetente: 'Secretaria de Planejamento',
          destinatario: 'Conselho de Arquitetura',
          status: 'em_andamento',
          prioridade: 'alta',
          dataInicio: '2024-11-21',
          dataVencimento: '2024-12-21',
          observacoes: 'Projeto em análise pelo conselho. Possíveis ajustes necessários conforme normas vigentes',
          documentos: []
        },
        {
          numeroProtocolo: '2024.003.000002',
          assunto: 'Processo de aposentadoria - Servidor Maria Silva',
          remetente: 'Secretaria de RH',
          destinatario: 'Instituto de Previdência',
          status: 'concluida',
          prioridade: 'media',
          dataInicio: '2024-10-15',
          dataVencimento: '2024-11-15',
          observacoes: 'Aposentadoria deferida. Servidor notificado e documentação encaminhada ao órgão competente',
          documentos: []
        },
        {
          numeroProtocolo: '2024.004.000001',
          assunto: 'Análise de viabilidade - Novo sistema informatizado',
          remetente: 'Departamento de TI',
          destinatario: 'Secretaria de Administração',
          status: 'em_andamento',
          prioridade: 'urgente',
          dataInicio: '2024-11-26',
          dataVencimento: '2024-12-10',
          observacoes: 'Estudo de viabilidade técnica e financeira em andamento. Prazo crítico para implementação',
          documentos: []
        },
        {
          numeroProtocolo: '2024.004.000002',
          assunto: 'Cancelamento de alvará comercial',
          remetente: 'Secretaria de Fazenda',
          destinatario: 'Departamento de Fiscalização',
          status: 'cancelada',
          prioridade: 'baixa',
          dataInicio: '2024-11-10',
          observacoes: 'Processo cancelado a pedido do interessado. Documentação devolvida',
          documentos: []
        },
        {
          numeroProtocolo: '2024.005.000001',
          assunto: 'Licitação para aquisição de veículos oficiais',
          remetente: 'Departamento de Compras',
          destinatario: 'Comissão de Licitação',
          status: 'pendente',
          prioridade: 'alta',
          dataInicio: '2024-11-28',
          dataVencimento: '2024-12-28',
          observacoes: 'Aguardando formação da comissão de licitação e elaboração do edital',
          documentos: []
        }
      ];
      
      tramitacoesExemplo.forEach(tramitacao => {
        this.createTramitacao(tramitacao);
      });
    }

    // Encomendas são gerenciadas pelo backend real - não inicializar dados de exemplo

    // Inicializar prazos de exemplo
    if (this.getPrazos().length === 0) {
      const prazosExemplo: Omit<Prazo, 'id'>[] = [
        {
          titulo: 'Resposta ao Ofício 123/2024',
          descricao: 'Elaborar e enviar resposta ao ofício da Secretaria de Fazenda sobre regularização fiscal',
          dataVencimento: '2024-12-05',
          status: 'pendente',
          responsavel: 'Ana Paula Costa',
          prioridade: 'alta',
          notificado: false
        },
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
          titulo: 'Treinamento de Segurança da Informação',
          descricao: 'Organizar e conduzir treinamento obrigatório de segurança da informação para todos os servidores',
          dataVencimento: '2024-12-12',
          status: 'em_andamento',
          responsavel: 'Fernanda Souza',
          prioridade: 'media',
          notificado: true
        },
        {
          titulo: 'Atualização do Manual de Procedimentos',
          descricao: 'Revisar e atualizar o manual de procedimentos administrativos conforme novas diretrizes',
          dataVencimento: '2024-12-25',
          status: 'pendente',
          responsavel: 'Pedro Oliveira',
          prioridade: 'baixa',
          notificado: false
        },
        {
          titulo: 'Implementação do Sistema de Protocolo Digital',
          descricao: 'Finalizar implementação e testes do novo sistema de protocolo digital',
          dataVencimento: '2024-12-08',
          status: 'em_andamento',
          responsavel: 'Lucas Martins',
          prioridade: 'alta',
          notificado: true
        },
        {
          titulo: 'Inventário Anual de Bens Patrimoniais',
          descricao: 'Conduzir inventário anual de todos os bens patrimoniais do órgão',
          dataVencimento: '2024-12-30',
          status: 'pendente',
          responsavel: 'Carla Rodrigues',
          prioridade: 'media',
          notificado: false
        },
        {
          titulo: 'Elaboração do Plano de Capacitação 2025',
          descricao: 'Desenvolver plano de capacitação e treinamento para servidores para o próximo ano',
          dataVencimento: '2024-12-18',
          status: 'pendente',
          responsavel: 'Juliana Costa',
          prioridade: 'media',
          notificado: false
        },
        {
          titulo: 'Revisão de Contratos Terceirizados',
          descricao: 'Revisar todos os contratos de terceirização vigentes e identificar necessidades de renovação',
          dataVencimento: '2024-12-22',
          status: 'pendente',
          responsavel: 'Marcos Silva',
          prioridade: 'alta',
          notificado: false
        },
        {
          titulo: 'Backup e Manutenção de Servidores',
          descricao: 'Realizar backup completo e manutenção preventiva dos servidores de dados',
          dataVencimento: '2024-12-03',
          status: 'concluido',
          responsavel: 'Rafael Santos',
          prioridade: 'alta',
          notificado: true
        },
        {
          titulo: 'Análise de Processos Disciplinares',
          descricao: 'Analisar e dar parecer sobre processos administrativos disciplinares pendentes',
          dataVencimento: '2024-12-14',
          status: 'em_andamento',
          responsavel: 'Patrícia Lima',
          prioridade: 'alta',
          notificado: true
        },
        {
          titulo: 'Organização do Arquivo Morto',
          descricao: 'Organizar e catalogar documentos do arquivo morto conforme tabela de temporalidade',
          dataVencimento: '2024-12-28',
          status: 'pendente',
          responsavel: 'Sandra Alves',
          prioridade: 'baixa',
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
      ];
      
      prazosExemplo.forEach(prazo => {
        this.createPrazo(prazo);
      });
    }
  }
}

// Instância singleton do backend simulado
export const mockBackend = new MockBackend();

// Inicializar dados de exemplo na primeira execução
mockBackend.initializeSampleData();