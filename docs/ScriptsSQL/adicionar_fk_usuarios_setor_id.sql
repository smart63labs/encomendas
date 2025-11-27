-- ============================================================
-- SCRIPT PARA ADICIONAR FOREIGN KEY CONSTRAINT
-- USUARIOS.SETOR_ID -> SETORES.ID
-- ============================================================
-- Data: 15/01/2025
-- Descrição: Adiciona constraint de foreign key para vincular 
--           a coluna SETOR_ID da tabela USUARIOS com a coluna ID da tabela SETORES
-- Conexão: protocolo_user/Anderline49@localhost:1521/FREEPDB1
-- ============================================================

-- 1. VERIFICAR SE A CONSTRAINT JÁ EXISTE
SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE, TABLE_NAME, R_CONSTRAINT_NAME
FROM USER_CONSTRAINTS 
WHERE TABLE_NAME = 'USUARIOS' 
  AND CONSTRAINT_TYPE = 'R'
  AND CONSTRAINT_NAME LIKE '%SETOR%';

-- 2. VERIFICAR SE EXISTEM DADOS INCONSISTENTES ANTES DE CRIAR A FK
-- (SETOR_ID que não existem na tabela SETORES)
SELECT COUNT(*) AS REGISTROS_INCONSISTENTES
FROM USUARIOS u
WHERE u.SETOR_ID IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM SETORES s WHERE s.ID = u.SETOR_ID
  );

-- 3. LISTAR OS REGISTROS INCONSISTENTES (se houver)
SELECT u.ID, u.NAME, u.EMAIL, u.SETOR_ID
FROM USUARIOS u
WHERE u.SETOR_ID IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM SETORES s WHERE s.ID = u.SETOR_ID
  );

-- 4. ADICIONAR A CONSTRAINT DE FOREIGN KEY
-- Só execute se não houver registros inconsistentes
BEGIN
    -- Verificar se a constraint já existe
    DECLARE
        v_count NUMBER;
    BEGIN
        SELECT COUNT(*)
        INTO v_count
        FROM USER_CONSTRAINTS
        WHERE TABLE_NAME = 'USUARIOS'
          AND CONSTRAINT_TYPE = 'R'
          AND (CONSTRAINT_NAME = 'FK_USUARIOS_SETOR_ID' OR CONSTRAINT_NAME LIKE '%USUARIOS_SETOR%');
        
        IF v_count = 0 THEN
            -- Adicionar a constraint
            EXECUTE IMMEDIATE 'ALTER TABLE USUARIOS 
                              ADD CONSTRAINT FK_USUARIOS_SETOR_ID 
                              FOREIGN KEY (SETOR_ID) 
                              REFERENCES SETORES(ID)';
            
            DBMS_OUTPUT.PUT_LINE('✅ Constraint FK_USUARIOS_SETOR_ID criada com sucesso!');
        ELSE
            DBMS_OUTPUT.PUT_LINE('ℹ️  Constraint de foreign key para SETOR_ID já existe.');
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('❌ Erro ao criar constraint: ' || SQLERRM);
            RAISE;
    END;
END;
/

-- 5. VERIFICAR SE A CONSTRAINT FOI CRIADA CORRETAMENTE
SELECT 
    c.CONSTRAINT_NAME,
    c.CONSTRAINT_TYPE,
    c.TABLE_NAME,
    cc.COLUMN_NAME,
    c.R_CONSTRAINT_NAME,
    rc.TABLE_NAME AS REFERENCED_TABLE
FROM USER_CONSTRAINTS c
JOIN USER_CONS_COLUMNS cc ON c.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
LEFT JOIN USER_CONSTRAINTS rc ON c.R_CONSTRAINT_NAME = rc.CONSTRAINT_NAME
WHERE c.TABLE_NAME = 'USUARIOS' 
  AND c.CONSTRAINT_TYPE = 'R'
  AND cc.COLUMN_NAME = 'SETOR_ID';

-- 6. CRIAR ÍNDICE PARA PERFORMANCE (se não existir)
BEGIN
    DECLARE
        v_count NUMBER;
    BEGIN
        SELECT COUNT(*)
        INTO v_count
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
END;
/

-- 7. ADICIONAR COMENTÁRIO À COLUNA
COMMENT ON COLUMN USUARIOS.SETOR_ID IS 'ID do setor ao qual o usuário pertence (FK para SETORES.ID)';

-- 8. VERIFICAÇÃO FINAL
PROMPT ============================================================
PROMPT VERIFICAÇÃO FINAL - CONSTRAINT FOREIGN KEY
PROMPT ============================================================

SELECT 
    'CONSTRAINT CRIADA' AS STATUS,
    c.CONSTRAINT_NAME,
    c.TABLE_NAME || '.' || cc.COLUMN_NAME AS COLUNA_ORIGEM,
    rc.TABLE_NAME || '.ID' AS COLUNA_DESTINO
FROM USER_CONSTRAINTS c
JOIN USER_CONS_COLUMNS cc ON c.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
JOIN USER_CONSTRAINTS rc ON c.R_CONSTRAINT_NAME = rc.CONSTRAINT_NAME
WHERE c.TABLE_NAME = 'USUARIOS' 
  AND c.CONSTRAINT_TYPE = 'R'
  AND cc.COLUMN_NAME = 'SETOR_ID';

PROMPT ============================================================
PROMPT SCRIPT EXECUTADO COM SUCESSO!
PROMPT A coluna USUARIOS.SETOR_ID agora está vinculada à SETORES.ID
PROMPT ============================================================

EXIT;