-- =====================================================
-- SCRIPT DE MIGRAÇÃO DOS DADOS DA SEFAZ
-- Data: 11/09/2025
-- Objetivo: Migrar dados da planilha para o banco
-- =====================================================

-- Configurações iniciais
SET SERVEROUTPUT ON;
SET FEEDBACK ON;
SET TIMING ON;

-- Variáveis para controle
DECLARE
    v_count NUMBER := 0;
    v_errors NUMBER := 0;
    v_start_time TIMESTAMP := SYSTIMESTAMP;
BEGIN
    DBMS_OUTPUT.PUT_LINE('=== INÍCIO DA MIGRAÇÃO DOS DADOS DA SEFAZ ===');
    DBMS_OUTPUT.PUT_LINE('Data/Hora: ' || TO_CHAR(SYSDATE, 'DD/MM/YYYY HH24:MI:SS'));
    
    -- Aqui será necessário adaptar conforme o método de importação escolhido
    -- Opção 1: Usar SQL*Loader
    -- Opção 2: Usar procedimento PL/SQL com UTL_FILE
    -- Opção 3: Usar ferramenta externa (PowerShell + API)
    
    DBMS_OUTPUT.PUT_LINE('Preparando para importação dos dados...');
    
    -- Verificar se a estrutura está correta
    SELECT COUNT(*) INTO v_count
    FROM USER_TAB_COLUMNS 
    WHERE TABLE_NAME = 'USUARIOS';
    
    DBMS_OUTPUT.PUT_LINE('Total de colunas na tabela USUARIOS: ' || v_count);
    
    IF v_count < 60 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Estrutura da tabela incompleta. Execute primeiro os scripts 02_alter_table_usuarios.sql');
    END IF;
    
    DBMS_OUTPUT.PUT_LINE('Estrutura da tabela validada com sucesso!');
    DBMS_OUTPUT.PUT_LINE('Pronto para receber os dados via API ou importação externa.');
    
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('ERRO: ' || SQLERRM);
        RAISE;
END;
/

-- Função para validar CPF
CREATE OR REPLACE FUNCTION VALIDA_CPF(p_cpf VARCHAR2) RETURN BOOLEAN IS
    v_cpf VARCHAR2(11);
    v_soma NUMBER := 0;
    v_resto NUMBER;
    v_dv1 NUMBER;
    v_dv2 NUMBER;
BEGIN
    -- Remove caracteres não numéricos
    v_cpf := REGEXP_REPLACE(p_cpf, '[^0-9]', '');
    
    -- Verifica se tem 11 dígitos
    IF LENGTH(v_cpf) != 11 THEN
        RETURN FALSE;
    END IF;
    
    -- Verifica sequências inválidas
    IF v_cpf IN ('00000000000', '11111111111', '22222222222', '33333333333',
                 '44444444444', '55555555555', '66666666666', '77777777777',
                 '88888888888', '99999999999') THEN
        RETURN FALSE;
    END IF;
    
    -- Calcula primeiro dígito verificador
    FOR i IN 1..9 LOOP
        v_soma := v_soma + (TO_NUMBER(SUBSTR(v_cpf, i, 1)) * (11 - i));
    END LOOP;
    
    v_resto := MOD(v_soma, 11);
    IF v_resto < 2 THEN
        v_dv1 := 0;
    ELSE
        v_dv1 := 11 - v_resto;
    END IF;
    
    -- Calcula segundo dígito verificador
    v_soma := 0;
    FOR i IN 1..10 LOOP
        v_soma := v_soma + (TO_NUMBER(SUBSTR(v_cpf, i, 1)) * (12 - i));
    END LOOP;
    
    v_resto := MOD(v_soma, 11);
    IF v_resto < 2 THEN
        v_dv2 := 0;
    ELSE
        v_dv2 := 11 - v_resto;
    END IF;
    
    -- Verifica se os dígitos calculados conferem
    IF v_dv1 = TO_NUMBER(SUBSTR(v_cpf, 10, 1)) AND 
       v_dv2 = TO_NUMBER(SUBSTR(v_cpf, 11, 1)) THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
/

-- Função para formatar CPF
CREATE OR REPLACE FUNCTION FORMATA_CPF(p_cpf VARCHAR2) RETURN VARCHAR2 IS
    v_cpf VARCHAR2(11);
BEGIN
    v_cpf := REGEXP_REPLACE(p_cpf, '[^0-9]', '');
    IF LENGTH(v_cpf) = 11 THEN
        RETURN SUBSTR(v_cpf, 1, 3) || '.' || 
               SUBSTR(v_cpf, 4, 3) || '.' || 
               SUBSTR(v_cpf, 7, 3) || '-' || 
               SUBSTR(v_cpf, 10, 2);
    ELSE
        RETURN p_cpf;
    END IF;
END;
/

