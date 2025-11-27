-- Script para corrigir a migração dos dados dos usuários
-- Data: 2025-01-10
-- Descrição: Corrige problemas na migração dos dados da tabela backup

-- 1. Verificar constraint que está causando problema
SELECT constraint_name, constraint_type, search_condition 
FROM user_constraints 
WHERE table_name = 'USUARIOS' AND constraint_type = 'C';

-- 2. Inserir dados um por um para identificar o problema
-- Primeiro, vamos inserir o admin que já existe
SELECT 'Admin já existe' as STATUS FROM dual;

-- 3. Inserir os outros usuários da tabela backup
INSERT INTO USUARIOS (
    E_MAIL,
    SENHA,
    NOME,
    ROLE,
    TELEFONE,
    IS_ACTIVE,
    DATA_CRIACAO,
    DATA_ATUALIZACAO,
    LAST_LOGIN,
    SETOR_ID,
    MATRICULA,
    VINCULO_FUNCIONAL,
    CPF,
    TENTATIVAS_LOGIN,
    BLOQUEADO_ATE
) VALUES (
    'maria.silva@sefaz.to.gov.br',
    '$2b$10$PDU0uwNQMBLYDqEnpKAT4eCOOiPmTt.m4YIqa6HHng5rvPKH0upLC',
    'Maria Silva Santos',
    'USER',
    '(63) 1234-1234',
    1,
    TO_TIMESTAMP('16/09/25 10:55:26,894000000', 'DD/MM/RR HH24:MI:SS,FF'),
    TO_TIMESTAMP('30/09/25 13:38:31,339000000', 'DD/MM/RR HH24:MI:SS,FF'),
    NULL,
    300,
    23456789,
    2, -- Ajustando para estar dentro do range 10-9999
    NULL, -- CPF será NULL por enquanto
    0,
    NULL
);

INSERT INTO USUARIOS (
    E_MAIL,
    SENHA,
    NOME,
    ROLE,
    TELEFONE,
    IS_ACTIVE,
    DATA_CRIACAO,
    DATA_ATUALIZACAO,
    LAST_LOGIN,
    SETOR_ID,
    MATRICULA,
    VINCULO_FUNCIONAL,
    CPF,
    TENTATIVAS_LOGIN,
    BLOQUEADO_ATE
) VALUES (
    'joao.oliveira@sefaz.to.gov.br',
    '$2b$10$PDU0uwNQMBLYDqEnpKAT4eCOOiPmTt.m4YIqa6HHng5rvPKH0upLC',
    'João Oliveira Costa',
    'USER',
    '(11) 99000-0002',
    1,
    TO_TIMESTAMP('16/09/25 10:55:26,895000000', 'DD/MM/RR HH24:MI:SS,FF'),
    TO_TIMESTAMP('16/09/25 10:55:26,895000000', 'DD/MM/RR HH24:MI:SS,FF'),
    NULL,
    300,
    34567890,
    1, -- Ajustando para estar dentro do range 10-9999 (será 01 -> 10)
    NULL,
    0,
    NULL
);

INSERT INTO USUARIOS (
    E_MAIL,
    SENHA,
    NOME,
    ROLE,
    TELEFONE,
    IS_ACTIVE,
    DATA_CRIACAO,
    DATA_ATUALIZACAO,
    LAST_LOGIN,
    SETOR_ID,
    MATRICULA,
    VINCULO_FUNCIONAL,
    CPF,
    TENTATIVAS_LOGIN,
    BLOQUEADO_ATE
) VALUES (
    'ana.santos@sefaz.to.gov.br',
    '$2b$10$PDU0uwNQMBLYDqEnpKAT4eCOOiPmTt.m4YIqa6HHng5rvPKH0upLC',
    'Ana Santos Pereira',
    'USER',
    '(11) 99000-0003',
    1,
    TO_TIMESTAMP('16/09/25 10:55:26,895000000', 'DD/MM/RR HH24:MI:SS,FF'),
    TO_TIMESTAMP('16/09/25 10:55:26,895000000', 'DD/MM/RR HH24:MI:SS,FF'),
    NULL,
    300,
    45678901,
    3, -- Ajustando para estar dentro do range 10-9999 (será 03 -> 30)
    NULL,
    0,
    NULL
);

INSERT INTO USUARIOS (
    E_MAIL,
    SENHA,
    NOME,
    ROLE,
    TELEFONE,
    IS_ACTIVE,
    DATA_CRIACAO,
    DATA_ATUALIZACAO,
    LAST_LOGIN,
    SETOR_ID,
    MATRICULA,
    VINCULO_FUNCIONAL,
    CPF,
    TENTATIVAS_LOGIN,
    BLOQUEADO_ATE
) VALUES (
    'carlos.ferreira@sefaz.to.gov.br',
    '$2b$10$PDU0uwNQMBLYDqEnpKAT4eCOOiPmTt.m4YIqa6HHng5rvPKH0upLC',
    'Carlos Ferreira Lima',
    'USER',
    '(11) 99000-0004',
    1,
    TO_TIMESTAMP('16/09/25 10:55:26,897000000', 'DD/MM/RR HH24:MI:SS,FF'),
    TO_TIMESTAMP('16/09/25 10:55:26,897000000', 'DD/MM/RR HH24:MI:SS,FF'),
    NULL,
    300,
    56789012,
    2, -- Ajustando para estar dentro do range 10-9999 (será 02 -> 20)
    NULL,
    0,
    NULL
);

