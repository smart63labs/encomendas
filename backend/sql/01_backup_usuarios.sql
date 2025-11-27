-- =====================================================
-- SCRIPT DE BACKUP DA TABELA USUARIOS
-- Data: 11/09/2025
-- Objetivo: Criar backup antes da migração
-- =====================================================

-- Criar tabela de backup
CREATE TABLE USUARIOS_BACKUP AS 
SELECT * FROM USUARIOS;

-- Verificar se o backup foi criado corretamente
SELECT COUNT(*) AS TOTAL_REGISTROS_BACKUP FROM USUARIOS_BACKUP;
SELECT COUNT(*) AS TOTAL_REGISTROS_ORIGINAL FROM USUARIOS;

-- Criar índice na tabela de backup para consultas rápidas
CREATE INDEX IDX_USUARIOS_BACKUP_ID ON USUARIOS_BACKUP(ID);

-- Comentários na tabela de backup
COMMENT ON TABLE USUARIOS_BACKUP IS 'Backup da tabela USUARIOS antes da migração dos dados da SEFAZ - 11/09/2025';

PROMPT 'Backup da tabela USUARIOS criado com sucesso!';
PROMPT 'Verifique se os totais de registros coincidem antes de prosseguir.';