-- Verificar se o tablespace PROTOCOLO_DATA existe
SET PAGESIZE 0
SET FEEDBACK OFF
SELECT 'TABLESPACE_EXISTS: ' || tablespace_name FROM dba_tablespaces WHERE tablespace_name = 'PROTOCOLO_DATA';
SELECT 'TOTAL_TABLESPACES: ' || COUNT(*) FROM dba_tablespaces;
EXIT;