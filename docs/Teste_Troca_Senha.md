# Teste de Troca de Senha - Sistema de Protocolo

## Objetivo
Testar a funcionalidade de troca de senha do sistema, validando o fluxo completo desde o login inicial até o login com a nova senha.

## Usuários de Teste Criados

### Usuário ADMIN
- **ID**: 1955
- **Nome**: João Silva Admin
- **CPF**: 11144477735
- **Senha Inicial**: Admin@123
- **Nova Senha**: Anderl************
- **Role**: ADMIN

### Usuário USER  
- **ID**: 1956
- **Nome**: Maria Santos User
- **CPF**: 22255588844
- **Senha Inicial**: User@123
- **Nova Senha**: Anderl************
- **Role**: USER

## Ambiente Verificado
- ✅ Frontend rodando na porta 8080
- ✅ Backend rodando na porta 3001
- ✅ Banco de dados Oracle conectado (FREEPDB1)
- ✅ Chrome aberto em http://localhost:8080

## Instruções para Teste Manual

### TESTE 1: Usuário ADMIN

#### Passo 1: Login Inicial
1. Acesse http://localhost:8080 (já aberto no Chrome)
2. Faça login com:
   - **CPF**: 11144477735
   - **Senha**: Admin@123
3. ✅ Verificar se o login foi bem-sucedido

#### Passo 2: Troca de Senha
1. Navegue até a área de configurações/perfil do usuário
2. Localize a opção "Alterar Senha" ou similar
3. Altere a senha de `Admin@123` para `Anderl************`
4. ✅ Confirmar que a alteração foi salva com sucesso

#### Passo 3: Logout e Novo Login
1. Faça logout do sistema
2. Tente fazer login novamente com:
   - **CPF**: joao.admin@teste.com
   - **Senha**: Anderline49@ (nova senha)
3. ✅ Verificar se o login com a nova senha funciona

### TESTE 2: Usuário USER

#### Passo 1: Login Inicial
1. Faça login com:
   - **CPF**: 11144477735
   - **Senha**: User@123
2. ✅ Verificar se o login foi bem-sucedido

#### Passo 2: Troca de Senha
1. Navegue até a área de configurações/perfil do usuário
2. Localize a opção "Alterar Senha" ou similar
3. Altere a senha de `User@123` para `Anderl************`
4. ✅ Confirmar que a alteração foi salva com sucesso

#### Passo 3: Logout e Novo Login
1. Faça logout do sistema
2. Tente fazer login novamente com:
   - **CPF**: 11144477735
   - **Senha**: Anderline49@ (nova senha)
3. ✅ Verificar se o login com a nova senha funciona

## Pontos de Atenção Durante o Teste

### Validações Importantes:
- [ ] Interface de login carrega corretamente
- [ ] Mensagens de erro/sucesso são exibidas adequadamente
- [ ] Redirecionamento após login funciona
- [ ] Opção de troca de senha está acessível
- [ ] Validação de senha (critérios de segurança)
- [ ] Confirmação de alteração de senha
- [ ] Logout funciona corretamente
- [ ] Login com nova senha é aceito
- [ ] Login com senha antiga é rejeitado

### Possíveis Erros a Monitorar:
- Erros de conexão com o banco de dados
- Problemas de validação de formulário
- Falhas na criptografia de senha
- Problemas de sessão/autenticação
- Erros de interface (JavaScript/CSS)

## Resultados dos Testes

### Preparação
- ✅ Usuário ADMIN criado com sucesso (ID: 1955)
- ✅ Usuário USER criado com sucesso (ID: 1956)
- ✅ Ambiente verificado e funcional
- ✅ Chrome aberto para testes

### Execução dos Testes
**Status**: 🔄 **EM ANDAMENTO - AGUARDANDO EXECUÇÃO MANUAL**

#### Teste ADMIN:
- [ ] Login inicial com Admin@123
- [ ] Troca de senha para Anderline49@
- [ ] Login com nova senha

#### Teste USER:
- [ ] Login inicial com User@123
- [ ] Troca de senha para Anderline49@
- [ ] Login com nova senha

## Próximos Passos
1. ⏳ Executar testes manuais conforme instruções acima
2. ⏳ Documentar resultados e erros encontrados
3. ⏳ Corrigir problemas identificados (se houver)
4. ⏳ Validar correções com novos testes

---

**Data de Criação**: $(Get-Date -Format "dd/MM/yyyy HH:mm")
**Responsável**: Sistema de Testes Automatizado
**Status**: Em Preparação