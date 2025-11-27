PROMPT === Exclusão Administrativa de ENCOMENDA e seus vínculos ===
PROMPT Schema: protocolo_user | Conexão: protocolo_user/Anderline49@localhost:1521/FREEPDB1
PROMPT Informe o ID da encomenda a excluir quando solicitado.

-- Uso no SQLcl:
-- CONN protocolo_user/Anderline49@localhost:1521/FREEPDB1
-- DEFINE ENCOMENDA_ID = 327

SET SERVEROUTPUT ON;

DECLARE
  v_id NUMBER := TO_NUMBER('&ENCOMENDA_ID');
BEGIN
  DBMS_OUTPUT.PUT_LINE('Iniciando exclusão administrativa da encomenda ID=' || v_id);

  -- 1) Remover eventos filhos (se existirem)
  BEGIN
    DELETE FROM ENCOMENDAS_EVENTOS WHERE ENCOMENDA_ID = v_id;
    DBMS_OUTPUT.PUT_LINE(SQL%ROWCOUNT || ' evento(s) removido(s) de ENCOMENDAS_EVENTOS.');
  EXCEPTION
    WHEN OTHERS THEN
      DBMS_OUTPUT.PUT_LINE('Aviso: falha ao excluir eventos (tabela pode não existir): ' || SQLERRM);
  END;

  -- 2) Quebrar FKs de ENCOMENDAS para LACRE/MALOTE para permitir remoção de filhos
  UPDATE ENCOMENDAS
     SET LACRE_ID = NULL,
         MALOTE_ID = NULL
   WHERE ID = v_id;
  DBMS_OUTPUT.PUT_LINE('FKs ENCOMENDAS(LACRE_ID/MALOTE_ID) limpas.');

  -- 3) Remover lacres vinculados à encomenda (trigger impede UPDATE para NULL)
  DELETE FROM LACRE WHERE ENCOMENDA_ID = v_id;
  DBMS_OUTPUT.PUT_LINE(SQL%ROWCOUNT || ' lacre(s) removido(s).');

  -- 4) Desvincular malotes da encomenda (voltando STATUS para "Disponivel")
  UPDATE MALOTE
     SET ENCOMENDA_ID = NULL,
         STATUS = 'Disponivel',
         DATA_ATUALIZACAO = SYSDATE
   WHERE ENCOMENDA_ID = v_id;
  DBMS_OUTPUT.PUT_LINE(SQL%ROWCOUNT || ' malote(s) desvinculado(s).');

  -- 5) Excluir a encomenda
  DELETE FROM ENCOMENDAS WHERE ID = v_id;
  DBMS_OUTPUT.PUT_LINE('Encomenda excluída. Linhas afetadas: ' || SQL%ROWCOUNT);

  COMMIT;
EXCEPTION
  WHEN OTHERS THEN
    DBMS_OUTPUT.PUT_LINE('Erro ao excluir encomenda: ' || SQLERRM);
    ROLLBACK;
END;
/

PROMPT === Fim do script ===