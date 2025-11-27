SET DEFINE OFF;
SET FEEDBACK ON;
SET SERVEROUTPUT ON;

PROMPT === Atualizando triggers para usar MALOTE.SETOR_DESTINO_ID como setor de origem/pertencimento ===;

PROMPT --- TRG_LACRE_RULES_ON_LINK ---;
CREATE OR REPLACE TRIGGER TRG_LACRE_RULES_ON_LINK
BEFORE INSERT OR UPDATE OF ENCOMENDA_ID, MALOTE_ID ON LACRE
FOR EACH ROW
DECLARE
  v_setor_encomenda NUMBER;
  v_setor_malote   NUMBER;
  v_encomenda_malote NUMBER;
BEGIN
  -- Não permitir desfazer vínculo de encomenda após utilizado
  IF UPDATING('ENCOMENDA_ID') AND :OLD.ENCOMENDA_ID IS NOT NULL AND :NEW.ENCOMENDA_ID IS NULL THEN
    RAISE_APPLICATION_ERROR(-20012, 'Lacre utilizado não pode ser desvinculado da encomenda.');
  END IF;

  -- Ao vincular a ENCOMENDA, validar setor e marcar UTILIZADO
  IF :NEW.ENCOMENDA_ID IS NOT NULL THEN
    SELECT SETOR_ORIGEM_ID INTO v_setor_encomenda FROM ENCOMENDAS WHERE ID = :NEW.ENCOMENDA_ID;
    IF v_setor_encomenda <> :NEW.SETOR_ID THEN
      RAISE_APPLICATION_ERROR(-20013, 'Setor do lacre difere do setor remetente da encomenda.');
    END IF;
    :NEW.STATUS := 'utilizado';
    -- Exigir malote quando houver encomenda
    IF :NEW.MALOTE_ID IS NULL THEN
      RAISE_APPLICATION_ERROR(-20014, 'Lacre vinculado à encomenda deve referenciar um malote.');
    END IF;
  ELSE
    IF INSERTING THEN
      :NEW.STATUS := NVL(:NEW.STATUS, 'DISPONIVEL');
    END IF;
  END IF;

  -- Validação de vínculo ao MALOTE (usar SETOR_DESTINO_ID como setor de pertencimento)
  IF :NEW.MALOTE_ID IS NOT NULL THEN
    SELECT SETOR_DESTINO_ID, ENCOMENDA_ID INTO v_setor_malote, v_encomenda_malote FROM MALOTE WHERE ID = :NEW.MALOTE_ID;
    IF v_setor_malote <> :NEW.SETOR_ID THEN
      RAISE_APPLICATION_ERROR(-20015, 'Setor do lacre difere do setor de pertencimento do malote.');
    END IF;
    IF :NEW.ENCOMENDA_ID IS NOT NULL AND v_encomenda_malote <> :NEW.ENCOMENDA_ID THEN
      RAISE_APPLICATION_ERROR(-20016, 'Malote vinculado ao lacre não pertence à mesma encomenda.');
    END IF;
  END IF;
END;
/

PROMPT --- TRG_MALOTE_SET_STATUS_ON_LINK ---;
CREATE OR REPLACE TRIGGER TRG_MALOTE_SET_STATUS_ON_LINK
BEFORE INSERT OR UPDATE OF ENCOMENDA_ID ON MALOTE
FOR EACH ROW
DECLARE
  v_setor_encomenda NUMBER;
BEGIN
  -- Quando desvincular (ENCOMENDA_ID NULL), malote fica Disponível
  IF :NEW.ENCOMENDA_ID IS NULL THEN
    :NEW.STATUS := 'Disponivel';
  ELSE
    -- Validar que o setor de pertencimento do malote coincide com o setor remetente da encomenda
    SELECT SETOR_ORIGEM_ID INTO v_setor_encomenda FROM ENCOMENDAS WHERE ID = :NEW.ENCOMENDA_ID;
    IF v_setor_encomenda IS NULL THEN
      RAISE_APPLICATION_ERROR(-20001, 'Encomenda sem setor de origem para vínculo com malote.');
    END IF;
    IF v_setor_encomenda <> :NEW.SETOR_DESTINO_ID THEN
      RAISE_APPLICATION_ERROR(-20002, 'Setor de pertencimento do malote difere do setor remetente da encomenda.');
    END IF;
    -- Ao vincular à encomenda, marcar malote como Indisponível por padrão
    :NEW.STATUS := 'Indisponivel';
  END IF;
END;
/

PROMPT --- TRG_MALOTE_REQUIRE_LACRE (sem alterações) ---;
CREATE OR REPLACE TRIGGER TRG_MALOTE_REQUIRE_LACRE
BEFORE INSERT OR UPDATE OF ENCOMENDA_ID ON MALOTE
FOR EACH ROW
DECLARE
  v_exists NUMBER;
BEGIN
  IF :NEW.ENCOMENDA_ID IS NOT NULL THEN
    SELECT COUNT(*) INTO v_exists FROM LACRE WHERE ENCOMENDA_ID = :NEW.ENCOMENDA_ID AND MALOTE_ID = :NEW.ID;
    IF v_exists = 0 THEN
      RAISE_APPLICATION_ERROR(-20017, 'Encomenda com malote requer pelo menos um lacre atribuído ao mesmo malote.');
    END IF;
  END IF;
END;
/

COMMIT;

PROMPT === Triggers atualizadas para usar SETOR_DESTINO_ID ===;