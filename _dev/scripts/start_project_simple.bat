@echo off
title NovoProtocolo - Inicializador

echo ================================================================
echo                     NOVO PROTOCOLO V2
echo                   Sistema de Encomendas
echo ================================================================
echo.
echo Iniciando servidores...
echo.

REM Iniciar backend
echo [1/2] Iniciando Backend (Porta 3001)...
start "Backend - NovoProtocolo" cmd /k "cd /d "%~dp0backend" && npx ts-node --transpile-only src/server.ts"

REM Aguardar um pouco
timeout /t 3 /nobreak >nul

REM Iniciar frontend
echo [2/2] Iniciando Frontend (Porta 8080)...
start "Frontend - NovoProtocolo" cmd /k "cd /d "%~dp0" && npx vite --host --port 8080"

echo.
echo ================================================================
echo                    SISTEMA INICIADO!
echo.
echo  Backend:  http://localhost:3001
echo  Frontend: http://localhost:8080
echo.
echo  Para parar os servidores, feche as janelas abertas
echo ================================================================
echo.
echo Pressione qualquer tecla para fechar...
pause >nul