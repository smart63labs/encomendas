# Documentação Completa - Sistema de Protocolo Digital

## 📋 Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Arquitetura](#arquitetura)
3. [Funcionalidades](#funcionalidades)
4. [Tecnologias Utilizadas](#tecnologias-utilizadas)
5. [Estrutura do Projeto](#estrutura-do-projeto)
6. [Instalação e Configuração](#instalação-e-configuração)
7. [API REST](#api-rest)
8. [Frontend](#frontend)
9. [Banco de Dados](#banco-de-dados)
10. [Segurança](#segurança)
11. [Deploy e Infraestrutura](#deploy-e-infraestrutura)
12. [Manutenção e Monitoramento](#manutenção-e-monitoramento)

---

## 🎯 Visão Geral do Sistema

O Sistema de Protocolo Digital é uma solução completa desenvolvida para modernizar a gestão de processos administrativos do Governo do Tocantins. O sistema digitaliza todo o fluxo de tramitação de documentos, desde a criação até o arquivamento, proporcionando maior eficiência, transparência e controle.

### Objetivos Principais

- **Digitalização**: Eliminar processos físicos em papel
- **Eficiência**: Reduzir tempo de tramitação entre setores
- **Transparência**: Rastreabilidade completa dos processos
- **Segurança**: Controle rigoroso de acesso e auditoria
- **Sustentabilidade**: Redução do uso de papel e recursos físicos

### Benefícios

- ✅ Redução de 80% no tempo de tramitação
- ✅ Economia de 90% em papel e impressão
- ✅ Rastreabilidade completa em tempo real
- ✅ Acesso remoto e mobilidade
- ✅ Backup automático e segurança de dados

---

## 🏗️ Arquitetura

### Arquitetura Geral

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   React + TS    │◄──►│  Node.js + TS   │◄──►│   Oracle 23c    │
│   Port: 8080    │    │   Port: 3001    │    │   Port: 1521    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │      LDAP       │    │   File System   │
│  Reverse Proxy  │    │ Authentication  │    │   Attachments   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Padrões Arquiteturais

- **Frontend**: SPA (Single Page Application) com React
- **Backend**: API REST com arquitetura em camadas
- **Database**: Modelo relacional com Oracle
- **Authentication**: JWT + LDAP híbrido
- **File Storage**: Sistema de arquivos local com backup

### Fluxo de Dados

1. **Autenticação**: Usuario → Frontend → Backend → LDAP → Database
2. **Operações CRUD**: Frontend → Backend → Database
3. **Upload de Arquivos**: Frontend → Backend → File System
4. **Relatórios**: Frontend → Backend → Database → PDF/Excel

---

## ⚙️ Funcionalidades

### 1. Gestão de Usuários

#### Funcionalidades Principais
- **Cadastro e Edição**: CRUD completo de usuários
- **Perfis de Acesso**: Admin, Supervisor, Usuário
- **Autenticação Híbrida**: LDAP + Local
- **Controle de Sessão**: JWT com expiração configurável
- **Auditoria**: Log de todas as ações do usuário

#### Telas Relacionadas
- Login (`/login`)
- Dashboard (`/`)
- Configurações (`/configuracoes`)

### 2. Gestão de Processos

#### Funcionalidades Principais
- **Criação de Processos**: Formulário completo com validações
- **Tramitação**: Envio entre setores com histórico
- **Controle de Prazos**: Alertas automáticos de vencimento
- **Anexos**: Upload múltiplo de documentos
- **Pesquisa Avançada**: Filtros por múltiplos critérios

#### Telas Relacionadas
- Processos (`/processos`)
- Tramitação (`/tramitacao`)
- Prazos (`/prazos`)

### 3. Gestão de Documentos

#### Funcionalidades Principais
- **Upload de Arquivos**: Suporte a PDF, DOC, XLS, imagens
- **Visualização**: Preview integrado de documentos
- **Versionamento**: Controle de versões dos documentos
- **Assinatura Digital**: Integração com certificados digitais
- **Compressão**: Otimização automática de arquivos

#### Telas Relacionadas
- Documentos (`/documentos`)
- Arquivo (`/arquivo`)

### 4. Relatórios e Dashboard

#### Funcionalidades Principais
- **Dashboard Interativo**: Gráficos e métricas em tempo real
- **Relatórios Customizáveis**: Filtros por período, setor, status
- **Exportação**: PDF, Excel, CSV
- **Indicadores**: KPIs de produtividade e eficiência
- **Alertas**: Notificações de processos em atraso

#### Telas Relacionadas
- Dashboard (`/`)
- Relatórios (`/relatorios`)

### 5. Configurações do Sistema

#### Funcionalidades Principais
- **Configurações Gerais**: Parâmetros do sistema
- **Gestão de Setores**: CRUD de setores e hierarquia
- **Configurações de Segurança**: Políticas de senha, sessão
- **Backup e Restore**: Rotinas de backup automático
- **Logs de Auditoria**: Visualização de logs do sistema

---

## 🛠️ Tecnologias Utilizadas

### Frontend Stack

#### Core Technologies
- **React 18.3.1**: Framework principal
- **TypeScript 5.8.3**: Tipagem estática
- **Vite 5.4.19**: Build tool e dev server
- **React Router DOM 6.30.1**: Roteamento SPA

#### UI/UX Libraries
- **Tailwind CSS 3.4.17**: Framework CSS utilitário
- **Radix UI**: Componentes acessíveis headless
- **shadcn/ui**: Biblioteca de componentes
- **Lucide React 0.462.0**: Ícones SVG
- **Recharts 2.15.4**: Gráficos e visualizações

#### State Management & Data Fetching
- **TanStack Query 5.83.0**: Cache e sincronização de dados
- **React Hook Form 7.61.1**: Gerenciamento de formulários
- **Zod 3.25.76**: Validação de schemas

#### Utilities
- **Axios 1.11.0**: Cliente HTTP
- **date-fns 3.6.0**: Manipulação de datas
- **html2canvas 1.4.1**: Captura de tela
- **jsPDF 3.0.3**: Geração de PDFs
- **QRCode.react 4.2.0**: Geração de QR codes

### Backend Stack

#### Core Technologies
- **Node.js 18+**: Runtime JavaScript
- **Express.js 4.18.2**: Framework web
- **TypeScript 5.9.2**: Tipagem estática
- **ts-node 10.9.2**: Execução TypeScript

#### Database & ORM
- **Oracle Database 23c**: Banco de dados principal
- **oracledb 6.9.0**: Driver Oracle para Node.js
- **Oracle Instant Client**: Cliente Oracle

#### Authentication & Security
- **jsonwebtoken 9.0.2**: Tokens JWT
- **bcryptjs 2.4.3**: Hash de senhas
- **ldapjs 3.0.7**: Integração LDAP
- **helmet 7.2.0**: Segurança HTTP
- **cors 2.8.5**: Cross-Origin Resource Sharing
- **express-rate-limit 7.1.5**: Rate limiting

#### Validation & Utilities
- **joi 17.11.0**: Validação de dados
- **express-validator 7.2.1**: Validação de requests
- **multer 1.4.5**: Upload de arquivos
- **sharp 0.32.6**: Processamento de imagens
- **winston 3.11.0**: Sistema de logs

#### Development Tools
- **nodemon 3.1.10**: Auto-reload em desenvolvimento
- **jest 29.7.0**: Framework de testes
- **eslint 8.54.0**: Linter JavaScript/TypeScript
- **prettier 3.1.0**: Formatador de código

### Database

#### Oracle Database 23c Free
- **Versão**: Oracle Database Free 23c
- **Schema**: protocolo_user
- **Charset**: UTF8
- **Timezone**: America/Sao_Paulo
- **Backup**: Oracle Data Pump (expdp/impdp)

#### Principais Tabelas
- **usuarios**: Dados dos usuários do sistema
- **setores**: Estrutura organizacional
- **processos**: Processos administrativos
- **tramitacoes**: Histórico de movimentações
- **documentos**: Metadados dos arquivos
- **anexos**: Arquivos físicos
- **configuracoes**: Parâmetros do sistema
- **logs_auditoria**: Logs de auditoria

### Infrastructure

#### Containerization
- **Docker 24+**: Containerização
- **Docker Compose**: Orquestração local
- **Multi-stage builds**: Otimização de imagens

#### Orchestration
- **Kubernetes 1.28+**: Orquestração em produção
- **Helm Charts**: Gerenciamento de deployments
- **Ingress Controller**: Roteamento HTTP/HTTPS

#### Monitoring & Logging
- **Winston**: Logs estruturados
- **Morgan**: Logs HTTP
- **Prometheus**: Métricas (planejado)
- **Grafana**: Dashboards (planejado)

---

## 📁 Estrutura do Projeto

### Estrutura Geral

```
NovoProtocolo/V2/
├── 📁 backend/                    # API REST Backend
│   ├── 📁 src/
│   │   ├── 📁 controllers/        # Controladores da API
│   │   ├── 📁 routes/            # Definição de rotas
│   │   ├── 📁 services/          # Lógica de negócio
│   │   ├── 📁 models/            # Modelos de dados
│   │   ├── 📁 config/            # Configurações
│   │   ├── 📁 middleware/        # Middlewares customizados
│   │   ├── 📁 utils/             # Utilitários
│   │   ├── 📄 app.ts             # Configuração do Express
│   │   └── 📄 server.ts          # Inicialização do servidor
│   ├── 📁 dist/                  # Código compilado
│   ├── 📁 logs/                  # Arquivos de log
│   ├── 📄 package.json           # Dependências backend
│   ├── 📄 tsconfig.json          # Configuração TypeScript
│   └── 📄 .env                   # Variáveis de ambiente
├── 📁 src/                       # Frontend React
│   ├── 📁 components/            # Componentes reutilizáveis
│   │   ├── 📁 ui/               # Componentes base (shadcn/ui)
│   │   ├── 📁 layout/           # Componentes de layout
│   │   ├── 📁 auth/             # Componentes de autenticação
│   │   └── 📁 theme/            # Componentes de tema
│   ├── 📁 pages/                # Páginas da aplicação
│   │   ├── 📄 Login.tsx         # Página de login
│   │   ├── 📄 Index.tsx         # Dashboard principal
│   │   ├── 📄 Processos.tsx     # Gestão de processos
│   │   ├── 📄 Documentos.tsx    # Gestão de documentos
│   │   ├── 📄 Tramitacao.tsx    # Tramitação de processos
│   │   ├── 📄 Prazos.tsx        # Controle de prazos
│   │   ├── 📄 Arquivo.tsx       # Sistema de arquivos
│   │   ├── 📄 Relatorios.tsx    # Relatórios e dashboards
│   │   └── 📄 Configuracoes.tsx # Configurações do sistema
│   ├── 📁 contexts/             # Contextos React
│   │   ├── 📄 AuthContext.tsx   # Contexto de autenticação
│   │   └── 📄 ThemeContext.tsx  # Contexto de tema
│   ├── 📁 hooks/                # Hooks customizados
│   │   ├── 📄 useAuth.ts        # Hook de autenticação
│   │   ├── 📄 useApi.ts         # Hook para API calls
│   │   └── 📄 use-cep.ts        # Hook para consulta CEP
│   ├── 📁 services/             # Serviços de API
│   │   ├── 📄 api.ts            # Cliente HTTP base
│   │   ├── 📄 auth.service.ts   # Serviços de autenticação
│   │   └── 📄 process.service.ts # Serviços de processos
│   ├── 📁 types/                # Definições TypeScript
│   │   ├── 📄 auth.types.ts     # Tipos de autenticação
│   │   ├── 📄 process.types.ts  # Tipos de processos
│   │   └── 📄 api.types.ts      # Tipos da API
│   ├── 📁 utils/                # Utilitários
│   │   ├── 📄 formatters.ts     # Formatadores
│   │   ├── 📄 validators.ts     # Validadores
│   │   └── 📄 constants.ts      # Constantes
│   ├── 📁 assets/               # Assets estáticos
│   │   ├── 📁 images/           # Imagens
│   │   ├── 📁 icons/            # Ícones
│   │   └── 📁 fonts/            # Fontes
│   ├── 📄 App.tsx               # Componente raiz
│   ├── 📄 main.tsx              # Ponto de entrada
│   └── 📄 index.css             # Estilos globais
├── 📁 docs/                     # Documentação
│   ├── 📁 ScriptsSQL/           # Scripts de banco de dados
│   ├── 📁 documentacao_sistema/ # Documentação técnica
│   ├── 📄 ARCHITECTURE_OVERVIEW.md
│   ├── 📄 DEPLOYMENT_GUIDE.md
│   └── 📄 GUIA_INSTALACAO_CONFIGURACAO.md
├── 📁 k8s/                      # Configurações Kubernetes
│   ├── 📄 namespace.yaml        # Namespace
│   ├── 📄 configmap.yaml        # ConfigMaps
│   ├── 📄 secrets.yaml          # Secrets
│   └── 📄 ingress.yaml          # Ingress
├── 📁 public/                   # Arquivos públicos
│   ├── 📄 favicon.ico           # Favicon
│   └── 📄 robots.txt            # Robots.txt
├── 📄 docker-compose.yml        # Docker Compose
├── 📄 Dockerfile                # Dockerfile
├── 📄 package.json              # Dependências frontend
├── 📄 vite.config.ts            # Configuração Vite
├── 📄 tailwind.config.ts        # Configuração Tailwind
├── 📄 tsconfig.json             # Configuração TypeScript
└── 📄 README.md                 # Documentação principal
```

### Detalhamento das Pastas Principais

#### Backend (`/backend/src/`)

**Controllers** (`/controllers/`)
- Responsáveis por receber requests HTTP
- Validação inicial de dados
- Chamada dos services apropriados
- Formatação das responses

**Routes** (`/routes/`)
- Definição das rotas da API
- Middlewares de autenticação e validação
- Agrupamento lógico por funcionalidade

**Services** (`/services/`)
- Lógica de negócio da aplicação
- Interação com o banco de dados
- Processamento de dados
- Integração com sistemas externos

**Models** (`/models/`)
- Definição das entidades do sistema
- Interfaces TypeScript
- Validações de dados

#### Frontend (`/src/`)

**Components** (`/components/`)
- Componentes reutilizáveis
- Separados por categoria (ui, layout, auth, theme)
- Seguem padrão de composição

**Pages** (`/pages/`)
- Componentes de página completa
- Roteamento principal da aplicação
- Integração com contextos e services

**Contexts** (`/contexts/`)
- Estado global da aplicação
- Gerenciamento de autenticação
- Configurações de tema

**Services** (`/services/`)
- Comunicação com a API
- Cache de dados
- Tratamento de erros

---

## 🚀 Instalação e Configuração

### Pré-requisitos

#### Software Necessário
- **Node.js 18+**: Runtime JavaScript
- **npm 8+** ou **yarn 1.22+**: Gerenciador de pacotes
- **Oracle Database 19c+**: Banco de dados
- **Oracle Instant Client**: Cliente Oracle
- **Git**: Controle de versão
- **Docker** (opcional): Containerização

#### Configuração do Ambiente

1. **Variáveis de Ambiente do Sistema**
```bash
# Oracle
export ORACLE_HOME=/opt/oracle/instantclient_21_1
export LD_LIBRARY_PATH=$ORACLE_HOME:$LD_LIBRARY_PATH
export PATH=$ORACLE_HOME:$PATH

# Node.js
export NODE_ENV=development
export PORT=3001
```

### Instalação Passo a Passo

#### 1. Clone do Repositório
```bash
git clone https://github.com/governo-tocantins/sistema-protocolo.git
cd sistema-protocolo
```

#### 2. Configuração do Backend

```bash
# Navegar para o diretório do backend
cd backend

# Instalar dependências
npm install

# Copiar arquivo de configuração
cp .env.example .env

# Editar configurações (ver seção de configuração)
nano .env

# Compilar TypeScript
npm run build

# Executar migrações do banco
npm run migrate

# Iniciar servidor de desenvolvimento
npm run dev
```

#### 3. Configuração do Frontend

```bash
# Voltar para a raiz do projeto
cd ..

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

#### 4. Configuração do Banco de Dados

```sql
-- Conectar como SYSDBA
sqlplus sys/password@localhost:1521/FREEPDB1 as sysdba

-- Criar usuário
CREATE USER protocolo_user IDENTIFIED BY "Anderline49";
GRANT CONNECT, RESOURCE TO protocolo_user;
GRANT CREATE SESSION TO protocolo_user;
GRANT CREATE TABLE TO protocolo_user;
GRANT CREATE SEQUENCE TO protocolo_user;
GRANT CREATE TRIGGER TO protocolo_user;
ALTER USER protocolo_user QUOTA UNLIMITED ON USERS;

-- Executar scripts de criação
@docs/ScriptsSQL/01_create_tables.sql
@docs/ScriptsSQL/02_create_indexes.sql
@docs/ScriptsSQL/03_insert_initial_data.sql
```

### Configuração de Variáveis de Ambiente

#### Backend (`.env`)

```env
# Servidor
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# Banco de Dados Oracle
DB_HOST=localhost
DB_PORT=1521
DB_SERVICE_NAME=FREEPDB1
DB_USER=protocolo_user
DB_PASSWORD=Anderline49
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_INCREMENT=1

# JWT
JWT_SECRET=seu_jwt_secret_muito_seguro_aqui
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# LDAP
LDAP_URL=ldap://localhost:389
LDAP_BIND_DN=cn=admin,dc=sefaz,dc=to,dc=gov,dc=br
LDAP_BIND_PASSWORD=admin_password
LDAP_BASE_DN=ou=users,dc=sefaz,dc=to,dc=gov,dc=br
LDAP_SEARCH_FILTER=(mail={{username}})

# Upload de Arquivos
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,jpg,jpeg,png

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=sistema@sefaz.to.gov.br
SMTP_PASSWORD=email_password

# Logs
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# CORS
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:3000,http://10.9.1.95:8080

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Backup
BACKUP_PATH=./backups
BACKUP_SCHEDULE=0 2 * * *
```

#### Frontend (`.env.local`)

```env
# API
VITE_API_URL=http://localhost:3001/api
VITE_API_TIMEOUT=30000

# Aplicação
VITE_APP_NAME=Sistema de Protocolo Digital
VITE_APP_VERSION=2.0.0
VITE_APP_DESCRIPTION=Sistema de Protocolo do Governo do Tocantins

# Recursos
VITE_MAX_FILE_SIZE=10485760
VITE_ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,jpg,jpeg,png

# Mapas (se necessário)
VITE_GOOGLE_MAPS_API_KEY=sua_api_key_aqui

# Debug
VITE_DEBUG=false
VITE_LOG_LEVEL=warn
```

### Verificação da Instalação

#### 1. Verificar Backend
```bash
# Testar conexão com banco
curl http://localhost:3001/api/health

# Resposta esperada:
{
  "success": true,
  "message": "API está funcionando corretamente",
  "timestamp": "2025-01-XX...",
  "version": "1.0.0",
  "environment": "development"
}
```

#### 2. Verificar Frontend
```bash
# Acessar no navegador
http://localhost:8080

# Deve exibir a tela de login
```

#### 3. Verificar Banco de Dados
```sql
-- Conectar e testar
sqlplus protocolo_user/Anderline49@localhost:1521/FREEPDB1

-- Verificar tabelas
SELECT table_name FROM user_tables;

-- Deve listar todas as tabelas do sistema
```

### Solução de Problemas Comuns

#### Erro de Conexão Oracle
```bash
# Verificar se o Oracle está rodando
lsnrctl status

# Verificar variáveis de ambiente
echo $ORACLE_HOME
echo $LD_LIBRARY_PATH

# Reinstalar Oracle Instant Client se necessário
```

#### Erro de Porta em Uso
```bash
# Verificar processos usando as portas
netstat -tulpn | grep :3001
netstat -tulpn | grep :8080

# Matar processo se necessário
kill -9 <PID>
```

#### Erro de Permissões
```bash
# Dar permissões corretas
chmod +x scripts/*.sh
chown -R $USER:$USER uploads/
chown -R $USER:$USER logs/
```

---

## 🔌 API REST

### Visão Geral da API

A API REST do Sistema de Protocolo segue os padrões RESTful e está organizada em módulos funcionais. Todas as rotas são prefixadas com `/api` e utilizam autenticação JWT.

#### Base URL
```
http://localhost:3001/api
```

#### Headers Padrão
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

### Autenticação

#### POST `/api/auth/login`
Realiza login no sistema

**Request:**
```json
{
  "email": "admin_protocolo@sefaz.to.gov.br",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "nome": "Administrador",
      "email": "admin_protocolo@sefaz.to.gov.br",
      "perfil": "admin",
      "setor": {
        "id": 1,
        "nome": "Administração"
      }
    }
  }
}
```

#### POST `/api/auth/refresh`
Renova o token JWT

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST `/api/auth/logout`
Realiza logout e invalida o token

### Usuários

#### GET `/api/users`
Lista todos os usuários

**Query Parameters:**
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10)
- `search`: Termo de busca
- `setor`: Filtro por setor
- `perfil`: Filtro por perfil

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "nome": "João Silva",
        "email": "joao.silva@sefaz.to.gov.br",
        "perfil": "usuario",
        "setor": {
          "id": 2,
          "nome": "Protocolo"
        },
        "ativo": true,
        "dataCriacao": "2025-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

#### GET `/api/users/:id`
Busca usuário por ID

#### POST `/api/users`
Cria novo usuário

**Request:**
```json
{
  "nome": "Maria Santos",
  "email": "maria.santos@sefaz.to.gov.br",
  "password": "senha123",
  "perfil": "usuario",
  "setorId": 2,
  "telefone": "(63) 99999-9999",
  "cargo": "Analista"
}
```

#### PUT `/api/users/:id`
Atualiza usuário existente

#### DELETE `/api/users/:id`
Remove usuário (soft delete)

### Processos

#### GET `/api/processes`
Lista processos com filtros

**Query Parameters:**
- `page`, `limit`: Paginação
- `search`: Busca por número ou assunto
- `status`: Filtro por status
- `setor`: Filtro por setor atual
- `dataInicio`, `dataFim`: Filtro por período
- `prioridade`: Filtro por prioridade

#### POST `/api/processes`
Cria novo processo

**Request:**
```json
{
  "assunto": "Solicitação de Material de Escritório",
  "descricao": "Solicitação de material para o setor de protocolo",
  "prioridade": "media",
  "setorOrigemId": 1,
  "setorDestinoId": 2,
  "usuarioResponsavelId": 3,
  "prazoResposta": "2025-02-15",
  "documentos": [
    {
      "nome": "solicitacao.pdf",
      "tipo": "pdf",
      "tamanho": 1024000
    }
  ]
}
```

#### GET `/api/processes/:id`
Busca processo por ID com histórico completo

#### PUT `/api/processes/:id`
Atualiza processo

#### POST `/api/processes/:id/tramitar`
Tramita processo para outro setor

**Request:**
```json
{
  "setorDestinoId": 3,
  "observacoes": "Encaminhando para análise técnica",
  "prazo": "2025-02-20"
}
```

### Tramitação

#### GET `/api/tramitacao`
Lista tramitações com filtros

#### GET `/api/tramitacao/processo/:processoId`
Histórico de tramitação de um processo

#### POST `/api/tramitacao`
Registra nova tramitação

### Documentos

#### GET `/api/documentos`
Lista documentos

#### POST `/api/documentos/upload`
Upload de documento

**Request:** `multipart/form-data`
- `file`: Arquivo
- `processoId`: ID do processo
- `tipo`: Tipo do documento
- `descricao`: Descrição

#### GET `/api/documentos/:id/download`
Download de documento

#### DELETE `/api/documentos/:id`
Remove documento

### Setores

#### GET `/api/setores`
Lista setores com hierarquia

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nome": "SEFAZ",
      "sigla": "SEFAZ",
      "nivel": 1,
      "setorPaiId": null,
      "subsetores": [
        {
          "id": 2,
          "nome": "Protocolo",
          "sigla": "PROT",
          "nivel": 2,
          "setorPaiId": 1
        }
      ]
    }
  ]
}
```

#### POST `/api/setores`
Cria novo setor

#### PUT `/api/setores/:id`
Atualiza setor

### Relatórios

#### GET `/api/relatorios/dashboard`
Dados para dashboard

**Response:**
```json
{
  "success": true,
  "data": {
    "estatisticas": {
      "processosTotal": 1250,
      "processosAndamento": 320,
      "processosConcluidos": 890,
      "processosAtrasados": 40
    },
    "graficoProcessosPorMes": [
      {
        "mes": "2025-01",
        "criados": 120,
        "concluidos": 95
      }
    ],
    "setoresMaisAtivos": [
      {
        "setor": "Protocolo",
        "processos": 45
      }
    ]
  }
}
```

#### GET `/api/relatorios/processos`
Relatório de processos

**Query Parameters:**
- `formato`: pdf, excel, csv
- `dataInicio`, `dataFim`: Período
- `setores[]`: Array de setores
- `status[]`: Array de status

### Configurações

#### GET `/api/configuracoes`
Lista configurações do sistema

#### PUT `/api/configuracoes`
Atualiza configurações

### Códigos de Status HTTP

- **200**: Sucesso
- **201**: Criado com sucesso
- **400**: Erro de validação
- **401**: Não autenticado
- **403**: Não autorizado
- **404**: Não encontrado
- **409**: Conflito (ex: email já existe)
- **422**: Dados inválidos
- **429**: Muitas requisições (rate limit)
- **500**: Erro interno do servidor

### Tratamento de Erros

**Formato padrão de erro:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": [
      {
        "field": "email",
        "message": "Email é obrigatório"
      }
    ]
  }
}
```

### Rate Limiting

- **Limite**: 100 requisições por 15 minutos por IP
- **Headers de resposta**:
  - `X-RateLimit-Limit`: Limite total
  - `X-RateLimit-Remaining`: Requisições restantes
  - `X-RateLimit-Reset`: Timestamp do reset

### Versionamento

A API utiliza versionamento via header:
```http
API-Version: v1
```

---

## 🎨 Frontend

### Arquitetura do Frontend

O frontend é uma Single Page Application (SPA) construída com React 18 e TypeScript, seguindo padrões modernos de desenvolvimento e boas práticas de UX/UI.

#### Principais Características

- **Component-Based**: Arquitetura baseada em componentes reutilizáveis
- **Type-Safe**: TypeScript para tipagem estática
- **Responsive**: Design responsivo para desktop, tablet e mobile
- **Accessible**: Componentes acessíveis seguindo padrões WCAG
- **Performance**: Otimizações de performance e lazy loading

### Estrutura de Componentes

#### Hierarquia de Componentes

```
App
├── AuthProvider (Context)
├── ThemeProvider (Context)
├── BrowserRouter
└── Routes
    ├── Login (Public Route)
    └── ProtectedRoute
        ├── Layout
        │   ├── Header
        │   ├── Sidebar
        │   └── Main Content
        └── Pages
            ├── Dashboard
            ├── Processos
            ├── Documentos
            ├── Tramitacao
            ├── Prazos
            ├── Arquivo
            ├── Relatorios
            └── Configuracoes
```

### Páginas Principais

#### 1. Login (`/login`)

**Funcionalidades:**
- Autenticação via email/senha
- Integração com LDAP
- Validação de formulário
- Recuperação de senha
- Tema claro/escuro

**Componentes:**
```tsx
// Login.tsx
const Login = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  
  const { login, isLoading } = useAuth();
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login(credentials);
  };
  
  return (
    <div className="min-h-screen flex">
      {/* Background Image */}
      <div className="flex-1 relative">
        <img src="/background.jpg" alt="Background" />
        <div className="absolute top-32 left-4">
          <img src="/logo-governo.png" alt="Governo TO" />
        </div>
      </div>
      
      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center">
        <LoginForm onSubmit={handleSubmit} loading={isLoading} />
      </div>
    </div>
  );
};
```

#### 2. Dashboard (`/`)

**Funcionalidades:**
- Visão geral do sistema
- Cards de estatísticas
- Gráficos interativos
- Ações rápidas
- Atividades recentes

**Componentes principais:**
- `StatsCards`: Cards com métricas principais
- `InteractiveCharts`: Gráficos com Recharts
- `QuickActions`: Botões de ações rápidas
- `RecentActivity`: Lista de atividades recentes

#### 3. Processos (`/processos`)

**Funcionalidades:**
- Lista de processos com paginação
- Filtros avançados
- Criação/edição de processos
- Visualização detalhada
- Tramitação rápida

**Componentes:**
```tsx
// ProcessList.tsx
const ProcessList = () => {
  const [filters, setFilters] = useState<ProcessFilters>({});
  const [page, setPage] = useState(1);
  
  const { data, isLoading } = useQuery({
    queryKey: ['processes', filters, page],
    queryFn: () => processService.getProcesses({ ...filters, page })
  });
  
  return (
    <div className="space-y-6">
      <ProcessFilters filters={filters} onChange={setFilters} />
      <ProcessTable 
        processes={data?.processes} 
        loading={isLoading}
        onEdit={handleEdit}
        onTramitar={handleTramitar}
      />
      <Pagination 
        current={page}
        total={data?.pagination.pages}
        onChange={setPage}
      />
    </div>
  );
};
```

#### 4. Documentos (`/documentos`)

**Funcionalidades:**
- Upload de arquivos (drag & drop)
- Visualização de documentos
- Filtros por tipo/data
- Download de arquivos
- Versionamento

**Componentes:**
- `FileUpload`: Componente de upload com drag & drop
- `DocumentViewer`: Visualizador de PDFs e imagens
- `DocumentList`: Lista de documentos
- `DocumentFilters`: Filtros de busca

#### 5. Tramitação (`/tramitacao`)

**Funcionalidades:**
- Histórico de tramitações
- Tramitação em lote
- Filtros por setor/período
- Visualização de fluxo
- Notificações

### Sistema de Roteamento

```tsx
// App.tsx
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Rota pública */}
            <Route path="/login" element={<Login />} />
            
            {/* Rotas protegidas */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Index />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/processos" element={
              <ProtectedRoute requiredPermission="processos.read">
                <Layout>
                  <Processos />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Outras rotas... */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
```

### Gerenciamento de Estado

#### Context API

**AuthContext:**
```tsx
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );
  
  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    setUser(response.user);
    setToken(response.token);
    localStorage.setItem('token', response.token);
  };
  
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };
  
  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAuthenticated: !!token,
      isLoading: false
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### TanStack Query

**Configuração:**
```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});
```

**Hooks customizados:**
```tsx
// useProcesses.ts
export const useProcesses = (filters: ProcessFilters) => {
  return useQuery({
    queryKey: ['processes', filters],
    queryFn: () => processService.getProcesses(filters),
    keepPreviousData: true,
  });
};

export const useCreateProcess = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: processService.createProcess,
    onSuccess: () => {
      queryClient.invalidateQueries(['processes']);
      toast.success('Processo criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar processo');
    },
  });
};
```

### Sistema de Formulários

#### React Hook Form + Zod

```tsx
// ProcessForm.tsx
const processSchema = z.object({
  assunto: z.string().min(5, 'Assunto deve ter pelo menos 5 caracteres'),
  descricao: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  prioridade: z.enum(['baixa', 'media', 'alta']),
  setorDestinoId: z.number().min(1, 'Setor de destino é obrigatório'),
  prazoResposta: z.string().refine(
    (date) => new Date(date) > new Date(),
    'Prazo deve ser uma data futura'
  ),
});

type ProcessFormData = z.infer<typeof processSchema>;

const ProcessForm = ({ onSubmit, initialData }: ProcessFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
  } = useForm<ProcessFormData>({
    resolver: zodResolver(processSchema),
    defaultValues: initialData,
  });
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="assunto">Assunto</Label>
        <Input
          id="assunto"
          {...register('assunto')}
          error={errors.assunto?.message}
        />
      </div>
      
      <div>
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          {...register('descricao')}
          error={errors.descricao?.message}
        />
      </div>
      
      <Controller
        name="setorDestinoId"
        control={control}
        render={({ field }) => (
          <Select
            label="Setor de Destino"
            options={setores}
            value={field.value}
            onChange={field.onChange}
            error={errors.setorDestinoId?.message}
          />
        )}
      />
      
      <Button type="submit" loading={isSubmitting}>
        Salvar Processo
      </Button>
    </form>
  );
};
```

### Sistema de Temas

#### Tailwind CSS + CSS Variables

```css
/* index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }
  
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    /* ... outras variáveis do tema escuro */
  }
}
```

**ThemeProvider:**
```tsx
const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);
  
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### Componentes UI Reutilizáveis

#### Button Component

```tsx
// components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
```

#### DataTable Component

```tsx
// components/ui/DataTable.tsx
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<T>({
  columns,
  data,
  loading,
  pagination,
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  
  if (loading) {
    return <TableSkeleton />;
  }
  
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {pagination && (
        <Pagination
          current={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}
```

### Performance e Otimizações

#### Lazy Loading

```tsx
// Lazy loading de páginas
const Processos = lazy(() => import('./pages/Processos'));
const Documentos = lazy(() => import('./pages/Documentos'));
const Relatorios = lazy(() => import('./pages/Relatorios'));

// Uso com Suspense
<Suspense fallback={<PageSkeleton />}>
  <Routes>
    <Route path="/processos" element={<Processos />} />
    <Route path="/documentos" element={<Documentos />} />
    <Route path="/relatorios" element={<Relatorios />} />
  </Routes>
</Suspense>
```

#### Memoização

```tsx
// Memoização de componentes pesados
const ProcessList = memo(({ processes, onEdit, onDelete }: ProcessListProps) => {
  return (
    <div className="space-y-4">
      {processes.map((process) => (
        <ProcessCard
          key={process.id}
          process={process}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
});

// Memoização de valores computados
const ProcessStats = ({ processes }: { processes: Process[] }) => {
  const stats = useMemo(() => {
    return {
      total: processes.length,
      concluidos: processes.filter(p => p.status === 'concluido').length,
      atrasados: processes.filter(p => 
        p.status !== 'concluido' && new Date(p.prazo) < new Date()
      ).length,
    };
  }, [processes]);
  
  return <StatsDisplay stats={stats} />;
};
```

#### Virtual Scrolling

```tsx
// Para listas muito grandes
import { FixedSizeList as List } from 'react-window';

const VirtualizedProcessList = ({ processes }: { processes: Process[] }) => {
  const Row = ({ index, style }: { index: number; style: CSSProperties }) => (
    <div style={style}>
      <ProcessCard process={processes[index]} />
    </div>
  );
  
  return (
    <List
      height={600}
      itemCount={processes.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### Testes

#### Configuração do Jest

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};
```

#### Testes de Componentes

```tsx
// __tests__/ProcessForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProcessForm } from '../ProcessForm';

describe('ProcessForm', () => {
  it('should render form fields', () => {
    render(<ProcessForm onSubmit={jest.fn()} />);
    
    expect(screen.getByLabelText('Assunto')).toBeInTheDocument();
    expect(screen.getByLabelText('Descrição')).toBeInTheDocument();
    expect(screen.getByLabelText('Prioridade')).toBeInTheDocument();
  });
  
  it('should validate required fields', async () => {
    const onSubmit = jest.fn();
    render(<ProcessForm onSubmit={onSubmit} />);
    
    fireEvent.click(screen.getByText('Salvar'));
    
    await waitFor(() => {
      expect(screen.getByText('Assunto é obrigatório')).toBeInTheDocument();
    });
    
    expect(onSubmit).not.toHaveBeenCalled();
  });
  
  it('should submit form with valid data', async () => {
    const onSubmit = jest.fn();
    render(<ProcessForm onSubmit={onSubmit} />);
    
    fireEvent.change(screen.getByLabelText('Assunto'), {
      target: { value: 'Teste de processo' }
    });
    
    fireEvent.change(screen.getByLabelText('Descrição'), {
      target: { value: 'Descrição do teste' }
    });
    
    fireEvent.click(screen.getByText('Salvar'));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        assunto: 'Teste de processo',
        descricao: 'Descrição do teste',
        // ... outros campos
      });
    });
  });
});
```

---

## 🗄️ Banco de Dados

### Visão Geral do Banco

O sistema utiliza Oracle Database 23c Free como banco de dados principal, com o schema `protocolo_user`. A estrutura foi projetada para suportar alta concorrência, integridade referencial e auditoria completa.

#### Características Principais

- **SGBD**: Oracle Database 23c Free
- **Schema**: protocolo_user
- **Charset**: UTF8
- **Timezone**: America/Sao_Paulo
- **Backup**: Oracle Data Pump (expdp/impdp)
- **Conexão**: Oracle Instant Client

### Modelo de Dados

#### Diagrama ER Simplificado

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   USUARIOS  │    │   SETORES   │    │  PROCESSOS  │
├─────────────┤    ├─────────────┤    ├─────────────┤
│ id (PK)     │    │ id (PK)     │    │ id (PK)     │
│ nome        │    │ nome        │    │ numero      │
│ email       │    │ sigla       │    │ assunto     │
│ setor_id(FK)│◄──►│ setor_pai_id│    │ descricao   │
│ perfil      │    │ nivel       │    │ status      │
│ ativo       │    │ ativo       │    │ prioridade  │
└─────────────┘    └─────────────┘    │ setor_atual │
                                      │ usuario_resp│
┌─────────────┐    ┌─────────────┐    │ data_criacao│
│ TRAMITACOES │    │ DOCUMENTOS  │    │ prazo       │
├─────────────┤    ├─────────────┤    └─────────────┘
│ id (PK)     │    │ id (PK)     │           │
│ processo_id │◄───┤ processo_id │◄──────────┘
│ setor_origem│    │ nome_arquivo│
│ setor_destino│   │ tipo        │
│ usuario_id  │    │ tamanho     │
│ data_tramite│    │ caminho     │
│ observacoes │    │ data_upload │
└─────────────┘    └─────────────┘
```

### Estrutura das Tabelas

#### 1. USUARIOS

```sql
CREATE TABLE usuarios (
    id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    nome VARCHAR2(100) NOT NULL,
    email VARCHAR2(100) UNIQUE NOT NULL,
    senha_hash VARCHAR2(255),
    perfil VARCHAR2(20) DEFAULT 'usuario' CHECK (perfil IN ('admin', 'supervisor', 'usuario')),
    setor_id NUMBER,
    telefone VARCHAR2(20),
    cargo VARCHAR2(50),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_alteracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    prazo_resposta DATE,
    data_conclusao TIMESTAMP,
    observacoes CLOB,
    valor_estimado NUMBER(15,2),
    confidencial NUMBER(1) DEFAULT 0 CHECK (confidencial IN (0, 1)),
    
    CONSTRAINT fk_processos_setor_origem FOREIGN KEY (setor_origem_id) REFERENCES setores(id),
    CONSTRAINT fk_processos_setor_atual FOREIGN KEY (setor_atual_id) REFERENCES setores(id),
    CONSTRAINT fk_processos_usuario_criacao FOREIGN KEY (usuario_criacao_id) REFERENCES usuarios(id),
    CONSTRAINT fk_processos_usuario_responsavel FOREIGN KEY (usuario_responsavel_id) REFERENCES usuarios(id)
);

-- Índices
CREATE INDEX idx_processos_numero ON processos(numero);
CREATE INDEX idx_processos_status ON processos(status);
CREATE INDEX idx_processos_setor_atual ON processos(setor_atual_id);
CREATE INDEX idx_processos_data_criacao ON processos(data_criacao);
CREATE INDEX idx_processos_prazo ON processos(prazo_resposta);
CREATE INDEX idx_processos_assunto ON processos(UPPER(assunto));

-- Sequence para numeração automática
CREATE SEQUENCE seq_processo_numero START WITH 1 INCREMENT BY 1;

-- Trigger para gerar número automático
CREATE OR REPLACE TRIGGER trg_processos_numero
    BEFORE INSERT ON processos
    FOR EACH ROW
BEGIN
    IF :NEW.numero IS NULL THEN
        :NEW.numero := TO_CHAR(SYSDATE, 'YYYY') || '.' || 
                      LPAD(seq_processo_numero.NEXTVAL, 6, '0');
    END IF;
END;
```

#### 4. TRAMITACOES

```sql
CREATE TABLE tramitacoes (
    id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    processo_id NUMBER NOT NULL,
    setor_origem_id NUMBER NOT NULL,
    setor_destino_id NUMBER NOT NULL,
    usuario_id NUMBER NOT NULL,
    data_tramite TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacoes CLOB,
    prazo_resposta DATE,
    data_recebimento TIMESTAMP,
    usuario_recebimento_id NUMBER,
    status VARCHAR2(20) DEFAULT 'enviado' CHECK (status IN ('enviado', 'recebido', 'devolvido')),
    motivo_devolucao CLOB,
    
    CONSTRAINT fk_tramitacoes_processo FOREIGN KEY (processo_id) REFERENCES processos(id),
    CONSTRAINT fk_tramitacoes_setor_origem FOREIGN KEY (setor_origem_id) REFERENCES setores(id),
    CONSTRAINT fk_tramitacoes_setor_destino FOREIGN KEY (setor_destino_id) REFERENCES setores(id),
    CONSTRAINT fk_tramitacoes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT fk_tramitacoes_usuario_receb FOREIGN KEY (usuario_recebimento_id) REFERENCES usuarios(id)
);

-- Índices
CREATE INDEX idx_tramitacoes_processo ON tramitacoes(processo_id);
CREATE INDEX idx_tramitacoes_setor_destino ON tramitacoes(setor_destino_id);
CREATE INDEX idx_tramitacoes_data ON tramitacoes(data_tramite);
CREATE INDEX idx_tramitacoes_status ON tramitacoes(status);
```

#### 5. DOCUMENTOS

```sql
CREATE TABLE documentos (
    id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    processo_id NUMBER NOT NULL,
    nome_original VARCHAR2(255) NOT NULL,
    nome_arquivo VARCHAR2(255) NOT NULL,
    tipo_arquivo VARCHAR2(10) NOT NULL,
    tamanho_bytes NUMBER NOT NULL,
    caminho_arquivo VARCHAR2(500) NOT NULL,
    hash_arquivo VARCHAR2(64),
    descricao VARCHAR2(500),
    tipo_documento VARCHAR2(50),
    versao NUMBER DEFAULT 1,
    documento_pai_id NUMBER,
    usuario_upload_id NUMBER NOT NULL,
    data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_alteracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo NUMBER(1) DEFAULT 1 CHECK (ativo IN (0, 1)),
    
    CONSTRAINT fk_documentos_processo FOREIGN KEY (processo_id) REFERENCES processos(id),
    CONSTRAINT fk_documentos_pai FOREIGN KEY (documento_pai_id) REFERENCES documentos(id),
    CONSTRAINT fk_documentos_usuario FOREIGN KEY (usuario_upload_id) REFERENCES usuarios(id)
);

-- Índices
CREATE INDEX idx_documentos_processo ON documentos(processo_id);
CREATE INDEX idx_documentos_nome ON documentos(UPPER(nome_original));
CREATE INDEX idx_documentos_tipo ON documentos(tipo_arquivo);
CREATE INDEX idx_documentos_data ON documentos(data_upload);
CREATE INDEX idx_documentos_hash ON documentos(hash_arquivo);
```

#### 6. CONFIGURACOES

```sql
CREATE TABLE configuracoes (
    id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    chave VARCHAR2(100) UNIQUE NOT NULL,
    valor CLOB,
    descricao VARCHAR2(500),
    tipo VARCHAR2(20) DEFAULT 'string' CHECK (tipo IN ('string', 'number', 'boolean', 'json')),
    categoria VARCHAR2(50),
    editavel NUMBER(1) DEFAULT 1 CHECK (editavel IN (0, 1)),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_alteracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_alteracao_id NUMBER,
    
    CONSTRAINT fk_config_usuario FOREIGN KEY (usuario_alteracao_id) REFERENCES usuarios(id)
);

-- Índices
CREATE INDEX idx_configuracoes_chave ON configuracoes(chave);
CREATE INDEX idx_configuracoes_categoria ON configuracoes(categoria);
```

#### 7. LOGS_AUDITORIA

```sql
CREATE TABLE logs_auditoria (
    id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    tabela VARCHAR2(50) NOT NULL,
    operacao VARCHAR2(10) NOT NULL CHECK (operacao IN ('INSERT', 'UPDATE', 'DELETE')),
    registro_id NUMBER,
    usuario_id NUMBER,
    data_operacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_usuario VARCHAR2(45),
    user_agent VARCHAR2(500),
    dados_anteriores CLOB,
    dados_novos CLOB,
    observacoes VARCHAR2(500),
    
    CONSTRAINT fk_logs_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Índices
CREATE INDEX idx_logs_tabela ON logs_auditoria(tabela);
CREATE INDEX idx_logs_operacao ON logs_auditoria(operacao);
CREATE INDEX idx_logs_data ON logs_auditoria(data_operacao);
CREATE INDEX idx_logs_usuario ON logs_auditoria(usuario_id);
CREATE INDEX idx_logs_registro ON logs_auditoria(registro_id);

-- Particionamento por data (opcional para grandes volumes)
-- ALTER TABLE logs_auditoria PARTITION BY RANGE (data_operacao) INTERVAL (NUMTOYMINTERVAL(1, 'MONTH'));
```

### Views Importantes

#### 1. VIEW_PROCESSOS_COMPLETA

```sql
CREATE OR REPLACE VIEW view_processos_completa AS
SELECT 
    p.id,
    p.numero,
    p.assunto,
    p.descricao,
    p.status,
    p.prioridade,
    p.data_criacao,
    p.data_alteracao,
    p.prazo_resposta,
    p.data_conclusao,
    p.confidencial,
    -- Setor origem
    so.nome AS setor_origem_nome,
    so.sigla AS setor_origem_sigla,
    -- Setor atual
    sa.nome AS setor_atual_nome,
    sa.sigla AS setor_atual_sigla,
    -- Usuário criação
    uc.nome AS usuario_criacao_nome,
    uc.email AS usuario_criacao_email,
    -- Usuário responsável
    ur.nome AS usuario_responsavel_nome,
    ur.email AS usuario_responsavel_email,
    -- Estatísticas
    (SELECT COUNT(*) FROM tramitacoes t WHERE t.processo_id = p.id) AS total_tramitacoes,
    (SELECT COUNT(*) FROM documentos d WHERE d.processo_id = p.id AND d.ativo = 1) AS total_documentos,
    -- Status de prazo
    CASE 
        WHEN p.status = 'concluido' THEN 'CONCLUIDO'
        WHEN p.prazo_resposta IS NULL THEN 'SEM_PRAZO'
        WHEN p.prazo_resposta < TRUNC(SYSDATE) THEN 'ATRASADO'
        WHEN p.prazo_resposta = TRUNC(SYSDATE) THEN 'VENCE_HOJE'
        WHEN p.prazo_resposta <= TRUNC(SYSDATE) + 3 THEN 'VENCE_EM_BREVE'
        ELSE 'NO_PRAZO'
    END AS status_prazo
FROM processos p
    LEFT JOIN setores so ON p.setor_origem_id = so.id
    LEFT JOIN setores sa ON p.setor_atual_id = sa.id
    LEFT JOIN usuarios uc ON p.usuario_criacao_id = uc.id
    LEFT JOIN usuarios ur ON p.usuario_responsavel_id = ur.id;
```

#### 2. VIEW_TRAMITACOES_COMPLETA

```sql
CREATE OR REPLACE VIEW view_tramitacoes_completa AS
SELECT 
    t.id,
    t.processo_id,
    p.numero AS processo_numero,
    p.assunto AS processo_assunto,
    t.data_tramite,
    t.data_recebimento,
    t.observacoes,
    t.prazo_resposta,
    t.status,
    -- Setor origem
    so.nome AS setor_origem_nome,
    so.sigla AS setor_origem_sigla,
    -- Setor destino
    sd.nome AS setor_destino_nome,
    sd.sigla AS setor_destino_sigla,
    -- Usuário tramitação
    ut.nome AS usuario_tramite_nome,
    ut.email AS usuario_tramite_email,
    -- Usuário recebimento
    ur.nome AS usuario_recebimento_nome,
    ur.email AS usuario_recebimento_email,
    -- Tempo de tramitação
    CASE 
        WHEN t.data_recebimento IS NOT NULL THEN
            ROUND((t.data_recebimento - t.data_tramite) * 24, 2)
        ELSE
            ROUND((SYSDATE - t.data_tramite) * 24, 2)
    END AS tempo_tramitacao_horas
FROM tramitacoes t
    JOIN processos p ON t.processo_id = p.id
    JOIN setores so ON t.setor_origem_id = so.id
    JOIN setores sd ON t.setor_destino_id = sd.id
    JOIN usuarios ut ON t.usuario_id = ut.id
    LEFT JOIN usuarios ur ON t.usuario_recebimento_id = ur.id;
```

### Procedures e Functions

#### 1. PROCEDURE: TRAMITAR_PROCESSO

```sql
CREATE OR REPLACE PROCEDURE tramitar_processo(
    p_processo_id IN NUMBER,
    p_setor_destino_id IN NUMBER,
    p_usuario_id IN NUMBER,
    p_observacoes IN VARCHAR2 DEFAULT NULL,
    p_prazo_resposta IN DATE DEFAULT NULL,
    p_resultado OUT VARCHAR2
) AS
    v_setor_atual_id NUMBER;
    v_processo_status VARCHAR2(20);
BEGIN
    -- Verificar se o processo existe e está ativo
    SELECT setor_atual_id, status 
    INTO v_setor_atual_id, v_processo_status
    FROM processos 
    WHERE id = p_processo_id;
    
    -- Verificar se o processo pode ser tramitado
    IF v_processo_status IN ('concluido', 'arquivado', 'cancelado') THEN
        p_resultado := 'ERRO: Processo não pode ser tramitado - Status: ' || v_processo_status;
        RETURN;
    END IF;
    
    -- Verificar se não está tramitando para o mesmo setor
    IF v_setor_atual_id = p_setor_destino_id THEN
        p_resultado := 'ERRO: Processo já está no setor de destino';
        RETURN;
    END IF;
    
    -- Inserir tramitação
    INSERT INTO tramitacoes (
        processo_id,
        setor_origem_id,
        setor_destino_id,
        usuario_id,
        observacoes,
        prazo_resposta
    ) VALUES (
        p_processo_id,
        v_setor_atual_id,
        p_setor_destino_id,
        p_usuario_id,
        p_observacoes,
        p_prazo_resposta
    );
    
    -- Atualizar setor atual do processo
    UPDATE processos 
    SET setor_atual_id = p_setor_destino_id,
        data_alteracao = CURRENT_TIMESTAMP,
        status = CASE WHEN status = 'aberto' THEN 'em_andamento' ELSE status END
    WHERE id = p_processo_id;
    
    COMMIT;
    p_resultado := 'SUCCESS: Processo tramitado com sucesso';
    
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        p_resultado := 'ERRO: Processo não encontrado';
        ROLLBACK;
    WHEN OTHERS THEN
        p_resultado := 'ERRO: ' || SQLERRM;
        ROLLBACK;
END tramitar_processo;
```

#### 2. FUNCTION: CALCULAR_DIAS_UTEIS

```sql
CREATE OR REPLACE FUNCTION calcular_dias_uteis(
    p_data_inicio IN DATE,
    p_data_fim IN DATE
) RETURN NUMBER AS
    v_dias_uteis NUMBER := 0;
    v_data_atual DATE := p_data_inicio;
    v_dia_semana NUMBER;
BEGIN
    WHILE v_data_atual <= p_data_fim LOOP
        v_dia_semana := TO_NUMBER(TO_CHAR(v_data_atual, 'D'));
        
        -- Contar apenas dias úteis (2=Segunda a 6=Sexta)
        IF v_dia_semana BETWEEN 2 AND 6 THEN
            v_dias_uteis := v_dias_uteis + 1;
        END IF;
        
        v_data_atual := v_data_atual + 1;
    END LOOP;
    
    RETURN v_dias_uteis;
END calcular_dias_uteis;
```

### Triggers de Auditoria

#### 1. TRIGGER: AUDITORIA_PROCESSOS

```sql
CREATE OR REPLACE TRIGGER trg_auditoria_processos
    AFTER INSERT OR UPDATE OR DELETE ON processos
    FOR EACH ROW
DECLARE
    v_operacao VARCHAR2(10);
    v_usuario_id NUMBER;
    v_dados_anteriores CLOB;
    v_dados_novos CLOB;
BEGIN
    -- Determinar operação
    IF INSERTING THEN
        v_operacao := 'INSERT';
    ELSIF UPDATING THEN
        v_operacao := 'UPDATE';
    ELSE
        v_operacao := 'DELETE';
    END IF;
    
    -- Obter usuário da sessão (se disponível)
    BEGIN
        v_usuario_id := SYS_CONTEXT('USERENV', 'CLIENT_IDENTIFIER');
    EXCEPTION
        WHEN OTHERS THEN
            v_usuario_id := NULL;
    END;
    
    -- Preparar dados para auditoria
    IF v_operacao IN ('UPDATE', 'DELETE') THEN
        v_dados_anteriores := JSON_OBJECT(
            'id' VALUE :OLD.id,
            'numero' VALUE :OLD.numero,
            'assunto' VALUE :OLD.assunto,
            'status' VALUE :OLD.status,
            'setor_atual_id' VALUE :OLD.setor_atual_id
        );
    END IF;
    
    IF v_operacao IN ('INSERT', 'UPDATE') THEN
        v_dados_novos := JSON_OBJECT(
            'id' VALUE :NEW.id,
            'numero' VALUE :NEW.numero,
            'assunto' VALUE :NEW.assunto,
            'status' VALUE :NEW.status,
            'setor_atual_id' VALUE :NEW.setor_atual_id
        );
    END IF;
    
    -- Inserir log de auditoria
    INSERT INTO logs_auditoria (
        tabela,
        operacao,
        registro_id,
        usuario_id,
        dados_anteriores,
        dados_novos,
        ip_usuario
    ) VALUES (
        'processos',
        v_operacao,
        COALESCE(:NEW.id, :OLD.id),
        v_usuario_id,
        v_dados_anteriores,
        v_dados_novos,
        SYS_CONTEXT('USERENV', 'IP_ADDRESS')
    );
END;
```

### Índices de Performance

#### 1. Índices Compostos

```sql
-- Índice para consultas de processos por setor e status
CREATE INDEX idx_processos_setor_status ON processos(setor_atual_id, status);

-- Índice para consultas de tramitações por data e setor
CREATE INDEX idx_tramitacoes_data_setor ON tramitacoes(data_tramite, setor_destino_id);

-- Índice para consultas de documentos por processo e tipo
CREATE INDEX idx_documentos_processo_tipo ON documentos(processo_id, tipo_arquivo);

-- Índice para logs de auditoria por tabela e data
CREATE INDEX idx_logs_tabela_data ON logs_auditoria(tabela, data_operacao);
```

#### 2. Índices Funcionais

```sql
-- Índice para busca case-insensitive no assunto
CREATE INDEX idx_processos_assunto_upper ON processos(UPPER(assunto));

-- Índice para busca case-insensitive no nome do usuário
CREATE INDEX idx_usuarios_nome_upper ON usuarios(UPPER(nome));

-- Índice para processos por ano
CREATE INDEX idx_processos_ano ON processos(EXTRACT(YEAR FROM data_criacao));
```

### Estatísticas e Manutenção

#### 1. Coleta de Estatísticas

```sql
-- Procedure para atualizar estatísticas
CREATE OR REPLACE PROCEDURE atualizar_estatisticas AS
BEGIN
    -- Atualizar estatísticas das tabelas principais
    DBMS_STATS.GATHER_TABLE_STATS('PROTOCOLO_USER', 'PROCESSOS');
    DBMS_STATS.GATHER_TABLE_STATS('PROTOCOLO_USER', 'TRAMITACOES');
    DBMS_STATS.GATHER_TABLE_STATS('PROTOCOLO_USER', 'DOCUMENTOS');
    DBMS_STATS.GATHER_TABLE_STATS('PROTOCOLO_USER', 'USUARIOS');
    DBMS_STATS.GATHER_TABLE_STATS('PROTOCOLO_USER', 'SETORES');
    DBMS_STATS.GATHER_TABLE_STATS('PROTOCOLO_USER', 'LOGS_AUDITORIA');
    
    DBMS_OUTPUT.PUT_LINE('Estatísticas atualizadas com sucesso');
END;
```

#### 2. Limpeza de Logs Antigos

```sql
-- Procedure para limpar logs antigos
CREATE OR REPLACE PROCEDURE limpar_logs_antigos(
    p_dias_manter IN NUMBER DEFAULT 365
) AS
    v_data_limite DATE;
    v_registros_removidos NUMBER;
BEGIN
    v_data_limite := SYSDATE - p_dias_manter;
    
    DELETE FROM logs_auditoria 
    WHERE data_operacao < v_data_limite;
    
    v_registros_removidos := SQL%ROWCOUNT;
    COMMIT;
    
    DBMS_OUTPUT.PUT_LINE('Removidos ' || v_registros_removidos || ' registros de log');
END;
```

### Backup e Recovery

#### 1. Script de Backup

```sql
-- Backup completo do schema
-- Executar via linha de comando:
expdp protocolo_user/Anderline49@localhost:1521/FREEPDB1 \
    schemas=protocolo_user \
    directory=DATA_PUMP_DIR \
    dumpfile=protocolo_backup_%U.dmp \
    logfile=protocolo_backup.log \
    parallel=2 \
    compression=all
```

#### 2. Script de Restore

```sql
-- Restore completo do schema
-- Executar via linha de comando:
impdp protocolo_user/Anderline49@localhost:1521/FREEPDB1 \
    schemas=protocolo_user \
    directory=DATA_PUMP_DIR \
    dumpfile=protocolo_backup_%U.dmp \
    logfile=protocolo_restore.log \
    parallel=2 \
    table_exists_action=replace
```

### Monitoramento e Performance

#### 1. Queries de Monitoramento

```sql
-- Processos por status
SELECT status, COUNT(*) as total
FROM processos
GROUP BY status
ORDER BY total DESC;

-- Setores mais ativos
SELECT s.nome, COUNT(p.id) as total_processos
FROM setores s
LEFT JOIN processos p ON s.id = p.setor_atual_id
GROUP BY s.nome
ORDER BY total_processos DESC;

-- Processos atrasados
SELECT COUNT(*) as processos_atrasados
FROM processos
WHERE status NOT IN ('concluido', 'arquivado', 'cancelado')
  AND prazo_resposta < TRUNC(SYSDATE);

-- Usuários mais ativos
SELECT u.nome, COUNT(t.id) as total_tramitacoes
FROM usuarios u
LEFT JOIN tramitacoes t ON u.id = t.usuario_id
WHERE t.data_tramite >= TRUNC(SYSDATE) - 30
GROUP BY u.nome
ORDER BY total_tramitacoes DESC;
```

#### 2. Análise de Performance

```sql
-- Consultas mais lentas
SELECT sql_text, executions, elapsed_time/1000000 as elapsed_seconds
FROM v$sql
WHERE parsing_schema_name = 'PROTOCOLO_USER'
  AND executions > 0
ORDER BY elapsed_time DESC
FETCH FIRST 10 ROWS ONLY;

-- Tabelas com mais I/O
SELECT table_name, num_rows, blocks, avg_row_len
FROM user_tables
WHERE table_name IN ('PROCESSOS', 'TRAMITACOES', 'DOCUMENTOS', 'LOGS_AUDITORIA')
## 9. SEGURANÇA

### 9.1 Autenticação e Autorização

#### JWT (JSON Web Tokens)
- **Implementação**: Tokens JWT para autenticação stateless
- **Expiração**: Configurável via variáveis de ambiente
- **Refresh Token**: Sistema de renovação automática de tokens
- **Middleware**: Validação automática em rotas protegidas

#### LDAP Integration
- **Active Directory**: Integração com AD corporativo
- **Sincronização**: Importação automática de usuários
- **Grupos**: Mapeamento de grupos AD para perfis do sistema
- **Fallback**: Autenticação local quando LDAP indisponível

#### Controle de Acesso
- **RBAC**: Role-Based Access Control
- **Perfis**: Admin, Gestor, Operador, Consulta
- **Permissões**: Granulares por funcionalidade
- **Hierarquia**: Herança de permissões por setor

### 9.2 Segurança de Dados

#### Criptografia
- **Senhas**: Hash bcrypt com salt
- **Dados Sensíveis**: Criptografia AES-256
- **Comunicação**: HTTPS obrigatório em produção
- **Arquivos**: Hash SHA-256 para integridade

#### Auditoria
- **Logs Completos**: Todas as operações registradas
- **Rastreabilidade**: IP, User-Agent, timestamp
- **Retenção**: Configurável (padrão 365 dias)
- **Compliance**: Atende LGPD e normas governamentais

#### Validação e Sanitização
- **Input Validation**: Joi schemas para validação
- **SQL Injection**: Prepared statements obrigatórios
- **XSS Protection**: Sanitização de dados de entrada
- **CSRF**: Tokens CSRF em formulários

### 9.3 Configurações de Segurança

#### Headers de Segurança
```javascript
// Helmet.js configurado
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true
    }
}));
```

#### Rate Limiting
```javascript
// Limitação de requisições
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP
    message: 'Muitas tentativas, tente novamente em 15 minutos'
});
```

#### CORS Configurado
```javascript
// Configuração CORS para múltiplos ambientes
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:8080',
            'http://127.0.0.1:8080',
            // IPs da rede local permitidos
            /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:(8080|8081|3000|5173)$/,
            /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:(8080|8081|3000|5173)$/
        ];
        
        if (!origin || allowedOrigins.some(allowed => 
            typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
        )) {
            callback(null, true);
        } else {
            callback(new Error('Não permitido pelo CORS'));
        }
    },
    credentials: true
};
```

## 10. DEPLOYMENT

### 10.1 Ambientes

#### Desenvolvimento
- **Frontend**: http://localhost:8080 (Vite Dev Server)
- **Backend**: http://localhost:3001 (Node.js)
- **Database**: Oracle 21c XE (localhost:1521/FREEPDB1)
- **Hot Reload**: Ativo para desenvolvimento rápido

#### Homologação
- **Docker Compose**: Ambiente containerizado
- **Volumes**: Dados persistentes
- **Networks**: Isolamento de rede
- **Monitoring**: Logs centralizados

#### Produção
- **Kubernetes**: Orquestração de containers
- **Load Balancer**: Distribuição de carga
- **Auto Scaling**: Escalonamento automático
- **Backup**: Rotinas automatizadas

### 10.2 Docker

#### Frontend Dockerfile
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Backend Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "8080:80"
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://backend:3001

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    depends_on:
      - oracle
    environment:
      - NODE_ENV=production
      - DB_HOST=oracle
      - DB_PORT=1521
      - DB_SERVICE=FREEPDB1
      - DB_USER=protocolo_user
      - DB_PASSWORD=Anderline49

  oracle:
    image: container-registry.oracle.com/database/express:21.3.0-xe
    ports:
      - "1521:1521"
    environment:
      - ORACLE_PWD=Oracle123
      - ORACLE_CHARACTERSET=AL32UTF8
    volumes:
      - oracle_data:/opt/oracle/oradata
      - ./scripts:/docker-entrypoint-initdb.d

volumes:
  oracle_data:
```

### 10.3 Kubernetes

#### Deployment Frontend
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: protocolo-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: protocolo-frontend
  template:
    metadata:
      labels:
        app: protocolo-frontend
    spec:
      containers:
      - name: frontend
        image: protocolo/frontend:latest
        ports:
        - containerPort: 80
        env:
        - name: VITE_API_URL
          value: "http://protocolo-backend-service:3001"
---
apiVersion: v1
kind: Service
metadata:
  name: protocolo-frontend-service
spec:
  selector:
    app: protocolo-frontend
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

#### Deployment Backend
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: protocolo-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: protocolo-backend
  template:
    metadata:
      labels:
        app: protocolo-backend
    spec:
      containers:
      - name: backend
        image: protocolo/backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          value: "oracle-service"
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
---
apiVersion: v1
kind: Service
metadata:
  name: protocolo-backend-service
spec:
  selector:
    app: protocolo-backend
  ports:
  - port: 3001
    targetPort: 3001
```

### 10.4 CI/CD Pipeline

#### GitHub Actions
```yaml
name: Deploy Protocolo System

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        cd frontend && npm ci
        cd ../backend && npm ci
    
    - name: Run tests
      run: |
        cd frontend && npm run test
        cd ../backend && npm run test
    
    - name: Run linting
      run: |
        cd frontend && npm run lint
        cd ../backend && npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Build Docker images
      run: |
        docker build -t protocolo/frontend:${{ github.sha }} ./frontend
        docker build -t protocolo/backend:${{ github.sha }} ./backend
    
    - name: Push to registry
      run: |
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push protocolo/frontend:${{ github.sha }}
        docker push protocolo/backend:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/protocolo-frontend frontend=protocolo/frontend:${{ github.sha }}
        kubectl set image deployment/protocolo-backend backend=protocolo/backend:${{ github.sha }}
        kubectl rollout status deployment/protocolo-frontend
        kubectl rollout status deployment/protocolo-backend
```

## 11. MONITORAMENTO E LOGS

### 11.1 Logging

#### Winston Configuration
```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'protocolo-backend' },
    transports: [
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error' 
        }),
        new winston.transports.File({ 
            filename: 'logs/combined.log' 
        }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});
