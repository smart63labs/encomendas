# 📡 Documentação das APIs REST - NovoProtocolo V2

## 🎯 **Visão Geral**

Documentação completa das APIs REST para migração do sistema mock para Oracle 19c.

**Base URL:** `http://localhost:3001/api`  
**Autenticação:** Bearer Token (JWT)  
**Content-Type:** `application/json`

---

## 🔐 **Autenticação**

### **POST /auth/login**
Realiza login no sistema

**Request:**
```json
{
  "email": "usuario@exemplo.com",
  "senha": "senha123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "nome": "João Silva",
      "email": "usuario@exemplo.com",
      "perfil": "admin"
    }
  }
}
```

### **POST /auth/logout**
Realiza logout do sistema

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

---

## 👥 **Módulo: Usuários**

### **GET /usuarios**
Lista todos os usuários

**Query Parameters:**
- `page` (number): Página (default: 1)
- `limit` (number): Itens por página (default: 10)
- `search` (string): Busca por nome ou email
- `perfil` (string): Filtro por perfil

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nome": "João Silva",
      "email": "joao@exemplo.com",
      "perfil": "admin",
      "ativo": true,
      "created_at": "2025-01-01T10:00:00Z",
      "updated_at": "2025-01-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### **GET /usuarios/:id**
Busca usuário por ID

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "perfil": "admin",
    "ativo": true,
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z"
  }
}
```

### **POST /usuarios**
Cria novo usuário

**Request:**
```json
{
  "nome": "Maria Santos",
  "email": "maria@exemplo.com",
  "senha": "senha123",
  "perfil": "usuario",
  "ativo": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "nome": "Maria Santos",
    "email": "maria@exemplo.com",
    "perfil": "usuario",
    "ativo": true,
    "created_at": "2025-01-01T11:00:00Z"
  }
}
```

### **PUT /usuarios/:id**
Atualiza usuário

**Request:**
```json
{
  "nome": "Maria Santos Silva",
  "email": "maria.silva@exemplo.com",
  "perfil": "admin",
  "ativo": true
}
```

### **DELETE /usuarios/:id**
Exclui usuário

**Response (200):**
```json
{
  "success": true,
  "message": "Usuário excluído com sucesso"
}
```

---

## 📋 **Módulo: Processos**

### **GET /processos**
Lista todos os processos

**Query Parameters:**
- `page`, `limit`, `search`
- `status` (string): Filtro por status
- `prioridade` (string): Filtro por prioridade
- `usuario_id` (number): Filtro por usuário

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "numero": "PROC-2025-001",
      "assunto": "Solicitação de Licença",
      "descricao": "Processo para solicitação de licença ambiental",
      "status": "em_andamento",
      "prioridade": "alta",
      "usuario_id": 1,
      "usuario_nome": "João Silva",
      "created_at": "2025-01-01T10:00:00Z",
      "updated_at": "2025-01-01T10:00:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

### **GET /processos/:id**
Busca processo por ID

### **POST /processos**
Cria novo processo

**Request:**
```json
{
  "numero": "PROC-2025-002",
  "assunto": "Novo Processo",
  "descricao": "Descrição do processo",
  "status": "aberto",
  "prioridade": "media",
  "usuario_id": 1
}
```

### **PUT /processos/:id**
Atualiza processo

### **DELETE /processos/:id**
Exclui processo

### **GET /processos/:id/documentos**
Lista documentos vinculados ao processo

### **POST /processos/:id/documentos**
Vincula documento ao processo

---

## 📄 **Módulo: Documentos**

### **GET /documentos**
Lista todos os documentos

**Query Parameters:**
- `page`, `limit`, `search`
- `tipo` (string): Filtro por tipo
- `categoria` (string): Filtro por categoria
- `processo_id` (number): Filtro por processo

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "titulo": "Documento Oficial",
      "tipo": "pdf",
      "categoria": "oficial",
      "arquivo_nome": "documento.pdf",
      "arquivo_path": "/uploads/documentos/documento.pdf",
      "arquivo_size": 1024000,
      "mime_type": "application/pdf",
      "versao": 1,
      "processo_id": 1,
      "usuario_id": 1,
      "created_at": "2025-01-01T10:00:00Z"
    }
  ],
  "pagination": { /* ... */ }
}
```

