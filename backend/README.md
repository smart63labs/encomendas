# Sistema de Protocolo - Backend API

## 📋 Descrição

API REST para sistema de protocolo eletrônico desenvolvida em Node.js com TypeScript e Oracle Database. O sistema permite gerenciar processos administrativos, tramitações, usuários e anexos de forma digital e segura.

## 🚀 Funcionalidades

### 👥 Gestão de Usuários
- Autenticação JWT
- Perfis de acesso (Admin, Supervisor, Usuário)
- Gerenciamento de permissões
- Controle de sessões

### 📄 Gestão de Processos
- Criação e edição de processos
- Tramitação entre setores
- Controle de prazos
- Histórico completo
- Anexos de arquivos

### 🔒 Segurança
- Rate limiting
- Validação de dados
- Logs de auditoria
- Middleware de autenticação
- Criptografia de senhas

### 📊 Relatórios e Estatísticas
- Dashboard com métricas
- Relatórios por setor
- Processos em atraso
- Estatísticas de produtividade

## 🛠️ Tecnologias

- **Node.js** - Runtime JavaScript
- **TypeScript** - Linguagem tipada
- **Express.js** - Framework web
- **Oracle Database** - Banco de dados
- **JWT** - Autenticação
- **Bcrypt** - Criptografia de senhas
- **Express Validator** - Validação de dados
- **Rate Limiter Flexible** - Controle de taxa
- **Helmet** - Segurança HTTP
- **CORS** - Cross-Origin Resource Sharing
- **Morgan** - Logging HTTP

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Oracle Database 12c+
- Oracle Instant Client

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd NovoProtocolo/V2/backend
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o banco de dados

#### 3.1. Execute os scripts SQL

```sql
-- 1. Criar tabelas
@sql/01_create_tables.sql

-- 2. Inserir dados iniciais
@sql/02_insert_initial_data.sql
```

#### 3.2. Configure as variáveis de ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
# Ambiente
NODE_ENV=development
PORT=3001

# Banco de dados Oracle
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE_NAME=xe
DB_USER=sistema_protocolo
DB_PASSWORD=sua_senha_aqui
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_INCREMENT=1
DB_POOL_TIMEOUT=60

# JWT
JWT_SECRET=sua_chave_secreta_muito_forte_aqui
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Logs
LOG_LEVEL=info

# Upload de arquivos
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=pdf,doc,docx,jpg,jpeg,png

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_app
```

### 4. Execute o projeto

#### Desenvolvimento
```bash
npm run dev
```

#### Produção
```bash
npm run build
npm start
```

## 📚 Documentação da API

### Endpoints Principais

#### Autenticação
```http
POST /api/users/login
POST /api/users/logout
POST /api/users/refresh-token
```

#### Usuários
```http
GET    /api/users          # Listar usuários
POST   /api/users          # Criar usuário
GET    /api/users/:id      # Obter usuário
PUT    /api/users/:id      # Atualizar usuário
DELETE /api/users/:id      # Excluir usuário
GET    /api/users/profile  # Perfil do usuário logado
```

#### Processos
```http
GET    /api/processes           # Listar processos
POST   /api/processes           # Criar processo
GET    /api/processes/:id       # Obter processo
PUT    /api/processes/:id       # Atualizar processo
DELETE /api/processes/:id       # Excluir processo
POST   /api/processes/:id/forward # Tramitar processo
GET    /api/processes/:id/history # Histórico do processo
```

#### Utilitários
```http
GET /health                 # Health check
GET /docs                   # Documentação
GET /api/info              # Informações da API
```

### Autenticação

Todas as rotas (exceto login) requerem token JWT no header:

```http
Authorization: Bearer <seu_token_jwt>
```

### Exemplo de Uso

#### 1. Login
```bash
curl -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sistema.com",
    "password": "admin123"
  }'
```

#### 2. Listar Processos
```bash
curl -X GET http://localhost:3001/api/processes \
  -H "Authorization: Bearer <token>"