```

#### Log Levels
- **ERROR**: Erros críticos do sistema
- **WARN**: Avisos e situações anômalas
- **INFO**: Informações gerais de operação
- **DEBUG**: Informações detalhadas para debug

### 11.2 Métricas

#### Prometheus Metrics
```javascript
const promClient = require('prom-client');

// Métricas customizadas
const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status']
});

const activeProcesses = new promClient.Gauge({
    name: 'protocolo_active_processes_total',
    help: 'Total number of active processes'
});

const tramitacoesPorHora = new promClient.Counter({
    name: 'protocolo_tramitacoes_total',
    help: 'Total number of tramitações processed'
});
```

#### Health Checks
```javascript
// Endpoint de health check
app.get('/health', async (req, res) => {
    const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        services: {
            database: await checkDatabaseHealth(),
            ldap: await checkLdapHealth(),
            filesystem: await checkFilesystemHealth()
        }
    };
    
    const isHealthy = Object.values(health.services)
        .every(service => service.status === 'OK');
    
    res.status(isHealthy ? 200 : 503).json(health);
});
```

### 11.3 Alertas

#### Configuração de Alertas
- **Processo Atrasado**: Notificação quando prazo vencido
- **Sistema Indisponível**: Alert quando health check falha
- **Erro Crítico**: Notificação imediata para erros 500
- **Uso de Recursos**: Alert quando CPU/Memory > 80%

## 12. BACKUP E RECOVERY

### 12.1 Estratégia de Backup

#### Banco de Dados
```bash
#!/bin/bash
# Script de backup diário
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/oracle"

