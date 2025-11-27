-- =====================================================
-- SCRIPT DE ATUALIZAÇÃO COMPLETA DA TABELA SETORES
-- Data: 2025-01-15
-- Objetivo: Inserir 5 novos setores e atualizar endereços de todos os 10 setores
-- =====================================================

-- Configurações iniciais
SET SERVEROUTPUT ON;
ALTER SESSION SET NLS_DATE_FORMAT = 'DD/MM/YYYY HH24:MI:SS';

PROMPT '=====================================================';
PROMPT 'INICIANDO ATUALIZAÇÃO COMPLETA DA TABELA SETORES';
PROMPT '=====================================================';

-- =====================================================
-- 1. INSERIR 5 NOVOS SETORES FICTÍCIOS
-- =====================================================

-- Setor 6: Auditoria
INSERT INTO SETORES (
  CODIGO_SETOR,
  NOME_SETOR,
  ORGAO,
  SETOR,
  LOTACAO,
  DESCRICAO,
  ATIVO,
  CREATED_AT,
  UPDATED_AT
) VALUES (
  'AUD-001',
  'Auditoria',
  'SECRETARIA DA FAZENDA',
  'AUDITORIA FISCAL',
  'SEDE - ANDAR 6',
  'Setor responsável por auditoria fiscal e controle interno',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Setor 7: Arrecadação
INSERT INTO SETORES (
  CODIGO_SETOR,
  NOME_SETOR,
  ORGAO,
  SETOR,
  LOTACAO,
  DESCRICAO,
  ATIVO,
  CREATED_AT,
  UPDATED_AT
) VALUES (
  'ARR-001',
  'Arrecadação',
  'SECRETARIA DA FAZENDA',
  'ARRECADAÇÃO E COBRANÇA',
  'SEDE - ANDAR 7',
  'Setor responsável por arrecadação de tributos e cobrança',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Setor 8: Fiscalização
INSERT INTO SETORES (
  CODIGO_SETOR,
  NOME_SETOR,
  ORGAO,
  SETOR,
  LOTACAO,
  DESCRICAO,
  ATIVO,
  CREATED_AT,
  UPDATED_AT
) VALUES (
  'FISC-001',
  'Fiscalização',
  'SECRETARIA DA FAZENDA',
  'FISCALIZAÇÃO TRIBUTÁRIA',
  'SEDE - ANDAR 8',
  'Setor responsável por fiscalização tributária e controle',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Setor 9: Planejamento
INSERT INTO SETORES (
  CODIGO_SETOR,
  NOME_SETOR,
  ORGAO,
  SETOR,
  LOTACAO,
  DESCRICAO,
  ATIVO,
  CREATED_AT,
  UPDATED_AT
) VALUES (
  'PLAN-001',
  'Planejamento',
  'SECRETARIA DA FAZENDA',
  'PLANEJAMENTO ESTRATÉGICO',
  'SEDE - ANDAR 9',
  'Setor responsável por planejamento estratégico e orçamento',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Setor 10: Atendimento
INSERT INTO SETORES (
  CODIGO_SETOR,
  NOME_SETOR,
  ORGAO,
  SETOR,
  LOTACAO,
  DESCRICAO,
  ATIVO,
  CREATED_AT,
  UPDATED_AT
) VALUES (
  'ATEN-001',
  'Atendimento',
  'SECRETARIA DA FAZENDA',
  'ATENDIMENTO AO CONTRIBUINTE',
  'SEDE - TÉRREO',
  'Setor responsável por atendimento ao público e contribuintes',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

DBMS_OUTPUT.PUT_LINE('✅ 5 novos setores inseridos com sucesso!');

-- =====================================================
-- 2. ATUALIZAR ENDEREÇOS DOS 10 SETORES
-- =====================================================

-- Setor 1 (ID 25) - Palmas
UPDATE SETORES SET 
  LOGRADOURO = 'Avenida JK',
  NUMERO = 'Lote 28-A',
  COMPLEMENTO = 'Edifício Via Nobre Empresarial',
  BAIRRO = 'Centro',
  CIDADE = 'Palmas',
  ESTADO = 'TO',
  CEP = '77066-014',
  TELEFONE = '(63) 3218-1001',
  EMAIL = 'rh@sefaz.to.gov.br',
  UPDATED_AT = CURRENT_TIMESTAMP
WHERE ID = 25;

-- Setor 2 (ID 26) - Araguaína
UPDATE SETORES SET 
  LOGRADOURO = 'Rua Vinte e Cinco de Dezembro',
  NUMERO = '52',
  COMPLEMENTO = NULL,
  BAIRRO = 'Centro',
  CIDADE = 'Araguaína',
  ESTADO = 'TO',
  CEP = '77804-030',
  TELEFONE = '(63) 3218-1002',
  EMAIL = 'ti@sefaz.to.gov.br',
  UPDATED_AT = CURRENT_TIMESTAMP
WHERE ID = 26;

-- Setor 3 (ID 27) - Gurupi
UPDATE SETORES SET 
  LOGRADOURO = 'Avenida Murilo Braga',
  NUMERO = '1887',
  COMPLEMENTO = NULL,
  BAIRRO = 'Centro',
  CIDADE = 'Gurupi',
  ESTADO = 'TO',
  CEP = '77400-000',
  TELEFONE = '(63) 3218-1003',
  EMAIL = 'financeiro@sefaz.to.gov.br',
  UPDATED_AT = CURRENT_TIMESTAMP
WHERE ID = 27;

-- Setor 4 (ID 28) - Porto Nacional
UPDATE SETORES SET 
  LOGRADOURO = 'Rua 26 de Julho',
  NUMERO = 's/n',
  COMPLEMENTO = NULL,
  BAIRRO = 'Centro',
  CIDADE = 'Porto Nacional',
  ESTADO = 'TO',
  CEP = '77500-000',
  TELEFONE = '(63) 3218-1004',
  EMAIL = 'juridico@sefaz.to.gov.br',
  UPDATED_AT = CURRENT_TIMESTAMP
WHERE ID = 28;

-- Setor 5 (ID 29) - Paraíso do Tocantins
UPDATE SETORES SET 
  LOGRADOURO = 'Rua Tapajós',
  NUMERO = '573',
  COMPLEMENTO = NULL,
  BAIRRO = 'Setor Central',
  CIDADE = 'Paraíso do Tocantins',
  ESTADO = 'TO',
  CEP = '77600-970',
  TELEFONE = '(63) 3218-1005',
  EMAIL = 'protocolo@sefaz.to.gov.br',
  UPDATED_AT = CURRENT_TIMESTAMP
WHERE ID = 29;

-- Setor 6 (Auditoria) - Colinas do Tocantins
UPDATE SETORES SET 
  LOGRADOURO = 'Rua Presidente Dutra',
  NUMERO = '263',
  COMPLEMENTO = NULL,
  BAIRRO = 'Centro',
  CIDADE = 'Colinas do Tocantins',
  ESTADO = 'TO',
  CEP = '77760-000',
  TELEFONE = '(63) 3218-1006',
  EMAIL = 'auditoria@sefaz.to.gov.br',
  UPDATED_AT = CURRENT_TIMESTAMP
WHERE CODIGO_SETOR = 'AUD-001';

-- Setor 7 (Arrecadação) - Guaraí
UPDATE SETORES SET 
  LOGRADOURO = 'Avenida Bernardo Sayão',
  NUMERO = 's/n',
  COMPLEMENTO = NULL,
  BAIRRO = 'Centro',
  CIDADE = 'Guaraí',
  ESTADO = 'TO',
  CEP = '77700-000',
  TELEFONE = '(63) 3218-1007',
  EMAIL = 'arrecadacao@sefaz.to.gov.br',
  UPDATED_AT = CURRENT_TIMESTAMP
WHERE CODIGO_SETOR = 'ARR-001';

-- Setor 8 (Fiscalização) - Dianópolis
UPDATE SETORES SET 
  LOGRADOURO = 'Avenida Independência',
  NUMERO = 's/n',
  COMPLEMENTO = NULL,
  BAIRRO = 'Centro',
  CIDADE = 'Dianópolis',
  ESTADO = 'TO',
  CEP = '77300-000',
  TELEFONE = '(63) 3218-1008',
  EMAIL = 'fiscalizacao@sefaz.to.gov.br',
  UPDATED_AT = CURRENT_TIMESTAMP
WHERE CODIGO_SETOR = 'FISC-001';

-- Setor 9 (Planejamento) - Tocantinópolis
UPDATE SETORES SET 
  LOGRADOURO = 'Rua da Liberdade',
  NUMERO = 's/n',
  COMPLEMENTO = NULL,
  BAIRRO = 'Centro',
  CIDADE = 'Tocantinópolis',
  ESTADO = 'TO',
  CEP = '77900-000',
  TELEFONE = '(63) 3218-1009',
  EMAIL = 'planejamento@sefaz.to.gov.br',
  UPDATED_AT = CURRENT_TIMESTAMP
WHERE CODIGO_SETOR = 'PLAN-001';

-- Setor 10 (Atendimento) - Augustinópolis
UPDATE SETORES SET 
  LOGRADOURO = 'Rua Dom Pedro I',
  NUMERO = '352',
  COMPLEMENTO = NULL,
  BAIRRO = 'Centro',
  CIDADE = 'Augustinópolis',
  ESTADO = 'TO',
  CEP = '77960-000',
  TELEFONE = '(63) 3218-1010',
  EMAIL = 'atendimento@sefaz.to.gov.br',
  UPDATED_AT = CURRENT_TIMESTAMP
WHERE CODIGO_SETOR = 'ATEN-001';

DBMS_OUTPUT.PUT_LINE('✅ Endereços, telefones e emails atualizados para todos os 10 setores!');

-- =====================================================
-- 3. VERIFICAR RESULTADOS
-- =====================================================

PROMPT 'Verificando os 10 setores atualizados...';

SELECT 
  ID,
  CODIGO_SETOR,
  NOME_SETOR,
  CIDADE,
  TELEFONE,
  EMAIL
FROM SETORES 
ORDER BY ID;

COMMIT;

PROMPT '=====================================================';
PROMPT 'ATUALIZAÇÃO COMPLETA DA TABELA SETORES CONCLUÍDA!';
PROMPT '=====================================================';
PROMPT 'Resumo das alterações:';
PROMPT '- Inseridos 5 novos setores fictícios';
PROMPT '- Atualizados endereços de todos os 10 setores';
PROMPT '- Criados telefones com DDD 063';
PROMPT '- Criados emails com domínio @sefaz.to.gov.br';
PROMPT '=====================================================';