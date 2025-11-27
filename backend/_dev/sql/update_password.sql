-- Atualizar senha do usuário João Silva
UPDATE USUARIOS 
SET SENHA = '$2b$10$azZ83yY8Vd4hwy/Cas6IpenqZdH9E1IpdHqHamUK37bp4B2zQK0Au'
WHERE EMAIL = 'joao.silva@sefaz.go.gov.br';

COMMIT;

-- Verificar se a atualização foi bem-sucedida
SELECT ID, NOME, EMAIL, SENHA FROM USUARIOS WHERE EMAIL = 'joao.silva@sefaz.go.gov.br';