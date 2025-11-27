-- Correção de status de lacres: 'RESERVADO' -> 'ATRIBUIDO' quando há setor atribuído
-- Ambiente: Oracle (SQL*Plus)
-- Requisitos: Executar com protocolo_user/Anderline49@localhost:1521/FREEPDB1

SET SERVEROUTPUT ON
SET ECHO ON
WHENEVER SQLERROR EXIT SQL.SQLCODE

PROMPT Verificando quantidade de lacres com STATUS='reservado' e SETOR_ID não nulo (antes da correção)...
SELECT STATUS, COUNT(*) AS QTD
  FROM LACRE
 WHERE STATUS IN ('reservado','atribuido')
 GROUP BY STATUS
 ORDER BY STATUS;

SELECT COUNT(*) AS QTD_RESERVADO_COM_SETOR
  FROM LACRE
 WHERE STATUS = 'reservado'
   AND SETOR_ID IS NOT NULL;

PROMPT Atualizando STATUS para 'atribuido' quando SETOR_ID não é nulo...
UPDATE LACRE
   SET STATUS = 'atribuido',
       DATA_ATUALIZACAO = SYSTIMESTAMP
 WHERE STATUS = 'reservado'
   AND SETOR_ID IS NOT NULL;

COMMIT;

PROMPT Verificando novamente (após correção)...
SELECT STATUS, COUNT(*) AS QTD
  FROM LACRE
 WHERE STATUS IN ('reservado','atribuido')
 GROUP BY STATUS
 ORDER BY STATUS;

SELECT COUNT(*) AS QTD_RESERVADO_COM_SETOR
  FROM LACRE
 WHERE STATUS = 'reservado'
   AND SETOR_ID IS NOT NULL;

PROMPT Concluído.