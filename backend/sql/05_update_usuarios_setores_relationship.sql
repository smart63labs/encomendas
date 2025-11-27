-- =====================================================
-- SCRIPT DE ATUALIZAÇÃO DA TABELA USUARIOS
-- Data: 2025-01-11
-- Objetivo: Adicionar relacionamento com SETORES e remover coluna DEPARTAMENTO
-- =====================================================

-- Configurações iniciais
SET SERVEROUTPUT ON;
ALTER SESSION SET NLS_DATE_FORMAT = 'DD/MM/YYYY HH24:MI:SS';

PROMPT '=====================================================';
PROMPT 'INICIANDO ATUALIZAÇÃO DA TABELA USUARIOS';
PROMPT '=====================================================';

-- =====================================================
-- 1. VERIFICAR SE A COLUNA SETOR_ID JÁ EXISTE
-- =====================================================

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM USER_TAB_COLUMNS
    WHERE TABLE_NAME = 'USUARIOS' AND COLUMN_NAME = 'SETOR_ID';
    
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'ALTER TABLE USUARIOS ADD SETOR_ID NUMBER(10)';
        DBMS_OUTPUT.PUT_LINE('✅ Coluna SETOR_ID adicionada com sucesso!');
    ELSE
        DBMS_OUTPUT.PUT_LINE('ℹ️  Coluna SETOR_ID já existe na tabela.');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('❌ Erro ao adicionar coluna SETOR_ID: ' || SQLERRM);
END;
/

-- =====================================================
-- 2. CRIAR ÍNDICE PARA SETOR_ID
-- =====================================================

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM USER_INDEXES
    WHERE INDEX_NAME = 'IDX_USUARIOS_SETOR_ID';
    
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX IDX_USUARIOS_SETOR_ID ON USUARIOS(SETOR_ID)';
        DBMS_OUTPUT.PUT_LINE('✅ Índice IDX_USUARIOS_SETOR_ID criado com sucesso!');
    ELSE
        DBMS_OUTPUT.PUT_LINE('ℹ️  Índice IDX_USUARIOS_SETOR_ID já existe.');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('❌ Erro ao criar índice: ' || SQLERRM);
END;
/

-- =====================================================
-- 3. CRIAR FOREIGN KEY PARA SETORES
-- =====================================================

DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM USER_CONSTRAINTS
    WHERE CONSTRAINT_NAME = 'FK_USUARIOS_SETOR';
    
    IF v_count = 0 THEN
        EXECUTE IMMEDIATE 'ALTER TABLE USUARIOS ADD CONSTRAINT FK_USUARIOS_SETOR FOREIGN KEY (SETOR_ID) REFERENCES SETORES(ID)';
        DBMS_OUTPUT.PUT_LINE('✅ Foreign Key FK_USUARIOS_SETOR criada com sucesso!');
    ELSE
        DBMS_OUTPUT.PUT_LINE('ℹ️  Foreign Key FK_USUARIOS_SETOR já existe.');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('❌ Erro ao criar foreign key: ' || SQLERRM);
END;
/

-- =====================================================
-- 4. MIGRAR DADOS DE DEPARTAMENTO PARA SETORES
-- =====================================================

PROMPT 'Migrando dados de DEPARTAMENTO para SETORES...';

-- Inserir setores baseados nos departamentos existentes
INSERT INTO SETORES (NOME, SIGLA, DESCRICAO, ATIVO)
SELECT DISTINCT 
    DEPARTAMENTO as NOME,
    UPPER(SUBSTR(DEPARTAMENTO, 1, 10)) as SIGLA,
    'Setor migrado automaticamente do campo DEPARTAMENTO' as DESCRICAO,
    'S' as ATIVO
FROM USUARIOS 
WHERE DEPARTAMENTO IS NOT NULL 
  AND DEPARTAMENTO != ''
  AND NOT EXISTS (
    SELECT 1 FROM SETORES S 
    WHERE S.NOME = USUARIOS.DEPARTAMENTO
  );

DBMS_OUTPUT.PUT_LINE('✅ Setores criados baseados nos departamentos existentes.');

-- Atualizar SETOR_ID dos usuários baseado no DEPARTAMENTO
UPDATE USUARIOS U
SET SETOR_ID = (
    SELECT S.ID 
    FROM SETORES S 
    WHERE S.NOME = U.DEPARTAMENTO
)
WHERE U.DEPARTAMENTO IS NOT NULL 
  AND U.DEPARTAMENTO != ''
  AND U.SETOR_ID IS NULL;

DBMS_OUTPUT.PUT_LINE('✅ SETOR_ID atualizado para usuários existentes.');

-- =====================================================
-- 5. REMOVER COLUNA DEPARTAMENTO (OPCIONAL)
-- =====================================================

-- Comentário: Removendo a coluna DEPARTAMENTO pois agora usamos SETOR_ID
-- Descomente as linhas abaixo se desejar remover a coluna DEPARTAMENTO

/*
DECLARE
    v_count NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM USER_TAB_COLUMNS
    WHERE TABLE_NAME = 'USUARIOS' AND COLUMN_NAME = 'DEPARTAMENTO';
    
    IF v_count > 0 THEN
        EXECUTE IMMEDIATE 'ALTER TABLE USUARIOS DROP COLUMN DEPARTAMENTO';
        DBMS_OUTPUT.PUT_LINE('✅ Coluna DEPARTAMENTO removida com sucesso!');
    ELSE
        DBMS_OUTPUT.PUT_LINE('ℹ️  Coluna DEPARTAMENTO não existe na tabela.');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('❌ Erro ao remover coluna DEPARTAMENTO: ' || SQLERRM);
END;
/
*/

-- =====================================================
-- 6. ADICIONAR COMENTÁRIOS
-- =====================================================

COMMENT ON COLUMN USUARIOS.SETOR_ID IS 'ID do setor ao qual o usuário pertence (FK para SETORES)';

-- =====================================================
-- 7. VERIFICAR ESTRUTURA FINAL
-- =====================================================

PROMPT 'Verificando estrutura final da tabela USUARIOS...';

SELECT COLUMN_NAME, DATA_TYPE, NULLABLE, DATA_DEFAULT
FROM USER_TAB_COLUMNS
WHERE TABLE_NAME = 'USUARIOS'
ORDER BY COLUMN_ID;

PROMPT 'Verificando relacionamentos...';

SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE, R_CONSTRAINT_NAME
FROM USER_CONSTRAINTS
WHERE TABLE_NAME = 'USUARIOS'
AND CONSTRAINT_TYPE = 'R';

COMMIT;

PROMPT '=====================================================';
PROMPT 'ATUALIZAÇÃO DA TABELA USUARIOS CONCLUÍDA COM SUCESSO!';
PROMPT '=====================================================';
PROMPT 'Resumo das alterações:';
PROMPT '- Adicionada coluna SETOR_ID';
PROMPT '- Criado índice IDX_USUARIOS_SETOR_ID';
PROMPT '- Criada foreign key FK_USUARIOS_SETOR';
PROMPT '- Migrados dados de DEPARTAMENTO para SETORES';
PROMPT '- Atualizado SETOR_ID dos usuários existentes';
PROMPT '=====================================================';