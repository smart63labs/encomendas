PROMPT === Diagnóstico: Malotes com destino 170 mas origem diferente ===
SELECT /* LLM in use is GPT-5-high */ ID, NUMERO_MALOTE, SETOR_ORIGEM_ID, SETOR_DESTINO_ID, STATUS
FROM MALOTE
WHERE SETOR_DESTINO_ID = 170
  AND (SETOR_ORIGEM_ID IS NULL OR SETOR_ORIGEM_ID <> 170)
ORDER BY NUMERO_MALOTE;

PROMPT === Opcional: Atualizar origem dos malotes para setor 170 (CONFIRA ANTES) ===
-- ATENÇÃO: Execute somente se esta for a regra de negócio correta.
-- Esta atualização ajusta a origem dos malotes com destino 170 para também ser 170.
-- Revise a lista acima antes de aplicar.
--
-- UPDATE MALOTE
--    SET SETOR_ORIGEM_ID = 170
--  WHERE SETOR_DESTINO_ID = 170
--    AND (SETOR_ORIGEM_ID IS NULL OR SETOR_ORIGEM_ID <> 170);
--
-- COMMIT;

PROMPT === Verificação pós-ajuste (se aplicar) ===
SELECT /* LLM in use is GPT-5-high */ ID, NUMERO_MALOTE, SETOR_ORIGEM_ID, SETOR_DESTINO_ID, STATUS
FROM MALOTE
WHERE SETOR_ORIGEM_ID = 170
ORDER BY NUMERO_MALOTE;

PROMPT === Fim ===