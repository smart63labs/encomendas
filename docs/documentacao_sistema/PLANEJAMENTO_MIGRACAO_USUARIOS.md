# PLANEJAMENTO DE MIGRAÇÃO - DADOS DOS USUÁRIOS SEFAZ

## 📊 ANÁLISE DA PLANILHA DE DADOS

### Informações Gerais
- **Arquivo**: SERVIDORES DA SEFAZ - 22-05-2025 II.xlsx
- **Total de registros**: 1.955 servidores
- **Total de campos**: 74 colunas
- **Formato**: Planilha Excel com dados completos dos servidores

### Estrutura Atual da Tabela USUARIOS
```sql
CREATE TABLE USUARIOS (
    ID NUMBER(22) NOT NULL,
    NOME VARCHAR2(100) NOT NULL,
    EMAIL VARCHAR2(100) NOT NULL,
    SENHA VARCHAR2(255) NOT NULL,
    PERFIL VARCHAR2(20),
    ATIVO NUMBER(22),
    CREATED_AT TIMESTAMP(6),
    UPDATED_AT TIMESTAMP(6),
    DEPARTAMENTO VARCHAR2(100)
);
```

## 🔍 MAPEAMENTO DE CAMPOS

### Campos Existentes no Sistema (Mapeamento Direto)
| Campo Sistema | Campo Planilha | Observações |
|---------------|----------------|-------------|
| NOME | NOME (col 2) | Mapeamento direto |
| EMAIL | E_MAIL (col 74) | Mapeamento direto |
| DEPARTAMENTO | SETOR (col 54) | Recém adicionado |

### 🆕 CAMPOS EXTRAS IDENTIFICADOS PARA ADIÇÃO

#### 1. **Dados Pessoais Básicos**
- **CPF** (col 5) - VARCHAR2(14) - Documento principal
- **PIS_PASEP** (col 6) - VARCHAR2(15) - Identificação trabalhista
- **SEXO** (col 7) - VARCHAR2(1) - M/F
- **ESTADO_CIVIL** (col 8) - VARCHAR2(20)
- **DATA_NASCIMENTO** (col 9) - DATE
- **NOME_PAI** (col 10) - VARCHAR2(100)
- **NOME_MAE** (col 11) - VARCHAR2(100)
- **RACA_COR** (col 25) - VARCHAR2(20)
- **TIPO_SANGUINEO** (col 24) - VARCHAR2(5)

#### 2. **Documentação**
- **RG** (col 12) - VARCHAR2(20)
- **TIPO_RG** (col 13) - VARCHAR2(20)
- **ORGAO_EXPEDITOR** (col 14) - VARCHAR2(50)
- **UF_RG** (col 15) - VARCHAR2(2)
- **DATA_EXPEDICAO_RG** (col 16) - DATE

#### 3. **Dados Bancários**
- **BANCO** (col 17) - VARCHAR2(100)
- **AGENCIA** (col 18) - VARCHAR2(10)
- **CONTA** (col 19) - VARCHAR2(20)

#### 4. **Informações Funcionais**
- **NUMERO_FUNCIONAL** (col 3) - NUMBER(10) - Matrícula
- **NUMERO_VINCULO** (col 4) - NUMBER(10)
- **CODIGO_CARGO** (col 37) - NUMBER(10)
- **CARGO** (col 38) - VARCHAR2(100)
- **TIPO_VINCULO** (col 31) - VARCHAR2(50)
- **CATEGORIA** (col 32) - VARCHAR2(50)
- **REGIME_JURIDICO** (col 33) - VARCHAR2(50)
- **REGIME_PREVIDENCIARIO** (col 34) - VARCHAR2(50)
- **SITUACAO** (col 60) - VARCHAR2(20)
- **JORNADA** (col 43) - NUMBER(3)

#### 5. **Datas Importantes**
- **DATA_INGRESSO_SERVICO_PUBLICO** (col 28) - DATE
- **DATA_INICIO_ATIVIDADE** (col 58) - DATE
- **DATA_DESATIVACAO** (col 62) - DATE

