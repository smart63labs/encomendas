-- Script para corrigir os problemas de setores e usuários na tabela ENCOMENDAS
-- Problema 1: A tabela só tinha SETOR_ID, mas precisava de SETOR_ORIGEM_ID e SETOR_DESTINO_ID
-- Problema 2: A tabela só tinha USUARIO_ID, mas precisava de USUARIO_ORIGEM_ID e USUARIO_DESTINO_ID
-- para distinguir entre remetente e destinatário

-- =====================================================
-- ADICIONAR NOVAS COLUNAS DE SETOR E USUÁRIO
-- =====================================================

-- Adicionar colunas para setor origem e destino
ALTER TABLE ENCOMENDAS ADD (
  SETOR_ORIGEM_ID NUMBER,
  SETOR_DESTINO_ID NUMBER
);

-- Adicionar colunas para usuário origem e destino
ALTER TABLE ENCOMENDAS ADD (
  USUARIO_ORIGEM_ID NUMBER,
  USUARIO_DESTINO_ID NUMBER
);

-- =====================================================
-- CRIAR CHAVES ESTRANGEIRAS
-- =====================================================

-- Chave estrangeira para setor origem
ALTER TABLE ENCOMENDAS ADD CONSTRAINT FK_ENCOMENDAS_SETOR_ORIGEM 
  FOREIGN KEY (SETOR_ORIGEM_ID) REFERENCES SETORES(ID);

-- Chave estrangeira para setor destino
ALTER TABLE ENCOMENDAS ADD CONSTRAINT FK_ENCOMENDAS_SETOR_DESTINO 
  FOREIGN KEY (SETOR_DESTINO_ID) REFERENCES SETORES(ID);

-- Chave estrangeira para usuário origem
ALTER TABLE ENCOMENDAS ADD CONSTRAINT FK_ENCOMENDAS_USUARIO_ORIGEM 
  FOREIGN KEY (USUARIO_ORIGEM_ID) REFERENCES USUARIOS(ID);

-- Chave estrangeira para usuário destino
ALTER TABLE ENCOMENDAS ADD CONSTRAINT FK_ENCOMENDAS_USUARIO_DESTINO 
  FOREIGN KEY (USUARIO_DESTINO_ID) REFERENCES USUARIOS(ID);

-- =====================================================
-- CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice para setor origem
CREATE INDEX IDX_ENCOMENDAS_SETOR_ORIGEM ON ENCOMENDAS(SETOR_ORIGEM_ID);

-- Índice para setor destino
CREATE INDEX IDX_ENCOMENDAS_SETOR_DESTINO ON ENCOMENDAS(SETOR_DESTINO_ID);

-- Índice para usuário origem
CREATE INDEX IDX_ENCOMENDAS_USUARIO_ORIGEM ON ENCOMENDAS(USUARIO_ORIGEM_ID);

-- Índice para usuário destino
CREATE INDEX IDX_ENCOMENDAS_USUARIO_DESTINO ON ENCOMENDAS(USUARIO_DESTINO_ID);

-- =====================================================
-- MIGRAR DADOS EXISTENTES
-- =====================================================

-- Migrar dados da coluna SETOR_ID para SETOR_ORIGEM_ID
-- (assumindo que o setor atual é o setor de origem)
UPDATE ENCOMENDAS 
SET SETOR_ORIGEM_ID = SETOR_ID 
WHERE SETOR_ID IS NOT NULL;

-- (assumindo que o usuário atual é o usuário de origem)
UPDATE ENCOMENDAS 
SET USUARIO_ORIGEM_ID = USUARIO_ID 
WHERE USUARIO_ID IS NOT NULL;

-- Remover as colunas originais (agora desnecessárias)
ALTER TABLE ENCOMENDAS DROP COLUMN SETOR_ID;
ALTER TABLE ENCOMENDAS DROP COLUMN USUARIO_ID;

-- =====================================================
-- COMENTÁRIOS NAS COLUNAS
-- =====================================================

COMMENT ON COLUMN ENCOMENDAS.SETOR_ORIGEM_ID IS 'ID do setor remetente (FK para SETORES)';
COMMENT ON COLUMN ENCOMENDAS.SETOR_DESTINO_ID IS 'ID do setor destinatário (FK para SETORES)';
COMMENT ON COLUMN ENCOMENDAS.USUARIO_ORIGEM_ID IS 'ID do usuário remetente (FK para USUARIOS)';
COMMENT ON COLUMN ENCOMENDAS.USUARIO_DESTINO_ID IS 'ID do usuário destinatário (FK para USUARIOS)';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar estrutura da tabela
SELECT column_name, data_type, nullable 
FROM user_tab_columns 
WHERE table_name = 'ENCOMENDAS' 
AND (column_name LIKE '%SETOR%' OR column_name LIKE '%USUARIO%') 
ORDER BY column_name;

-- Verificar dados migrados
SELECT COUNT(*) as total_encomendas,
       COUNT(SETOR_ORIGEM_ID) as com_setor_origem,
       COUNT(SETOR_DESTINO_ID) as com_setor_destino,
       COUNT(USUARIO_ORIGEM_ID) as com_usuario_origem,
       COUNT(USUARIO_DESTINO_ID) as com_usuario_destino
FROM ENCOMENDAS;

-- Exemplo de consulta com JOIN para obter nomes dos setores e usuários
SELECT e.ID, e.NUMERO_ENCOMENDA, e.DESCRICAO,
       e.SETOR_ORIGEM_ID, so.NOME_SETOR as SETOR_ORIGEM_NOME,
       e.SETOR_DESTINO_ID, sd.NOME_SETOR as SETOR_DESTINO_NOME,
       e.USUARIO_ORIGEM_ID, uo.NOME as USUARIO_ORIGEM_NOME,
       e.USUARIO_DESTINO_ID, ud.NOME as USUARIO_DESTINO_NOME
FROM ENCOMENDAS e
LEFT JOIN SETORES so ON e.SETOR_ORIGEM_ID = so.ID
LEFT JOIN SETORES sd ON e.SETOR_DESTINO_ID = sd.ID
LEFT JOIN USUARIOS uo ON e.USUARIO_ORIGEM_ID = uo.ID
LEFT JOIN USUARIOS ud ON e.USUARIO_DESTINO_ID = ud.ID;

PROMPT 'Script executado com sucesso!';
PROMPT 'Problemas dos setores e usuários na tabela ENCOMENDAS foram corrigidos.';
PROMPT 'Estrutura otimizada: SETOR_ORIGEM_ID, SETOR_DESTINO_ID, USUARIO_ORIGEM_ID e USUARIO_DESTINO_ID.';
PROMPT 'Agora é possível distinguir entre remetente e destinatário tanto para setores quanto usuários.';

COMMIT;