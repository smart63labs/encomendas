-- Script para verificar a estrutura das colunas LATITUDE e LONGITUDE
-- Conectar ao banco: sqlplus protocolo_user/Anderline49@localhost:1521/FREEPDB1

SET PAGESIZE 50
SET LINESIZE 120

PROMPT ====================================
PROMPT VERIFICANDO ESTRUTURA DAS COORDENADAS
PROMPT ====================================

SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    DATA_PRECISION,
    DATA_SCALE,
    DATA_LENGTH,
    NULLABLE
FROM USER_TAB_COLUMNS 
WHERE TABLE_NAME = 'SETORES' 
AND COLUMN_NAME IN ('LATITUDE', 'LONGITUDE') 
ORDER BY COLUMN_ID;

PROMPT ====================================
PROMPT TESTANDO VALORES ATUAIS
PROMPT ====================================

SELECT LATITUDE, LONGITUDE FROM SETORES WHERE ROWNUM <= 5;

EXIT;