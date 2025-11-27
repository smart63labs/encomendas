-- =====================================================
-- SISTEMA DE PROTOCOLO - DADOS INICIAIS
-- =====================================================
-- Autor: Sistema Automatizado
-- Data: 2024
-- Descrição: Script para inserção de dados iniciais
-- =====================================================

-- Configurações iniciais
SET SERVEROUTPUT ON;
ALTER SESSION SET NLS_DATE_FORMAT = 'DD/MM/YYYY HH24:MI:SS';

PROMPT 'Iniciando inserção de dados iniciais...';

-- =====================================================
-- INSERIR SETORES INICIAIS
-- =====================================================

PROMPT 'Inserindo setores...';

INSERT INTO SETORES (NOME, SIGLA, DESCRICAO, ORDEM_EXIBICAO) VALUES 
('Diretoria Geral', 'DG', 'Diretoria Geral da Organização', 1);

INSERT INTO SETORES (NOME, SIGLA, DESCRICAO, ORDEM_EXIBICAO) VALUES 
('Recursos Humanos', 'RH', 'Setor de Recursos Humanos', 2);

INSERT INTO SETORES (NOME, SIGLA, DESCRICAO, ORDEM_EXIBICAO) VALUES 
('Tecnologia da Informação', 'TI', 'Setor de Tecnologia da Informação', 3);

INSERT INTO SETORES (NOME, SIGLA, DESCRICAO, ORDEM_EXIBICAO) VALUES 
('Financeiro', 'FIN', 'Setor Financeiro', 4);

INSERT INTO SETORES (NOME, SIGLA, DESCRICAO, ORDEM_EXIBICAO) VALUES 
('Jurídico', 'JUR', 'Setor Jurídico', 5);

INSERT INTO SETORES (NOME, SIGLA, DESCRICAO, ORDEM_EXIBICAO) VALUES 
('Compras e Licitações', 'CPL', 'Setor de Compras e Licitações', 6);

INSERT INTO SETORES (NOME, SIGLA, DESCRICAO, ORDEM_EXIBICAO) VALUES 
('Protocolo Central', 'PROT', 'Protocolo Central de Documentos', 7);

INSERT INTO SETORES (NOME, SIGLA, DESCRICAO, ORDEM_EXIBICAO) VALUES 
('Arquivo Geral', 'ARQ', 'Arquivo Geral de Documentos', 8);

INSERT INTO SETORES (NOME, SIGLA, DESCRICAO, ORDEM_EXIBICAO) VALUES 
('Ouvidoria', 'OUV', 'Ouvidoria da Organização', 9);

INSERT INTO SETORES (NOME, SIGLA, DESCRICAO, ORDEM_EXIBICAO) VALUES 
('Assessoria de Comunicação', 'ASCOM', 'Assessoria de Comunicação Social', 10);

-- =====================================================
-- INSERIR TIPOS DE PROCESSO INICIAIS
-- =====================================================

PROMPT 'Inserindo tipos de processo...';

INSERT INTO TIPOS_PROCESSO (NOME, DESCRICAO, PRAZO_PADRAO_DIAS, REQUER_APROVACAO) VALUES 
('Solicitação Geral', 'Solicitação geral de serviços ou informações', 15, 'N');

INSERT INTO TIPOS_PROCESSO (NOME, DESCRICAO, PRAZO_PADRAO_DIAS, REQUER_APROVACAO) VALUES 
('Processo Administrativo', 'Processo administrativo interno', 30, 'S');

INSERT INTO TIPOS_PROCESSO (NOME, DESCRICAO, PRAZO_PADRAO_DIAS, REQUER_APROVACAO) VALUES 
('Licitação', 'Processo de licitação pública', 60, 'S');

INSERT INTO TIPOS_PROCESSO (NOME, DESCRICAO, PRAZO_PADRAO_DIAS, REQUER_APROVACAO) VALUES 
('Recurso Humano', 'Processos relacionados a RH', 20, 'S');

INSERT INTO TIPOS_PROCESSO (NOME, DESCRICAO, PRAZO_PADRAO_DIAS, REQUER_APROVACAO) VALUES 
('Financeiro', 'Processos financeiros e orçamentários', 25, 'S');

