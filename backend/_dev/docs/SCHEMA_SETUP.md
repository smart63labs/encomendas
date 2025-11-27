# Criação de Schema Dedicado - Novo Protocolo

## Visão Geral

Este guia explica como criar um schema dedicado para o projeto Novo Protocolo no Oracle Database XE, separando-o do schema SYSTEM.

## Por que criar um schema dedicado?

- **Segurança**: Evita usar o schema administrativo SYSTEM
- **Organização**: Mantém as tabelas do projeto isoladas
- **Manutenção**: Facilita backup, restore e manutenção
- **Boas práticas**: Segue padrões de desenvolvimento Oracle

## Passo a Passo

### 1. Executar o Script SQL

**Arquivo**: `backend/sql/create_dedicated_schema.sql`

**Como executar**:

#### Opção A: SQL Developer / SQL Plus
```sql
-- Conecte-se como SYSTEM
-- Execute o arquivo create_dedicated_schema.sql
@C:\caminho\para\create_dedicated_schema.sql
```

#### Opção B: Linha de comando
```bash
# No diretório backend/sql
sqlplus system/Anderline49@localhost:1521/xe @create_dedicated_schema.sql
```

### 2. Atualizar Configurações

**Arquivo**: `backend/.env`

Altere as seguintes linhas:
```env
# Antes
DB_USER=system
DB_PASSWORD=Anderline49

# Depois
DB_USER=NOVOPROTOCOLO
DB_PASSWORD=NovoProtocolo2024
```

### 3. Reiniciar o Servidor

```bash
# Parar o servidor atual (Ctrl+C)
# Reiniciar
npm run dev
```

### 4. Verificar a Criação

**Teste via API**:
```bash
# Verificar schema atual
curl http://localhost:3001/api/database/schema-info

# Verificar tabelas
curl http://localhost:3001/api/database/check-tables
```

## Detalhes do Schema Criado

### Usuário/Schema
- **Nome**: NOVOPROTOCOLO
- **Senha**: NovoProtocolo2024
- **Tablespace**: USERS
- **Privilégios**: CONNECT, RESOURCE, CREATE SESSION, etc.

### Tabelas Criadas
1. **USUARIOS** - Gerenciamento de usuários
2. **PROCESSOS** - Controle de processos
3. **DOCUMENTOS** - Arquivos anexados
4. **TRAMITACOES** - Histórico de movimentações
5. **PRAZOS** - Controle de prazos
6. **ENCOMENDAS** - Gestão de encomendas

### Índices de Performance
- Índices em campos de busca frequente
- Índices em chaves estrangeiras
- Índices em campos de status e datas

### Dados Iniciais
- **Usuário Administrador**:
  - Email: admin@novoprotocolo.com
  - Senha: admin123
  - Perfil: ADMIN

## Verificação de Sucesso

Após executar todos os passos, você deve ver:

1. **Schema Info**:
   ```json
   {
     "currentUser": "NOVOPROTOCOLO",
     "totalTablesInSchema": 6
   }
   ```

2. **Check Tables**:
   ```json
   {
     "allTablesExist": true,
     "existingTables": 6,
     "missingTables": 0
   }
   ```

## Troubleshooting

### Erro: "User already exists"
```sql
-- Remover usuário existente
DROP USER NOVOPROTOCOLO CASCADE;
-- Executar novamente o script
```

### Erro: "Insufficient privileges"
- Certifique-se de estar conectado como SYSTEM ou DBA
- Verifique se o Oracle XE está rodando

### Erro de conexão após mudança
- Verifique se o arquivo .env foi salvo
- Reinicie completamente o servidor backend
- Confirme se o usuário NOVOPROTOCOLO foi criado

## Comandos Úteis

### Verificar usuários Oracle
```sql
SELECT username, account_status FROM dba_users 
WHERE username = 'NOVOPROTOCOLO';
```

### Verificar tabelas do schema
```sql
-- Conectado como NOVOPROTOCOLO
SELECT table_name FROM user_tables ORDER BY table_name;
```

### Verificar privilégios
```sql
SELECT * FROM user_sys_privs;
SELECT * FROM user_tab_privs;
```

## Backup e Restore

### Fazer backup do schema
```bash
expdp system/Anderline49@localhost:1521/xe \
  schemas=NOVOPROTOCOLO \
  directory=DATA_PUMP_DIR \
  dumpfile=novoprotocolo_backup.dmp \
  logfile=novoprotocolo_backup.log
```

### Restaurar schema
```bash
impdp system/Anderline49@localhost:1521/xe \
  schemas=NOVOPROTOCOLO \
  directory=DATA_PUMP_DIR \
  dumpfile=novoprotocolo_backup.dmp \
  logfile=novoprotocolo_restore.log
```

## Próximos Passos

Após criar o schema dedicado:

1. ✅ Testar todas as funcionalidades da API
2. ✅ Verificar se os dados são persistidos corretamente
3. ✅ Configurar backup automático
4. ✅ Documentar as credenciais de forma segura
5. ✅ Considerar criar usuários específicos para diferentes ambientes (dev, test, prod)

## Segurança

⚠️ **Importante**:
- Nunca commite senhas no Git
- Use senhas fortes em produção
- Configure backup regular
- Monitore acessos ao banco
- Considere criptografia de dados sensíveis

---

**Suporte**: Em caso de dúvidas, consulte a documentação Oracle ou entre em contato com a equipe de desenvolvimento.