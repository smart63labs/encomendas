-- =====================================================
-- SOLUÇÃO ALTERNATIVA: ADICIONAR NOVAS COLUNAS PARA IMPORTAÇÃO CSV
-- Arquivo: solucao_alternativa_colunas.sql
-- Data: $(date)
-- Objetivo: Adicionar colunas temporárias para receber dados do CSV
-- =====================================================

-- ESTRATÉGIA: Como não podemos dropar as colunas existentes devido ao lock,
-- vamos adicionar novas colunas com nomes diferentes para receber os dados do CSV

-- 1. COMMIT para liberar possíveis locks
COMMIT;

-- 2. ADICIONAR NOVAS COLUNAS PARA IMPORTAÇÃO
-- Estas colunas receberão os dados do CSV

-- 2.1. Coluna para USUARIO_ATIVO (dados do CSV)
ALTER TABLE USUARIOS ADD USUARIO_ATIVO_CSV VARCHAR2(10);

-- 2.2. Coluna para ULTIMO_LOGIN (dados do CSV)
ALTER TABLE USUARIOS ADD ULTIMO_LOGIN_CSV VARCHAR2(50);

-- 2.3. Coluna para PIS/PASEP (dados do CSV)
ALTER TABLE USUARIOS ADD PIS_PASEP_CSV VARCHAR2(20);

-- 2.4. Coluna para COMISSAO_FUNÇAO (dados do CSV)
ALTER TABLE USUARIOS ADD COMISSAO_FUNCAO_CSV VARCHAR2(500);

-- 2.5. Colunas para datas (dados do CSV)
ALTER TABLE USUARIOS ADD DATA_CRIACAO_CSV VARCHAR2(50);
ALTER TABLE USUARIOS ADD DATA_ATUALIZACAO_CSV VARCHAR2(50);
ALTER TABLE USUARIOS ADD BLOQUEADO_ATE_CSV VARCHAR2(50);
ALTER TABLE USUARIOS ADD DATA_NASCIMENTO_CSV VARCHAR2(50);
ALTER TABLE USUARIOS ADD EXPEDICAO_RG_CSV VARCHAR2(50);
ALTER TABLE USUARIOS ADD DATA_INI_COMISSAO_CSV VARCHAR2(50);

-- 2.6. Coluna para PNE (dados do CSV)
ALTER TABLE USUARIOS ADD PNE_CSV VARCHAR2(10);

-- 2.7. Coluna adicional EMAIL se necessário
ALTER TABLE USUARIOS ADD EMAIL_CSV VARCHAR2(255);

-- 3. COMMIT das alterações
COMMIT;

-- 4. VERIFICAR AS NOVAS COLUNAS
SELECT column_name, data_type, data_length 
FROM user_tab_columns 
WHERE table_name = 'USUARIOS' 
AND column_name LIKE '%_CSV'
ORDER BY column_name;

-- =====================================================
-- INSTRUÇÕES DE USO:
-- =====================================================
-- 1. Execute este script para adicionar as colunas temporárias
-- 2. Configure sua ferramenta de importação para mapear:
--    - USUARIO_ATIVO -> USUARIO_ATIVO_CSV
--    - ULTIMO_LOGIN -> ULTIMO_LOGIN_CSV
--    - PIS/PASEP -> PIS_PASEP_CSV
--    - COMISSAO_FUNÇAO -> COMISSAO_FUNCAO_CSV
--    - DATA_CRIACAO -> DATA_CRIACAO_CSV
--    - DATA_ATUALIZACAO -> DATA_ATUALIZACAO_CSV
--    - BLOQUEADO_ATE -> BLOQUEADO_ATE_CSV
--    - DATA_NASCIMENTO -> DATA_NASCIMENTO_CSV
--    - EXPEDICAO_RG -> EXPEDICAO_RG_CSV
--    - DATA_INI_COMISSAO -> DATA_INI_COMISSAO_CSV
--    - PNE -> PNE_CSV
--    - E_MAIL -> EMAIL_CSV (se necessário)
-- 3. Importe o CSV: c:\Users\88417646191\Documents\NovoProtocolo\V2\docs\USUARIOS_NORMALIZADO1.csv
-- 4. Após a importação, execute o script de transferência de dados

-- VANTAGENS DESTA SOLUÇÃO:
-- - Não interfere com as colunas existentes
-- - Não requer locks na tabela
-- - Permite importação imediata
-- - Mantém dados originais seguros
-- =====================================================