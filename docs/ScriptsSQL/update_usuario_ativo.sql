-- Script para desativar usuários (usuario_ativo = '0') exceto ADMINs
-- Executado em: 2025-01-27
-- LLM utilizado: claude-sonnet-4
-- Descrição: Altera a coluna usuario_ativo para '0' para todos os usuários que não possuem role = 'ADMIN'

-- Verificar dados antes da alteração
SELECT role, usuario_ativo, COUNT(*) as quantidade 
FROM usuarios 
GROUP BY role, usuario_ativo 
ORDER BY role, usuario_ativo;

-- Executar a alteração
UPDATE usuarios 
SET usuario_ativo = '0' 
WHERE role != 'ADMIN';

-- Confirmar as alterações
COMMIT;

-- Verificar dados após a alteração
SELECT role, usuario_ativo, COUNT(*) as quantidade 
FROM usuarios 
GROUP BY role, usuario_ativo 
ORDER BY role, usuario_ativo;

-- Resultado esperado:
-- ADMIN com usuario_ativo = '1' (mantidos ativos)
-- USER com usuario_ativo = '0' (desativados)