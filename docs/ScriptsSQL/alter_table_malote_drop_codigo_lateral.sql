-- Script: alter_table_malote_drop_codigo_lateral.sql
-- Objetivo: Remover a coluna CODIGO_LATERAL da tabela MALOTE no Oracle (FREEPDB1)
-- Schema esperado: protocolo_user
-- Execução (via SQL*Plus):
--   sqlplus protocolo_user/Anderline49@localhost:1521/FREEPDB1 @docs/ScriptsSQL/alter_table_malote_drop_codigo_lateral.sql

WHENEVER SQLERROR EXIT FAILURE

PROMPT Iniciando remoção da coluna CODIGO_LATERAL da tabela MALOTE...

ALTER TABLE MALOTE DROP COLUMN CODIGO_LATERAL;

PROMPT Coluna CODIGO_LATERAL removida com sucesso.