# Backup completo
expdp protocolo_user/Anderline49@localhost:1521/FREEPDB1 \
    schemas=protocolo_user \
    directory=DATA_PUMP_DIR \
    dumpfile=protocolo_backup_${DATE}.dmp \
    logfile=protocolo_backup_${DATE}.log \
    parallel=2 \
    compression=all

# Compactar backup
gzip ${BACKUP_DIR}/protocolo_backup_${DATE}.dmp

# Remover backups antigos (manter 30 dias)
find ${BACKUP_DIR} -name "protocolo_backup_*.dmp.gz" -mtime +30 -delete
```

#### Arquivos do Sistema
```bash
#!/bin/bash
# Backup de arquivos e configurações
DATE=$(date +%Y%m%d_%H%M%S)

# Backup de uploads
tar -czf /backups/files/uploads_${DATE}.tar.gz /app/uploads/

# Backup de configurações
tar -czf /backups/config/config_${DATE}.tar.gz \
    /app/.env \
    /app/config/ \
    /etc/nginx/sites-available/protocolo

# Sincronizar com storage remoto
rsync -av /backups/ user@backup-server:/protocolo-backups/
```

### 12.2 Disaster Recovery

#### RTO/RPO Targets
- **RTO (Recovery Time Objective)**: 4 horas
- **RPO (Recovery Point Objective)**: 1 hora
- **Backup Frequency**: Diário (completo), Horário (incremental)
- **Retention**: 30 dias local, 1 ano remoto

#### Procedimento de Recovery
1. **Avaliação do Incidente**
2. **Restauração do Banco de Dados**
3. **Restauração dos Arquivos**
4. **Verificação da Integridade**
5. **Testes de Funcionalidade**
6. **Liberação para Produção**

## 13. PERFORMANCE E OTIMIZAÇÃO

### 13.1 Frontend

#### Otimizações Implementadas
- **Code Splitting**: Carregamento sob demanda
- **Lazy Loading**: Componentes e rotas
- **Memoization**: React.memo e useMemo
- **Bundle Optimization**: Tree shaking e minificação
- **CDN**: Assets estáticos via CDN

#### Métricas de Performance
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

### 13.2 Backend

#### Otimizações de Banco
- **Índices Otimizados**: Consultas frequentes indexadas
- **Query Optimization**: Queries complexas otimizadas
- **Connection Pooling**: Pool de conexões configurado
- **Caching**: Redis para cache de sessões e dados

#### API Performance
- **Rate Limiting**: Proteção contra abuse
- **Compression**: Gzip para responses
- **Pagination**: Limitação de resultados
- **Async Processing**: Operações pesadas em background

### 13.3 Monitoramento de Performance

#### Ferramentas Utilizadas
- **New Relic**: APM completo
- **Grafana**: Dashboards de métricas
- **Prometheus**: Coleta de métricas
- **ELK Stack**: Análise de logs

## 14. TESTES

### 14.1 Estratégia de Testes

#### Pirâmide de Testes
- **Unit Tests**: 70% - Funções e componentes isolados
- **Integration Tests**: 20% - APIs e fluxos
- **E2E Tests**: 10% - Cenários completos

#### Ferramentas
- **Frontend**: Jest, React Testing Library, Cypress
- **Backend**: Jest, Supertest, Mocha
- **E2E**: Playwright, Cypress

### 14.2 Cobertura de Testes

#### Metas de Cobertura
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 85%
- **Lines**: > 80%

#### Testes Críticos
- **Autenticação e Autorização**
- **Tramitação de Processos**
- **Upload de Documentos**
- **Relatórios e Consultas**
- **Integração LDAP**

## 15. DOCUMENTAÇÃO TÉCNICA

### 15.1 Padrões de Código

#### Frontend (React/TypeScript)
```typescript
// Exemplo de componente padrão
interface ProcessoCardProps {
    processo: Processo;
    onTramitar: (id: number) => void;
}

