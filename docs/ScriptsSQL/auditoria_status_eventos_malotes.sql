-- Auditoria de status por eventos dos Malotes (conforme regras de disponibilidade)
-- Setor de destino avaliado: 172 (Delegacia Regional de Fiscalização - Gurupi)
-- Filtra malotes por número (5, 6, 7, 8), normalizando zeros à esquerda

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
),
MALOTES_FILTRADOS AS (
  SELECT 
    m.ID,
    m.NUMERO_MALOTE,
    m.SETOR_DESTINO_ID
  FROM MALOTE m
  WHERE m.SETOR_DESTINO_ID = 172
    AND TO_NUMBER(REGEXP_REPLACE(TO_CHAR(m.NUMERO_MALOTE), '[^0-9]', '')) IN (5, 6, 7, 8)
)
SELECT 
  mf.ID AS MALOTE_ID,
  mf.NUMERO_MALOTE,
  mf.SETOR_DESTINO_ID,
  le.SETOR_ID AS EVENTO_SETOR_ID,
  le.SETOR_ORIGEM_ID AS ENCOMENDA_SETOR_ORIGEM_ID,
  le.STATUS_ENTREGA,
  le.STATUS_ENTREGUE,
  CASE 
    WHEN (
      UPPER(TRIM(le.STATUS_ENTREGA)) = 'ENTREGUE' AND 
      UPPER(TRIM(NVL(le.STATUS_ENTREGUE, 'N'))) IN ('SIM','S','YES','Y','TRUE','T','1') AND
      le.SETOR_ID = le.SETOR_ORIGEM_ID
    ) THEN 'disponivel'
    WHEN (
      UPPER(REPLACE(TRIM(le.STATUS_ENTREGA), ' ', '_')) IN ('EMTRANSITO','EM_TRANSITO','EM_TRÂNSITO') AND 
      UPPER(TRIM(NVL(le.STATUS_ENTREGUE, 'N'))) IN ('NAO','N','NO','FALSE','F','0') AND
      le.SETOR_ID = le.SETOR_ORIGEM_ID
    ) THEN 'indisponivel'
    ELSE 'sem_evento_ou_sem_correspondencia'
  END AS STATUS_EVENTO
FROM MALOTES_FILTRADOS mf
LEFT JOIN LAST_EV le ON le.MALOTE_ID = mf.ID AND le.RN = 1
ORDER BY mf.NUMERO_MALOTE;

-- Observação:
-- Disponível: quando existir evento com igualdade SETOR_ID = SETOR_ORIGEM_ID e (STATUS_ENTREGA='Entregue' e STATUS_ENTREGUE='Sim')
-- Indisponível: quando existir evento com igualdade SETOR_ID = SETOR_ORIGEM_ID e (STATUS_ENTREGA='EmTransito' e STATUS_ENTREGUE='Não')
-- Em outros casos (sem evento ou sem correspondência de setor), o modal não deve bloquear a seleção.