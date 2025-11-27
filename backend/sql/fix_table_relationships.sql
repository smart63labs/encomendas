-- =====================================================
-- CORREÇÃO DE RELACIONAMENTOS ENTRE TABELAS
-- =====================================================
-- Autor: Sistema Automatizado
-- Data: 2024
-- Descrição: Script para corrigir relacionamentos faltantes
-- Tabelas: CONFIGURACOES, MOVIMENTACOES, TIPOS_PROCESSO, AUDITORIA
-- =====================================================

-- Configurações iniciais
SET SERVEROUTPUT ON;
ALTER SESSION SET NLS_DATE_FORMAT = 'DD/MM/YYYY HH24:MI:SS';

-- =====================================================
-- 1. CONECTAR TIPOS_PROCESSO COM PROCESSOS
-- =====================================================

-- Primeiro, vamos adicionar uma coluna TIPO_PROCESSO_ID na tabela PROCESSOS
-- se ela não existir (para referenciar TIPOS_PROCESSO)
DECLARE
    column_exists NUMBER := 0;
BEGIN
    SELECT COUNT(*)
    INTO column_exists
    FROM USER_TAB_COLUMNS
    WHERE TABLE_NAME = 'PROCESSOS' AND COLUMN_NAME = 'TIPO_PROCESSO_ID';
    
    IF column_exists = 0 THEN
        EXECUTE IMMEDIATE 'ALTER TABLE PROCESSOS ADD TIPO_PROCESSO_ID NUMBER(10)';
        DBMS_OUTPUT.PUT_LINE('Coluna TIPO_PROCESSO_ID adicionada à tabela PROCESSOS');
    ELSE
        DBMS_OUTPUT.PUT_LINE('Coluna TIPO_PROCESSO_ID já existe na tabela PROCESSOS');
    END IF;
END;
/

-- Criar foreign key entre PROCESSOS e TIPOS_PROCESSO
DECLARE
    constraint_exists NUMBER := 0;
BEGIN
    SELECT COUNT(*)
    INTO constraint_exists
    FROM USER_CONSTRAINTS
    WHERE CONSTRAINT_NAME = 'FK_PROCESSOS_TIPO_PROCESSO';
    
    IF constraint_exists = 0 THEN
        EXECUTE IMMEDIATE 'ALTER TABLE PROCESSOS ADD CONSTRAINT FK_PROCESSOS_TIPO_PROCESSO FOREIGN KEY (TIPO_PROCESSO_ID) REFERENCES TIPOS_PROCESSO(ID)';
        DBMS_OUTPUT.PUT_LINE('Foreign key FK_PROCESSOS_TIPO_PROCESSO criada');
    ELSE
        DBMS_OUTPUT.PUT_LINE('Foreign key FK_PROCESSOS_TIPO_PROCESSO já existe');
    END IF;
END;
/

-- =====================================================
-- 2. MELHORAR RELACIONAMENTOS DA TABELA LOGS_AUDITORIA
-- =====================================================

-- Adicionar índice composto para melhor performance
DECLARE
    index_exists NUMBER := 0;
BEGIN
    SELECT COUNT(*)
    INTO index_exists
    FROM USER_INDEXES
    WHERE INDEX_NAME = 'IDX_LOGS_TABELA_REGISTRO';
    
    IF index_exists = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX IDX_LOGS_TABELA_REGISTRO ON LOGS_AUDITORIA(TABELA, REGISTRO_ID)';
        DBMS_OUTPUT.PUT_LINE('Índice IDX_LOGS_TABELA_REGISTRO criado');
    ELSE
        DBMS_OUTPUT.PUT_LINE('Índice IDX_LOGS_TABELA_REGISTRO já existe');
    END IF;
END;
/

-- =====================================================
-- 3. CRIAR TABELA MOVIMENTACOES (ALIAS PARA TRAMITACOES)
-- =====================================================

-- Criar uma view que mapeia TRAMITACOES como MOVIMENTACOES
-- para manter compatibilidade com sistemas que esperam essa nomenclatura
CREATE OR REPLACE VIEW MOVIMENTACOES AS
SELECT 
    ID,
    PROCESSO_ID,
    SETOR_ORIGEM,
    SETOR_DESTINO,
    USUARIO_ORIGEM_ID,
    USUARIO_DESTINO_ID,
    DATA_TRAMITACAO AS DATA_MOVIMENTACAO,
    DATA_RECEBIMENTO,
    OBSERVACOES,
    TIPO_TRAMITACAO AS TIPO_MOVIMENTACAO,
    STATUS,
    PRAZO_RESPOSTA,
    URGENTE,
    CRIADO_EM
