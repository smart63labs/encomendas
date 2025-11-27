SET DEFINE OFF;
SET FEEDBACK ON;
SET SERVEROUTPUT ON;

PROMPT === Ajustando schema atual para protocolo_user ===
ALTER SESSION SET CURRENT_SCHEMA = protocolo_user;

PROMPT === Verificando existência da coluna CODIGO_LACRE_MALOTE na tabela ENCOMENDAS ===
SELECT column_name, data_type, nullable
FROM user_tab_columns
WHERE table_name = 'ENCOMENDAS'
  AND UPPER(column_name) = 'CODIGO_LACRE_MALOTE';

PROMPT === Removendo coluna CODIGO_LACRE_MALOTE da tabela ENCOMENDAS (se existir) ===
DECLARE
  v_count NUMBER := 0;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM user_tab_columns
  WHERE table_name = 'ENCOMENDAS'
    AND UPPER(column_name) = 'CODIGO_LACRE_MALOTE';

  IF v_count > 0 THEN
    EXECUTE IMMEDIATE 'ALTER TABLE ENCOMENDAS DROP COLUMN CODIGO_LACRE_MALOTE';
    DBMS_OUTPUT.PUT_LINE('Coluna CODIGO_LACRE_MALOTE removida de ENCOMENDAS.');
  ELSE
    DBMS_OUTPUT.PUT_LINE('Coluna CODIGO_LACRE_MALOTE não encontrada em ENCOMENDAS.');
  END IF;
END;
/

PROMPT === Validação pós-remoção ===
SELECT column_name, data_type, nullable
FROM user_tab_columns
WHERE table_name = 'ENCOMENDAS'
  AND UPPER(column_name) IN ('LACRE_ID','MALOTE_ID','CODIGO_LACRE_MALOTE');

COMMIT;

PROMPT === Concluído: remoção (condicional) da coluna CODIGO_LACRE_MALOTE em ENCOMENDAS ===