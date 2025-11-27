-- Script para ativar a configuração LDAP para sistema híbrido
-- Este script atualiza o campo ATIVO para 1 (ativo) no registro LDAP
-- Em um sistema híbrido, tanto MOCK quanto LDAP devem estar ativos

-- Verificar o estado atual de todas as configurações de autenticação
SELECT ID, TIPO_AUTH, ATIVO, DATA_CRIACAO, DATA_ATUALIZACAO
FROM CONFIGURACOES_AUTENTICACAO
ORDER BY ID;

-- Ativar a configuração LDAP (para sistema híbrido)
UPDATE CONFIGURACOES_AUTENTICACAO
SET ATIVO = 1,
    DATA_ATUALIZACAO = SYSDATE
WHERE TIPO_AUTH = 'LDAP';

-- Confirmar a alteração
COMMIT;

-- Verificar se a atualização foi bem-sucedida
SELECT ID, TIPO_AUTH, ATIVO, DATA_ATUALIZACAO
FROM CONFIGURACOES_AUTENTICACAO
WHERE TIPO_AUTH IN ('LDAP', 'MOCK')
ORDER BY TIPO_AUTH;

-- Mostrar todas as configurações de autenticação disponíveis
SELECT ID, TIPO_AUTH, ATIVO, DATA_CRIACAO, DATA_ATUALIZACAO
FROM CONFIGURACOES_AUTENTICACAO
ORDER BY ID;