FROM TRAMITACOES;

-- Comentário na view
COMMENT ON TABLE MOVIMENTACOES IS 'View que mapeia TRAMITACOES como MOVIMENTACOES para compatibilidade';

-- =====================================================
-- 4. VERIFICAR E CORRIGIR RELACIONAMENTOS CONFIGURACOES
-- =====================================================

-- As foreign keys da tabela CONFIGURACOES já estão corretas:
-- FK_CONFIG_USER_CRIACAO e FK_CONFIG_USER_ALTERACAO
-- Vamos apenas verificar se existem

DECLARE
    fk_criacao_exists NUMBER := 0;
    fk_alteracao_exists NUMBER := 0;
BEGIN
    -- Verificar FK_CONFIG_USER_CRIACAO
    SELECT COUNT(*)
    INTO fk_criacao_exists
    FROM USER_CONSTRAINTS
    WHERE CONSTRAINT_NAME = 'FK_CONFIG_USER_CRIACAO';
    
    -- Verificar FK_CONFIG_USER_ALTERACAO
    SELECT COUNT(*)
    INTO fk_alteracao_exists
    FROM USER_CONSTRAINTS
    WHERE CONSTRAINT_NAME = 'FK_CONFIG_USER_ALTERACAO';
    
    IF fk_criacao_exists > 0 AND fk_alteracao_exists > 0 THEN
        DBMS_OUTPUT.PUT_LINE('Relacionamentos da tabela CONFIGURACOES estão corretos');
    ELSE
        DBMS_OUTPUT.PUT_LINE('ATENÇÃO: Alguns relacionamentos da tabela CONFIGURACOES podem estar faltando');
    END IF;
END;
/

-- =====================================================
-- 5. ADICIONAR RELACIONAMENTOS ADICIONAIS ÚTEIS
-- =====================================================

-- Relacionar SETORES com PROCESSOS (setor_origem e setor_atual)
-- Nota: Como SETOR_ORIGEM e SETOR_ATUAL são VARCHAR2, não podemos criar FK diretas
-- Mas podemos criar índices para melhor performance

DECLARE
    index_origem_exists NUMBER := 0;
    index_atual_exists NUMBER := 0;
BEGIN
    -- Verificar índice para setor_origem
    SELECT COUNT(*)
    INTO index_origem_exists
    FROM USER_INDEXES
    WHERE INDEX_NAME = 'IDX_PROCESSOS_SETOR_ORIGEM';
    
    -- Verificar índice para setor_atual
    SELECT COUNT(*)
    INTO index_atual_exists
    FROM USER_INDEXES
    WHERE INDEX_NAME = 'IDX_PROCESSOS_SETOR_ATUAL';
    
    IF index_origem_exists = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX IDX_PROCESSOS_SETOR_ORIGEM ON PROCESSOS(SETOR_ORIGEM)';
        DBMS_OUTPUT.PUT_LINE('Índice IDX_PROCESSOS_SETOR_ORIGEM criado');
    END IF;
    
    IF index_atual_exists = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX IDX_PROCESSOS_SETOR_ATUAL ON PROCESSOS(SETOR_ATUAL)';
        DBMS_OUTPUT.PUT_LINE('Índice IDX_PROCESSOS_SETOR_ATUAL criado');
    END IF;
END;
/

-- =====================================================
-- 6. RESUMO DOS RELACIONAMENTOS CORRIGIDOS
-- =====================================================

BEGIN
    DBMS_OUTPUT.PUT_LINE('=== RESUMO DOS RELACIONAMENTOS CORRIGIDOS ===');
    DBMS_OUTPUT.PUT_LINE('1. TIPOS_PROCESSO -> PROCESSOS (via TIPO_PROCESSO_ID)');
    DBMS_OUTPUT.PUT_LINE('2. CONFIGURACOES -> USUARIOS (via USUARIO_CRIACAO_ID e USUARIO_ALTERACAO_ID)');
    DBMS_OUTPUT.PUT_LINE('3. LOGS_AUDITORIA -> USUARIOS (via USUARIO_ID)');
    DBMS_OUTPUT.PUT_LINE('4. TRAMITACOES (MOVIMENTACOES) -> PROCESSOS, USUARIOS');
    DBMS_OUTPUT.PUT_LINE('5. View MOVIMENTACOES criada como alias para TRAMITACOES');
    DBMS_OUTPUT.PUT_LINE('6. Índices adicionais para melhor performance');
    DBMS_OUTPUT.PUT_LINE('=== CORREÇÃO CONCLUÍDA ===');
END;
/

-- Commit das alterações
COMMIT;