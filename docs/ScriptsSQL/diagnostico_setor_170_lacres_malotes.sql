-- Diagnóstico de Lacres e Malotes para o Setor 170
-- Schema: protocolo_user @ FREEPDB1
-- Execução:
--   sqlcl protocolo_user/Anderline49@localhost:1521/FREEPDB1 @docs/ScriptsSQL/diagnostico_setor_170_lacres_malotes.sql

SET SERVEROUTPUT ON SIZE UNLIMITED;
SET PAGESIZE 200;
SET LINESIZE 200;

PROMPT === Verificando colunas de LACRE e MALOTE ===;
DECLARE
  v_has_setor_origem_malote NUMBER := 0;
  v_has_setor_id_malote NUMBER := 0;
  v_has_status_lacre NUMBER := 0;
  v_has_setor_id_lacre NUMBER := 0;
BEGIN
  SELECT COUNT(*) INTO v_has_setor_origem_malote
  FROM user_tab_columns WHERE table_name = 'MALOTE' AND column_name = 'SETOR_ORIGEM_ID';
  SELECT COUNT(*) INTO v_has_setor_id_malote
  FROM user_tab_columns WHERE table_name = 'MALOTE' AND column_name = 'SETOR_ID';
  SELECT COUNT(*) INTO v_has_status_lacre
  FROM user_tab_columns WHERE table_name = 'LACRE' AND column_name = 'STATUS';
  SELECT COUNT(*) INTO v_has_setor_id_lacre
  FROM user_tab_columns WHERE table_name = 'LACRE' AND column_name = 'SETOR_ID';
  DBMS_OUTPUT.PUT_LINE('MALOTE.SETOR_ORIGEM_ID: '||v_has_setor_origem_malote||' | MALOTE.SETOR_ID: '||v_has_setor_id_malote);
  DBMS_OUTPUT.PUT_LINE('LACRE.STATUS: '||v_has_status_lacre||' | LACRE.SETOR_ID: '||v_has_setor_id_lacre);
END;
/

PROMPT === Contagem de Lacres para setor 170 ===;
SELECT 
  COUNT(*) AS total,
  SUM(CASE WHEN STATUS = 'disponivel' THEN 1 ELSE 0 END) AS disponiveis,
  SUM(CASE WHEN STATUS = 'atribuido' THEN 1 ELSE 0 END) AS atribuidos,
  SUM(CASE WHEN STATUS = 'vinculado' THEN 1 ELSE 0 END) AS vinculados
FROM LACRE
WHERE SETOR_ID = 170;

PROMPT === Listagem de até 20 Lacres para setor 170 ===;
SELECT ID, CODIGO, STATUS, SETOR_ID, ENCOMENDA_ID, LOTE_NUMERO
FROM LACRE
WHERE SETOR_ID = 170
ORDER BY ID DESC FETCH FIRST 20 ROWS ONLY;

PROMPT === Contagem de Malotes para setor 170 (auto-detecção de coluna) ===;
DECLARE
  v_count NUMBER := 0;
  v_has_setor_origem NUMBER := 0;
  v_has_setor_id NUMBER := 0;
BEGIN
  SELECT COUNT(*) INTO v_has_setor_origem FROM user_tab_columns WHERE table_name = 'MALOTE' AND column_name = 'SETOR_ORIGEM_ID';
  SELECT COUNT(*) INTO v_has_setor_id FROM user_tab_columns WHERE table_name = 'MALOTE' AND column_name = 'SETOR_ID';

  IF v_has_setor_origem = 1 THEN
    EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM MALOTE WHERE SETOR_ORIGEM_ID = 170' INTO v_count;
    DBMS_OUTPUT.PUT_LINE('Malotes com SETOR_ORIGEM_ID = 170: '||v_count);
  ELSIF v_has_setor_id = 1 THEN
    EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM MALOTE WHERE SETOR_ID = 170' INTO v_count;
    DBMS_OUTPUT.PUT_LINE('Malotes com SETOR_ID = 170: '||v_count);
  ELSE
    DBMS_OUTPUT.PUT_LINE('Nenhuma coluna de setor encontrada em MALOTE (esperado SETOR_ORIGEM_ID ou SETOR_ID).');
  END IF;
