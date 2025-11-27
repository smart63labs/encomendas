-- Script para verificar constraints da tabela SETORES
-- Verificar todas as constraints da tabela SETORES
SELECT 
    constraint_name,
    constraint_type,
    search_condition,
    status
FROM user_constraints 
WHERE table_name = 'SETORES';

-- Verificar colunas das constraints
SELECT 
    c.constraint_name,
    c.constraint_type,
    cc.column_name,
    cc.position
FROM user_constraints c
JOIN user_cons_columns cc ON c.constraint_name = cc.constraint_name
WHERE c.table_name = 'SETORES'
ORDER BY c.constraint_name, cc.position;

-- Verificar estrutura da tabela
DESC SETORES;

EXIT;