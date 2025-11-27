-- Script para adicionar campo URGENTE na tabela ENCOMENDAS
-- Este campo será usado para marcar encomendas como urgentes

-- Adicionar campo URGENTE na tabela ENCOMENDAS
ALTER TABLE ENCOMENDAS ADD URGENTE NUMBER(1) DEFAULT 0 CHECK (URGENTE IN (0, 1));

-- Adicionar comentário no campo
COMMENT ON COLUMN ENCOMENDAS.URGENTE IS 'Indica se a encomenda é urgente (0=Normal, 1=Urgente)';

-- Criar índice para otimizar consultas por urgência
CREATE INDEX IDX_ENCOMENDAS_URGENTE ON ENCOMENDAS(URGENTE);

-- Verificar se o campo foi adicionado corretamente
SELECT COLUMN_NAME, DATA_TYPE, NULLABLE, DATA_DEFAULT
FROM USER_TAB_COLUMNS 
WHERE TABLE_NAME = 'ENCOMENDAS' 
AND COLUMN_NAME = 'URGENTE';

PROMPT 'Campo URGENTE adicionado com sucesso na tabela ENCOMENDAS!';
COMMIT;