# 📋 Planejamento Inicial - Sistema NovoProtocolo V2

## 🎯 **Visão Geral do Projeto**

O **NovoProtocolo V2** é um sistema de gestão de protocolos governamentais desenvolvido para o **Governo do Tocantins**, com o objetivo de modernizar e digitalizar os processos administrativos, substituindo sistemas legados por uma solução web moderna e eficiente.

---

## 🏛️ **Contexto Governamental**

### **Órgão:** Governo do Estado do Tocantins
### **Secretaria:** SEFAZ (Secretaria da Fazenda)
### **Finalidade:** Gestão digital de protocolos e processos administrativos

---

## 🎯 **Objetivos do Projeto**

### **Objetivo Principal**
Desenvolver um sistema web completo para gestão de protocolos governamentais, integrando todos os módulos necessários para o controle eficiente de processos administrativos.

### **Objetivos Específicos**
1. **Digitalização Completa**: Eliminar processos manuais e papéis
2. **Centralização**: Unificar todos os módulos em uma única plataforma
3. **Rastreabilidade**: Controle total do ciclo de vida dos processos
4. **Eficiência**: Reduzir tempo de tramitação e processamento
5. **Transparência**: Facilitar acompanhamento e auditoria
6. **Segurança**: Garantir integridade e confidencialidade dos dados

---

## 🏗️ **Arquitetura Planejada**

### **Stack Tecnológica**

#### **Frontend**
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Estilização:** Tailwind CSS + shadcn/ui
- **Roteamento:** React Router DOM
- **Estado:** TanStack Query + React Context
- **Formulários:** React Hook Form
- **Notificações:** Sonner + Radix UI

#### **Backend (Planejado)**
- **Runtime:** Node.js 18+
- **Framework:** Express.js ou Fastify
- **Banco de Dados:** Oracle 19c
- **ORM/Query Builder:** Knex.js ou TypeORM
- **Driver:** node-oracledb
- **Autenticação:** JWT + bcrypt
- **Validação:** Joi ou Zod
- **Documentação:** Swagger/OpenAPI

#### **Infraestrutura**
- **Banco:** Oracle 21ai (Oracle 21c AI)
- **Host:** localhost (desenvolvimento)
- **Port:** 1521
- **Service Name:** FREEPDB1
- **Usuário da aplicação:** protocolo_user
- **Authentication:** Oracle Database Native

---

## 📊 **Módulos Planejados**

### **1. Dashboard Principal**
- **Funcionalidade:** Visão geral do sistema
- **Componentes:** Cards de estatísticas, ações rápidas, atividades recentes
- **Layout:** Grid responsivo com métricas em tempo real

### **2. Gestão de Processos**
- **Funcionalidade:** CRUD completo de processos administrativos
- **Recursos:** Numeração automática, controle de status, prioridades
- **Integração:** Vinculação com documentos e tramitação

### **3. Gestão de Documentos**
- **Funcionalidade:** Upload, versionamento e controle de documentos
- **Recursos:** Visualizador integrado, categorização, metadados
- **Suporte:** PDF, imagens, documentos de texto

### **4. Sistema de Tramitação**
- **Funcionalidade:** Controle de fluxo de processos entre setores
- **Recursos:** Origem/destino, observações, histórico completo
- **Workflow:** Aprovações em cascata, notificações automáticas

### **5. Gestão de Encomendas**
- **Funcionalidade:** Controle de encomendas e pedidos
- **Recursos:** Rastreamento, códigos únicos, integração com Correios
- **Relatórios:** Status de entrega, fornecedores, valores

### **6. Controle de Prazos**
- **Funcionalidade:** Gestão de prazos e vencimentos
- **Recursos:** Calendário interativo, alertas automáticos
- **Notificações:** Email/SMS para vencimentos próximos

### **7. Sistema de Arquivo**
- **Funcionalidade:** Arquivamento digital de documentos
- **Recursos:** Busca avançada, categorização, níveis de acesso
- **Organização:** Pastas virtuais, tags, indexação

### **8. Gestão de Usuários**
- **Funcionalidade:** Controle de usuários e permissões
- **Recursos:** Perfis personalizados, grupos, hierarquias
- **Integração:** LDAP/Active Directory (futuro)

### **9. Configurações do Sistema**
- **Funcionalidade:** Configurações gerais, notificações, integrações
- **Recursos:** Backup automático, logs de auditoria

---

## 🗄️ **Modelagem de Dados Planejada**

### **Tabelas Principais**

#### **USUARIOS**
```sql
- id (NUMBER, PK, IDENTITY)
- nome (VARCHAR2(100))
- email (VARCHAR2(100), UNIQUE)
- senha (VARCHAR2(255))
- perfil (VARCHAR2(50))
- ativo (NUMBER(1))
- created_at, updated_at (TIMESTAMP)
```

