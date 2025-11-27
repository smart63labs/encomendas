## Escopo e Regras
- Manter regras de Malote e Lacre como estão.
- Persistir envolvimento de Hub nas encomendas com duas novas colunas:
  - `SETOR_HUB` (SIM/NULL)
  - `SETOR_HUB_ID` (FK para `SETORES(ID)`)
- Na tela 2 do wizard, para usuários logados no Hub (`user.setor_id === HUB_SETOR_ID`), exibir apenas a perna disponível: "Hub → Destinatário".
- Ao escolher a perna, preencher automaticamente "Dados do Destinatário" e "Setor de Destino" e vincular a nova encomenda à anterior (`ENCOMENDA_PAI_ID`).
- Não implementar cenários de devolução/retorno (Hub → Origem).

## Banco (Oracle via SQLCL)
1. Adicionar colunas em `ENCOMENDAS`:
   - `SETOR_HUB` VARCHAR2(3) (valores: `SIM` ou `NULL`).
   - `SETOR_HUB_ID` NUMBER, FK para `SETORES(ID)`.
2. Índice: `IDX_ENCOMENDAS_SETOR_HUB_ID` em `SETOR_HUB_ID`.
3. Migração de dados existentes (opcional): marcar `SETOR_HUB='SIM'` e `SETOR_HUB_ID=<HUB_SETOR_ID>` onde `SETOR_ORIGEM_ID=HUB_SETOR_ID` ou `SETOR_DESTINO_ID=HUB_SETOR_ID`.

## Back-end
- `backend/src/controllers/encomenda.controller.ts` (wizard):
  - Incluir `SETOR_HUB` e `SETOR_HUB_ID` no INSERT dinâmico.
  - Regras:
    - Se origem ou destino for Hub, setar `SETOR_HUB='SIM'` e `SETOR_HUB_ID=HUB_SETOR_ID`.
    - Em rota com duas pernas (Origem → Hub → Destinatário), marcar nas duas pernas.
  - `show/index`: retornar os novos campos ao front.
- `backend/src/models/encomenda.model.ts`:
  - Expandir tipos: `setorHub?: 'SIM'`, `setorHubId?: number`.

## Front-end
- `src/components/encomendas/NovaEncomendaWizard.tsx`:
  - Detectar usuário do Hub: comparar `user.setor_id` com `HUB_SETOR_ID` (já lido de configurações).
  - Tela 2 (Dados do Destinatário):
    - Renderizar bloco “Perna disponível: Hub → Destinatário” com lista de pendências do Hub (já existe lógica para pendências, ampliar a UX para seleção explícita).
    - Ao escolher uma pendência (perna 1 existente), pré-preencher `destinatario`/`destinatarioId` e resolver `setorDestinoData`.
    - Guardar `encomendaPaiId` para o envio.
  - `handleSubmit`:
    - Incluir `setorHub='SIM'` e `setorHubId=HUB_SETOR_ID` quando aplicável.
    - Enviar `encomendaPaiId` ao criar a segunda perna.
  - Exibição: adicionar badge “Via Hub” e nome do Hub onde presente (etiqueta/listagens).

## Validação
- Criar encomendas com e sem Hub e verificar persistência dos novos campos.
- Usuário do Hub no wizard: garantir a seleção da perna “Hub → Destinatário” e vinculação (`ENCOMENDA_PAI_ID`).
- Manter fluxos e regras atuais de Malote/Lacre inalteradas.

## Riscos
- Consistência de dados nas duas pernas: mitigar com transação e validações no controller.
- Performance: avaliar impacto do novo índice e joins.

## Próximo Passo
- Executar migração das colunas via SQLCL.
- Ajustar API e tipos.
- Implementar UX da perna “Hub → Destinatário” na tela 2 do wizard.
- Testar e validar com exemplos reais.

Confirma que seguimos exatamente com esse plano (sem implementar Hub → Origem)?