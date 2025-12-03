# Sistema de Protocolo Digital - Governo do Tocantins

## 📋 Descrição

Sistema completo de protocolo eletrônico desenvolvido para modernizar a gestão pública do Governo do Tocantins. O sistema permite gerenciar processos administrativos, tramitações, usuários, documentos, encomendas e anexos de forma digital, segura e eficiente, com todos os dados persistidos em banco de dados Oracle 23ai.

## 🚀 Funcionalidades do Sistema

O sistema possui **9 módulos principais** acessíveis pela sidebar, sendo que **apenas o módulo Encomendas está completamente integrado** com o banco de dados Oracle 23ai. Os demais módulos utilizam dados mockados (localStorage) para desenvolvimento.

### ✅ **Encomendas** (Integrado com Oracle 23ai)
- ✅ **Criação de encomendas** via wizard completo
- ✅ **Rastreamento** com código de barras e QR Code
- ✅ **Gestão de malotes** e lacres
- ✅ **Mapa interativo** com rotas e geolocalização
- ✅ **Sistema de Hub** centralizador
- ✅ **Controle de disponibilidade** de malotes
- ✅ **Filtros por setor** baseados no perfil do usuário
- ✅ **Visualização hierárquica** de usuários e setores
- ✅ **Dados persistidos** no banco de dados Oracle

### ⚠️ **Documentos** (Mockado - LocalStorage)
- ⚠️ Upload e visualização de documentos
- ⚠️ Categorização por pastas
- ⚠️ Controle de acesso (Público, Restrito, Confidencial)
- ⚠️ Sistema de versionamento
- ⚠️ Busca e filtros
- ❌ **Backend implementado, frontend usa dados mockados**

### ⚠️ **Processos** (Mockado - LocalStorage)
- ⚠️ Criação e edição de processos administrativos
- ⚠️ Controle de status e prioridades
- ⚠️ Atribuição de responsáveis
- ⚠️ Histórico de movimentações
- ⚠️ Processos confidenciais
- ❌ **Backend implementado, frontend usa dados mockados**

### ⚠️ **Prazos** (Mockado - LocalStorage)
- ⚠️ Calendário de prazos e vencimentos
- ⚠️ Alertas de prazos próximos
- ⚠️ Controle de status (Pendente, Concluído, Vencido)
- ⚠️ Prioridades (Baixa, Média, Alta, Urgente)
- ⚠️ Atribuição de responsáveis
- ❌ **Backend implementado, frontend usa dados mockados**

### ⚠️ **Arquivo** (Mockado - LocalStorage)
- ⚠️ Arquivamento de processos
- ⚠️ Busca em arquivos
- ⚠️ Controle de localização física
- ⚠️ Histórico de arquivamento
- ❌ **Backend implementado, frontend usa dados mockados**

### ⚠️ **Tramitação** (Mockado - LocalStorage)
- ⚠️ Tramitação de processos entre setores
- ⚠️ Histórico completo de movimentações
- ⚠️ Controle de prazos de resposta
- ⚠️ Observações e despachos
- ⚠️ Status de tramitação (Enviado, Recebido, Rejeitado)
- ❌ **Backend implementado, frontend usa dados mockados**

### ⚠️ **Relatórios** (Mockado - LocalStorage)
- ⚠️ Dashboard com métricas e indicadores
- ⚠️ Relatórios por setor e período
- ⚠️ Gráficos de produtividade
- ⚠️ Processos em atraso
- ⚠️ Estatísticas de tramitação
- ❌ **Backend implementado, frontend usa dados mockados**

### ⚠️ **Usuários** (Mockado - LocalStorage)
- ⚠️ Cadastro e edição de usuários
- ⚠️ Perfis de acesso (Admin, Supervisor, User)
- ⚠️ Vinculação com setores
- ⚠️ Controle de status (Ativo, Inativo, Bloqueado)
- ⚠️ Histórico de acessos
- ❌ **Backend implementado, frontend usa dados mockados**

### ✅ **Configurações** (Parcialmente Integrado)
- ✅ **Configurações Gerais** (integrado)
- ✅ **Configurações de APIs** (integrado)
- ✅ **Configurações de Segurança** (integrado)
- ✅ **Configurações de Aparência** (integrado)
- ✅ **Configurações de Notificações** (integrado)
- ✅ **Configurações de Sistema** (integrado)
- ✅ Apenas Admin tem acesso
- ✅ **Dados persistidos** no banco de dados Oracle

---

### 🔐 Autenticação e Segurança (Implementado)
- ✅ **Autenticação JWT** via banco de dados Oracle 23ai
- ✅ **Senhas Padrão**: `Admin@123` (Admin) / `User@123` (Usuário Comum)
- ✅ **Bloqueio de conta** após 5 tentativas (30 minutos)
- ✅ **Troca obrigatória** de senha padrão no primeiro acesso
- ✅ **Rate limiting** e proteção contra ataques
- ✅ **Logs de auditoria** completos
- ✅ **Criptografia bcrypt** de senhas
- ❌ **LDAP não implementado** (planejado para versão futura)

## 🗄️ Documentação do Banco de Dados Oracle 23ai

### 📊 Informações Gerais

**Versão do Oracle**: 23.0.0.0.0  
**Character Set**: AL32UTF8  
**NLS Language**: AMERICAN  
**Tablespace**: USERS  
**Total de Tabelas**: 26 tabelas

---

### 📋 Estrutura de Tabelas

#### **1. USUARIOS** (1.954 registros)
Armazena informações completas dos usuários do sistema.

