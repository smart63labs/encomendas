-- Script para verificar a estrutura atual da tabela SETORES
-- Conectar como: protocolo_user/Anderline49@localhost:1521/FREEPDB1

-- 1. Verificar se a tabela existe
SELECT TABLE_NAME 
FROM USER_TABLES 
WHERE TABLE_NAME = 'SETORES';

-- 2. Verificar a estrutura atual da tabela
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    DATA_LENGTH,
    DATA_PRECISION,
    DATA_SCALE,
    NULLABLE,
    DATA_DEFAULT,
    COLUMN_ID
FROM USER_TAB_COLUMNS 
WHERE TABLE_NAME = 'SETORES' 
ORDER BY COLUMN_ID;

-- 3. Verificar índices existentes
SELECT 
    INDEX_NAME,
    COLUMN_NAME,
    COLUMN_POSITION
FROM USER_IND_COLUMNS 
WHERE TABLE_NAME = 'SETORES'
ORDER BY INDEX_NAME, COLUMN_POSITION;

-- 4. Verificar constraints
SELECT 
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE,
    SEARCH_CONDITION
FROM USER_CONSTRAINTS 
WHERE TABLE_NAME = 'SETORES';

-- 5. Verificar triggers
SELECT 
    TRIGGER_NAME,
    TRIGGER_TYPE,
    TRIGGERING_EVENT,
    STATUS
FROM USER_TRIGGERS 
WHERE TABLE_NAME = 'SETORES';

-- 6. Contar registros existentes
SELECT COUNT(*) AS TOTAL_REGISTROS FROM SETORES;

-- 7. Verificar alguns dados de exemplo (primeiros 5 registros)
SELECT * FROM SETORES WHERE ROWNUM <= 5;