END;
/

PROMPT === Listagem de até 20 Malotes do setor 170 (auto-detecção) ===;
DECLARE
  v_has_setor_origem NUMBER := 0;
  v_has_setor_id NUMBER := 0;
BEGIN
  SELECT COUNT(*) INTO v_has_setor_origem FROM user_tab_columns WHERE table_name = 'MALOTE' AND column_name = 'SETOR_ORIGEM_ID';
  SELECT COUNT(*) INTO v_has_setor_id FROM user_tab_columns WHERE table_name = 'MALOTE' AND column_name = 'SETOR_ID';

  IF v_has_setor_origem = 1 THEN
    DBMS_OUTPUT.PUT_LINE('Mostrando MALOTE com SETOR_ORIGEM_ID = 170');
    FOR r IN (
      SELECT ID, NUMERO_MALOTE, CODIGO_EMISSAO, NUMERO_CONTRATO, SETOR_ORIGEM_ID, SETOR_DESTINO_ID, ATIVO
      FROM MALOTE
      WHERE SETOR_ORIGEM_ID = 170
      ORDER BY ID DESC FETCH FIRST 20 ROWS ONLY
    ) LOOP
      DBMS_OUTPUT.PUT_LINE('ID='||r.ID||' | MALOTE='||r.NUMERO_MALOTE||' | EMISSAO='||r.CODIGO_EMISSAO||' | CONTRATO='||r.NUMERO_CONTRATO||' | ORIGEM='||r.SETOR_ORIGEM_ID||' | DESTINO='||r.SETOR_DESTINO_ID||' | ATIVO='||r.ATIVO);
    END LOOP;
  ELSIF v_has_setor_id = 1 THEN
    DBMS_OUTPUT.PUT_LINE('Mostrando MALOTE com SETOR_ID = 170');
    FOR r IN (
      SELECT ID, NUMERO_MALOTE, CODIGO_EMISSAO, NUMERO_CONTRATO, SETOR_ID, ATIVO
      FROM MALOTE
      WHERE SETOR_ID = 170
      ORDER BY ID DESC FETCH FIRST 20 ROWS ONLY
    ) LOOP
      DBMS_OUTPUT.PUT_LINE('ID='||r.ID||' | MALOTE='||r.NUMERO_MALOTE||' | EMISSAO='||r.CODIGO_EMISSAO||' | CONTRATO='||r.NUMERO_CONTRATO||' | SETOR_ID='||r.SETOR_ID||' | ATIVO='||r.ATIVO);
    END LOOP;
  ELSE
    DBMS_OUTPUT.PUT_LINE('Não foi possível listar MALOTE: coluna de setor não encontrada.');
  END IF;
END;
/

PROMPT === Diagnóstico de vínculos com ENCOMENDAS (primeiros 20) ===;
SELECT e.ID AS ENCOMENDA_ID,
       e.SETOR_ORIGEM_ID,
       e.SETOR_DESTINO_ID,
       e.LACRE_ID,
       e.MALOTE_ID,
       l.SETOR_ID AS LACRE_SETOR_ID,
       l.STATUS AS LACRE_STATUS,
       m.SETOR_ORIGEM_ID AS MALOTE_ORIGEM_ID,
       m.SETOR_DESTINO_ID AS MALOTE_DESTINO_ID
FROM ENCOMENDAS e
LEFT JOIN LACRE l ON l.ID = e.LACRE_ID
LEFT JOIN MALOTE m ON m.ID = e.MALOTE_ID
WHERE e.SETOR_ORIGEM_ID = 170
ORDER BY e.ID DESC FETCH FIRST 20 ROWS ONLY;

PROMPT === Amostra geral de MALOTE (últimos 20 registros) ===;
SELECT ID, NUMERO_MALOTE, CODIGO_EMISSAO, NUMERO_CONTRATO, SETOR_ORIGEM_ID, SETOR_DESTINO_ID, ATIVO
FROM MALOTE
ORDER BY ID DESC FETCH FIRST 20 ROWS ONLY;

PROMPT === Fim do diagnóstico ===;
EXIT SUCCESS