**Colunas Principais:**
- `ID` (NUMBER) - PK, Auto-increment
- `NOME` (VARCHAR2, 255) - Nome completo
- `E_MAIL` (VARCHAR2, 255) - Email único
- `CPF` (VARCHAR2, 20) - CPF único
- `SENHA` (VARCHAR2, 255) - Hash bcrypt
- `SENHA_ALTERADA` (VARCHAR2, 1) - 'S'/'N' - Indica se senha padrão foi alterada
- `ROLE` (VARCHAR2, 50) - Perfil: ADMIN, SUPERVISOR, USER
- `USUARIO_ATIVO` (VARCHAR2, 1) - Status ativo/inativo
- `SETOR_ID` (NUMBER) - FK para SETORES
- `MATRICULA` (VARCHAR2, 50) - Matrícula funcional
- `VINCULO_FUNCIONAL` (NUMBER) - Tipo de vínculo
- `BLOQUEADO_ATE` (VARCHAR2, 50) - Data/hora de desbloqueio
- `TENTATIVAS_LOGIN` (NUMBER) - Contador de tentativas
- `ULTIMO_LOGIN` (VARCHAR2, 50) - Data do último acesso

**Dados Pessoais:**
- `DATA_NASCIMENTO`, `PAI`, `MAE`, `RG`, `TIPO_RG`, `ORGAO_EXPEDITOR`, `UF_RG`
- `SEXO`, `ESTADO_CIVIL`, `TIPO_SANGUINEO`, `RACA_COR`, `PNE`

**Dados Funcionais:**
- `CARGO`, `CODIGO_CARGO`, `CATEGORIA`, `TIPO_VINCULO`
- `REGIME_JURIDICO`, `REGIME_PREVIDENCIARIO`, `FORMA_PROVIMENTO`
- `ESCOLARIDADE_CARGO`, `ESCOLARIDADE_SERVIDOR`
- `FORMACAO_PROFISSIONAL_1`, `FORMACAO_PROFISSIONAL_2`
- `JORNADA`, `NIVEL_REFERENCIA`, `COMISSAO_FUNÇAO`
- `DATA_INI_COMISSAO`, `DATA_ADMISSAO`

**Endereço:**
- `ENDERECO`, `NUMERO_ENDERECO`, `COMPLEMENTO_ENDERECO`
- `BAIRRO_ENDERECO`, `CIDADE_ENDERECO`, `UF_ENDERECO`, `CEP_ENDERECO`
- `TELEFONE`

**Dados Bancários:**
- `BANCO`, `AGENCIA`, `CONTA`, `PIX`

**Relacionamentos:**
- FK: `SETOR_ID` → SETORES(ID)

---

#### **2. ENCOMENDAS** (4 registros)
Gerencia encomendas e rastreamento com sistema de Hub.

**Colunas:**
- `ID` (NUMBER) - PK, Auto-increment
- `NUMERO_ENCOMENDA` (VARCHAR2, 50) - Código único de rastreamento
- `DESCRICAO` (CLOB) - Descrição completa
- `STATUS` (VARCHAR2, 20) - Default: 'PENDENTE'
  - Valores: POSTADO, EM_TRANSITO, ENTREGUE, DEVOLVIDO
- `QR_CODE` (CLOB) - JSON com todos os dados
- `CODIGO_BARRAS` (VARCHAR2, 100) - Código de barras
- `SETOR_ORIGEM_ID` (NUMBER) - FK para SETORES
- `SETOR_DESTINO_ID` (NUMBER) - FK para SETORES
- `USUARIO_ORIGEM_ID` (NUMBER) - Remetente (opcional)
- `USUARIO_DESTINO_ID` (NUMBER) - Destinatário (opcional)
- `URGENTE` (NUMBER) - 0=Normal, 1=Urgente
- `DATA_CRIACAO` (TIMESTAMP) - Auto
- `DATA_ATUALIZACAO` (TIMESTAMP) - Auto
- `DATA_ENTREGA` (TIMESTAMP) - Preenchido ao entregar
- `NUMERO_AR` (VARCHAR2, 50) - Aviso de Recebimento
- `LACRE_ID` (NUMBER) - FK para LACRE
- `MALOTE_ID` (NUMBER) - FK para MALOTE
- `ENCOMENDA_PAI_ID` (NUMBER) - FK para ENCOMENDAS (auto-referência)
- `SETOR_HUB` (VARCHAR2, 3) - 'SIM' se passa pelo Hub
- `SETOR_HUB_ID` (NUMBER) - FK para SETORES (Hub)

**Constraints:**
- `CHK_ENCOMENDAS_SETOR_DIFF`: Origem ≠ Destino
- UK: `NUMERO_ENCOMENDA` (único)

**Relacionamentos:**
- FK: `SETOR_ORIGEM_ID` → SETORES(ID)
- FK: `SETOR_DESTINO_ID` → SETORES(ID)
- FK: `SETOR_HUB_ID` → SETORES(ID)
- FK: `LACRE_ID` → LACRE(ID)
- FK: `MALOTE_ID` → MALOTE(ID)
- FK: `ENCOMENDA_PAI_ID` → ENCOMENDAS(ID)

---

#### **3. MALOTE** (44 registros)
Controla malotes físicos e sua disponibilidade.

**Colunas:**
- `ID` (NUMBER) - PK, Auto-increment
- `NUMERO_MALOTE` (VARCHAR2, 20) - Número do malote
- `NUMERO_CONTRATO` (VARCHAR2, 50) - Contrato dos Correios
- `NUMERO_PERCURSO` (VARCHAR2, 50) - Percurso
- `CODIGO_EMISSAO` (VARCHAR2, 50) - Código de emissão
- `DATA_EMISSAO` (DATE) - Data de emissão
- `DATA_VALIDADE` (DATE) - Validade do malote
- `CEP_ORIGEM` (VARCHAR2, 10) - CEP origem
- `CEP_DESTINO` (VARCHAR2, 10) - CEP destino
- `IDA` (NUMBER) - Indicador de ida
- `TAMANHO` (CHAR, 1) - P, M, G
- `DIAS_SERVICO` (VARCHAR2, 100) - Dias de serviço
- `ESTACAO` (VARCHAR2, 10) - Estação
- `DISTRITOS` (VARCHAR2, 10) - Distritos
- `ATIVO` (CHAR, 1) - 'S'/'N'
- `STATUS` (VARCHAR2, 20) - Default: 'Disponivel'
  - Valores: Disponivel, Indisponivel, Em transito