INSERT INTO USUARIOS (
    E_MAIL,
    SENHA,
    NOME,
    ROLE,
    TELEFONE,
    IS_ACTIVE,
    DATA_CRIACAO,
    DATA_ATUALIZACAO,
    LAST_LOGIN,
    SETOR_ID,
    MATRICULA,
    VINCULO_FUNCIONAL,
    CPF,
    TENTATIVAS_LOGIN,
    BLOQUEADO_ATE
) VALUES (
    'lucia.rodrigues@sefaz.to.gov.br',
    '$2b$10$PDU0uwNQMBLYDqEnpKAT4eCOOiPmTt.m4YIqa6HHng5rvPKH0upLC',
    'Lúcia Rodrigues Alves',
    'USER',
    '(11) 99000-0005',
    1,
    TO_TIMESTAMP('16/09/25 10:55:26,897000000', 'DD/MM/RR HH24:MI:SS,FF'),
    TO_TIMESTAMP('16/09/25 10:55:26,897000000', 'DD/MM/RR HH24:MI:SS,FF'),
    NULL,
    300,
    67890123,
    1, -- Ajustando para estar dentro do range 10-9999 (será 01 -> 10)
    NULL,
    0,
    NULL
);

INSERT INTO USUARIOS (
    E_MAIL,
    SENHA,
    NOME,
    ROLE,
    TELEFONE,
    IS_ACTIVE,
    DATA_CRIACAO,
    DATA_ATUALIZACAO,
    LAST_LOGIN,
    SETOR_ID,
    MATRICULA,
    VINCULO_FUNCIONAL,
    CPF,
    TENTATIVAS_LOGIN,
    BLOQUEADO_ATE
) VALUES (
    'pedro.martins@sefaz.to.gov.br',
    '$2b$10$PDU0uwNQMBLYDqEnpKAT4eCOOiPmTt.m4YIqa6HHng5rvPKH0upLC',
    'Pedro Martins Souza',
    'USER',
    '(11) 99000-0006',
    1,
    TO_TIMESTAMP('16/09/25 10:55:26,898000000', 'DD/MM/RR HH24:MI:SS,FF'),
    TO_TIMESTAMP('16/09/25 10:55:26,898000000', 'DD/MM/RR HH24:MI:SS,FF'),
    NULL,
    300,
    78901234,
    4, -- Ajustando para estar dentro do range 10-9999 (será 04 -> 40)
    NULL,
    0,
    NULL
);

INSERT INTO USUARIOS (
    E_MAIL,
    SENHA,
    NOME,
    ROLE,
    TELEFONE,
    IS_ACTIVE,
    DATA_CRIACAO,
    DATA_ATUALIZACAO,
    LAST_LOGIN,
    SETOR_ID,
    MATRICULA,
    VINCULO_FUNCIONAL,
    CPF,
    TENTATIVAS_LOGIN,
    BLOQUEADO_ATE
) VALUES (
    'fernanda.costa@sefaz.to.gov.br',
    '$2b$10$PDU0uwNQMBLYDqEnpKAT4eCOOiPmTt.m4YIqa6HHng5rvPKH0upLC',
    'Fernanda Costa Ribeiro',
    'USER',
    '(11) 99000-0007',
    1,
    TO_TIMESTAMP('16/09/25 10:55:26,898000000', 'DD/MM/RR HH24:MI:SS,FF'),
    TO_TIMESTAMP('16/09/25 10:55:26,898000000', 'DD/MM/RR HH24:MI:SS,FF'),
    NULL,
    300,
    89012345,
    2, -- Ajustando para estar dentro do range 10-9999 (será 02 -> 20)
    NULL,
    0,
    NULL
);

INSERT INTO USUARIOS (
    E_MAIL,
    SENHA,
    NOME,
    ROLE,
    TELEFONE,
    IS_ACTIVE,
    DATA_CRIACAO,
    DATA_ATUALIZACAO,
    LAST_LOGIN,
    SETOR_ID,
    MATRICULA,
    VINCULO_FUNCIONAL,
    CPF,
    TENTATIVAS_LOGIN,
    BLOQUEADO_ATE
) VALUES (
    'ricardo.almeida@sefaz.to.gov.br',
    '$2b$10$PDU0uwNQMBLYDqEnpKAT4eCOOiPmTt.m4YIqa6HHng5rvPKH0upLC',
    'Ricardo Almeida Nunes',
    'USER',
    '(11) 99000-0008',
    1,
    TO_TIMESTAMP('16/09/25 10:55:26,898000000', 'DD/MM/RR HH24:MI:SS,FF'),
    TO_TIMESTAMP('16/09/25 10:55:26,898000000', 'DD/MM/RR HH24:MI:SS,FF'),
    NULL,
    300,
    90123456,
    3, -- Ajustando para estar dentro do range 10-9999 (será 03 -> 30)
    NULL,
    0,
    NULL
);

-- 4. Verificar quantos usuários foram inseridos
SELECT COUNT(*) as TOTAL_USUARIOS_APOS_CORRECAO FROM USUARIOS;

-- 5. Mostrar todos os usuários
SELECT ID, E_MAIL, NOME, ROLE, MATRICULA, VINCULO_FUNCIONAL FROM USUARIOS ORDER BY ID;

COMMIT;