INSERT INTO TIPOS_PROCESSO (NOME, DESCRICAO, PRAZO_PADRAO_DIAS, REQUER_APROVACAO) VALUES 
('Jurídico', 'Processos jurídicos e legais', 45, 'S');

INSERT INTO TIPOS_PROCESSO (NOME, DESCRICAO, PRAZO_PADRAO_DIAS, REQUER_APROVACAO) VALUES 
('Tecnologia', 'Processos relacionados à TI', 15, 'N');

INSERT INTO TIPOS_PROCESSO (NOME, DESCRICAO, PRAZO_PADRAO_DIAS, REQUER_APROVACAO) VALUES 
('Ouvidoria', 'Processos de ouvidoria e reclamações', 10, 'N');

INSERT INTO TIPOS_PROCESSO (NOME, DESCRICAO, PRAZO_PADRAO_DIAS, REQUER_APROVACAO) VALUES 
('Comunicação', 'Processos de comunicação e divulgação', 7, 'N');

INSERT INTO TIPOS_PROCESSO (NOME, DESCRICAO, PRAZO_PADRAO_DIAS, REQUER_APROVACAO) VALUES 
('Arquivo', 'Processos de arquivamento e consulta', 5, 'N');

-- =====================================================
-- INSERIR USUÁRIO ADMINISTRADOR INICIAL
-- =====================================================

PROMPT 'Inserindo usuário administrador...';

-- Senha padrão: 'admin123' (hash bcrypt)
-- Você deve alterar esta senha no primeiro acesso
INSERT INTO USUARIOS (
  ID,
  NOME, 
  EMAIL, 
  SENHA, 
  PERFIL,
  ATIVO,
  CREATED_AT,
  UPDATED_AT,
  DEPARTAMENTO,
  CPF,
  SEXO,
  ESTADO_CIVIL,
  DATA_NASCIMENTO,
  RG,
  NUMERO_FUNCIONAL,
  CARGO,
  VINCULO_FUNCIONAL,
  SETOR_ID,
  ORGAO,
  SETOR,
  LOTACAO
) VALUES (
  1,
  'Administrador do Sistema',
  'admin@sistema.com',
  '$2b$10$rOzJqQZ9QJZ9QJZ9QOzJqQZ9QJZ9QJZ9QJZ9QJZ9QJZ9QJZ9QJZ9Q', -- admin123
  'ADMIN',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'Tecnologia da Informação',
  '000.000.000-00',
  'M',
  'SOLTEIRO',
  TO_DATE('1980-01-01', 'YYYY-MM-DD'),
  '00.000.000-0',
  '00000',
  'Administrador de Sistema',
  'EFETIVO',
  NULL,
  'Secretaria de Estado',
  'Tecnologia da Informação',
  'Administração de Sistemas'
);

-- =====================================================
-- INSERIR USUÁRIOS DE TESTE
-- =====================================================

PROMPT 'Inserindo usuários de teste...';

-- Usuário Supervisor
INSERT INTO USUARIOS (
  ID,
  NOME, 
  EMAIL, 
  SENHA, 
  PERFIL,
  ATIVO,
  CREATED_AT,
  UPDATED_AT,
  DEPARTAMENTO,
  CPF,
  SEXO,
  ESTADO_CIVIL,
  DATA_NASCIMENTO,
  RG,
  NUMERO_FUNCIONAL,
  CARGO,
  VINCULO_FUNCIONAL,
  SETOR_ID,
  ORGAO,
  SETOR,
  LOTACAO
) VALUES (
  2,
  'João Silva Santos',
  'joao.silva@sistema.com',
  '$2b$10$rOzJqQZ9QJZ9QJZ9QOzJqQZ9QJZ9QJZ9QJZ9QJZ9QJZ9QJZ9QJZ9Q', -- admin123
  'SUPERVISOR',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'Protocolo Central',
  '111.111.111-11',
  'M',
  'CASADO',
  TO_DATE('1975-05-15', 'YYYY-MM-DD'),
  '11.111.111-1',
  '11111',
  'Supervisor de Protocolo',
  'EFETIVO',
  NULL,
  'Secretaria de Estado',
  'Protocolo Central',
  'Supervisão Geral'
);

