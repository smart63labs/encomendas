-- Script para verificar a estrutura da tabela CONFIGURACOES_AUTENTICACAO
-- Conectar como: protocolo_user/Anderline49@localhost:1521/FREEPDB1

-- Verificar se a tabela existe e sua estrutura
DESC CONFIGURACOES_AUTENTICACAO;

-- Verificar os dados existentes na tabela
SELECT * FROM CONFIGURACOES_AUTENTICACAO ORDER BY ID;

-- Verificar se existem configurações LDAP
SELECT * FROM CONFIGURACOES_AUTENTICACAO WHERE UPPER(CHAVE) LIKE '%LDAP%' OR UPPER(CATEGORIA) LIKE '%LDAP%' OR UPPER(DESCRICAO) LIKE '%LDAP%';

-- Verificar todas as categorias existentes
SELECT DISTINCT CATEGORIA FROM CONFIGURACOES_AUTENTICACAO ORDER BY CATEGORIA;