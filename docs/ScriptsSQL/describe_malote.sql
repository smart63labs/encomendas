SET PAGESIZE 200
SET LINESIZE 200
PROMPT === Estrutura da tabela MALOTE ===
SELECT column_name, data_type, nullable
FROM user_tab_columns
WHERE table_name = 'MALOTE'
ORDER BY column_id;

PROMPT === Chave primária da tabela MALOTE ===
SELECT uc.constraint_name, ucc.column_name
FROM user_constraints uc
JOIN user_cons_columns ucc ON uc.constraint_name = ucc.constraint_name AND uc.table_name = ucc.table_name
WHERE uc.table_name = 'MALOTE' AND uc.constraint_type = 'P';
EXIT SUCCESS