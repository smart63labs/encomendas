-- Script gerado automaticamente para importar dados do CSV SETORES_NORMALIZADO_PADRONIZADO.csv
-- Problemas identificados e corrigidos:
-- 1. Espaços extras nas coordenadas
-- 2. Coordenadas LONGITUDE incorretas (positivas)
-- 3. Formatação de dados

-- Limpar dados existentes
DELETE FROM SETORES;


-- Commit das alterações
COMMIT;

-- Verificar quantos registros foram inseridos
SELECT COUNT(*) AS TOTAL_INSERIDO FROM SETORES;

-- Mostrar alguns registros inseridos
SELECT ID, CODIGO_SETOR, NOME_SETOR, CIDADE, LATITUDE, LONGITUDE FROM SETORES WHERE ROWNUM <= 10;

EXIT;
