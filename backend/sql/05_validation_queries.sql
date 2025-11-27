-- =====================================================
-- SCRIPT DE VALIDAÇÃO DA MIGRAÇÃO
-- Data: 11/09/2025
-- Objetivo: Validar integridade dos dados migrados
-- =====================================================

SET SERVEROUTPUT ON;
SET PAGESIZE 50;
SET LINESIZE 120;

PROMPT '=== RELATÓRIO DE VALIDAÇÃO DA MIGRAÇÃO ===';
PROMPT 'Data/Hora: ' || TO_CHAR(SYSDATE, 'DD/MM/YYYY HH24:MI:SS');
PROMPT '';

-- 1. Contagem geral de registros
PROMPT '1. CONTAGEM GERAL DE REGISTROS';
PROMPT '=================================';

SELECT 'Total de usuários' AS DESCRICAO, COUNT(*) AS QUANTIDADE FROM USUARIOS
UNION ALL
SELECT 'Usuários ativos', COUNT(*) FROM USUARIOS WHERE ATIVO = 1
UNION ALL
SELECT 'Usuários inativos', COUNT(*) FROM USUARIOS WHERE ATIVO = 0 OR ATIVO IS NULL
UNION ALL
SELECT 'Com CPF preenchido', COUNT(*) FROM USUARIOS WHERE CPF IS NOT NULL
UNION ALL
SELECT 'Com número funcional', COUNT(*) FROM USUARIOS WHERE NUMERO_FUNCIONAL IS NOT NULL
UNION ALL
SELECT 'Com email preenchido', COUNT(*) FROM USUARIOS WHERE EMAIL IS NOT NULL;

PROMPT '';

-- 2. Validação de campos obrigatórios
PROMPT '2. VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS';
PROMPT '====================================';

SELECT 'Registros sem NOME' AS PROBLEMA, COUNT(*) AS QUANTIDADE
FROM USUARIOS WHERE NOME IS NULL OR TRIM(NOME) = ''
UNION ALL
SELECT 'Registros sem EMAIL', COUNT(*)
FROM USUARIOS WHERE EMAIL IS NULL OR TRIM(EMAIL) = ''
UNION ALL
SELECT 'Registros sem SENHA', COUNT(*)
FROM USUARIOS WHERE SENHA IS NULL OR TRIM(SENHA) = '';

PROMPT '';

-- 3. Validação de CPFs
PROMPT '3. VALIDAÇÃO DE CPFs';
PROMPT '===================';

SELECT 
    'CPFs únicos' AS DESCRICAO,
    COUNT(DISTINCT CPF) AS QUANTIDADE
FROM USUARIOS WHERE CPF IS NOT NULL
UNION ALL
SELECT 
    'CPFs duplicados',
    COUNT(*) - COUNT(DISTINCT CPF)
FROM USUARIOS WHERE CPF IS NOT NULL
UNION ALL
SELECT 
    'CPFs com formato inválido',
    COUNT(*)
FROM USUARIOS 
WHERE CPF IS NOT NULL 
  AND NOT REGEXP_LIKE(CPF, '^[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}$');

-- Listar CPFs duplicados se houver
PROMPT '';
PROMPT 'CPFs DUPLICADOS (se houver):';
SELECT CPF, COUNT(*) AS OCORRENCIAS
FROM USUARIOS 
WHERE CPF IS NOT NULL
GROUP BY CPF
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

PROMPT '';

-- 4. Validação de emails
PROMPT '4. VALIDAÇÃO DE EMAILS';
PROMPT '=====================';

SELECT 
    'Emails únicos' AS DESCRICAO,
    COUNT(DISTINCT EMAIL) AS QUANTIDADE
FROM USUARIOS WHERE EMAIL IS NOT NULL
UNION ALL
SELECT 
    'Emails duplicados',
    COUNT(*) - COUNT(DISTINCT EMAIL)
FROM USUARIOS WHERE EMAIL IS NOT NULL
UNION ALL
SELECT 
    'Emails com formato inválido',
    COUNT(*)
FROM USUARIOS 
WHERE EMAIL IS NOT NULL 
  AND NOT REGEXP_LIKE(EMAIL, '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

PROMPT '';

-- 5. Distribuição por situação funcional
PROMPT '5. DISTRIBUIÇÃO POR SITUAÇÃO FUNCIONAL';
PROMPT '======================================';

SELECT 
    COALESCE(SITUACAO, 'NÃO INFORMADO') AS SITUACAO,
    COUNT(*) AS QUANTIDADE,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM USUARIOS), 2) AS PERCENTUAL
FROM USUARIOS
GROUP BY SITUACAO
ORDER BY COUNT(*) DESC;

PROMPT '';

-- 6. Distribuição por órgão
PROMPT '6. DISTRIBUIÇÃO POR ÓRGÃO (TOP 10)';
PROMPT '==================================';

SELECT 
    COALESCE(ORGAO, 'NÃO INFORMADO') AS ORGAO,
    COUNT(*) AS QUANTIDADE
FROM USUARIOS
GROUP BY ORGAO
ORDER BY COUNT(*) DESC
FETCH FIRST 10 ROWS ONLY;

PROMPT '';

-- 7. Distribuição por cargo
PROMPT '7. DISTRIBUIÇÃO POR CARGO (TOP 15)';
PROMPT '=================================';

SELECT 
    COALESCE(CARGO, 'NÃO INFORMADO') AS CARGO,
    COUNT(*) AS QUANTIDADE
FROM USUARIOS
GROUP BY CARGO
ORDER BY COUNT(*) DESC
FETCH FIRST 15 ROWS ONLY;

PROMPT '';

-- 8. Validação de datas
PROMPT '8. VALIDAÇÃO DE DATAS';
PROMPT '====================';

