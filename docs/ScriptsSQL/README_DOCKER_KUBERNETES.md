# Scripts SQL - Docker e Kubernetes

## 📋 Visão Geral

Este documento descreve como executar e gerenciar scripts SQL no contexto de containers Docker e pods Kubernetes para o sistema NovoProtocolo.

## 🐳 Execução em Docker

### Conectar ao Container Oracle
```bash
# Docker Compose
docker-compose exec oracle-db sqlplus protocolo_user/Anderline49@localhost:1521/FREEPDB1

# Docker run
docker exec -it <oracle-container-id> sqlplus protocolo_user/Anderline49@localhost:1521/FREEPDB1
```

### Executar Scripts via Docker
```bash
# Copiar script para o container
docker cp script.sql <oracle-container-id>:/tmp/

# Executar script
docker exec -it <oracle-container-id> sqlplus protocolo_user/Anderline49@localhost:1521/FREEPDB1 @/tmp/script.sql

# Executar múltiplos scripts
for script in *.sql; do
    docker cp "$script" <oracle-container-id>:/tmp/
    docker exec -it <oracle-container-id> sqlplus protocolo_user/Anderline49@localhost:1521/FREEPDB1 @/tmp/"$script"
done
```

### Volume Mount para Scripts
```yaml
# docker-compose.yml
services:
  oracle-db:
    volumes:
      - ./docs/ScriptsSQL:/docker-entrypoint-initdb.d/scripts:ro
      - ./docs/ScriptsSQL:/opt/oracle/scripts:ro
```

## ☸️ Execução em Kubernetes

### Conectar ao Pod Oracle
```bash
# Listar pods Oracle
kubectl get pods -n novoprotocolo -l component=database

# Conectar ao pod
kubectl exec -it <oracle-pod-name> -n novoprotocolo -- sqlplus protocolo_user/Anderline49@localhost:1521/FREEPDB1
```

### Executar Scripts via kubectl
```bash
# Copiar script para o pod
kubectl cp script.sql <oracle-pod-name>:/tmp/script.sql -n novoprotocolo

# Executar script
kubectl exec -it <oracle-pod-name> -n novoprotocolo -- sqlplus protocolo_user/Anderline49@localhost:1521/FREEPDB1 @/tmp/script.sql
```

### ConfigMap para Scripts
```yaml
# scripts-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: sql-scripts
  namespace: novoprotocolo
data:
  init-schema.sql: |
    -- Script de inicialização
    CREATE TABLE IF NOT EXISTS test_table (
        id NUMBER PRIMARY KEY,
        name VARCHAR2(100)
    );
  
  seed-data.sql: |
    -- Dados iniciais
    INSERT INTO test_table VALUES (1, 'Test Data');
    COMMIT;
```

### Job para Execução de Scripts
```yaml
# sql-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: sql-migration-job
  namespace: novoprotocolo
spec:
  template:
    spec:
      containers:
      - name: sql-executor
        image: container-registry.oracle.com/database/instantclient:19
        command: ["/bin/bash"]
        args:
        - -c
        - |
          echo "Executando scripts SQL..."
          sqlplus protocolo_user/Anderline49@oracle-service:1521/FREEPDB1 @/scripts/migration.sql
        volumeMounts:
        - name: sql-scripts
          mountPath: /scripts
        env:
        - name: ORACLE_HOME
          value: /usr/lib/oracle/19/client64
        - name: LD_LIBRARY_PATH
          value: /usr/lib/oracle/19/client64/lib
      volumes:
      - name: sql-scripts
        configMap:
          name: sql-scripts
      restartPolicy: OnFailure
```

## 📁 Organização dos Scripts

### Estrutura Recomendada
```
ScriptsSQL/
├── 01_schema/
│   ├── 001_create_tables.sql
│   ├── 002_create_indexes.sql
│   └── 003_create_constraints.sql
├── 02_data/
│   ├── 001_seed_users.sql
│   ├── 002_seed_setores.sql
│   └── 003_seed_configs.sql
├── 03_migrations/
│   ├── 2024_10_01_add_ldap_config.sql
│   ├── 2024_10_15_update_user_structure.sql
│   └── migration_tracker.sql
├── 04_maintenance/
│   ├── cleanup_logs.sql
│   ├── rebuild_indexes.sql
│   └── update_statistics.sql
└── 99_rollback/
    ├── rollback_ldap_config.sql
    └── rollback_user_structure.sql
```

### Convenções de Nomenclatura
- **Prefixo numérico**: Ordem de execução (001, 002, etc.)
- **Data**: Para migrações (YYYY_MM_DD_description.sql)
- **Categoria**: schema, data, migration, maintenance, rollback
- **Descrição**: Nome descritivo da operação

## 🔄 Automação de Migrações

### Script de Migração Automática
```bash
#!/bin/bash
# migrate.sh

ORACLE_POD=$(kubectl get pods -n novoprotocolo -l component=database -o jsonpath='{.items[0].metadata.name}')
SCRIPTS_DIR="./docs/ScriptsSQL"

echo "Executando migrações no pod: $ORACLE_POD"

# Executar scripts em ordem
for category in 01_schema 02_data 03_migrations; do
    echo "Executando categoria: $category"
    
    for script in $SCRIPTS_DIR/$category/*.sql; do
        if [ -f "$script" ]; then
            echo "Executando: $(basename $script)"
            
            # Copiar script para o pod
            kubectl cp "$script" "$ORACLE_POD:/tmp/$(basename $script)" -n novoprotocolo
            
            # Executar script
            kubectl exec -it "$ORACLE_POD" -n novoprotocolo -- sqlplus -s protocolo_user/Anderline49@localhost:1521/FREEPDB1 @/tmp/$(basename $script)
            
            if [ $? -eq 0 ]; then
                echo "✅ $(basename $script) executado com sucesso"
            else
                echo "❌ Erro ao executar $(basename $script)"
                exit 1
            fi
        fi
    done
done

echo "🎉 Todas as migrações foram executadas com sucesso!"
```

