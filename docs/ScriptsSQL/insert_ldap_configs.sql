-- Script para inserir configurações LDAP no banco de dados
-- Conectar como: protocolo_user/Anderline49@localhost:1521/FREEPDB1

-- Inserir configurações LDAP na tabela CONFIGURACOES
INSERT INTO CONFIGURACOES (CATEGORIA, CHAVE, VALOR, TIPO, DESCRICAO, OBRIGATORIA, EDITAVEL, ORDEM_EXIBICAO, ATIVO) VALUES 
('ldap', 'ldapAtivo', 'false', 'boolean', 'Ativar autenticação LDAP', 0, 1, 1, 1);

INSERT INTO CONFIGURACOES (CATEGORIA, CHAVE, VALOR, TIPO, DESCRICAO, OBRIGATORIA, EDITAVEL, ORDEM_EXIBICAO, ATIVO) VALUES 
('ldap', 'servidor', '', 'string', 'Servidor LDAP', 0, 1, 2, 1);

INSERT INTO CONFIGURACOES (CATEGORIA, CHAVE, VALOR, TIPO, DESCRICAO, OBRIGATORIA, EDITAVEL, ORDEM_EXIBICAO, ATIVO) VALUES 
('ldap', 'porta', '389', 'number', 'Porta do servidor LDAP', 0, 1, 3, 1);

INSERT INTO CONFIGURACOES (CATEGORIA, CHAVE, VALOR, TIPO, DESCRICAO, OBRIGATORIA, EDITAVEL, ORDEM_EXIBICAO, ATIVO) VALUES 
('ldap', 'baseDN', '', 'string', 'Base DN para busca', 0, 1, 4, 1);

INSERT INTO CONFIGURACOES (CATEGORIA, CHAVE, VALOR, TIPO, DESCRICAO, OBRIGATORIA, EDITAVEL, ORDEM_EXIBICAO, ATIVO) VALUES 
('ldap', 'filtroConexao', '(uid={username})', 'string', 'Filtro de conexão LDAP', 0, 1, 5, 1);

INSERT INTO CONFIGURACOES (CATEGORIA, CHAVE, VALOR, TIPO, DESCRICAO, OBRIGATORIA, EDITAVEL, ORDEM_EXIBICAO, ATIVO) VALUES 
('ldap', 'usarBind', 'false', 'boolean', 'Usar bind para autenticação', 0, 1, 6, 1);

INSERT INTO CONFIGURACOES (CATEGORIA, CHAVE, VALOR, TIPO, DESCRICAO, OBRIGATORIA, EDITAVEL, ORDEM_EXIBICAO, ATIVO) VALUES 
('ldap', 'rootDN', '', 'string', 'DN do usuário administrativo', 0, 1, 7, 1);

INSERT INTO CONFIGURACOES (CATEGORIA, CHAVE, VALOR, TIPO, DESCRICAO, OBRIGATORIA, EDITAVEL, ORDEM_EXIBICAO, ATIVO) VALUES 
('ldap', 'senhaRootDN', '', 'string', 'Senha do usuário administrativo', 0, 1, 8, 1);

INSERT INTO CONFIGURACOES (CATEGORIA, CHAVE, VALOR, TIPO, DESCRICAO, OBRIGATORIA, EDITAVEL, ORDEM_EXIBICAO, ATIVO) VALUES 
('ldap', 'campoLogin', 'uid', 'string', 'Campo usado para login', 0, 1, 9, 1);

INSERT INTO CONFIGURACOES (CATEGORIA, CHAVE, VALOR, TIPO, DESCRICAO, OBRIGATORIA, EDITAVEL, ORDEM_EXIBICAO, ATIVO) VALUES 
('ldap', 'nomeServidor', '', 'string', 'Nome do servidor LDAP', 0, 1, 10, 1);

INSERT INTO CONFIGURACOES (CATEGORIA, CHAVE, VALOR, TIPO, DESCRICAO, OBRIGATORIA, EDITAVEL, ORDEM_EXIBICAO, ATIVO) VALUES 
('ldap', 'servidorPadrao', 'false', 'boolean', 'Usar como servidor padrão', 0, 1, 11, 1);

-- Confirmar as inserções
COMMIT;

-- Verificar se os registros foram inseridos corretamente
SELECT * FROM CONFIGURACOES WHERE CATEGORIA = 'ldap' ORDER BY ORDEM_EXIBICAO;