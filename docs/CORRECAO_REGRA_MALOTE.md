# Correção da Regra de Disponibilidade de Malotes

## Data: 13/11/2025

## Problemas Identificados

### 1. Problema de Persistência da Regra no Modal
**Sintoma**: Ao abrir o modal "Selecionar Malote e Lacre", às vezes a regra não era mostrada corretamente. Ao fechar e reabrir o modal, a regra era exibida corretamente.

**Causa**: O `useEffect` estava recarregando os dados de forma inconsistente, causando condições de corrida entre múltiplas chamadas de API.

**Solução**: 
- Modificado o `useEffect` para limpar os dados ao fechar o modal
- Garantido que os dados sejam recarregados apenas uma vez ao abrir o modal
- Evitado recarregamentos desnecessários quando o passo muda

### 2. Problema na Verificação de Status "em_transito"
**Sintoma**: Malotes com encomendas em status "em_transito" estavam sendo mostrados como disponíveis para seleção.

**Causa**: A query SQL no backend estava verificando apenas encomendas do setor específico (`${colEncomenda} = :setorId`), mas segundo a regra de negócio, um malote deve estar indisponível se existe QUALQUER encomenda vinculada a ele com status "em_transito", independentemente do setor.

**Solução**:
- Removida a verificação de setor na subquery que verifica o status da encomenda
- A query agora verifica se existe QUALQUER encomenda vinculada ao malote com status em trânsito
- Adicionadas mais variações de status para cobrir todos os casos: 'EM_TRANSITO', 'EM_TRÂNSITO', 'EMTRANSITO', 'EM TRANSITO', 'EM TRÂNSITO', 'POSTADO', 'TRANSITO', 'TRÂNSITO'

## Regra de Negócio Correta

### Malote Disponível
Um malote está **DISPONÍVEL** quando:
- NÃO existe nenhuma encomenda vinculada a ele com STATUS = 'em_transito' (ou variações)
- OU a encomenda vinculada tem STATUS = 'entregue'
- OU não há encomenda vinculada (ENCOMENDA_ID = NULL)

### Malote Indisponível
Um malote está **INDISPONÍVEL** quando:
- Existe QUALQUER encomenda vinculada a ele (através de ENCOMENDAS.MALOTE_ID) com STATUS = 'em_transito' (ou variações)
- Independentemente do setor de origem ou destino da encomenda

### Importante
- A verificação de disponibilidade NÃO deve considerar o setor da encomenda
- Um malote em trânsito para qualquer setor deve estar indisponível para todos os setores
- O malote só volta a ficar disponível quando a encomenda vinculada for entregue (STATUS = 'entregue')

## Arquivos Modificados

### Backend
1. `backend/src/controllers/malote.controller.ts`
   - Método `availableByEvents()`: Removida verificação de setor na subquery de encomendas
   - Método `statusByEvents()`: Removida verificação de setor na subquery de encomendas
   - Adicionadas mais variações de status para cobrir todos os casos
   - Adicionado campo ENCOMENDA_ID no SELECT para debug

### Frontend
2. `src/components/encomendas/SelectLacreMaloteModal.tsx`
   - Corrigido `useEffect` para evitar recarregamentos desnecessários
   - Adicionados logs de debug para rastreamento
   - Garantida limpeza de dados ao fechar o modal

### Documentação
3. `backend/sql/debug_malote_status.sql`
   - Criado script SQL para debug e verificação do status dos malotes
   - Permite verificar o status real dos malotes e suas encomendas vinculadas

## Como Testar

1. Verificar no banco de dados se há malotes com encomendas em trânsito:
   ```sql
   SELECT m.NUMERO_MALOTE, e.STATUS, e.NUMERO_ENCOMENDA
   FROM MALOTE m
   LEFT JOIN ENCOMENDAS e ON e.MALOTE_ID = m.ID
   WHERE UPPER(REPLACE(TRIM(e.STATUS), ' ', '_')) IN ('EM_TRANSITO','EM_TRÂNSITO')
   ```

