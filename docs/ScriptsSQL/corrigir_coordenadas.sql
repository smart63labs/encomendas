-- Script para corrigir o tipo de dados das colunas LATITUDE e LONGITUDE
-- Conectar ao banco: sqlplus protocolo_user/Anderline49@localhost:1521/FREEPDB1

SET PAGESIZE 50
SET LINESIZE 120

PROMPT ====================================
PROMPT CORRIGINDO TIPO DE DADOS DAS COORDENADAS
PROMPT ====================================

-- Alterar LATITUDE para suportar coordenadas como -7.76047890
-- NUMBER(11,8) permite até 3 dígitos antes da vírgula e 8 após
ALTER TABLE SETORES MODIFY LATITUDE NUMBER(11,8);

-- Alterar LONGITUDE para suportar coordenadas como -48.57865857  
-- NUMBER(12,8) permite até 4 dígitos antes da vírgula e 8 após
ALTER TABLE SETORES MODIFY LONGITUDE NUMBER(12,8);

PROMPT ====================================
PROMPT VERIFICANDO NOVA ESTRUTURA
PROMPT ====================================

SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    DATA_PRECISION,
    DATA_SCALE,
    DATA_LENGTH,
    NULLABLE
FROM USER_TAB_COLUMNS 
WHERE TABLE_NAME = 'SETORES' 
AND COLUMN_NAME IN ('LATITUDE', 'LONGITUDE') 
ORDER BY COLUMN_ID;

PROMPT ====================================
PROMPT TESTANDO INSERÇÃO DE COORDENADAS
PROMPT ====================================

-- Teste de inserção com coordenadas reais
INSERT INTO SETORES (
    ID, CODIGO_SETOR, NOME_SETOR, ORGAO, ATIVO,
    LOGRADOURO, NUMERO, COMPLEMENTO, BAIRRO, CIDADE, ESTADO, CEP,
    TELEFONE, EMAIL, DATA_CRIACAO, DATA_ATUALIZACAO,
    LATITUDE, LONGITUDE
) VALUES (
    999, 'TEST001', 'SETOR TESTE COORDENADAS', 'SEFAZ', 'S',
    'Rua Teste', '123', 'Sala 1', 'Centro', 'Palmas', 'TO', '77001-000',
    '(63) 3218-1234', 'teste@sefaz.to.gov.br', SYSTIMESTAMP, SYSTIMESTAMP,
    -7.76047890, -48.57865857
);

-- Verificar se a inserção funcionou
SELECT ID, CODIGO_SETOR, NOME_SETOR, LATITUDE, LONGITUDE 
FROM SETORES 
WHERE ID = 999;

-- Remover o registro de teste
DELETE FROM SETORES WHERE ID = 999;

COMMIT;

PROMPT ====================================
PROMPT CORREÇÃO CONCLUÍDA COM SUCESSO!
PROMPT ====================================

EXIT;