-- Script para verificar configuração LDAP completa
-- Conectar como: protocolo_user/Anderline49@localhost:1521/FREEPDB1

SET PAGESIZE 0
SET LINESIZE 4000
SET LONG 10000

SELECT CONFIGURACAO 
FROM CONFIGURACOES_AUTENTICACAO 
WHERE TIPO_AUTH = 'LDAP';

EXIT;