-- Usuário comum - RH
INSERT INTO USUARIOS (
  ID,
  NOME, 
  EMAIL, 
  SENHA, 
  PERFIL,
  ATIVO,
  CREATED_AT,
  UPDATED_AT,
  DEPARTAMENTO,
  CPF,
  SEXO,
  ESTADO_CIVIL,
  DATA_NASCIMENTO,
  RG,
  NUMERO_FUNCIONAL,
  CARGO,
  VINCULO_FUNCIONAL,
  SETOR_ID,
  ORGAO,
  SETOR,
  LOTACAO
) VALUES (
  3,
  'Maria Oliveira Costa',
  'maria.oliveira@sistema.com',
  '$2b$10$rOzJqQZ9QJZ9QJZ9QOzJqQZ9QJZ9QJZ9QJZ9QJZ9QJZ9QJZ9QJZ9Q', -- admin123
  'USER',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'Recursos Humanos',
  '222.222.222-22',
  'F',
  'CASADO',
  TO_DATE('1985-03-10', 'YYYY-MM-DD'),
  '22.222.222-2',
  '22222',
  'Analista de RH',
  'EFETIVO',
  NULL,
  'Secretaria de Estado',
  'Recursos Humanos',
  'Gestão de Pessoas'
);

-- Usuário comum - Financeiro
INSERT INTO USUARIOS (
  NOME, 
  EMAIL, 
  SENHA, 
  CPF, 
  TELEFONE, 
  CARGO, 
  DEPARTAMENTO, 
  PERFIL, 
  STATUS
) VALUES (
  'Carlos Eduardo Lima',
  'carlos.lima@sistema.com',
  '$2b$10$rOzJqQZ9QJZ9QJZ9QJZ9QOzJqQZ9QJZ9QJZ9QJZ9QJZ9QJZ9QJZ9Q', -- admin123
  '333.333.333-33',
  '(33) 3333-3333',
  'Contador',
  'Financeiro',
  'USER',
  'ATIVO'
);

-- Usuário comum - Jurídico
INSERT INTO USUARIOS (
  NOME, 
  EMAIL, 
  SENHA, 
  CPF, 
  TELEFONE, 
  CARGO, 
  DEPARTAMENTO, 
  PERFIL, 
  STATUS
) VALUES (
  'Ana Paula Ferreira',
  'ana.ferreira@sistema.com',
  '$2b$10$rOzJqQZ9QJZ9QJZ9QJZ9QJZ9QJZ9QJZ9QJZ9QJZ9QJZ9QJZ9QJZ9Q', -- admin123
  '444.444.444-44',
  '(44) 4444-4444',
  'Advogada',
  'Jurídico',
  'USER',
  'ATIVO'
);

-- Usuário comum - TI
INSERT INTO USUARIOS (
  NOME, 
  EMAIL, 
  SENHA, 
  CPF, 
  TELEFONE, 
  CARGO, 
  DEPARTAMENTO, 
  PERFIL, 
  STATUS
) VALUES (
  'Pedro Henrique Souza',
  'pedro.souza@sistema.com',
  '$2b$10$rOzJqQZ9QJZ9QJZ9QJZ9QJZ9QJZ9QJZ9QJZ9QJZ9QJZ9QJZ9QJZ9Q', -- admin123
  '555.555.555-55',
  '(55) 5555-5555',
  'Analista de Sistemas',
  'Tecnologia da Informação',
  'USER',
  'ATIVO'
);

-- =====================================================
-- ATUALIZAR RESPONSÁVEIS DOS SETORES
-- =====================================================

PROMPT 'Atualizando responsáveis dos setores...';

-- Atualizar responsável do setor TI
UPDATE SETORES 
SET RESPONSAVEL_ID = (SELECT ID FROM USUARIOS WHERE EMAIL = 'admin@sistema.com')
WHERE SIGLA = 'TI';

-- Atualizar responsável do Protocolo Central
UPDATE SETORES 
SET RESPONSAVEL_ID = (SELECT ID FROM USUARIOS WHERE EMAIL = 'joao.silva@sistema.com')
WHERE SIGLA = 'PROT';

