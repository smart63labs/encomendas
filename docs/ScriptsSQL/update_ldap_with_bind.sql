-- Script para adicionar credenciais de bind administrativo ao LDAP
-- Isso permitirá que o sistema faça bind com credenciais antes de buscar usuários

UPDATE CONFIGURACOES_AUTENTICACAO 
SET CONFIGURACAO = JSON_MERGEPATCH(
    CONFIGURACAO,
    '{
        "useBind": true,
        "rootDN": "cn=Administrator,cn=Users,dc=sefaz,dc=to,dc=gov,dc=br",
        "senhaRootDN": "SuaSenhaAdmin123"
    }'
)
WHERE TIPO_AUTH = 'LDAP';

COMMIT;

-- Verificar a configuração atualizada
SELECT CONFIGURACAO
FROM CONFIGURACOES_AUTENTICACAO 
WHERE TIPO_AUTH = 'LDAP';

EXIT;