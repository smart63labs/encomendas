# Análise dos Vínculos: Encomendas, Lacre e Malote (Oracle/SQLcl)

Este documento registra o diagnóstico do banco de dados quanto aos vínculos necessários entre as entidades ENCOMENDAS, LACRE e MALOTE, incluindo recomendações de ajustes (DDL) e scripts de verificação via SQLcl.

## Objetivo
- Incluir o ID do lacre e o ID do malote diretamente no cadastro de `ENCOMENDAS`.
- Garantir que estes vínculos estejam relacionados ao setor do remetente escolhido na tela “Nova Encomenda” (consistência com `SETOR_ORIGEM_ID`).

## Diagnóstico (SQLcl)
Consultas executadas via SQLcl para o schema `protocolo_user@FREEPDB1`:
- Tabelas detectadas: `ENCOMENDAS`, `LACRE`, `MALOTE`, `SETORES`.
- ENCOMENDAS (colunas de vínculo):
  - `SETOR_ORIGEM_ID`, `SETOR_DESTINO_ID`, `USUARIO_ORIGEM_ID`, `USUARIO_DESTINO_ID`, `CODIGO_LACRE_MALOTE` (texto).
  - Ausência: `LACRE_ID` e `MALOTE_ID` não existem.
  - Não há FKs registradas em `ENCOMENDAS` (nenhuma restrição do tipo R).
- LACRE:
  - PK: `ID`.
  - Colunas: `SETOR_ID` (setor do lacre), `ENCOMENDA_ID` (vínculo do lacre para uma encomenda, opcional), etc.
- MALOTE:
  - PK: `ID`.
  - Colunas relevantes: `SETOR_ORIGEM_ID` (NOT NULL), `SETOR_DESTINO_ID`, `CEP_ORIGEM`, `CEP_DESTINO`, dados de contrato.

### Conclusão do diagnóstico
- O schema atual não contempla os campos de ID (`LACRE_ID`, `MALOTE_ID`) dentro de `ENCOMENDAS`, nem FKs para `LACRE`/`MALOTE`.
- `CODIGO_LACRE_MALOTE` (texto) não assegura integridade referencial.
- A relação com o setor do remetente é parcialmente suportada por `ENCOMENDAS.SETOR_ORIGEM_ID`, `LACRE.SETOR_ID` e `MALOTE.SETOR_ORIGEM_ID`, mas falta amarração e validação cruzada via FKs e (opcionalmente) trigger.

## Recomendações de DDL
Para garantir rastreabilidade e integridade:
1. Adicionar colunas de ID a `ENCOMENDAS`:
   - `ALTER TABLE ENCOMENDAS ADD LACRE_ID NUMBER;`
   - `ALTER TABLE ENCOMENDAS ADD MALOTE_ID NUMBER;`
2. Criar FKs:
   - `ALTER TABLE ENCOMENDAS ADD CONSTRAINT FK_ENCOMENDAS_LACRE FOREIGN KEY (LACRE_ID) REFERENCES LACRE(ID);`
   - `ALTER TABLE ENCOMENDAS ADD CONSTRAINT FK_ENCOMENDAS_MALOTE FOREIGN KEY (MALOTE_ID) REFERENCES MALOTE(ID);`
3. Regras de consistência com setor do remetente (aplicação e/ou trigger):
   - `ENCOMENDAS.SETOR_ORIGEM_ID = LACRE.SETOR_ID` do lacre selecionado.
   - `ENCOMENDAS.SETOR_ORIGEM_ID = MALOTE.SETOR_ORIGEM_ID` do malote selecionado.

Observação: Caso precise reforço no banco, uma trigger `BEFORE INSERT/UPDATE` em `ENCOMENDAS` pode validar estas consistências e impedir gravações incoerentes.

## Scripts disponíveis (Docs/ScriptsSQL)
- `analisar_vinculos_encomendas.sql`: verifica tabelas, colunas e FKs de `ENCOMENDAS`, `LACRE` e `MALOTE`.
- `describe_lacre.sql`: estrutura e PK da tabela `LACRE`.
- `describe_malote.sql`: estrutura e PK da tabela `MALOTE`.
- `list_tables_lacre.sql`: lista tabelas que contenham “LACRE” no nome.
- `validate_malote_vs_setores.sql`: valida CEPs de `MALOTE` versus `SETORES` pelos FKs de origem/destino.

Se necessário, podemos fornecer um script `add_fk_encomendas_lacre_malote.sql` com as instruções DDL recomendadas acima.

## Execução via SQLcl
Exemplos de execução (Windows, pasta do projeto):
```
sqlcl protocolo_user/Anderline49@localhost:1521/FREEPDB1 @docs/ScriptsSQL/analisar_vinculos_encomendas.sql
sqlcl protocolo_user/Anderline49@localhost:1521/FREEPDB1 @docs/ScriptsSQL/describe_lacre.sql
sqlcl protocolo_user/Anderline49@localhost:1521/FREEPDB1 @docs/ScriptsSQL/describe_malote.sql
```

## Validações pós-implementação
- Confirmar presença de `LACRE_ID` e `MALOTE_ID` em `ENCOMENDAS` e FKs ativas.
- Validar que novos cadastros na tela “Nova Encomenda” preenchem:
  - `ENCOMENDAS.LACRE_ID` com um lacre cujo `SETOR_ID = ENCOMENDAS.SETOR_ORIGEM_ID`.
  - `ENCOMENDAS.MALOTE_ID` com um malote cujo `SETOR_ORIGEM_ID = ENCOMENDAS.SETOR_ORIGEM_ID`.
- Auditar registros com joins:
```
SELECT e.ID, e.SETOR_ORIGEM_ID, e.LACRE_ID, l.SETOR_ID AS LACRE_SETOR,
       e.MALOTE_ID, m.SETOR_ORIGEM_ID AS MALOTE_SETOR
FROM ENCOMENDAS e
LEFT JOIN LACRE l ON l.ID = e.LACRE_ID
LEFT JOIN MALOTE m ON m.ID = e.MALOTE_ID
FETCH FIRST 50 ROWS ONLY;
```

## Próximos passos
- Aprovar as alterações de DDL recomendadas.
- Após aplicar DDL, adaptar a API e a tela “Nova Encomenda” para enviar/armazenar `LACRE_ID` e `MALOTE_ID` conforme as regras de setor.
- Executar os scripts de validação para garantir integridade e consistência.