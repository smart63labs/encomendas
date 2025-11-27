## Objetivo
- Executar `backend/sql/fix_malote_status_triggers.sql` via MCP SqlCL, validar que o STATUS do MALOTE muda automaticamente conforme vínculo/entrega de encomendas e confirmar que a regra de disponibilidade ignora o setor.

## Banco de Dados (MCP SqlCL)
- Conexão: `protocolo_user/Anderline49@localhost:1521/FREEPDB1`.
- Passos:
  1. Rodar `fix_malote_status_triggers.sql`.
  2. Rodar `debug_malote_status.sql` para verificar triggers e estados.
  3. Validar idempotência: scripts checam/reativam/atualizam triggers sem duplicar.

## Backend
- Confirmar que `backend/src/controllers/encomenda.controller.ts` não atualiza manualmente `MALOTE.STATUS` (apenas cria vínculo); triggers assumem a responsabilidade.
- Confirmar correções de queries em `backend/src/controllers/malote.controller.ts` para disponibilidade sem filtro por setor.

## Frontend
- Validar os `useEffect` do `src/components/encomendas/SelectLacreMaloteModal.tsx` para persistência correta entre aberturas.

## Validação Funcional
- Cenários:
  - Vincular encomenda a um malote: STATUS muda para "Em transito".
  - Receber encomenda: `ENCOMENDA_ID = NULL` e STATUS muda para "Disponivel".
  - Checagem de indisponibilidade: qualquer encomenda "em_transito" torna o malote indisponível (sem considerar setor).

## Entregáveis
- Execução dos scripts via MCP SqlCL com logs de sucesso.
- Evidências via consultas do `debug_malote_status.sql` e comportamentos observados.

## Próximo Passo
- Com sua confirmação, executo os scripts no banco via MCP SqlCL e reporto os resultados. Após isso, posso avançar na vinculação entre as duas encomendas (remetente→hub e hub→destinatário) usando um campo `ENCOMENDA_PAI_ID` em `ENCOMENDAS` conforme necessário.