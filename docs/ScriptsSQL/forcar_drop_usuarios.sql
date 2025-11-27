-- Script para forçar o DROP da tabela USUARIOS e renomear USUARIOS_NOVA
-- ATENÇÃO: Este script deve ser executado com privilégios administrativos

-- 1. Primeiro, tente fazer commit para liberar qualquer transação pendente
COMMIT;

-- 2. Tente dropar a tabela USUARIOS (pode falhar se houver lock)
DROP TABLE USUARIOS CASCADE CONSTRAINTS;

-- 3. Se o comando acima falhar, você precisa identificar e matar as sessões que estão bloqueando
-- Execute este comando para ver as sessões ativas:
-- SELECT sid, serial#, username, program, machine, status FROM v$session WHERE username = 'PROTOCOLO_USER';

-- 4. Para matar uma sessão específica (substitua SID e SERIAL# pelos valores encontrados):
-- ALTER SYSTEM KILL SESSION 'SID,SERIAL#' IMMEDIATE;

-- 5. Após conseguir dropar a tabela USUARIOS, renomeie USUARIOS_NOVA para USUARIOS
ALTER TABLE USUARIOS_NOVA RENAME TO USUARIOS;

-- 6. Verificar a estrutura da nova tabela USUARIOS
DESC USUARIOS;

-- 7. Verificar se a tabela SETORES existe
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

-- 12. Verificar que apenas a tabela USUARIOS existe
SELECT table_name FROM user_tables WHERE table_name LIKE 'USUARIOS%' ORDER BY table_name;