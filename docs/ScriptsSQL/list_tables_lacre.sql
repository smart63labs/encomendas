SET PAGESIZE 200
SET LINESIZE 200
PROMPT === Tabelas que contém 'LACRE' no nome ===
SELECT table_name FROM user_tables WHERE table_name LIKE '%LACRE%';
EXIT SUCCESS