### Helm Chart para Migrações
```yaml
# templates/migration-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "novoprotocolo.fullname" . }}-migration
  labels:
    {{- include "novoprotocolo.labels" . | nindent 4 }}
  annotations:
    "helm.sh/hook": post-install,post-upgrade
    "helm.sh/hook-weight": "1"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      containers:
      - name: migration
        image: "{{ .Values.migration.image.repository }}:{{ .Values.migration.image.tag }}"
        command: ["/bin/bash", "/scripts/migrate.sh"]
        volumeMounts:
        - name: migration-scripts
          mountPath: /scripts
        env:
        - name: DB_HOST
          value: {{ include "novoprotocolo.databaseHost" . }}
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: {{ include "novoprotocolo.secretName" . }}
              key: db-user
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: {{ include "novoprotocolo.secretName" . }}
              key: db-password
      volumes:
      - name: migration-scripts
        configMap:
          name: {{ include "novoprotocolo.fullname" . }}-migration-scripts
      restartPolicy: OnFailure
```

## 🔍 Monitoramento e Logs

### Verificar Execução de Scripts
```bash
# Logs do job de migração
kubectl logs job/sql-migration-job -n novoprotocolo

# Logs do pod Oracle
kubectl logs -f deployment/oracle-deployment -n novoprotocolo

# Verificar status das tabelas
kubectl exec -it <oracle-pod> -n novoprotocolo -- sqlplus -s protocolo_user/Anderline49@localhost:1521/FREEPDB1 <<EOF
SELECT table_name, num_rows FROM user_tables ORDER BY table_name;
EXIT;
EOF
```

### Script de Verificação
```sql
-- verificar_migracao.sql
SET PAGESIZE 0
SET FEEDBACK OFF
SET HEADING OFF

SPOOL /tmp/migration_status.log

SELECT 'Verificando estrutura das tabelas...' FROM DUAL;

SELECT 'Tabela: ' || table_name || ' - Registros: ' || NVL(num_rows, 0)
FROM user_tables 
WHERE table_name IN ('USUARIOS', 'SETORES', 'PROTOCOLOS', 'CONFIGURACOES')
ORDER BY table_name;

SELECT 'Verificando configurações LDAP...' FROM DUAL;

SELECT 'LDAP Config: ' || config_key || ' = ' || config_value
FROM configuracoes 
WHERE config_key LIKE 'LDAP_%';

SPOOL OFF
EXIT;
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão
```bash
# Verificar se o serviço Oracle está rodando
kubectl get pods -n novoprotocolo -l component=database

# Verificar logs do Oracle
kubectl logs <oracle-pod> -n novoprotocolo

# Testar conectividade
kubectl exec -it <oracle-pod> -n novoprotocolo -- tnsping localhost:1521
```

#### 2. Script não Executa
```bash
# Verificar se o arquivo existe no pod
kubectl exec -it <oracle-pod> -n novoprotocolo -- ls -la /tmp/

# Verificar permissões
kubectl exec -it <oracle-pod> -n novoprotocolo -- chmod +r /tmp/script.sql

# Executar com debug
kubectl exec -it <oracle-pod> -n novoprotocolo -- sqlplus -s protocolo_user/Anderline49@localhost:1521/FREEPDB1 <<EOF
SET ECHO ON
SET FEEDBACK ON
@/tmp/script.sql
EXIT;
EOF
```

#### 3. Erro de Sintaxe SQL
```sql
-- Verificar sintaxe antes da execução
SET SERVEROUTPUT ON
BEGIN
    EXECUTE IMMEDIATE 'SELECT 1 FROM DUAL';
    DBMS_OUTPUT.PUT_LINE('Sintaxe OK');
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Erro: ' || SQLERRM);
END;
/
```

## 🔒 Segurança

### Boas Práticas
- Nunca incluir senhas em scripts
- Usar secrets do Kubernetes para credenciais
- Executar scripts com usuário de menor privilégio
- Fazer backup antes de executar migrações
- Testar scripts em ambiente de desenvolvimento primeiro

### Backup Antes de Migrações
```bash
# Backup via kubectl
kubectl exec -it <oracle-pod> -n novoprotocolo -- expdp protocolo_user/Anderline49@localhost:1521/FREEPDB1 \
    directory=DATA_PUMP_DIR \
    dumpfile=backup_$(date +%Y%m%d_%H%M%S).dmp \
    logfile=backup_$(date +%Y%m%d_%H%M%S).log

# Backup de tabelas específicas
kubectl exec -it <oracle-pod> -n novoprotocolo -- sqlplus protocolo_user/Anderline49@localhost:1521/FREEPDB1 <<EOF
CREATE TABLE usuarios_backup AS SELECT * FROM usuarios;
CREATE TABLE setores_backup AS SELECT * FROM setores;
EXIT;
EOF
```

---

**Última atualização**: Outubro 2024  
**Versão**: 1.0.0