-- Script para corrigir a configuração LDAP no banco de dados
-- Atualiza a configuração LDAP com todos os campos necessários

UPDATE CONFIGURACOES_AUTENTICACAO 
SET CONFIGURACAO = '{
  "enabled": true,
  "server": "10.9.7.106",
  "port": 389,
  "baseDN": "OU=CONTAS;dc=sefaz;dc=to;dc=gov;dc=br",
  "userFilter": "(&(objectClass=user)(objectCategory=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))",
  "useBind": true,
  "userDN": "sefaz\\glpi",
  "password": "Anderline49@",
  "loginField": "samaccountname",
  "serverName": "srv-acdc",
  "defaultServer": true
}',
ATIVO = 1,
DATA_ATUALIZACAO = SYSDATE
WHERE TIPO_AUTH = 'LDAP';

-- Verificar se a atualização foi bem-sucedida
SELECT ID, TIPO_AUTH, ATIVO, CONFIGURACAO 
FROM CONFIGURACOES_AUTENTICACAO 
WHERE TIPO_AUTH = 'LDAP';

COMMIT;