SELECT 
    'Data nascimento futura' AS PROBLEMA,
    COUNT(*) AS QUANTIDADE
FROM USUARIOS 
WHERE DATA_NASCIMENTO > SYSDATE
UNION ALL
SELECT 
    'Data nascimento muito antiga (< 1900)',
    COUNT(*)
FROM USUARIOS 
WHERE DATA_NASCIMENTO < DATE '1900-01-01'
UNION ALL
SELECT 
    'Data ingresso futura',
    COUNT(*)
FROM USUARIOS 
WHERE DATA_INGRESSO_SERVICO_PUBLICO > SYSDATE
UNION ALL
SELECT 
    'Data desativação antes do ingresso',
    COUNT(*)
FROM USUARIOS 
WHERE DATA_DESATIVACAO < DATA_INGRESSO_SERVICO_PUBLICO
  AND DATA_DESATIVACAO IS NOT NULL
  AND DATA_INGRESSO_SERVICO_PUBLICO IS NOT NULL;

PROMPT '';

-- 9. Estatísticas de preenchimento dos campos novos
PROMPT '9. ESTATÍSTICAS DE PREENCHIMENTO DOS NOVOS CAMPOS';
PROMPT '==================================================';

SELECT 
    'CPF' AS CAMPO,
    COUNT(CPF) AS PREENCHIDOS,
    COUNT(*) - COUNT(CPF) AS VAZIOS,
    ROUND(COUNT(CPF) * 100.0 / COUNT(*), 2) AS PERC_PREENCHIDO
FROM USUARIOS
UNION ALL
SELECT 'NUMERO_FUNCIONAL', COUNT(NUMERO_FUNCIONAL), COUNT(*) - COUNT(NUMERO_FUNCIONAL), 
       ROUND(COUNT(NUMERO_FUNCIONAL) * 100.0 / COUNT(*), 2) FROM USUARIOS
UNION ALL
SELECT 'DATA_NASCIMENTO', COUNT(DATA_NASCIMENTO), COUNT(*) - COUNT(DATA_NASCIMENTO), 
       ROUND(COUNT(DATA_NASCIMENTO) * 100.0 / COUNT(*), 2) FROM USUARIOS
UNION ALL
SELECT 'CARGO', COUNT(CARGO), COUNT(*) - COUNT(CARGO), 
       ROUND(COUNT(CARGO) * 100.0 / COUNT(*), 2) FROM USUARIOS
UNION ALL
SELECT 'TELEFONE', COUNT(TELEFONE), COUNT(*) - COUNT(TELEFONE), 
       ROUND(COUNT(TELEFONE) * 100.0 / COUNT(*), 2) FROM USUARIOS
UNION ALL
SELECT 'ENDERECO', COUNT(ENDERECO), COUNT(*) - COUNT(ENDERECO), 
       ROUND(COUNT(ENDERECO) * 100.0 / COUNT(*), 2) FROM USUARIOS;

PROMPT '';

-- 10. Verificação de integridade referencial
PROMPT '10. VERIFICAÇÃO DE INTEGRIDADE';
PROMPT '===============================';

-- Verificar se há números funcionais duplicados
SELECT 
    'Números funcionais duplicados' AS PROBLEMA,
    COUNT(*) AS QUANTIDADE
FROM (
    SELECT NUMERO_FUNCIONAL
    FROM USUARIOS 
    WHERE NUMERO_FUNCIONAL IS NOT NULL
    GROUP BY NUMERO_FUNCIONAL
    HAVING COUNT(*) > 1
);

PROMPT '';

-- 11. Resumo final
PROMPT '11. RESUMO FINAL DA MIGRAÇÃO';
PROMPT '=============================';

DECLARE
    v_total_usuarios NUMBER;
    v_usuarios_completos NUMBER;
    v_usuarios_problemas NUMBER;
    v_percentual_sucesso NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_total_usuarios FROM USUARIOS;
    
    SELECT COUNT(*) INTO v_usuarios_completos
    FROM USUARIOS 
    WHERE NOME IS NOT NULL 
      AND EMAIL IS NOT NULL 
      AND CPF IS NOT NULL
      AND NUMERO_FUNCIONAL IS NOT NULL;
    
    v_usuarios_problemas := v_total_usuarios - v_usuarios_completos;
    v_percentual_sucesso := ROUND(v_usuarios_completos * 100.0 / v_total_usuarios, 2);
    
    DBMS_OUTPUT.PUT_LINE('Total de usuários migrados: ' || v_total_usuarios);
    DBMS_OUTPUT.PUT_LINE('Usuários com dados completos: ' || v_usuarios_completos);
    DBMS_OUTPUT.PUT_LINE('Usuários com dados incompletos: ' || v_usuarios_problemas);
    DBMS_OUTPUT.PUT_LINE('Percentual de sucesso: ' || v_percentual_sucesso || '%');
    DBMS_OUTPUT.PUT_LINE('');
    
    IF v_percentual_sucesso >= 95 THEN
        DBMS_OUTPUT.PUT_LINE('✓ MIGRAÇÃO REALIZADA COM SUCESSO!');
    ELSIF v_percentual_sucesso >= 80 THEN
        DBMS_OUTPUT.PUT_LINE('⚠ MIGRAÇÃO PARCIALMENTE BEM-SUCEDIDA - Revisar dados incompletos');
    ELSE
        DBMS_OUTPUT.PUT_LINE('✗ MIGRAÇÃO COM PROBLEMAS - Necessária revisão completa');
    END IF;
END;
/

PROMPT '';
PROMPT '=== FIM DO RELATÓRIO DE VALIDAÇÃO ===';

-- Salvar log de validação
SPOOL OFF;