-- Script para verificar a estrutura atual da tabela SETORES
-- Verificar colunas da tabela
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    DATA_LENGTH,
    DATA_PRECISION,
    DATA_SCALE,
    NULLABLE,
    COLUMN_ID
FROM USER_TAB_COLUMNS 
WHERE TABLE_NAME = 'SETORES'
ORDER BY COLUMN_ID;

-- Verificar se há dados na tabela
SELECT COUNT(*) AS TOTAL_REGISTROS FROM SETORES;

-- Verificar alguns registros existentes
SELECT * FROM SETORES WHERE ROWNUM <= 5;

EXIT;