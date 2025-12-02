import { Router, Request, Response, NextFunction } from 'express';
import { DatabaseService } from '../config/database';

// Interfaces para tipagem dos resultados Oracle
interface OracleRow {
  [key: string]: any;
}

interface OracleResult {
  rows?: OracleRow[];
}

interface TableStructureRow {
  COLUMN_NAME: string;
  DATA_TYPE: string;
  DATA_LENGTH: number;
  DATA_PRECISION: number;
  DATA_SCALE: number;
  NULLABLE: string;
  DATA_DEFAULT: string;
  COLUMN_ID: number;
}

const router = Router();

/**
 * Executar script SQL
 */
router.post('/execute-script', async (req, res) => {
  try {
    await DatabaseService.ensureInitialized();
    const connection = await DatabaseService.getConnection();

    const { script } = req.body;

    if (!script) {
      res.status(400).json({
        success: false,
        error: 'Script SQL é obrigatório'
      });
      return;
    }

    // Dividir o script em comandos individuais
    const scriptStr = typeof script === 'string' ? script : String(script);
    const commands = scriptStr
      .split(';')
      .map((cmd: string) => cmd.trim())
      .filter((cmd: string) => cmd.length > 0 && !cmd.startsWith('--'));

    const results = [];

    for (const command of commands) {
      try {
        console.log(`Executando: ${command.substring(0, 100)}...`);
        const result = await connection.execute(command);
        results.push({
          command: command.substring(0, 100) + (command.length > 100 ? '...' : ''),
          success: true,
          rowsAffected: result.rowsAffected || 0
        });
      } catch (error) {
        console.error(`Erro ao executar comando: ${command}`, error);
        results.push({
          command: command.substring(0, 100) + (command.length > 100 ? '...' : ''),
          success: false,
          error: (error as Error).message
        });
      }
    }

    await connection.commit();
    await connection.close();

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    res.json({
      success: errorCount === 0,
      summary: {
        totalCommands: commands.length,
        successCount,
        errorCount
      },
      results
    });

  } catch (error) {
    console.error('Erro ao executar script:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao executar script SQL',
      details: (error as Error).message
    });
  }
});

/**
 * Verificar se todas as tabelas existem
 */
router.get('/check-tables', async (req, res) => {
  try {
    await DatabaseService.ensureInitialized();
    const connection = await DatabaseService.getConnection();

    const expectedTables = [
      'users', 'processos', 'movimentacoes', 'documentos',
      'tipos_processo', 'setores', 'auditoria'
    ];

    const tableStatus = [];

    for (const tableName of expectedTables) {
      try {
        const tableNameUpper = tableName.toUpperCase();

        // Verificar se a tabela ou view existe
        const tableExistsResult = await connection.execute(
          `SELECT COUNT(*) as table_exists FROM (
            SELECT table_name FROM user_tables WHERE table_name = :tableName
            UNION
            SELECT view_name as table_name FROM user_views WHERE view_name = :tableName
          )`,
          { tableName: tableNameUpper }
        ) as OracleResult;

        const tableExists = (tableExistsResult.rows?.[0] as any)?.TABLE_EXISTS > 0;

        if (tableExists) {
          // Contar colunas
          const columnsResult = await connection.execute(
            `SELECT COUNT(*) as column_count FROM user_tab_columns WHERE table_name = :tableName`,
            { tableName: tableNameUpper }
          ) as OracleResult;

          // Contar registros
          let rowCount: number | string = 0;
          try {
            const countResult = await connection.execute(
              `SELECT COUNT(*) as row_count FROM ${tableNameUpper}`
            ) as OracleResult;
            rowCount = (countResult.rows?.[0] as any)?.ROW_COUNT || 0;
          } catch (error) {
            rowCount = 'N/A';
          }

          tableStatus.push({
            table: tableName,
            exists: true,
            columns: columnsResult.rows?.[0]?.COLUMN_COUNT || 0,
            rowCount
          });
        } else {
          tableStatus.push({
            table: tableName,
            exists: false,
            columns: 0,
            rowCount: 0
          });
        }

      } catch (error) {
        tableStatus.push({
          table: tableName,
          exists: false,
          error: (error as Error).message,
          columns: 0,
          rowCount: 0
        });
      }
    }

    await connection.close();

    const summary = {
      totalTables: expectedTables.length,
      existingTables: tableStatus.filter(t => t.exists).length,
      missingTables: tableStatus.filter(t => !t.exists).map(t => t.table),
      allTablesExist: tableStatus.every(t => t.exists)
    };

    res.json({
      success: true,
      summary,
      details: tableStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao verificar tabelas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao conectar com o banco de dados',
      details: (error as Error).message
    });
  }
});

/**
 * Verificar estrutura específica da tabela
 */