#### 6. **Escolaridade e Formação**
- **ESCOLARIDADE_CARGO** (col 39) - VARCHAR2(50)
- **ESCOLARIDADE_SERVIDOR** (col 40) - VARCHAR2(50)
- **FORMACAO_PROFISSIONAL_1** (col 41) - VARCHAR2(100)
- **FORMACAO_PROFISSIONAL_2** (col 42) - VARCHAR2(100)

#### 7. **Localização e Contato**
- **CIDADE_NASCIMENTO** (col 22) - VARCHAR2(100)
- **UF_NASCIMENTO** (col 23) - VARCHAR2(2)
- **MUNICIPIO_LOTACAO** (col 59) - VARCHAR2(100)
- **TELEFONE** (col 66) - VARCHAR2(20)
- **ENDERECO** (col 67) - VARCHAR2(200)
- **NUMERO_ENDERECO** (col 68) - VARCHAR2(10)
- **COMPLEMENTO_ENDERECO** (col 69) - VARCHAR2(50)
- **BAIRRO_ENDERECO** (col 70) - VARCHAR2(100)
- **CIDADE_ENDERECO** (col 71) - VARCHAR2(100)
- **UF_ENDERECO** (col 72) - VARCHAR2(2)
- **CEP_ENDERECO** (col 73) - VARCHAR2(9)

#### 8. **Estrutura Organizacional**
- **ORGAO** (col 53) - VARCHAR2(100)
- **LOTACAO** (col 55) - VARCHAR2(200)
- **HIERARQUIA_SETOR** (col 65) - VARCHAR2(500)

#### 9. **Remuneração**
- **NIVEL_REFERENCIA** (col 44) - VARCHAR2(20)
- **VALOR_NIVEL_REFERENCIA** (col 45) - NUMBER(10,2)
- **COMISSAO_FUNCAO** (col 47) - VARCHAR2(100)
- **SIMBOLO** (col 50) - VARCHAR2(20)
- **VALOR_SIMBOLO** (col 51) - NUMBER(10,2)

#### 10. **Acessibilidade**
- **PNE** (col 26) - VARCHAR2(3) - Pessoa com Necessidades Especiais
- **TIPO_DEFICIENCIA** (col 27) - VARCHAR2(100)

## 📋 PLANO DE EXECUÇÃO

### Fase 1: Preparação do Banco de Dados
1. **Backup da tabela atual**
2. **Criação de novos campos** (ALTER TABLE)
3. **Criação de índices necessários**
4. **Validação da estrutura**

### Fase 2: Preparação dos Dados
1. **Exportação da planilha para CSV**
2. **Limpeza e validação dos dados**
3. **Tratamento de valores nulos**
4. **Padronização de formatos**

### Fase 3: Migração
1. **Inserção dos dados básicos**
2. **Atualização dos campos existentes**
3. **Validação da integridade**
4. **Testes de consulta**

### Fase 4: Validação
1. **Verificação de completude**
2. **Testes de performance**
3. **Validação com usuários**
4. **Documentação final**

## 🚨 CONSIDERAÇÕES IMPORTANTES

### Segurança e Privacidade
- **CPF**: Campo sensível - implementar criptografia
- **Dados bancários**: Acesso restrito
- **Dados pessoais**: Conformidade com LGPD

### Performance
- **Índices**: Criar índices em CPF, NUMERO_FUNCIONAL, EMAIL
- **Particionamento**: Considerar para grandes volumes

### Integridade
- **CPF**: Validação de formato e unicidade
- **Email**: Validação de formato
- **Datas**: Validação de consistência

## 📊 ESTATÍSTICAS ESPERADAS
- **Registros a migrar**: 1.955 servidores
- **Campos novos**: ~65 campos adicionais
- **Tempo estimado**: 2-3 horas para migração completa
- **Espaço adicional**: ~50MB estimado

## 🔧 SCRIPTS NECESSÁRIOS
1. **01_backup_usuarios.sql** - Backup da tabela atual
2. **02_alter_table_usuarios.sql** - Adição dos novos campos
3. **03_create_indexes.sql** - Criação de índices
4. **04_migration_script.sql** - Script de migração dos dados
5. **05_validation_queries.sql** - Queries de validação

---

**Data de Criação**: 11/09/2025  
**Responsável**: Sistema de Migração Automatizada  
**Status**: Em Planejamento  
**Próxima Revisão**: Após aprovação da estrutura