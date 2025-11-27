-- Script: Remoção da tabela ENCOMENDAS_EVENTOS
-- Objetivo: eliminar dependências de eventos e consolidar regras em ENCOMENDAS
-- Observação: execute via SQLcl com as credenciais fornecidas

-- Verifica existência e remove a tabela com segurança
BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE ENCOMENDAS_EVENTOS CASCADE CONSTRAINTS';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -942 THEN
      NULL; -- Tabela não existe, nada a fazer
    ELSE
      RAISE; -- Propaga outros erros
    END IF;
END;
/

-- Opcional: remover sequências, índices ou sinônimos se existirem
BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_ENCOMENDAS_EVENTOS';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -2289 THEN
      NULL; -- Sequência não existe
    ELSE
      RAISE;
    END IF;
END;
/

-- Fim do script