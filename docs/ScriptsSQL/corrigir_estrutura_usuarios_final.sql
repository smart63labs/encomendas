-- =====================================================
-- SCRIPT FINAL PARA CORRIGIR ESTRUTURA DA TABELA USUARIOS
-- Execute este script quando não houver outras sessões usando a tabela
-- =====================================================

-- IMPORTANTE: Execute este script em uma sessão exclusiva do banco
-- Certifique-se de que nenhuma aplicação está conectada à tabela USUARIOS

-- =====================================================
-- VERIFICAÇÕES PRELIMINARES
-- =====================================================

-- Verificar estrutura atual da tabela
DESCRIBE USUARIOS;

-- Fazer commit de qualquer transação pendente
COMMIT;

-- =====================================================
-- ALTERAÇÕES NA ESTRUTURA DA TABELA
-- =====================================================

-- 1. ALTERAR ULTIMO_LOGIN para aceitar formato de data mais flexível
-- (de TIMESTAMP(6) para VARCHAR2(50) temporariamente)
ALTER TABLE USUARIOS MODIFY ULTIMO_LOGIN VARCHAR2(50);

-- 2. AUMENTAR TAMANHO DO CAMPO PIS/PASEP 
ALTER TABLE USUARIOS MODIFY "PIS/PASEP" VARCHAR2(20);

-- 3. AUMENTAR TAMANHO DO CAMPO COMISSAO_FUNÇAO
ALTER TABLE USUARIOS MODIFY "COMISSAO_FUNÇAO" VARCHAR2(500);

-- 4. ALTERAR VINCULO_FUNCIONAL para aceitar valores numéricos como string
ALTER TABLE USUARIOS MODIFY VINCULO_FUNCIONAL VARCHAR2(100);

-- 5. AUMENTAR TAMANHOS DE CAMPOS QUE PODEM TER VALORES LONGOS
ALTER TABLE USUARIOS MODIFY ENDERECO VARCHAR2(500);
ALTER TABLE USUARIOS MODIFY CARGO VARCHAR2(200);
ALTER TABLE USUARIOS MODIFY ORGAO VARCHAR2(200);

-- 6. ALTERAR PNE para aceitar valores mais longos temporariamente
ALTER TABLE USUARIOS MODIFY PNE VARCHAR2(10);

-- 7. ALTERAR CAMPOS DE DATA para VARCHAR2 temporariamente para receber formato DD/MM/YYYY
ALTER TABLE USUARIOS MODIFY DATA_NASCIMENTO VARCHAR2(20);
ALTER TABLE USUARIOS MODIFY EXPEDICAO_RG VARCHAR2(20);
ALTER TABLE USUARIOS MODIFY DATA_INI_COMISSAO VARCHAR2(20);

-- 8. AUMENTAR OUTROS CAMPOS QUE PODEM TER VALORES MAIORES
ALTER TABLE USUARIOS MODIFY NOME VARCHAR2(200);
ALTER TABLE USUARIOS MODIFY EMAIL VARCHAR2(150);
ALTER TABLE USUARIOS MODIFY CPF VARCHAR2(20);
ALTER TABLE USUARIOS MODIFY RG VARCHAR2(30);
ALTER TABLE USUARIOS MODIFY TELEFONE VARCHAR2(30);
ALTER TABLE USUARIOS MODIFY CELULAR VARCHAR2(30);

-- =====================================================
-- VERIFICAÇÕES PÓS-ALTERAÇÃO
-- =====================================================

-- Verificar a estrutura atualizada da tabela
DESCRIBE USUARIOS;

-- Contar registros atuais
SELECT COUNT(*) AS TOTAL_REGISTROS_ATUAIS FROM USUARIOS;

-- Fazer commit das alterações
COMMIT;

PROMPT 'Estrutura da tabela USUARIOS corrigida com sucesso!';
PROMPT 'Agora você pode importar o arquivo CSV.';

-- =====================================================
-- SCRIPT DE LIMPEZA DE DADOS PÓS-IMPORTAÇÃO
-- (Execute APÓS importar o CSV)
-- =====================================================

