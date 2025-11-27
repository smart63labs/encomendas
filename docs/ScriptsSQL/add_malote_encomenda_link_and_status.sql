SET DEFINE OFF;
SET FEEDBACK ON;
SET SERVEROUTPUT ON;

PROMPT === Adicionando coluna STATUS em MALOTE ===;
ALTER TABLE MALOTE ADD (STATUS VARCHAR2(20) DEFAULT 'Disponivel');
ALTER TABLE MALOTE ADD CONSTRAINT CK_MALOTE_STATUS CHECK (STATUS IN ('Disponivel','Indisponivel','Em transito'));

PROMPT === Adicionando coluna ENCOMENDA_ID em MALOTE e FK para ENCOMENDAS ===;
ALTER TABLE MALOTE ADD (ENCOMENDA_ID NUMBER);
CREATE INDEX IDX_MALOTE_ENCOMENDA_ID ON MALOTE(ENCOMENDA_ID);
ALTER TABLE MALOTE ADD CONSTRAINT FK_MALOTE_ENCOMENDA FOREIGN KEY (ENCOMENDA_ID) REFERENCES ENCOMENDAS(ID);

PROMPT === Trigger: garantir consistência de setor e ajustar STATUS no vínculo ===;
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
    -- Validar que o setor do malote coincide com o setor remetente da encomenda
    SELECT SETOR_ORIGEM_ID INTO v_setor_encomenda FROM ENCOMENDAS WHERE ID = :NEW.ENCOMENDA_ID;
    IF v_setor_encomenda IS NULL THEN
      RAISE_APPLICATION_ERROR(-20001, 'Encomenda sem setor de origem para vínculo com malote.');
    END IF;
    IF v_setor_encomenda <> :NEW.SETOR_ORIGEM_ID THEN
      RAISE_APPLICATION_ERROR(-20002, 'Setor do malote difere do setor remetente da encomenda.');
    END IF;
    -- Ao vincular, por padrão marcar como Indisponível (trânsito ajustado em trigger da ENCOMENDAS)
    :NEW.STATUS := 'Indisponivel';
  END IF;
END;
/

PROMPT === Trigger: propagar STATUS Em transito conforme ENCOMENDAS.STATUS ===;
CREATE OR REPLACE TRIGGER TRG_ENCOMENDAS_PROPAGATE_MALOTE_STATUS
AFTER UPDATE OF STATUS ON ENCOMENDAS
FOR EACH ROW
BEGIN
  -- Quando encomenda entra em trânsito, malotes vinculados ficam Em transito
  IF :NEW.STATUS = 'Em transito' THEN
    UPDATE MALOTE SET STATUS = 'Em transito' WHERE ENCOMENDA_ID = :NEW.ID;
  ELSE
    -- Para outros status intermediários, manter Indisponivel
    UPDATE MALOTE SET STATUS = 'Indisponivel' WHERE ENCOMENDA_ID = :NEW.ID;
  END IF;
END;
/

PROMPT === Atualizando STATUS inicial com base no vínculo existente ===;
UPDATE MALOTE SET STATUS = 'Disponivel' WHERE ENCOMENDA_ID IS NULL;
UPDATE MALOTE SET STATUS = 'Indisponivel' WHERE ENCOMENDA_ID IS NOT NULL;

COMMIT;

PROMPT === DDL e triggers aplicadas com sucesso ===;