2. Abrir o modal "Selecionar Malote e Lacre"

3. Verificar se os malotes com encomendas em trânsito aparecem como "Em transito / Indisponível" (badge laranja)

4. Verificar se o botão "Escolher" está desabilitado para esses malotes

5. Fechar e reabrir o modal várias vezes para garantir que a regra é persistente

6. Verificar os logs do console do navegador para rastreamento:
   - `[SelectLacreMaloteModal] fetchMalotes - targetSetorId: ...`
   - `[SelectLacreMaloteModal] Buscando status por eventos com params: ...`
   - `[SelectLacreMaloteModal] Status por eventos recebidos: ...`
   - `[SelectLacreMaloteModal] Mapeando status evento - key: ...`
   - `[SelectLacreMaloteModal] Malote ... - key: ... isDisponivelEvento: ...`

## Problema Adicional Identificado: Triggers do Banco de Dados

### 3. Problema com Atualização do STATUS na Tabela MALOTE
**Sintoma**: Ao criar uma encomenda, o campo `STATUS` da tabela `MALOTE` não era atualizado para 'Indisponivel'. Ao receber a encomenda, o campo não era atualizado para 'Disponivel'.

**Causa**: Havia dois triggers diferentes no banco de dados com lógicas conflitantes:
1. `TRG_MALOTE_SET_STATUS_ON_LINK` (antigo) - não tratava o status 'entregue' corretamente
2. `TRG_ENCOMENDAS_PROPAGATE_MALOTE_STATUS` (antigo) - não desvinculava o malote ao entregar

**Solução**:
- Criado script `backend/sql/fix_malote_status_triggers.sql` que:
  - Remove os triggers antigos
  - Cria triggers corrigidos com a lógica completa
  - Corrige o STATUS de todos os malotes existentes no banco
  - Adiciona logs de debug nos triggers

### Lógica Correta dos Triggers

#### Trigger: TRG_MALOTE_SET_STATUS_ON_LINK
Executado ANTES de inserir/atualizar ENCOMENDA_ID no MALOTE:
- Se ENCOMENDA_ID = NULL: STATUS = 'Disponivel'
- Se ENCOMENDA_ID != NULL: STATUS = 'Indisponivel' (será ajustado pelo outro trigger)

#### Trigger: TRG_ENCOMENDAS_PROPAGATE_MALOTE_STATUS
Executado DEPOIS de atualizar STATUS na ENCOMENDAS:
- Se STATUS = 'em_transito' (ou variações): MALOTE.STATUS = 'Em transito'
- Se STATUS = 'entregue': MALOTE.ENCOMENDA_ID = NULL e MALOTE.STATUS = 'Disponivel'
- Outros status: MALOTE.STATUS = 'Indisponivel'

### Arquivos Adicionais Criados

4. `backend/sql/fix_malote_status_triggers.sql`
   - Script completo para corrigir os triggers
   - Corrige o STATUS de todos os malotes existentes
   - Adiciona logs de debug para rastreamento

## Próximos Passos

1. **EXECUTAR O SCRIPT SQL**: `backend/sql/fix_malote_status_triggers.sql` no banco de dados
2. Testar em ambiente de desenvolvimento
3. Verificar se há outros lugares no código que precisam da mesma correção
4. Remover os logs de debug após confirmar que está funcionando corretamente
5. Atualizar testes automatizados se existirem

## Como Executar a Correção

### 1. Executar o script SQL no banco de dados:
```bash
sqlplus PROTOCOLO_USER/senha@database @backend/sql/fix_malote_status_triggers.sql
```

### 2. Verificar se os triggers foram criados:
```sql
SELECT trigger_name, status FROM user_triggers WHERE trigger_name LIKE '%MALOTE%';
```

### 3. Testar a correção:
- Criar uma nova encomenda e verificar se o malote fica com STATUS = 'Indisponivel'
- Receber a encomenda e verificar se o malote fica com STATUS = 'Disponivel'
- Verificar os logs do banco de dados para rastreamento
