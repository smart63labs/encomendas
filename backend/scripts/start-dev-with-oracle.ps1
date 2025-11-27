<#
Script: start-dev-with-oracle.ps1
Descrição: Script PowerShell para configurar variáveis de ambiente temporárias (Instant Client PATH,
ORACLE_CLIENT_LIB_DIR e credenciais) e iniciar o backend em modo desenvolvimento.
Uso: Execute no diretório `backend` com PowerShell (ex: .\scripts\start-dev-with-oracle.ps1)
#>
param(
  [string]$InstantClientPath = 'C:\oracle\instantclient_21_6',
  [string]$DbUser = 'protocolo_user',
  [string]$DbPassword = 'Protocolo@2025',
  [string]$DbConnect = 'localhost:1521/XEPDB1'
)

Write-Host "== Iniciando backend (modo dev) com configuração temporária do Oracle ==" -ForegroundColor Cyan

if (Test-Path $InstantClientPath) {
  Write-Host "Adicionando Instant Client ao PATH (sessão): $InstantClientPath" -ForegroundColor Green
  $env:PATH = $InstantClientPath + ';' + $env:PATH
  $env:ORACLE_CLIENT_LIB_DIR = $InstantClientPath
} else {
  Write-Host "ATENÇÃO: Instant Client não encontrado em $InstantClientPath" -ForegroundColor Yellow
  Write-Host "Se não tiver o Instant Client instalado, o app ainda pode rodar mas poderá ocorrer ORA-01804 ao setar timezone." -ForegroundColor Yellow
}

# Configurar credenciais temporárias na sessão
$env:DB_USER = $DbUser
$env:DB_PASSWORD = $DbPassword
$env:DB_CONNECT_STRING = $DbConnect

Write-Host "DB_USER=$DbUser" -ForegroundColor Gray
Write-Host "DB_CONNECT_STRING=$DbConnect" -ForegroundColor Gray

Write-Host "Executando: npm run dev" -ForegroundColor Cyan
npm run dev

Write-Host "== script finalizado (processo npm encerrado) ==" -ForegroundColor Cyan
