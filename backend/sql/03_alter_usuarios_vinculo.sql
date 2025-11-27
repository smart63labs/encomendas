-- =====================================================
-- SCRIPT DE ALTERAÇÃO DA TABELA USUARIOS
-- Data: 11/09/2025
-- Objetivo: Remover colunas desnecessárias e adicionar VINCULO_FUNCIONAL
-- =====================================================

-- Configurações iniciais
SET SERVEROUTPUT ON;
ALTER SESSION SET NLS_DATE_FORMAT = 'DD/MM/YYYY HH24:MI:SS';

PROMPT '=====================================================';
PROMPT 'INICIANDO ALTERAÇÕES NA TABELA USUARIOS';
PROMPT '=====================================================';

-- =====================================================
-- BACKUP DOS DADOS ANTES DAS ALTERAÇÕES
-- =====================================================

PROMPT 'Verificando estrutura atual da tabela USUARIOS...';

-- Verificar se as colunas existem antes de tentar removê-las
SELECT COLUMN_NAME 
FROM USER_TAB_COLUMNS 
WHERE TABLE_NAME = 'USUARIOS' 
AND COLUMN_NAME IN ('PIS_PASEP', 'NOME_PAI', 'NOME_MAE', 'VINCULO_FUNCIONAL')
ORDER BY COLUMN_NAME;

-- =====================================================
-- REMOÇÃO DAS COLUNAS DESNECESSÁRIAS
-- =====================================================

PROMPT 'Removendo coluna PIS_PASEP...';

-- Verificar se a coluna PIS_PASEP existe antes de remover
DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM USER_TAB_COLUMNS
    WHERE TABLE_NAME = 'USUARIOS' AND COLUMN_NAME = 'PIS_PASEP';
    
    IF v_count > 0 THEN
        EXECUTE IMMEDIATE 'ALTER TABLE USUARIOS DROP COLUMN PIS_PASEP';
        DBMS_OUTPUT.PUT_LINE('✅ Coluna PIS_PASEP removida com sucesso!');
    ELSE
        DBMS_OUTPUT.PUT_LINE('ℹ️  Coluna PIS_PASEP não existe na tabela.');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('❌ Erro ao remover coluna PIS_PASEP: ' || SQLERRM);
END;
/

PROMPT 'Removendo coluna NOME_PAI...';

-- Verificar se a coluna NOME_PAI existe antes de remover
DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM USER_TAB_COLUMNS
    WHERE TABLE_NAME = 'USUARIOS' AND COLUMN_NAME = 'NOME_PAI';
    
    IF v_count > 0 THEN
        EXECUTE IMMEDIATE 'ALTER TABLE USUARIOS DROP COLUMN NOME_PAI';
        DBMS_OUTPUT.PUT_LINE('✅ Coluna NOME_PAI removida com sucesso!');
    ELSE
        DBMS_OUTPUT.PUT_LINE('ℹ️  Coluna NOME_PAI não existe na tabela.');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('❌ Erro ao remover coluna NOME_PAI: ' || SQLERRM);
END;
/

PROMPT 'Removendo coluna NOME_MAE...';

-- Verificar se a coluna NOME_MAE existe antes de remover
DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM USER_TAB_COLUMNS
    WHERE TABLE_NAME = 'USUARIOS' AND COLUMN_NAME = 'NOME_MAE';
    
    IF v_count > 0 THEN
        EXECUTE IMMEDIATE 'ALTER TABLE USUARIOS DROP COLUMN NOME_MAE';
        DBMS_OUTPUT.PUT_LINE('✅ Coluna NOME_MAE removida com sucesso!');
    ELSE
        DBMS_OUTPUT.PUT_LINE('ℹ️  Coluna NOME_MAE não existe na tabela.');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('❌ Erro ao remover coluna NOME_MAE: ' || SQLERRM);
END;
/

-- =====================================================
-- ADIÇÃO DA NOVA COLUNA VINCULO_FUNCIONAL
-- =====================================================

PROMPT 'Adicionando coluna VINCULO_FUNCIONAL...';

