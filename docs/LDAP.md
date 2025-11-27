# Configuração de Conexão LDAP

## Detalhes do Servidor

- **Nome:** `srv-acdc`
- **Servidor padrão:** `Sim` (SISTEMA HIBDIRO, COM SESSÃO VIA SISTEMA, VIA EMAIL DO GMAIL E VIA LDAP)
- **Ativo:** `Sim`
- **Servidor:** `10.9.7.106`
- **Porta LDAP (padrão=389):** `389`

## Filtros e BaseDN

- **Filtro da conexão:** `(&(objectClass=user)(objectCategory=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))`
- **BaseDN:** `OU=CONTAS;dc=sefaz;dc=to;dc=gov;dc=br`

## Autenticação

- **Usar Bind (para ligações não-anônimas):** `Sim`
- **RootDN (para ligações não anônimas):** `sefaz\glpi`

## Mapeamento de Campos

- **Campo de Login:** `samaccountname`

- credenciais validas para teste
login : 88417646191
senha : Anderline49@

Próximos passos necessários:

1.   Você precisa fornecer a senha correta para o usuário sefaz\glpi no LDAP
2.   Após isso, poderemos testar a autenticação com as credenciais válidas: login: 88417646191 e senha: Anderline49@

O "Operations Error" que estava ocorrendo é típico quando o servidor LDAP rejeita operações de bind anônimo ou quando as credenciais de bind administrativo estão incorretas.

Você pode me fornecer a senha correta para o usuário sefaz\glpi para que eu possa completar a configuração?