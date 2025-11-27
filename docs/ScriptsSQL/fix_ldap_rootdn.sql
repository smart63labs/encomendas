-- Script para corrigir rootDN e senha conforme documentação LDAP.md
-- RootDN deve ser: sefaz\glpi

UPDATE CONFIGURACOES_AUTENTICACAO 
SET CONFIGURACAO = JSON_MERGEPATCH(
    CONFIGURACAO,
    '{
        "rootDN": "sefaz\\glpi",
        "senhaRootDN": "senha_glpi_aqui_temporaria"
    }'
)
WHERE TIPO_AUTH = 'LDAP';

COMMIT;

-- Verificar a atualização
SELECT 
    ID,
    TIPO_AUTH,
    JSON_VALUE(CONFIGURACAO, '$.rootDN') as ROOT_DN,
    JSON_VALUE(CONFIGURACAO, '$.useBind') as USE_BIND,
    JSON_VALUE(CONFIGURACAO, '$.server') as SERVER,
    JSON_VALUE(CONFIGURACAO, '$.baseDN') as BASE_DN
FROM CONFIGURACOES_AUTENTICACAO 
WHERE TIPO_AUTH = 'LDAP';

EXIT;