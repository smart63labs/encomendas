-- Script para verificar a tabela USUARIOS e seus dados
-- Verificar se a tabela USUARIOS existe
SELECT COUNT(*) as "TABELA_EXISTE" FROM USER_TABLES WHERE TABLE_NAME = 'USUARIOS';

-- Verificar estrutura da tabela USUARIOS
SELECT COLUMN_NAME, DATA_TYPE, NULLABLE 
FROM USER_TAB_COLUMNS 
WHERE TABLE_NAME = 'USUARIOS' 
ORDER BY COLUMN_ID;

-- Contar total de registros na tabela USUARIOS
SELECT COUNT(*) as "TOTAL_USUARIOS" FROM USUARIOS;

-- Contar usuários ativos
SELECT COUNT(*) as "USUARIOS_ATIVOS" FROM USUARIOS WHERE IS_ACTIVE = 1;

-- Verificar alguns registros de exemplo
SELECT ID, NAME, EMAIL, IS_ACTIVE, SETOR_ID 
FROM USUARIOS 
WHERE ROWNUM <= 5;

-- Testar busca por nome (similar ao que o backend faz)
SELECT COUNT(*) as "USUARIOS_COM_NOME_DE" 
FROM USUARIOS 
WHERE UPPER(NAME) LIKE UPPER('%DE%') 
AND IS_ACTIVE = 1;

-- Mostrar alguns usuários que começam com 'DE'
SELECT ID, NAME, EMAIL, IS_ACTIVE 
FROM USUARIOS 
WHERE UPPER(NAME) LIKE UPPER('%DE%') 
AND IS_ACTIVE = 1 
AND ROWNUM <= 10;