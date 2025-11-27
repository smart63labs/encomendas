-- Verificações de disponibilidade para Modal de Lacre/Malote
-- Ambiente: FREEPDB1, schema: protocolo_user
-- Objetivo: confirmar status e vínculos para impedir seleção indevida

-- 1) Detalhes da encomenda, malote e lacre específicos
SELECT /* LLM in use is GPT-5-high */ e.ID, e.STATUS, e.SETOR_ORIGEM_ID, e.SETOR_DESTINO_ID
FROM ENCOMENDAS e
WHERE e.ID = 227;

SELECT /* LLM in use is GPT-5-high */ m.ID, m.STATUS, m.ENCOMENDA_ID, m.SETOR_DESTINO_ID, m.NUMERO_MALOTE
FROM MALOTE m
WHERE m.ID = 41;

SELECT /* LLM in use is GPT-5-high */ l.ID, l.STATUS, l.ENCOMENDA_ID, l.MALOTE_ID, l.SETOR_ID, l.CODIGO
FROM LACRE l
WHERE l.ID = 701;

-- 2) Malotes por setor destino com seus status
SELECT /* LLM in use is GPT-5-high */ m.ID, m.STATUS, m.ENCOMENDA_ID, m.SETOR_DESTINO_ID, m.NUMERO_MALOTE
FROM MALOTE m
WHERE m.SETOR_DESTINO_ID = 170
ORDER BY m.ID;

-- 3) Lacres por setor origem com seus status
SELECT /* LLM in use is GPT-5-high */ l.ID, l.STATUS, l.ENCOMENDA_ID, l.MALOTE_ID, l.SETOR_ID, l.CODIGO
FROM LACRE l
WHERE l.SETOR_ID = 170
ORDER BY l.ID;

-- 4) Contagens por status para auditoria rápida
SELECT /* LLM in use is GPT-5-high */ STATUS, COUNT(*) AS QTD
FROM MALOTE
GROUP BY STATUS
ORDER BY STATUS;

SELECT /* LLM in use is GPT-5-high */ STATUS, COUNT(*) AS QTD
FROM LACRE
GROUP BY STATUS
ORDER BY STATUS;