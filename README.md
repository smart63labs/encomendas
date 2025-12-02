# Sistema de Protocolo Digital - Governo do Tocantins

## 📋 Descrição

Sistema completo de protocolo eletrônico desenvolvido para modernizar a gestão pública do Governo do Tocantins. O sistema permite gerenciar processos administrativos, tramitações, usuários, documentos, encomendas e anexos de forma digital, segura e eficiente, com todos os dados persistidos em banco de dados Oracle 23ai.

## 🚀 Funcionalidades Principais

### 👥 Gestão de Usuários
- **Autenticação JWT via Banco de Dados Oracle 23ai**
- Perfis de acesso (Admin, Usuário)
- Gerenciamento de permissões por setor
- Controle de sessões e segurança
- Sistema de troca de senha
- **Senhas Padrão**: `Admin@123` (Admin) / `User@123` (Usuário Comum)

### 📄 Gestão de Processos
- Criação e edição de processos
- Tramitação entre setores
- Controle de prazos automatizado
- Histórico completo de movimentações
- Sistema de anexos e documentos

### 📊 Dashboard e Relatórios
- Dashboard interativo com métricas
- Relatórios por setor e período
- Processos em atraso
- Estatísticas de produtividade
- Gráficos e indicadores visuais

### 🔒 Segurança
- Rate limiting e proteção contra ataques
- Validação rigorosa de dados
- Logs de auditoria completos
- Criptografia de senhas
- Middleware de autenticação

### 📁 Gestão de Arquivos
- Upload e visualização de documentos
- Suporte a PDF, imagens e outros formatos
- Sistema de versionamento
- Compressão e otimização automática

## 🗄️ Estado de Implementação do Sistema

### ✅ Backend: Estrutura do Banco de Dados Oracle 23ai

O backend possui **12 tabelas implementadas** no Oracle Database 23ai:

| Tabela | Descrição | Backend API |
|--------|-----------|-------------|
| `USUARIOS` | Dados de usuários do sistema | ✅ Implementado |
| `PROCESSOS` | Processos administrativos | ✅ Implementado |
| `TRAMITACOES` | Histórico de movimentações | ✅ Implementado |
| `SETORES` | Hierarquia organizacional | ✅ Implementado |
| `ENCOMENDAS` | Rastreamento de encomendas | ✅ Implementado |
| `MALOTES` | Controle de malotes físicos | ✅ Implementado |
| `LACRES` | Controle de lacres | ✅ Implementado |
| `DOCUMENTOS` | Metadados de documentos | ✅ Implementado |
| `ANEXOS` | Arquivos vinculados | ✅ Implementado |
| `PRAZOS` | Controle de vencimentos | ✅ Implementado |
| `CONFIGURACOES` | Parâmetros do sistema | ✅ Implementado |
| `LOGS_AUDITORIA` | Logs de auditoria | ✅ Implementado |

### 🔌 Integração Frontend ↔ Backend

**Status da integração dos módulos do menu (navbar):**

| Módulo (Menu) | Backend API | Integração Frontend | Dados |
|---------------|-------------|---------------------|-------|
| **Encomendas** | ✅ Oracle 23ai | ✅ Integrado | Banco de Dados |
| **Documentos** | ✅ Oracle 23ai | ⚠️ Mockado | LocalStorage/Mock |
| **Processos** | ✅ Oracle 23ai | ⚠️ Mockado | LocalStorage/Mock |
| **Prazos** | ✅ Oracle 23ai | ⚠️ Mockado | LocalStorage/Mock |
| **Arquivo** | ✅ Oracle 23ai | ⚠️ Mockado | LocalStorage/Mock |
| **Tramitação** | ✅ Oracle 23ai | ⚠️ Mockado | LocalStorage/Mock |
| **Usuários** | ✅ Oracle 23ai | ⚠️ Mockado | LocalStorage/Mock |
| **Configurações** | ✅ Oracle 23ai | ⚠️ Mockado | LocalStorage/Mock |

> [!IMPORTANT]
> **Status Atual**: Apenas o módulo **Encomendas** está completamente integrado com o banco de dados Oracle 23ai. Os demais módulos do menu possuem APIs backend funcionais, mas o frontend ainda utiliza dados mockados (localStorage) para desenvolvimento.

### ⚠️ Não Implementado

| Funcionalidade | Status | Observação |
|----------------|--------|------------|
| **LDAP** | ❌ Não implementado | Planejado para versão futura. Atualmente usa autenticação via banco de dados |
| **Integração Frontend** | 🔄 Em andamento | Apenas Encomendas integrado. Demais módulos usam dados mockados |

## 🔐 Autenticação e Credenciais

### Sistema de Autenticação Atual

- **Método**: Autenticação via Banco de Dados Oracle 23ai
- **Tecnologia**: JWT (JSON Web Tokens)
- **LDAP**: ⚠️ **NÃO implementado** (apenas planejado)

### Credenciais Padrão do Sistema

Após a instalação, os usuários devem fazer login com as seguintes credenciais padrão:

| Perfil | CPF/Email | Senha Padrão | Observação |
|--------|-----------|--------------|------------|
| **Administrador** | CPF do usuário admin | `Admin@123` | Acesso total ao sistema |
| **Usuário Comum** | CPF do usuário | `User@123` | Acesso limitado conforme permissões |

> [!IMPORTANT]
> **Segurança**: Por questões de segurança, o sistema **exige a troca da senha padrão no primeiro acesso**. Após o login inicial, o usuário será direcionado para alterar sua senha.

