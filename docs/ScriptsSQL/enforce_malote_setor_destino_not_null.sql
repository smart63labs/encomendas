SET DEFINE OFF;
SET FEEDBACK ON;
SET SERVEROUTPUT ON;

PROMPT === Ajustando schema atual para protocolo_user ===
ALTER SESSION SET CURRENT_SCHEMA = protocolo_user;

PROMPT === Verificando coluna SETOR_DESTINO_ID na tabela MALOTE ===
SELECT column_name, data_type, nullable
FROM user_tab_columns
WHERE table_name = 'MALOTE'
  AND UPPER(column_name) = 'SETOR_DESTINO_ID';

PROMPT === Tornando SETOR_DESTINO_ID obrigatória (NOT NULL), se não houver valores nulos ===
DECLARE
  v_nulls NUMBER := 0;
BEGIN
  SELECT COUNT(*) INTO v_nulls FROM MALOTE WHERE SETOR_DESTINO_ID IS NULL;

  IF v_nulls = 0 THEN
    EXECUTE IMMEDIATE 'ALTER TABLE MALOTE MODIFY (SETOR_DESTINO_ID NOT NULL)';
    DBMS_OUTPUT.PUT_LINE('ALTER TABLE MALOTE: SETOR_DESTINO_ID alterada para NOT NULL.');
  ELSE
    DBMS_OUTPUT.PUT_LINE('ALTERAÇÃO ABORTADA: Existem '||v_nulls||' registros com SETOR_DESTINO_ID nulo.');
  END IF;
END;
/

PROMPT === Validação pós-alteração: NULLABLE deve ser N ===
SELECT column_name, data_type, nullable
FROM user_tab_columns
WHERE table_name = 'MALOTE'
  AND UPPER(column_name) = 'SETOR_DESTINO_ID';

PROMPT === Verificando FKs de MALOTE para SETORES ===
SELECT uc.constraint_name, ucc.column_name,
       uc_r.table_name AS referenced_table, ucc_r.column_name AS referenced_column
FROM user_constraints uc
JOIN user_cons_columns ucc 
  ON uc.constraint_name = ucc.constraint_name 
 AND uc.table_name = ucc.table_name
JOIN user_constraints uc_r 
  ON uc.r_constraint_name = uc_r.constraint_name
JOIN user_cons_columns ucc_r
  ON uc_r.constraint_name = ucc_r.constraint_name
 AND ucc.position = ucc_r.position
WHERE uc.table_name = 'MALOTE'
  AND uc.constraint_type = 'R'
ORDER BY uc.constraint_name, ucc.position;

PROMPT === Verificando integridade: contagem de nulos e inválidos ===
SELECT 
  (SELECT COUNT(*) FROM MALOTE) AS total_malotes,
  (SELECT COUNT(*) FROM MALOTE WHERE SETOR_ORIGEM_ID IS NULL) AS origem_null,
  (SELECT COUNT(*) FROM MALOTE WHERE SETOR_DESTINO_ID IS NULL) AS destino_null,
  (SELECT COUNT(*) FROM MALOTE m WHERE m.SETOR_ORIGEM_ID IS NOT NULL AND NOT EXISTS (SELECT 1 FROM SETORES s WHERE s.ID = m.SETOR_ORIGEM_ID)) AS origem_invalida,
  (SELECT COUNT(*) FROM MALOTE m WHERE m.SETOR_DESTINO_ID IS NOT NULL AND NOT EXISTS (SELECT 1 FROM SETORES s WHERE s.ID = m.SETOR_DESTINO_ID)) AS destino_invalida
FROM DUAL;

PROMPT === Concluído: exigência de SETOR_DESTINO_ID NOT NULL em MALOTE ===
EXIT SUCCESS