router.get('/table-structure/:tableName', async (req, res): Promise<void> => {
  try {
    await DatabaseService.ensureInitialized();
    const connection = await DatabaseService.getConnection();

    const { tableName } = req.params;
    const tableNameUpper = tableName.toUpperCase();

    // Verificar se a tabela existe
    const tableExistsResult = await connection.execute(
      `SELECT COUNT(*) as table_exists FROM user_tables WHERE table_name = :tableName`,
      { tableName: tableNameUpper }
    ) as OracleResult;

    const tableExists = (tableExistsResult.rows?.[0] as any)?.TABLE_EXISTS > 0;

    if (!tableExists) {
      await connection.close();
      res.json({
        success: false,
        error: `Tabela ${tableNameUpper} não encontrada`,
        tableExists: false
      });
      return;
    }

    // Obter estrutura da tabela
    const structureResult = await connection.execute(
      `SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        DATA_LENGTH, 
        DATA_PRECISION,
        DATA_SCALE,
        NULLABLE, 
        DATA_DEFAULT,
        COLUMN_ID
      FROM USER_TAB_COLUMNS 
      WHERE TABLE_NAME = :tableName
      ORDER BY COLUMN_ID`,
      { tableName: tableNameUpper }
    ) as { rows?: TableStructureRow[] };

    // Verificar se tem dados na tabela
    let rowCount: number | string = 0;
    try {
      const countResult = await connection.execute(
        `SELECT COUNT(*) as row_count FROM ${tableNameUpper}`
      ) as OracleResult;
      rowCount = (countResult.rows?.[0] as any)?.ROW_COUNT || 0;
    } catch (error) {
      rowCount = 'N/A';
    }

    await connection.close();

    const columns = structureResult.rows?.map(row => ({
      name: row.COLUMN_NAME,
      type: row.DATA_TYPE,
      length: row.DATA_LENGTH,
      precision: row.DATA_PRECISION,
      scale: row.DATA_SCALE,
      nullable: row.NULLABLE,
      defaultValue: row.DATA_DEFAULT,
      position: row.COLUMN_ID
    })) || [];

    res.json({
      success: true,
      tableExists: true,
      table: tableNameUpper,
      rowCount: rowCount,
      totalColumns: columns.length,
      columns: columns
    });

  } catch (error) {
    console.error('Erro ao verificar estrutura da tabela:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar estrutura da tabela',
      details: (error as Error).message
    });
  }
});

/**
 * Executar SQL personalizado (apenas para desenvolvimento)
 */
router.post('/execute-sql', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await DatabaseService.ensureInitialized();
    const connection = await DatabaseService.getConnection();

    const { sql } = req.body;

    if (!sql) {
      res.status(400).json({
        success: false,
        message: 'SQL query is required'
      });
      return;
    }

    const result = await connection.execute(sql) as OracleResult;

    await connection.close();

    res.json({
      success: true,
      data: result.rows || [],
      rowCount: result.rows?.length || 0
    });
  } catch (error: any) {
    console.error('Erro ao executar SQL:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao executar consulta SQL',
      error: error.message
    });
  }
});

/**
 * Endpoint para executar migrações das tabelas faltantes
 */
