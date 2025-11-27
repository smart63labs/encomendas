-- Script para corrigir migração de usuários sem especificar SETOR_ID
-- Evita erro de chave estrangeira (ORA-02291)

-- Primeiro, vamos inserir os usuários sem especificar SETOR_ID (será NULL)
-- Usuário 1: Maria Silva Santos
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
    23456789,
    20, -- Convertendo 02 para 20 (dentro do range 10-9999)
    NULL,
    0,
    NULL
);

-- Usuário 2: João Oliveira Costa
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
    34567890,
    10, -- Convertendo 01 para 10 (dentro do range 10-9999)
    NULL,
    0,
    NULL
);

-- Usuário 3: Ana Santos Pereira
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
    45678901,
    30, -- Convertendo 03 para 30 (dentro do range 10-9999)
    NULL,
    0,
    NULL
);

-- Usuário 4: Carlos Ferreira Lima
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
    56789012,
    20, -- Convertendo 02 para 20 (dentro do range 10-9999)
    NULL,
    0,
    NULL
);

-- Usuário 5: Lúcia Rodrigues Alves
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
    67890123,
    10, -- Convertendo 01 para 10 (dentro do range 10-9999)
    NULL,
    0,
    NULL
);

-- Usuário 6: Pedro Martins Souza
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
    78901234,
    40, -- Convertendo 04 para 40 (dentro do range 10-9999)
    NULL,
    0,
    NULL
);

-- Usuário 7: Fernanda Costa Ribeiro
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
    89012345,
    20, -- Convertendo 02 para 20 (dentro do range 10-9999)
    NULL,
    0,
    NULL
);

-- Usuário 8: Ricardo Almeida Nunes
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
    90123456,
    30, -- Convertendo 03 para 30 (dentro do range 10-9999)
    NULL,
    0,
    NULL
);

-- Verificar quantos usuários foram inseridos
SELECT 'TOTAL_USUARIOS_FINAL' AS LABEL, COUNT(*) AS TOTAL FROM USUARIOS;

-- Mostrar todos os usuários
SELECT ID, E_MAIL, NOME, ROLE, MATRICULA, VINCULO_FUNCIONAL FROM USUARIOS ORDER BY ID;

COMMIT;