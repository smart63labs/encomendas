-- Script para verificar configuração LDAP atualizada
SELECT 
    ID,
    TIPO_AUTH,
    ATIVO,
    CONFIGURACAO
FROM CONFIGURACOES_AUTENTICACAO 
WHERE TIPO_AUTH = 'LDAP';

EXIT;