### **GET /documentos/:id**
Busca documento por ID

### **POST /documentos/upload**
Faz upload de documento

**Request:** `multipart/form-data`
- `file`: Arquivo
- `titulo`: Título do documento
- `tipo`: Tipo do documento
- `categoria`: Categoria
- `processo_id`: ID do processo (opcional)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "titulo": "Novo Documento",
    "arquivo_nome": "documento.pdf",
    "arquivo_path": "/uploads/documentos/documento.pdf",
    "arquivo_size": 1024000,
    "mime_type": "application/pdf"
  }
}
```

### **GET /documentos/:id/download**
Faz download do documento

**Response:** Arquivo binário

### **PUT /documentos/:id**
Atualiza metadados do documento

### **DELETE /documentos/:id**
Exclui documento

### **POST /documentos/:id/versao**
Cria nova versão do documento

---

## 🚚 **Módulo: Tramitação**

### **GET /tramitacao**
Lista todas as tramitações

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "processo_id": 1,
      "processo_numero": "PROC-2025-001",
      "origem": "Setor A",
      "destino": "Setor B",
      "observacoes": "Encaminhado para análise",
      "status": "enviado",
      "usuario_id": 1,
      "usuario_nome": "João Silva",
      "created_at": "2025-01-01T10:00:00Z"
    }
  ]
}
```

### **POST /tramitacao**
Cria nova tramitação

**Request:**
```json
{
  "processo_id": 1,
  "origem": "Setor A",
  "destino": "Setor B",
  "observacoes": "Observações da tramitação",
  "status": "enviado"
}
```

### **PUT /tramitacao/:id**
Atualiza tramitação

### **DELETE /tramitacao/:id**
Exclui tramitação

---

## 📦 **Módulo: Encomendas**

### **GET /encomendas**
Lista todas as encomendas

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "codigo": "ENC-2025-001",
      "descricao": "Material de escritório",
      "fornecedor": "Fornecedor ABC",
      "valor": 1500.00,
      "status": "pendente",
      "data_pedido": "2025-01-01",
      "data_entrega": "2025-01-15",
      "usuario_id": 1,
      "created_at": "2025-01-01T10:00:00Z"
    }
  ]
}
```

### **POST /encomendas**
Cria nova encomenda

**Request:**
```json
{
  "codigo": "ENC-2025-002",
  "descricao": "Equipamentos de TI",
  "fornecedor": "Tech Solutions",
  "valor": 5000.00,
  "status": "pendente",
  "data_pedido": "2025-01-02",
  "data_entrega": "2025-01-20"
}
```

### **PUT /encomendas/:id**
Atualiza encomenda

### **DELETE /encomendas/:id**
Exclui encomenda

---

## ⏰ **Módulo: Prazos**

### **GET /prazos**
Lista todos os prazos

**Query Parameters:**
- `status` (string): Filtro por status
- `prioridade` (string): Filtro por prioridade
- `data_inicio` (date): Filtro por data de início
- `data_fim` (date): Filtro por data de fim

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "titulo": "Prazo para Análise",
      "descricao": "Prazo para análise do processo",
      "data_inicio": "2025-01-01",
      "data_fim": "2025-01-15",
      "status": "ativo",
      "prioridade": "alta",
      "processo_id": 1,
      "usuario_id": 1,
      "created_at": "2025-01-01T10:00:00Z"
    }
  ]
}
```

### **POST /prazos**
Cria novo prazo

### **PUT /prazos/:id**
Atualiza prazo

### **DELETE /prazos/:id**
Exclui prazo

### **GET /prazos/vencendo**
Lista prazos próximos do vencimento

**Query Parameters:**
- `dias` (number): Dias para vencimento (default: 7)

