## Objetivo

* Aplicar a correção dos triggers de MALOTE usando exclusivamente o MCP SqlCL e validar o comportamento de disponibilidade e atualização de STATUS conforme as regras definidas.

## Conexão (MCP SqlCL)

* Credenciais: `protocolo_user/Anderline49@localhost:1521/FREEPDB1`.

* Schema: usar o schema padrão do usuário `protocolo_user`.

## Execução de Scripts

* Rodar `backend/sql/fix_malote_status_triggers.sql` para corrigir/reativar os triggers responsáveis por `MALOTE.STATUS`.

* Rodar `backend/sql/debug_malote_status.sql` para inspeção e validação pós-execução (consultas de estado, triggers ativos, amostras de malotes).

* Idempotência: os scripts serão executados com checagens para evitar duplicações; se os objetos já existirem, apenas serão atualizados/reativados.

## Validações Funcionais

* Vincular encomenda a malote → STATUS muda para "Em transito".

* Receber encomenda → limpa `ENCOMENDA_ID` no malote e STATUS muda para "Disponivel".

* Disponibilidade: ignorar setor; qualquer encomenda "em\_transito" vinculada torna o malote indisponível.

## Verificações de Código (somente leitura)

* Confirmar que `backend/src/controllers/encomenda.controller.ts` não altera `MALOTE.STATUS` manualmente.

* Confirmar que `backend/src/controllers/malote.controller.ts` usa consultas sem filtro por setor para disponibilidade.

* Confirmar que `src/components/encomendas/SelectLacreMaloteModal.tsx` mantém estado adequado entre aberturas via `useEffect`.

## Entregáveis

* Resultado das execuções via MCP SqlCL (mensagens de sucesso/erro).

* Evidências via consultas do script de debug demonstrando o comportamento esperado.

## Próximo Passo (opcional)

* Após confirmar os triggers, posso avançar na vinculação de encomendas da rota hub (remetente→hub e hub→destinatário) persistindo o vínculo em `ENCOMENDAS` conforme necessidade.

