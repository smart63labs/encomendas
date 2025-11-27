@echo off
setlocal enabledelayedexpansion
color 0A
title NovoProtocolo - Inicializador

echo ================================================================
echo                     NOVO PROTOCOLO V2
echo                   Sistema de Encomendas
echo ================================================================
echo.

REM Verificar Node.js
echo [1/4] Verificando Node.js...
node --version >nul 2>&1
set NODE_CHECK=!errorlevel!
if !NODE_CHECK! neq 0 (
    echo [X] ERRO: Node.js nao encontrado!
    echo     Por favor, instale o Node.js em: https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js encontrado!

REM Verificar npm
echo [2/4] Verificando npm...
npm --version >nul 2>&1
set NPM_CHECK=!errorlevel!
if !NPM_CHECK! neq 0 (
    echo [X] ERRO: npm nao encontrado!
    pause
    exit /b 1
)
echo [OK] npm encontrado!

REM Verificar se os diretorios existem
echo [3/4] Verificando estrutura do projeto...
if not exist "backend" (
    echo [X] ERRO: Diretorio 'backend' nao encontrado!
    pause
    exit /b 1
)
if not exist "src" (
    echo [X] ERRO: Diretorio 'src' nao encontrado!
    pause
    exit /b 1
)
echo [OK] Estrutura do projeto OK!

REM Preparar ambiente
echo [4/4] Preparando ambiente...
echo [OK] Ambiente preparado!

echo.
echo [START] Iniciando servidores...
echo.

REM Iniciar backend
echo [BACKEND] Iniciando Backend (Porta 3001)...
start "Backend - NovoProtocolo" cmd /k "cd /d "%~dp0backend" && echo Servidor Backend iniciando... && npx ts-node --transpile-only src/server.ts"

REM Aguardar backend
echo [WAIT] Aguardando backend inicializar...
timeout /t 3 /nobreak >nul

REM Iniciar frontend
echo [FRONTEND] Iniciando Frontend (Porta 5173)...
start "Frontend - NovoProtocolo" cmd /k "cd /d "%~dp0" && echo Servidor Frontend iniciando... && npx vite --host --port 5173"

echo.
echo ================================================================
echo                    [OK] SISTEMA INICIADO!
echo.
echo  Backend:  http://localhost:3001
echo  Frontend: http://localhost:5173
echo.
echo  Para parar os servidores, feche as janelas abertas
echo ================================================================
echo.
echo Pressione qualquer tecla para fechar este inicializador...
pause >nul