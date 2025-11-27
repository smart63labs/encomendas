-- Script para verificar se as configurações LDAP foram salvas na tabela CONFIGURACOES_AUTENTICACAO
SELECT * FROM CONFIGURACOES_AUTENTICACAO WHERE TIPO = 'LDAP';

-- Verificar se existe algum registro na tabela
SELECT COUNT(*) as TOTAL_REGISTROS FROM CONFIGURACOES_AUTENTICACAO;

-- Verificar todos os tipos de configuração
SELECT TIPO, COUNT(*) as QUANTIDADE FROM CONFIGURACOES_AUTENTICACAO GROUP BY TIPO;

-- Sair do SQL*Plus
EXIT;