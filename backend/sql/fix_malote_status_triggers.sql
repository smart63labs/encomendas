-- Script para corrigir os triggers de atualização de STATUS do MALOTE
-- Data: 13/11/2025
-- Problema: Triggers antigos não atualizam corretamente o STATUS do malote ao criar/receber encomendas

SET DEFINE OFF;
SET FEEDBACK ON;
SET SERVEROUTPUT ON;

PROMPT === Removendo triggers antigos ===;

BEGIN
  EXECUTE IMMEDIATE 'DROP TRIGGER TRG_MALOTE_SET_STATUS_ON_LINK';
  DBMS_OUTPUT.PUT_LINE('Trigger TRG_MALOTE_SET_STATUS_ON_LINK removido');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -4080 THEN
      DBMS_OUTPUT.PUT_LINE('Trigger TRG_MALOTE_SET_STATUS_ON_LINK não existe');
    ELSE
      RAISE;
    END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE 'DROP TRIGGER TRG_ENCOMENDAS_PROPAGATE_MALOTE_STATUS';
  DBMS_OUTPUT.PUT_LINE('Trigger TRG_ENCOMENDAS_PROPAGATE_MALOTE_STATUS removido');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -4080 THEN
      DBMS_OUTPUT.PUT_LINE('Trigger TRG_ENCOMENDAS_PROPAGATE_MALOTE_STATUS não existe');
    ELSE
      RAISE;
    END IF;
END;
/

PROMPT === Criando trigger corrigido: TRG_MALOTE_SET_STATUS_ON_LINK ===;
PROMPT === Este trigger atualiza o STATUS do malote ao vincular/desvincular encomenda ===;

CREATE OR REPLACE TRIGGER TRG_MALOTE_SET_STATUS_ON_LINK
BEFORE INSERT OR UPDATE OF ENCOMENDA_ID ON MALOTE
FOR EACH ROW
DECLARE
  v_setor_encomenda NUMBER;
BEGIN
  -- Quando desvincular (ENCOMENDA_ID NULL), malote fica Disponível
  IF :NEW.ENCOMENDA_ID IS NULL THEN
    :NEW.STATUS := 'Disponivel';
    DBMS_OUTPUT.PUT_LINE('Malote ' || :NEW.ID || ' desvinculado - STATUS: Disponivel');
  ELSE
    -- Validar que o setor do malote coincide com o setor remetente da encomenda
    BEGIN
      SELECT SETOR_ORIGEM_ID INTO v_setor_encomenda FROM ENCOMENDAS WHERE ID = :NEW.ENCOMENDA_ID;
      
      IF v_setor_encomenda IS NULL THEN
        RAISE_APPLICATION_ERROR(-20001, 'Encomenda sem setor de origem para vínculo com malote.');
      END IF;
      
      IF v_setor_encomenda <> :NEW.SETOR_ORIGEM_ID THEN
        RAISE_APPLICATION_ERROR(-20002, 'Setor do malote difere do setor remetente da encomenda.');
      END IF;
      
      -- Ao vincular, por padrão marcar como Indisponível
      -- O status será ajustado para 'Em transito' pelo trigger da ENCOMENDAS
      :NEW.STATUS := 'Indisponivel';
      DBMS_OUTPUT.PUT_LINE('Malote ' || :NEW.ID || ' vinculado à encomenda ' || :NEW.ENCOMENDA_ID || ' - STATUS: Indisponivel');
    EXCEPTION
      WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20003, 'Encomenda não encontrada para vínculo com malote.');
    END;
  END IF;
END;
/

PROMPT === Criando trigger corrigido: TRG_ENCOMENDAS_PROPAGATE_MALOTE_STATUS ===;
PROMPT === Este trigger propaga o STATUS da encomenda para o malote vinculado ===;

CREATE OR REPLACE TRIGGER TRG_ENCOMENDAS_PROPAGATE_MALOTE_STATUS
AFTER UPDATE OF STATUS ON ENCOMENDAS
FOR EACH ROW
DECLARE
  v_malote_id NUMBER;
  v_status_lower VARCHAR2(50);