-- Atualizar responsável do RH
UPDATE SETORES 
SET RESPONSAVEL_ID = (SELECT ID FROM USUARIOS WHERE EMAIL = 'maria.oliveira@sistema.com')
WHERE SIGLA = 'RH';

-- Atualizar responsável do Financeiro
UPDATE SETORES 
SET RESPONSAVEL_ID = (SELECT ID FROM USUARIOS WHERE EMAIL = 'carlos.lima@sistema.com')
WHERE SIGLA = 'FIN';

-- Atualizar responsável do Jurídico
UPDATE SETORES 
SET RESPONSAVEL_ID = (SELECT ID FROM USUARIOS WHERE EMAIL = 'ana.ferreira@sistema.com')
WHERE SIGLA = 'JUR';

-- =====================================================
-- INSERIR PROCESSOS DE EXEMPLO
-- =====================================================

PROMPT 'Inserindo processos de exemplo...';

-- Processo 1 - Solicitação de Material
INSERT INTO PROCESSOS (
  NUMERO_PROCESSO,
  TITULO,
  DESCRICAO,
  TIPO_PROCESSO,
  CATEGORIA,
  PRIORIDADE,
  STATUS,
  DATA_PRAZO,
  SETOR_ORIGEM,
  SETOR_ATUAL,
  RESPONSAVEL_ID,
  CRIADOR_ID,
  OBSERVACOES
) VALUES (
  '2024.001.001',
  'Solicitação de Material de Escritório',
  'Solicitação de material de escritório para o setor de RH, incluindo papel A4, canetas, grampeadores e outros itens básicos.',
  'Solicitação Geral',
  'Material',
  'NORMAL',
  'EM_ANDAMENTO',
  SYSDATE + 15,
  'Recursos Humanos',
  'Compras e Licitações',
  (SELECT ID FROM USUARIOS WHERE EMAIL = 'maria.oliveira@sistema.com'),
  (SELECT ID FROM USUARIOS WHERE EMAIL = 'maria.oliveira@sistema.com'),
  'Urgente para o funcionamento do setor'
);

-- Processo 2 - Manutenção de Sistema
INSERT INTO PROCESSOS (
  NUMERO_PROCESSO,
  TITULO,
  DESCRICAO,
  TIPO_PROCESSO,
  CATEGORIA,
  PRIORIDADE,
  STATUS,
  DATA_PRAZO,
  SETOR_ORIGEM,
  SETOR_ATUAL,
  RESPONSAVEL_ID,
  CRIADOR_ID,
  OBSERVACOES
) VALUES (
  '2024.002.001',
  'Manutenção do Sistema de Protocolo',
  'Solicitação de manutenção preventiva no sistema de protocolo eletrônico, incluindo backup e otimização.',
  'Tecnologia',
  'Manutenção',
  'ALTA',
  'ABERTO',
  SYSDATE + 7,
  'Protocolo Central',
  'Tecnologia da Informação',
  (SELECT ID FROM USUARIOS WHERE EMAIL = 'pedro.souza@sistema.com'),
  (SELECT ID FROM USUARIOS WHERE EMAIL = 'joao.silva@sistema.com'),
  'Sistema apresentando lentidão'
);

-- Processo 3 - Processo Jurídico
INSERT INTO PROCESSOS (
  NUMERO_PROCESSO,
  TITULO,
  DESCRICAO,
  TIPO_PROCESSO,
  CATEGORIA,
  PRIORIDADE,
  STATUS,
  DATA_PRAZO,
  SETOR_ORIGEM,
  SETOR_ATUAL,
  RESPONSAVEL_ID,
  CRIADOR_ID,
  CONFIDENCIAL
) VALUES (
  '2024.003.001',
  'Análise de Contrato de Prestação de Serviços',
  'Análise jurídica de contrato de prestação de serviços de limpeza para aprovação.',
  'Jurídico',
  'Contrato',
  'NORMAL',
  'PENDENTE',
  SYSDATE + 30,
  'Compras e Licitações',
  'Jurídico',
  (SELECT ID FROM USUARIOS WHERE EMAIL = 'ana.ferreira@sistema.com'),
  (SELECT ID FROM USUARIOS WHERE EMAIL = 'admin@sistema.com'),
  'S'
);

