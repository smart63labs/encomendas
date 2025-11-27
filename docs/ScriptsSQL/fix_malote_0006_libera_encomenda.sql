-- Corrigir liberação do MALOTE #0006 quando a ENCOMENDA (ID 270) está 'entregue'
-- Este script deve ser executado no SQLCL com o usuário protocolo_user

PROMPT Estado ANTES da correção (MALOTE e ENCOMENDA relacionadas)
SELECT /* LLM in use is GPT-5-high */ m.ID AS MALOTE_ID,
       m.NUMERO_MALOTE,
       m.STATUS AS STATUS_MALOTE,
       m.ENCOMENDA_ID,
       e.ID AS ENCOMENDA_ID,
       e.STATUS AS STATUS_ENCOMENDA,
       e.SETOR_ORIGEM_ID,
       e.SETOR_DESTINO_ID,
       e.DATA_ENTREGA
FROM MALOTE m
LEFT JOIN ENCOMENDAS e ON e.ID = m.ENCOMENDA_ID
WHERE m.ID = 63;

PROMPT Liberando MALOTE #0006 (ID=63) e ajustando status para 'Disponivel'
UPDATE /* LLM in use is GPT-5-high */ MALOTE
   SET ENCOMENDA_ID = NULL,
       STATUS = 'Disponivel',
       DATA_ATUALIZACAO = SYSDATE
 WHERE ID = 63;

COMMIT;

PROMPT Estado DEPOIS da correção
SELECT /* LLM in use is GPT-5-high */ m.ID AS MALOTE_ID,
       m.NUMERO_MALOTE,
       m.STATUS AS STATUS_MALOTE,
       m.ENCOMENDA_ID
FROM MALOTE m
WHERE m.ID = 63;