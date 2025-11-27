-- Correção ORA-12899 em ENCOMENDAS_EVENTOS.STATUS_ENTREGUE
-- Ajusta a coluna para semântica de caracteres, permitindo valores com acento (ex.: "NÃO")

-- Contexto de sessão (opcional, caso não esteja no schema correto)
ALTER SESSION SET CURRENT_SCHEMA = PROTOCOLO_USER;

-- Diagnóstico: verificar definição atual da coluna
-- Obs.: Executar estes SELECTs no cliente SQL para confirmação
SELECT column_name, data_type, char_used, char_length, data_length
FROM user_tab_columns
WHERE table_name = 'ENCOMENDAS_EVENTOS' AND column_name = 'STATUS_ENTREGUE';

-- Alteração: definir semântica de caracteres
ALTER TABLE ENCOMENDAS_EVENTOS MODIFY (STATUS_ENTREGUE VARCHAR2(3 CHAR));

-- Validação pós-ajuste
SELECT column_name, data_type, char_used, char_length, data_length
FROM user_tab_columns
WHERE table_name = 'ENCOMENDAS_EVENTOS' AND column_name = 'STATUS_ENTREGUE';

-- Observação:
-- Caso exista trigger que popula STATUS_ENTREGUE (ex.: TRG_ENCOMENDAS_AI_EVENTO),
-- este ajuste evita erro quando o valor contém acento. Não altera dados existentes.