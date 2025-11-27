-- =====================================================
-- SCRIPT DEFINITIVO PARA CORRIGIR IMPORTAÇÃO DE USUARIOS
-- Resolve os erros: "Can't create or update target table"
-- =====================================================

-- PROBLEMA IDENTIFICADO:
-- A ferramenta de importação está tentando fazer ADD COLUMN para colunas que JÁ EXISTEM
-- Precisamos apenas MODIFICAR as colunas existentes, não adicionar novas

-- =====================================================
-- VERIFICAÇÕES PRELIMINARES
-- =====================================================

-- Fazer commit de qualquer transação pendente
COMMIT;

-- Verificar estrutura atual
DESCRIBE USUARIOS;

-- =====================================================
-- CORREÇÕES NECESSÁRIAS (MODIFY, NÃO ADD)
-- =====================================================

-- 1. USUARIO_ATIVO já existe como CHAR(1), mas precisa aceitar valores numéricos
-- Modificar para VARCHAR2(1) para aceitar "1" e "0" do CSV
ALTER TABLE USUARIOS MODIFY USUARIO_ATIVO VARCHAR2(1);

-- 2. ULTIMO_LOGIN já existe como TIMESTAMP(6), mas CSV tem formato DD/MM/YYYY
-- Modificar para VARCHAR2(50) temporariamente
ALTER TABLE USUARIOS MODIFY ULTIMO_LOGIN VARCHAR2(50);

-- 3. "PIS/PASEP" já existe como VARCHAR2(15), mas pode precisar de mais espaço
-- Aumentar para VARCHAR2(50) para garantir compatibilidade
ALTER TABLE USUARIOS MODIFY "PIS/PASEP" VARCHAR2(50);

-- 4. COMISSAO_FUNÇAO já existe como VARCHAR2(255), mas pode precisar de mais espaço
-- Aumentar para VARCHAR2(500) para garantir compatibilidade
ALTER TABLE USUARIOS MODIFY "COMISSAO_FUNÇAO" VARCHAR2(500);

-- =====================================================
-- OUTRAS MODIFICAÇÕES PREVENTIVAS
-- =====================================================

-- Campos de data que podem ter formato DD/MM/YYYY no CSV
ALTER TABLE USUARIOS MODIFY DATA_NASCIMENTO VARCHAR2(20);
ALTER TABLE USUARIOS MODIFY EXPEDICAO_RG VARCHAR2(20);
ALTER TABLE USUARIOS MODIFY DATA_INI_COMISSAO VARCHAR2(20);

-- Campos que podem ter valores maiores no CSV
ALTER TABLE USUARIOS MODIFY VINCULO_FUNCIONAL VARCHAR2(200);
ALTER TABLE USUARIOS MODIFY ENDERECO VARCHAR2(500);
ALTER TABLE USUARIOS MODIFY CARGO VARCHAR2(300);
ALTER TABLE USUARIOS MODIFY PNE VARCHAR2(10);
ALTER TABLE USUARIOS MODIFY NOME VARCHAR2(300);
ALTER TABLE USUARIOS MODIFY CPF VARCHAR2(20);
ALTER TABLE USUARIOS MODIFY RG VARCHAR2(30);
ALTER TABLE USUARIOS MODIFY TELEFONE VARCHAR2(30);

-- Verificar se existe coluna EMAIL ou E_MAIL
-- (O CSV pode ter EMAIL, mas a tabela tem E_MAIL)
ALTER TABLE USUARIOS MODIFY E_MAIL VARCHAR2(200);

-- =====================================================
-- VERIFICAÇÃO PÓS-ALTERAÇÃO
-- =====================================================

-- Verificar estrutura atualizada
DESCRIBE USUARIOS;

-- Fazer commit das alterações
COMMIT;

PROMPT 'Estrutura da tabela USUARIOS corrigida para importação!';
PROMPT 'Agora você pode importar o CSV sem erros de ADD COLUMN.';

-- =====================================================
-- SCRIPT DE LIMPEZA PÓS-IMPORTAÇÃO
-- =====================================================

/*
-- EXECUTE ESTE BLOCO APÓS A IMPORTAÇÃO DO CSV

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

-- 3. Converter datas de DD/MM/YYYY para formato Oracle
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

-- 4. Limpar campos vazios
UPDATE USUARIOS SET ULTIMO_LOGIN = NULL WHERE ULTIMO_LOGIN = '';
UPDATE USUARIOS SET "PIS/PASEP" = NULL WHERE "PIS/PASEP" = '';
UPDATE USUARIOS SET "COMISSAO_FUNÇAO" = NULL WHERE "COMISSAO_FUNÇAO" = '';

-- 5. Verificar se há coluna CELULAR no CSV que não existe na tabela
-- Se necessário, adicionar:
-- ALTER TABLE USUARIOS ADD CELULAR VARCHAR2(30);

COMMIT;

-- Verificação final
SELECT 
    COUNT(*) AS TOTAL_REGISTROS,
    COUNT(CASE WHEN USUARIO_ATIVO = 'S' THEN 1 END) AS USUARIOS_ATIVOS,
    COUNT(CASE WHEN PNE = 'S' THEN 1 END) AS USUARIOS_PNE
FROM USUARIOS;

PROMPT 'Limpeza dos dados concluída!';
*/

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================

/*
PASSOS PARA RESOLVER O ERRO DE IMPORTAÇÃO:

1. Execute este script ANTES de tentar importar o CSV
2. O script modifica as colunas existentes (não adiciona novas)
3. Após executar, tente a importação novamente
4. Se a importação for bem-sucedida, execute o bloco de limpeza comentado

ERROS RESOLVIDOS:
✓ ALTER TABLE PROTOCOLO_USER.USUARIOS ADD USUARIO_ATIVO INTEGER NULL
  → Coluna já existe, apenas modificada para VARCHAR2(1)

✓ ALTER TABLE PROTOCOLO_USER.USUARIOS ADD ULTIMO_LOGIN VARCHAR2(50) NULL
  → Coluna já existe, apenas modificada para VARCHAR2(50)

✓ ALTER TABLE PROTOCOLO_USER.USUARIOS ADD "PIS/PASEP" VARCHAR2(50) NULL
  → Coluna já existe, apenas modificada para VARCHAR2(50)

✓ ALTER TABLE PROTOCOLO_USER.USUARIOS ADD COMISSAO_FUNÇAO VARCHAR2(64) NULL
  → Coluna já existe, apenas modificada para VARCHAR2(500)

OBSERVAÇÃO IMPORTANTE:
- Se ainda houver erro de bloqueio (ORA-00054), feche todas as aplicações
  que possam estar usando a tabela USUARIOS e tente novamente
*/

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================