- `SETOR_ORIGEM_ID` (NUMBER) - FK para SETORES (NOT NULL)
- `SETOR_DESTINO_ID` (NUMBER) - FK para SETORES (NOT NULL)
- `ENCOMENDA_ID` (NUMBER) - FK para ENCOMENDAS
- `DATA_CRIACAO` (DATE) - Auto
- `DATA_ATUALIZACAO` (DATE) - Auto

**Constraints:**
- `CK_MALOTE_ATIVO`: ATIVO IN ('S', 'N')
- `CK_MALOTE_STATUS`: STATUS válido

**Relacionamentos:**
- FK: `SETOR_ORIGEM_ID` → SETORES(ID)
- FK: `SETOR_DESTINO_ID` → SETORES(ID)
- FK: `ENCOMENDA_ID` → ENCOMENDAS(ID)

---

#### **4. LACRE** (381 registros)
Controla lacres de segurança para malotes.

**Colunas:**
- `ID` (NUMBER) - PK, Auto-increment
- `CODIGO` (VARCHAR2, 32) - Código único do lacre
- `STATUS` (VARCHAR2, 20) - Status do lacre (NOT NULL)
  - Valores: DISPONIVEL, EM_USO, DESTRUIDO
- `SETOR_ID` (NUMBER) - FK para SETORES (proprietário)
- `ENCOMENDA_ID` (NUMBER) - FK para ENCOMENDAS
- `MALOTE_ID` (NUMBER) - FK para MALOTE
- `LOTE_NUMERO` (VARCHAR2, 20) - Número do lote
- `MOTIVO_DESTRUICAO` (VARCHAR2, 255) - Motivo se destruído
- `DATA_CRIACAO` (TIMESTAMP) - Auto (NOT NULL)
- `DATA_ATUALIZACAO` (TIMESTAMP) - Auto

**Constraints:**
- `CK_LACRE_STATUS`: STATUS válido
- UK: `CODIGO` (único)

**Relacionamentos:**
- FK: `SETOR_ID` → SETORES(ID)
- FK: `ENCOMENDA_ID` → ENCOMENDAS(ID)
- FK: `MALOTE_ID` → MALOTE(ID)

---

#### **5. SETORES** (287 registros)
Estrutura organizacional com geolocalização.

**Colunas:**
- `ID` (NUMBER) - PK, Auto-increment
- `CODIGO_SETOR` (VARCHAR2, 50) - Código único (NOT NULL)
- `NOME_SETOR` (VARCHAR2, 200) - Nome do setor (NOT NULL)
- `ORGAO` (VARCHAR2, 200) - Órgão vinculado
- `ATIVO` (CHAR, 1) - Default: 'S'
- `LOGRADOURO` (VARCHAR2, 200) - Endereço
- `NUMERO` (VARCHAR2, 20) - Número
- `COMPLEMENTO` (VARCHAR2, 100) - Complemento
- `BAIRRO` (VARCHAR2, 100) - Bairro
- `CIDADE` (VARCHAR2, 100) - Cidade
- `ESTADO` (VARCHAR2, 2) - UF
- `CEP` (VARCHAR2, 10) - CEP
- `TELEFONE` (VARCHAR2, 20) - Telefone
- `EMAIL` (VARCHAR2, 100) - Email
- `LATITUDE` (NUMBER) - Coordenada GPS
- `LONGITUDE` (NUMBER) - Coordenada GPS
- `DATA_CRIACAO` (TIMESTAMP) - Auto
- `DATA_ATUALIZACAO` (TIMESTAMP) - Auto

**Uso:**
- Base para sistema de Hub centralizador
- Geolocalização para mapas e rotas
- Controle de acesso por setor

---

#### **6. CONFIGURACOES** (27 registros)
Parâmetros de configuração do sistema.

**Colunas:**
- `ID` (NUMBER) - PK, Auto-increment
- `CHAVE` (VARCHAR2, 100) - Chave única (NOT NULL)
- `VALOR` (CLOB) - Valor da configuração
- `DESCRICAO` (VARCHAR2, 255) - Descrição
- `TIPO` (VARCHAR2, 50) - Default: 'STRING'
  - Tipos: STRING, NUMBER, BOOLEAN, JSON
- `CATEGORIA` (VARCHAR2, 50) - Categoria
  - Valores: geral, seguranca, notificacoes, sistema, aparencia, apis
- `OBRIGATORIA` (CHAR, 1) - Default: 'N'
- `EDITAVEL` (CHAR, 1) - Default: 'S'
- `ORDEM_EXIBICAO` (NUMBER) - Default: 0
- `ATIVO` (CHAR, 1) - Default: 'S'
- `USUARIO_CRIACAO_ID` (NUMBER) - Quem criou
- `USUARIO_ALTERACAO_ID` (NUMBER) - Quem alterou
- `DATA_CRIACAO` (TIMESTAMP) - Auto
- `DATA_ATUALIZACAO` (TIMESTAMP) - Auto

**Constraints:**
- UK: `CHAVE` (única)
- `CHK_CONFIG_ATIVO`: ATIVO IN ('S', 'N')
- `CHK_CONFIG_EDITAVEL`: EDITAVEL IN ('S', 'N')
- `CHK_CONFIG_OBRIGATORIA`: OBRIGATORIA IN ('S', 'N')

**Configuração Importante:**
- `HUB_SETOR_ID`: ID do setor Hub centralizador

---

#### **7. PROCESSOS**
Processos administrativos (estrutura legada).

