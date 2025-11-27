SET PAGESIZE 0
SET LINESIZE 4000
SET TRIMSPOOL ON
SET TRIMOUT ON
SET LONG 10000

-- Atualizar configuração LDAP para remover credenciais administrativas
-- e configurar corretamente para autenticação direta do usuário
UPDATE CONFIGURACOES_AUTENTICACAO 
SET CONFIGURACAO = '{
  "enabled": true,
  "server": "10.9.7.106",
  "port": 389,
  "baseDN": "OU=CONTAS;dc=sefaz;dc=to;dc=gov;dc=br",
  "userFilter": "(&(objectClass=user)(objectCategory=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2))(sAMAccountName={username}))",
  "useBind": false,
  "loginField": "sAMAccountName",
  "serverName": "srv-acdc",
  "defaultServer": true
}'
WHERE TIPO_AUTH = 'LDAP';

COMMIT;

-- Verificar a configuração atualizada
SELECT CONFIGURACAO FROM CONFIGURACOES_AUTENTICACAO WHERE TIPO_AUTH = 'LDAP';

EXIT;