SET DEFINE OFF;
SET FEEDBACK ON;
SET SERVEROUTPUT ON;

PROMPT === Adicionando coluna MALOTE_ID em LACRE ===;
ALTER TABLE LACRE ADD (MALOTE_ID NUMBER);
CREATE INDEX IDX_LACRE_MALOTE_ID ON LACRE(MALOTE_ID);
ALTER TABLE LACRE ADD CONSTRAINT FK_LACRE_MALOTE FOREIGN KEY (MALOTE_ID) REFERENCES MALOTE(ID);

PROMPT === Trigger: regras de vínculo e status de LACRE ===;
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
    :NEW.STATUS := 'UTILIZADO';
    -- Exigir malote quando houver encomenda
    IF :NEW.MALOTE_ID IS NULL THEN
      RAISE_APPLICATION_ERROR(-20014, 'Lacre vinculado à encomenda deve referenciar um malote.');
    END IF;
  ELSE
    -- Sem encomenda: estado padrão é não utilizado (se desejado)
    IF INSERTING THEN
      :NEW.STATUS := NVL(:NEW.STATUS, 'DISPONIVEL');
    END IF;
  END IF;

  -- Validação de vínculo ao MALOTE (setor e consistência com encomenda)
  IF :NEW.MALOTE_ID IS NOT NULL THEN
    SELECT SETOR_ORIGEM_ID, ENCOMENDA_ID INTO v_setor_malote, v_encomenda_malote FROM MALOTE WHERE ID = :NEW.MALOTE_ID;
    IF v_setor_malote <> :NEW.SETOR_ID THEN
      RAISE_APPLICATION_ERROR(-20015, 'Setor do lacre difere do setor de origem do malote.');
    END IF;
    IF :NEW.ENCOMENDA_ID IS NOT NULL AND v_encomenda_malote <> :NEW.ENCOMENDA_ID THEN
      RAISE_APPLICATION_ERROR(-20016, 'Malote vinculado ao lacre não pertence à mesma encomenda.');
    END IF;
  END IF;
END;
/

PROMPT === Trigger: exigir pelo menos um LACRE para encomenda com malote ===;
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

PROMPT === DDL e triggers de LACRE aplicadas ===;