**Colunas:**
- `ID` (NUMBER) - PK, Auto-increment
- `PROTOCOL_NUMBER` (VARCHAR2, 50) - Número do protocolo
- `TITLE` (VARCHAR2, 500) - Título
- `DESCRIPTION` (CLOB) - Descrição
- `REQUESTER_NAME` (VARCHAR2, 255) - Solicitante
- `REQUESTER_EMAIL` (VARCHAR2, 255) - Email
- `REQUESTER_PHONE` (VARCHAR2, 20) - Telefone
- `REQUESTER_DOCUMENT` (VARCHAR2, 20) - Documento
- `STATUS` (VARCHAR2, 50) - Default: 'PENDING'
- `PRIORITY` (VARCHAR2, 20) - Default: 'MEDIUM'
- `CATEGORY` (VARCHAR2, 100) - Categoria
- `DEPARTMENT` (VARCHAR2, 100) - Departamento
- `ASSIGNED_TO` (NUMBER) - Responsável
- `CREATED_BY` (NUMBER) - Criador (NOT NULL)
- `CREATED_AT` (TIMESTAMP) - Auto
- `UPDATED_AT` (TIMESTAMP) - Auto
- `DUE_DATE` (DATE) - Prazo
- `COMPLETED_AT` (TIMESTAMP) - Data conclusão

---

#### **8. DOCUMENTOS**
Gerenciamento de documentos e arquivos.

**Colunas:**
- `ID` (NUMBER) - PK, Auto-increment
- `NOME_ARQUIVO` (VARCHAR2, 255) - Nome do arquivo
- `CAMINHO_ARQUIVO` (VARCHAR2, 500) - Caminho no servidor
- `TIPO_ARQUIVO` (VARCHAR2, 50) - Tipo/extensão
- `TAMANHO_ARQUIVO` (NUMBER) - Tamanho em bytes
- `DATA_UPLOAD` (TIMESTAMP) - Auto
- `PROCESSO_ID` (NUMBER) - FK para PROCESSOS
- `USUARIO_ID` (NUMBER) - Quem fez upload

---

#### **9. PRAZOS**
Controle de prazos e vencimentos.

**Colunas:**
- `ID` (NUMBER) - PK, Auto-increment
- `DESCRICAO` (VARCHAR2, 255) - Descrição do prazo
- `DATA_INICIO` (DATE) - Data início
- `DATA_FIM` (DATE) - Data fim
- `STATUS` (VARCHAR2, 20) - Default: 'ATIVO'
- `PROCESSO_ID` (NUMBER) - FK para PROCESSOS
- `USUARIO_RESPONSAVEL_ID` (NUMBER) - Responsável
- `DATA_CRIACAO` (TIMESTAMP) - Auto

---

### 🔗 Relacionamentos Principais

```
SETORES (287)
    ↓ (1:N)
USUARIOS (1.954)
    ↓
ENCOMENDAS (4)
    ↓ (N:1)
MALOTE (44)
    ↓ (N:1)
LACRE (381)
```

**Fluxo de Encomendas:**
1. USUARIOS cria ENCOMENDAS
2. ENCOMENDAS vincula SETOR_ORIGEM e SETOR_DESTINO
3. ENCOMENDAS pode vincular MALOTE
4. ENCOMENDAS pode vincular LACRE
5. Sistema verifica se passa pelo HUB (SETOR_HUB_ID)

---

### 🔢 Sequences (Auto-increment)

O sistema utiliza **36 sequences** para geração automática de IDs:

**Principais:**
- `ISEQ$$_82760`: SETORES (próximo: 2.245)
- `ISEQ$$_95290`: LACRE (próximo: 3.121)
- `ISEQ$$_71781`: ENCOMENDAS (próximo: 391)
- `ISEQ$$_93027`: MALOTE (próximo: 149)
- `ISEQ$$_71775`: CONFIGURACOES (próximo: 230)

---

### 📊 Estatísticas de Uso

| Tabela | Registros | Última Análise |
|--------|-----------|----------------|
| USUARIOS | 1.954 | 03/12/2025 |
| SETORES | 287 | 29/11/2025 |
| LACRE | 381 | 02/12/2025 |
| MALOTE | 44 | 14/11/2025 |
| ENCOMENDAS | 4 | 02/12/2025 |
| CONFIGURACOES | 27 | 23/09/2025 |

---

### 🔐 Constraints e Validações

**Check Constraints:**
- Setores origem ≠ destino em ENCOMENDAS
- Status válidos em MALOTE, LACRE, ENCOMENDAS
- Flags S/N em campos ATIVO, EDITAVEL, OBRIGATORIA
- Tamanho de malote: P, M, G

**Unique Constraints:**
- USUARIOS: CPF, E_MAIL
- ENCOMENDAS: NUMERO_ENCOMENDA
- LACRE: CODIGO
- SETORES: CODIGO_SETOR, NOME_SETOR
- CONFIGURACOES: CHAVE

**Foreign Keys:**
- Todas com ON DELETE CASCADE onde apropriado
- Integridade referencial completa
- Relacionamentos circulares controlados

---

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

## 📋 Regras de Negócio Operacionais do Sistema

### 🎯 Visão Geral do Fluxo Operacional

O sistema implementa um fluxo completo de gestão de encomendas e malotes com regras específicas de visibilidade, disponibilidade e roteamento baseadas no perfil do usuário e no setor ao qual pertence.

---

### 👁️ Regras de Visualização por Perfil

#### **Administradores (ADMIN/ADMINISTRADOR)**
- ✅ Visualizam **TODAS** as encomendas do sistema
- ✅ Visualizam **TODOS** os malotes do sistema
- ✅ Visualizam **TODOS** os dados no mapa geral
- ✅ Sem restrições de setor

#### **Usuários Comuns (USER)**
- ⚠️ **Visualizam APENAS encomendas onde seu setor é origem OU destino**
- ⚠️ **Visualizam APENAS malotes onde seu setor é DESTINO (proprietário)**
- ⚠️ **No mapa, visualizam apenas malotes relacionados ao seu setor**
- ❌ **Usuários sem setor vinculado NÃO visualizam nada**

