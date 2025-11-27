-- Script para corrigir problemas de importação do arquivo USUARIOS_NORMALIZADO1.csv
-- Data: 2025-01-15
-- Descrição: Ajustes na tabela USUARIOS para compatibilidade com dados do CSV

-- =====================================================
-- ANÁLISE DOS PROBLEMAS IDENTIFICADOS:
-- =====================================================
-- 1. USUARIO_ATIVO: CSV tem valores "1" (string) mas tabela espera CHAR(1)
-- 2. ULTIMO_LOGIN: CSV tem campos vazios mas tabela é TIMESTAMP(6)
-- 3. DATA_NASCIMENTO: CSV tem formato DD/MM/YYYY mas tabela espera DATE
-- 4. EXPEDICAO_RG: CSV tem formato DD/MM/YYYY mas tabela espera DATE
-- 5. DATA_INI_COMISSAO: CSV tem formato DD/MM/YYYY mas tabela espera DATE
-- 6. VINCULO_FUNCIONAL: CSV tem valores numéricos mas tabela espera VARCHAR2(100)
-- 7. PNE: CSV tem valores "NAO"/"NÃO" mas tabela espera VARCHAR2(1)

-- =====================================================
-- SOLUÇÕES PROPOSTAS:
-- =====================================================

-- 1. Criar uma view temporária para transformar os dados durante a importação
CREATE OR REPLACE VIEW V_USUARIOS_IMPORT AS
SELECT 
    ID,
    SETOR_ID,
    ROLE,
    SENHA,
    -- Converter USUARIO_ATIVO de string para CHAR(1)
    CASE 
        WHEN USUARIO_ATIVO = '1' THEN '1'
        WHEN USUARIO_ATIVO = '0' THEN '0'
        ELSE 'N'
    END AS USUARIO_ATIVO,
    -- ULTIMO_LOGIN pode ficar NULL se vazio
    ULTIMO_LOGIN,
    TENTATIVAS_LOGIN,
    DATA_CRIACAO,
    DATA_ATUALIZACAO,
    BLOQUEADO_ATE,
    NOME,
    MATRICULA,
    VINCULO_FUNCIONAL,
    CPF,
    "PIS/PASEP",
    SEXO,
    ESTADO_CIVIL,
    -- Converter datas do formato DD/MM/YYYY para DATE
    TO_DATE(DATA_NASCIMENTO, 'DD/MM/YYYY') AS DATA_NASCIMENTO,
    PAI,
    MAE,
    RG,
    TIPO_RG,
    ORGAO_EXPEDITOR,
    UF_RG,
    -- Converter data de expedição
    CASE 
        WHEN EXPEDICAO_RG IS NOT NULL AND EXPEDICAO_RG != '' 
        THEN TO_DATE(EXPEDICAO_RG, 'DD/MM/YYYY')
        ELSE NULL
    END AS EXPEDICAO_RG,
    CIDADE_NASCIMENTO,
    UF_NASCIMENTO,
    TIPO_SANGUINEO,
    RACA_COR,
    -- Converter PNE para formato esperado
    CASE 
        WHEN UPPER(PNE) IN ('NAO', 'NÃO', 'N') THEN 'N'
        WHEN UPPER(PNE) IN ('SIM', 'S') THEN 'S'
        ELSE 'N'
    END AS PNE,
    TIPO_VINCULO,
    CATEGORIA,
    REGIME_JURIDICO,
    REGIME_PREVIDENCIARIO,
    EVENTO_TIPO,
    FORMA_PROVIMENTO,
    CODIGO_CARGO,
    CARGO,
    ESCOLARIDADE_CARGO,
    ESCOLARIDADE_SERVIDOR,
    FORMACAO_PROFISSIONAL_1,
    FORMACAO_PROFISSIONAL_2,
    JORNADA,
    NIVEL_REFERENCIA,
    "COMISSAO_FUNÇAO",
    -- Converter data de início da comissão
    CASE 
        WHEN DATA_INI_COMISSAO IS NOT NULL AND DATA_INI_COMISSAO != '' 
        THEN TO_DATE(DATA_INI_COMISSAO, 'DD/MM/YYYY')
        ELSE NULL
    END AS DATA_INI_COMISSAO,
    TELEFONE,
    ENDERECO,
    NUMERO_ENDERECO,
    COMPLEMENTO_ENDERECO,
    BAIRRO_ENDERECO,
    CIDADE_ENDERECO,
    UF_ENDERECO,
    CEP_ENDERECO,
    E_MAIL
FROM USUARIOS_TEMP;

-- =====================================================
-- INSTRUÇÕES PARA IMPORTAÇÃO:
-- =====================================================
-- 1. Criar tabela temporária para receber os dados do CSV
CREATE TABLE USUARIOS_TEMP AS SELECT * FROM USUARIOS WHERE 1=0;

-- 2. Modificar a tabela temporária para aceitar todos os campos como VARCHAR2
ALTER TABLE USUARIOS_TEMP MODIFY USUARIO_ATIVO VARCHAR2(10);
ALTER TABLE USUARIOS_TEMP MODIFY ULTIMO_LOGIN VARCHAR2(50);
ALTER TABLE USUARIOS_TEMP MODIFY DATA_NASCIMENTO VARCHAR2(20);
ALTER TABLE USUARIOS_TEMP MODIFY EXPEDICAO_RG VARCHAR2(20);
ALTER TABLE USUARIOS_TEMP MODIFY DATA_INI_COMISSAO VARCHAR2(20);
ALTER TABLE USUARIOS_TEMP MODIFY PNE VARCHAR2(10);

-- 3. Importar o CSV para a tabela USUARIOS_TEMP
-- (Use a ferramenta de importação do seu cliente SQL)

-- 4. Inserir os dados transformados na tabela principal
INSERT INTO USUARIOS 
SELECT * FROM V_USUARIOS_IMPORT;

-- 5. Limpar dados temporários
DROP TABLE USUARIOS_TEMP;
DROP VIEW V_USUARIOS_IMPORT;

-- =====================================================
-- VERIFICAÇÕES PÓS-IMPORTAÇÃO:
-- =====================================================
-- Verificar se todos os registros foram importados
SELECT COUNT(*) AS TOTAL_REGISTROS FROM USUARIOS;

-- Verificar registros com problemas de data
SELECT ID, NOME, DATA_NASCIMENTO, EXPEDICAO_RG, DATA_INI_COMISSAO 
FROM USUARIOS 
WHERE DATA_NASCIMENTO IS NULL 
   OR EXPEDICAO_RG IS NULL 
   OR DATA_INI_COMISSAO IS NULL;

-- Verificar valores de USUARIO_ATIVO
SELECT USUARIO_ATIVO, COUNT(*) 
FROM USUARIOS 
GROUP BY USUARIO_ATIVO;

-- Verificar valores de PNE
SELECT PNE, COUNT(*) 
FROM USUARIOS 
GROUP BY PNE;

COMMIT;