BEGIN
  -- Normalizar status para comparação
  v_status_lower := LOWER(TRIM(:NEW.STATUS));
  
  -- Buscar malote vinculado (se houver)
  BEGIN
    SELECT ID INTO v_malote_id FROM MALOTE WHERE ENCOMENDA_ID = :NEW.ID;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      -- Sem malote vinculado, nada a fazer
      RETURN;
    WHEN TOO_MANY_ROWS THEN
      -- Múltiplos malotes vinculados (não deveria acontecer), pegar o primeiro
      SELECT MIN(ID) INTO v_malote_id FROM MALOTE WHERE ENCOMENDA_ID = :NEW.ID;
  END;
  
  -- Aplicar regra de status conforme o status da encomenda
  IF v_status_lower IN ('em transito','em_transito','em trânsito','em_trânsito','transito','trânsito','postado') THEN
    -- Encomenda em trânsito: malote fica "Em transito"
    UPDATE MALOTE 
    SET STATUS = 'Em transito', 
        DATA_ATUALIZACAO = SYSDATE 
    WHERE ID = v_malote_id;
    
    DBMS_OUTPUT.PUT_LINE('Encomenda ' || :NEW.ID || ' em trânsito - Malote ' || v_malote_id || ' STATUS: Em transito');
    
  ELSIF v_status_lower = 'entregue' THEN
    -- Encomenda entregue: desvincular malote e marcar como "Disponivel"
    UPDATE MALOTE 
    SET ENCOMENDA_ID = NULL, 
        STATUS = 'Disponivel', 
        DATA_ATUALIZACAO = SYSDATE 
    WHERE ID = v_malote_id;
    
    DBMS_OUTPUT.PUT_LINE('Encomenda ' || :NEW.ID || ' entregue - Malote ' || v_malote_id || ' desvinculado e STATUS: Disponivel');
    
  ELSE
    -- Outros status: malote fica "Indisponivel"
    UPDATE MALOTE 
    SET STATUS = 'Indisponivel', 
        DATA_ATUALIZACAO = SYSDATE 
    WHERE ID = v_malote_id;
    
    DBMS_OUTPUT.PUT_LINE('Encomenda ' || :NEW.ID || ' status ' || :NEW.STATUS || ' - Malote ' || v_malote_id || ' STATUS: Indisponivel');
  END IF;
END;
/

PROMPT === Habilitando triggers ===;

ALTER TRIGGER TRG_MALOTE_SET_STATUS_ON_LINK ENABLE;
ALTER TRIGGER TRG_ENCOMENDAS_PROPAGATE_MALOTE_STATUS ENABLE;

PROMPT === Corrigindo STATUS dos malotes existentes ===;

-- Malotes sem encomenda vinculada devem estar Disponíveis
UPDATE MALOTE 
SET STATUS = 'Disponivel', 
    DATA_ATUALIZACAO = SYSDATE 
WHERE ENCOMENDA_ID IS NULL 
  AND STATUS <> 'Disponivel';

DBMS_OUTPUT.PUT_LINE(SQL%ROWCOUNT || ' malote(s) sem encomenda marcado(s) como Disponivel');

-- Malotes com encomenda em trânsito devem estar "Em transito"
UPDATE MALOTE m
SET STATUS = 'Em transito', 
    DATA_ATUALIZACAO = SYSDATE 
WHERE EXISTS (
  SELECT 1 FROM ENCOMENDAS e
  WHERE e.MALOTE_ID = m.ID
    AND (
      UPPER(REPLACE(TRIM(e.STATUS), ' ', '_')) IN ('EM_TRANSITO','EM_TRÂNSITO','EMTRANSITO','EM TRANSITO','EM TRÂNSITO')
      OR UPPER(TRIM(e.STATUS)) IN ('POSTADO','TRANSITO','TRÂNSITO')
    )
)
AND STATUS <> 'Em transito';

DBMS_OUTPUT.PUT_LINE(SQL%ROWCOUNT || ' malote(s) com encomenda em trânsito marcado(s) como Em transito');

-- Malotes com encomenda entregue devem ser desvinculados e marcados como Disponíveis
UPDATE MALOTE m
SET ENCOMENDA_ID = NULL,
    STATUS = 'Disponivel', 
    DATA_ATUALIZACAO = SYSDATE 
WHERE EXISTS (
  SELECT 1 FROM ENCOMENDAS e
  WHERE e.MALOTE_ID = m.ID
    AND UPPER(TRIM(e.STATUS)) = 'ENTREGUE'
)
AND (ENCOMENDA_ID IS NOT NULL OR STATUS <> 'Disponivel');

DBMS_OUTPUT.PUT_LINE(SQL%ROWCOUNT || ' malote(s) com encomenda entregue desvinculado(s) e marcado(s) como Disponivel');

-- Malotes com encomenda em outros status devem estar Indisponíveis
UPDATE MALOTE m
SET STATUS = 'Indisponivel', 
    DATA_ATUALIZACAO = SYSDATE 
WHERE ENCOMENDA_ID IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ENCOMENDAS e
    WHERE e.MALOTE_ID = m.ID
      AND (
        UPPER(REPLACE(TRIM(e.STATUS), ' ', '_')) IN ('EM_TRANSITO','EM_TRÂNSITO','EMTRANSITO','EM TRANSITO','EM TRÂNSITO')
        OR UPPER(TRIM(e.STATUS)) IN ('POSTADO','TRANSITO','TRÂNSITO','ENTREGUE')
      )
  )
  AND STATUS <> 'Indisponivel';

DBMS_OUTPUT.PUT_LINE(SQL%ROWCOUNT || ' malote(s) com encomenda em outros status marcado(s) como Indisponivel');

COMMIT;

PROMPT === Verificando resultado ===;

SELECT 
  STATUS,
  COUNT(*) AS QUANTIDADE
FROM MALOTE
GROUP BY STATUS
ORDER BY STATUS;

PROMPT === Triggers corrigidos e STATUS dos malotes atualizados com sucesso ===;
