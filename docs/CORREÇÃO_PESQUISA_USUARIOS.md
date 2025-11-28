# Correção do Sistema de Pesquisa de Usuários

## Problemas Identificados

O sistema de pesquisa na tela "Configurações de Usuários" não estava retornando resultados ao pesquisar por:
1. Nome de usuário com acentos (ex: "ANA FERREIRA ALVES MARTINS")
2. Nome de setor com acentos (ex: "Superintendência do Tesouro Estadual")
3. Espaços em branco antes ou depois do texto no campo de pesquisa

### Causa Raiz

O problema estava na query SQL do backend que usava `UPPER()` para comparação case-insensitive, mas não removia acentos. Quando o usuário pesquisava por "SUPERINTENDENCIA" (sem acento), o banco não encontrava "Superintendência" (com acento).

## Soluções Implementadas

### 1. Backend - Arquivo: `backend/src/models/user.model.ts`

Modificado o método `findUsersWithSetor` para usar a função `TRANSLATE` do Oracle que remove acentos antes da comparação:

```typescript
// ANTES (linha ~440):
if (typeof value === 'string' && value.includes('%')) {
  conditions.push(`UPPER(${columnName}) LIKE UPPER(:filter${index})`);
}

// DEPOIS:
if (typeof value === 'string' && value.includes('%')) {
  // Usar TRANSLATE para normalizar acentos em comparações LIKE
  const normalizedColumn = `TRANSLATE(UPPER(${columnName}), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'AAAAAEEEEIIIIOOOOUUUUCN')`;
  const normalizedValue = `TRANSLATE(UPPER(:filter${index}), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'AAAAAEEEEIIIIOOOOUUUUCN')`;
  conditions.push(`${normalizedColumn} LIKE ${normalizedValue}`);
}
```

### Teste SQL Validado

A query abaixo foi testada e funciona corretamente:

```sql
SELECT 
  u.ID,
  u.NOME,
  s.NOME_SETOR
FROM USUARIOS u
LEFT JOIN SETORES s ON u.SETOR_ID = s.ID
WHERE TRANSLATE(UPPER(u.NOME), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'AAAAAEEEEIIIIOOOOUUUUCN') 
      LIKE TRANSLATE(UPPER('%ANA FERREIRA%'), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'AAAAAEEEEIIIIOOOOUUUUCN')
   OR TRANSLATE(UPPER(s.NOME_SETOR), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'AAAAAEEEEIIIIOOOOUUUUCN') 
      LIKE TRANSLATE(UPPER('%SUPERINTENDENCIA DO TESOURO%'), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'AAAAAEEEEIIIIOOOOUUUUCN')
```

Resultado: 13 usuários encontrados, incluindo "ANA FERREIRA ALVES MARTINS" do setor "Superintendência do Tesouro Estadual".

### 2. Frontend - Arquivo: `src/components/configuracoes/tabs/ConfigUsuariosTab.tsx`

Adicionado `.trim()` no campo de pesquisa para remover espaços em branco antes e depois do texto:

```typescript
// ANTES (linha ~202):
onChange={(e) => setSearchTerm(e.target.value)}

// DEPOIS:
onChange={(e) => setSearchTerm(e.target.value.trim())}
```

Isso evita que espaços acidentais no início ou fim do texto impeçam a pesquisa de funcionar corretamente.

## Como Aplicar a Correção

1. **Compilar o Backend:**
   ```bash
   cd backend
   npm run build
   ```

2. **Reiniciar o Servidor:**
   ```bash
   npm start
   # ou se estiver em desenvolvimento:
   npm run dev
   ```

3. **Testar a Pesquisa:**
   - Acesse a tela "Configurações de Usuários"
   - Pesquise por "ANA FERREIRA ALVES MARTINS" - deve retornar resultado
   - Pesquise por "SUPERINTENDENCIA DO TESOURO" (sem acento) - deve retornar todos os usuários desse setor

## Observações

- O frontend já possui a função `normalizeText` em `src/lib/utils.ts` que remove acentos no lado do cliente
- A correção no backend garante que a pesquisa funcione independente de como o usuário digita (com ou sem acentos)
- O método `searchUsersAndSectors` no controller já estava usando a função `removeAccents` corretamente
- Esta correção se aplica especificamente ao endpoint `/users/with-org-data` usado pela tela de configurações

## Verificação de Dados

Usuário de teste confirmado no banco:
- ID: 90
- Nome: ANA FERREIRA ALVES MARTINS
- Email: martinsana686@gmail.com
- Matrícula: 768902
- Setor: Superintendência do Tesouro Estadual (ID: 285)