-- Verificar se a coluna VINCULO_FUNCIONAL já existe
DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM USER_TAB_COLUMNS
    WHERE TABLE_NAME = 'USUARIOS' AND COLUMN_NAME = 'VINCULO_FUNCIONAL';
    
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'ALTER TABLE USUARIOS ADD VINCULO_FUNCIONAL VARCHAR2(2)';
        DBMS_OUTPUT.PUT_LINE('✅ Coluna VINCULO_FUNCIONAL adicionada com sucesso!');
    ELSE
        DBMS_OUTPUT.PUT_LINE('ℹ️  Coluna VINCULO_FUNCIONAL já existe na tabela.');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('❌ Erro ao adicionar coluna VINCULO_FUNCIONAL: ' || SQLERRM);
END;
/

-- =====================================================
-- ADIÇÃO DE COMENTÁRIOS E CONSTRAINTS
-- =====================================================

PROMPT 'Adicionando comentários e constraints...';

-- Adicionar comentário na nova coluna
COMMENT ON COLUMN USUARIOS.VINCULO_FUNCIONAL IS 'Vínculo funcional do servidor (2 dígitos) - Parte do número funcional completo';

-- Adicionar constraint para garantir que seja exatamente 2 caracteres numéricos
DECLARE
    v_count NUMBER;
BEGIN
    -- Verificar se a constraint já existe
    SELECT COUNT(*) INTO v_count
    FROM USER_CONSTRAINTS
    WHERE TABLE_NAME = 'USUARIOS' AND CONSTRAINT_NAME = 'CHK_VINCULO_FUNCIONAL_FORMAT';
    
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'ALTER TABLE USUARIOS ADD CONSTRAINT CHK_VINCULO_FUNCIONAL_FORMAT CHECK (REGEXP_LIKE(VINCULO_FUNCIONAL, ''^[0-9]{2}$''))';
        DBMS_OUTPUT.PUT_LINE('✅ Constraint de formato adicionada para VINCULO_FUNCIONAL!');
    ELSE
        DBMS_OUTPUT.PUT_LINE('ℹ️  Constraint CHK_VINCULO_FUNCIONAL_FORMAT já existe.');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('❌ Erro ao adicionar constraint: ' || SQLERRM);
END;
/

-- =====================================================
-- MIGRAÇÃO DE DADOS EXISTENTES (SE NECESSÁRIO)
-- =====================================================

PROMPT 'Verificando necessidade de migração de dados...';

-- Se houver dados na coluna NUMERO_VINCULO, migrar para VINCULO_FUNCIONAL
DECLARE
    v_count NUMBER;
    v_vinculo_count NUMBER;
BEGIN
    -- Verificar se existe coluna NUMERO_VINCULO
    SELECT COUNT(*) INTO v_count
    FROM USER_TAB_COLUMNS
    WHERE TABLE_NAME = 'USUARIOS' AND COLUMN_NAME = 'NUMERO_VINCULO';
    
    IF v_count > 0 THEN
        -- Verificar se há dados para migrar
        EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM USUARIOS WHERE NUMERO_VINCULO IS NOT NULL' INTO v_vinculo_count;
        
        IF v_vinculo_count > 0 THEN
            DBMS_OUTPUT.PUT_LINE('Migrando dados de NUMERO_VINCULO para VINCULO_FUNCIONAL...');
            
            -- Migrar dados (convertendo para 2 dígitos com zero à esquerda se necessário)
            EXECUTE IMMEDIATE '
                UPDATE USUARIOS 
                SET VINCULO_FUNCIONAL = LPAD(TO_CHAR(NUMERO_VINCULO), 2, ''0'')
                WHERE NUMERO_VINCULO IS NOT NULL
                AND VINCULO_FUNCIONAL IS NULL';
            
            DBMS_OUTPUT.PUT_LINE('✅ Migração concluída! ' || SQL%ROWCOUNT || ' registros atualizados.');
        ELSE
            DBMS_OUTPUT.PUT_LINE('ℹ️  Não há dados para migrar em NUMERO_VINCULO.');
        END IF;
    ELSE
        DBMS_OUTPUT.PUT_LINE('ℹ️  Coluna NUMERO_VINCULO não existe.');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('❌ Erro na migração de dados: ' || SQLERRM);