-- =====================================================
-- INSERIR TRAMITAÇÕES DE EXEMPLO
-- =====================================================

PROMPT 'Inserindo tramitações de exemplo...';

-- Tramitação do Processo 1
INSERT INTO TRAMITACOES (
  PROCESSO_ID,
  SETOR_ORIGEM,
  SETOR_DESTINO,
  USUARIO_ORIGEM_ID,
  USUARIO_DESTINO_ID,
  DATA_RECEBIMENTO,
  OBSERVACOES,
  TIPO_TRAMITACAO,
  STATUS
) VALUES (
  (SELECT ID FROM PROCESSOS WHERE NUMERO_PROCESSO = '2024.001.001'),
  'Recursos Humanos',
  'Compras e Licitações',
  (SELECT ID FROM USUARIOS WHERE EMAIL = 'maria.oliveira@sistema.com'),
  NULL,
  SYSDATE,
  'Encaminhado para análise e cotação',
  'ENCAMINHAMENTO',
  'RECEBIDO'
);

-- Tramitação do Processo 2
INSERT INTO TRAMITACOES (
  PROCESSO_ID,
  SETOR_ORIGEM,
  SETOR_DESTINO,
  USUARIO_ORIGEM_ID,
  USUARIO_DESTINO_ID,
  OBSERVACOES,
  TIPO_TRAMITACAO,
  STATUS,
  URGENTE
) VALUES (
  (SELECT ID FROM PROCESSOS WHERE NUMERO_PROCESSO = '2024.002.001'),
  'Protocolo Central',
  'Tecnologia da Informação',
  (SELECT ID FROM USUARIOS WHERE EMAIL = 'joao.silva@sistema.com'),
  (SELECT ID FROM USUARIOS WHERE EMAIL = 'pedro.souza@sistema.com'),
  'Sistema com problemas de performance',
  'ENCAMINHAMENTO',
  'ENVIADO',
  'S'
);

-- =====================================================
-- INSERIR LOGS DE AUDITORIA DE EXEMPLO
-- =====================================================

PROMPT 'Inserindo logs de auditoria...';

INSERT INTO LOGS_AUDITORIA (
  TABELA,
  REGISTRO_ID,
  OPERACAO,
  DADOS_NOVOS,
  USUARIO_ID,
  IP_USUARIO,
  OBSERVACOES
) VALUES (
  'USUARIOS',
  (SELECT ID FROM USUARIOS WHERE EMAIL = 'admin@sistema.com'),
  'INSERT',
  '{"nome":"Administrador do Sistema","email":"admin@sistema.com","perfil":"ADMIN"}',
  (SELECT ID FROM USUARIOS WHERE EMAIL = 'admin@sistema.com'),
  '127.0.0.1',
  'Criação do usuário administrador inicial'
);

-- =====================================================
-- CRIAR VIEWS ÚTEIS
-- =====================================================

PROMPT 'Criando views...';

-- View para processos com informações completas
CREATE OR REPLACE VIEW VW_PROCESSOS_COMPLETOS AS
SELECT 
  p.ID,
  p.NUMERO_PROCESSO,
  p.TITULO,
  p.DESCRICAO,
  p.TIPO_PROCESSO,
  p.CATEGORIA,
  p.PRIORIDADE,
  p.STATUS,
  p.DATA_ABERTURA,
  p.DATA_PRAZO,
  p.DATA_CONCLUSAO,
  p.SETOR_ORIGEM,
  p.SETOR_ATUAL,
  u_resp.NOME AS RESPONSAVEL_NOME,
  u_resp.EMAIL AS RESPONSAVEL_EMAIL,
  u_criador.NOME AS CRIADOR_NOME,
  u_criador.EMAIL AS CRIADOR_EMAIL,
  p.OBSERVACOES,
  p.CONFIDENCIAL,
  p.CRIADO_EM,
  p.ATUALIZADO_EM,
  CASE 
    WHEN p.DATA_PRAZO < SYSDATE AND p.STATUS NOT IN ('CONCLUIDO', 'ARQUIVADO', 'CANCELADO') 
    THEN 'S' 
    ELSE 'N' 
  END AS EM_ATRASO,
  CASE 
    WHEN p.DATA_PRAZO IS NOT NULL 
    THEN TRUNC(p.DATA_PRAZO - SYSDATE) 
    ELSE NULL 
  END AS DIAS_PARA_VENCIMENTO
