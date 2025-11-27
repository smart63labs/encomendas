-- Script simples para adicionar campos de geolocalização
-- Executar uma operação por vez para evitar conflitos

-- 1. Adicionar campo LATITUDE
ALTER TABLE SETORES ADD (LATITUDE NUMBER(10,8));

-- 2. Adicionar campo LONGITUDE  
ALTER TABLE SETORES ADD (LONGITUDE NUMBER(11,8));

-- 3. Adicionar comentários
COMMENT ON COLUMN SETORES.LATITUDE IS 'Latitude da localização do setor (formato decimal)';
COMMENT ON COLUMN SETORES.LONGITUDE IS 'Longitude da localização do setor (formato decimal)';

-- 4. Criar índice
CREATE INDEX IDX_SETORES_GEOLOCATION ON SETORES(LATITUDE, LONGITUDE);

-- 5. Verificar estrutura
SELECT COLUMN_NAME, DATA_TYPE, DATA_PRECISION, DATA_SCALE, NULLABLE
FROM USER_TAB_COLUMNS
WHERE TABLE_NAME = 'SETORES'
AND COLUMN_NAME IN ('LATITUDE', 'LONGITUDE')
ORDER BY COLUMN_NAME;

COMMIT;