END;
/

-- =====================================================
-- CRIAÇÃO DE FUNÇÃO PARA NÚMERO FUNCIONAL COMPLETO
-- =====================================================

PROMPT 'Criando função para número funcional completo...';

-- Função para retornar o número funcional completo (NUMERO_FUNCIONAL-VINCULO_FUNCIONAL)
CREATE OR REPLACE FUNCTION GET_NUMERO_FUNCIONAL_COMPLETO(p_usuario_id NUMBER)
RETURN VARCHAR2
IS
    v_numero_funcional NUMBER;
    v_vinculo_funcional VARCHAR2(2);
    v_resultado VARCHAR2(20);
BEGIN
    SELECT NUMERO_FUNCIONAL, VINCULO_FUNCIONAL
    INTO v_numero_funcional, v_vinculo_funcional
    FROM USUARIOS
    WHERE ID = p_usuario_id;
    
    IF v_numero_funcional IS NOT NULL AND v_vinculo_funcional IS NOT NULL THEN
        v_resultado := TO_CHAR(v_numero_funcional) || '-' || v_vinculo_funcional;
    ELSIF v_numero_funcional IS NOT NULL THEN
        v_resultado := TO_CHAR(v_numero_funcional);
    ELSE
        v_resultado := NULL;
    END IF;
    
    RETURN v_resultado;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN NULL;
    WHEN OTHERS THEN
        RETURN NULL;
END GET_NUMERO_FUNCIONAL_COMPLETO;
/

PROMPT '✅ Função GET_NUMERO_FUNCIONAL_COMPLETO criada com sucesso!';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

PROMPT 'Verificando estrutura final da tabela USUARIOS...';

-- Mostrar colunas relacionadas ao número funcional
SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH, NULLABLE
FROM USER_TAB_COLUMNS
WHERE TABLE_NAME = 'USUARIOS'
AND (COLUMN_NAME LIKE '%FUNCIONAL%' OR COLUMN_NAME LIKE '%VINCULO%')
ORDER BY COLUMN_NAME;

-- Verificar se as colunas removidas não existem mais
PROMPT 'Verificando se as colunas foram removidas...';
SELECT COLUMN_NAME
FROM USER_TAB_COLUMNS
WHERE TABLE_NAME = 'USUARIOS'
AND COLUMN_NAME IN ('PIS_PASEP', 'NOME_PAI', 'NOME_MAE');

-- Contar total de colunas
SELECT COUNT(*) AS TOTAL_COLUNAS
FROM USER_TAB_COLUMNS
WHERE TABLE_NAME = 'USUARIOS';

-- =====================================================
-- EXEMPLO DE USO
-- =====================================================

PROMPT 'Exemplo de uso da nova estrutura:';
PROMPT 'Para inserir um usuário com número funcional 123456-01:';
PROMPT 'INSERT INTO USUARIOS (NOME, EMAIL, NUMERO_FUNCIONAL, VINCULO_FUNCIONAL) VALUES';
PROMPT '(''João Silva'', ''joao@exemplo.com'', 123456, ''01'');';
PROMPT '';
PROMPT 'Para consultar o número funcional completo:';
PROMPT 'SELECT NOME, GET_NUMERO_FUNCIONAL_COMPLETO(ID) AS NUMERO_COMPLETO FROM USUARIOS;';

-- =====================================================
-- FINALIZAÇÃO
-- =====================================================

COMMIT;

PROMPT '=====================================================';
PROMPT 'ALTERAÇÕES CONCLUÍDAS COM SUCESSO!';
PROMPT '=====================================================';
PROMPT 'Resumo das alterações:';
PROMPT '✅ Coluna PIS_PASEP removida';
PROMPT '✅ Coluna NOME_PAI removida';
PROMPT '✅ Coluna NOME_MAE removida';
PROMPT '✅ Coluna VINCULO_FUNCIONAL adicionada (VARCHAR2(2))';
PROMPT '✅ Constraint de formato adicionada';
PROMPT '✅ Função GET_NUMERO_FUNCIONAL_COMPLETO criada';
PROMPT '✅ Comentários adicionados';
PROMPT '=====================================================';

EXIT;