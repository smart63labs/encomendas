-- Criação da tabela ENCOMENDAS para sistema de encomendas
-- Com vinculação de usuários remetente/destinatário e setores origem/destino

CREATE TABLE IF NOT EXISTS ENCOMENDAS (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    NUMERO_ENCOMENDA VARCHAR(50) UNIQUE NOT NULL, -- Número único da encomenda
    
    -- Dados do Remetente
    REMETENTE_ID INTEGER NOT NULL, -- FK para tabela USUARIOS
    REMETENTE_NOME VARCHAR(200) NOT NULL, -- Nome do remetente (desnormalizado para performance)
    SETOR_ORIGEM_ID INTEGER NOT NULL, -- FK para tabela SETORES
    SETOR_ORIGEM_NOME VARCHAR(200) NOT NULL, -- Nome do setor origem (desnormalizado)
    
    -- Dados do Destinatário
    DESTINATARIO_ID INTEGER, -- FK para tabela USUARIOS (pode ser NULL se destinatário externo)
    DESTINATARIO_NOME VARCHAR(200) NOT NULL, -- Nome do destinatário
    SETOR_DESTINO_ID INTEGER, -- FK para tabela SETORES (pode ser NULL se externo)
    SETOR_DESTINO_NOME VARCHAR(200), -- Nome do setor destino
    
    -- Dados da Encomenda
    DESCRICAO TEXT NOT NULL, -- Descrição da encomenda
    OBSERVACOES TEXT, -- Observações adicionais
    PESO DECIMAL(10,3), -- Peso em kg
    VALOR_DECLARADO DECIMAL(15,2), -- Valor declarado
    
    -- Status e Controle
    STATUS VARCHAR(50) DEFAULT 'PENDENTE', -- PENDENTE, EM_TRANSITO, ENTREGUE, DEVOLVIDA
    DATA_ENVIO DATETIME NOT NULL,
    DATA_ENTREGA DATETIME,
    DATA_PRAZO DATETIME, -- Prazo para entrega
    
    -- Auditoria
    CREATED_BY INTEGER NOT NULL, -- Usuário que criou o registro
    CREATED_AT DATETIME DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Chaves estrangeiras
    FOREIGN KEY (REMETENTE_ID) REFERENCES USUARIOS(ID),
    FOREIGN KEY (DESTINATARIO_ID) REFERENCES USUARIOS(ID),
    FOREIGN KEY (SETOR_ORIGEM_ID) REFERENCES SETORES(ID),
    FOREIGN KEY (SETOR_DESTINO_ID) REFERENCES SETORES(ID),
    FOREIGN KEY (CREATED_BY) REFERENCES USUARIOS(ID)
);

-- Índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_encomendas_numero ON ENCOMENDAS(NUMERO_ENCOMENDA);
CREATE INDEX IF NOT EXISTS idx_encomendas_remetente ON ENCOMENDAS(REMETENTE_ID);
CREATE INDEX IF NOT EXISTS idx_encomendas_destinatario ON ENCOMENDAS(DESTINATARIO_ID);
CREATE INDEX IF NOT EXISTS idx_encomendas_setor_origem ON ENCOMENDAS(SETOR_ORIGEM_ID);
CREATE INDEX IF NOT EXISTS idx_encomendas_setor_destino ON ENCOMENDAS(SETOR_DESTINO_ID);
CREATE INDEX IF NOT EXISTS idx_encomendas_status ON ENCOMENDAS(STATUS);
CREATE INDEX IF NOT EXISTS idx_encomendas_data_envio ON ENCOMENDAS(DATA_ENVIO);
CREATE INDEX IF NOT EXISTS idx_encomendas_data_entrega ON ENCOMENDAS(DATA_ENTREGA);
CREATE INDEX IF NOT EXISTS idx_encomendas_created_by ON ENCOMENDAS(CREATED_BY);

-- Trigger para atualizar UPDATED_AT automaticamente
CREATE TRIGGER IF NOT EXISTS update_encomendas_timestamp 
    AFTER UPDATE ON ENCOMENDAS
    FOR EACH ROW
BEGIN
    UPDATE ENCOMENDAS SET UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = NEW.ID;
END;

-- Trigger para gerar número da encomenda automaticamente
CREATE TRIGGER IF NOT EXISTS generate_numero_encomenda
    AFTER INSERT ON ENCOMENDAS
    FOR EACH ROW
    WHEN NEW.NUMERO_ENCOMENDA IS NULL OR NEW.NUMERO_ENCOMENDA = ''
BEGIN
    UPDATE ENCOMENDAS 
    SET NUMERO_ENCOMENDA = 'ENC' || strftime('%Y', 'now') || '-' || printf('%06d', NEW.ID)
    WHERE ID = NEW.ID;
END;