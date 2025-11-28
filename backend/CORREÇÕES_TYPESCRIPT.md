# Correções TypeScript Necessárias

## Status: EM PROGRESSO

### Erros Corrigidos:
1. ✅ configuracao-aparencia.controller.ts - Adicionado AuthenticatedRequest
2. ✅ configuracao-apis.controller.ts - Adicionado AuthenticatedRequest

### Erros Pendentes por Arquivo:

#### configuracao-geral.controller.ts (2 erros)
- Linha 206, 232: Property 'user' does not exist on type 'Request'
- **Solução**: Trocar `Request` por `AuthenticatedRequest`

#### configuracao-notificacoes.controller.ts (2 erros)
- Linha 154, 179: Property 'user' does not exist on type 'Request'
- **Solução**: Trocar `Request` por `AuthenticatedRequest`

#### configuracao-seguranca.controller.ts (2 erros)
- Linha 160, 187: Property 'user' does not exist on type 'Request'
- **Solução**: Trocar `Request` por `AuthenticatedRequest`

#### configuracao-sistema.controller.ts (2 erros)
- Linha 154, 179: Property 'user' does not exist on type 'Request'
- **Solução**: Trocar `Request` por `AuthenticatedRequest`

#### configuracao.controller.ts (9 erros)
- Linhas 71, 76, 81, 125, 130, 135: Comparação de tipos incompatíveis
- **Solução**: Fazer cast ou verificação de tipo antes da comparação
- Linha 214: Type 'unknown[] | []' is not assignable
- **Solução**: Adicionar verificação de tipo
- Linha 820: Propriedade duplicada 'erros'
- **Solução**: Remover duplicata

#### documento.controller.ts (2 erros)
- Linhas 2, 4: Duplicate identifier 'AuthenticatedRequest'
- **Solução**: Remover import duplicado

#### encomenda.controller.ts (6 erros)
- Linha 54: Property 'setorId' does not exist
- Linha 383: Type 'number | null' is not assignable
- Linha 723: Cannot assign to 'codigoRastreamento' (const)
- Linha 908: No value exists in scope for 'id'
- Linha 1303: Type 'string' is not assignable to union type
- Linha 1306: Type 'string' is not assignable to type 'Date'

#### ldap.controller.ts (1 erro)
- Linha 20: Property 'error' does not exist

#### malote.controller.ts (2 erros)
- Linhas 120, 368: Property 'setorId' does not exist

#### prazo.controller.ts (2 erros)
- Linhas 2, 3: Duplicate identifier 'AuthenticatedRequest'

#### setor.controller.ts (30 erros)
- Múltiplos erros de "Not all code paths return a value"
- Erros de propriedades não existentes em PaginatedResult
- Erros de tipo em ISetorFilters

#### tramitacao.controller.ts (2 erros)
- Linhas 2, 3: Duplicate identifier 'AuthenticatedRequest'

#### user.controller.ts (14 erros)
- Linha 143: Incompatibilidade de tipo no constructor
- Múltiplos erros de propriedades não existentes em PaginatedResult
- Linha 1094: Incompatibilidade de tipo em PaginationOptions

#### setor.model.ts (12 erros)
- Linha 137, 226, 237, 251: Property 'executeQuery' does not exist
- Linha 141: Property 'total' does not exist
- Linhas 163-166: Propriedades não existentes em ISetor

#### user.model.ts (8 erros)
- Linha 136: Incompatibilidade de tipo na herança
- Linha 1178: Expected 0 type arguments
- Linhas 1330-1331: Propriedades não existentes em binds
- Linhas 1441, 1448, 1471, 1478: Type 'string | undefined' não atribuível

#### database.routes.ts (1 erro)
- Linha 29: Not all code paths return a value

#### ldap.routes.ts (1 erro)
- Linha 5: Expected 1 arguments, but got 0

#### routing.routes.ts (3 erros)
- Linhas 76, 84: 'routeData' is of type 'unknown'

#### user.routes.ts (5 erros)
- Linhas 311, 359, 436, 482, 508: Not all code paths return a value

#### ldap.service.ts (2 erros)
- Linha 519: Property 'oracledb' does not exist

## Total de Erros: 112
## Erros Corrigidos: 4
## Erros Pendentes: 108