/*
-- IMPORTANTE: Execute este bloco APÓS importar o CSV

-- 1. Converter USUARIO_ATIVO de "1"/"0" para "S"/"N"
UPDATE USUARIOS 
SET USUARIO_ATIVO = CASE 
    WHEN USUARIO_ATIVO = '1' THEN 'S'
    WHEN USUARIO_ATIVO = '0' THEN 'N'
    ELSE USUARIO_ATIVO
END
WHERE USUARIO_ATIVO IN ('1', '0');

-- 2. Converter PNE de texto completo para "S"/"N"
UPDATE USUARIOS 
SET PNE = CASE 
    WHEN UPPER(PNE) IN ('SIM', 'S') THEN 'S'
    WHEN UPPER(PNE) IN ('NAO', 'NÃO', 'N') THEN 'N'
    ELSE 'N'
END;

-- 3. Converter datas de DD/MM/YYYY para DATE (se necessário)
-- DATA_NASCIMENTO
UPDATE USUARIOS 
SET DATA_NASCIMENTO = TO_CHAR(TO_DATE(DATA_NASCIMENTO, 'DD/MM/YYYY'), 'DD-MON-RR')
WHERE DATA_NASCIMENTO IS NOT NULL 
AND LENGTH(DATA_NASCIMENTO) = 10
AND DATA_NASCIMENTO LIKE '__/__/____';

-- EXPEDICAO_RG
UPDATE USUARIOS 
SET EXPEDICAO_RG = TO_CHAR(TO_DATE(EXPEDICAO_RG, 'DD/MM/YYYY'), 'DD-MON-RR')
WHERE EXPEDICAO_RG IS NOT NULL 
AND LENGTH(EXPEDICAO_RG) = 10
AND EXPEDICAO_RG LIKE '__/__/____';

-- DATA_INI_COMISSAO
UPDATE USUARIOS 
SET DATA_INI_COMISSAO = TO_CHAR(TO_DATE(DATA_INI_COMISSAO, 'DD/MM/YYYY'), 'DD-MON-RR')
WHERE DATA_INI_COMISSAO IS NOT NULL 
AND LENGTH(DATA_INI_COMISSAO) = 10
AND DATA_INI_COMISSAO LIKE '__/__/____';

-- 4. Limpar campos vazios (converter strings vazias para NULL)
UPDATE USUARIOS SET ULTIMO_LOGIN = NULL WHERE ULTIMO_LOGIN = '';
UPDATE USUARIOS SET "PIS/PASEP" = NULL WHERE "PIS/PASEP" = '';
UPDATE USUARIOS SET "COMISSAO_FUNÇAO" = NULL WHERE "COMISSAO_FUNÇAO" = '';

COMMIT;

-- Verificar os dados após limpeza
SELECT 
    COUNT(*) AS TOTAL_REGISTROS,
    COUNT(CASE WHEN USUARIO_ATIVO = 'S' THEN 1 END) AS USUARIOS_ATIVOS,
    COUNT(CASE WHEN PNE = 'S' THEN 1 END) AS USUARIOS_PNE,
    COUNT(CASE WHEN DATA_NASCIMENTO IS NOT NULL THEN 1 END) AS COM_DATA_NASCIMENTO
FROM USUARIOS;

PROMPT 'Limpeza dos dados concluída com sucesso!';
*/

-- =====================================================
-- INSTRUÇÕES DE USO:
-- =====================================================

/*
PASSOS PARA EXECUTAR:

1. Feche todas as aplicações que possam estar usando a tabela USUARIOS
2. Execute a primeira parte deste script (até a linha COMMIT)
3. Importe o arquivo USUARIOS_NORMALIZADO1.csv usando sua ferramenta de importação
4. Execute o bloco de limpeza comentado acima para ajustar os dados importados

OBSERVAÇÕES:
- Se ainda houver erro de bloqueio, aguarde alguns minutos e tente novamente
- Certifique-se de fazer backup da tabela antes de executar as alterações
- Os campos de data serão temporariamente VARCHAR2 para receber o formato DD/MM/YYYY do CSV
*/

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================