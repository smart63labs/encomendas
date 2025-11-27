-- Script SQL para atualização manual das coordenadas dos setores
-- Este script considera que já existem dados na tabela SETORES
-- Execute este script manualmente no seu cliente SQL (SQL*Plus, SQLcl, SQL Developer, etc.)

-- Conecte-se ao banco de dados Oracle antes de executar
-- Exemplo: sqlplus protocolo_user/senha@localhost:1521/FREEPDB1

-- Início da transação (use COMMIT; no final para confirmar as alterações)

-- Atualizar coordenadas para Palmas (Recursos Humanos - ID 25)
UPDATE SETORES 
SET LATITUDE = -10.16745, 
    LONGITUDE = -48.32766,
    UPDATED_AT = SYSTIMESTAMP
WHERE ID = 25 AND CIDADE = 'Palmas' AND NOME_SETOR = 'Recursos Humanos';

-- Verificação será feita no final com SELECT geral

-- Atualizar coordenadas para Araguaína (Tecnologia da Informação - ID 26)
UPDATE SETORES 
SET LATITUDE = -7.31139, 
    LONGITUDE = -48.62113,
    UPDATED_AT = SYSTIMESTAMP
WHERE ID = 26 AND CIDADE = 'Araguaína' AND NOME_SETOR = 'Tecnologia da Informação';

-- Verificação será feita no final com SELECT geral

-- Atualizar coordenadas para Gurupi (Financeiro - ID 27)
UPDATE SETORES 
SET LATITUDE = -11.72917, 
    LONGITUDE = -49.06861,
    UPDATED_AT = SYSTIMESTAMP
WHERE ID = 27 AND CIDADE = 'Gurupi' AND NOME_SETOR = 'Financeiro';

-- Verificação será feita no final com SELECT geral

-- Atualizar coordenadas para Paraíso do Tocantins (Protocolo - ID 29)
UPDATE SETORES 
SET LATITUDE = -10.183, 
    LONGITUDE = -48.8,
    UPDATED_AT = SYSTIMESTAMP
WHERE ID = 29 AND CIDADE = 'Paraíso do Tocantins' AND NOME_SETOR = 'Protocolo';

-- Verificação será feita no final com SELECT geral

-- Verificar todas as coordenadas atualizadas
SELECT 
    ID,
    NOME_SETOR,
    CIDADE,
    LATITUDE,
    LONGITUDE,
    UPDATED_AT
FROM SETORES 
WHERE CIDADE IN ('Palmas', 'Araguaína', 'Gurupi', 'Paraíso do Tocantins')
ORDER BY CIDADE, NOME_SETOR;

-- Confirmar as alterações (descomente a linha abaixo após verificar os resultados)
-- COMMIT;

-- Em caso de erro, desfazer as alterações (descomente a linha abaixo se necessário)
-- ROLLBACK;

-- Instruções de uso:
-- 1. Conecte-se ao banco de dados Oracle
-- 2. Execute este script linha por linha ou todo de uma vez
-- 3. Verifique os resultados das consultas SELECT
-- 4. Se tudo estiver correto, descomente e execute o COMMIT
-- 5. Se houver algum problema, descomente e execute o ROLLBACK

-- Coordenadas utilizadas:
-- Palmas: Latitude -10.16745, Longitude -48.32766
-- Araguaína: Latitude -7.31139, Longitude -48.62113
-- Gurupi: Latitude -11.72917, Longitude -49.06861
-- Paraíso do Tocantins: Latitude -10.183, Longitude -48.8