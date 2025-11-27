# Guia de Deployment - NovoProtocolo

## 🚀 Estratégias de Deployment

### 1. Desenvolvimento Local

#### Usando Docker Compose
```bash
# Ambiente de desenvolvimento com hot reload
docker-compose -f docker-compose.dev.yml up -d

# Verificar status
docker-compose -f docker-compose.dev.yml ps

# Acessar aplicação
# Frontend: http://localhost:8080
# Backend: http://localhost:3001
# Oracle EM: http://localhost:5500
```

#### Usando npm/yarn (desenvolvimento tradicional)
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (em outro terminal)
npm install
npm run dev
```

### 2. Staging/Homologação

#### Docker Compose
```bash
# Build das imagens
docker-compose build

# Deploy em staging
docker-compose up -d

# Verificar logs
docker-compose logs -f
```

#### Kubernetes
```bash
# Aplicar configurações de staging
kubectl apply -k k8s/overlays/staging/

# Verificar deployment
kubectl get pods -n novoprotocolo-staging
```

### 3. Produção

#### Pré-requisitos
- [ ] Cluster Kubernetes configurado
- [ ] Ingress Controller instalado
- [ ] Cert-manager configurado
- [ ] DNS apontando para o cluster
- [ ] Backup do banco configurado

#### Deploy Kubernetes
```bash
# 1. Criar namespace
kubectl apply -f k8s/namespace.yaml

# 2. Aplicar secrets (editar antes)
kubectl apply -f k8s/secrets.yaml

# 3. Aplicar configurações
kubectl apply -f k8s/configmap.yaml

# 4. Deploy do banco de dados
kubectl apply -f k8s/oracle-deployment.yaml

# Aguardar banco estar pronto
kubectl wait --for=condition=ready pod -l app=novoprotocolo,component=database -n novoprotocolo --timeout=300s

# 5. Deploy do backend
kubectl apply -f k8s/backend-deployment.yaml

# Aguardar backend estar pronto
kubectl wait --for=condition=ready pod -l app=novoprotocolo,component=backend -n novoprotocolo --timeout=180s

# 6. Deploy do frontend
kubectl apply -f k8s/frontend-deployment.yaml

# 7. Configurar ingress
kubectl apply -f k8s/ingress.yaml

# Verificar status final
kubectl get all -n novoprotocolo
```

## 🔄 Estratégias de Atualização

### Rolling Update (Padrão)
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxUnavailable: 25%
    maxSurge: 25%
```

### Blue-Green Deployment
```bash
# 1. Deploy nova versão (green)
kubectl apply -f k8s/backend-deployment-green.yaml

# 2. Testar nova versão
kubectl port-forward service/backend-service-green 3001:3001 -n novoprotocolo

# 3. Trocar tráfego
kubectl patch service backend-service -n novoprotocolo -p '{"spec":{"selector":{"version":"green"}}}'

# 4. Remover versão antiga (blue)
kubectl delete deployment backend-deployment-blue -n novoprotocolo
```

### Canary Deployment
```bash
# 1. Deploy canary (10% do tráfego)
kubectl apply -f k8s/backend-deployment-canary.yaml

# 2. Monitorar métricas
kubectl top pods -n novoprotocolo

# 3. Aumentar tráfego gradualmente
kubectl scale deployment backend-deployment-canary --replicas=3 -n novoprotocolo
kubectl scale deployment backend-deployment --replicas=7 -n novoprotocolo

# 4. Finalizar canary
kubectl delete deployment backend-deployment -n novoprotocolo
kubectl patch deployment backend-deployment-canary -n novoprotocolo -p '{"metadata":{"name":"backend-deployment"}}'
```

## 🏗️ Build e CI/CD

### Build Manual das Imagens
```bash
# Backend
cd backend
docker build -t novoprotocolo/backend:v1.0.0 .
docker tag novoprotocolo/backend:v1.0.0 novoprotocolo/backend:latest

# Frontend
cd ..
docker build -t novoprotocolo/frontend:v1.0.0 .
docker tag novoprotocolo/frontend:v1.0.0 novoprotocolo/frontend:latest

# Push para registry
docker push novoprotocolo/backend:v1.0.0
docker push novoprotocolo/frontend:v1.0.0
```

### Pipeline GitLab CI (.gitlab-ci.yml)
```yaml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"

test:
  stage: test
  image: node:18
  script:
    - cd backend && npm ci && npm test
    - cd ../frontend && npm ci && npm test

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA ./backend
    - docker build -t $CI_REGISTRY_IMAGE/frontend:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA
    - docker push $CI_REGISTRY_IMAGE/frontend:$CI_COMMIT_SHA

deploy:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl set image deployment/backend-deployment backend=$CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA -n novoprotocolo
    - kubectl set image deployment/frontend-deployment frontend=$CI_REGISTRY_IMAGE/frontend:$CI_COMMIT_SHA -n novoprotocolo
    - kubectl rollout status deployment/backend-deployment -n novoprotocolo
    - kubectl rollout status deployment/frontend-deployment -n novoprotocolo
  only:
    - main
```

