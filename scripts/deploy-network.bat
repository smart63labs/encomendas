@echo off
REM Script para deploy em rede local no Windows
REM Configura automaticamente os IPs para acesso externo

echo 🚀 Iniciando deploy para rede local...

REM Detectar IP da máquina
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set LOCAL_IP=%%b
        goto :found
    )
)
:found

echo 📍 IP detectado: %LOCAL_IP%

REM Atualizar arquivo .env
echo 📝 Atualizando configurações...
powershell -Command "(Get-Content .env) -replace 'VITE_API_URL=.*', 'VITE_API_URL=http://%LOCAL_IP%:3001/api' | Set-Content .env"

REM Atualizar docker-compose.yml
powershell -Command "(Get-Content docker-compose.yml) -replace 'VITE_API_URL=.*', 'VITE_API_URL=http://%LOCAL_IP%:3001/api' | Set-Content docker-compose.yml"

REM Atualizar backend .env
powershell -Command "(Get-Content backend\.env) -replace 'CORS_ORIGIN=.*', 'CORS_ORIGIN=http://localhost:8081,http://localhost:8082,http://localhost:3000,http://%LOCAL_IP%:8080,http://%LOCAL_IP%:3001' | Set-Content backend\.env"

echo ✅ Configurações atualizadas para IP: %LOCAL_IP%

REM Rebuild e restart dos containers
echo 🔄 Reconstruindo containers...
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo 🎉 Deploy concluído!
echo 🌐 Frontend disponível em: http://%LOCAL_IP%:8080
echo 🔗 Backend disponível em: http://%LOCAL_IP%:3001
echo 📚 Documentação: http://%LOCAL_IP%:3001/docs

pause