# Solução para Acesso em Rede Local - Problema CORS

## Problema Identificado

Usuários externos acessando o sistema via `http://10.9.1.95:8080/` estavam recebendo erro de CORS:

```
Requisição cross-origin bloqueada: A diretiva Same Origin (mesma origem) não permite a leitura do recurso remoto em http://localhost:3001/api/users/login
```

## Causa do Problema

1. **Frontend configurado para localhost**: O arquivo `.env` estava configurado com `VITE_API_URL=http://localhost:3001/api`
2. **CORS restritivo**: O backend não estava permitindo requisições do IP da rede local
3. **Configuração estática**: Não havia configuração dinâmica para diferentes ambientes

## Soluções Implementadas

### 1. Configuração Dinâmica da API

Criado arquivo `src/config/api.config.ts` que:
- Detecta automaticamente o ambiente (local vs rede)
- Configura a URL da API baseada no hostname atual
- Permite override via variável de ambiente

### 2. Atualização das Configurações

**Frontend (.env):**
```env
VITE_API_URL=http://10.9.1.95:3001/api
```

**Backend (backend/.env):**
```env
CORS_ORIGIN=http://localhost:8081,http://localhost:8082,http://localhost:3000,http://10.9.1.95:8080,http://10.9.1.95:3001
```

**Docker Compose:**
```yaml
environment:
  - VITE_API_URL=http://10.9.1.95:3001/api
```

### 3. CORS Flexível no Backend

Atualizado `backend/src/app.ts` para:
- Aceitar IPs da rede local (10.x.x.x, 192.168.x.x, 172.16-31.x.x)
- Permitir portas comuns (3000, 3001, 8080, 8081, 8082, 8083, 8084)
- Log de origens bloqueadas para debug

### 4. Scripts de Deploy Automático

Criados scripts para configuração automática:
- `scripts/deploy-network.sh` (Linux/Mac)
- `scripts/deploy-network.bat` (Windows)

## Como Usar

### Opção 1: Deploy Automático (Recomendado)

**Windows:**
```cmd
scripts\deploy-network.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/deploy-network.sh
./scripts/deploy-network.sh
```

### Opção 2: Configuração Manual

1. **Descobrir o IP da máquina:**
   ```cmd
   ipconfig  # Windows
   hostname -I  # Linux
   ```

2. **Atualizar .env:**
   ```env
   VITE_API_URL=http://SEU_IP:3001/api
   ```

3. **Atualizar backend/.env:**
   ```env
   CORS_ORIGIN=http://localhost:8081,http://localhost:8082,http://localhost:3000,http://SEU_IP:8080,http://SEU_IP:3001
   ```

4. **Rebuild containers:**
   ```cmd
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

## Verificação

Após aplicar as correções:

1. **Acessar o sistema:** `http://10.9.1.95:8080/`
2. **Verificar console do navegador:** Não deve haver erros de CORS
3. **Testar login:** Deve funcionar normalmente
4. **Verificar logs do backend:** Deve mostrar requisições sendo aceitas

## Logs de Debug

Para monitorar requisições CORS:
```bash
docker-compose logs -f backend | grep CORS
```

## Configurações de Rede

O sistema agora aceita conexões de:
- `localhost` (desenvolvimento local)
- `127.0.0.1` (loopback)
- `10.x.x.x` (redes privadas classe A)
- `192.168.x.x` (redes privadas classe C)
- `172.16-31.x.x` (redes privadas classe B)

## Troubleshooting

### Problema: Ainda recebo erro de CORS
**Solução:** Verificar se o IP está correto e rebuild os containers

### Problema: Backend não aceita conexões
**Solução:** Verificar se o backend está configurado para `0.0.0.0:3001` (não apenas `localhost`)

### Problema: Frontend não encontra backend
**Solução:** Verificar se ambos os containers estão na mesma rede Docker

## Segurança

- CORS configurado apenas para IPs de rede local
- Não permite acesso de IPs externos à rede
- Logs de tentativas de acesso não autorizadas