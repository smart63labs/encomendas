# 🗄️ Criando Banco de Dados Oracle para o Sistema de Protocolo

## 📋 Visão Geral
Este guia mostra como criar um banco de dados dedicado, usuário específico e configurar todas as permissões necessárias para o sistema de protocolo.

## 🎯 Objetivo Final
- **Banco:** `PROTOCOLO_DB`
- **Usuário:** `protocolo_user`
- **Senha:** `Protocolo@2025`
- **Tablespace:** `PROTOCOLO_DATA`

## 🚀 Passo a Passo

### 1. Conectar como SYSDBA

```bash
# Conectar como administrador do sistema
sqlplus sys/sua_senha_sys@localhost:1521/XE as sysdba

# Ou se for Oracle padrão:
sqlplus sys/sua_senha_sys@localhost:1521/ORCL as sysdba
```

### 2. Criar Tablespace (Espaço de Armazenamento)

```sql
-- Criar diretório para os dados (ajuste o caminho conforme seu sistema)
-- Windows:
-- C:\app\88417646191\product\21c\dbhomeXE\bin
-- C:\app\88417646191\product\21c
-- C:\app\88417646191\product\21c\oradata\XE
CREATE TABLESPACE PROTOCOLO_DATA
DATAFILE 'C:\app\88417646191\product\21c\oradata\XE\protocolo_data01.dbf'
SIZE 100M
AUTOEXTEND ON
NEXT 10M
MAXSIZE UNLIMITED;  -- FEITO

-- Linux/Unix:
-- CREATE TABLESPACE PROTOCOLO_DATA
-- DATAFILE '/u01/app/oracle/oradata/XE/protocolo_data01.dbf'
-- SIZE 100M
-- AUTOEXTEND ON
-- NEXT 10M
-- MAXSIZE UNLIMITED;
```

### 3. Criar Usuário do Sistema

```sql
-- Para Oracle 12c+ (XE moderno) - usuário deve começar com C##
CREATE USER C##PROTOCOLO_USER IDENTIFIED BY "Protocolo@2025"
DEFAULT TABLESPACE PROTOCOLO_DATA
TEMPORARY TABLESPACE TEMP
QUOTA UNLIMITED ON PROTOCOLO_DATA;

-- OU criar usuário local no PDB (recomendado)
-- Primeiro conectar ao PDB:
-- ALTER SESSION SET CONTAINER = XEPDB1;
-- Depois criar usuário sem prefixo C##:
-- CREATE USER protocolo_user IDENTIFIED BY "Protocolo@2025"
-- DEFAULT TABLESPACE PROTOCOLO_DATA
-- TEMPORARY TABLESPACE TEMP
-- QUOTA UNLIMITED ON PROTOCOLO_DATA;
```

### 4. Conceder Permissões

```sql
-- Permissões básicas de conexão
GRANT CONNECT TO protocolo_user;
GRANT RESOURCE TO protocolo_user;
GRANT CREATE SESSION TO protocolo_user;

-- Permissões para criar objetos
GRANT CREATE TABLE TO protocolo_user;
GRANT CREATE SEQUENCE TO protocolo_user;
GRANT CREATE VIEW TO protocolo_user;
GRANT CREATE PROCEDURE TO protocolo_user;
GRANT CREATE TRIGGER TO protocolo_user;
GRANT CREATE INDEX TO protocolo_user;

-- Permissões adicionais (se necessário)
GRANT CREATE SYNONYM TO protocolo_user;
GRANT CREATE DATABASE LINK TO protocolo_user;
```

### 5. Para Oracle 12c+ com PDB (Pluggable Database)

```sql
-- Se estiver usando Oracle 12c+ com containers
ALTER SESSION SET CONTAINER = XEPDB1;

-- Repetir os comandos de criação de tablespace e usuário
CREATE TABLESPACE PROTOCOLO_DATA
DATAFILE '/opt/oracle/oradata/XE/XEPDB1/protocolo_data01.dbf'
SIZE 100M
AUTOEXTEND ON;

CREATE USER protocolo_user IDENTIFIED BY "Protocolo@2025"
DEFAULT TABLESPACE PROTOCOLO_DATA;

-- Conceder permissões
GRANT CONNECT, RESOURCE TO protocolo_user;
GRANT CREATE SESSION TO protocolo_user;
GRANT UNLIMITED TABLESPACE TO protocolo_user;
```

### 6. Verificar Criação

```sql
-- Verificar se o usuário foi criado
SELECT username, default_tablespace, account_status 
FROM dba_users 
WHERE username = 'PROTOCOLO_USER';

-- Verificar tablespace
SELECT tablespace_name, file_name, bytes/1024/1024 as size_mb
FROM dba_data_files
WHERE tablespace_name = 'PROTOCOLO_DATA';

-- Verificar permissões
SELECT grantee, privilege
FROM dba_sys_privs
WHERE grantee = 'PROTOCOLO_USER';
```

### 7. Testar Conexão

```bash
# Testar conexão com o novo usuário
sqlplus protocolo_user/"Protocolo@2025"@localhost:1521/XE

# Ou para PDB:
sqlplus protocolo_user/"Protocolo@2025"@localhost:1521/XEPDB1
```

