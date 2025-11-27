-- Análise de vínculos: ENCOMENDAS x LACRES x MALOTE x SETORES
-- Schema: protocolo_user @ FREEPDB1
-- Execução:
--   sqlplus -s protocolo_user/Anderline49@localhost:1521/FREEPDB1 @docs/ScriptsSQL/analisar_vinculos_encomendas.sql

SET PAGESIZE 200
SET LINESIZE 200
COLUMN TABLE_NAME FORMAT A20
COLUMN COLUMN_NAME FORMAT A30
COLUMN DATA_TYPE FORMAT A20
COLUMN NULLABLE FORMAT A8
COLUMN CONSTRAINT_NAME FORMAT A30
COLUMN REFERENCED_TABLE FORMAT A20

PROMPT === Verificar existência das tabelas principais ===
SELECT table_name FROM user_tables 
WHERE table_name IN ('ENCOMENDAS', 'MALOTE', 'LACRES', 'SETORES')
ORDER BY table_name;

PROMPT === Estrutura: colunas relacionadas em ENCOMENDAS ===
SELECT column_name, data_type, nullable
FROM user_tab_columns
WHERE table_name = 'ENCOMENDAS'
AND (
  UPPER(column_name) LIKE '%SETOR%'
  OR UPPER(column_name) LIKE '%USUARIO%'
  OR UPPER(column_name) LIKE '%MALOTE%'
  OR UPPER(column_name) LIKE '%LACRE%'
)
ORDER BY column_name;

PROMPT === Chaves estrangeiras da ENCOMENDAS (FKs e tabelas referenciadas) ===
SELECT 
  uc.constraint_name,
  ucc.column_name,
  uc_r.table_name AS referenced_table
FROM user_constraints uc
JOIN user_cons_columns ucc 
  ON uc.constraint_name = ucc.constraint_name 
 AND uc.table_name = ucc.table_name
JOIN user_constraints uc_r 
  ON uc.r_constraint_name = uc_r.constraint_name
WHERE uc.table_name = 'ENCOMENDAS'
  AND uc.constraint_type = 'R'
ORDER BY uc.constraint_name, ucc.column_name;

PROMPT === Verificar se há colunas para IDs de lacre/malote diretamente ===
SELECT column_name, data_type, nullable
FROM user_tab_columns
WHERE table_name = 'ENCOMENDAS'
  AND UPPER(column_name) IN ('MALOTE_ID', 'ID_MALOTE', 'LACRE_ID', 'ID_LACRE', 'CODIGO_LACRE_MALOTE');

PROMPT === Amostra de dados para checar vínculo de setores (origem/destino) ===
SELECT 
  e.ID,
  e.SETOR_ORIGEM_ID,
  e.SETOR_DESTINO_ID,
  so.NOME_SETOR AS SETOR_ORIGEM_NOME,
  sd.NOME_SETOR AS SETOR_DESTINO_NOME
FROM ENCOMENDAS e
LEFT JOIN SETORES so ON so.ID = e.SETOR_ORIGEM_ID
LEFT JOIN SETORES sd ON sd.ID = e.SETOR_DESTINO_ID
FETCH FIRST 20 ROWS ONLY;

PROMPT === Conclusão: se não houver colunas/constraints para LACRE/MALOTE, será necessário DDL ===
PROMPT Consulte os resultados acima para confirmar a presença de colunas e FKs.

EXIT SUCCESS