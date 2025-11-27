# Sistema de Protocolo Digital - Governo do Tocantins

## 📋 Descrição

Sistema completo de protocolo eletrônico desenvolvido para modernizar a gestão pública do Governo do Tocantins. O sistema permite gerenciar processos administrativos, tramitações, usuários, documentos e anexos de forma digital, segura e eficiente.

## 🚀 Funcionalidades Principais

### 👥 Gestão de Usuários
- Autenticação JWT + LDAP
- Perfis de acesso (Admin, Usuário)
- Gerenciamento de permissões por setor
- Controle de sessões e segurança

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
- **Database**: Oracle Database /23Ai
- **Authentication**: JWT + LDAP (LDAP a ser implementado)
- **Validation**: Joi/Express Validator
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston + Morgan
- **File Upload**: Multer + Sharp

### Database
- **Primary**: Oracle Database Free 23Ai
- **Schema**: protocolo_user
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
- Oracle Database 19c+ ou Oracle Free 23Ai
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

- ✅ **Frontend**: 100% concluído
- ✅ **Backend**: API REST funcional
- ✅ **Database**: Estrutura Oracle implementada
- ✅ **Autenticação**: JWT + LDAP
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
**Última atualização**: Outubro 2025