**Exemplo Prático:**
```
Usuário João - Setor: Delegacia de Palmas
- Vê encomendas: Palmas → Araguaína ✅
- Vê encomendas: Araguaína → Palmas ✅
- Vê encomendas: Gurupi → Araguaína ❌
- Vê malotes: Destino = Palmas ✅
- Vê malotes: Origem = Palmas, Destino = Araguaína ❌
```

---

### 📦 Regras de Criação de Encomendas

#### **Validações Obrigatórias**
1. **Remetente e Destinatário**:
   - Pelo menos um usuário OU setor deve ser informado para cada
   - Se ambos forem usuários, não podem ser o mesmo
   - Setores de origem e destino devem ser diferentes
   - Setores devem estar ativos (`ATIVO = 1`)

2. **Setores**:
   - Setor de origem é obrigatório
   - Setor de destino é obrigatório
   - Origem ≠ Destino

#### **Sistema de Hub Centralizador**
O sistema implementa um **Hub Centralizador** configurado em `CONFIGURACOES.HUB_SETOR_ID`:

**Regra de Roteamento:**
- Se **origem ≠ Hub** E **destino ≠ Hub**: encomenda passa pelo Hub
  - Primeira perna: Origem → Hub
  - Segunda perna: Hub → Destino Final
- Se **origem = Hub**: vai direto para o destino (segunda perna)
- Se **destino = Hub**: fica no Hub (primeira perna)

**Campos de Controle:**
- `SETOR_HUB`: 'SIM' ou 1 (indica passagem pelo Hub)
- `SETOR_HUB_ID`: ID do setor Hub

**Exemplo Prático:**
```
Hub = Palmas (ID: 1)

Encomenda: Gurupi → Araguaína
├─ Origem ≠ Hub (Gurupi ≠ Palmas)
├─ Destino ≠ Hub (Araguaína ≠ Palmas)
└─ Resultado: Gurupi → Palmas → Araguaína
   ├─ 1ª perna: Gurupi → Palmas (Hub)
   └─ 2ª perna: Palmas (Hub) → Araguaína

Encomenda: Palmas → Araguaína
├─ Origem = Hub (Palmas = Palmas)
└─ Resultado: Palmas → Araguaína (direto)

Encomenda: Gurupi → Palmas
├─ Destino = Hub (Palmas = Palmas)
└─ Resultado: Gurupi → Palmas (direto)
```

#### **Geração Automática de Dados**
- **Código de Rastreamento**: Único, com referências aos IDs de usuários e setores
- **QR Code**: JSON completo com todos os dados da encomenda
- **Código de Barras**: Baseado no código de rastreamento
- **Status Inicial**: Sempre `em_transito`

---

### 📮 Regras de Disponibilidade de Malotes

#### **Status de Disponibilidade**
Um malote pode estar em dois estados:

**1. Disponível**
- ✅ Não há encomenda vinculada OU
- ✅ Encomenda vinculada tem status `entregue`
- ✅ Campo `STATUS` do malote = 'Disponivel'

**2. Indisponível / Em Trânsito**
- ❌ Existe QUALQUER encomenda vinculada com status:
  - `em_transito`
  - `em_trânsito`
  - `postado`
  - `transito`
  - `pendente`
- ❌ Campo `STATUS` do malote ≠ 'Disponivel'

**Regra Global:**
- O status de disponibilidade é **independente do setor**
- Se uma encomenda está em trânsito, o malote fica indisponível para TODOS os setores
- Apenas quando a encomenda é entregue, o malote volta a ficar disponível

#### **Filtros de Consulta**
Ao consultar malotes por setor:
- **Sem parâmetro `status`**: Retorna apenas malotes `Disponivel`
- **Com `status=todos`**: Retorna todos os malotes (disponíveis e indisponíveis)
- **Com `status=disponivel`**: Retorna apenas disponíveis
- **Com `status=indisponivel`**: Retorna apenas indisponíveis

---

### 🗺️ Regras do Mapa de Malotes

#### **Visualização no Mapa**
O mapa exibe malotes com suas rotas de origem e destino:

**Administradores:**
- Visualizam todos os malotes do sistema
- Veem todas as rotas completas

**Usuários Comuns:**
- Visualizam apenas malotes onde:
  - Setor de origem = seu setor OU
  - Setor de destino = seu setor
- Veem apenas rotas relacionadas ao seu setor

**Dados Exibidos:**
- Origem: Nome, coordenadas (lat/long)
- Destino: Nome, coordenadas (lat/long), flag `dono: true`
- Localização Atual: Aproximação baseada no setor de destino
- Status: `emTransito` (boolean), `entregue` (boolean)

---

### 🔐 Regras de Lacres

#### **Vinculação com Encomendas**
- Lacre pode ser vinculado opcionalmente à encomenda
- Campo `LACRE_ID` na tabela ENCOMENDAS
- Campo `CODIGO_LACRE_MALOTE` armazena código do lacre

#### **Validação de Consistência**
Quando um lacre é informado:
1. ✅ Lacre deve existir na tabela LACRE
2. ✅ Setor do lacre (`LACRE.SETOR_ID`) deve ser igual ao setor de origem da encomenda
3. ❌ Se setores não coincidirem, encomenda é rejeitada

**Exemplo:**
```
Encomenda: Origem = Palmas (ID: 1)
Lacre informado: ID = 123

Validação:
SELECT SETOR_ID FROM LACRE WHERE ID = 123
Resultado: SETOR_ID = 1 (Palmas)

✅ Palmas = Palmas → Lacre aceito
❌ Palmas ≠ Araguaína → Lacre rejeitado
```

---

### 📮 Regras de Malotes

#### **Sistema de Hub para Malotes**
Malotes seguem a mesma lógica de Hub das encomendas:

**Ao Criar/Atualizar Malote:**
- Se **origem ≠ Hub** E **destino ≠ Hub**: destino é redirecionado para Hub
- Se **origem = Hub**: mantém destino informado (segunda perna)
- Se **destino = Hub**: mantém (primeira perna)