-- Procedimento para inserir/atualizar usuário
CREATE OR REPLACE PROCEDURE INSERIR_USUARIO_SEFAZ(
    p_ordem NUMBER,
    p_nome VARCHAR2,
    p_numero_funcional NUMBER,
    p_numero_vinculo NUMBER,
    p_cpf VARCHAR2,
    p_pis_pasep VARCHAR2,
    p_sexo VARCHAR2,
    p_estado_civil VARCHAR2,
    p_data_nascimento DATE,
    p_nome_pai VARCHAR2,
    p_nome_mae VARCHAR2,
    p_rg VARCHAR2,
    p_tipo_rg VARCHAR2,
    p_orgao_expeditor VARCHAR2,
    p_uf_rg VARCHAR2,
    p_data_expedicao_rg DATE,
    p_banco VARCHAR2,
    p_agencia VARCHAR2,
    p_conta VARCHAR2,
    p_cidade_nascimento VARCHAR2,
    p_uf_nascimento VARCHAR2,
    p_tipo_sanguineo VARCHAR2,
    p_raca_cor VARCHAR2,
    p_pne VARCHAR2,
    p_tipo_deficiencia VARCHAR2,
    p_data_ingresso DATE,
    p_cargo VARCHAR2,
    p_escolaridade_cargo VARCHAR2,
    p_escolaridade_servidor VARCHAR2,
    p_formacao_1 VARCHAR2,
    p_formacao_2 VARCHAR2,
    p_jornada NUMBER,
    p_nivel_referencia VARCHAR2,
    p_valor_nivel NUMBER,
    p_comissao_funcao VARCHAR2,
    p_simbolo VARCHAR2,
    p_valor_simbolo NUMBER,
    p_orgao VARCHAR2,
    p_setor VARCHAR2,
    p_lotacao VARCHAR2,
    p_data_inicio_atividade DATE,
    p_municipio_lotacao VARCHAR2,
    p_situacao VARCHAR2,
    p_data_desativacao DATE,
    p_hierarquia_setor VARCHAR2,
    p_telefone VARCHAR2,
    p_endereco VARCHAR2,
    p_numero_endereco VARCHAR2,
    p_complemento VARCHAR2,
    p_bairro VARCHAR2,
    p_cidade_endereco VARCHAR2,
    p_uf_endereco VARCHAR2,
    p_cep VARCHAR2,
    p_email VARCHAR2
) IS
    v_user_id NUMBER;
    v_cpf_formatado VARCHAR2(14);
    v_email_gerado VARCHAR2(100);
