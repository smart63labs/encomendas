-- Script para atualizar filtro LDAP conforme documentação LDAP.md
-- Filtro correto: (&(objectClass=user)(objectCategory=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))

UPDATE CONFIGURACOES_AUTENTICACAO 
SET CONFIGURACAO = JSON_MERGEPATCH(
    CONFIGURACAO,
    '{
        "userFilter": "(&(objectClass=user)(objectCategory=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))"
    }'
)
WHERE TIPO_AUTH = 'LDAP';

COMMIT;

-- Verificar a atualização do filtro
SELECT 
    ID,
    TIPO_AUTH,
    JSON_VALUE(CONFIGURACAO, '$.userFilter') as USER_FILTER,
    JSON_VALUE(CONFIGURACAO, '$.rootDN') as ROOT_DN,
    JSON_VALUE(CONFIGURACAO, '$.baseDN') as BASE_DN
FROM CONFIGURACOES_AUTENTICACAO 
WHERE TIPO_AUTH = 'LDAP';

EXIT;