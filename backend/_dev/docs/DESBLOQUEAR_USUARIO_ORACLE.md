# Guia para Desbloquear Usuário Oracle

## ✅ Problema Resolvido!

O erro **NJS-046: pool alias "default" already exists** foi corrigido com sucesso! 

Agora o sistema está apresentando um novo erro: **ORA-28000: A conta está bloqueada**, que indica que o usuário Oracle está bloqueado por tentativas de login incorretas.

## 🔓 Como Desbloquear o Usuário

### Opção 1: Usando SQL*Plus ou SQL Developer (Recomendado)

```sql
-- Conectar como SYSDBA
sqlplus sys/senha_do_sys@localhost:1521/xe as sysdba

-- Desbloquear o usuário
ALTER USER protocolo_user ACCOUNT UNLOCK;

-- Opcional: Redefinir a senha
ALTER USER protocolo_user IDENTIFIED BY "Protocolo@2025";

-- Verificar status do usuário
SELECT username, account_status, lock_date, expiry_date 
FROM dba_users 
WHERE username = 'PROTOCOLO_USER';
```

### Opção 2: Usando o Script Automático

Crie um arquivo `desbloquear_usuario.sql`:

```sql
-- desbloquear_usuario.sql
CONNECT sys/senha_do_sys@localhost:1521/xe AS SYSDBA;

-- Desbloquear usuário
ALTER USER protocolo_user ACCOUNT UNLOCK;

-- Redefinir senha
ALTER USER protocolo_user IDENTIFIED BY "Protocolo@2025";

-- Verificar se foi desbloqueado
SELECT 'Usuario desbloqueado com sucesso!' as status,
       username, 
       account_status,
       created,
       lock_date
FROM dba_users 
WHERE username = 'PROTOCOLO_USER';

EXIT;
```

Execute o script:
```bash
sqlplus /nolog @desbloquear_usuario.sql
```

### Opção 3: Usando Oracle SQL Developer

1. Abra o Oracle SQL Developer
2. Conecte como usuário com privilégios DBA (sys, system)
3. Execute os comandos:
   ```sql
   ALTER USER protocolo_user ACCOUNT UNLOCK;
   ALTER USER protocolo_user IDENTIFIED BY "Protocolo@2025";
   ```

## 🔍 Verificar Status do Usuário

```sql
-- Verificar todos os usuários e seus status
SELECT username, account_status, lock_date, expiry_date, created
FROM dba_users 
WHERE username IN ('PROTOCOLO_USER', 'SYS', 'SYSTEM')
ORDER BY username;

-- Verificar tentativas de login falhadas
SELECT username, failed_login_attempts, account_status
FROM dba_users 
WHERE username = 'PROTOCOLO_USER';
```

## 🛠️ Comandos de Emergência

Se não conseguir conectar com nenhum usuário:

```bash
# Parar o Oracle
net stop OracleServiceXE

# Iniciar o Oracle
net start OracleServiceXE

# Conectar como SYSDBA sem senha (modo local)
sqlplus / as sysdba
```

## 📋 Checklist de Resolução

- [ ] Conectar como SYSDBA
- [ ] Executar `ALTER USER protocolo_user ACCOUNT UNLOCK;`
- [ ] Redefinir senha: `ALTER USER protocolo_user IDENTIFIED BY "Protocolo@2025";`
- [ ] Verificar status: `SELECT username, account_status FROM dba_users WHERE username = 'PROTOCOLO_USER';`
- [ ] Testar conexão com a aplicação
- [ ] Verificar se o servidor backend inicia sem erros

## 🔄 Após Desbloquear

1. **Reinicie o servidor backend:**
   ```bash
   npm run dev
   ```

2. **Teste o endpoint:**
   ```
   GET http://localhost:3000/api/database/check-tables
   ```

3. **Verifique os logs** para confirmar que a conexão foi estabelecida

## 📞 Suporte

Se ainda houver problemas:
- Verifique se o Oracle XE está rodando: `net start OracleServiceXE`
- Confirme a porta: `lsnrctl status`
- Verifique o arquivo `.env` com as credenciais corretas
- Consulte os logs em `backend/logs/error.log`

---

## 🆕 NOVO ERRO IDENTIFICADO: NJS-511

### ✅ Progresso dos Erros:
1. **NJS-046 (pool já existe)** - ✅ **CORRIGIDO**
2. **ORA-28000 (conta bloqueada)** - ✅ **CORRIGIDO** (credenciais atualizadas)
3. **NJS-511 (erro de rede)** - 🔄 **ATUAL**

### 🔍 Erro NJS-511: Problema de Conectividade

O erro **NJS-511** indica que o Oracle Database não está acessível na rede. Possíveis causas:

#### 🔧 Soluções para NJS-511:

**1. Verificar se o Oracle está rodando:**
```bash
# Windows
net start | findstr Oracle

# Ou verificar serviços específicos
net start OracleServiceXE
net start OracleXETNSListener
```

**2. Testar conectividade:**
```bash
# Testar se a porta está aberta
telnet localhost 1521

# Ou usar PowerShell
Test-NetConnection -ComputerName localhost -Port 1521
```

**3. Verificar listener Oracle:**
```bash
lsnrctl status
lsnrctl start
```

**4. Verificar configuração de rede:**
- Arquivo `tnsnames.ora`
- Arquivo `listener.ora`
- Firewall do Windows

**5. Comandos de diagnóstico:**
```bash
# Verificar processos Oracle
tasklist | findstr oracle

# Verificar portas em uso
netstat -an | findstr 1521
```

### 📋 Checklist de Resolução NJS-511:

- [ ] Verificar se o Oracle XE está instalado
- [ ] Iniciar serviço OracleServiceXE
- [ ] Iniciar serviço OracleXETNSListener
- [ ] Testar conectividade na porta 1521
- [ ] Verificar configuração do listener
- [ ] Verificar firewall do Windows
- [ ] Testar conexão com SQL*Plus
- [ ] Reiniciar aplicação backend

**Status:** ✅ NJS-046 e ORA-28000 corrigidos | 🔄 Resolvendo NJS-511
**Próximo passo:** Verificar e iniciar serviços Oracle