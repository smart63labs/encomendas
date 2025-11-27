# FLUXO COMPLETO — CICLO DE VIDA DO LACRE NO SISTEMA DE ENCOMENDAS

Este documento descreve, de forma operacional e auditável, todo o ciclo de vida dos lacres no sistema, desde o cadastro dos lotes até o encerramento administrativo (destruição), passando por distribuição, reserva, vinculação e uso em encomendas/malotes.

---

## 1. Cadastro de Lotes de Lacres

- Campos obrigatórios:
  - Prefixo ou nome identificador (ex.: `LACRE`).
  - Faixa numérica (ex.: `1 a 1000`).
- Comportamento do sistema:
  - Gera todos os lacres dessa faixa, com código único por lacre (ex.: `LACRE-0001` … `LACRE-1000`).
  - Cada lacre inicia com:
    - Status: `DISPONÍVEL`.
    - Sem vínculo com setor, encomenda ou malote.
- Objetivo: Registrar no sistema todos os lacres físicos adquiridos.

---

## 2. Distribuição entre Setores

- Estratégias de distribuição:
  - Automática (proporcional entre setores).
  - Manual (quantidades definidas setor a setor).
- Ao distribuir um lacre:
  - Recebe vínculo com o setor de destino.
  - Mantém o status `DISPONÍVEL`.
- Objetivo: Organizar o estoque de lacres por setor.

---

## 3. Consulta de Lacres Disponíveis

- Cada setor visualiza somente seus lacres com status `DISPONÍVEL`.
- Informações exibidas:
  - Código do lacre.
  - Status atual.
  - Setor vinculado.
  - Data de cadastro/distribuição.
- Objetivo: Permitir controle local de estoque antes do uso.

---

## 4. Reserva de Lacre (Opcional em Fluxos Concorrentes)

- Ao iniciar o cadastro de uma nova encomenda/malote, o sistema pode reservar temporariamente um lacre `DISPONÍVEL` do setor.
- Mudança de status: `DISPONÍVEL` → `RESERVADO`.
- Desfechos:
  - Encomenda confirmada: `RESERVADO` → `VINCULADO`.
  - Encomenda cancelada: `RESERVADO` → `DISPONÍVEL`.
- Objetivo: Evitar que dois usuários selecionem o mesmo lacre simultaneamente.

---

## 5. Vinculação de Lacre a Encomenda/Malote

- Ao confirmar a nova encomenda, o lacre escolhido é vinculado.
- Mudança de status (atualizado): `RESERVADO`/`DISPONÍVEL` → `UTILIZADO` (no ato do cadastro da encomenda).
- Registro obrigatório:
  - Encomenda/malote vinculado.
  - Setor responsável.
  - Data/hora do vínculo.
- Objetivo: Garantir rastreabilidade exata entre lacre e envio.

---

## 6. Execução e Conclusão da Encomenda

- Durante o transporte/processamento, o lacre já está marcado como `UTILIZADO` desde o cadastro.
- Ao concluir/entregar/encerrar a encomenda/malote:
  - Não há transição adicional de status para o lacre; ele já está em estado final `UTILIZADO`.
  - O vínculo permanece como histórico (não reutilizável).
- Objetivo: Indicar lacres já usados e impedir qualquer reutilização.

---

## 7. Situações Especiais — Extravio e Danos

- Comunicação: o responsável informa problemas ao administrador antes do uso.
- Status intermediários aplicáveis pelo administrador:

| Situação                         | Novo Status  | Descrição                                                |
|----------------------------------|--------------|----------------------------------------------------------|
| Lacre perdido antes do uso       | `EXTRAVIADO` | Lacre não localizado, fora do controle físico.          |
| Lacre defeituoso ou rasgado      | `DANIFICADO` | Lacre comprometido, não utilizável.                     |

- Objetivo: Controlar perdas e defeitos antes da destruição final.

---

## 8. Destruição de Lacres (Somente Administrador)

- Casos elegíveis:
  - Defeito de fabricação.
  - Dano físico.
  - Extravio confirmado.
  - Erro de numeração ou duplicidade.
- Ao destruir um lacre:
  - Mudança de status: `*` → `DESTRUÍDO` (estado final).
  - Registro obrigatório:
    - Data/hora da destruição.
    - Usuário responsável.
    - Motivo da destruição.
  - Remoção das listagens operacionais (não pode mais ser usado).
- Objetivo: Encerrar formalmente lacres problemáticos e manter rastreabilidade.

---

## 9. Consulta e Auditoria Completa