#### **PROCESSOS**
```sql
- id (NUMBER, PK, IDENTITY)
- numero (VARCHAR2(50), UNIQUE)
- assunto (VARCHAR2(255))
- descricao (CLOB)
- status, prioridade (VARCHAR2)
- usuario_id (FK)
- created_at, updated_at (TIMESTAMP)
```

#### **DOCUMENTOS**
```sql
- id (NUMBER, PK, IDENTITY)
- titulo (VARCHAR2(255))
- tipo, categoria (VARCHAR2)
- arquivo_nome, arquivo_path (VARCHAR2)
- arquivo_size (NUMBER)
- mime_type (VARCHAR2(100))
- versao (NUMBER)
- processo_id, usuario_id (FK)
- created_at, updated_at (TIMESTAMP)
```

#### **TRAMITACAO**
```sql
- id (NUMBER, PK, IDENTITY)
- processo_id (FK)
- origem, destino (VARCHAR2(100))
- observacoes (CLOB)
- status (VARCHAR2(50))
- usuario_id (FK)
- created_at, updated_at (TIMESTAMP)
```

#### **ENCOMENDAS**
```sql
- id (NUMBER, PK, IDENTITY)
- codigo (VARCHAR2(50), UNIQUE)
- descricao (VARCHAR2(255))
- fornecedor (VARCHAR2(100))
- valor (NUMBER(10,2))
- status (VARCHAR2(50))
- data_pedido, data_entrega (DATE)
- usuario_id (FK)
- created_at, updated_at (TIMESTAMP)
```

#### **PRAZOS**
```sql
- id (NUMBER, PK, IDENTITY)
- titulo (VARCHAR2(255))
- descricao (CLOB)
- data_inicio, data_fim (DATE)
- status, prioridade (VARCHAR2)
- processo_id, usuario_id (FK)
- created_at, updated_at (TIMESTAMP)
```

#### **ARQUIVO**
```sql
- id (NUMBER, PK, IDENTITY)
- nome (VARCHAR2(255))
- tipo, categoria (VARCHAR2)
- tags (VARCHAR2(500))
- arquivo_path (VARCHAR2(500))
- arquivo_size (NUMBER)
- mime_type (VARCHAR2(100))
- nivel_acesso (VARCHAR2(50))
- usuario_id (FK)
- created_at, updated_at (TIMESTAMP)
```

---

## 📋 **Plano de Execução Original**

### **Fase 1: Preparação (5 dias)**
- Configuração do ambiente Oracle 19c
- Estruturação do projeto backend
- Configuração de dependências

### **Fase 2: Modelagem (3 dias)**
- Criação das tabelas no Oracle
- Definição de índices e constraints
- Triggers para auditoria

### **Fase 3: Backend APIs (10 dias)**
- Desenvolvimento das APIs REST
- Implementação da autenticação JWT
- Testes de integração com Oracle

### **Fase 4: Frontend (15 dias)**
- Desenvolvimento dos componentes React
- Integração com as APIs
- Implementação da interface de usuário

### **Fase 5: Integração (5 dias)**
- Testes de integração completa
- Ajustes de performance
- Validações de segurança

### **Fase 6: Deploy (3 dias)**
- Configuração do ambiente de produção
- Deploy da aplicação
- Testes finais

---

## 🔐 **Requisitos de Segurança**

### **Autenticação**
- Login via credenciais locais
- Integração futura com LDAP/Active Directory
- Tokens JWT com expiração
- Recuperação de senha via email

### **Autorização**
- Controle de acesso baseado em perfis
- Permissões granulares por módulo
- Hierarquia de usuários
- Logs de auditoria

### **Dados**
- Criptografia de senhas (bcrypt)
- Validação de entrada (sanitização)
- Backup automático
- Controle de versão de documentos

---

## 📊 **Métricas de Sucesso**

### **Performance**
- Tempo de resposta < 2 segundos
- Suporte a 100+ usuários simultâneos
- Disponibilidade > 99%

### **Usabilidade**
- Interface intuitiva e responsiva
- Tempo de treinamento < 2 horas
- Taxa de adoção > 90%

### **Funcionalidade**
- 100% dos processos digitalizados
- Redução de 70% no tempo de tramitação
- Eliminação de 95% do uso de papel

---

## 🚀 **Próximos Passos**

1. **Aprovação do Planejamento**: Validação com stakeholders
2. **Configuração do Ambiente**: Setup Oracle 19c completo
3. **Início do Desenvolvimento**: Backend APIs prioritárias
4. **Testes Piloto**: Validação com usuários reais
5. **Deploy Gradual**: Implementação por módulos

---

## 📞 **Equipe e Responsabilidades**

### **Desenvolvimento**
- **Frontend:** React/TypeScript Developer
- **Backend:** Node.js/Oracle Developer
- **DevOps:** Infraestrutura e Deploy

### **Gestão**
- **Product Owner:** Definição de requisitos
- **Scrum Master:** Gestão do projeto
- **QA:** Testes e validação

---

*Documento criado em: Janeiro 2025*  
*Versão: 1.0*  
*Status: Planejamento Inicial*