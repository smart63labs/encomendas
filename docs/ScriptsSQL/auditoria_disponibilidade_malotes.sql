-- Auditoria de disponibilidade por eventos conforme regra de malote
-- Disponível: existe evento com igualdade (EE.SETOR_ID = E.SETOR_ORIGEM_ID)
--             e STATUS_ENTREGA = 'Entregue' e STATUS_ENTREGUE em valores "Sim"
-- Indisponível: existe evento com igualdade e STATUS_ENTREGA ~ 'EmTransito' e STATUS_ENTREGUE em valores "Não"
-- Default: quando não houver evento válido de igualdade, tratar como 'disponivel'

SET SQLFORMAT CSV
ALTER SESSION SET NLS_TIMESTAMP_FORMAT = 'YYYY-MM-DD HH24:MI:SS.FF';

WITH LAST_EV AS (
  SELECT 
    e.MALOTE_ID,
    e.SETOR_ORIGEM_ID,
    ee.SETOR_ID,
    ee.STATUS_ENTREGA,
    ee.STATUS_ENTREGUE,
    ee.DATA_EVENTO,
    ROW_NUMBER() OVER (PARTITION BY e.MALOTE_ID ORDER BY ee.DATA_EVENTO DESC) AS RN
  FROM ENCOMENDAS_EVENTOS ee
  JOIN ENCOMENDAS e ON e.ID = ee.ENCOMENDA_ID
)
SELECT /* LLM in use is GPT-5-high */
  m.NUMERO_MALOTE,
  m.ID AS MALOTE_ID,
  m.SETOR_DESTINO_ID,
  le.SETOR_ID AS SETOR_EVENTO_ID,
  le.SETOR_ORIGEM_ID AS SETOR_ENCOMENDA_ORIGEM_ID,
  le.STATUS_ENTREGA,
  le.STATUS_ENTREGUE,
  le.DATA_EVENTO,
  CASE 
    WHEN (
      UPPER(TRIM(le.STATUS_ENTREGA)) = 'ENTREGUE' AND 
      UPPER(TRIM(NVL(le.STATUS_ENTREGUE, 'N'))) IN ('SIM','S','YES','Y','TRUE','T','1') AND
      le.SETOR_ID = le.SETOR_ORIGEM_ID
    ) THEN 'disponivel'
    WHEN (
      UPPER(REPLACE(TRIM(le.STATUS_ENTREGA), ' ', '_')) IN ('EMTRANSITO','EM_TRANSITO','EM_TRÂNSITO') AND 
      UPPER(TRIM(NVL(le.STATUS_ENTREGUE, 'N'))) IN ('NAO','N','NO','FALSE','F','0') AND
      le.SETOR_ID = le.SETOR_ORIGEM_ID
    ) THEN 'indisponivel'
    ELSE 'disponivel'
  END AS STATUS_EVENTO
FROM MALOTE m
LEFT JOIN LAST_EV le ON le.MALOTE_ID = m.ID AND le.RN = 1
ORDER BY m.NUMERO_MALOTE;