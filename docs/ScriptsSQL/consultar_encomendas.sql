-- Script para consultar a estrutura e dados da tabela encomendas
-- Verificar se a tabela existe
SELECT table_name FROM user_tables WHERE table_name = 'ENCOMENDAS';

-- Verificar a estrutura da tabela
DESCRIBE encomendas;

-- Consultar todos os dados da tabela encomendas
SELECT * FROM encomendas;

-- Contar total de registros
SELECT COUNT(*) as total_encomendas FROM encomendas;

-- Verificar se existem campos de localização/coordenadas
SELECT column_name, data_type, data_length 
FROM user_tab_columns 
WHERE table_name = 'ENCOMENDAS' 
AND (UPPER(column_name) LIKE '%LAT%' 
     OR UPPER(column_name) LIKE '%LON%' 
     OR UPPER(column_name) LIKE '%COORD%'
     OR UPPER(column_name) LIKE '%ENDERECO%'
     OR UPPER(column_name) LIKE '%ORIGEM%'
     OR UPPER(column_name) LIKE '%DESTINO%');