### Pipeline GitHub Actions (.github/workflows/deploy.yml)
```yaml
name: Deploy to Kubernetes

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm ci && npm test
      - run: npm ci && npm test

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and push Docker images
        run: |
          docker build -t ghcr.io/${{ github.repository }}/backend:${{ github.sha }} ./backend
          docker build -t ghcr.io/${{ github.repository }}/frontend:${{ github.sha }} .
          echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker push ghcr.io/${{ github.repository }}/backend:${{ github.sha }}
          docker push ghcr.io/${{ github.repository }}/frontend:${{ github.sha }}

      - name: Deploy to Kubernetes
        run: |
          echo "${{ secrets.KUBECONFIG }}" | base64 -d > kubeconfig
          export KUBECONFIG=kubeconfig
          kubectl set image deployment/backend-deployment backend=ghcr.io/${{ github.repository }}/backend:${{ github.sha }} -n novoprotocolo
          kubectl set image deployment/frontend-deployment frontend=ghcr.io/${{ github.repository }}/frontend:${{ github.sha }} -n novoprotocolo
```

## 🔍 Verificação de Deployment

### Health Checks
```bash
# Backend health
curl http://localhost:3001/health

# Frontend health
curl http://localhost:8080/health

# Kubernetes health checks
kubectl get pods -n novoprotocolo
kubectl describe pod <pod-name> -n novoprotocolo
```

### Testes de Integração
```bash
# Teste de conectividade backend -> banco
kubectl exec -it deployment/backend-deployment -n novoprotocolo -- npm run test:db

# Teste de API
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin_protocolo@sefaz.to.gov.br","password":"admin123"}'

# Teste frontend -> backend
curl http://localhost:8080/api/health
```

### Monitoramento Pós-Deploy
```bash
# Logs em tempo real
kubectl logs -f deployment/backend-deployment -n novoprotocolo
kubectl logs -f deployment/frontend-deployment -n novoprotocolo

# Métricas de recursos
kubectl top pods -n novoprotocolo
kubectl top nodes

# Status dos serviços
kubectl get services -n novoprotocolo
kubectl get ingress -n novoprotocolo
```

## 🔧 Configurações por Ambiente

### Desenvolvimento
```yaml
# docker-compose.dev.yml
environment:
  - NODE_ENV=development
  - DEBUG=true
  - LOG_LEVEL=debug
volumes:
  - ./backend:/app
  - ./src:/app/src
```

### Staging
```yaml
# k8s/overlays/staging/kustomization.yaml
resources:
  - ../../base
patchesStrategicMerge:
  - staging-patch.yaml
images:
  - name: novoprotocolo/backend
    newTag: staging
```

### Produção
```yaml
# k8s/overlays/production/kustomization.yaml
resources:
  - ../../base
patchesStrategicMerge:
  - production-patch.yaml
images:
  - name: novoprotocolo/backend
    newTag: v1.0.0
```

## 🚨 Rollback

### Docker Compose
```bash
# Parar serviços atuais
docker-compose down

# Usar imagem anterior
docker-compose up -d
```

### Kubernetes
```bash
# Rollback automático
kubectl rollout undo deployment/backend-deployment -n novoprotocolo
kubectl rollout undo deployment/frontend-deployment -n novoprotocolo

# Rollback para versão específica
kubectl rollout history deployment/backend-deployment -n novoprotocolo
kubectl rollout undo deployment/backend-deployment --to-revision=2 -n novoprotocolo

# Verificar status do rollback
kubectl rollout status deployment/backend-deployment -n novoprotocolo
```

## 📊 Métricas de Deployment

### KPIs Importantes
- **Deployment Time**: < 5 minutos
- **Downtime**: 0 segundos (rolling update)
- **Success Rate**: > 99%
- **Rollback Time**: < 2 minutos

### Alertas
- Pod restart > 3 vezes em 10 minutos
- CPU usage > 80% por 5 minutos
- Memory usage > 90% por 2 minutos
- Response time > 2 segundos

## 🔒 Segurança no Deployment

### Checklist de Segurança
- [ ] Secrets não expostos em logs
- [ ] Containers executam como non-root
- [ ] Network policies aplicadas
- [ ] Resource limits configurados
- [ ] Imagens escaneadas por vulnerabilidades
- [ ] TLS/SSL configurado
- [ ] RBAC configurado

### Scan de Vulnerabilidades
```bash
# Trivy scan
trivy image novoprotocolo/backend:latest
trivy image novoprotocolo/frontend:latest

# Snyk scan
snyk container test novoprotocolo/backend:latest
snyk container test novoprotocolo/frontend:latest
```

---

**Última atualização**: Outubro 2024  
**Versão**: 1.0.0