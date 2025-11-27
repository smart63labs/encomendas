-- =====================================================
-- INSERÇÃO DE DADOS FICTÍCIOS
-- Data: 2025-01-11
-- Objetivo: Inserir dados fictícios nas tabelas USUARIOS e SETORES
-- =====================================================

-- =====================================================
-- 1. INSERIR DADOS NA TABELA SETORES
-- =====================================================

-- Setor A
INSERT INTO SETORES (
  CODIGO_SETOR,
  NOME_SETOR,
  ORGAO,
  SETOR,
  LOTACAO,
  DESCRICAO,
  ATIVO,
  CREATED_AT,
  UPDATED_AT,
  LOGRADOURO,
  NUMERO,
  COMPLEMENTO,
  BAIRRO,
  CIDADE,
  ESTADO,
  CEP,
  TELEFONE,
  EMAIL
) VALUES (
  'SETA-001',
  'Setor A',
  'SECRETARIA DA FAZENDA',
  'SETOR ADMINISTRATIVO',
  'SEDE - BLOCO A',
  'Setor responsável por atividades administrativas e gestão de recursos humanos',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'Rua das Flores, 123',
  '123',
  'Sala 101',
  'Centro',
  'São Paulo',
  'SP',
  '01234-567',
  '(11) 3333-1111',
  'setor.a@fazenda.sp.gov.br'
);

-- Setor B
INSERT INTO SETORES (
  CODIGO_SETOR,
  NOME_SETOR,
  ORGAO,
  SETOR,
  LOTACAO,
  DESCRICAO,
  ATIVO,
  CREATED_AT,
  UPDATED_AT,
  LOGRADOURO,
  NUMERO,
  COMPLEMENTO,
  BAIRRO,
  CIDADE,
  ESTADO,
  CEP,
  TELEFONE,
  EMAIL
) VALUES (
  'SETB-001',
  'Setor B',
  'SECRETARIA DA FAZENDA',
  'SETOR DE TECNOLOGIA',
  'SEDE - BLOCO B',
  'Setor responsável por tecnologia da informação e sistemas',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  'Avenida Paulista, 456',
  '456',
  'Andar 5',
  'Bela Vista',
  'São Paulo',
  'SP',
  '01310-100',
  '(11) 3333-2222',
  'setor.b@fazenda.sp.gov.br'
);

-- =====================================================
-- 2. INSERIR DADOS NA TABELA USUARIOS
-- =====================================================

-- Fulano A (vinculado ao Setor A)
INSERT INTO USUARIOS (
  EMAIL,
  PASSWORD_HASH,
  NAME,
  ROLE,
  DEPARTMENT,
  PHONE,
  IS_ACTIVE,
  SETOR_ID,
  CREATED_AT,
  UPDATED_AT
) VALUES (
  'fulano.a@fazenda.sp.gov.br',
  '$2b$10$PDU0uwNQMBLYDqEnpKAT4eCOOiPmTt.m4YIqa6HHng5rvPKH0upLC',
  'Fulano A',
  'USER',
  'RECURSOS HUMANOS',
  '(11) 99999-1111',
  1,
  (SELECT ID FROM SETORES WHERE NOME_SETOR = 'Setor A'),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Fulano B (vinculado ao Setor B)
INSERT INTO USUARIOS (
  EMAIL,
  PASSWORD_HASH,
  NAME,
  ROLE,
  DEPARTMENT,
  PHONE,
  IS_ACTIVE,
  SETOR_ID,
  CREATED_AT,
  UPDATED_AT
) VALUES (
  'fulano.b@fazenda.sp.gov.br',
  '$2b$10$PDU0uwNQMBLYDqEnpKAT4eCOOiPmTt.m4YIqa6HHng5rvPKH0upLC',
  'Fulano B',
  'USER',
  'TECNOLOGIA DA INFORMAÇÃO',
  '(11) 99999-2222',
  1,
  (SELECT ID FROM SETORES WHERE NOME_SETOR = 'Setor B'),
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

COMMIT;