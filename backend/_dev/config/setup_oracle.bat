@echo off
chcp 65001 > nul
echo ========================================
echo 🗄️ SETUP AUTOMÁTICO DO ORACLE
echo Sistema de Protocolo
echo ========================================
echo.

echo 📋 Este script irá:
echo   1. Conectar no Oracle como SYSDBA
echo   2. Criar tablespace PROTOCOLO_DATA
echo   3. Criar usuário protocolo_user
echo   4. Configurar todas as permissões
echo   5. Atualizar arquivo .env
echo.

echo ⚠️  IMPORTANTE:
echo   - Certifique-se que o Oracle está rodando
echo   - Você precisará da senha do usuário SYS
echo   - Execute este script como Administrador
echo.

pause

echo.
echo 🔍 Verificando se o Oracle está rodando...
sc query OracleServiceXE | find "RUNNING" > nul
if %errorlevel% neq 0 (
    echo ❌ Serviço Oracle não está rodando!
    echo 💡 Iniciando serviço Oracle...
    net start OracleServiceXE
    timeout /t 5 > nul
)

sc query OracleXETNSListener | find "RUNNING" > nul
if %errorlevel% neq 0 (
    echo 💡 Iniciando listener Oracle...
    net start OracleXETNSListener
    timeout /t 3 > nul
)

echo ✅ Serviços Oracle verificados!
echo.

echo 🔐 Digite a senha do usuário SYS:
set /p SYS_PASSWORD="Senha SYS: "

echo.
echo 🚀 Executando setup do banco de dados...
echo.

:: Executar o script SQL
sqlplus sys/%SYS_PASSWORD%@localhost:1521/XE as sysdba @sql\setup_database.sql

if %errorlevel% neq 0 (
    echo.
    echo ❌ Erro ao executar o setup do banco!
    echo 💡 Verifique:
    echo   - Senha do SYS está correta
    echo   - Oracle está rodando
    echo   - Arquivo sql\setup_database.sql existe
    pause
    exit /b 1
)

echo.
echo 🔧 Atualizando arquivo .env...

:: Backup do .env atual
if exist ".env" (
    copy ".env" ".env.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%" > nul
    echo 💾 Backup do .env criado
)

:: Criar novo .env com as configurações corretas
echo # Configurações do Banco de Dados Oracle - DEDICADO > .env
echo DB_HOST=localhost >> .env
echo DB_PORT=1521 >> .env
echo DB_SERVICE_NAME=XE >> .env
echo DB_USER=protocolo_user >> .env
echo DB_PASSWORD=Protocolo@2025 >> .env
echo. >> .env
echo # Configurações de Autenticação >> .env
echo JWT_SECRET=seu_jwt_secret_super_seguro_aqui_mude_em_producao >> .env
echo JWT_EXPIRES_IN=24h >> .env
echo. >> .env
echo # Configurações do Servidor >> .env
echo PORT=3000 >> .env
echo NODE_ENV=development >> .env
echo. >> .env
echo # Configurações de Segurança >> .env
echo CORS_ORIGIN=http://localhost:8081 >> .env
echo RATE_LIMIT_WINDOW_MS=900000 >> .env
echo RATE_LIMIT_MAX_REQUESTS=100 >> .env
echo. >> .env
echo # Configurações de Log >> .env
echo LOG_LEVEL=info >> .env
echo LOG_FILE=logs/app.log >> .env

echo ✅ Arquivo .env atualizado!
echo.

echo 🧪 Testando conexão com o novo usuário...
echo.

:: Testar conexão
echo SELECT 'Conexão OK!' as status FROM dual; | sqlplus -s protocolo_user/"Protocolo@2025"@localhost:1521/XE

if %errorlevel% equ 0 (
    echo ✅ Conexão testada com sucesso!
) else (
    echo ❌ Erro na conexão. Verifique o log setup_database.log
)

echo.
echo ========================================
echo 🎉 SETUP CONCLUÍDO!
echo ========================================
echo.
echo 📊 Credenciais criadas:
echo   👤 Usuário: protocolo_user
echo   🔑 Senha: Protocolo@2025
echo   🗄️ Banco: XE
echo   📁 Tablespace: PROTOCOLO_DATA
echo.
echo 🔗 Para testar manualmente:
echo   sqlplus protocolo_user/"Protocolo@2025"@localhost:1521/XE
echo.
echo 📋 Próximos passos:
echo   1. ✅ Banco configurado
echo   2. ✅ Arquivo .env atualizado
echo   3. 🔄 Reinicie o servidor backend (npm run dev)
echo   4. 🧪 Teste: http://localhost:3000/api/database/check-tables
echo.
echo 📄 Logs salvos em: setup_database.log
echo.

pause