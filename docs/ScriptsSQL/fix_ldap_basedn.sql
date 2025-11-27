-- Script para corrigir o BaseDN da configuração LDAP
-- Substituindo ponto e vírgula por vírgulas

UPDATE CONFIGURACOES_AUTENTICACAO 
SET CONFIGURACAO = JSON_MERGEPATCH(
    CONFIGURACAO,
    JSON_OBJECT('baseDN' VALUE 'OU=CONTAS,dc=sefaz,dc=to,dc=gov,dc=br')
)
WHERE TIPO_AUTH = 'LDAP';

COMMIT;

-- Verificar a alteração
SELECT 
    'BaseDN corrigido: ' || JSON_VALUE(CONFIGURACAO, '$.baseDN') as basedn_corrigido
FROM CONFIGURACOES_AUTENTICACAO 
WHERE TIPO_AUTH = 'LDAP';

EXIT;