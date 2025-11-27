-- Script para ativar a configuração LDAP existente na tabela CONFIGURACOES_AUTENTICACAO
-- Este script atualiza o campo ATIVO para 1 (ativo) no registro LDAP

-- Verificar o estado atual da configuração LDAP
SELECT ID, TIPO_AUTH, ATIVO, CONFIGURACAO
FROM CONFIGURACOES_AUTENTICACAO
WHERE TIPO_AUTH = 'LDAP';

-- Ativar a configuração LDAP
UPDATE CONFIGURACOES_AUTENTICACAO
SET ATIVO = 1,
    DATA_ATUALIZACAO = SYSDATE,
    USUARIO_ATUALIZACAO = 'SYSTEM'
WHERE TIPO_AUTH = 'LDAP';

-- Confirmar a alteração
COMMIT;

-- Verificar se a atualização foi bem-sucedida
SELECT ID, TIPO_AUTH, ATIVO, CONFIGURACAO, DATA_ATUALIZACAO
FROM CONFIGURACOES_AUTENTICACAO
WHERE TIPO_AUTH = 'LDAP';

-- Mostrar todas as configurações de autenticação disponíveis
SELECT ID, TIPO_AUTH, ATIVO, DATA_CRIACAO, DATA_ATUALIZACAO
FROM CONFIGURACOES_AUTENTICACAO
ORDER BY ID;