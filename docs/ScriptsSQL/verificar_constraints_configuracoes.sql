-- Script para verificar constraints da tabela CONFIGURACOES
-- Verificar todas as constraints da tabela CONFIGURACOES
SELECT 
    constraint_name,
    constraint_type,
    search_condition,
    status
FROM user_constraints 
WHERE table_name = 'CONFIGURACOES';

-- Verificar colunas das constraints
SELECT 
    c.constraint_name,
    c.constraint_type,
    cc.column_name,
    cc.position
FROM user_constraints c
JOIN user_cons_columns cc ON c.constraint_name = cc.constraint_name
WHERE c.table_name = 'CONFIGURACOES'
ORDER BY c.constraint_name, cc.position;

-- Verificar estrutura da tabela
DESC CONFIGURACOES;

-- Verificar se existe a constraint CHK_CONFIG_ATIVO
SELECT 
    constraint_name,
    search_condition
FROM user_constraints 
WHERE table_name = 'CONFIGURACOES' 
AND constraint_name LIKE '%ATIVO%';

EXIT;