---

## 📁 **Módulo: Arquivo**

### **GET /arquivo**
Lista todos os arquivos

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nome": "Relatório Mensal",
      "tipo": "pdf",
      "categoria": "relatorio",
      "tags": "mensal,financeiro,2025",
      "arquivo_path": "/uploads/arquivo/relatorio.pdf",
      "arquivo_size": 2048000,
      "mime_type": "application/pdf",
      "nivel_acesso": "publico",
      "usuario_id": 1,
      "created_at": "2025-01-01T10:00:00Z"
    }
  ]
}
```

### **POST /arquivo/upload**
Faz upload de arquivo

**Request:** `multipart/form-data`
- `file`: Arquivo
- `nome`: Nome do arquivo
- `tipo`: Tipo do arquivo
- `categoria`: Categoria
- `tags`: Tags (separadas por vírgula)
- `nivel_acesso`: Nível de acesso

### **GET /arquivo/:id/download**
Faz download do arquivo

### **PUT /arquivo/:id**
Atualiza metadados do arquivo

### **DELETE /arquivo/:id**
Exclui arquivo

---

## 📊 **Endpoints de Estatísticas**

### **GET /dashboard/stats**
Estatísticas gerais do sistema

**Response (200):**
```json
{
  "success": true,
  "data": {
    "processos": {
      "total": 150,
      "abertos": 45,
      "em_andamento": 80,
      "concluidos": 25
    },
    "documentos": {
      "total": 320,
      "por_tipo": {
        "pdf": 180,
        "doc": 90,
        "img": 50
      }
    },
    "tramitacao": {
      "total": 200,
      "pendentes": 15,
      "enviadas": 185
    },
    "encomendas": {
      "total": 75,
      "pendentes": 20,
      "entregues": 55
    },
    "prazos": {
      "total": 100,
      "vencendo": 8,
      "vencidos": 3
    }
  }
}
```

---

## 🔍 **Endpoints de Busca**

### **GET /search**
Busca global no sistema

**Query Parameters:**
- `q` (string): Termo de busca
- `modules` (string[]): Módulos para buscar
- `limit` (number): Limite de resultados

**Response (200):**
```json
{
  "success": true,
  "data": {
    "processos": [
      {
        "id": 1,
        "numero": "PROC-2025-001",
        "assunto": "Solicitação de Licença",
        "relevance": 0.95
      }
    ],
    "documentos": [
      {
        "id": 1,
        "titulo": "Documento Oficial",
        "tipo": "pdf",
        "relevance": 0.87
      }
    ],
    "total_results": 2
  }
}
```

---

## ❌ **Códigos de Erro**

### **Estrutura de Erro**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": {
      "field": "email",
      "message": "Email é obrigatório"
    }
  }
}
```

### **Códigos Comuns**
- `400` - Bad Request (dados inválidos)
- `401` - Unauthorized (não autenticado)
- `403` - Forbidden (sem permissão)
- `404` - Not Found (recurso não encontrado)
- `409` - Conflict (conflito de dados)
- `422` - Unprocessable Entity (validação falhou)
- `500` - Internal Server Error (erro interno)

---

## 🔧 **Configuração do Cliente**

### **Exemplo de Configuração Axios**
```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para erros
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 📝 **Notas de Implementação**

1. **Paginação:** Todos os endpoints de listagem suportam paginação
2. **Filtros:** Parâmetros de query para filtrar resultados
3. **Busca:** Busca textual em campos relevantes
4. **Upload:** Suporte a multipart/form-data para arquivos
5. **Versionamento:** API versionada (v1 implícito)
6. **Rate Limiting:** Implementar limitação de requisições
7. **Logs:** Registrar todas as operações para auditoria
8. **Validação:** Validar todos os inputs no backend
9. **Sanitização:** Sanitizar dados antes de salvar no banco
10. **Backup:** Implementar backup automático dos arquivos

---

**📡 Esta documentação serve como base para implementação completa das APIs REST do sistema NovoProtocolo V2.**