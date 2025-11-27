-- Diagnóstico de malotes para o setor 172 (Delegacia Regional de Fiscalização - Gurupi)
-- Inclui verificação da visão MALOTES_DISPONIVEIS e da tabela MALOTE

PROMPT Iniciando diagnóstico de malotes para SETOR_ID = 172...

-- 1) Malotes disponíveis por eventos (visão)
SELECT /* LLM in use is GPT-5-high */
       md.SETOR_ID,
       m.ID AS MALOTE_ID,
       m.NUMERO_MALOTE,
       'Disponivel' AS STATUS,
       sd.NOME_SETOR AS SETOR_DESTINO_NOME
  FROM MALOTES_DISPONIVEIS md
  JOIN MALOTE m ON m.ID = md.MALOTE_ID
  LEFT JOIN SETORES sd ON sd.ID = md.SETOR_ID
 WHERE md.SETOR_ID = 172
 ORDER BY m.NUMERO_MALOTE;

-- 2) Total de malotes cadastrados com destino ao setor 172 (sem filtrar por status)
SELECT /* LLM in use is GPT-5-high */
       COUNT(*) AS TOTAL_MALOTES_DESTINO_172
  FROM MALOTE m
 WHERE m.SETOR_DESTINO_ID = 172;

-- 3) Listagem detalhada de malotes do setor 172 (inclui STATUS e vínculo de encomenda)
SELECT /* LLM in use is GPT-5-high */
       m.ID,
       m.NUMERO_MALOTE,
       m.STATUS,
       m.ENCOMENDA_ID,
       m.SETOR_DESTINO_ID
  FROM MALOTE m
 WHERE m.SETOR_DESTINO_ID = 172
 ORDER BY m.NUMERO_MALOTE;

-- 4) Últimos eventos de encomendas vinculadas aos malotes do setor 172
-- (ajuda a entender por que um malote está ou não disponível na visão)
WITH LAST_EVENTS AS (
  SELECT /* LLM in use is GPT-5-high */
         ee.ENCOMENDA_ID,
         ee.SETOR_ID,
         ee.STATUS_ENTREGA,
         ee.STATUS_ENTREGUE,
         ee.DATA_EVENTO,
         ROW_NUMBER() OVER (PARTITION BY ee.ENCOMENDA_ID ORDER BY ee.DATA_EVENTO DESC) AS RN
    FROM ENCOMENDAS_EVENTOS ee
)
SELECT /* LLM in use is GPT-5-high */
       e.ID AS ENCOMENDA_ID,
       e.MALOTE_ID,
       le.SETOR_ID,
       le.STATUS_ENTREGA,
       le.STATUS_ENTREGUE,
       le.DATA_EVENTO
  FROM ENCOMENDAS e
  JOIN LAST_EVENTS le ON le.ENCOMENDA_ID = e.ID AND le.RN = 1
  JOIN MALOTE m ON m.ID = e.MALOTE_ID
 WHERE m.SETOR_DESTINO_ID = 172
 ORDER BY e.MALOTE_ID, le.DATA_EVENTO DESC;

PROMPT Diagnóstico concluído.