FROM PROCESSOS p
LEFT JOIN USUARIOS u_resp ON p.RESPONSAVEL_ID = u_resp.ID
LEFT JOIN USUARIOS u_criador ON p.CRIADOR_ID = u_criador.ID;

-- View para tramitações com informações completas
CREATE OR REPLACE VIEW VW_TRAMITACOES_COMPLETAS AS
SELECT 
  t.ID,
  t.PROCESSO_ID,
  p.NUMERO_PROCESSO,
  p.TITULO AS PROCESSO_TITULO,
  t.SETOR_ORIGEM,
  t.SETOR_DESTINO,
  u_origem.NOME AS USUARIO_ORIGEM_NOME,
  u_origem.EMAIL AS USUARIO_ORIGEM_EMAIL,
  u_destino.NOME AS USUARIO_DESTINO_NOME,
  u_destino.EMAIL AS USUARIO_DESTINO_EMAIL,
  t.DATA_TRAMITACAO,
  t.DATA_RECEBIMENTO,
  t.OBSERVACOES,
  t.TIPO_TRAMITACAO,
  t.STATUS,
  t.PRAZO_RESPOSTA,
  t.URGENTE,
  CASE 
    WHEN t.STATUS = 'ENVIADO' AND t.PRAZO_RESPOSTA < SYSDATE 
    THEN 'S' 
    ELSE 'N' 
  END AS TRAMITACAO_EM_ATRASO
FROM TRAMITACOES t
LEFT JOIN PROCESSOS p ON t.PROCESSO_ID = p.ID
LEFT JOIN USUARIOS u_origem ON t.USUARIO_ORIGEM_ID = u_origem.ID
LEFT JOIN USUARIOS u_destino ON t.USUARIO_DESTINO_ID = u_destino.ID;

-- View para estatísticas por setor
CREATE OR REPLACE VIEW VW_ESTATISTICAS_SETOR AS
SELECT 
  s.NOME AS SETOR,
  s.SIGLA,
  COUNT(p.ID) AS TOTAL_PROCESSOS,
  COUNT(CASE WHEN p.STATUS = 'ABERTO' THEN 1 END) AS PROCESSOS_ABERTOS,
  COUNT(CASE WHEN p.STATUS = 'EM_ANDAMENTO' THEN 1 END) AS PROCESSOS_EM_ANDAMENTO,
  COUNT(CASE WHEN p.STATUS = 'PENDENTE' THEN 1 END) AS PROCESSOS_PENDENTES,
  COUNT(CASE WHEN p.STATUS = 'CONCLUIDO' THEN 1 END) AS PROCESSOS_CONCLUIDOS,
  COUNT(CASE WHEN p.DATA_PRAZO < SYSDATE AND p.STATUS NOT IN ('CONCLUIDO', 'ARQUIVADO', 'CANCELADO') THEN 1 END) AS PROCESSOS_EM_ATRASO
FROM SETORES s
LEFT JOIN PROCESSOS p ON s.NOME = p.SETOR_ATUAL
GROUP BY s.NOME, s.SIGLA;

-- =====================================================
-- CRIAR FUNÇÃO PARA GERAR NÚMERO DE PROCESSO
-- =====================================================

PROMPT 'Criando função para gerar número de processo...';

CREATE OR REPLACE FUNCTION FN_GERAR_NUMERO_PROCESSO(
  p_setor_sigla VARCHAR2 DEFAULT NULL
) RETURN VARCHAR2
IS
  v_ano VARCHAR2(4);
  v_sequencial NUMBER;
  v_numero_processo VARCHAR2(50);
  v_sigla VARCHAR2(10);
