-- ========================================
-- SCRIPT COMPLETO - CONFIGURAÇÃO ORACLE XE
-- ========================================

-- 1. Criar tablespace PROTOCOLO_DATA
CREATE TABLESPACE PROTOCOLO_DATA
DATAFILE 'C:\app\88417646191\product\21c\oradata\XE\protocolo_data01.dbf'
SIZE 100M
AUTOEXTEND ON
NEXT 10M
MAXSIZE UNLIMITED;

-- 2. Conectar ao PDB (recomendado para Oracle XE)
ALTER SESSION SET CONTAINER = XEPDB1;

-- 3. Criar tablespace no PDB
CREATE TABLESPACE PROTOCOLO_DATA
DATAFILE 'C:\app\88417646191\product\21c\oradata\XE\XEPDB1\protocolo_data01.dbf'
SIZE 100M
AUTOEXTEND ON
NEXT 10M
MAXSIZE UNLIMITED;

-- 4. Criar usuário no PDB (sem prefixo C##)
CREATE USER protocolo_user IDENTIFIED BY "Protocolo@2025"
DEFAULT TABLESPACE PROTOCOLO_DATA
TEMPORARY TABLESPACE TEMP
QUOTA UNLIMITED ON PROTOCOLO_DATA;

-- 5. Conceder permissões básicas
GRANT CONNECT TO protocolo_user;
GRANT RESOURCE TO protocolo_user;
GRANT CREATE SESSION TO protocolo_user;

-- 6. Conceder permissões para criar objetos
GRANT CREATE TABLE TO protocolo_user;
GRANT CREATE SEQUENCE TO protocolo_user;
GRANT CREATE VIEW TO protocolo_user;
GRANT CREATE PROCEDURE TO protocolo_user;
GRANT CREATE TRIGGER TO protocolo_user;
GRANT CREATE INDEX TO protocolo_user;

-- 7. Permissões adicionais
GRANT CREATE SYNONYM TO protocolo_user;
GRANT UNLIMITED TABLESPACE TO protocolo_user;

-- 8. Verificar criação do usuário
SELECT username, default_tablespace, account_status 
FROM dba_users 
WHERE username = 'PROTOCOLO_USER';

-- 9. Verificar tablespace
SELECT tablespace_name, file_name, bytes/1024/1024 as size_mb
FROM dba_data_files
WHERE tablespace_name = 'PROTOCOLO_DATA';

-- 10. Verificar permissões
SELECT grantee, privilege
FROM dba_sys_privs
WHERE grantee = 'PROTOCOLO_USER';

COMMIT;

-- Script concluído!
-- Teste a conexão: sqlplus protocolo_user/"Protocolo@2025"@localhost:1521/XEPDB1
EXIT;