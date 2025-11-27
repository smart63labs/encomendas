-- Script para verificar configurações de bind LDAP
-- Verifica se as credenciais de bind estão configuradas corretamente

SELECT 
    ID,
    TIPO_AUTH,
    ATIVO,
    JSON_VALUE(CONFIGURACAO, '$.usarBind') as USAR_BIND,
    JSON_VALUE(CONFIGURACAO, '$.rootDN') as ROOT_DN,
    CASE 
        WHEN JSON_VALUE(CONFIGURACAO, '$.senhaRootDN') IS NOT NULL 
        THEN 'CONFIGURADA' 
        ELSE 'NÃO CONFIGURADA' 
    END as SENHA_ROOT_DN_STATUS,
    JSON_VALUE(CONFIGURACAO, '$.servidor') as SERVIDOR,
    JSON_VALUE(CONFIGURACAO, '$.porta') as PORTA,
    JSON_VALUE(CONFIGURACAO, '$.baseDN') as BASE_DN
FROM CONFIGURACOES_AUTENTICACAO 
WHERE TIPO_AUTH = 'LDAP';