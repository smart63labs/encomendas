-- Conectar com: protocolo_user/Anderline49@localhost:1521/FREEPDB1
-- Objetivo:
-- 1) Marcar como 'utilizado' todo lacre com ENCOMENDA_ID não nulo e STATUS divergente
-- 2) Garantir que lacre 'utilizado' não tenha ENCOMENDA_ID (deve estar liberado)
-- 3) Auditar antes/depois para confirmar alterações

SET SERVEROUTPUT ON;
SET ECHO ON;
WHENEVER SQLERROR EXIT SQL.SQLCODE;

PROMPT === Diagnóstico inicial ===;
SELECT STATUS, COUNT(*) AS QTD
  FROM LACRE
 WHERE STATUS IN ('disponivel','atribuido','utilizado','reservado')
 GROUP BY STATUS
 ORDER BY STATUS;

SELECT COUNT(*) AS QTD_VINCULADOS_DIVERGENTES
  FROM LACRE
 WHERE ENCOMENDA_ID IS NOT NULL
   AND LOWER(STATUS) <> 'utilizado';

SELECT COUNT(*) AS QTD_UTILIZADO_COM_ENCOMENDA
  FROM LACRE
 WHERE ENCOMENDA_ID IS NOT NULL
   AND LOWER(STATUS) = 'utilizado';

PROMPT === Ajustando lacres vinculados para STATUS='utilizado' ===;
UPDATE LACRE
   SET STATUS = 'utilizado',
       DATA_ATUALIZACAO = SYSTIMESTAMP
 WHERE ENCOMENDA_ID IS NOT NULL
   AND LOWER(STATUS) <> 'utilizado';

PROMPT === Liberando vínculos indevidos de lacres 'utilizado' ===;
UPDATE LACRE
   SET ENCOMENDA_ID = NULL,
       DATA_ATUALIZACAO = SYSTIMESTAMP
 WHERE ENCOMENDA_ID IS NOT NULL
   AND LOWER(STATUS) = 'utilizado';

PROMPT === Corrigindo lacres com STATUS='atribuido' sem vínculo (deve ser 'disponivel') ===;
UPDATE LACRE
   SET STATUS = 'disponivel',
       DATA_ATUALIZACAO = SYSTIMESTAMP
 WHERE ENCOMENDA_ID IS NULL
   AND LOWER(STATUS) = 'atribuido';

COMMIT;

PROMPT === Diagnóstico final ===;
SELECT STATUS, COUNT(*) AS QTD
  FROM LACRE
 WHERE STATUS IN ('disponivel','atribuido','utilizado','reservado')
 GROUP BY STATUS
 ORDER BY STATUS;

SELECT COUNT(*) AS QTD_VINCULADOS_DIVERGENTES
  FROM LACRE
 WHERE ENCOMENDA_ID IS NOT NULL
   AND LOWER(STATUS) <> 'utilizado';

SELECT COUNT(*) AS QTD_UTILIZADO_COM_ENCOMENDA
  FROM LACRE
 WHERE ENCOMENDA_ID IS NOT NULL
   AND LOWER(STATUS) = 'utilizado';

PROMPT === Concluído: correção aplicada. ===;