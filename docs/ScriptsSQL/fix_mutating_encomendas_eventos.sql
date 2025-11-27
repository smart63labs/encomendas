-- Correção ORA-04091 (tabela ENCOMENDAS mutante) ao inserir ENCOMENDAS_EVENTOS
-- Substitui trigger row-level que consulta ENCOMENDAS por uma trigger composta
-- A validação passa a ocorrer AFTER STATEMENT, evitando consultar tabela mutante

ALTER SESSION SET CURRENT_SCHEMA = PROTOCOLO_USER;

CREATE OR REPLACE TRIGGER TRG_ENC_EVT_BI_VALIDA_FKS
FOR INSERT OR UPDATE ON ENCOMENDAS_EVENTOS
COMPOUND TRIGGER

  TYPE t_row IS RECORD (
    encomenda_id      ENCOMENDAS_EVENTOS.ENCOMENDA_ID%TYPE,
    malote_id         ENCOMENDAS_EVENTOS.MALOTE_ID%TYPE,
    setor_id          ENCOMENDAS_EVENTOS.SETOR_ID%TYPE,
    usuario_id        ENCOMENDAS_EVENTOS.USUARIO_ID%TYPE
  );

  TYPE t_tab IS TABLE OF t_row INDEX BY PLS_INTEGER;
  g_rows t_tab;

  BEFORE STATEMENT IS
  BEGIN
    g_rows.DELETE;
  END BEFORE STATEMENT;

  AFTER EACH ROW IS
  BEGIN
    g_rows(g_rows.COUNT + 1) := t_row(
      :NEW.ENCOMENDA_ID,
      :NEW.MALOTE_ID,
      :NEW.SETOR_ID,
      :NEW.USUARIO_ID
    );
  END AFTER EACH ROW;

  AFTER STATEMENT IS
  BEGIN
    FOR i IN 1 .. g_rows.COUNT LOOP
      DECLARE
        v_malote_id           ENCOMENDAS.MALOTE_ID%TYPE;
        v_setor_destino_id    ENCOMENDAS.SETOR_DESTINO_ID%TYPE;
        v_usuario_destino_id  ENCOMENDAS.USUARIO_DESTINO_ID%TYPE;
      BEGIN
        SELECT MALOTE_ID, SETOR_DESTINO_ID, USUARIO_DESTINO_ID
          INTO v_malote_id, v_setor_destino_id, v_usuario_destino_id
          FROM ENCOMENDAS
         WHERE ID = g_rows(i).encomenda_id;

        IF g_rows(i).malote_id <> v_malote_id THEN
          RAISE_APPLICATION_ERROR(-20001,
            'MALOTE_ID não corresponde ao ENCOMENDAS.MALOTE_ID para o ENCOMENDA_ID informado');
        END IF;

        IF g_rows(i).setor_id <> v_setor_destino_id THEN
          RAISE_APPLICATION_ERROR(-20002,
            'SETOR_ID não corresponde ao ENCOMENDAS.SETOR_DESTINO_ID para o ENCOMENDA_ID informado');
        END IF;

        IF g_rows(i).usuario_id <> v_usuario_destino_id THEN
          RAISE_APPLICATION_ERROR(-20003,
            'USUARIO_ID não corresponde ao ENCOMENDAS.USUARIO_DESTINO_ID para o ENCOMENDA_ID informado');
        END IF;

      EXCEPTION
        WHEN NO_DATA_FOUND THEN
          RAISE_APPLICATION_ERROR(-20000, 'ENCOMENDA_ID inexistente em ENCOMENDAS');
      END;
    END LOOP;
  END AFTER STATEMENT;

END TRG_ENC_EVT_BI_VALIDA_FKS;

-- Observações:
-- - Mantém a mesma lógica de validação, mas fora do contexto mutante.
-- - Evita ORA-04091 ao inserir eventos automaticamente a partir de ENCOMENDAS.
-- - Não altera TRG_ENCOMENDAS_AI_EVENTO.