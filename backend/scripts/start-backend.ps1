# Script para inicializar automaticamente o backend
# Este script verifica se o Oracle está funcionando e inicia o backend

Write-Host "🚀 Iniciando Backend do Novo Protocolo..." -ForegroundColor Green

# Navegar para o diretório do backend
$backendPath = "C:\Users\88417646191\Documents\NovoProtocolo\V2\backend"
Set-Location $backendPath

Write-Host "📍 Diretório atual: $backendPath" -ForegroundColor Cyan

try {
    # Verificar se o Oracle Database está funcionando
    Write-Host "🔍 Verificando conexão com Oracle Database..." -ForegroundColor Yellow
    
    $testResult = npm run test:db 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Oracle Database está funcionando!" -ForegroundColor Green
        
        # Verificar se já existe um processo do backend rodando na porta 3001
        $existingProcess = netstat -ano | findstr :3001
        
        if ($existingProcess) {
            Write-Host "⚠️ Backend já está rodando na porta 3001" -ForegroundColor Yellow
            Write-Host "Processos encontrados:" -ForegroundColor Cyan
            Write-Host $existingProcess -ForegroundColor White
        } else {
            Write-Host "🚀 Iniciando servidor backend..." -ForegroundColor Green
            
            # Instalar dependências se necessário
            if (-not (Test-Path "node_modules")) {
                Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
                npm install
            }
            
            # Iniciar o backend em modo desenvolvimento
            Write-Host "🔥 Iniciando backend em modo desenvolvimento..." -ForegroundColor Green
            Write-Host "Backend será executado em: http://localhost:3001" -ForegroundColor Cyan
            Write-Host "Para parar o servidor, pressione Ctrl+C" -ForegroundColor Yellow
            
            npm run dev
        }
        
    } else {
        Write-Host "❌ Falha na conexão com Oracle Database!" -ForegroundColor Red
        Write-Host "Executando script de inicialização do Oracle..." -ForegroundColor Yellow
        
        # Executar script de inicialização do Oracle
        & "$backendPath\scripts\start-oracle-services.ps1"
        
        # Aguardar um pouco e tentar novamente
        Start-Sleep -Seconds 10
        
        Write-Host "🔄 Tentando conectar novamente..." -ForegroundColor Yellow
        $testResult2 = npm run test:db 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Oracle Database agora está funcionando!" -ForegroundColor Green
            Write-Host "🚀 Iniciando servidor backend..." -ForegroundColor Green
            npm run dev
        } else {
            Write-Host "❌ Não foi possível estabelecer conexão com o Oracle Database" -ForegroundColor Red
            Write-Host "Verifique se o Oracle está instalado e configurado corretamente." -ForegroundColor Yellow
            Write-Host "Detalhes do erro:" -ForegroundColor Red
            Write-Host $testResult2 -ForegroundColor White
        }
    }
    
} catch {
    Write-Host "❌ Erro ao inicializar backend: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Pressione qualquer tecla para sair..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")