BEGIN
    -- Validar e formatar CPF
    IF p_cpf IS NOT NULL THEN
        IF NOT VALIDA_CPF(p_cpf) THEN
            RAISE_APPLICATION_ERROR(-20002, 'CPF inválido: ' || p_cpf);
        END IF;
        v_cpf_formatado := FORMATA_CPF(p_cpf);
    END IF;
    
    -- Gerar email se não fornecido
    v_email_gerado := COALESCE(p_email, 
                              LOWER(REPLACE(p_nome, ' ', '.')) || '@sefaz.go.gov.br');
    
    -- Verificar se usuário já existe (por CPF ou número funcional)
    SELECT COUNT(*) INTO v_user_id
    FROM USUARIOS 
    WHERE (CPF = v_cpf_formatado AND CPF IS NOT NULL)
       OR (NUMERO_FUNCIONAL = p_numero_funcional AND NUMERO_FUNCIONAL IS NOT NULL);
    
    IF v_user_id > 0 THEN
        -- Atualizar usuário existente
        UPDATE USUARIOS SET
            NOME = p_nome,
            EMAIL = v_email_gerado,
            NUMERO_FUNCIONAL = p_numero_funcional,
            NUMERO_VINCULO = p_numero_vinculo,
            CPF = v_cpf_formatado,
            PIS_PASEP = p_pis_pasep,
            SEXO = p_sexo,
            ESTADO_CIVIL = p_estado_civil,
            DATA_NASCIMENTO = p_data_nascimento,
            NOME_PAI = p_nome_pai,
            NOME_MAE = p_nome_mae,
            RG = p_rg,
            TIPO_RG = p_tipo_rg,
            ORGAO_EXPEDITOR = p_orgao_expeditor,
            UF_RG = p_uf_rg,
            DATA_EXPEDICAO_RG = p_data_expedicao_rg,
            BANCO = p_banco,
            AGENCIA = p_agencia,
            CONTA = p_conta,
            CIDADE_NASCIMENTO = p_cidade_nascimento,
            UF_NASCIMENTO = p_uf_nascimento,
            TIPO_SANGUINEO = p_tipo_sanguineo,
            RACA_COR = p_raca_cor,
            PNE = p_pne,
            TIPO_DEFICIENCIA = p_tipo_deficiencia,
            DATA_INGRESSO_SERVICO_PUBLICO = p_data_ingresso,
            CARGO = p_cargo,
            ESCOLARIDADE_CARGO = p_escolaridade_cargo,
            ESCOLARIDADE_SERVIDOR = p_escolaridade_servidor,
            FORMACAO_PROFISSIONAL_1 = p_formacao_1,
            FORMACAO_PROFISSIONAL_2 = p_formacao_2,
            JORNADA = p_jornada,
            NIVEL_REFERENCIA = p_nivel_referencia,
            VALOR_NIVEL_REFERENCIA = p_valor_nivel,
            COMISSAO_FUNCAO = p_comissao_funcao,
            SIMBOLO = p_simbolo,
            VALOR_SIMBOLO = p_valor_simbolo,
            ORGAO = p_orgao,
            DEPARTAMENTO = p_setor,
            LOTACAO = p_lotacao,
            DATA_INICIO_ATIVIDADE = p_data_inicio_atividade,
            MUNICIPIO_LOTACAO = p_municipio_lotacao,
            SITUACAO = p_situacao,
            DATA_DESATIVACAO = p_data_desativacao,
            HIERARQUIA_SETOR = p_hierarquia_setor,
            TELEFONE = p_telefone,
            ENDERECO = p_endereco,
            NUMERO_ENDERECO = p_numero_endereco,
            COMPLEMENTO_ENDERECO = p_complemento,
            BAIRRO_ENDERECO = p_bairro,
            CIDADE_ENDERECO = p_cidade_endereco,
            UF_ENDERECO = p_uf_endereco,
            CEP_ENDERECO = p_cep,
            UPDATED_AT = SYSTIMESTAMP,
            ATIVO = CASE WHEN p_situacao = 'ATIVO' THEN 1 ELSE 0 END,
            PERFIL = 'SERVIDOR'
        WHERE (CPF = v_cpf_formatado AND CPF IS NOT NULL)
           OR (NUMERO_FUNCIONAL = p_numero_funcional AND NUMERO_FUNCIONAL IS NOT NULL);
    ELSE
        -- Inserir novo usuário
        INSERT INTO USUARIOS (
            ID, NOME, EMAIL, SENHA, PERFIL, ATIVO, CREATED_AT, UPDATED_AT,
            NUMERO_FUNCIONAL, NUMERO_VINCULO, CPF, PIS_PASEP, SEXO, ESTADO_CIVIL,
            DATA_NASCIMENTO, NOME_PAI, NOME_MAE, RG, TIPO_RG, ORGAO_EXPEDITOR,
            UF_RG, DATA_EXPEDICAO_RG, BANCO, AGENCIA, CONTA, CIDADE_NASCIMENTO,
            UF_NASCIMENTO, TIPO_SANGUINEO, RACA_COR, PNE, TIPO_DEFICIENCIA,
            DATA_INGRESSO_SERVICO_PUBLICO, CARGO, ESCOLARIDADE_CARGO,
            ESCOLARIDADE_SERVIDOR, FORMACAO_PROFISSIONAL_1, FORMACAO_PROFISSIONAL_2,
            JORNADA, NIVEL_REFERENCIA, VALOR_NIVEL_REFERENCIA, COMISSAO_FUNCAO,
            SIMBOLO, VALOR_SIMBOLO, ORGAO, DEPARTAMENTO, LOTACAO,
            DATA_INICIO_ATIVIDADE, MUNICIPIO_LOTACAO, SITUACAO, DATA_DESATIVACAO,
            HIERARQUIA_SETOR, TELEFONE, ENDERECO, NUMERO_ENDERECO,
            COMPLEMENTO_ENDERECO, BAIRRO_ENDERECO, CIDADE_ENDERECO,
            UF_ENDERECO, CEP_ENDERECO
        ) VALUES (
            SEQ_USUARIOS.NEXTVAL, p_nome, v_email_gerado, 'senha123', 'SERVIDOR',
            CASE WHEN p_situacao = 'ATIVO' THEN 1 ELSE 0 END,
            SYSTIMESTAMP, SYSTIMESTAMP,
            p_numero_funcional, p_numero_vinculo, v_cpf_formatado, p_pis_pasep,
            p_sexo, p_estado_civil, p_data_nascimento, p_nome_pai, p_nome_mae,
            p_rg, p_tipo_rg, p_orgao_expeditor, p_uf_rg, p_data_expedicao_rg,
            p_banco, p_agencia, p_conta, p_cidade_nascimento, p_uf_nascimento,
            p_tipo_sanguineo, p_raca_cor, p_pne, p_tipo_deficiencia,
            p_data_ingresso, p_cargo, p_escolaridade_cargo, p_escolaridade_servidor,
            p_formacao_1, p_formacao_2, p_jornada, p_nivel_referencia,
            p_valor_nivel, p_comissao_funcao, p_simbolo, p_valor_simbolo,
            p_orgao, p_setor, p_lotacao, p_data_inicio_atividade,
            p_municipio_lotacao, p_situacao, p_data_desativacao,
            p_hierarquia_setor, p_telefone, p_endereco, p_numero_endereco,
            p_complemento, p_bairro, p_cidade_endereco, p_uf_endereco, p_cep
        );
    END IF;
    
    COMMIT;
    
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('ERRO ao processar usuário ' || p_nome || ': ' || SQLERRM);
        RAISE;
END;
/

PROMPT 'Funções e procedimentos de migração criados com sucesso!';
PROMPT 'Execute agora o processo de importação dos dados via PowerShell + API.';
PROMPT 'Ou use o SQL*Loader com o arquivo de controle apropriado.';