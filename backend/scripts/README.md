# Scripts de Inicialização Automática - Novo Protocolo Backend

Este diretório contém scripts para resolver definitivamente o problema de conexão do backend após reiniciar o computador.

## 📁 Arquivos

### 1. `start-oracle-services.ps1`
**Função:** Inicia e configura automaticamente os serviços Oracle Database.

**O que faz:**
- Inicia o serviço Oracle Database (OracleServiceFREE)
- Inicia o Oracle Listener (OracleOraDB23Home1TNSListener)
- Configura o `local_listener` para usar localhost:1521
- Registra os serviços no listener
- Verifica o status dos serviços

**Como usar:**
```powershell
# Execute como Administrador
.\start-oracle-services.ps1
```

### 2. `start-backend.ps1`
**Função:** Inicia o backend após verificar se o Oracle está funcionando.

**O que faz:**
- Verifica a conexão com o Oracle Database
- Se o Oracle não estiver funcionando, executa o script de inicialização
- Verifica se o backend já está rodando na porta 3001
- Instala dependências se necessário
- Inicia o backend em modo desenvolvimento

**Como usar:**
```powershell
.\start-backend.ps1
```

### 3. `create-windows-service.ps1`
**Função:** Cria um serviço Windows para inicialização automática do backend.

**O que faz:**
- Cria um serviço Windows chamado "NovoProtocoloBackend"
- Configura o serviço para iniciar automaticamente com o Windows
- Define dependências dos serviços Oracle
- Configura ações de recuperação em caso de falha

**Como usar:**
```powershell
# Execute como Administrador
.\create-windows-service.ps1
```

## 🚀 Solução Definitiva - Passo a Passo

### Opção 1: Execução Manual (Recomendada para testes)

1. **Abra o PowerShell como Administrador**
2. **Execute o script de inicialização do Oracle:**
   ```powershell
   cd "C:\Users\88417646191\Documents\NovoProtocolo\V2\backend\scripts"
   .\start-oracle-services.ps1
   ```
3. **Execute o script de inicialização do backend:**
   ```powershell
   .\start-backend.ps1
   ```

### Opção 2: Serviço Windows (Solução Definitiva)

1. **Abra o PowerShell como Administrador**
2. **Execute o script de criação do serviço:**
   ```powershell
   cd "C:\Users\88417646191\Documents\NovoProtocolo\V2\backend\scripts"
   .\create-windows-service.ps1
   ```
3. **O serviço será criado e configurado para iniciar automaticamente**

## 🔧 Gerenciamento do Serviço Windows

### Verificar status do serviço:
```powershell
Get-Service -Name "NovoProtocoloBackend"
```

### Iniciar o serviço manualmente:
```powershell
Start-Service -Name "NovoProtocoloBackend"
```

### Parar o serviço:
```powershell
Stop-Service -Name "NovoProtocoloBackend"
```

### Remover o serviço:
```powershell
# Execute como Administrador
sc.exe delete "NovoProtocoloBackend"
```

### Abrir gerenciador de serviços:
```
services.msc
```

## 🛠️ Troubleshooting

### Problema: "Execution Policy"
Se aparecer erro de política de execução, execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Problema: Serviços Oracle não iniciam
1. Verifique se o Oracle Database está instalado corretamente
2. Execute o Windows Services (services.msc) e verifique:
   - OracleServiceFREE
   - OracleOraDB23Home1TNSListener

### Problema: Backend não conecta mesmo com Oracle rodando
1. Execute o teste de conexão:
   ```powershell
   cd "C:\Users\88417646191\Documents\NovoProtocolo\V2\backend"
   npm run test:db
   ```
2. Se falhar, execute o script de configuração do Oracle novamente

## 📋 Logs e Monitoramento

### Verificar logs do serviço Windows:
1. Abra o Event Viewer (eventvwr.msc)
2. Navegue para: Windows Logs > System
3. Filtre por fonte: Service Control Manager

### Verificar se o backend está rodando:
```powershell
netstat -ano | findstr :3001
```

## ✅ Benefícios da Solução

1. **Inicialização Automática:** O backend inicia automaticamente com o Windows
2. **Verificação de Dependências:** Verifica se o Oracle está funcionando antes de iniciar
3. **Recuperação Automática:** Reinicia automaticamente em caso de falha
4. **Logs Detalhados:** Fornece informações claras sobre o status de cada componente
5. **Fácil Gerenciamento:** Pode ser gerenciado através do Windows Services

## 🎯 Resultado Final

Após configurar o serviço Windows, o backend do Novo Protocolo será iniciado automaticamente sempre que o computador for reiniciado, resolvendo definitivamente o problema de conexão.
