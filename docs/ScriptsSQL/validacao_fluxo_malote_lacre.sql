-- Script de validação do fluxo de MALOTE e LACRE seguindo SETOR_ORIGEM
-- Utilize o bind :setorOrigemId para indicar o setor de origem atual

-- Validação de MALOTES por último evento
WITH LAST_EV AS (
  SELECT 
    e.MALOTE_ID,
    e.ID AS ENCOMENDA_ID,
    e.SETOR_ORIGEM_ID,
    ee.SETOR_ID,
    ee.STATUS_ENTREGA,
    ee.STATUS_ENTREGUE,
    ee.DATA_EVENTO,
    ROW_NUMBER() OVER (PARTITION BY e.MALOTE_ID ORDER BY ee.DATA_EVENTO DESC) AS RN
  FROM ENCOMENDAS_EVENTOS ee
  JOIN ENCOMENDAS e ON e.ID = ee.ENCOMENDA_ID
)
SELECT 
  m.ID AS MALOTE_ID,
  m.NUMERO_MALOTE,
  CASE 
    WHEN (
      UPPER(REPLACE(TRIM(le.STATUS_ENTREGA),' ','_')) IN ('EMTRANSITO','EM_TRANSITO','EM_TRÂNSITO') AND 
      UPPER(TRIM(NVL(le.STATUS_ENTREGUE,'N'))) IN ('NAO','N','NO','FALSE','F','0') AND
      le.SETOR_ID = le.SETOR_ORIGEM_ID
    ) THEN 'Em transito / Indisponível'
    WHEN (
      UPPER(TRIM(le.STATUS_ENTREGA)) = 'ENTREGUE' AND 
      UPPER(TRIM(NVL(le.STATUS_ENTREGUE,'N'))) IN ('SIM','S','YES','Y','TRUE','T','1') AND
      COALESCE(le.SETOR_ID, -1) <> le.SETOR_ORIGEM_ID
    ) THEN 'Disponível'
    ELSE 'Indisponível'
  END AS STATUS_EVENTO_REGRA,
  le.SETOR_ID,
  le.SETOR_ORIGEM_ID,
  le.STATUS_ENTREGA,
  le.STATUS_ENTREGUE
FROM MALOTE m
LEFT JOIN LAST_EV le ON le.MALOTE_ID = m.ID AND le.RN = 1
WHERE m.SETOR_ORIGEM_ID = :setorOrigemId
ORDER BY m.NUMERO_MALOTE;

-- Contagem de MALOTES indisponíveis segundo o fluxo
WITH LAST_EV AS (
  SELECT 
    e.MALOTE_ID,
    e.SETOR_ORIGEM_ID,
    ee.SETOR_ID,
    ee.STATUS_ENTREGA,
    ee.STATUS_ENTREGUE,
    ee.DATA_EVENTO,
    ROW_NUMBER() OVER (PARTITION BY e.MALOTE_ID ORDER BY ee.DATA_EVENTO DESC) AS RN
  FROM ENCOMENDAS_EVENTOS ee
  JOIN ENCOMENDAS e ON e.ID = ee.ENCOMENDA_ID
)
SELECT COUNT(*) AS QTD_INDISPONIVEL
FROM MALOTE m
LEFT JOIN LAST_EV le ON le.MALOTE_ID = m.ID AND le.RN = 1
WHERE m.SETOR_ORIGEM_ID = :setorOrigemId
  AND UPPER(REPLACE(TRIM(le.STATUS_ENTREGA),' ','_')) IN ('EMTRANSITO','EM_TRANSITO','EM_TRÂNSITO')
  AND UPPER(TRIM(NVL(le.STATUS_ENTREGUE,'N'))) IN ('NAO','N','NO','FALSE','F','0')
  AND le.SETOR_ID = le.SETOR_ORIGEM_ID;

-- Validação de LACRES segundo o fluxo de SETOR_ORIGEM
SELECT 
  l.ID AS LACRE_ID,
  l.CODIGO,
  CASE 
    WHEN (l.SETOR_ID = :setorOrigemId AND LOWER(TRIM(l.STATUS)) IN ('utilizado','ultilizado','usado')) THEN 'Já usado / Indisponível'
    WHEN (LOWER(TRIM(l.STATUS)) IN ('utilizado','ultilizado','usado')) THEN 'Disponível'
    ELSE 'Disponível'
  END AS STATUS_LACRE_REGRA,
  l.SETOR_ID,
  l.STATUS
FROM LACRE l
ORDER BY l.CODIGO;

-- Contagem de LACRES indisponíveis (já usados no próprio setor de origem)
SELECT COUNT(*) AS QTD_LACRES_INDISPONIVEIS
FROM LACRE l
WHERE l.SETOR_ID = :setorOrigemId
  AND LOWER(TRIM(l.STATUS)) IN ('utilizado','ultilizado','usado');