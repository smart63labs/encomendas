# Guia de Configuração Docker e Kubernetes - NovoProtocolo

## Visão Geral

Este documento fornece instruções completas para configurar e executar o sistema NovoProtocolo usando Docker e Kubernetes. O sistema é composto por:

- **Frontend**: Aplicação React/Vite servida via Nginx
- **Backend**: API Node.js/TypeScript com Express
- **Banco de Dados**: Oracle Database Free

## 📋 Pré-requisitos

### Para Docker
- Docker Engine 20.10+
- Docker Compose 2.0+
- 8GB RAM disponível
- 20GB espaço em disco

### Para Kubernetes
- Kubernetes 1.24+
- kubectl configurado
- Helm 3.0+ (opcional)
- Ingress Controller (nginx-ingress)
- 16GB RAM disponível
- 50GB espaço em disco

## 🐳 Configuração Docker

### Estrutura de Arquivos Docker

```
NovoProtocolo/V2/
├── Dockerfile                    # Frontend Dockerfile
├── nginx.conf                   # Configuração Nginx
├── .dockerignore               # Exclusões Docker frontend
├── docker-compose.yml          # Produção
├── docker-compose.dev.yml      # Desenvolvimento
├── backend/
│   ├── Dockerfile              # Backend Dockerfile produção
│   ├── Dockerfile.dev          # Backend Dockerfile desenvolvimento
│   └── .dockerignore          # Exclusões Docker backend
└── k8s/                       # Arquivos Kubernetes
```

### Executando com Docker Compose

#### Ambiente de Desenvolvimento
```bash
# Clonar o repositório
git clone <repository-url>
cd NovoProtocolo/V2

# Executar em modo desenvolvimento (com hot reload)
docker-compose -f docker-compose.dev.yml up -d

# Verificar logs
docker-compose -f docker-compose.dev.yml logs -f

# Parar os serviços
docker-compose -f docker-compose.dev.yml down
```

#### Ambiente de Produção
```bash
# Build das imagens
docker-compose build

# Executar em produção
docker-compose up -d

# Verificar status
docker-compose ps

# Parar os serviços
docker-compose down
```

### Portas dos Serviços

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| Frontend | 8080 | Interface web |
| Backend | 3001 | API REST |
| Oracle DB | 1521 | Banco de dados |
| Oracle EM | 5500 | Enterprise Manager |

### Variáveis de Ambiente

#### Backend (.env)
```env
NODE_ENV=production
PORT=3001
DB_USER=protocolo_user
DB_PASSWORD=Anderline49
DB_CONNECT_STRING=localhost:1521/FREEPDB1
DB_HOST=oracle-db
DB_PORT=1521
DB_SERVICE_NAME=FREEPDB1
```

#### Frontend
```env
VITE_API_URL=http://localhost:3001/api
```

## ☸️ Configuração Kubernetes

### Estrutura de Arquivos Kubernetes

```
k8s/
├── namespace.yaml              # Namespace do projeto
├── configmap.yaml             # Configurações não-sensíveis
├── secrets.yaml               # Credenciais e dados sensíveis
├── oracle-deployment.yaml     # Deployment Oracle DB
├── backend-deployment.yaml    # Deployment Backend
├── frontend-deployment.yaml   # Deployment Frontend
├── ingress.yaml               # Exposição externa
├── kustomization.yaml         # Gerenciamento Kustomize
└── patches/
    └── production.yaml        # Configurações produção
```

### Deploy no Kubernetes

#### 1. Preparar Secrets
```bash
# Editar secrets.yaml com suas credenciais
kubectl apply -f k8s/secrets.yaml
```

#### 2. Deploy Completo
```bash
# Aplicar todos os recursos
kubectl apply -k k8s/

# Ou aplicar individualmente
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/oracle-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

#### 3. Verificar Deploy
```bash
# Status dos pods
kubectl get pods -n novoprotocolo

# Status dos serviços
kubectl get services -n novoprotocolo

# Logs do backend
kubectl logs -f deployment/backend-deployment -n novoprotocolo