### Primeiro Acesso

1. Acesse o sistema em: `http://localhost:8080` ou `http://10.9.1.95:8080/`
2. Faça login com seu CPF e a senha padrão correspondente ao seu perfil
3. O sistema solicitará a troca da senha padrão
4. Defina uma nova senha forte (mínimo 8 caracteres)
5. Faça login novamente com a nova senha

### Troca de Senha

Para trocar a senha após o primeiro acesso:
1. Acesse **Configurações** → **Perfil** → **Alterar Senha**
2. Informe a senha atual
3. Defina a nova senha (mínimo 8 caracteres)
4. Confirme a nova senha
5. Clique em **Salvar**

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: React 18 com TypeScript
- **Build Tool**: Vite
- **UI Library**: Radix UI + Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Formulários**: React Hook Form + Zod
- **Componentes**: Lucide React, Recharts, React PDF

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Oracle Database 23ai
- **Authentication**: JWT + Autenticação via Banco de Dados
- **LDAP**: ⚠️ Não implementado (planejado para versão futura)
- **Validation**: Joi/Express Validator
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston + Morgan
- **File Upload**: Multer + Sharp

### Database
- **Primary**: Oracle Database 23ai
- **Schema**: protocolo_user
- **Service Name**: FREEPDB1
- **Connection**: Oracle Instant Client
- **Backup**: Oracle Data Pump

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **Reverse Proxy**: Nginx
- **SSL/TLS**: cert-manager + Let's Encrypt

## 📦 Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Oracle Database 23ai (ou superior)
- Oracle Instant Client
- Docker (opcional)

### 1. Clone o repositório

```bash
git clone https://gitlab.sefaz.to.gov.br/sefaz-to/ti/produtos/dinov/novo-sistema-protocolo.git
cd novo-sistema-protocolo
```

### 2. Configuração do Backend

```bash
cd backend
npm install
cp .env.example .env
# Configure as variáveis de ambiente no .env
npm run build
npm run start
```

### 3. Configuração do Frontend

```bash
# Na raiz do projeto
npm install
npm run dev
```

### 4. Configuração do Banco de Dados

Execute os scripts SQL na pasta `/docs/ScriptsSQL/` para criar as tabelas e estruturas necessárias.

## 🌐 URLs de Acesso

- **Frontend**: http://localhost:8080 / http://10.9.1.95:8080/
- **Backend API**: http://localhost:3001
- **Documentação API**: http://localhost:3001/api-docs

## 📁 Estrutura do Projeto

```
NovoProtocolo/V2/
├── backend/                 # API REST em Node.js + TypeScript
│   ├── src/
│   │   ├── controllers/     # Controladores da API
│   │   ├── routes/         # Rotas da API
│   │   ├── services/       # Serviços e lógica de negócio
│   │   ├── models/         # Modelos de dados
│   │   └── config/         # Configurações
│   └── package.json
├── src/                    # Frontend React + TypeScript
│   ├── components/         # Componentes reutilizáveis
│   ├── pages/             # Páginas da aplicação
│   ├── contexts/          # Contextos React
│   ├── hooks/             # Hooks customizados
│   ├── services/          # Serviços de API
│   └── types/             # Tipos TypeScript
├── docs/                  # Documentação do projeto
│   ├── ScriptsSQL/        # Scripts de banco de dados
│   └── documentacao_sistema/ # Documentação técnica
├── k8s/                   # Configurações Kubernetes
├── docker-compose.yml     # Docker Compose
└── package.json          # Dependências do frontend
```

## 🔧 Scripts Disponíveis

### Frontend
- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run preview` - Preview do build
- `npm run lint` - Executa o linter

### Backend
- `npm run dev` - Inicia o servidor em modo desenvolvimento
- `npm run build` - Compila o TypeScript
- `npm run start` - Inicia o servidor em produção
- `npm run test` - Executa os testes
- `npm run migrate` - Executa migrações do banco

## 🚀 Deploy

### Docker
```bash
docker-compose up -d
```

### Kubernetes
```bash
kubectl apply -f k8s/
```

## 📊 Status do Projeto

- ✅ **Frontend**: 100% concluído (interface completa)
- ✅ **Backend**: API REST funcional com 18 controllers
- ✅ **Database**: Oracle 23ai com 12 tabelas implementadas
- ✅ **Autenticação**: JWT via Banco de Dados Oracle
- 🔄 **Integração Frontend-Backend**: Apenas módulo Encomendas integrado (demais módulos usam dados mockados)
- ⚠️ **LDAP**: Não implementado (planejado)
- ✅ **Docker**: Containerização completa
- ✅ **Kubernetes**: Deploy em produção

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte técnico, entre em contato:
- **Email**: suporte@sefaz.to.gov.br
- **Documentação**: [/docs](./docs/)
- **Issues**: [GitLab Issues](https://gitlab.sefaz.to.gov.br/sefaz-to/ti/produtos/dinov/novo-sistema-protocolo/issues)

## 🏛️ Governo do Tocantins

Desenvolvido pela Secretaria da Fazenda do Estado do Tocantins (SEFAZ-TO) para modernização dos processos administrativos públicos.

---

**Versão**: 2.0.0  
**Última atualização**: Dezembro 2025  
**Banco de Dados**: Oracle 23ai  
**Autenticação**: JWT via Banco de Dados (LDAP não implementado)
