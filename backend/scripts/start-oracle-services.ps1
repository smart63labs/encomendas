# Script para inicializar automaticamente os serviços Oracle
# Este script deve ser executado como Administrador

Write-Host "🚀 Iniciando serviços Oracle..." -ForegroundColor Green

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

try {
    # Iniciar serviço Oracle Database
    Write-Host "📊 Iniciando Oracle Database Service..." -ForegroundColor Yellow
    Start-Service -Name "OracleServiceFREE" -ErrorAction SilentlyContinue
    
    # Aguardar um pouco para o serviço inicializar
    Start-Sleep -Seconds 10
    
    # Iniciar Oracle Listener
    Write-Host "🔗 Iniciando Oracle Listener..." -ForegroundColor Yellow
    Start-Service -Name "OracleOraDB23Home1TNSListener" -ErrorAction SilentlyContinue
    
    # Aguardar um pouco para o listener inicializar
    Start-Sleep -Seconds 5
    
    # Configurar o local_listener e registrar serviços
    Write-Host "⚙️ Configurando listener Oracle..." -ForegroundColor Yellow
    
    $sqlCommands = @"
alter system set local_listener='(ADDRESS=(PROTOCOL=TCP)(HOST=localhost)(PORT=1521))';
alter system register;
exit;
"@
    
    $sqlCommands | sqlplus / as sysdba
    
    Write-Host "✅ Serviços Oracle iniciados com sucesso!" -ForegroundColor Green
    Write-Host "🔍 Verificando status dos serviços..." -ForegroundColor Cyan
    
    # Verificar status dos serviços
    Get-Service -Name "OracleServiceFREE", "OracleOraDB23Home1TNSListener" | Format-Table Name, Status
    
    Write-Host "🎉 Configuração concluída! O Oracle Database está pronto para uso." -ForegroundColor Green
    
} catch {
    Write-Host "❌ Erro ao inicializar serviços Oracle: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Verifique se o Oracle Database está instalado corretamente." -ForegroundColor Yellow
}

Write-Host "Pressione qualquer tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")