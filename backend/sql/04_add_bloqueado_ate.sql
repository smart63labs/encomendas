-- =====================================================
-- ADICIONAR COLUNA BLOQUEADO_ATE NA TABELA USUARIOS
-- =====================================================
-- Descrição: Adiciona coluna para controle de bloqueio temporário de usuários
-- Data: 2025-01-11
-- =====================================================

-- Adicionar coluna BLOQUEADO_ATE
ALTER TABLE USUARIOS ADD (
  BLOQUEADO_ATE DATE
);

-- Comentário da coluna
COMMENT ON COLUMN USUARIOS.BLOQUEADO_ATE IS 'Data/hora até quando o usuário está bloqueado por tentativas de login';

-- Verificar se a coluna foi criada
SELECT COLUMN_NAME, DATA_TYPE, NULLABLE 
FROM USER_TAB_COLUMNS 
WHERE TABLE_NAME = 'USUARIOS' 
AND COLUMN_NAME = 'BLOQUEADO_ATE';

PROMPT 'Coluna BLOQUEADO_ATE adicionada com sucesso!';