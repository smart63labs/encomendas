-- Script: Configuração do Hub Centralizador (Opção 1)
-- Uso: Executar via SQLCL com as credenciais fornecidas
-- Exemplo:
-- sqlcl protocolo_user/Anderline49@localhost:1521/FREEPDB1 @docs/ScriptsSQL/malote_hub_config_opcao1_configuracoes.sql

-- Solicita o ID do setor que atuará como Hub (SETORES.ID)
ACCEPT HUB_ID NUMBER PROMPT 'Informe o HUB_SETOR_ID (SETORES.ID): ';
DEFINE HUB_ID = &HUB_ID;

-- Cria a chave HUB_SETOR_ID se não existir e atualiza o valor
MERGE INTO CONFIGURACOES t
USING (
  SELECT 'HUB_SETOR_ID' AS CHAVE,
         TO_CLOB('&HUB_ID') AS VALOR,
         'NUMBER' AS TIPO
  FROM DUAL
) s
ON (t.CHAVE = s.CHAVE)
WHEN MATCHED THEN
  UPDATE SET t.VALOR = s.VALOR,
             t.TIPO = s.TIPO
WHEN NOT MATCHED THEN
  INSERT (ID, CHAVE, VALOR, TIPO)
  VALUES (CONFIGURACOES_SEQ.NEXTVAL, s.CHAVE, s.VALOR, s.TIPO);

COMMIT;

-- Verificação
SELECT CHAVE,
       TO_NUMBER(DBMS_LOB.SUBSTR(VALOR, 100)) AS HUB_SETOR_ID,
       TIPO
  FROM CONFIGURACOES
 WHERE CHAVE = 'HUB_SETOR_ID';