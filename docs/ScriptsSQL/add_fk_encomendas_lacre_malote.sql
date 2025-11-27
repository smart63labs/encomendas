SET DEFINE OFF;
SET FEEDBACK ON;
SET SERVEROUTPUT ON;

PROMPT === Ajustando schema atual para protocolo_user (opcional) ===;
ALTER SESSION SET CURRENT_SCHEMA = protocolo_user;

PROMPT === Adicionando colunas LACRE_ID e MALOTE_ID em ENCOMENDAS ===;
ALTER TABLE ENCOMENDAS ADD (LACRE_ID NUMBER);
ALTER TABLE ENCOMENDAS ADD (MALOTE_ID NUMBER);

PROMPT === Criando índices para colunas de vínculo ===;
CREATE INDEX IDX_ENCOMENDAS_LACRE_ID ON ENCOMENDAS(LACRE_ID);
CREATE INDEX IDX_ENCOMENDAS_MALOTE_ID ON ENCOMENDAS(MALOTE_ID);

PROMPT === Criando FKs para LACRE(ID) e MALOTE(ID) ===;
ALTER TABLE ENCOMENDAS ADD CONSTRAINT FK_ENCOMENDAS_LACRE FOREIGN KEY (LACRE_ID) REFERENCES LACRE(ID);
ALTER TABLE ENCOMENDAS ADD CONSTRAINT FK_ENCOMENDAS_MALOTE FOREIGN KEY (MALOTE_ID) REFERENCES MALOTE(ID);

PROMPT === Validação: conferir colunas e constraints na ENCOMENDAS ===;
SELECT column_name, data_type, nullable
FROM user_tab_columns
WHERE table_name = 'ENCOMENDAS'
  AND UPPER(column_name) IN ('LACRE_ID','MALOTE_ID','CODIGO_LACRE_MALOTE');

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

PROMPT === Colunas e FKs adicionadas em ENCOMENDAS com sucesso ===;