#### **Vinculação com Encomendas**
- Campo `MALOTE_ID` na tabela ENCOMENDAS
- Campo `NUMERO_MALOTE` armazena número do malote
- Malote pode ter múltiplas encomendas vinculadas

#### **Validação de Consistência**
Quando um malote é informado:
1. ✅ Malote deve existir na tabela MALOTE
2. ✅ Número do malote é obtido automaticamente se não informado

---

### 🎯 Regras de Recebimento de Encomendas

#### **Quem Pode Receber**
Uma encomenda pode ser recebida por:

**1. Usuário Destinatário**
- Se `USUARIO_DESTINO_ID` está preenchido
- Usuário deve pertencer ao setor de destino
- Usuário deve estar ativo

**2. Setor Destinatário**
- Se `USUARIO_DESTINO_ID` é NULL
- Qualquer usuário do setor de destino pode receber
- Setor deve estar ativo

**Validação no Recebimento:**
```sql
-- Verifica se usuário logado pode receber
WHERE (
  -- É o destinatário específico
  USUARIO_DESTINO_ID = :usuarioLogadoId
  OR
  -- Ou pertence ao setor de destino (quando não há destinatário específico)
  (USUARIO_DESTINO_ID IS NULL AND SETOR_DESTINO_ID = :setorUsuarioLogado)
)
```

#### **Mudança de Status no Recebimento**
Ao receber uma encomenda:
1. Status muda de `em_transito` para `entregue`
2. Campo `DATA_ENTREGA` é preenchido com SYSDATE
3. Se houver malote vinculado, status do malote volta para `Disponivel`

---

### 📊 Regras de Auditoria e Rastreamento

#### **QR Code Completo**
Cada encomenda gera um QR Code com:
- Código de rastreamento
- Remetente e destinatário (nomes)
- Setores de origem e destino
- Descrição da encomenda
- Data de postagem
- Código do lacre (se houver)
- Número do malote (se houver)
- Número do AR (se houver)
- Matrícula e vínculo funcional do remetente
- Matrícula e vínculo funcional do destinatário
- Endereços completos dos setores
- Flag de urgência
- Tipo e prioridade

#### **Rastreamento Completo**
- Código de rastreamento único por encomenda
- Código de barras para leitura rápida
- Histórico de status mantido no banco
- Geolocalização dos setores (lat/long)

---

### 🔄 Regras de Status e Transições

#### **Status de Encomendas**
```
postado → em_transito → entregue
                ↓
            devolvido
```

**Transições Permitidas:**
- `postado` → `em_transito`: Ao criar encomenda
- `em_transito` → `entregue`: Ao receber encomenda
- `em_transito` → `devolvido`: Quando não pode ser entregue
- `devolvido` → `em_transito`: Ao reenviar

#### **Status de Malotes**
```
Disponivel ⇄ Indisponivel / Em transito
```

**Transições Automáticas:**
- Malote fica `Indisponivel` quando encomenda é vinculada com status `em_transito`
- Malote volta para `Disponivel` quando encomenda é entregue
- Triggers no banco garantem sincronização automática

---

### 🚫 Restrições e Validações

#### **Encomendas**
- ❌ Remetente = Destinatário (se ambos usuários)
- ❌ Setor Origem = Setor Destino
- ❌ Lacre de setor diferente da origem
- ❌ Setores inativos
- ❌ Usuários inativos

#### **Malotes**
- ❌ Usar malote indisponível
- ❌ Vincular a setor inativo
- ❌ Malote sem número

#### **Visualização**
- ❌ Usuário sem setor não vê encomendas/malotes
- ❌ Usuário comum não vê encomendas de outros setores
- ❌ Usuário comum não vê malotes que não são do seu setor

---

## 📋 Regras de Negócio Técnicas Implementadas

### 🔐 Autenticação e Segurança

#### Autenticação
- **Método**: JWT (JSON Web Tokens) via banco de dados Oracle 23ai
- **LDAP**: ❌ Não implementado (planejado para versão futura)
- **Senhas Padrão por Perfil**:
  - `Admin@123` para perfil ADMIN/ADMINISTRADOR
  - `User@123` para perfil USER/USUÁRIO
- **Política de Senhas**:
  - Mínimo de 8 caracteres
  - Hash bcrypt com 10 salt rounds
  - Obrigatória troca de senha padrão no primeiro acesso
  - Campo `SENHA_ALTERADA` ('S'/'N') controla se senha foi alterada
- **Bloqueio de Conta**:
  - Máximo de 5 tentativas de login
  - Bloqueio de 30 minutos após exceder tentativas
  - Campo `BLOQUEADO_ATE` armazena data/hora do desbloqueio
- **Tokens**:
  - Token de acesso: validade de 24 horas
  - Refresh token: validade de 7 dias

#### Autorização e Perfis
- **Perfis de Usuário**:
  - `ADMIN/ADMINISTRADOR`: Acesso total ao sistema
  - `SUPERVISOR/COORDENADOR`: Permissões intermediárias
  - `USER`: Acesso básico limitado
- **Hierarquia de Permissões**:
  - Admin pode criar, editar, excluir qualquer registro
  - Supervisor pode gerenciar processos e usuários do seu setor
  - User pode apenas visualizar e criar registros próprios

### 👥 Gestão de Usuários

#### Validações de Cadastro
- **Campos Obrigatórios**:
  - Nome (mínimo 3 caracteres)
  - E-mail (formato válido e único)
  - CPF (formato válido e único)
- **Campos Opcionais Completos**:
  - Dados pessoais: RG, data nascimento, filiação, estado civil
  - Dados funcionais: matrícula, vínculo, cargo, escolaridade
  - Endereço completo: logradouro, número, complemento, bairro, cidade, UF, CEP
  - Dados previdenciários: PIS/PASEP, regime jurídico, regime previdenciário

