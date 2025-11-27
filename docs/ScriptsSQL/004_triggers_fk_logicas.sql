-- Script: 004_triggers_fk_logicas.sql
-- Objetivo: Implementar validações de FKs lógicas em ENCOMENDAS_EVENTOS
-- conforme solicitado, referenciando colunas da tabela ENCOMENDAS:
--   - ENCOMENDA_ID -> ENCOMENDAS.ID (já existe FK real)
--   - MALOTE_ID -> ENCOMENDAS.MALOTE_ID
--   - SETOR_ID -> ENCOMENDAS.SETOR_DESTINO_ID
--   - USUARIO_ID -> ENCOMENDAS.USUARIO_DESTINO_ID
-- Observação: Oracle exige PK/Unique na coluna referenciada para FKs reais.
-- Como MALOTE_ID, SETOR_DESTINO_ID e USUARIO_DESTINO_ID não são únicos
-- em ENCOMENDAS, usamos trigger para garantir consistência.

CREATE OR REPLACE TRIGGER TRG_ENC_EVT_BI_VALIDA_FKS
BEFORE INSERT OR UPDATE ON ENCOMENDAS_EVENTOS
FOR EACH ROW
DECLARE
  v_malote_id         ENCOMENDAS.MALOTE_ID%TYPE;
  v_setor_destino_id  ENCOMENDAS.SETOR_DESTINO_ID%TYPE;
  v_usuario_destino_id ENCOMENDAS.USUARIO_DESTINO_ID%TYPE;
BEGIN
  -- Verifica se a encomenda existe e obtém os valores esperados
  SELECT MALOTE_ID, SETOR_DESTINO_ID, USUARIO_DESTINO_ID
    INTO v_malote_id, v_setor_destino_id, v_usuario_destino_id
    FROM ENCOMENDAS
   WHERE ID = :NEW.ENCOMENDA_ID;

  -- Valida MALOTE_ID
  IF :NEW.MALOTE_ID <> v_malote_id THEN
    RAISE_APPLICATION_ERROR(-20001,
      'MALOTE_ID não corresponde ao ENCOMENDAS.MALOTE_ID para o ENCOMENDA_ID informado');
  END IF;

  -- Valida SETOR_ID
  IF :NEW.SETOR_ID <> v_setor_destino_id THEN
    RAISE_APPLICATION_ERROR(-20002,
      'SETOR_ID não corresponde ao ENCOMENDAS.SETOR_DESTINO_ID para o ENCOMENDA_ID informado');
  END IF;

  -- Valida USUARIO_ID
  IF :NEW.USUARIO_ID <> v_usuario_destino_id THEN
    RAISE_APPLICATION_ERROR(-20003,
      'USUARIO_ID não corresponde ao ENCOMENDAS.USUARIO_DESTINO_ID para o ENCOMENDA_ID informado');
  END IF;

EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RAISE_APPLICATION_ERROR(-20000,
      'ENCOMENDA_ID inexistente em ENCOMENDAS');
END;
/