# Script para criar um serviço Windows para o backend
# Este script deve ser executado como Administrador

Write-Host "🔧 Configurando serviço Windows para o Backend..." -ForegroundColor Green

# Função para verificar se está rodando como administrador
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Administrator)) {
    Write-Host "❌ Este script deve ser executado como Administrador!" -ForegroundColor Red
    Write-Host "Clique com o botão direito no PowerShell e selecione 'Executar como administrador'" -ForegroundColor Yellow
    pause
    exit 1
}

$serviceName = "NovoProtocoloBackend"
$serviceDisplayName = "Novo Protocolo Backend Service"
$serviceDescription = "Serviço para inicialização automática do backend do Novo Protocolo"
$backendPath = "C:\Users\88417646191\Documents\NovoProtocolo\V2\backend"
$scriptPath = "$backendPath\scripts\start-backend.ps1"

try {
    # Verificar se o serviço já existe
    $existingService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    
    if ($existingService) {
        Write-Host "⚠️ Serviço '$serviceName' já existe. Removendo..." -ForegroundColor Yellow
        Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
        sc.exe delete $serviceName
        Start-Sleep -Seconds 3
    }
    
    # Criar arquivo batch para executar o PowerShell script
    $batchFile = "$backendPath\scripts\start-backend-service.bat"
    $batchContent = @"
@echo off
cd /d "$backendPath"
powershell.exe -ExecutionPolicy Bypass -File "$scriptPath"
"@
    
    Set-Content -Path $batchFile -Value $batchContent -Encoding ASCII
    
    Write-Host "📝 Arquivo batch criado: $batchFile" -ForegroundColor Cyan
    
    # Criar o serviço Windows
    Write-Host "🔧 Criando serviço Windows..." -ForegroundColor Yellow
    
    $serviceParams = @{
        Name = $serviceName
        BinaryPathName = "cmd.exe /c `"$batchFile`""
        DisplayName = $serviceDisplayName
        Description = $serviceDescription
        StartupType = "Automatic"
        Credential = $null
    }
    
    # Usar sc.exe para criar o serviço com mais controle
    $scCommand = "sc.exe create `"$serviceName`" binPath= `"cmd.exe /c \`"$batchFile\`"`" DisplayName= `"$serviceDisplayName`" start= auto"
    
    Write-Host "Executando: $scCommand" -ForegroundColor Cyan
    Invoke-Expression $scCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Serviço criado com sucesso!" -ForegroundColor Green
        
        # Configurar descrição do serviço
        sc.exe description $serviceName $serviceDescription
        
        # Configurar dependências do serviço (Oracle Database)
        Write-Host "🔗 Configurando dependências do serviço..." -ForegroundColor Yellow
        sc.exe config $serviceName depend= "OracleServiceFREE/OracleOraDB23Home1TNSListener"
        
        # Configurar ações de falha
        sc.exe failure $serviceName reset= 86400 actions= restart/30000/restart/60000/restart/120000
        
        Write-Host "🎉 Serviço '$serviceName' configurado com sucesso!" -ForegroundColor Green
        Write-Host "📋 Detalhes do serviço:" -ForegroundColor Cyan
        Write-Host "   Nome: $serviceName" -ForegroundColor White
        Write-Host "   Nome de exibição: $serviceDisplayName" -ForegroundColor White
        Write-Host "   Tipo de inicialização: Automático" -ForegroundColor White
        Write-Host "   Dependências: Oracle Database Services" -ForegroundColor White
        
        # Perguntar se deseja iniciar o serviço agora
        $startNow = Read-Host "Deseja iniciar o serviço agora? (s/n)"
        if ($startNow -eq "s" -or $startNow -eq "S") {
            Write-Host "🚀 Iniciando serviço..." -ForegroundColor Green
            Start-Service -Name $serviceName
            
            # Verificar status
            $service = Get-Service -Name $serviceName
            Write-Host "Status do serviço: $($service.Status)" -ForegroundColor Cyan
        }
        
    } else {
        Write-Host "❌ Falha ao criar o serviço. Código de saída: $LASTEXITCODE" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Erro ao configurar serviço: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📝 Instruções adicionais:" -ForegroundColor Yellow
Write-Host "1. O serviço será iniciado automaticamente quando o Windows iniciar" -ForegroundColor White
Write-Host "2. Para gerenciar o serviço, use: services.msc" -ForegroundColor White
Write-Host "3. Para remover o serviço: sc.exe delete $serviceName" -ForegroundColor White
Write-Host ""

Write-Host "Pressione qualquer tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")