#### Regras de Usuário
- **Ativação/Desativação**:
  - Usuário não pode desativar a si mesmo
  - Apenas Admin pode ativar/desativar usuários
  - Campo `USUARIO_ATIVO` (1=ativo, 0=inativo)
- **Alteração de Perfil**:
  - Apenas Admin pode alterar perfil de usuário
  - Ao alterar perfil, senha é resetada para padrão do novo perfil
  - Flag `SENHA_ALTERADA` volta para 'N'
- **Vinculação com Setor**:
  - Usuário pode estar vinculado a um setor (`SETOR_ID`)
  - Setor determina permissões de visualização de encomendas/malotes
  - Usuário sem setor (comum) não visualiza encomendas/malotes

### 📄 Gestão de Processos

#### Criação de Processos
- **Campos Obrigatórios**:
  - Assunto (mínimo 5 caracteres)
  - Tipo de processo (mínimo 2 caracteres)
  - Origem (setor de origem)
- **Geração Automática**:
  - Número do processo: formato `NNNNNN/AAAA` (sequencial por ano)
  - Data de abertura: SYSDATE
  - Status inicial: 'ABERTO'
  - Prioridade padrão: 'NORMAL'

#### Validações de Processo
- **Prioridades Válidas**: BAIXA, NORMAL, ALTA, URGENTE
- **Status Válidos**: ABERTO, EM_ANDAMENTO, SUSPENSO, CONCLUIDO, ARQUIVADO, CANCELADO
- **Regras de Data**:
  - Data de prazo não pode ser anterior à data de abertura
  - Data de conclusão é preenchida automaticamente ao concluir
- **Valor Estimado**: Não pode ser negativo

#### Tramitação de Processos
- **Regras de Tramitação**:
  - Não pode tramitar processo CONCLUIDO ou ARQUIVADO
  - Ao tramitar, status muda para 'EM_ANDAMENTO'
  - Histórico completo de tramitações é mantido
  - Setor atual é atualizado automaticamente
- **Permissões de Tramitação**:
  - Criador do processo pode tramitar
  - Responsável atual pode tramitar
  - Admin pode tramitar qualquer processo

#### Edição e Exclusão
- **Regras de Edição**:
  - Não pode editar processo CONCLUIDO ou ARQUIVADO
  - Apenas criador, responsável ou Admin podem editar
- **Regras de Exclusão**:
  - **Apenas Admin pode excluir processos**
  - Não pode excluir processo CONCLUIDO ou ARQUIVADO
  - Exclusão em cascata de anexos e tramitações

#### Processos Confidenciais
- **Visualização Restrita**:
  - Apenas criador, responsável ou Admin podem visualizar
  - Campo `CONFIDENCIAL` ('S'/'N')
  - Histórico também é restrito

### 📦 Gestão de Encomendas

#### Criação de Encomendas
- **Validações de Remetente/Destinatário**:
  - Pelo menos um (usuário ou setor) deve ser informado
  - Remetente e destinatário não podem ser o mesmo usuário
  - Setores de origem e destino devem ser diferentes
  - Setores devem estar ativos (`ATIVO = 1`)
- **Geração Automática**:
  - Código de rastreamento único com referências aos IDs
  - QR Code com todos os dados da encomenda
  - Código de barras baseado no código de rastreamento
  - Status inicial: 'em_transito'

#### Sistema de Hub Centralizador
- **Regra do Hub**:
  - Hub é definido em `CONFIGURACOES.HUB_SETOR_ID`
  - Se origem ≠ Hub e destino ≠ Hub, encomenda passa pelo Hub
  - Campos `SETOR_HUB` e `SETOR_HUB_ID` registram passagem pelo Hub
  - Primeira perna: origem → Hub
  - Segunda perna: Hub → destino final

#### Vinculação com Malote/Lacre
- **Validações de Consistência**:
  - Lacre informado deve existir e pertencer ao setor de origem
  - Malote informado deve existir
  - Número do malote é obtido automaticamente se não informado

#### Permissões de Visualização
- **Filtro por Setor**:
  - Admin vê todas as encomendas
  - Usuário comum vê apenas encomendas onde seu setor é origem ou destino
  - Usuário sem setor não vê encomendas

### 📮 Gestão de Malotes

#### Disponibilidade de Malotes
- **Regras de Status**:
  - Malote está "Indisponível" se houver QUALQUER encomenda vinculada com status em trânsito
  - Malote volta a "Disponível" quando encomenda vinculada tem status 'entregue'
  - Status independe do setor (global)
- **Filtros de Disponibilidade**:
  - Busca por setor (origem ou destino)
  - Status padrão ao filtrar por setor: 'Disponivel'
  - Parâmetro `status=todos` remove filtro de status

#### Sistema de Hub para Malotes
- **Regra do Hub**:
  - Se origem ≠ Hub e destino ≠ Hub, destino é redirecionado para Hub
  - Se origem = Hub, mantém destino informado (segunda perna)
  - Se destino = Hub, mantém (primeira perna)

#### Permissões de Visualização
- **Filtro por Setor**:
  - Admin vê todos os malotes
  - Usuário comum vê apenas malotes onde seu setor é destino (proprietário)
  - Usuário sem setor não vê malotes

### 🏢 Gestão de Setores

#### Estrutura de Setores
- **Hierarquia**:
  - Setores podem ter setor pai (`SETOR_PAI_ID`)
  - Estrutura hierárquica para organização
- **Campos Obrigatórios**:
  - Nome do setor (único)
  - Sigla (única)
- **Geolocalização**:
  - Latitude e longitude para mapeamento
  - Endereço completo: logradouro, número, complemento, bairro, cidade, estado, CEP
- **Status**:
  - Campo `ATIVO` (1=ativo, 0=inativo)
  - Apenas setores ativos aparecem em seleções

### 📊 Auditoria e Logs

#### Logs de Auditoria
- **Operações Registradas**:
  - INSERT, UPDATE, DELETE em todas as tabelas principais
  - Dados anteriores e novos (JSON)
  - Usuário responsável pela operação
  - IP e User-Agent
  - Data/hora da operação
