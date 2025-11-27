-- =====================================================
-- ALTERAÇÃO DA TABELA CONFIGURACOES_GERAL
-- Adicionando campos para dados do rodapé
-- =====================================================
-- Autor: Sistema Automatizado
-- Data: 2024
-- Descrição: Adiciona campos necessários para configurações do rodapé
-- =====================================================

-- Configurações iniciais
SET SERVEROUTPUT ON;
ALTER SESSION SET NLS_DATE_FORMAT = 'DD/MM/YYYY HH24:MI:SS';

-- =====================================================
-- ADICIONAR NOVOS CAMPOS À TABELA CONFIGURACOES_GERAL
-- =====================================================

-- Campos para dados do rodapé
ALTER TABLE CONFIGURACOES_GERAL ADD (
    CIDADE VARCHAR2(100), -- Cidade da instituição (ex: Palmas - TO)
    TELEFONE_2 VARCHAR2(20), -- Segundo telefone
    TELEFONE_3 VARCHAR2(20), -- Terceiro telefone
    EMAIL_CONTATO VARCHAR2(100), -- Email de contato específico
    SITE_URL VARCHAR2(200), -- URL do site institucional
    FACEBOOK_URL VARCHAR2(200), -- URL do Facebook
    INSTAGRAM_URL VARCHAR2(200), -- URL do Instagram
    TWITTER_URL VARCHAR2(200), -- URL do Twitter
    WHATSAPP VARCHAR2(20), -- Número do WhatsApp
    LOGO_RODAPE_URL VARCHAR2(200), -- URL do logo para o rodapé
    TEXTO_COPYRIGHT VARCHAR2(500), -- Texto de copyright
    ENDERECO_COMPLETO VARCHAR2(1000) -- Endereço completo formatado
);

-- =====================================================
-- COMENTÁRIOS NOS NOVOS CAMPOS
-- =====================================================
COMMENT ON COLUMN CONFIGURACOES_GERAL.CIDADE IS 'Cidade da instituição (ex: Palmas - TO)';
COMMENT ON COLUMN CONFIGURACOES_GERAL.TELEFONE_2 IS 'Segundo telefone de contato';
COMMENT ON COLUMN CONFIGURACOES_GERAL.TELEFONE_3 IS 'Terceiro telefone de contato';
COMMENT ON COLUMN CONFIGURACOES_GERAL.EMAIL_CONTATO IS 'Email de contato específico para o rodapé';
COMMENT ON COLUMN CONFIGURACOES_GERAL.SITE_URL IS 'URL do site institucional';
COMMENT ON COLUMN CONFIGURACOES_GERAL.FACEBOOK_URL IS 'URL da página do Facebook';
COMMENT ON COLUMN CONFIGURACOES_GERAL.INSTAGRAM_URL IS 'URL da página do Instagram';
COMMENT ON COLUMN CONFIGURACOES_GERAL.TWITTER_URL IS 'URL da página do Twitter';
COMMENT ON COLUMN CONFIGURACOES_GERAL.WHATSAPP IS 'Número do WhatsApp para contato';
COMMENT ON COLUMN CONFIGURACOES_GERAL.LOGO_RODAPE_URL IS 'URL do logo específico para o rodapé';
COMMENT ON COLUMN CONFIGURACOES_GERAL.TEXTO_COPYRIGHT IS 'Texto de copyright para o rodapé';
COMMENT ON COLUMN CONFIGURACOES_GERAL.ENDERECO_COMPLETO IS 'Endereço completo formatado para exibição';

-- =====================================================
-- ATUALIZAR REGISTRO EXISTENTE COM DADOS PADRÃO
-- =====================================================
UPDATE CONFIGURACOES_GERAL SET
    CIDADE = 'Palmas - TO',
    TELEFONE_2 = '(63) 3000-0001',
    EMAIL_CONTATO = 'contato@to.gov.br',
    SITE_URL = 'https://www.to.gov.br',
    WHATSAPP = '(63) 99999-9999',
    LOGO_RODAPE_URL = '/assets/logo-rodape.png',
    TEXTO_COPYRIGHT = '© 2024 Governo do Estado do Tocantins. Todos os direitos reservados.',
    ENDERECO_COMPLETO = 'Av. Principal, 123 - Centro - Palmas/TO - CEP: 77000-000'
WHERE ID = 1;

-- =====================================================
-- COMMIT DAS ALTERAÇÕES
-- =====================================================
COMMIT;

-- =====================================================
-- VERIFICAR ESTRUTURA ATUALIZADA
-- =====================================================
PROMPT 'Verificando estrutura atualizada da tabela CONFIGURACOES_GERAL:';
DESC CONFIGURACOES_GERAL;

PROMPT 'Dados atualizados:';
SELECT 
    NOME_INSTITUICAO,
    CIDADE,
    TELEFONE,
    TELEFONE_2,
    EMAIL,
    EMAIL_CONTATO,
    SITE_URL,
    WHATSAPP,
    LOGO_RODAPE_URL,
    TEXTO_COPYRIGHT
FROM CONFIGURACOES_GERAL 
WHERE ATIVO = 'S';

-- =====================================================
-- FINALIZAÇÃO
-- =====================================================
PROMPT 'Tabela CONFIGURACOES_GERAL atualizada com sucesso!';
PROMPT 'Novos campos para dados do rodapé adicionados!';
PROMPT 'Execute o backend para testar as novas funcionalidades.';