```

#### 3. Criar Processo
```bash
curl -X POST http://localhost:3001/api/processes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Novo Processo",
    "descricao": "Descrição do processo",
    "tipoProcesso": "Solicitação Geral",
    "prioridade": "NORMAL",
    "setorOrigem": "TI"
  }'
```

## 🗂️ Estrutura do Projeto

```
backend/
├── src/
│   ├── config/
│   │   └── database.config.ts     # Configuração do banco
│   ├── controllers/
│   │   ├── base.controller.ts     # Controller base
│   │   ├── user.controller.ts     # Controller de usuários
│   │   └── process.controller.ts  # Controller de processos
│   ├── middleware/
│   │   ├── auth.middleware.ts     # Autenticação
│   │   ├── validation.middleware.ts # Validação
│   │   ├── rateLimit.middleware.ts # Rate limiting
│   │   └── error.middleware.ts    # Tratamento de erros
│   ├── models/
│   │   ├── base.model.ts         # Model base
│   │   ├── user.model.ts         # Model de usuários
│   │   └── process.model.ts      # Model de processos
│   ├── routes/
│   │   ├── index.ts              # Rotas principais
│   │   ├── user.routes.ts        # Rotas de usuários
│   │   └── process.routes.ts     # Rotas de processos
│   ├── app.ts                    # Configuração do Express
│   └── server.ts                 # Servidor principal
├── sql/
│   ├── 01_create_tables.sql      # Criação de tabelas
│   └── 02_insert_initial_data.sql # Dados iniciais
├── logs/                         # Logs da aplicação
├── public/                       # Arquivos estáticos
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia em modo desenvolvimento
npm run dev:debug    # Inicia com debug

# Build
npm run build        # Compila TypeScript
npm run build:watch  # Compila em modo watch

# Produção
npm start           # Inicia em produção

# Testes
npm test            # Executa testes
npm run test:watch  # Testes em modo watch
npm run test:coverage # Cobertura de testes

# Linting
npm run lint        # Verifica código
npm run lint:fix    # Corrige problemas

# Banco de dados
npm run db:migrate  # Executa migrações
npm run db:seed     # Insere dados iniciais
```

## 🔐 Usuários Padrão

Após executar os scripts SQL, os seguintes usuários estarão disponíveis:

| Email | Senha | Perfil | Setor |
|-------|-------|-----------|-------|
| admin@sistema.com | admin123 | ADMIN | TI |
| joao.silva@sistema.com | admin123 | SUPERVISOR | Protocolo |
| maria.oliveira@sistema.com | admin123 | USER | RH |
| carlos.lima@sistema.com | admin123 | USER | Financeiro |
| ana.ferreira@sistema.com | admin123 | USER | Jurídico |
| pedro.souza@sistema.com | admin123 | USER | TI |

⚠️ **IMPORTANTE**: Altere as senhas padrão antes de usar em produção!

## 📊 Monitoramento

### Health Check
```bash
curl http://localhost:3001/health
```

### Logs
Os logs são salvos em:
- `logs/access.log` - Logs de acesso
- `logs/error.log` - Logs de erro
- Console (desenvolvimento)

## 🚀 Deploy

### Variáveis de Ambiente de Produção

```env
NODE_ENV=production
PORT=3001

# Configurações mais restritivas
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50

# JWT com chaves mais fortes
JWT_SECRET=chave_muito_forte_e_aleatoria_para_producao

# CORS restritivo
ALLOWED_ORIGINS=https://seudominio.com
```

### Docker (Opcional)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 3001

CMD ["npm", "start"]
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte técnico:
- Email: suporte@sistema.com
- Documentação: http://localhost:3001/docs
- Health Check: http://localhost:3001/health

## 🔄 Changelog

### v1.0.0 (2024)
- ✅ Sistema de autenticação JWT
- ✅ CRUD completo de usuários e processos
- ✅ Sistema de tramitação
- ✅ Rate limiting e segurança
- ✅ Logs de auditoria
- ✅ Documentação completa

---

**Desenvolvido com ❤️ para modernizar a gestão de protocolos**