# 🚀 Guia de Instalação e Configuração - NovoProtocolo V2

## 📋 **Pré-requisitos do Sistema**

Antes de iniciar a instalação, certifique-se de que seu sistema atende aos seguintes requisitos:

### **Software Obrigatório**
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **Oracle 21ai (Oracle 21c AI)** - [Download](https://www.oracle.com/database/technologies/oracle21c-downloads.html)
- **Oracle Instant Client** - [Download](https://www.oracle.com/database/technologies/instant-client.html)

### **Software Recomendado**
- **Visual Studio Code** - [Download](https://code.visualstudio.com/)
- **Oracle SQL Developer** - [Download](https://www.oracle.com/tools/downloads/sqldev-downloads.html)
- **Postman** (para testes de API) - [Download](https://www.postman.com/)

### **Requisitos de Hardware**
- **RAM:** Mínimo 8GB (Recomendado 16GB)
- **Armazenamento:** 10GB livres
- **Processador:** Intel i5 ou equivalente

---

## 🗄️ **Configuração do Oracle 21ai**

### **Passo 1: Instalação do Oracle 21ai**

1. **Baixar e Instalar Oracle 21ai**
   ```bash
   # Baixe o instalador do site oficial da Oracle
   # Execute como administrador
   # Defina uma senha forte para o usuário SYSTEM
   ```

2. **Configuração Padrão**
   ```
   Host: localhost
   Port: 1521
   Database: FREEPDB1
   Username: system
   Password: [sua_senha_definida]
   Client: OraDB21Home1
   ```

### **Passo 2: Configuração do Usuário da Aplicação**

1. **Conectar como SYSTEM**
   ```sql
   -- Via SQL*Plus ou Oracle SQL Developer
   sqlplus system/[sua_senha]@localhost:1521/FREEPDB1
   ```

2. **Criar Usuário Específico**
   ```sql
   -- Criar usuário para o NovoProtocolo
   CREATE USER protocolo_user IDENTIFIED BY "Anderline49";
   
   -- Conceder privilégios necessários
   GRANT CONNECT TO protocolo_user;
   GRANT RESOURCE TO protocolo_user;
   GRANT CREATE SESSION TO protocolo_user;
   GRANT CREATE TABLE TO protocolo_user;
   GRANT CREATE SEQUENCE TO protocolo_user;
   GRANT CREATE TRIGGER TO protocolo_user;
   GRANT CREATE VIEW TO protocolo_user;
   GRANT CREATE PROCEDURE TO protocolo_user;
   
   -- Conceder quota no tablespace
   ALTER USER protocolo_user QUOTA UNLIMITED ON USERS;
   
   -- Verificar criação
   SELECT username, account_status FROM dba_users WHERE username = 'PROTOCOLO_USER';
   ```

### **Passo 3: Verificar Conectividade**
```sql
-- Testar conexão com o novo usuário
CONNECT protocolo_user/Anderline49@localhost:1521/FREEPDB1

-- Verificar se está conectado
SELECT USER FROM DUAL;
```

---

## 📦 **Instalação do Projeto**

### **Passo 1: Clonar o Repositório**
```bash
# Clone o projeto
git clone [URL_DO_REPOSITORIO]
cd NovoProtocolo/V2

# Ou se já possui o projeto localmente
cd c:\Users\[SEU_USUARIO]\Documents\NovoProtocolo\V2
```

### **Passo 2: Instalar Dependências do Frontend**
```bash
# Instalar dependências do React
npm install

# Ou usando yarn
yarn install
```

### **Passo 3: Configurar Variáveis de Ambiente**

#### **Frontend (.env na raiz do projeto)**
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar o arquivo .env com suas configurações
```

**Conteúdo do arquivo `.env`:**
```env
# Configuração da API
VITE_API_URL=http://localhost:3001/api

# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
```

#### **Backend (backend/.env)**
```env
# ===========================================
# CONFIGURAÇÃO DE AMBIENTE - NOVOPROTOCOLO
# ===========================================

# Ambiente de execução
NODE_ENV=development
PORT=3001
BYPASS_RATE_LIMIT=true

# ===========================================
# ORACLE DATABASE CONFIGURATION
# ===========================================
# Credenciais do banco - USUÁRIO DEDICADO PROTOCOLO
DB_USER=protocolo_user
DB_PASSWORD=Anderline49

DB_CONNECT_STRING=localhost:1521/FREEPDB1

# Configurações específicas da conexão Oracle
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE_NAME=FREEPDB1
DB_SID=FREEPDB1

# ===========================================
# OPENROUTESERVICE API CONFIGURATION
# ===========================================
# Chave de API válida para OpenRouteService
OPENROUTESERVICE_API_KEY=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjIxMWJlMDUzNzZlNzRlZDNiNjRhYzVkNTNlMDI0NjAzIiwiaCI6Im11cm11cjY0In0=

# Pool de conexões
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_INCREMENT=1
DB_POOL_TIMEOUT=60

# ===========================================
# AUTENTICAÇÃO E SEGURANÇA
# ===========================================

# JWT Configuration
JWT_SECRET=2cf7bbc0a459296097d6b2ea1c70661ea6df061db9d50826398c2b640df5337974137d0950f0aff635fb299401a9cba16ed4c815524da580d117aec6b51a5eac
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Bcrypt rounds (10-12 recomendado)
BCRYPT_ROUNDS=10

# ===========================================
# UPLOAD DE ARQUIVOS
# ===========================================

# Diretório de uploads
UPLOAD_DIR=./uploads
UPLOAD_TEMP_DIR=./uploads/temp

# Limites de arquivo (em bytes)
MAX_FILE_SIZE=10485760
MAX_FILES_PER_REQUEST=5

# Tipos de arquivo permitidos
ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,jpg,jpeg,png,gif,txt,zip,rar

# ===========================================
# CORS E SEGURANÇA
# ===========================================

# Origins permitidas (separadas por vírgula)
CORS_ORIGIN=http://localhost:8081,http://localhost:8082,http://localhost:3000

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ===========================================
# LOGGING
# ===========================================

# Nível de log (error, warn, info, debug)
LOG_LEVEL=info
LOG_FILE=./logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5
```

---

## 🚀 **Executando o Projeto**

### **Modo Desenvolvimento (Frontend Apenas)**
```bash
# Iniciar o servidor de desenvolvimento
npm run dev

# Ou usando yarn
yarn dev

# O projeto estará disponível em: http://localhost:5173
```

### **Verificar se está Funcionando**
1. Abra o navegador em `http://localhost:5173`
2. Você deve ver a tela de login do NovoProtocolo V2
3. Teste a navegação entre os módulos
4. Verifique se os dados estão sendo salvos (localStorage)

---

## 🔧 **Configuração do Backend (Quando Disponível)**

### **Passo 1: Instalar Dependências do Backend**
```bash
# Navegar para a pasta do backend
cd backend

# Instalar dependências
npm install

# Ou usando yarn
yarn install
```

### **Passo 2: Configurar Banco de Dados**
```bash
# Executar migrations (criar tabelas)
npm run migrate

# Executar seeds (dados iniciais)
npm run seed
```

### **Passo 3: Iniciar Backend**
```bash
# Modo desenvolvimento
npm run dev

# Modo produção
npm start

# O backend estará disponível em: http://localhost:3001
```

---

## 🗄️ **Estrutura do Banco de Dados**

### **Executar Scripts de Criação**

1. **Conectar como protocolo_user**
   ```sql
   CONNECT protocolo_user/NovoProtocolo2025!@localhost:1521/xe
   ```

2. **Executar Scripts SQL**
   ```bash
   # Localizar os scripts na pasta _dev/sql/
   # Executar na seguinte ordem:
   
   # 1. Criar tabelas principais
   @manual_create_tables.sql
   
   # 2. Inserir dados iniciais (se disponível)
   @insert_initial_data.sql
   ```

### **Tabelas Criadas**
- `USUARIOS` - Gestão de usuários do sistema
- `PROCESSOS` - Processos administrativos
- `DOCUMENTOS` - Documentos vinculados aos processos
- `TRAMITACAO` - Controle de tramitação entre setores
- `ENCOMENDAS` - Gestão de encomendas e pedidos
- `PRAZOS` - Controle de prazos e vencimentos
- `ARQUIVO` - Sistema de arquivamento digital

---

## 🔐 **Configuração de Segurança**

### **Configurações do Oracle**
```sql
-- Configurar políticas de senha (opcional)
ALTER PROFILE DEFAULT LIMIT PASSWORD_LIFE_TIME UNLIMITED;

-- Configurar auditoria (recomendado)
AUDIT ALL ON protocolo_user.usuarios;
AUDIT ALL ON protocolo_user.processos;
```

### **Configurações da Aplicação**
```env
# Gerar JWT Secret seguro
JWT_SECRET=$(openssl rand -base64 32)

# Configurar CORS (backend)
CORS_ORIGIN=http://localhost:5173

# Configurar rate limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🧪 **Testes e Validação**

### **Testar Frontend**
```bash
# Executar testes unitários
npm run test

# Executar testes E2E
npm run test:e2e

# Verificar cobertura
npm run test:coverage
```

### **Testar Backend**
```bash
# Testar conexão com Oracle
npm run test:db

# Testar APIs
npm run test:api

# Testar integração
npm run test:integration
```

### **Validação Manual**
1. **Testar CRUD de cada módulo**
2. **Verificar persistência de dados**
3. **Testar upload de arquivos**
4. **Validar filtros e buscas**
5. **Testar responsividade**

---

## 📁 **Estrutura do Projeto**

```
NovoProtocolo/V2/
├── docs/                          # Documentação
│   ├── PLANEJAMENTO_INICIAL_PROJETO.md
│   ├── STATUS_ATUAL_PROJETO.md
│   └── GUIA_INSTALACAO_CONFIGURACAO.md
├── src/                           # Código fonte do frontend
│   ├── components/                # Componentes React
│   ├── pages/                     # Páginas da aplicação
│   ├── lib/                       # Bibliotecas e utilitários
│   ├── hooks/                     # Custom hooks
│   └── types/                     # Definições TypeScript
├── backend/                       # Backend (quando implementado)
│   ├── src/                       # Código fonte do backend
│   ├── migrations/                # Scripts de migração
│   └── seeds/                     # Dados iniciais
├── _dev/                          # Arquivos de desenvolvimento
│   ├── scripts/                   # Scripts utilitários
│   ├── sql/                       # Scripts SQL
│   └── config/                    # Configurações
├── public/                        # Arquivos públicos
├── package.json                   # Dependências do projeto
├── .env                          # Variáveis de ambiente
└── README.md                     # Documentação básica
```

---

## 🚨 **Solução de Problemas Comuns**

### **Erro de Conexão Oracle**

**Erro: ORA-12541: TNS:no listener**
```bash
# Verificar se o Oracle está rodando
lsnrctl status

# Iniciar o listener se necessário
lsnrctl start
```

**Erro: ORA-01017: invalid username/password**
```sql
-- Verificar se o usuário existe
SELECT username FROM dba_users WHERE username = 'PROTOCOLO_USER';

-- Resetar senha se necessário
ALTER USER protocolo_user IDENTIFIED BY Anderline49;
```

**Erro: ORA-12514: TNS:listener does not currently know of service**
```bash
# Verificar serviços disponíveis
lsnrctl services

# Verificar se FREEPDB1 está listado
# Se não estiver, verificar se o PDB está aberto:
sqlplus / as sysdba
ALTER PLUGGABLE DATABASE FREEPDB1 OPEN;
```

### **Erro de Dependências Node.js**
```bash
# Limpar cache do npm
npm cache clean --force

# Deletar node_modules e reinstalar
rm -rf node_modules
npm install
```

### **Erro de Permissões Oracle**
```sql
-- Verificar permissões do usuário
SELECT * FROM user_sys_privs;
SELECT * FROM user_tab_privs;

-- Recriar usuário se necessário
DROP USER protocolo_user CASCADE;
-- Executar novamente os comandos de criação
```

### **Erro de Porta em Uso**
```bash
# Verificar processos usando a porta
netstat -ano | findstr :5173
netstat -ano | findstr :3001

# Matar processo se necessário
taskkill /PID [PID_NUMBER] /F
```

---

## 📞 **Suporte e Contato**

### **Documentação Adicional**
- **Roadmap Completo**: `docs/documentacao_sistema/roadmap.md`
- **APIs REST**: `docs/documentacao_sistema/apis-rest-documentation.md`
- **Funcionalidades Pendentes**: `docs/documentacao_sistema/funcionalidades-pendentes.md`

### **Logs e Debug**
```bash
# Logs do frontend (console do navegador)
F12 -> Console

# Logs do backend
tail -f logs/app.log

# Logs do Oracle
tail -f $ORACLE_HOME/diag/rdbms/xe/xe/trace/alert_xe.log
```

### **Comandos Úteis**
```bash
# Verificar versões instaladas
node --version
npm --version
git --version

# Verificar status do Oracle
sqlplus system/[senha]@localhost:1521/xe

# Backup do banco (quando em produção)
expdp protocolo_user/NovoProtocolo2025! directory=backup_dir dumpfile=protocolo_backup.dmp
```

---

## ✅ **Checklist de Instalação**

### **Pré-requisitos**
- [ ] Node.js 18+ instalado
- [ ] Git instalado
- [ ] Oracle 19c XE instalado
- [ ] Oracle Instant Client configurado
- [ ] VS Code instalado (recomendado)

### **Configuração Oracle**
- [ ] Oracle 19c rodando na porta 1521
- [ ] Usuário `protocolo_user` criado
- [ ] Permissões concedidas
- [ ] Conectividade testada

### **Instalação do Projeto**
- [ ] Repositório clonado/baixado
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` configurado
- [ ] Projeto rodando em `http://localhost:5173`

### **Validação**
- [ ] Login funcionando
- [ ] Navegação entre módulos OK
- [ ] CRUD de pelo menos um módulo testado
- [ ] Dados sendo salvos (localStorage)
- [ ] Interface responsiva

### **Backend (Quando Disponível)**
- [ ] Dependências do backend instaladas
- [ ] Banco de dados configurado
- [ ] Migrations executadas
- [ ] Backend rodando em `http://localhost:3001`
- [ ] APIs respondendo corretamente

---

## 🎉 **Próximos Passos**

Após a instalação bem-sucedida:

1. **Explorar o Sistema**: Navegue por todos os módulos
2. **Testar Funcionalidades**: Teste CRUD de cada módulo
3. **Personalizar**: Ajuste configurações conforme necessário
4. **Aguardar Backend**: Acompanhe o desenvolvimento das APIs
5. **Contribuir**: Reporte bugs ou sugestões de melhoria

---

*Guia criado em: Janeiro 2025*  
*Versão: 1.0*  
*Última atualização: Janeiro 2025*

**🚀 Bem-vindo ao NovoProtocolo V2!**