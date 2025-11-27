-- Script de importação manual para a tabela SETORES
-- Execute este script no seu cliente Oracle (SQL Developer, SQLcl, etc.)

-- Limpar dados existentes (opcional)
-- DELETE FROM SETORES;
-- COMMIT;

-- Inserção dos dados dos setores
INSERT INTO SETORES (ID, CODIGO_SETOR, NOME_SETOR, ORGAO, ATIVO, CREATED_AT, UPDATED_AT, LOGRADOURO, NUMERO, COMPLEMENTO, BAIRRO, CIDADE, ESTADO, CEP, TELEFONE, EMAIL, LATITUDE, LONGITUDE)
VALUES (1, '013.DICREFIS', 'Diretoria da Cobrança e Recup de Créditos Fiscais', 'Secretaria da Fazenda', 1, NULL, NULL, 'atualizar endereço', '0', 'complemento do endereço', 'CENTRO', 'Palmas', 'TO', '77000000', '63 - 1234-5678', 'atualizar_email@sefaz.to.gov.br', -10.1689, -48.3317);

INSERT INTO SETORES (ID, CODIGO_SETOR, NOME_SETOR, ORGAO, ATIVO, CREATED_AT, UPDATED_AT, LOGRADOURO, NUMERO, COMPLEMENTO, BAIRRO, CIDADE, ESTADO, CEP, TELEFONE, EMAIL, LATITUDE, LONGITUDE)
VALUES (2, '013.DRREAT', 'Delegacia Regional de Fiscalização - Alvorada', 'Secretaria da Fazenda', 1, NULL, NULL, 'atualizar endereço', '0', 'complemento do endereço', 'CENTRO', 'Alvorada', 'TO', '77480000', '63 - 1234-5678', 'atualizar_email@sefaz.to.gov.br', -12.4844, -49.1244);

INSERT INTO SETORES (ID, CODIGO_SETOR, NOME_SETOR, ORGAO, ATIVO, CREATED_AT, UPDATED_AT, LOGRADOURO, NUMERO, COMPLEMENTO, BAIRRO, CIDADE, ESTADO, CEP, TELEFONE, EMAIL, LATITUDE, LONGITUDE)
VALUES (3, '013.POSFISBAL', 'Posto Fiscal - Balsa', 'Secretaria da Fazenda', 1, NULL, NULL, 'atualizar endereço', '0', 'complemento do endereço', 'CENTRO', 'Tocantinópolis', 'TO', '77900000', '63 - 1234-5678', 'atualizar_email@sefaz.to.gov.br', -6.3356, -47.4211);

-- COMMIT para salvar as alterações
COMMIT;

-- Verificar se os dados foram inseridos
SELECT COUNT(*) as TOTAL_REGISTROS FROM SETORES;
SELECT * FROM SETORES WHERE ROWNUM <= 5 ORDER BY ID;