- **Tabelas Auditadas**:
  - USUARIOS, PROCESSOS, TRAMITACOES, ENCOMENDAS, MALOTES, SETORES, DOCUMENTOS, PRAZOS

### 🔒 Constraints e Integridade Referencial

#### Chaves Estrangeiras
- **USUARIOS**:
  - `FK_USUARIOS_SETOR`: SETOR_ID → SETORES(ID)
  - `FK_USUARIOS_CRIADO_POR`: CRIADO_POR → USUARIOS(ID)
  - `FK_USUARIOS_ATUALIZADO_POR`: ATUALIZADO_POR → USUARIOS(ID)
- **PROCESSOS**:
  - `FK_PROCESSOS_RESPONSAVEL`: RESPONSAVEL_ID → USUARIOS(ID)
  - `FK_PROCESSOS_CRIADOR`: CRIADOR_ID → USUARIOS(ID)
  - `FK_PROCESSOS_TIPO_PROCESSO`: TIPO_PROCESSO_ID → TIPOS_PROCESSO(ID)
- **TRAMITACOES**:
  - `FK_TRAMITACOES_PROCESSO`: PROCESSO_ID → PROCESSOS(ID) ON DELETE CASCADE
  - `FK_TRAMITACOES_ORIGEM`: USUARIO_ORIGEM_ID → USUARIOS(ID)
  - `FK_TRAMITACOES_DESTINO`: USUARIO_DESTINO_ID → USUARIOS(ID)
- **ENCOMENDAS**:
  - `FK_ENCOMENDAS_SETOR_ORIGEM`: SETOR_ORIGEM_ID → SETORES(ID)
  - `FK_ENCOMENDAS_SETOR_DESTINO`: SETOR_DESTINO_ID → SETORES(ID)
- **ANEXOS**:
  - `FK_ANEXOS_PROCESSO`: PROCESSO_ID → PROCESSOS(ID) ON DELETE CASCADE
  - `FK_ANEXOS_TRAMITACAO`: TRAMITACAO_ID → TRAMITACOES(ID) ON DELETE CASCADE

#### Checks e Validações
- **USUARIOS**:
  - `PERFIL IN ('ADMIN', 'SUPERVISOR', 'USER')`
  - `STATUS IN ('ATIVO', 'INATIVO', 'BLOQUEADO')`
- **PROCESSOS**:
  - `PRIORIDADE IN ('BAIXA', 'NORMAL', 'ALTA', 'URGENTE')`
  - `STATUS IN ('ABERTO', 'EM_ANDAMENTO', 'PENDENTE', 'CONCLUIDO', 'ARQUIVADO', 'CANCELADO')`
  - `CONFIDENCIAL IN ('S', 'N')`
- **TRAMITACOES**:
  - `TIPO_TRAMITACAO IN ('ENCAMINHAMENTO', 'DEVOLUCAO', 'ARQUIVAMENTO', 'DESARQUIVAMENTO')`
  - `STATUS IN ('ENVIADO', 'RECEBIDO', 'REJEITADO')`
  - `URGENTE IN ('S', 'N')`
- **ENCOMENDAS**:
  - `STATUS IN ('POSTADO', 'EM_TRANSITO', 'ENTREGUE', 'DEVOLVIDO')`
- **SETORES**:
  - `ATIVO IN ('S', 'N')`

#### Triggers Automáticos
- **Auto Increment**: Triggers para gerar IDs automáticos usando sequences
- **Timestamps**: Triggers para atualizar `ATUALIZADO_EM` automaticamente
- **Status de Malote**: Triggers para propagar status de encomenda para malote
- **Validação de Prazos**: Trigger para marcar prazo como VENCIDO automaticamente

### 📝 Validações de Dados

#### Validações de Entrada
- **Sanitização**: Todos os inputs são sanitizados antes de processar
- **Validação de Email**: Formato RFC 5322
- **Validação de CPF**: Formato e dígitos verificadores
- **Validação de Data**: Formato ISO 8601 ou dd/MM/yyyy
- **Validação de Arquivo**:
  - Tipos permitidos: PDF, DOC, DOCX, JPG, JPEG, PNG
  - Tamanho máximo: 10MB (configurável)

#### Rate Limiting
- **Proteção contra Ataques**:
  - Janela de 15 minutos
  - Máximo de 100 requisições por IP (desenvolvimento)
  - Máximo de 50 requisições por IP (produção)

### 🔄 Regras de Negócio Específicas

#### Documentos
- **Níveis de Acesso**: PUBLICO, RESTRITO, CONFIDENCIAL
- **Versionamento**: Campo `VERSAO` para controle de versões
- **Status**: ATIVO, ARQUIVADO, EXCLUIDO

#### Prazos
- **Status Automático**: Trigger marca como VENCIDO se passou da data
- **Data de Conclusão**: Preenchida automaticamente ao concluir
- **Prioridades**: BAIXA, MEDIA, ALTA, URGENTE

#### Tipos de Processo
- **Prazo Padrão**: Cada tipo tem prazo padrão em dias
- **Requer Aprovação**: Flag indica se precisa aprovação
- **Status**: ATIVO/INATIVO para controlar tipos disponíveis

---

## 👨‍💻 Desenvolvedor

**Anderson Silva Dorneles**  
Analista de Sistemas  
📧 Email: [dornelesgpi@gmail.com](mailto:dornelesgpi@gmail.com)

Sistema desenvolvido para a **Secretaria da Fazenda do Estado do Tocantins (SEFAZ-TO)** com o objetivo de modernizar e digitalizar os processos de gestão de protocolo, encomendas e malotes.

---

**Versão**: 2.0.0
**Origem da Demanda**: Chamado n.º 15444  
**Última atualização**: Dezembro 2025  
**Banco de Dados**: Oracle 23ai  
**Autenticação**: JWT via Banco de Dados (LDAP não implementado)
