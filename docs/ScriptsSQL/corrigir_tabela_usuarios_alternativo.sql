-- =====================================================
-- SCRIPT ALTERNATIVO PARA IMPORTAÇÃO DOS DADOS DO CSV
-- SEM MODIFICAR A ESTRUTURA DA TABELA USUARIOS
-- =====================================================

-- Este script resolve o problema de bloqueio da tabela criando
-- uma estratégia de importação que não requer alteração da estrutura

-- ESTRATÉGIA: 
-- 1. Criar tabela temporária para receber dados do CSV
-- 2. Transformar dados na inserção para a tabela principal
-- 3. Limpar tabela temporária

-- =====================================================
-- PASSO 1: CRIAR TABELA TEMPORÁRIA PARA RECEBER CSV
-- =====================================================

-- Remover tabela temporária se existir
DROP TABLE USUARIOS_CSV_TEMP;

-- Criar tabela temporária com todos os campos como VARCHAR2
CREATE TABLE USUARIOS_CSV_TEMP (
    ID VARCHAR2(50),
    SETOR_ID VARCHAR2(50),
    ROLE VARCHAR2(100),
    SENHA VARCHAR2(255),
    USUARIO_ATIVO VARCHAR2(10),
    ULTIMO_LOGIN VARCHAR2(50),
    PIS_PASEP VARCHAR2(50),
    COMISSAO_FUNCAO VARCHAR2(500),
    NOME VARCHAR2(200),
    EMAIL VARCHAR2(150),
    CPF VARCHAR2(20),
    RG VARCHAR2(30),
    DATA_NASCIMENTO VARCHAR2(20),
    EXPEDICAO_RG VARCHAR2(20),
    TELEFONE VARCHAR2(30),
    CELULAR VARCHAR2(30),
    ENDERECO VARCHAR2(500),
    CARGO VARCHAR2(200),
    ORGAO VARCHAR2(200),
    VINCULO_FUNCIONAL VARCHAR2(100),
    DATA_INI_COMISSAO VARCHAR2(20),
    PNE VARCHAR2(10)
);

-- =====================================================
-- PASSO 2: APÓS IMPORTAR O CSV PARA USUARIOS_CSV_TEMP
-- EXECUTE ESTE COMANDO PARA INSERIR NA TABELA PRINCIPAL
-- =====================================================

