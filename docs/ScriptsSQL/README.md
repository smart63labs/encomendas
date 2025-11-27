# Scripts SQL para Alteração da Tabela SETORES

## Credenciais de Conexão
- **Usuário**: protocolo_user
- **Senha**: Anderline49
- **Conexão**: localhost:1521/FREEPDB1
- **Schema**: protocolo_user
- **Tabela**: SETORES

## Ordem de Execução

### 1. Verificar Estrutura Atual
Execute primeiro o script `verificar_estrutura_atual.sql` para:
- Confirmar a existência da tabela SETORES
- Verificar a estrutura atual (colunas, tipos, constraints)
- Verificar índices e triggers existentes
- Contar registros existentes

### 2. Alterar Estrutura da Tabela
Execute o script `alter_table_setores.sql` para:
- Adicionar novos campos necessários
- Criar índices para melhor performance
- Adicionar comentários nas colunas
- Criar trigger para atualização automática de DATA_ATUALIZACAO

## Novos Campos Adicionados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| COLUNA1 | VARCHAR2(255) | Campo genérico para informações adicionais |
| LOGRADOURO | VARCHAR2(255) | Endereço - Logradouro |
| NUMERO | VARCHAR2(50) | Endereço - Número |
| BAIRRO | VARCHAR2(100) | Endereço - Bairro |
| CIDADE | VARCHAR2(100) | Endereço - Cidade |
| ESTADO | VARCHAR2(2) | Endereço - Estado (UF) |
| CEP | VARCHAR2(10) | Código de Endereçamento Postal |
| LATITUDE | NUMBER(10,8) | Coordenada geográfica - Latitude |
| LONGITUDE | NUMBER(11,8) | Coordenada geográfica - Longitude |
| DATA_CRIACAO | TIMESTAMP | Data e hora de criação do registro |
| DATA_ATUALIZACAO | TIMESTAMP | Data e hora da última atualização |

## Campos Removidos (Comentados no Script)
- HIERARQUIA_SETOR
- MUNICIPIO_LOTACAO  
- ENDERECO
- CREATED_AT (renomeado para DATA_CRIACAO)
- UPDATED_AT (renomeado para DATA_ATUALIZACAO)

## Índices Criados
- IDX_SETORES_CIDADE
- IDX_SETORES_ESTADO
- IDX_SETORES_CEP
- IDX_SETORES_ATIVO

## Trigger Criado
- TRG_SETORES_UPDATE_DATE: Atualiza automaticamente o campo DATA_ATUALIZACAO

## Observações Importantes
1. **Backup**: Faça backup da tabela antes de executar as alterações
2. **Migração de Dados**: Alguns comandos de migração estão comentados - descomente conforme necessário
3. **Remoção de Campos**: Os comandos DROP COLUMN estão comentados por segurança
4. **Teste**: Execute primeiro em ambiente de desenvolvimento/teste

## Comando SQL Plus
```sql
sqlplus protocolo_user/Anderline49@localhost:1521/FREEPDB1
```