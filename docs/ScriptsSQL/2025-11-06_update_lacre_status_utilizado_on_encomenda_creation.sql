-- Ajuste de STATUS dos lacres conforme nova regra de negócio
-- Objetivo: marcar como 'utilizado' todos os lacres já vinculados a encomendas ativas
-- e que ainda não estejam com STATUS = 'utilizado'.
--
-- Observação: execute em janela de manutenção. Valide impacto com equipes responsáveis.

DECLARE
  CURSOR c_lacres IS
    SELECT l.ID
    FROM LACRE l
    WHERE l.STATUS <> 'utilizado'
      AND l.ENCOMENDA_ID IS NOT NULL;
BEGIN
  FOR r IN c_lacres LOOP
    UPDATE LACRE
      SET STATUS = 'utilizado',
          DATA_ATUALIZACAO = SYSTIMESTAMP
      WHERE ID = r.ID;
  END LOOP;
  COMMIT;
END;
/

-- Relatório rápido de verificação
SELECT STATUS, COUNT(1) AS QTD
FROM LACRE
GROUP BY STATUS
ORDER BY STATUS;