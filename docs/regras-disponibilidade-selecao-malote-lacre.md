Regras de Disponibilidade no Modal de Seleção de Malote e Lacre

**Objetivo**
- Documentar quando um Malote ou um Lacre devem aparecer no modal e quando podem ser selecionados ou devem ficar bloqueados.

**Conceitos**
- `Encomendas`: registro da movimentação sendo cadastrada.
- `Malote`: recipiente ao qual a encomenda pode ser vinculada.
- `Lacre`: etiqueta/código utilizado na encomenda.
- `SETOR_ORIGEM_ID`: setor de onde a encomenda parte (na tabela `ENCOMENDAS`).
- `ENCOMENDAS_EVENTOS`: tabela que registra os eventos de movimentação de cada encomenda.

**Fontes de Dados e Colunas**
- Malote: disponibilidade determinada pelo último evento relevante na tabela `ENCOMENDAS_EVENTOS` para a encomenda vinculada ao malote.
  - Colunas usadas: `SETOR_ID`, `STATUS_ENTREGA`, `STATUS_ENTREGUE`.
- Lacre: disponibilidade determinada pela própria tabela `LACRE`.
  - Colunas usadas: `SETOR_ID`, `STATUS`.

**Regra de Malote**
- Indisponível para seleção:
  - Quando em `ENCOMENDAS_EVENTOS` existir evento cujo `SETOR_ID` seja IGUAL ao `SETOR_ORIGEM_ID` da `ENCOMENDAS` relacionada ao malote,
  - E `STATUS_ENTREGA = "EmTransito"`,
  - E `STATUS_ENTREGUE = "Não"`.
- Disponível para seleção:
  - Quando em `ENCOMENDAS_EVENTOS` existir evento cujo `SETOR_ID` seja IGUAL ao `SETOR_ORIGEM_ID` da `ENCOMENDAS` relacionada ao malote,
  - E `STATUS_ENTREGA = "Entregue"`,
  - E `STATUS_ENTREGUE = "Sim"`.
- Listagem no modal:
  - Em ambos os casos (disponível ou indisponível) o Malote DEVE aparecer na lista do modal.
  - O botão de ação deve ficar bloqueado quando “Indisponível” e liberado quando “Disponível”.

**Regra de Lacre**
- Indisponível para seleção:
  - Quando na tabela `LACRE` o `SETOR_ID` for IGUAL ao `SETOR_ORIGEM_ID` da `ENCOMENDAS`.
  - E quando na tabela `LACRE` o `STATUS = "utilizado"`.
- Disponível para seleção:
  - Não existe regra que torne lacres com `STATUS = "utilizado"` disponíveis novamente.
- Listagem no modal:
  - O lacre DEVE aparecer no modal (mesmo quando “utilizado”).
  - O botão de ação deve ficar bloqueado para lacres com `STATUS = "utilizado"` e liberado para demais status.

**Comportamento do Modal**
- Malotes:
  - A lista exibe todos os malotes pertencentes ao setor de destino informado.
  - A habilitação do botão “Escolher” depende da regra de evento (disponível/indisponível) definida acima.
- Lacres:
  - A lista exibe lacres do setor de origem.
  - A habilitação do botão “Escolher” depende do `STATUS` do lacre (bloqueado quando “utilizado”).

**Normalização de Valores (boas práticas)**
- Recomenda-se tratar valores com tolerância a variações comuns:
  - Espaços e maiúsculas/minúsculas: aplicar `trim` e comparação case-insensitive.
  - Equivalências de confirmação de entrega: tratar "Sim" e equivalentes comuns (ex.: "S", "Yes", "Y", "True", "T", "1").
  - Equivalências de não entregue: tratar "Não" e equivalentes comuns (ex.: "N", "No", "False", "F", "0").
  - Entrega em trânsito: aceitar variações como "EmTransito", "Em Trânsito", "Em transito".

**Exemplos de Interpretação**
- Malote com último evento: `SETOR_ID = SETOR_ORIGEM_ID`, `STATUS_ENTREGA = Entregue`, `STATUS_ENTREGUE = Sim` ⇒ Disponível (botão habilitado).
- Malote com último evento: `SETOR_ID = SETOR_ORIGEM_ID`, `STATUS_ENTREGA = EmTransito`, `STATUS_ENTREGUE = Não` ⇒ Indisponível (botão bloqueado).
- Lacre com `STATUS = utilizado` ⇒ aparece na lista, mas não pode ser selecionado.

**Notas de Implementação**
- A listagem deve sempre mostrar todos os malotes do setor, aplicando a regra acima apenas para habilitar/bloquear a seleção.
- A listagem de lacres deve mostrar todos os lacres do setor de origem, bloqueando a seleção apenas quando `STATUS = utilizado`.
- Nenhuma alteração de layout deve ser feita ao aplicar estas regras.

**Auditoria e Diagnóstico (opcional)**
- Para verificar rapidamente a situação de um malote, consultar o último evento em `ENCOMENDAS_EVENTOS` vinculado à encomenda do malote e comparar com `SETOR_ORIGEM_ID`.
- Para lacres, consultar diretamente `LACRE.STATUS` e `LACRE.SETOR_ID` em relação ao `SETOR_ORIGEM_ID`.

Este documento consolida as regras funcionais para consulta futura e alinhamento entre as equipes de desenvolvimento e operação.