- Filtros e consultas devem permitir:
  - Por setor.
  - Por status: `DISPONÍVEL`, `RESERVADO`, `VINCULADO`, `UTILIZADO`, `EXTRAVIADO`, `DANIFICADO`, `DESTRUÍDO`.
  - Por faixa numérica.
  - Por encomenda/malote vinculado.
  - Por motivo de destruição.
  - Por datas de criação, uso, extravio ou destruição.
- Objetivo: Rastreabilidade total do ciclo de vida de cada lacre.

---

## 10. Regras de Negócio e Transições Válidas

| Estado Atual  | Próximo Estado Permitido | Ação Disparadora                      |
|---------------|---------------------------|---------------------------------------|
| `DISPONÍVEL`  | `RESERVADO`               | Início de cadastro de encomenda       |
| `DISPONÍVEL`  | `UTILIZADO`               | Vinculação direta sem reserva         |
| `DISPONÍVEL`  | `DANIFICADO`              | Identificação de defeito              |
| `DISPONÍVEL`  | `EXTRAVIADO`              | Perda antes do uso                    |
| `DISPONÍVEL`  | `DESTRUÍDO`               | Eliminação direta pelo administrador  |
| `RESERVADO`   | `UTILIZADO`               | Encomenda confirmada                  |
| `RESERVADO`   | `DISPONÍVEL`              | Encomenda cancelada                   |
| `UTILIZADO`   | —                         | Estado final (somente histórico)      |
| `EXTRAVIADO`  | `DESTRUÍDO`               | Confirmação administrativa            |
| `DANIFICADO`  | `DESTRUÍDO`               | Descarte físico                       |
| `EXTRAVIADO`  | `DESTRUÍDO`               | Confirmação administrativa            |
| `DANIFICADO`  | `DESTRUÍDO`               | Descarte físico                       |
| `DESTRUÍDO`   | —                         | Estado final (somente histórico)      |

- Objetivo: Garantir coerência nos estados e impedir transições inválidas.

---

## 11. Benefícios da Estrutura Estendida de Status

- Maior rastreabilidade: cada evento relevante no ciclo do lacre é identificado e registrado.
- Controle administrativo robusto: falhas, perdas e destruições ficam documentadas.
- Relatórios detalhados: perdas, defeitos e consumo por setor e lote.
- Prevenção de reuso: lacres só são utilizáveis quando realmente `DISPONÍVEIS`.
- Governança e auditoria: histórico completo com data, usuário e motivo em alterações críticas.

---

## 12. Fluxo Resumido de Estados

```
DISPONÍVEL 
   ├──> RESERVADO ───> VINCULADO ───> UTILIZADO 
   │                        │ 
   │                        ├──> EXTRAVIADO ───> DESTRUÍDO 
   │                        └──> DANIFICADO ───> DESTRUÍDO 
   ├──> EXTRAVIADO ───> DESTRUÍDO 
   └──> DANIFICADO ───> DESTRUÍDO
```

---

## Recomendações de Auditoria Técnica (Implementação)

- Para cada lacre, manter trilha de auditoria com:
  - `status_atual`, `historico_status[]` com data/hora, usuário e motivo (quando aplicável).
  - Vínculos: setor, encomenda/malote (com datas de início e fim do vínculo).
  - Eventos críticos: reserva, vinculação, uso, extravio, dano, destruição.
- Restrições de consistência:
  - Proibir quaisquer transições fora da tabela de regras válidas.
  - Bloquear reutilização de lacres com status `UTILIZADO` ou `DESTRUÍDO`.
  - Permitir somente perfis administrativos executarem `DESTRUÍDO`.
- Relatórios sugeridos:
  - Consumo por setor e por período.
  - Perdas (extravio) e danos por lote/setor.
  - Histórico detalhado por lacre.

---

## Glossário de Status

- `DISPONÍVEL`: em estoque, apto para uso.
- `ATRIBUIDO` : etapa onde se atribui o lacre ao setor (antes do uso).
- `RESERVADO`: bloqueado temporariamente durante cadastro da encomenda.
- `VINCULADO`: obsoleto no fluxo atualizado; ao vincular na criação, o lacre muda diretamente para `UTILIZADO`.
- `UTILIZADO`: definido no ato do cadastro da encomenda; consumido/concluído; não reutilizável. Observação Importante: Se tiver esse Status, o lacre não pode ser destruído.
- `EXTRAVIADO`: perda/falta antes ou durante o transporte. Nesse Status, o lacre não pode ser mais usado pelo sistema.
- `DANIFICADO`: defeito ou dano físico; não utilizável. Nesse Status, o lacre não pode ser mais usado pelo sistema.
- `DESTRUÍDO`: encerrado administrativamente; removido das operações. Nesse Status, o lacre não pode ser mais usado pelo sistema.