# Logs do frontend
kubectl logs -f deployment/frontend-deployment -n novoprotocolo
```

### Configuração do Ingress

#### Produção
- **Host**: `novoprotocolo.sefaz.to.gov.br`
- **TLS**: Certificado Let's Encrypt
- **Paths**:
  - `/api/*` → Backend Service
  - `/*` → Frontend Service

#### Desenvolvimento
- **Host**: `novoprotocolo-dev.local`
- **TLS**: Não configurado
- **Paths**: Mesma estrutura da produção

### Scaling e Performance

#### Horizontal Pod Autoscaler (HPA)
```yaml
# Backend HPA
minReplicas: 2
maxReplicas: 10
CPU: 70%
Memory: 80%

# Frontend HPA
minReplicas: 3
maxReplicas: 10
CPU: 70%
Memory: 80%
```

#### Recursos por Pod

| Componente | CPU Request | CPU Limit | Memory Request | Memory Limit |
|------------|-------------|-----------|----------------|--------------|
| Backend | 200m | 500m | 512Mi | 1Gi |
| Frontend | 100m | 200m | 128Mi | 256Mi |
| Oracle DB | 1000m | 2000m | 2Gi | 4Gi |

## 🔧 Comandos Úteis

### Docker
```bash
# Build manual das imagens
docker build -t novoprotocolo/backend:latest ./backend
docker build -t novoprotocolo/frontend:latest .

# Executar apenas o banco
docker-compose up oracle-db

# Logs específicos
docker-compose logs backend
docker-compose logs frontend

# Limpar volumes
docker-compose down -v
```

### Kubernetes
```bash
# Escalar manualmente
kubectl scale deployment backend-deployment --replicas=5 -n novoprotocolo

# Port forward para debug
kubectl port-forward service/backend-service 3001:3001 -n novoprotocolo
kubectl port-forward service/frontend-service 8080:8080 -n novoprotocolo

# Executar comando no pod
kubectl exec -it deployment/backend-deployment -n novoprotocolo -- /bin/bash

# Reiniciar deployment
kubectl rollout restart deployment/backend-deployment -n novoprotocolo
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Oracle Database não inicia
```bash
# Verificar logs
docker logs <oracle-container-id>

# Verificar espaço em disco
df -h

# Recriar volume
docker-compose down -v
docker-compose up oracle-db
```

#### 2. Backend não conecta no banco
```bash
# Verificar conectividade
kubectl exec -it deployment/backend-deployment -n novoprotocolo -- nc -zv oracle-service 1521

# Verificar variáveis de ambiente
kubectl exec -it deployment/backend-deployment -n novoprotocolo -- env | grep DB_
```

#### 3. Frontend não carrega
```bash
# Verificar configuração Nginx
kubectl exec -it deployment/frontend-deployment -n novoprotocolo -- nginx -t

# Verificar logs
kubectl logs deployment/frontend-deployment -n novoprotocolo
```

### Health Checks

#### Backend
- **Endpoint**: `GET /health`
- **Timeout**: 5s
- **Interval**: 10s

#### Frontend
- **Endpoint**: `GET /health`
- **Timeout**: 3s
- **Interval**: 5s

#### Oracle
- **Command**: `sqlplus -s / as sysdba <<< "SELECT 1 FROM DUAL;"`
- **Timeout**: 10s
- **Interval**: 30s

## 📊 Monitoramento

### Métricas Importantes
- CPU e Memory usage por pod
- Latência das requisições HTTP
- Conexões ativas no banco
- Taxa de erro das APIs

### Logs Centralizados
- Backend: `/app/logs/`
- Frontend: Nginx access/error logs
- Oracle: `/opt/oracle/diag/`

## 🔒 Segurança

### Boas Práticas Implementadas
- Containers executam como usuário não-root
- Secrets separados das configurações
- Network policies para isolamento
- Resource limits configurados
- Health checks implementados
- TLS/SSL em produção

### Credenciais
- **Banco**: Armazenadas em Kubernetes Secrets
- **Certificados**: Gerenciados pelo cert-manager
- **Tokens**: Rotacionados automaticamente

## 📝 Próximos Passos

1. **CI/CD Pipeline**: Implementar GitLab CI ou GitHub Actions
2. **Monitoring**: Configurar Prometheus + Grafana
3. **Backup**: Automatizar backup do Oracle
4. **Disaster Recovery**: Plano de recuperação
5. **Performance**: Otimizações baseadas em métricas

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs dos containers/pods
2. Consultar este documento
3. Contatar a equipe de desenvolvimento

---

**Última atualização**: Outubro 2024  
**Versão**: 1.0.0