# Regra de disponibilidade de malote e tabela de eventos de encomendas

## Objetivo
- Registrar cada movimentação de malotes associadas às encomendas, com status e contexto (setor, usuário, data/hora).
- Definir uma regra única de disponibilidade de malote (Filtro 1 e 2) que elimina a necessidade de identificar um “Setor HUB”.

## Nova Tabela: ENCOMENDAS_EVENTOS
- Finalidade: log de eventos por encomenda/malote.
- Colunas:
  - `ID NUMBER` (PK, identity) — identificador único do evento.
  - `ENCOMENDA_ID NUMBER NOT NULL` — referência à encomenda (`ENCOMENDAS.ID`).
  - `MALOTE_ID NUMBER NOT NULL` — referência ao malote (idealmente `MALOTES.ID`).
  - `SETOR_ID NUMBER NOT NULL` — setor que recebeu/está com o malote (idealmente `SETORES.ID`).
  - `USUARIO_ID NUMBER NOT NULL` — usuário que recebeu/está com o malote (idealmente `USUARIOS.ID`).
  - `STATUS_ENTREGA VARCHAR2(20)` — valores permitidos: `Entregue` / `EmTransito`.
  - `STATUS_ENTREGUE VARCHAR2(3)` — valores permitidos: `Sim` / `Não`.
  - `DATA_EVENTO TIMESTAMP(6) NOT NULL` — data/hora do evento (padrão `SYSTIMESTAMP`).

- Integridade:
  - `PK_ENCOMENDAS_EVENTOS` em `ID`.
  - `CK_ENC_EVT_STATUS_ENTREGA` limita a `Entregue` / `EmTransito`.
  - `CK_ENC_EVT_STATUS_ENTREGUE` limita a `Sim` / `Não`.
  - `FK_ENC_EVT_ENCOMENDA` para `ENCOMENDAS(ID)`.
  - Recomenda-se FKs para entidades de origem: `MALOTES(ID)`, `SETORES(ID)`, `USUARIOS(ID)`.

## Filtro 1 e 2 (Regra de disponibilidade)
- Filtro 1: `STATUS_ENTREGA` em `('Entregue','EmTransito')`.
- Filtro 2: `STATUS_ENTREGUE` em `('Sim','Não')`.

- Disponível para cadastro de nova encomenda quando:
  - `STATUS_ENTREGA = 'Entregue'` e `STATUS_ENTREGUE = 'Sim'`.
  - O malote aparece para o `SETOR_ID` correspondente (e, pela regra, é detectável no HUB sem tratativa especial).

- Em trânsito quando:
  - Qualquer combinação diferente de `Entregue/Sim`, isto é: `EmTransito/Não` (ao criar a encomenda) ou estados intermediários.
  - Neste caso, o malote não deve aparecer no modal “malote + lacre” (comportamento já implementado).

## Preenchimento automático (ao cadastrar a encomenda)
- Trigger `AFTER INSERT` em `ENCOMENDAS` grava um evento em `ENCOMENDAS_EVENTOS` com:
  - `ENCOMENDA_ID = :NEW.ID`.
  - `MALOTE_ID = :NEW.MALOTE_ID`.
  - `SETOR_ID = :NEW.SETOR_DESTINO_ID`.
  - `USUARIO_ID = :NEW.USUARIO_DESTINO_ID`.
  - `STATUS_ENTREGA = 'EmTransito'` e `STATUS_ENTREGUE = 'Não'`.
  - `DATA_EVENTO = SYSTIMESTAMP`.

> Observação operacional: o trigger grava o evento somente quando `MALOTE_ID`, `SETOR_DESTINO_ID` e `USUARIO_DESTINO_ID` estão definidos na encomenda. Caso a encomenda seja criada sem malote, nenhum evento é gerado até que o vínculo seja concluído.

> Observação: Se os campos de status já existirem em `ENCOMENDAS`, eles devem refletir esta mesma regra. Caso não existam, a visão abaixo garante a leitura correta da disponibilidade sem mudar a UI.

## Consulta de disponibilidade
- Criar uma visão `MALOTES_DISPONIVEIS` baseada no último evento por `MALOTE_ID`:
  - Seleciona somente registros com `STATUS_ENTREGA = 'Entregue'` e `STATUS_ENTREGUE = 'Sim'`.
  - A visão fornece o `SETOR_ID` atual do malote e a última data de evento.

## Scripts SQL (Docs/ScriptsSQL)
- `001_create_encomendas_eventos.sql`: cria a tabela, checks, PK, FKs e índices.
- `002_trigger_encomendas_eventos.sql`: cria a trigger de preenchimento automático ao inserir em `ENCOMENDAS`.
- `003_view_malotes_disponiveis.sql`: cria a visão que materializa o Filtro 1/2.

## Impactos esperados
- Backend (cadastro de encomenda): ao criar, a trigger grava o evento como `EmTransito/Não`.
- Frontend (modal malote + lacre): continua filtrando; malotes em trânsito não aparecem.
- Operação: o “Setor HUB” não precisa ser marcado manualmente; a disponibilidade é inferida pela regra do último evento.

## Plano de implantação (via MCP SQLCL)
1. Conectar ao banco com a conexão salva do `protocolo_user` (FREEPDB1).
2. Executar os scripts em ordem: 001, 002, 003.
3. Validar que a visão `MALOTES_DISPONIVEIS` retorna os malotes esperados após registrar movimentações.

## Observações
- Ajuste nomes de tabelas para FKs conforme o esquema real (`MALOTES`, `SETORES`, `USUARIOS`).
- Caso os FKs não sejam possíveis (colunas alvo não são únicas), mantenha apenas CHECKs e PK e use a visão para garantir a regra.
- Nenhuma mudança de layout/UI é necessária; a regra é aplicada no nível de dados.

## FKs lógicas conforme ENCOMENDAS
- Conforme solicitado, os campos em `ENCOMENDAS_EVENTOS` seguem a referência às colunas de `ENCOMENDAS`:
  - `ENCOMENDA_ID` → `ENCOMENDAS.ID` (FK real criada).
  - `MALOTE_ID` → `ENCOMENDAS.MALOTE_ID`.
  - `SETOR_ID` → `ENCOMENDAS.SETOR_DESTINO_ID`.
  - `USUARIO_ID` → `ENCOMENDAS.USUARIO_DESTINO_ID`.
- Como Oracle exige PK/Unique na coluna alvo para FKs reais, `MALOTE_ID`, `SETOR_DESTINO_ID` e `USUARIO_DESTINO_ID` são validados por trigger (`TRG_ENC_EVT_BI_VALIDA_FKS`) em `ENCOMENDAS_EVENTOS`, garantindo que os valores correspondam à encomenda indicada em `ENCOMENDA_ID`.
- Script correspondente: `docs/ScriptsSQL/004_triggers_fk_logicas.sql`.