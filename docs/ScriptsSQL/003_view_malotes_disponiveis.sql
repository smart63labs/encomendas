-- Script: 003_view_malotes_disponiveis.sql
-- Objetivo: criar visão que retorna malotes disponíveis (último evento Entregue/Sim).

CREATE OR REPLACE VIEW MALOTES_DISPONIVEIS AS
SELECT e.MALOTE_ID,
       e.SETOR_ID,
       e.DATA_EVENTO
FROM (
  SELECT ee.*,
         ROW_NUMBER() OVER (
           PARTITION BY ee.MALOTE_ID
           ORDER BY ee.DATA_EVENTO DESC
         ) rn
  FROM ENCOMENDAS_EVENTOS ee
) e
WHERE e.rn = 1
  AND e.STATUS_ENTREGA = 'Entregue'
  AND e.STATUS_ENTREGUE = 'Sim';