## 🔧 Configurar Aplicação

### Atualizar arquivo .env

```env
# Configurações do Banco de Dados Oracle - DEDICADO
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE_NAME=XE
# Para PDB use: DB_SERVICE_NAME=XEPDB1
DB_USER=protocolo_user
DB_PASSWORD=Protocolo@2025
```

## 📝 Script Completo (Copie e Cole)

```sql
-- ========================================
-- SCRIPT COMPLETO - ORACLE XE
-- ========================================

-- 1. Conectar como SYSDBA primeiro
-- sqlplus sys/sua_senha@localhost:1521/XE as sysdba

-- 2. Criar tablespace
CREATE TABLESPACE PROTOCOLO_DATA
DATAFILE 'C:\\oraclexe\\app\\oracle\\oradata\\XE\\protocolo_data01.dbf'
SIZE 100M
AUTOEXTEND ON
NEXT 10M
MAXSIZE UNLIMITED;

-- 3. Criar usuário (Oracle 12c+ requer prefixo C## para usuários comuns)
CREATE USER C##PROTOCOLO_USER IDENTIFIED BY "Protocolo@2025"
DEFAULT TABLESPACE PROTOCOLO_DATA
TEMPORARY TABLESPACE TEMP
QUOTA UNLIMITED ON PROTOCOLO_DATA;

-- OU para PDB (recomendado):
-- ALTER SESSION SET CONTAINER = XEPDB1;
-- CREATE USER protocolo_user IDENTIFIED BY "Protocolo@2025"
-- DEFAULT TABLESPACE PROTOCOLO_DATA
-- TEMPORARY TABLESPACE TEMP
-- QUOTA UNLIMITED ON PROTOCOLO_DATA;

-- 4. Conceder permissões (ajustar nome do usuário conforme criado)
GRANT CONNECT TO C##PROTOCOLO_USER;
GRANT RESOURCE TO C##PROTOCOLO_USER;
GRANT CREATE SESSION TO C##PROTOCOLO_USER;
GRANT CREATE TABLE TO C##PROTOCOLO_USER;
GRANT CREATE SEQUENCE TO C##PROTOCOLO_USER;
GRANT CREATE VIEW TO C##PROTOCOLO_USER;
GRANT CREATE PROCEDURE TO C##PROTOCOLO_USER;
GRANT CREATE TRIGGER TO C##PROTOCOLO_USER;
GRANT CREATE INDEX TO C##PROTOCOLO_USER;

-- Para PDB use: protocolo_user (sem prefixo C##)

-- 5. Verificar (ajustar nome conforme criado)
SELECT username, default_tablespace, account_status 
FROM dba_users 
WHERE username = 'C##PROTOCOLO_USER';

-- Para PDB use: WHERE username = 'PROTOCOLO_USER';

COMMIT;

-- Pronto! Agora teste a conexão:
-- sqlplus protocolo_user/"Protocolo@2025"@localhost:1521/XE
```

## 🚨 Problemas Comuns

### ❌ Erro: ORA-65096 (nome de usuário comum inválido)
**Problema:** Oracle 12c+ requer prefixo `C##` para usuários comuns ou criação no PDB.

**Solução 1 - Usuário Comum (CDB):**
```sql
-- Usar prefixo C## obrigatório
CREATE USER C##PROTOCOLO_USER IDENTIFIED BY "Protocolo@2025"
DEFAULT TABLESPACE PROTOCOLO_DATA;
```

**Solução 2 - Usuário Local (PDB) - RECOMENDADO:**
```sql
-- Conectar ao PDB primeiro
ALTER SESSION SET CONTAINER = XEPDB1;

-- Criar usuário sem prefixo
CREATE USER protocolo_user IDENTIFIED BY "Protocolo@2025"
DEFAULT TABLESPACE PROTOCOLO_DATA;
```

**Atualizar .env conforme a opção escolhida:**
```env
# Para usuário comum (C##):
DB_USER=C##PROTOCOLO_USER

# Para usuário PDB (recomendado):
DB_USER=protocolo_user
DB_SERVICE_NAME=XEPDB1
```

### Erro: ORA-01950 (sem privilégios no tablespace)
```sql
GRANT UNLIMITED TABLESPACE TO protocolo_user;
```

### Erro: ORA-00959 (tablespace não existe)
```sql
-- Verificar tablespaces disponíveis
SELECT tablespace_name FROM dba_tablespaces;
```

### Erro: ORA-01031 (privilégios insuficientes)
```sql
-- Conectar como SYSDBA
sqlplus sys/senha as sysdba
```

## 📞 Próximos Passos

1. **Execute o script completo** como SYSDBA
2. **Teste a conexão** com o novo usuário
3. **Atualize o .env** com as novas credenciais
4. **Reinicie o servidor** backend
5. **Teste os endpoints** da API

---

**💡 Dica:** Salve as credenciais em local seguro!
- **Usuário:** `protocolo_user`
- **Senha:** `Protocolo@2025`
- **Banco:** `XE` (ou `XEPDB1` para PDB)