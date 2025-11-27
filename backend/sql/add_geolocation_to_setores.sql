-- =====================================================
-- SCRIPT PARA ADICIONAR CAMPOS DE GEOLOCALIZAÇÃO
-- Data: 2025-01-24
-- Objetivo: Adicionar campos LATITUDE e LONGITUDE na tabela SETORES
-- =====================================================

-- Configurações iniciais
SET SERVEROUTPUT ON;
ALTER SESSION SET NLS_DATE_FORMAT = 'DD/MM/YYYY HH24:MI:SS';

PROMPT '=====================================================';
PROMPT 'ADICIONANDO CAMPOS DE GEOLOCALIZAÇÃO NA TABELA SETORES';
PROMPT '=====================================================';

-- =====================================================
-- 1. VERIFICAR SE OS CAMPOS JÁ EXISTEM
-- =====================================================

DECLARE
    v_count_lat NUMBER;
    v_count_lng NUMBER;
BEGIN
    -- Verificar se LATITUDE já existe
    SELECT COUNT(*) INTO v_count_lat
    FROM USER_TAB_COLUMNS
    WHERE TABLE_NAME = 'SETORES' AND COLUMN_NAME = 'LATITUDE';
    
    -- Verificar se LONGITUDE já existe
    SELECT COUNT(*) INTO v_count_lng
    FROM USER_TAB_COLUMNS
    WHERE TABLE_NAME = 'SETORES' AND COLUMN_NAME = 'LONGITUDE';
    
    -- Adicionar LATITUDE se não existir
    IF v_count_lat = 0 THEN
        EXECUTE IMMEDIATE 'ALTER TABLE SETORES ADD LATITUDE NUMBER(10,8)';
        DBMS_OUTPUT.PUT_LINE('✅ Campo LATITUDE adicionado com sucesso!');
    ELSE
        DBMS_OUTPUT.PUT_LINE('ℹ️  Campo LATITUDE já existe na tabela.');
    END IF;
    
    -- Adicionar LONGITUDE se não existir
    IF v_count_lng = 0 THEN
        EXECUTE IMMEDIATE 'ALTER TABLE SETORES ADD LONGITUDE NUMBER(11,8)';
        DBMS_OUTPUT.PUT_LINE('✅ Campo LONGITUDE adicionado com sucesso!');
    ELSE
        DBMS_OUTPUT.PUT_LINE('ℹ️  Campo LONGITUDE já existe na tabela.');
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('❌ Erro ao adicionar campos de geolocalização: ' || SQLERRM);
END;
/

-- =====================================================
-- 2. ADICIONAR COMENTÁRIOS NOS CAMPOS
-- =====================================================

COMMENT ON COLUMN SETORES.LATITUDE IS 'Latitude da localização do setor (formato decimal)';
COMMENT ON COLUMN SETORES.LONGITUDE IS 'Longitude da localização do setor (formato decimal)';

DBMS_OUTPUT.PUT_LINE('✅ Comentários adicionados aos campos de geolocalização.');

-- =====================================================
-- 3. CRIAR ÍNDICES PARA OS CAMPOS DE GEOLOCALIZAÇÃO
-- =====================================================

DECLARE
    v_count NUMBER;
BEGIN
    -- Verificar se o índice de geolocalização já existe
    SELECT COUNT(*) INTO v_count
    FROM USER_INDEXES
    WHERE INDEX_NAME = 'IDX_SETORES_GEOLOCATION';
    
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX IDX_SETORES_GEOLOCATION ON SETORES(LATITUDE, LONGITUDE)';
        DBMS_OUTPUT.PUT_LINE('✅ Índice de geolocalização criado com sucesso!');
    ELSE
        DBMS_OUTPUT.PUT_LINE('ℹ️  Índice de geolocalização já existe.');
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('❌ Erro ao criar índice de geolocalização: ' || SQLERRM);
END;
/

-- =====================================================
-- 4. VERIFICAR ESTRUTURA FINAL DA TABELA
-- =====================================================

PROMPT 'Verificando estrutura final da tabela SETORES...';

SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH, DATA_PRECISION, DATA_SCALE, NULLABLE
FROM USER_TAB_COLUMNS
WHERE TABLE_NAME = 'SETORES'
AND COLUMN_NAME IN ('LATITUDE', 'LONGITUDE')
ORDER BY COLUMN_NAME;

COMMIT;

PROMPT '=====================================================';
PROMPT 'CAMPOS DE GEOLOCALIZAÇÃO ADICIONADOS COM SUCESSO!';
PROMPT '=====================================================';
PROMPT 'Resumo das alterações:';
PROMPT '- Adicionado campo LATITUDE (NUMBER(10,8))';
PROMPT '- Adicionado campo LONGITUDE (NUMBER(11,8))';
PROMPT '- Criado índice IDX_SETORES_GEOLOCATION';
PROMPT '- Adicionados comentários nos campos';
PROMPT '=====================================================';