/*
-- COMANDO DE INSERÇÃO COM TRANSFORMAÇÃO DOS DADOS
INSERT INTO USUARIOS (
    ID, SETOR_ID, ROLE, SENHA, USUARIO_ATIVO, ULTIMO_LOGIN, 
    "PIS/PASEP", "COMISSAO_FUNÇAO", NOME, EMAIL, CPF, RG, 
    DATA_NASCIMENTO, EXPEDICAO_RG, TELEFONE, CELULAR, 
    ENDERECO, CARGO, ORGAO, VINCULO_FUNCIONAL, 
    DATA_INI_COMISSAO, PNE
)
SELECT 
    -- ID (converter para NUMBER se necessário)
    CASE 
        WHEN ID IS NOT NULL AND REGEXP_LIKE(ID, '^[0-9]+$') 
        THEN TO_NUMBER(ID)
        ELSE NULL 
    END AS ID,
    
    -- SETOR_ID (converter para NUMBER se necessário)
    CASE 
        WHEN SETOR_ID IS NOT NULL AND REGEXP_LIKE(SETOR_ID, '^[0-9]+$') 
        THEN TO_NUMBER(SETOR_ID)
        ELSE NULL 
    END AS SETOR_ID,
    
    -- ROLE
    ROLE,
    
    -- SENHA
    SENHA,
    
    -- USUARIO_ATIVO (converter 1/0 para S/N)
    CASE 
        WHEN USUARIO_ATIVO = '1' THEN 'S'
        WHEN USUARIO_ATIVO = '0' THEN 'N'
        ELSE 'N'
    END AS USUARIO_ATIVO,
    
    -- ULTIMO_LOGIN (converter para TIMESTAMP ou deixar NULL)
    CASE 
        WHEN ULTIMO_LOGIN IS NOT NULL AND ULTIMO_LOGIN != '' 
        THEN TO_TIMESTAMP(ULTIMO_LOGIN, 'DD/MM/YYYY HH24:MI:SS')
        ELSE NULL 
    END AS ULTIMO_LOGIN,
    
    -- PIS/PASEP
    CASE 
        WHEN PIS_PASEP IS NOT NULL AND PIS_PASEP != '' 
        THEN PIS_PASEP
        ELSE NULL 
    END AS "PIS/PASEP",
    
    -- COMISSAO_FUNÇAO
    CASE 
        WHEN COMISSAO_FUNCAO IS NOT NULL AND COMISSAO_FUNCAO != '' 
        THEN COMISSAO_FUNCAO
        ELSE NULL 
    END AS "COMISSAO_FUNÇAO",
    
    -- NOME
    NOME,
    
    -- EMAIL
    EMAIL,
    
    -- CPF
    CPF,
    
    -- RG
    RG,
    
    -- DATA_NASCIMENTO (converter DD/MM/YYYY para DATE)
    CASE 
        WHEN DATA_NASCIMENTO IS NOT NULL AND DATA_NASCIMENTO != '' 
        AND REGEXP_LIKE(DATA_NASCIMENTO, '^[0-9]{2}/[0-9]{2}/[0-9]{4}$')
        THEN TO_DATE(DATA_NASCIMENTO, 'DD/MM/YYYY')
        ELSE NULL 
    END AS DATA_NASCIMENTO,
    
    -- EXPEDICAO_RG (converter DD/MM/YYYY para DATE)
    CASE 
        WHEN EXPEDICAO_RG IS NOT NULL AND EXPEDICAO_RG != '' 
        AND REGEXP_LIKE(EXPEDICAO_RG, '^[0-9]{2}/[0-9]{2}/[0-9]{4}$')
        THEN TO_DATE(EXPEDICAO_RG, 'DD/MM/YYYY')
        ELSE NULL 
    END AS EXPEDICAO_RG,
    
    -- TELEFONE
    TELEFONE,
    
    -- CELULAR
    CELULAR,
    
    -- ENDERECO
    ENDERECO,
    
    -- CARGO
    CARGO,
    
    -- ORGAO
    ORGAO,
    
    -- VINCULO_FUNCIONAL
    VINCULO_FUNCIONAL,
    
    -- DATA_INI_COMISSAO (converter DD/MM/YYYY para DATE)
    CASE 
        WHEN DATA_INI_COMISSAO IS NOT NULL AND DATA_INI_COMISSAO != '' 
        AND REGEXP_LIKE(DATA_INI_COMISSAO, '^[0-9]{2}/[0-9]{2}/[0-9]{4}$')
        THEN TO_DATE(DATA_INI_COMISSAO, 'DD/MM/YYYY')
        ELSE NULL 
    END AS DATA_INI_COMISSAO,
    
    -- PNE (converter SIM/NAO para S/N)
    CASE 
        WHEN UPPER(PNE) IN ('SIM', 'S') THEN 'S'
        WHEN UPPER(PNE) IN ('NAO', 'NÃO', 'N') THEN 'N'
        ELSE 'N'
    END AS PNE
    
FROM USUARIOS_CSV_TEMP
WHERE ID IS NOT NULL;

COMMIT;
*/

-- =====================================================
-- PASSO 3: VERIFICAÇÕES PÓS-IMPORTAÇÃO
-- =====================================================

/*
-- Contar registros importados
SELECT COUNT(*) AS REGISTROS_IMPORTADOS FROM USUARIOS;

-- Verificar dados transformados
SELECT 
    COUNT(*) AS TOTAL,
    COUNT(CASE WHEN USUARIO_ATIVO = 'S' THEN 1 END) AS ATIVOS,
    COUNT(CASE WHEN PNE = 'S' THEN 1 END) AS PNE_SIM,
    COUNT(CASE WHEN DATA_NASCIMENTO IS NOT NULL THEN 1 END) AS COM_DATA_NASC
FROM USUARIOS;

-- Verificar se há problemas de conversão
SELECT 
    'USUARIO_ATIVO' AS CAMPO,
    USUARIO_ATIVO AS VALOR,
    COUNT(*) AS QUANTIDADE
FROM USUARIOS_CSV_TEMP 
WHERE USUARIO_ATIVO NOT IN ('0', '1', '', NULL)
GROUP BY USUARIO_ATIVO
UNION ALL
SELECT 
    'PNE' AS CAMPO,
    PNE AS VALOR,
    COUNT(*) AS QUANTIDADE
FROM USUARIOS_CSV_TEMP 
WHERE UPPER(PNE) NOT IN ('SIM', 'NAO', 'NÃO', 'S', 'N', '', NULL)
GROUP BY PNE;
*/

-- =====================================================
-- PASSO 4: LIMPEZA (EXECUTAR APÓS CONFIRMAÇÃO)
-- =====================================================

/*
-- Remover tabela temporária após confirmação da importação
DROP TABLE USUARIOS_CSV_TEMP;
*/

-- =====================================================
-- INSTRUÇÕES DE USO:
-- =====================================================

/*
1. Execute a primeira parte do script para criar USUARIOS_CSV_TEMP
2. Importe o arquivo USUARIOS_NORMALIZADO1.csv para a tabela USUARIOS_CSV_TEMP
3. Execute o comando INSERT comentado para transferir os dados transformados
4. Execute as verificações para confirmar a importação
5. Execute a limpeza para remover a tabela temporária
*/

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================