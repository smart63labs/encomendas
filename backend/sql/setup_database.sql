-- ========================================
-- SETUP COMPLETO DO BANCO ORACLE
-- Sistema de Protocolo
-- ========================================

-- IMPORTANTE: Execute este script como SYSDBA
-- Comando: sqlplus sys/sua_senha@localhost:1521/XE as sysdba
-- Depois execute: @setup_database.sql

SET ECHO ON
SET FEEDBACK ON
SPOOL setup_database.log

PROMPT ========================================
PROMPT Iniciando setup do banco de dados...
PROMPT ========================================

-- ========================================
-- 1. CRIAR TABLESPACE
-- ========================================
PROMPT
PROMPT 1. Criando tablespace PROTOCOLO_DATA...

-- Para Windows (Oracle XE)
CREATE TABLESPACE PROTOCOLO_DATA
DATAFILE 'C:\oraclexe\app\oracle\oradata\XE\protocolo_data01.dbf'
SIZE 100M
AUTOEXTEND ON
NEXT 10M
MAXSIZE 2G;

-- Verificar criação
SELECT tablespace_name, file_name, bytes/1024/1024 as size_mb
FROM dba_data_files
WHERE tablespace_name = 'PROTOCOLO_DATA';

PROMPT Tablespace PROTOCOLO_DATA criado com sucesso!

-- ========================================
-- 2. CRIAR USUÁRIO
-- ========================================
PROMPT
PROMPT 2. Criando usuário protocolo_user...

CREATE USER protocolo_user IDENTIFIED BY "Protocolo@2025"
DEFAULT TABLESPACE PROTOCOLO_DATA
TEMPORARY TABLESPACE TEMP
QUOTA UNLIMITED ON PROTOCOLO_DATA;

PROMPT Usuário protocolo_user criado com sucesso!

-- ========================================
-- 3. CONCEDER PERMISSÕES BÁSICAS
-- ========================================
PROMPT
PROMPT 3. Concedendo permissões básicas...

GRANT CONNECT TO protocolo_user;
GRANT RESOURCE TO protocolo_user;
GRANT CREATE SESSION TO protocolo_user;

PROMPT Permissões básicas concedidas!

-- ========================================
-- 4. CONCEDER PERMISSÕES DE OBJETOS
-- ========================================
PROMPT
PROMPT 4. Concedendo permissões de objetos...

GRANT CREATE TABLE TO protocolo_user;
GRANT CREATE SEQUENCE TO protocolo_user;
GRANT CREATE VIEW TO protocolo_user;
GRANT CREATE PROCEDURE TO protocolo_user;
GRANT CREATE TRIGGER TO protocolo_user;
GRANT CREATE INDEX TO protocolo_user;
GRANT CREATE SYNONYM TO protocolo_user;

PROMPT Permissões de objetos concedidas!

-- ========================================
-- 5. PERMISSÕES ADICIONAIS
-- ========================================
PROMPT
PROMPT 5. Concedendo permissões adicionais...

-- Permitir acesso a views do sistema
GRANT SELECT ON v_$session TO protocolo_user;
GRANT SELECT ON v_$version TO protocolo_user;

-- Permitir execução de procedimentos do sistema
GRANT EXECUTE ON dbms_output TO protocolo_user;
GRANT EXECUTE ON dbms_sql TO protocolo_user;

PROMPT Permissões adicionais concedidas!

-- ========================================
-- 6. VERIFICAÇÕES FINAIS
-- ========================================
PROMPT
PROMPT 6. Executando verificações finais...

-- Verificar usuário
PROMPT
PROMPT Informações do usuário criado:
SELECT username, default_tablespace, temporary_tablespace, account_status, created
FROM dba_users 
WHERE username = 'PROTOCOLO_USER';

-- Verificar permissões
PROMPT
PROMPT Permissões do sistema concedidas:
SELECT grantee, privilege
FROM dba_sys_privs
WHERE grantee = 'PROTOCOLO_USER'
ORDER BY privilege;

-- Verificar roles
PROMPT
PROMPT Roles concedidas:
SELECT grantee, granted_role
FROM dba_role_privs
WHERE grantee = 'PROTOCOLO_USER';

-- Verificar quota no tablespace
PROMPT
PROMPT Quota no tablespace:
SELECT username, tablespace_name, 
       CASE 
         WHEN max_bytes = -1 THEN 'UNLIMITED'
         ELSE TO_CHAR(max_bytes/1024/1024) || ' MB'
       END as quota
FROM dba_ts_quotas
WHERE username = 'PROTOCOLO_USER';

COMMIT;

PROMPT
PROMPT ========================================
PROMPT SETUP CONCLUÍDO COM SUCESSO!
PROMPT ========================================
PROMPT
PROMPT Credenciais criadas:
PROMPT   Usuário: protocolo_user
PROMPT   Senha: Protocolo@2025
PROMPT   Tablespace: PROTOCOLO_DATA
PROMPT
PROMPT Para testar a conexão:
PROMPT   sqlplus protocolo_user/"Protocolo@2025"@localhost:1521/XE
PROMPT
PROMPT Próximos passos:
PROMPT   1. Atualize o arquivo .env com as novas credenciais
PROMPT   2. Reinicie o servidor backend
PROMPT   3. Teste os endpoints da API
PROMPT
PROMPT ========================================

SPOOL OFF
EXIT;