BEGIN
  -- Obter ano atual
  v_ano := TO_CHAR(SYSDATE, 'YYYY');
  
  -- Usar sigla fornecida ou padrão
  v_sigla := NVL(p_setor_sigla, 'PROT');
  
  -- Obter próximo sequencial do ano
  SELECT NVL(MAX(TO_NUMBER(SUBSTR(NUMERO_PROCESSO, 6, 3))), 0) + 1
  INTO v_sequencial
  FROM PROCESSOS
  WHERE SUBSTR(NUMERO_PROCESSO, 1, 4) = v_ano;
  
  -- Gerar número no formato: YYYY.SSS.NNN
  v_numero_processo := v_ano || '.' || 
                      LPAD(v_sequencial, 3, '0') || '.' ||
                      LPAD(SEQ_PROCESSOS.CURRVAL, 3, '0');
  
  RETURN v_numero_processo;
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, gerar número simples
    RETURN v_ano || '.' || LPAD(SEQ_PROCESSOS.CURRVAL, 3, '0') || '.001';
END;
/

-- =====================================================
-- FINALIZAÇÃO
-- =====================================================

PROMPT 'Dados iniciais inseridos com sucesso!';
PROMPT '';
PROMPT '=========================================';
PROMPT 'USUÁRIOS CRIADOS:';
PROMPT '=========================================';
PROMPT 'Administrador:';
PROMPT '  Email: admin@sistema.com';
PROMPT '  Senha: admin123';
PROMPT '';
PROMPT 'Supervisor:';
PROMPT '  Email: joao.silva@sistema.com';
PROMPT '  Senha: admin123';
PROMPT '';
PROMPT 'Usuários comuns:';
PROMPT '  maria.oliveira@sistema.com (RH)';
PROMPT '  carlos.lima@sistema.com (Financeiro)';
PROMPT '  ana.ferreira@sistema.com (Jurídico)';
PROMPT '  pedro.souza@sistema.com (TI)';
PROMPT '  Senha para todos: admin123';
PROMPT '';
PROMPT '⚠️  IMPORTANTE: Altere as senhas padrão!';
PROMPT '=========================================';

COMMIT;

PROMPT 'Execute o próximo script se necessário: 03_create_indexes.sql';

-- Usuário comum - Marketing
INSERT INTO USUARIOS (
  ID,
  NOME, 
  EMAIL, 
  SENHA, 
  PERFIL,
  ATIVO,
  CREATED_AT,
  UPDATED_AT,
  DEPARTAMENTO,
  CPF,
  SEXO,
  ESTADO_CIVIL,
  DATA_NASCIMENTO,
  RG,
  NUMERO_FUNCIONAL,
  CARGO,
  VINCULO_FUNCIONAL,
  SETOR_ID,
  ORGAO,
  SETOR,
  LOTACAO
) VALUES (
  7,
  'Larissa Gomes Andrade',
  'larissa.andrade@sistema.com',
  '$2b$10$rOzJqQZ9QJZ9QJZ9QJZ9QOzJqQZ9QJZ9QJZ9QJZ9QJZ9QJZ9QJZ9Q', -- admin123
  'USER',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'Marketing',
  '666.666.666-66',
  'F',
  'CASADO',
  TO_DATE('1988-03-20', 'YYYY-MM-DD'),
  '11.222.333-4',
  '66666',
  'Analista de Marketing',
  'EFETIVO',
  NULL,
  'Secretaria de Estado',
  'Marketing',
  'Setor de Comunicação'
);

-- Usuário comum - Logística
INSERT INTO USUARIOS (
  ID,
  NOME, 
  EMAIL, 
  SENHA, 
  PERFIL,
  ATIVO,
  CREATED_AT,
  UPDATED_AT,
  DEPARTAMENTO,
  CPF,
  SEXO,
  ESTADO_CIVIL,
  DATA_NASCIMENTO,
  RG,
  NUMERO_FUNCIONAL,
  CARGO,
  VINCULO_FUNCIONAL,
  SETOR_ID,
  ORGAO,
  SETOR,
  LOTACAO
) VALUES (
  8,
  'Vinícius Barros Almeida',
  'vinicius.almeida@sistema.com',
  '$2b$10$rOzJqQZ9QJZ9QJZ9QOzJqQZ9QJZ9QJZ9QJZ9QJZ9QJZ9QJZ9QJZ9Q', -- admin123
  'USER',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'Logística',
  '777.777.777-77',
  'M',
  'SOLTEIRO',
  TO_DATE('1985-07-10', 'YYYY-MM-DD'),
  '22.333.444-5',
  '77777',
  'Coordenador de Logística',
  'EFETIVO',
  NULL,
  'Secretaria de Estado',
  'Logística',
  'Almoxarifado Central'
);

