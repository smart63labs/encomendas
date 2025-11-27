-- Script para verificar usuários vinculados às delegacias
-- Verificar estrutura da tabela USUARIOS
SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH, NULLABLE 
FROM USER_TAB_COLUMNS 
WHERE TABLE_NAME = 'USUARIOS' 
ORDER BY COLUMN_ID;

-- Verificar total de usuários
SELECT COUNT(*) AS TOTAL_USUARIOS FROM USUARIOS;

-- Verificar usuários vinculados às delegacias
SELECT 
    u.ID as user_id,
    u.NAME as nome_usuario,
    u.MATRICULA,
    u.VINCULO_FUNCIONAL,
    u.DEPARTAMENTO,
    u.IS_ACTIVE,
    s.ID as setor_id,
    s.CODIGO_SETOR,
    s.NOME_SETOR,
    s.ORGAO,
    s.ATIVO as setor_ativo
FROM USUARIOS u
LEFT JOIN SETORES s ON u.SETOR_ID = s.ID
WHERE UPPER(s.NOME_SETOR) LIKE '%DELEGACIA%'
ORDER BY s.NOME_SETOR, u.NAME;

-- Verificar se há usuários sem setor definido
SELECT COUNT(*) AS USUARIOS_SEM_SETOR 
FROM USUARIOS 
WHERE SETOR_ID IS NULL;

EXIT;