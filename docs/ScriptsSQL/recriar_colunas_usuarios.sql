-- =====================================================
-- SCRIPT PARA RECRIAR COLUNAS PROBLEMÁTICAS DA TABELA USUARIOS
-- Arquivo: recriar_colunas_usuarios.sql
-- Data: $(date)
-- Objetivo: Recriar colunas com tipos adequados para importação do CSV
-- =====================================================

-- IMPORTANTE: Execute este script quando não houver outras sessões usando a tabela USUARIOS

-- 1. COMMIT para liberar possíveis locks
COMMIT;

-- 2. RECRIAR COLUNAS PROBLEMÁTICAS
-- Baseado na análise do CSV e nos erros de importação

-- 2.1. Recriar USUARIO_ATIVO (atualmente CHAR(1), precisa ser VARCHAR2 para aceitar valores vazios)
ALTER TABLE USUARIOS DROP COLUMN USUARIO_ATIVO;
ALTER TABLE USUARIOS ADD USUARIO_ATIVO VARCHAR2(10);

-- 2.2. Recriar ULTIMO_LOGIN (atualmente TIMESTAMP(6), precisa ser VARCHAR2 para aceitar valores vazios)
ALTER TABLE USUARIOS DROP COLUMN ULTIMO_LOGIN;
ALTER TABLE USUARIOS ADD ULTIMO_LOGIN VARCHAR2(50);

-- 2.3. Recriar PIS/PASEP (atualmente VARCHAR2(15), precisa ser maior para aceitar os dados do CSV)
ALTER TABLE USUARIOS DROP COLUMN "PIS/PASEP";
ALTER TABLE USUARIOS ADD "PIS/PASEP" VARCHAR2(20);

-- 2.4. Recriar COMISSAO_FUNÇAO (atualmente VARCHAR2(255), pode precisar ser maior)
ALTER TABLE USUARIOS DROP COLUMN "COMISSAO_FUNÇAO";
ALTER TABLE USUARIOS ADD "COMISSAO_FUNÇAO" VARCHAR2(500);

-- 2.5. Recriar campos de data como VARCHAR2 para aceitar formatos diversos do CSV
ALTER TABLE USUARIOS DROP COLUMN DATA_CRIACAO;
ALTER TABLE USUARIOS ADD DATA_CRIACAO VARCHAR2(50);

ALTER TABLE USUARIOS DROP COLUMN DATA_ATUALIZACAO;
ALTER TABLE USUARIOS ADD DATA_ATUALIZACAO VARCHAR2(50);

ALTER TABLE USUARIOS DROP COLUMN BLOQUEADO_ATE;
ALTER TABLE USUARIOS ADD BLOQUEADO_ATE VARCHAR2(50);

ALTER TABLE USUARIOS DROP COLUMN DATA_NASCIMENTO;
ALTER TABLE USUARIOS ADD DATA_NASCIMENTO VARCHAR2(50);

ALTER TABLE USUARIOS DROP COLUMN EXPEDICAO_RG;
ALTER TABLE USUARIOS ADD EXPEDICAO_RG VARCHAR2(50);

ALTER TABLE USUARIOS DROP COLUMN DATA_INI_COMISSAO;
ALTER TABLE USUARIOS ADD DATA_INI_COMISSAO VARCHAR2(50);

-- 2.6. Recriar PNE para aceitar valores como "NAO", "NÃO", etc.
ALTER TABLE USUARIOS DROP COLUMN PNE;
ALTER TABLE USUARIOS ADD PNE VARCHAR2(10);

-- 2.7. Adicionar coluna EMAIL se não existir (observado no CSV)
-- Verificar se já existe a coluna EMAIL além de E_MAIL
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE USUARIOS ADD EMAIL VARCHAR2(255)';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE = -955 THEN
            -- Coluna já existe, apenas modificar o tamanho se necessário
            EXECUTE IMMEDIATE 'ALTER TABLE USUARIOS MODIFY EMAIL VARCHAR2(255)';
        ELSE
            RAISE;
        END IF;
END;
/

-- 3. COMMIT das alterações
COMMIT;

-- 4. VERIFICAR A ESTRUTURA FINAL
SELECT column_name, data_type, data_length, nullable 
FROM user_tab_columns 
WHERE table_name = 'USUARIOS' 
ORDER BY column_id;

-- =====================================================
-- INSTRUÇÕES DE USO:
-- =====================================================
-- 1. Feche todas as aplicações que possam estar usando a tabela USUARIOS
-- 2. Execute este script completo
-- 3. Verifique se não houve erros
-- 4. Teste a importação do CSV: c:\Users\88417646191\Documents\NovoProtocolo\V2\docs\USUARIOS_NORMALIZADO1.csv
-- 5. Após a importação bem-sucedida, execute o script de limpeza/conversão de dados se necessário

-- OBSERVAÇÕES:
-- - Todas as colunas de data foram convertidas para VARCHAR2 para aceitar diversos formatos
-- - As colunas problemáticas foram recriadas com tipos mais flexíveis
-- - Após a importação, você pode criar um script para converter os dados para os tipos corretos
-- =====================================================