# 🔧 Guia de Configuração do Oracle Database

## ❌ Erro Atual: ORA-01017
**Problema:** Credenciais inválidas ou usuário não autorizado

## 🔍 Como Descobrir as Configurações Corretas

### 1. Verificar se o Oracle está Instalado e Rodando

```bash
# Windows - Verificar serviços do Oracle
Get-Service | Where-Object {$_.Name -like "*Oracle*"}

# Ou pelo Prompt de Comando
sc query | findstr Oracle
```

### 2. Descobrir o SERVICE_NAME

```sql
-- Conecte no SQL*Plus ou SQL Developer e execute:
SELECT name FROM v$database;
SELECT instance_name FROM v$instance;
SHOW parameter service_names;
```

### 3. Testar Conexão Manual

```bash
# Teste via SQL*Plus
sqlplus system/oracle@localhost:1521/XE

# Ou via TNS
sqlplus system/oracle@XE
```

## 🎯 Configurações Mais Comuns

### Oracle XE (Express Edition)
```env
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE_NAME=XE
DB_USER=system
DB_PASSWORD=oracle
```

### Oracle Standard/Enterprise
```env
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE_NAME=ORCL
DB_USER=hr
DB_PASSWORD=hr
```

### Oracle em Docker
```env
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE_NAME=XEPDB1
DB_USER=system
DB_PASSWORD=Oradoc_db1
```

## 🔐 Criar Usuário Específico (Recomendado)

```sql
-- Conecte como SYSTEM e execute:
CREATE USER protocolo_user IDENTIFIED BY protocolo_pass;
GRANT CONNECT, RESOURCE TO protocolo_user;
GRANT CREATE SESSION TO protocolo_user;
GRANT CREATE TABLE TO protocolo_user;
GRANT CREATE SEQUENCE TO protocolo_user;
GRANT CREATE VIEW TO protocolo_user;
GRANT CREATE PROCEDURE TO protocolo_user;

-- Para Oracle 12c+ (com PDB)
ALTER SESSION SET CONTAINER = XEPDB1;
CREATE USER protocolo_user IDENTIFIED BY protocolo_pass;
GRANT CONNECT, RESOURCE TO protocolo_user;
```

## 🚀 Passos para Resolver

1. **Identifique sua instalação Oracle:**
   - Oracle XE, Standard ou Enterprise?
   - Versão (11g, 12c, 18c, 19c, 21c)?
   - Instalação local ou Docker?

2. **Teste a conexão manualmente:**
   ```bash
   sqlplus system/sua_senha@localhost:1521/XE
   ```

3. **Atualize o arquivo .env:**
   - Descomente a opção correta
   - Comente as outras opções

4. **Reinicie o servidor backend:**
   ```bash
   npm run dev
   ```

5. **Teste novamente:**
   ```
   http://localhost:3000/api/database/check-tables
   ```

## 🆘 Problemas Comuns

### Senha Expirada
```sql
-- Conecte como SYSTEM
ALTER USER system IDENTIFIED BY nova_senha;
```

### Usuário Bloqueado
```sql
-- Desbloquear usuário
ALTER USER system ACCOUNT UNLOCK;
```

### Serviço Parado
```bash
# Windows - Iniciar serviço
net start OracleServiceXE
net start OracleXETNSListener
```

### Porta Ocupada
```bash
# Verificar o que está usando a porta 1521
netstat -an | findstr 1521
```

## 📞 Contatos para Suporte

- **DBA da empresa:** [contato do DBA]
- **Administrador de TI:** [contato do TI]
- **Documentação Oracle:** https://docs.oracle.com/

---

**💡 Dica:** Sempre teste a conexão manualmente antes de configurar a aplicação!