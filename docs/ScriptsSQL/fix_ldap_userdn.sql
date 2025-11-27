-- Script para corrigir userDN LDAP com apenas uma barra
-- Conectar como: protocolo_user/Anderline49@localhost:1521/FREEPDB1

-- Atualizar configuração LDAP com userDN correto
UPDATE CONFIGURACOES_AUTENTICACAO 
SET CONFIGURACAO = '{
  "enabled": true,
  "server": "10.9.7.106",
  "port": 389,
  "baseDN": "OU=CONTAS;dc=sefaz;dc=to;dc=gov;dc=br",
  "userFilter": "(&(objectClass=user)(objectCategory=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))",
  "useBind": true,
  "userDN": "sefaz\\glpi",
  "password": "glpi123",
  "loginField": "samaccountname",
  "serverName": "srv-acdc",
  "defaultServer": true
}'
WHERE TIPO_AUTH = 'LDAP';

COMMIT;

-- Verificar a atualização
SELECT CONFIGURACAO 
FROM CONFIGURACOES_AUTENTICACAO 
WHERE TIPO_AUTH = 'LDAP';

EXIT;