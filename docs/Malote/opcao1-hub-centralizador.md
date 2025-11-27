# Hub Centralizador — Opção 1 (CONFIGURACOES)

Este documento descreve a implementação da Opção 1 para o Hub Centralizador de malotes/encomendas, utilizando a tabela `CONFIGURACOES` para armazenar o identificador do setor Hub (`HUB_SETOR_ID`) e regras de roteamento no backend.

## Objetivo

- Garantir que toda encomenda cujo setor de origem e setor de destino não sejam o Hub seja enviada ao Hub na primeira perna.
- Quando o destino final for o próprio Hub, a encomenda segue diretamente ao Hub (sem segunda perna).
- Quando a origem for o Hub, a encomenda segue para o destino final normalmente (segunda perna de redistribuição).

## Estrutura de Configuração

- Chave de configuração: `HUB_SETOR_ID` (armazenada em `CONFIGURACOES.CHAVE`).
- Valor: ID numérico do setor que atua como Hub (armazenado em `CONFIGURACOES.VALOR` como `CLOB` com conteúdo numérico).
- Tipo: `NUMBER`.

## Script SQL (SQLCL)

Crie o arquivo abaixo em `docs/ScriptsSQL/malote_hub_config_opcao1_configuracoes.sql` e execute via SQLCL com as credenciais fornecidas.

> Observação: não usar `sqlplus`. Sempre utilizar SQLCL.

### Execução (exemplo)

```
sqlcl protocolo_user/Anderline49@localhost:1521/FREEPDB1 @docs\ScriptsSQL\malote_hub_config_opcao1_configuracoes.sql
```

## Alterações no Backend

- Controlador: `backend/src/controllers/encomenda.controller.ts`
- Novidades:
  - Método auxiliar `getHubSetorId()` que lê `HUB_SETOR_ID` da tabela `CONFIGURACOES`.
  - Ajuste de regra em `storeFromWizard` e `store`:
    - Se origem ≠ Hub e destino ≠ Hub, redirecionar destino para o Hub.
    - Se destino = Hub, manter (Hub é destino final).
    - Se origem = Hub, manter destino informado (segunda perna).

## Fluxo Operacional

- Exemplo: Origem 171, Destino 169, `HUB_SETOR_ID = <ID_DO_HUB>`.
  - Primeira perna: destino ajustado para `<ID_DO_HUB>` (Hub).
  - Segunda perna: criada pelo operador do Hub (origem `<ID_DO_HUB>`, destino 169).
- Exemplo: Origem 171, Destino `<ID_DO_HUB>` (Hub) → segue direto ao Hub.
- Exemplo: Origem `<ID_DO_HUB>` (Hub), Destino 169 → segunda perna de redistribuição.

## Validação

- Consultar `CONFIGURACOES` para confirmar a chave `HUB_SETOR_ID`:
  - `SELECT CHAVE, TO_NUMBER(DBMS_LOB.SUBSTR(VALOR, 100)) AS HUB_SETOR_ID FROM CONFIGURACOES WHERE CHAVE = 'HUB_SETOR_ID';`
- Criar uma encomenda onde nem a origem nem o destino sejam o Hub e confirmar que o destino é ajustado ao Hub.
- Criar uma encomenda com destino igual ao Hub e confirmar que não há ajuste adicional.

## Observações Importantes

- Não executar `npm run dev` após a correção e não abrir o preview.
- Nenhuma alteração de layout/UI foi realizada.
 - O `HUB_SETOR_ID` deve ser configurado pelo usuário e deve corresponder ao mesmo setor utilizado como origem (`SETOR_ORIGEM_ID`) quando o Hub cria o malote.