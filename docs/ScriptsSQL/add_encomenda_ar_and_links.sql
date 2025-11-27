-- Script: add_encomenda_ar_and_links.sql
-- Objetivo: Adicionar NUMERO_AR em ENCOMENDAS e garantir vínculos LACRE_ID/MALOTE_ID com FKs e índices
-- Schema: protocolo_user @ FREEPDB1
-- Execução (SQLcl):
--   sqlcl protocolo_user/Anderline49@localhost:1521/FREEPDB1 @docs/ScriptsSQL/add_encomenda_ar_and_links.sql

SET SERVEROUTPUT ON SIZE UNLIMITED;
ALTER SESSION SET CURRENT_SCHEMA = protocolo_user;

DECLARE
  v_exists NUMBER;
BEGIN
  -- Adicionar coluna NUMERO_AR se não existir
  SELECT COUNT(*) INTO v_exists FROM user_tab_columns 
   WHERE table_name = 'ENCOMENDAS' AND column_name = 'NUMERO_AR';
  IF v_exists = 0 THEN
    EXECUTE IMMEDIATE 'ALTER TABLE ENCOMENDAS ADD NUMERO_AR VARCHAR2(50)';
    DBMS_OUTPUT.PUT_LINE('Adicionada coluna ENCOMENDAS.NUMERO_AR');
  ELSE
    DBMS_OUTPUT.PUT_LINE('Coluna ENCOMENDAS.NUMERO_AR já existe');
  END IF;

  -- Adicionar coluna LACRE_ID se não existir
  SELECT COUNT(*) INTO v_exists FROM user_tab_columns 
   WHERE table_name = 'ENCOMENDAS' AND column_name = 'LACRE_ID';
  IF v_exists = 0 THEN
    EXECUTE IMMEDIATE 'ALTER TABLE ENCOMENDAS ADD LACRE_ID NUMBER';
    DBMS_OUTPUT.PUT_LINE('Adicionada coluna ENCOMENDAS.LACRE_ID');
  ELSE
    DBMS_OUTPUT.PUT_LINE('Coluna ENCOMENDAS.LACRE_ID já existe');
  END IF;

  -- Adicionar coluna MALOTE_ID se não existir
  SELECT COUNT(*) INTO v_exists FROM user_tab_columns 
   WHERE table_name = 'ENCOMENDAS' AND column_name = 'MALOTE_ID';
  IF v_exists = 0 THEN
    EXECUTE IMMEDIATE 'ALTER TABLE ENCOMENDAS ADD MALOTE_ID NUMBER';
    DBMS_OUTPUT.PUT_LINE('Adicionada coluna ENCOMENDAS.MALOTE_ID');
  ELSE
    DBMS_OUTPUT.PUT_LINE('Coluna ENCOMENDAS.MALOTE_ID já existe');
  END IF;

  -- Criar índices se não existirem
  SELECT COUNT(*) INTO v_exists FROM user_indexes WHERE index_name = 'IDX_ENCOMENDAS_LACRE_ID';
  IF v_exists = 0 THEN
    EXECUTE IMMEDIATE 'CREATE INDEX IDX_ENCOMENDAS_LACRE_ID ON ENCOMENDAS(LACRE_ID)';
    DBMS_OUTPUT.PUT_LINE('Criado índice IDX_ENCOMENDAS_LACRE_ID');
  ELSE
    DBMS_OUTPUT.PUT_LINE('Índice IDX_ENCOMENDAS_LACRE_ID já existe');
  END IF;

  SELECT COUNT(*) INTO v_exists FROM user_indexes WHERE index_name = 'IDX_ENCOMENDAS_MALOTE_ID';
  IF v_exists = 0 THEN
    EXECUTE IMMEDIATE 'CREATE INDEX IDX_ENCOMENDAS_MALOTE_ID ON ENCOMENDAS(MALOTE_ID)';
    DBMS_OUTPUT.PUT_LINE('Criado índice IDX_ENCOMENDAS_MALOTE_ID');
  ELSE
    DBMS_OUTPUT.PUT_LINE('Índice IDX_ENCOMENDAS_MALOTE_ID já existe');
  END IF;

  -- Criar FK para LACRE se não existir
  SELECT COUNT(*) INTO v_exists FROM user_constraints 
   WHERE table_name = 'ENCOMENDAS' AND constraint_name = 'FK_ENCOMENDAS_LACRE';
  IF v_exists = 0 THEN
    EXECUTE IMMEDIATE 'ALTER TABLE ENCOMENDAS ADD CONSTRAINT FK_ENCOMENDAS_LACRE FOREIGN KEY (LACRE_ID) REFERENCES LACRE(ID)';
    DBMS_OUTPUT.PUT_LINE('Criada FK FK_ENCOMENDAS_LACRE');
  ELSE
    DBMS_OUTPUT.PUT_LINE('FK_ENCOMENDAS_LACRE já existe');
  END IF;

  -- Criar FK para MALOTE se não existir
  SELECT COUNT(*) INTO v_exists FROM user_constraints 
   WHERE table_name = 'ENCOMENDAS' AND constraint_name = 'FK_ENCOMENDAS_MALOTE';
  IF v_exists = 0 THEN
    EXECUTE IMMEDIATE 'ALTER TABLE ENCOMENDAS ADD CONSTRAINT FK_ENCOMENDAS_MALOTE FOREIGN KEY (MALOTE_ID) REFERENCES MALOTE(ID)';
    DBMS_OUTPUT.PUT_LINE('Criada FK FK_ENCOMENDAS_MALOTE');
  ELSE
    DBMS_OUTPUT.PUT_LINE('FK_ENCOMENDAS_MALOTE já existe');
  END IF;
END;
/

PROMPT === Validação: colunas em ENCOMENDAS ===
SELECT column_name, data_type, nullable
FROM user_tab_columns
WHERE table_name = 'ENCOMENDAS'
  AND UPPER(column_name) IN ('NUMERO_AR','LACRE_ID','MALOTE_ID','CODIGO_LACRE_MALOTE')
ORDER BY column_name;

PROMPT === Validação: FKs em ENCOMENDAS ===
SELECT uc.constraint_name, ucc.column_name, uc_r.table_name AS referenced_table
FROM user_constraints uc
JOIN user_cons_columns ucc 
  ON uc.constraint_name = ucc.constraint_name 
 AND uc.table_name = ucc.table_name
JOIN user_constraints uc_r 
  ON uc.r_constraint_name = uc_r.constraint_name
WHERE uc.table_name = 'ENCOMENDAS'
  AND uc.constraint_type = 'R'
ORDER BY uc.constraint_name, ucc.column_name;

COMMIT;