-- Usuário comum - Ouvidoria
INSERT INTO USUARIOS (
  ID,
  NOME, 
  EMAIL, 
  SENHA, 
  PERFIL,
  ATIVO,
  CREATED_AT,
  UPDATED_AT,
  DEPARTAMENTO,
  CPF,
  SEXO,
  ESTADO_CIVIL,
  DATA_NASCIMENTO,
  RG,
  NUMERO_FUNCIONAL,
  CARGO,
  VINCULO_FUNCIONAL,
  SETOR_ID,
  ORGAO,
  SETOR,
  LOTACAO
) VALUES (
  9,
  'Fernanda Ribeiro Nunes',
  'fernanda.nunes@sistema.com',
  '$2b$10$rOzJqQZ9QJZ9QJZ9QJZ9QOzJqQZ9QJZ9QJZ9QJZ9QJZ9QJZ9QJZ9Q', -- admin123
  'USER',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'Ouvidoria',
  '888.888.888-88',
  'F',
  'DIVORCIADO',
  TO_DATE('1982-11-25', 'YYYY-MM-DD'),
  '33.444.555-6',
  '88888',
  'Ouvidora',
  'EFETIVO',
  NULL,
  'Secretaria de Estado',
  'Ouvidoria',
  'Atendimento ao Cidadão'
);

-- Usuário comum - Segurança
INSERT INTO USUARIOS (
  ID,
  NOME, 
  EMAIL, 
  SENHA, 
  PERFIL,
  ATIVO,
  CREATED_AT,
  UPDATED_AT,
  DEPARTAMENTO,
  CPF,
  SEXO,
  ESTADO_CIVIL,
  DATA_NASCIMENTO,
  RG,
  NUMERO_FUNCIONAL,
  CARGO,
  VINCULO_FUNCIONAL,
  SETOR_ID,
  ORGAO,
  SETOR,
  LOTACAO
) VALUES (
  10,
  'Rafael Costa Mendes',
  'rafael.mendes@sistema.com',
  '$2b$10$rOzJqQZ9QJZ9QJZ9QOzJqQZ9QJZ9QJZ9QJZ9QJZ9QJZ9QJZ9QJZ9Q', -- admin123
  'USER',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'Segurança da Informação',
  '999.999.999-99',
  'M',
  'CASADO',
  TO_DATE('1987-09-15', 'YYYY-MM-DD'),
  '44.555.666-7',
  '99999',
  'Analista de Segurança',
  'EFETIVO',
  NULL,
  'Secretaria de Estado',
  'Segurança da Informação',
  'Centro de Operações de Segurança'
);

-- Usuário comum - Pesquisa
INSERT INTO USUARIOS (
  ID,
  NOME, 
  EMAIL, 
  SENHA, 
  PERFIL,
  ATIVO,
  CREATED_AT,
  UPDATED_AT,
  DEPARTAMENTO,
  CPF,
  SEXO,
  ESTADO_CIVIL,
  DATA_NASCIMENTO,
  RG,
  NUMERO_FUNCIONAL,
  CARGO,
  VINCULO_FUNCIONAL,
  SETOR_ID,
  ORGAO,
  SETOR,
  LOTACAO
) VALUES (
  11,
  'Beatriz Martins Lopes',
  'beatriz.lopes@sistema.com',
  '$2b$10$rOzJqQZ9QJZ9QJZ9QJZ9QOzJqQZ9QJZ9QJZ9QJZ9QJZ9QJZ9QJZ9Q', -- admin123
  'USER',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'Centro de Pesquisa',
  '101.101.101-10',
  'F',
  'SOLTEIRO',
  TO_DATE('1990-05-15', 'YYYY-MM-DD'),
  '12.345.678-9',
  '75721',
  'Pesquisadora',
  'EFETIVO',
  NULL,
  'Secretaria de Estado',
  'Centro de Pesquisa',
  'Laboratório de Análises'
);

-- =====================================================
-- ATUALIZAR RESPONSÁVEIS DOS SETORES