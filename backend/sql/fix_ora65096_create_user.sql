-- =====================================================
-- SOLUÇÃO PARA ERRO ORA-65096
-- Oracle 12c+ - Criação de Usuário Correta
-- =====================================================

-- OPÇÃO 1: USUÁRIO COMUM (CDB) - Com prefixo C##
-- Execute como SYSDBA no container raiz

-- 1.1. Criar tablespace (se ainda não criou)
CREATE TABLESPACE PROTOCOLO_DATA
DATAFILE 'C:\app\88417646191\product\21c\oradata\XE\protocolo_data01.dbf'
SIZE 100M
AUTOEXTEND ON
NEXT 10M
MAXSIZE UNLIMITED;

-- 1.2. Criar usuário comum com prefixo C##
CREATE USER C##PROTOCOLO_USER IDENTIFIED BY "Protocolo@2025"
DEFAULT TABLESPACE PROTOCOLO_DATA
TEMPORARY TABLESPACE TEMP
QUOTA UNLIMITED ON PROTOCOLO_DATA;

-- 1.3. Conceder permissões
GRANT CONNECT TO C##PROTOCOLO_USER;
GRANT RESOURCE TO C##PROTOCOLO_USER;
GRANT CREATE SESSION TO C##PROTOCOLO_USER;
GRANT CREATE TABLE TO C##PROTOCOLO_USER;
GRANT CREATE SEQUENCE TO C##PROTOCOLO_USER;
GRANT CREATE VIEW TO C##PROTOCOLO_USER;
GRANT CREATE PROCEDURE TO C##PROTOCOLO_USER;
GRANT CREATE TRIGGER TO C##PROTOCOLO_USER;
GRANT CREATE INDEX TO C##PROTOCOLO_USER;

-- 1.4. Verificar criação
SELECT username, default_tablespace, account_status 
FROM dba_users 
WHERE username = 'C##PROTOCOLO_USER';

-- =====================================================
-- OPÇÃO 2: USUÁRIO LOCAL (PDB) - RECOMENDADO
-- Execute como SYSDBA
-- =====================================================

-- 2.1. Conectar ao PDB
ALTER SESSION SET CONTAINER = XEPDB1;

-- 2.2. Criar tablespace no PDB
CREATE TABLESPACE PROTOCOLO_DATA
DATAFILE '/opt/oracle/oradata/XE/XEPDB1/protocolo_data01.dbf'
SIZE 100M
AUTOEXTEND ON
NEXT 10M
MAXSIZE UNLIMITED;

-- Para Windows, use:
-- DATAFILE 'C:\app\88417646191\product\21c\oradata\XE\XEPDB1\protocolo_data01.dbf'

-- 2.3. Criar usuário local (sem prefixo C##)
CREATE USER protocolo_user IDENTIFIED BY "Protocolo@2025"
DEFAULT TABLESPACE PROTOCOLO_DATA
TEMPORARY TABLESPACE TEMP
QUOTA UNLIMITED ON PROTOCOLO_DATA;

-- 2.4. Conceder permissões
GRANT CONNECT TO protocolo_user;
GRANT RESOURCE TO protocolo_user;
GRANT CREATE SESSION TO protocolo_user;
GRANT CREATE TABLE TO protocolo_user;
GRANT CREATE SEQUENCE TO protocolo_user;
GRANT CREATE VIEW TO protocolo_user;
GRANT CREATE PROCEDURE TO protocolo_user;
GRANT CREATE TRIGGER TO protocolo_user;
GRANT CREATE INDEX TO protocolo_user;

-- 2.5. Verificar criação
SELECT username, default_tablespace, account_status 
FROM dba_users 
WHERE username = 'PROTOCOLO_USER';

-- =====================================================
-- CONFIGURAÇÃO DO .ENV
-- =====================================================

/*
Para OPÇÃO 1 (Usuário Comum):
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE_NAME=XE
DB_USER=C##PROTOCOLO_USER
DB_PASSWORD=Protocolo@2025

Para OPÇÃO 2 (PDB - Recomendado):
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE_NAME=XEPDB1
DB_USER=protocolo_user
DB_PASSWORD=Protocolo@2025
*/

-- =====================================================
-- TESTE DE CONEXÃO
-- =====================================================

-- Para OPÇÃO 1:
-- sqlplus C##PROTOCOLO_USER/"Protocolo@2025"@localhost:1521/XE

-- Para OPÇÃO 2:
-- sqlplus protocolo_user/"Protocolo@2025"@localhost:1521/XEPDB1

-- =====================================================
-- COMANDOS DE LIMPEZA (se necessário)
-- =====================================================

-- Remover usuário comum (OPÇÃO 1):
-- DROP USER C##PROTOCOLO_USER CASCADE;

-- Remover usuário PDB (OPÇÃO 2):
-- ALTER SESSION SET CONTAINER = XEPDB1;
-- DROP USER protocolo_user CASCADE;

-- Remover tablespace:
-- DROP TABLESPACE PROTOCOLO_DATA INCLUDING CONTENTS AND DATAFILES;

COMMIT;

-- =====================================================
-- RESUMO DAS DIFERENÇAS
-- =====================================================
/*
USUÁRIO COMUM (C##):
✅ Funciona em qualquer container
❌ Nome mais longo e complexo
❌ Visível em todos os PDBs

USUÁRIO PDB (Local):
✅ Nome simples e limpo
✅ Isolado no PDB específico
✅ Melhor para aplicações
❌ Só funciona no PDB específico

RECOMENDAÇÃO: Use OPÇÃO 2 (PDB)
*/