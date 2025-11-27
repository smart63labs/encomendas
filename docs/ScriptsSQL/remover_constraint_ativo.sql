-- Script para remover a constraint SYS_C008871 que está causando erro na importação
ALTER TABLE SETORES DROP CONSTRAINT SYS_C008871;

-- Verificar se a constraint foi removida
SELECT constraint_name, constraint_type, search_condition 
FROM user_constraints 
WHERE table_name = 'SETORES' AND constraint_name = 'SYS_C008871';

EXIT;