router.post('/migrate-missing-tables', async (req: Request, res: Response): Promise<void> => {
  let connection;

  try {
    await DatabaseService.ensureInitialized();
    connection = await DatabaseService.getConnection();

    const migrations = [
      {
        name: 'CREATE_ENCOMENDAS_TABLE',
        sql: `
          CREATE TABLE ENCOMENDAS (
            ID NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            NUMERO_ENCOMENDA VARCHAR2(50) NOT NULL UNIQUE,
            DESCRICAO CLOB,
            STATUS VARCHAR2(20) DEFAULT 'PENDENTE',
            DATA_CRIACAO TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            DATA_ATUALIZACAO TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            USUARIO_ID NUMBER,
            SETOR_ID NUMBER
          )
        `
      },
      {
        name: 'CREATE_DOCUMENTOS_TABLE',
        sql: `
          CREATE TABLE DOCUMENTOS (
            ID NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            NOME_ARQUIVO VARCHAR2(255) NOT NULL,
            CAMINHO_ARQUIVO VARCHAR2(500) NOT NULL,
            TIPO_ARQUIVO VARCHAR2(50),
            TAMANHO_ARQUIVO NUMBER,
            DATA_UPLOAD TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PROCESSO_ID NUMBER,
            USUARIO_ID NUMBER
          )
        `
      },
      {
        name: 'CREATE_PRAZOS_TABLE',
        sql: `
          CREATE TABLE PRAZOS (
            ID NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            DESCRICAO VARCHAR2(255) NOT NULL,
            DATA_INICIO DATE NOT NULL,
            DATA_FIM DATE NOT NULL,
            STATUS VARCHAR2(20) DEFAULT 'ATIVO',
            PROCESSO_ID NUMBER,
            USUARIO_RESPONSAVEL_ID NUMBER,
            DATA_CRIACAO TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: 'CREATE_CONFIGURACOES_TABLE',
        sql: `
          CREATE TABLE CONFIGURACOES (
            ID NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            CHAVE VARCHAR2(100) NOT NULL UNIQUE,
            VALOR CLOB,
            DESCRICAO VARCHAR2(255),
            TIPO VARCHAR2(50) DEFAULT 'STRING',
            DATA_CRIACAO TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            DATA_ATUALIZACAO TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: 'CREATE_INDEXES',
        sql: `
          BEGIN
            EXECUTE IMMEDIATE 'CREATE INDEX IDX_ENCOMENDAS_NUMERO ON ENCOMENDAS(NUMERO_ENCOMENDA)';
            EXECUTE IMMEDIATE 'CREATE INDEX IDX_ENCOMENDAS_STATUS ON ENCOMENDAS(STATUS)';
            EXECUTE IMMEDIATE 'CREATE INDEX IDX_DOCUMENTOS_PROCESSO ON DOCUMENTOS(PROCESSO_ID)';
            EXECUTE IMMEDIATE 'CREATE INDEX IDX_PRAZOS_PROCESSO ON PRAZOS(PROCESSO_ID)';
            EXECUTE IMMEDIATE 'CREATE INDEX IDX_PRAZOS_DATA_FIM ON PRAZOS(DATA_FIM)';
            EXECUTE IMMEDIATE 'CREATE INDEX IDX_CONFIGURACOES_CHAVE ON CONFIGURACOES(CHAVE)';
          END;
        `
      },
      {
        name: 'INSERT_DEFAULT_CONFIGURATIONS',
        sql: `
          BEGIN
            INSERT INTO CONFIGURACOES (CHAVE, VALOR, DESCRICAO, TIPO) VALUES 
            ('SISTEMA_NOME', 'Sistema de Protocolo', 'Nome do sistema', 'STRING');
            
            INSERT INTO CONFIGURACOES (CHAVE, VALOR, DESCRICAO, TIPO) VALUES 
            ('PRAZO_PADRAO_DIAS', '30', 'Prazo padrão em dias para processos', 'NUMBER');
            
            INSERT INTO CONFIGURACOES (CHAVE, VALOR, DESCRICAO, TIPO) VALUES 
            ('EMAIL_NOTIFICACAO', 'admin@protocolo.com', 'Email para notificações do sistema', 'STRING');
            
            COMMIT;
          END;
        `
      }
    ];

    const results = [];

    for (const migration of migrations) {
      try {
        console.log(`Executando migração: ${migration.name}`);
        await connection.execute(migration.sql);
        results.push({
          name: migration.name,
          status: 'success',
          message: 'Migração executada com sucesso'
        });
      } catch (error: any) {
        console.error(`Erro na migração ${migration.name}:`, error);
        results.push({
          name: migration.name,
          status: 'error',
          message: error.message
        });
        // Continue com as próximas migrações mesmo se uma falhar
      }
    }

    await connection.close();

    res.json({
      success: true,
      message: 'Migrações executadas',
      results: results
    });
  } catch (error: any) {
    console.error('Erro ao executar migrações:', error);
    if (connection) {
      await connection.close();
    }
    res.status(500).json({
      success: false,
      message: 'Erro ao executar migrações',
      error: error.message
    });
  }
});

// Endpoint para executar alterações na tabela users
router.post('/alter-users', async (req: Request, res: Response) => {
  let connection;

  try {
    await DatabaseService.ensureInitialized();
    connection = await DatabaseService.getConnection();

    const alterations = [
      // Verificar e remover colunas se existirem
      {
        name: 'DROP_PIS_PASEP',
        sql: `
          DECLARE
            v_count NUMBER;
          BEGIN
            SELECT COUNT(*) INTO v_count
            FROM USER_TAB_COLUMNS
            WHERE TABLE_NAME = 'USERS' AND COLUMN_NAME = 'PIS_PASEP';
            
            IF v_count > 0 THEN
              EXECUTE IMMEDIATE 'ALTER TABLE USERS DROP COLUMN PIS_PASEP';
            END IF;
          END;
        `
      },
      {
        name: 'DROP_NOME_PAI',
        sql: `
          DECLARE
            v_count NUMBER;
          BEGIN
            SELECT COUNT(*) INTO v_count
            FROM USER_TAB_COLUMNS
            WHERE TABLE_NAME = 'USERS' AND COLUMN_NAME = 'NOME_PAI';
            
            IF v_count > 0 THEN
              EXECUTE IMMEDIATE 'ALTER TABLE USERS DROP COLUMN NOME_PAI';
            END IF;
          END;
        `
      },
      {
        name: 'DROP_NOME_MAE',
        sql: `
          DECLARE
            v_count NUMBER;
          BEGIN
            SELECT COUNT(*) INTO v_count
            FROM USER_TAB_COLUMNS
            WHERE TABLE_NAME = 'USERS' AND COLUMN_NAME = 'NOME_MAE';
            
            IF v_count > 0 THEN
              EXECUTE IMMEDIATE 'ALTER TABLE USERS DROP COLUMN NOME_MAE';
            END IF;
          END;
        `
      },
      {
        name: 'ADD_VINCULO_FUNCIONAL',
        sql: `
          DECLARE
            v_count NUMBER;
          BEGIN
            SELECT COUNT(*) INTO v_count
            FROM USER_TAB_COLUMNS
            WHERE TABLE_NAME = 'USERS' AND COLUMN_NAME = 'VINCULO_FUNCIONAL';
            
            IF v_count = 0 THEN
              EXECUTE IMMEDIATE 'ALTER TABLE USERS ADD VINCULO_FUNCIONAL VARCHAR2(2)';
            END IF;
          END;
        `
      }
    ];

    const results = [];

    for (const alteration of alterations) {
      try {
        await connection.execute(alteration.sql);
        results.push({
          name: alteration.name,
          status: 'success',
          message: `${alteration.name} executado com sucesso`
        });
      } catch (error: any) {
        results.push({
          name: alteration.name,
          status: 'error',
          message: error.message
        });
      }
    }

    // Verificar estrutura final
    const checkResult = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH, NULLABLE
      FROM USER_TAB_COLUMNS
      WHERE TABLE_NAME = 'USERS'
      AND (COLUMN_NAME LIKE '%FUNCIONAL%' OR COLUMN_NAME LIKE '%VINCULO%' OR COLUMN_NAME IN ('PIS_PASEP', 'NOME_PAI', 'NOME_MAE'))
      ORDER BY COLUMN_NAME
    `) as OracleResult;

    await connection.commit();

    res.json({
      success: true,
      message: 'Alterações na tabela USERS executadas',
      results,
      finalStructure: checkResult.rows
    });

  } catch (error: any) {
    console.error('Erro ao alterar tabela users:', error);

    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Erro no rollback:', rollbackError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao executar alterações na tabela users',
      error: error.message
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeError) {
        console.error('Erro ao fechar conexão:', closeError);
      }
    }
  }
});

// Endpoint para renomear tabelas em inglês para português
router.post('/rename-tables-to-portuguese', async (req: Request, res: Response): Promise<void> => {
  try {
    const renameOperations = [
      {
        name: 'RENAME_USERS_TO_USUARIOS',
        description: 'Renomear tabela USERS para USUARIOS',
        sql: 'ALTER TABLE USERS RENAME TO USUARIOS'
      },
      {
        name: 'DROP_DOCUMENTS_TABLE',
        description: 'Remover tabela DOCUMENTS duplicada (já existe DOCUMENTOS)',
        sql: 'DROP TABLE DOCUMENTS'
      },
      {
        name: 'DROP_SYSTEM_SETTINGS_TABLE',
        description: 'Remover tabela SYSTEM_SETTINGS duplicada (já existe CONFIGURACOES)',
        sql: 'DROP TABLE SYSTEM_SETTINGS'
      },
      {
        name: 'RENAME_PROCESSES_TO_PROCESSOS',
        description: 'Renomear tabela PROCESSES para PROCESSOS',
        sql: 'ALTER TABLE PROCESSES RENAME TO PROCESSOS'
      },
      {
        name: 'RENAME_PROCESS_COMMENTS_TO_COMENTARIOS_PROCESSO',
        description: 'Renomear tabela PROCESS_COMMENTS para COMENTARIOS_PROCESSO',
        sql: 'ALTER TABLE PROCESS_COMMENTS RENAME TO COMENTARIOS_PROCESSO'
      },
      {
        name: 'RENAME_PROCESS_HISTORY_TO_HISTORICO_PROCESSO',
        description: 'Renomear tabela PROCESS_HISTORY para HISTORICO_PROCESSO',
        sql: 'ALTER TABLE PROCESS_HISTORY RENAME TO HISTORICO_PROCESSO'
      }
    ];

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const operation of renameOperations) {
      try {
        console.log(`Executando: ${operation.name} - ${operation.description}`);

        const result = await DatabaseService.executeQuery(operation.sql);

        results.push({
          operation: operation.name,
          description: operation.description,
          status: 'SUCCESS',
          sql: operation.sql
        });

        successCount++;
        console.log(`✓ ${operation.name} executado com sucesso`);

      } catch (error: any) {
        console.error(`✗ Erro em ${operation.name}:`, error.message);

        results.push({
          operation: operation.name,
          description: operation.description,
          status: 'ERROR',
          error: error.message,
          sql: operation.sql
        });

        errorCount++;
      }
    }

    const summary = {
      totalOperations: renameOperations.length,
      successCount,
      errorCount,
      operations: results
    };

    console.log('\n=== RESUMO DA RENOMEAÇÃO ===');
    console.log(`Total de operações: ${summary.totalOperations}`);
    console.log(`Sucessos: ${summary.successCount}`);
    console.log(`Erros: ${summary.errorCount}`);

    res.status(200).json({
      success: true,
      message: 'Processo de renomeação concluído',
      summary
    });

  } catch (error: any) {
    console.error('Erro geral na renomeação de tabelas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao renomear tabelas',
      error: error.message
    });
  }
});

/**
 * Corrigir relacionamentos das tabelas PRAZOS, CONFIGURACOES, DOCUMENTOS e ENCOMENDAS
 */
router.post('/fix-table-relationships', async (req: Request, res: Response): Promise<void> => {
  let connection;
  const operations = [];
  const errors = [];

  try {
    await DatabaseService.ensureInitialized();
    connection = await DatabaseService.getConnection();

    // 1. TABELA PRAZOS - Adicionar relacionamentos faltantes
    const prazosOperations = [
      {
        name: 'ADD_PRAZOS_PROCESSO_FK',
        description: 'Adicionar foreign key PROCESSO_ID na tabela PRAZOS',
        sql: `ALTER TABLE PRAZOS ADD CONSTRAINT FK_PRAZOS_PROCESSO 
               FOREIGN KEY (PROCESSO_ID) REFERENCES PROCESSOS(ID) ON DELETE CASCADE`
      },
      {
        name: 'ADD_PRAZOS_USUARIO_FK',
        description: 'Adicionar foreign key USUARIO_RESPONSAVEL_ID na tabela PRAZOS',
        sql: `ALTER TABLE PRAZOS ADD CONSTRAINT FK_PRAZOS_USUARIO_RESPONSAVEL 
               FOREIGN KEY (USUARIO_RESPONSAVEL_ID) REFERENCES USUARIOS(ID)`
      }
    ];

    // 2. TABELA DOCUMENTOS - Adicionar relacionamentos faltantes
    const documentosOperations = [
      {
        name: 'ADD_DOCUMENTOS_PROCESSO_FK',
        description: 'Adicionar foreign key PROCESSO_ID na tabela DOCUMENTOS',
        sql: `ALTER TABLE DOCUMENTOS ADD CONSTRAINT FK_DOCUMENTOS_PROCESSO 
               FOREIGN KEY (PROCESSO_ID) REFERENCES PROCESSOS(ID) ON DELETE CASCADE`
      },
      {
        name: 'ADD_DOCUMENTOS_USUARIO_FK',
        description: 'Adicionar foreign key USUARIO_ID na tabela DOCUMENTOS',
        sql: `ALTER TABLE DOCUMENTOS ADD CONSTRAINT FK_DOCUMENTOS_USUARIO 
               FOREIGN KEY (USUARIO_ID) REFERENCES USUARIOS(ID)`
      }
    ];

    // 3. TABELA ENCOMENDAS - Adicionar relacionamentos faltantes
    const encomendasOperations = [
      {
        name: 'ADD_ENCOMENDAS_USUARIO_FK',
        description: 'Adicionar foreign key USUARIO_ID na tabela ENCOMENDAS',
        sql: `ALTER TABLE ENCOMENDAS ADD CONSTRAINT FK_ENCOMENDAS_USUARIO 
               FOREIGN KEY (USUARIO_ID) REFERENCES USUARIOS(ID)`
      },
      {
        name: 'ADD_ENCOMENDAS_SETOR_FK',
        description: 'Adicionar foreign key SETOR_ID na tabela ENCOMENDAS',
        sql: `ALTER TABLE ENCOMENDAS ADD CONSTRAINT FK_ENCOMENDAS_SETOR 
               FOREIGN KEY (SETOR_ID) REFERENCES SETORES(ID)`
      }
    ];

    // 4. TABELA CONFIGURACOES - Verificar se já tem relacionamentos corretos
    const configuracoesOperations = [
      {
        name: 'ADD_CONFIGURACOES_USUARIO_CRIACAO_COL',
        description: 'Adicionar coluna USUARIO_CRIACAO_ID na tabela CONFIGURACOES',
        sql: `ALTER TABLE CONFIGURACOES ADD USUARIO_CRIACAO_ID NUMBER`
      },
      {
        name: 'ADD_CONFIGURACOES_USUARIO_ALTERACAO_COL',
        description: 'Adicionar coluna USUARIO_ALTERACAO_ID na tabela CONFIGURACOES',
        sql: `ALTER TABLE CONFIGURACOES ADD USUARIO_ALTERACAO_ID NUMBER`
      },
      {
        name: 'ADD_CONFIGURACOES_USUARIO_CRIACAO_FK',
        description: 'Adicionar foreign key USUARIO_CRIACAO_ID na tabela CONFIGURACOES',
        sql: `ALTER TABLE CONFIGURACOES ADD CONSTRAINT FK_CONFIGURACOES_USUARIO_CRIACAO 
               FOREIGN KEY (USUARIO_CRIACAO_ID) REFERENCES USUARIOS(ID)`
      },
      {
        name: 'ADD_CONFIGURACOES_USUARIO_ALTERACAO_FK',
        description: 'Adicionar foreign key USUARIO_ALTERACAO_ID na tabela CONFIGURACOES',
        sql: `ALTER TABLE CONFIGURACOES ADD CONSTRAINT FK_CONFIGURACOES_USUARIO_ALTERACAO 
               FOREIGN KEY (USUARIO_ALTERACAO_ID) REFERENCES USUARIOS(ID)`
      }
    ];

    // Combinar todas as operações
    const allOperations = [
      ...prazosOperations,
      ...documentosOperations,
      ...encomendasOperations,
      ...configuracoesOperations
    ];

    // Executar cada operação
    for (const operation of allOperations) {
      try {
        console.log(`Executando: ${operation.name}`);

        // Verificar se a constraint já existe antes de criar
        if (operation.name.includes('_FK')) {
          const constraintName = operation.sql.match(/CONSTRAINT\s+(\w+)/i)?.[1];
          if (constraintName) {
            const checkResult = await connection.execute(
              `SELECT COUNT(*) as count FROM user_constraints WHERE constraint_name = :constraintName`,
              { constraintName }
            ) as OracleResult;

            if ((checkResult.rows?.[0] as any)?.COUNT > 0) {
              operations.push({
                operation: operation.name,
                status: 'SKIPPED',
                message: `Constraint ${constraintName} já existe`
              });
              continue;
            }
          }
        }

        // Verificar se a coluna já existe antes de criar
        if (operation.name.includes('_COL')) {
          const columnMatch = operation.sql.match(/ADD\s+(\w+)/i);
          const tableName = operation.description.match(/tabela\s+(\w+)/i)?.[1];
          if (columnMatch && tableName) {
            const columnName = columnMatch[1];
            const checkResult = await connection.execute(
              `SELECT COUNT(*) as count FROM user_tab_columns WHERE table_name = :tableName AND column_name = :columnName`,
              { tableName: tableName.toUpperCase(), columnName: columnName.toUpperCase() }
            ) as OracleResult;

            if ((checkResult.rows?.[0] as any)?.COUNT > 0) {
              operations.push({
                operation: operation.name,
                status: 'SKIPPED',
                message: `Coluna ${columnName} já existe na tabela ${tableName}`
              });
              continue;
            }
          }
        }

        await connection.execute(operation.sql);
        operations.push({
          operation: operation.name,
          status: 'SUCCESS',
          message: operation.description
        });

      } catch (error) {
        const errorMessage = (error as Error).message;
        console.error(`Erro em ${operation.name}:`, errorMessage);

        // Se o erro for que a constraint já existe, não é um erro crítico
        if (errorMessage.includes('ORA-02275') || errorMessage.includes('já existe')) {
          operations.push({
            operation: operation.name,
            status: 'SKIPPED',
            message: 'Relacionamento já existe'
          });
        } else {
          errors.push({
            operation: operation.name,
            error: errorMessage
          });
          operations.push({
            operation: operation.name,
            status: 'ERROR',
            message: errorMessage
          });
        }
      }
    }

    await connection.commit();
    await connection.close();

    const summary = {
      totalOperations: allOperations.length,
      successful: operations.filter(op => op.status === 'SUCCESS').length,
      skipped: operations.filter(op => op.status === 'SKIPPED').length,
      failed: operations.filter(op => op.status === 'ERROR').length
    };

    res.json({
      success: errors.length === 0,
      message: errors.length === 0
        ? 'Relacionamentos das tabelas corrigidos com sucesso!'
        : 'Alguns relacionamentos não puderam ser criados',
      summary,
      operations,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao corrigir relacionamentos:', error);
    if (connection) {
      try {
        await connection.rollback();
        await connection.close();
      } catch (closeError) {
        console.error('Erro ao fechar conexão:', closeError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao corrigir relacionamentos das tabelas',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Criar tabela SETORES e corrigir relacionamento com ENCOMENDAS
 */
router.post('/create-setores-table', async (req: Request, res: Response): Promise<void> => {
  let connection;
  const operations = [];
  const errors = [];

  try {
    await DatabaseService.ensureInitialized();
    connection = await DatabaseService.getConnection();

    // 1. Criar tabela SETORES
    const createSetoresOperation = {
      name: 'CREATE_SETORES_TABLE',
      description: 'Criar tabela SETORES',
      sql: `
        CREATE TABLE SETORES (
          ID NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
          CODIGO_SETOR VARCHAR2(20) UNIQUE NOT NULL,
          NOME_SETOR VARCHAR2(100) NOT NULL,
          ORGAO VARCHAR2(100),
          SETOR VARCHAR2(100),
          LOTACAO VARCHAR2(100),
          DESCRICAO VARCHAR2(255),
          ATIVO NUMBER(1) DEFAULT 1 CHECK (ATIVO IN (0, 1)),
          CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
    };

    // 2. Inserir dados básicos na tabela SETORES
    const insertSetoresData = {
      name: 'INSERT_SETORES_DATA',
      description: 'Inserir dados básicos na tabela SETORES',
      sql: `
        INSERT ALL
          INTO SETORES (CODIGO_SETOR, NOME_SETOR, ORGAO, SETOR, LOTACAO, ATIVO) 
          VALUES ('ADMIN', 'ADMINISTRAÇÃO', 'SECRETARIA', 'ADMINISTRAÇÃO GERAL', 'SEDE', 1)
          INTO SETORES (CODIGO_SETOR, NOME_SETOR, ORGAO, SETOR, LOTACAO, ATIVO) 
          VALUES ('PROTOCOLO', 'PROTOCOLO', 'SECRETARIA', 'PROTOCOLO E ARQUIVO', 'SEDE', 1)
          INTO SETORES (CODIGO_SETOR, NOME_SETOR, ORGAO, SETOR, LOTACAO, ATIVO) 
          VALUES ('JURIDICO', 'JURÍDICO', 'SECRETARIA', 'ASSESSORIA JURÍDICA', 'SEDE', 1)
          INTO SETORES (CODIGO_SETOR, NOME_SETOR, ORGAO, SETOR, LOTACAO, ATIVO) 
          VALUES ('FINANCEIRO', 'FINANCEIRO', 'SECRETARIA', 'SETOR FINANCEIRO', 'SEDE', 1)
        SELECT 1 FROM DUAL
      `
    };

    // 3. Criar índices para a tabela SETORES
    const createIndexesOperation = {
      name: 'CREATE_SETORES_INDEXES',
      description: 'Criar índices para a tabela SETORES',
      sql: `
        BEGIN
          EXECUTE IMMEDIATE 'CREATE INDEX IDX_SETORES_CODIGO ON SETORES(CODIGO_SETOR)';
          EXECUTE IMMEDIATE 'CREATE INDEX IDX_SETORES_ATIVO ON SETORES(ATIVO)';
          EXECUTE IMMEDIATE 'CREATE INDEX IDX_SETORES_ORGAO ON SETORES(ORGAO)';
        END;
      `
    };

    // 4. Adicionar foreign key na tabela ENCOMENDAS
    const addEncomendaSetorFK = {
      name: 'ADD_ENCOMENDAS_SETOR_FK',
      description: 'Adicionar foreign key SETOR_ID na tabela ENCOMENDAS',
      sql: `ALTER TABLE ENCOMENDAS ADD CONSTRAINT FK_ENCOMENDAS_SETOR 
             FOREIGN KEY (SETOR_ID) REFERENCES SETORES(ID)`
    };

    const allOperations = [
      createSetoresOperation,
      insertSetoresData,
      createIndexesOperation,
      addEncomendaSetorFK
    ];

    // Executar cada operação
    for (const operation of allOperations) {
      try {
        console.log(`Executando: ${operation.name}`);

        // Verificar se a tabela SETORES já existe
        if (operation.name === 'CREATE_SETORES_TABLE') {
          const checkResult = await connection.execute(
            `SELECT COUNT(*) as count FROM user_tables WHERE table_name = 'SETORES'`
          ) as OracleResult;

          if ((checkResult.rows?.[0] as any)?.COUNT > 0) {
            operations.push({
              operation: operation.name,
              status: 'SKIPPED',
              message: 'Tabela SETORES já existe'
            });
            continue;
          }
        }

        // Verificar se a constraint já existe
        if (operation.name.includes('_FK')) {
          const constraintName = operation.sql.match(/CONSTRAINT\s+(\w+)/i)?.[1];
          if (constraintName) {
            const checkResult = await connection.execute(
              `SELECT COUNT(*) as count FROM user_constraints WHERE constraint_name = :constraintName`,
              { constraintName }
            ) as OracleResult;

            if ((checkResult.rows?.[0] as any)?.COUNT > 0) {
              operations.push({
                operation: operation.name,
                status: 'SKIPPED',
                message: `Constraint ${constraintName} já existe`
              });
              continue;
            }
          }
        }

        await connection.execute(operation.sql);
        operations.push({
          operation: operation.name,
          status: 'SUCCESS',
          message: operation.description
        });

      } catch (error) {
        const errorMessage = (error as Error).message;
        console.error(`Erro em ${operation.name}:`, errorMessage);

        // Se o erro for que já existe, não é um erro crítico
        if (errorMessage.includes('ORA-00955') || errorMessage.includes('já existe')) {
          operations.push({
            operation: operation.name,
            status: 'SKIPPED',
            message: 'Objeto já existe'
          });
        } else {
          errors.push({
            operation: operation.name,
            error: errorMessage
          });
          operations.push({
            operation: operation.name,
            status: 'ERROR',
            message: errorMessage
          });
        }
      }
    }

    await connection.commit();
    await connection.close();

    const summary = {
      totalOperations: allOperations.length,
      successful: operations.filter(op => op.status === 'SUCCESS').length,
      skipped: operations.filter(op => op.status === 'SKIPPED').length,
      failed: operations.filter(op => op.status === 'ERROR').length
    };

    res.json({
      success: errors.length === 0,
      message: errors.length === 0
        ? 'Tabela SETORES criada e relacionamentos corrigidos com sucesso!'
        : 'Alguns relacionamentos não puderam ser criados',
      summary,
      operations,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao criar tabela SETORES:', error);
    if (connection) {
      try {
        await connection.rollback();
        await connection.close();
      } catch (closeError) {
        console.error('Erro ao fechar conexão:', closeError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao criar tabela SETORES e relacionamentos',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint para adicionar campos de endereço na tabela SETORES
router.post('/add-endereco-fields-setores', async (req: Request, res: Response): Promise<void> => {
  try {
    await DatabaseService.ensureInitialized();
    const connection = await DatabaseService.getConnection();

    const operations = [
      {
        name: 'ADD_LOGRADOURO',
        sql: `ALTER TABLE SETORES ADD (LOGRADOURO VARCHAR2(200))`,
        description: 'Adicionar campo LOGRADOURO'
      },
      {
        name: 'ADD_NUMERO',
        sql: `ALTER TABLE SETORES ADD (NUMERO VARCHAR2(20))`,
        description: 'Adicionar campo NUMERO'
      },
      {
        name: 'ADD_COMPLEMENTO',
        sql: `ALTER TABLE SETORES ADD (COMPLEMENTO VARCHAR2(100))`,
        description: 'Adicionar campo COMPLEMENTO'
      },
      {
        name: 'ADD_BAIRRO',
        sql: `ALTER TABLE SETORES ADD (BAIRRO VARCHAR2(100))`,
        description: 'Adicionar campo BAIRRO'
      },
      {
        name: 'ADD_CIDADE',
        sql: `ALTER TABLE SETORES ADD (CIDADE VARCHAR2(100))`,
        description: 'Adicionar campo CIDADE'
      },
      {
        name: 'ADD_ESTADO',
        sql: `ALTER TABLE SETORES ADD (ESTADO VARCHAR2(2))`,
        description: 'Adicionar campo ESTADO (UF)'
      },
      {
        name: 'ADD_CEP',
        sql: `ALTER TABLE SETORES ADD (CEP VARCHAR2(10))`,
        description: 'Adicionar campo CEP'
      },
      {
        name: 'ADD_TELEFONE',
        sql: `ALTER TABLE SETORES ADD (TELEFONE VARCHAR2(20))`,
        description: 'Adicionar campo TELEFONE'
      },
      {
        name: 'ADD_EMAIL',
        sql: `ALTER TABLE SETORES ADD (EMAIL VARCHAR2(100))`,
        description: 'Adicionar campo EMAIL'
      }
    ];

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const operation of operations) {
      try {
        // Verificar se a coluna já existe
        const checkColumnSql = `
          SELECT COUNT(*) as COLUMN_EXISTS 
          FROM user_tab_columns 
          WHERE table_name = 'SETORES' 
          AND column_name = '${operation.name.replace('ADD_', '')}'
        `;

        const checkResult = await connection.execute(checkColumnSql) as OracleResult;
        const columnExists = checkResult.rows?.[0]?.COLUMN_EXISTS > 0;

        if (columnExists) {
          results.push({
            operation: operation.name,
            description: operation.description,
            status: 'IGNORED',
            message: 'Coluna já existe'
          });
          continue;
        }

        await connection.execute(operation.sql);
        results.push({
          operation: operation.name,
          description: operation.description,
          status: 'SUCCESS',
          message: 'Coluna adicionada com sucesso'
        });
        successCount++;
      } catch (error: any) {
        results.push({
          operation: operation.name,
          description: operation.description,
          status: 'ERROR',
          message: error.message
        });
        errorCount++;
      }
    }

    await connection.close();

    res.json({
      success: true,
      message: `Operações concluídas: ${successCount} sucessos, ${errorCount} erros`,
      summary: {
        total: operations.length,
        success: successCount,
        errors: errorCount,
        ignored: operations.length - successCount - errorCount
      },
      results
    });
  } catch (error: any) {
    console.error('Erro ao adicionar campos de endereço:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar campos de endereço na tabela SETORES',
      error: error.message
    });
  }
});

/**
 * Adicionar coluna SENHA_ALTERADA na tabela USUARIOS (se não existir)
 * @route POST /api/database/add-senha-alterada
 * @access Private (executar apenas por administradores)
 */
router.post('/add-senha-alterada', async (req: Request, res: Response): Promise<void> => {
  let connection;
  try {
    await DatabaseService.ensureInitialized();
    connection = await DatabaseService.getConnection();

    // Verificar se a tabela USUARIOS existe
    const tableCheck = await connection.execute(
      `SELECT COUNT(*) AS COUNT FROM user_tables WHERE table_name = 'USUARIOS'`
    ) as OracleResult;
    const tableExists = (tableCheck.rows?.[0] as any)?.COUNT > 0;
    if (!tableExists) {
      await connection.close();
      res.status(400).json({
        success: false,
        message: 'Tabela USUARIOS não existe no schema atual'
      });
      return;
    }

    // Verificar se a coluna já existe
    const columnCheck = await connection.execute(
      `SELECT COUNT(*) AS COUNT FROM USER_TAB_COLUMNS WHERE TABLE_NAME = 'USUARIOS' AND COLUMN_NAME = 'SENHA_ALTERADA'`
    ) as OracleResult;
    const columnExists = (columnCheck.rows?.[0] as any)?.COUNT > 0;

    if (!columnExists) {
      // Adicionar a coluna com default 'N'
      const alterSql = `ALTER TABLE USUARIOS ADD (SENHA_ALTERADA VARCHAR2(1) DEFAULT 'N')`;
      await connection.execute(alterSql);
      // Padronizar registros existentes para 'N'
      await connection.execute(`UPDATE USUARIOS SET SENHA_ALTERADA = 'N' WHERE SENHA_ALTERADA IS NULL`);
      await connection.commit();
    }

    await connection.close();
    res.json({
      success: true,
      message: columnExists ? 'Coluna SENHA_ALTERADA já existe em USUARIOS' : 'Coluna SENHA_ALTERADA adicionada com sucesso em USUARIOS',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao adicionar coluna SENHA_ALTERADA:', error);
    if (connection) {
      try {
        await connection.rollback();
        await connection.close();
      } catch (closeError) {
        console.error('Erro ao fechar conexão:', closeError);
      }
    }
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar coluna SENHA_ALTERADA em USUARIOS',
      error: (error as Error).message
    });
  }
});

export default router;