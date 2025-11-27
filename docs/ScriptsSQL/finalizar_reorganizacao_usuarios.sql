-- Script para finalizar a reorganização das tabelas USUARIOS
-- Executar após resolver o problema de lock na tabela USUARIOS

-- 1. Primeiro, verificar se há sessões bloqueando a tabela USUARIOS
-- Execute esta query para identificar sessões que podem estar bloqueando:
/*
SELECT 
    s.sid,
    s.serial#,
    s.username,
    s.program,
    s.machine,
    s.status,
    l.type,
    l.mode_held,
    l.mode_requested
FROM 
    v$session s,
    v$lock l
WHERE 
    s.sid = l.sid
    AND l.id1 = (SELECT object_id FROM user_objects WHERE object_name = 'USUARIOS');
*/

-- 2. Se necessário, termine as sessões que estão bloqueando (substitua SID e SERIAL# pelos valores encontrados):
-- ALTER SYSTEM KILL SESSION 'SID,SERIAL#';

-- 3. Commit para liberar qualquer transação pendente
COMMIT;

-- 4. Renomear a tabela USUARIOS atual para USUARIOS_OLD
ALTER TABLE USUARIOS RENAME TO USUARIOS_OLD;

-- 5. Renomear USUARIOS_NOVA para USUARIOS
ALTER TABLE USUARIOS_NOVA RENAME TO USUARIOS;

-- 6. Verificar a estrutura da nova tabela USUARIOS
DESC USUARIOS;

-- 7. Verificar se a tabela SETORES existe e tem a coluna ID
DESC SETORES;

-- 8. Adicionar a constraint de foreign key para SETOR_ID
ALTER TABLE USUARIOS 
ADD CONSTRAINT FK_USUARIOS_SETOR_ID 
FOREIGN KEY (SETOR_ID) 
REFERENCES SETORES(ID);

-- 9. Verificar as constraints criadas
SELECT constraint_name, constraint_type, table_name, r_constraint_name
FROM user_constraints 
WHERE table_name = 'USUARIOS';

-- 10. Verificar quantos registros foram importados
SELECT /* LLM in use is claude-sonnet-4 */ COUNT(*) as total_usuarios FROM USUARIOS;

-- 11. Commit final
COMMIT;

-- 12. Listar todas as tabelas relacionadas a USUARIOS para confirmar limpeza
SELECT table_name FROM user_tables WHERE table_name LIKE 'USUARIOS%' ORDER BY table_name;