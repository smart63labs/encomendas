-- Script para atualizar configuração LDAP completa conforme documentação
-- Baseado no arquivo LDAP.md

UPDATE CONFIGURACOES_AUTENTICACAO 
SET CONFIGURACAO = JSON_MERGEPATCH(
    CONFIGURACAO,
    '{
        "enabled": true,
        "server": "10.9.7.106",
        "port": 389,
        "baseDN": "OU=CONTAS,dc=sefaz,dc=to,dc=gov,dc=br",
        "userFilter": "(&(objectClass=user)(objectCategory=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))",
        "useBind": true,
        "rootDN": "sefaz\\glpi",
        "senhaRootDN": "senha_do_glpi_aqui",
        "loginField": "sAMAccountName",
        "serverName": "srv-acdc",
        "defaultServer": true
    }'
)
WHERE TIPO_AUTH = 'LDAP';

COMMIT;

-- Verificar a configuração atualizada
SELECT 
    ID,
    TIPO_AUTH,
    ATIVO,
    JSON_PRETTY(CONFIGURACAO) as CONFIGURACAO_FORMATADA
FROM CONFIGURACOES_AUTENTICACAO 
WHERE TIPO_AUTH = 'LDAP';