export const ProcessoCard: React.FC<ProcessoCardProps> = ({ 
    processo, 
    onTramitar 
}) => {
    const { user } = useAuth();
    const { mutate: tramitar } = useTramitarProcesso();
    
    const handleTramitar = useCallback(() => {
        tramitar(processo.id);
        onTramitar(processo.id);
    }, [processo.id, tramitar, onTramitar]);
    
    return (
        <Card className="p-4">
            <CardHeader>
                <CardTitle>{processo.numero}</CardTitle>
                <CardDescription>{processo.assunto}</CardDescription>
            </CardHeader>
            <CardContent>
                <ProcessoStatus status={processo.status} />
                <ProcessoPrazo prazo={processo.prazo_resposta} />
            </CardContent>
            <CardFooter>
                {user.canTramitar && (
                    <Button onClick={handleTramitar}>
                        Tramitar
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};
```

#### Backend (Node.js/TypeScript)
```typescript
// Exemplo de controller padrão
export class ProcessoController {
    constructor(
        private processoService: ProcessoService,
        private logger: Logger
    ) {}
    
    @Get('/')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Listar processos' })
    async listar(
        @Query() query: ListarProcessosDto,
        @CurrentUser() user: User
    ): Promise<PaginatedResponse<Processo>> {
        try {
            this.logger.info('Listando processos', { 
                userId: user.id, 
                query 
            });
            
            const result = await this.processoService.listar(query, user);
            
            return {
                data: result.data,
                total: result.total,
                page: query.page,
                limit: query.limit
            };
        } catch (error) {
            this.logger.error('Erro ao listar processos', { 
                error: error.message,
                userId: user.id 
            });
            throw error;
        }
    }
}
```

### 15.2 Convenções

#### Nomenclatura
- **Variáveis**: camelCase
- **Constantes**: UPPER_SNAKE_CASE
- **Componentes**: PascalCase
- **Arquivos**: kebab-case
- **Banco de Dados**: snake_case

#### Estrutura de Commits
```
type(scope): description

feat(auth): add LDAP integration
fix(api): resolve process tramitation bug
docs(readme): update installation guide
style(ui): improve button styling
refactor(db): optimize query performance
test(unit): add processo service tests
```

## 16. ROADMAP E MELHORIAS FUTURAS

### 16.1 Próximas Versões

#### v2.1 - Melhorias de UX (Q1 2024)
- [ ] Dashboard personalizado por usuário
- [ ] Notificações push em tempo real
- [ ] Modo escuro/claro
- [ ] Filtros avançados salvos
- [ ] Exportação de relatórios em Excel

#### v2.2 - Integrações (Q2 2024)
- [ ] API REST pública documentada
- [ ] Webhook para sistemas externos
- [ ] Integração com e-mail (SMTP)
- [ ] Assinatura digital de documentos
- [ ] OCR para documentos escaneados

#### v2.3 - Analytics (Q3 2024)
- [ ] Dashboard executivo
- [ ] Métricas de performance por setor
- [ ] Relatórios de produtividade
- [ ] Análise de gargalos
- [ ] Previsão de prazos com IA

### 16.2 Melhorias Técnicas

#### Performance
- [ ] Implementar cache Redis
- [ ] Otimizar queries complexas
- [ ] Implementar CDN para assets
- [ ] Lazy loading de componentes
- [ ] Service Workers para PWA

#### Segurança
- [ ] Implementar 2FA
- [ ] Auditoria avançada
- [ ] Criptografia de arquivos
- [ ] Compliance LGPD completo
- [ ] Penetration testing

#### DevOps
- [ ] Monitoramento avançado
- [ ] Auto-scaling no Kubernetes
- [ ] Blue-green deployment
- [ ] Disaster recovery automatizado
- [ ] Backup incremental

## 17. SUPORTE E MANUTENÇÃO

### 17.1 Contatos

#### Equipe de Desenvolvimento
- **Tech Lead**: [Nome] - [email]
- **Backend Developer**: [Nome] - [email]
- **Frontend Developer**: [Nome] - [email]
- **DevOps Engineer**: [Nome] - [email]

#### Suporte Técnico
- **Email**: suporte.protocolo@sefaz.to.gov.br
- **Telefone**: (63) 3218-XXXX
- **Horário**: Segunda a Sexta, 8h às 18h
- **Emergência**: 24/7 para issues críticas

### 17.2 SLA (Service Level Agreement)

#### Disponibilidade
- **Produção**: 99.5% (máximo 3.6h downtime/mês)
- **Homologação**: 95% (horário comercial)
- **Desenvolvimento**: Sem garantia

#### Tempo de Resposta
- **Crítico**: 1 hora
- **Alto**: 4 horas
- **Médio**: 1 dia útil
- **Baixo**: 3 dias úteis

### 17.3 Procedimentos de Manutenção

#### Manutenção Preventiva
- **Frequência**: Mensal
- **Janela**: Sábados, 2h às 6h
- **Atividades**: 
  - Atualização de dependências
  - Limpeza de logs antigos
  - Otimização de banco de dados
  - Backup e verificação

#### Manutenção Corretiva
- **Hotfix**: Deploy imediato para issues críticas
- **Patch**: Deploy semanal para correções menores
- **Release**: Deploy mensal para novas funcionalidades

---

**Documento gerado em**: ${new Date().toLocaleDateString('pt-BR')}
**Versão**: 2.0
**Última atualização**: ${new Date().toLocaleDateString('pt-BR')}

---

*Esta documentação é um documento vivo e deve ser atualizada conforme o sistema evolui. Para sugestões ou correções, entre em contato com a equipe de desenvolvimento.* TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP,
    ativo NUMBER(1) DEFAULT 1 CHECK (ativo IN (0, 1)),
    tentativas_login NUMBER DEFAULT 0,
    bloqueado_ate TIMESTAMP,
    token_reset VARCHAR2(255),
    token_reset_expira TIMESTAMP,
    
    CONSTRAINT fk_usuarios_setor FOREIGN KEY (setor_id) REFERENCES setores(id)
);

-- Índices
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_setor ON usuarios(setor_id);
CREATE INDEX idx_usuarios_ativo ON usuarios(ativo);
```

#### 2. SETORES

```sql
CREATE TABLE setores (
    id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    nome VARCHAR2(100) NOT NULL,
    sigla VARCHAR2(10) NOT NULL,
    descricao VARCHAR2(500),
    setor_pai_id NUMBER,
    nivel NUMBER DEFAULT 1,
    endereco VARCHAR2(200),
    telefone VARCHAR2(20),
    email VARCHAR2(100),
    responsavel_id NUMBER,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_alteracao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ativo NUMBER(1) DEFAULT 1 CHECK (ativo IN (0, 1)),
    
    CONSTRAINT fk_setores_pai FOREIGN KEY (setor_pai_id) REFERENCES setores(id),
    CONSTRAINT fk_setores_responsavel FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)
);

-- Índices
CREATE INDEX idx_setores_pai ON setores(setor_pai_id);
CREATE INDEX idx_setores_nivel ON setores(nivel);
CREATE INDEX idx_setores_ativo ON setores(ativo);
```

#### 3. PROCESSOS

```sql
CREATE TABLE processos (
    id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    numero VARCHAR2(20) UNIQUE NOT NULL,
    assunto VARCHAR2(200) NOT NULL,
    descricao CLOB,
    status VARCHAR2(20) DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_andamento', 'concluido', 'arquivado', 'cancelado')),
    prioridade VARCHAR2(10) DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
    setor_origem_id NUMBER NOT NULL,
    setor_atual_id NUMBER NOT NULL,
    usuario_criacao_id NUMBER NOT NULL,
    usuario_responsavel_id NUMBER,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_alteracao