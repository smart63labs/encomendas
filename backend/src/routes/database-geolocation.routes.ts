import { Router, Request, Response } from 'express';
import { DatabaseService } from '../config/database';

interface OracleResult {
  rows?: any[];
}

const router = Router();

// POST /api/database/add-latitude-field - Adicionar apenas campo LATITUDE
router.post('/add-latitude-field', async (req: Request, res: Response): Promise<void> => {
  let connection;
  
  try {
    await DatabaseService.ensureInitialized();
    connection = await DatabaseService.getConnection();

    console.log('🔧 Adicionando campo LATITUDE...');

    const sql = `ALTER TABLE SETORES ADD (LATITUDE NUMBER(10,8))`;
    await connection.execute(sql);
    await connection.commit();
    await connection.close();

    res.json({
      success: true,
      message: 'Campo LATITUDE adicionado com sucesso!',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao adicionar campo LATITUDE:', error);
    if (connection) {
      try {
        await connection.rollback();
        await connection.close();
      } catch (closeError) {
        console.error('Erro ao fechar conexão:', closeError);
      }
    }
    
    const errorMsg = (error as Error).message;
    if (errorMsg.includes('ORA-01430') || errorMsg.includes('already exists')) {
      res.json({
        success: true,
        message: 'Campo LATITUDE já existe',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erro ao adicionar campo LATITUDE',
        error: errorMsg,
        timestamp: new Date().toISOString()
      });
    }
  }
});

// POST /api/database/add-longitude-field - Adicionar apenas campo LONGITUDE
router.post('/add-longitude-field', async (req: Request, res: Response): Promise<void> => {
  let connection;
  
  try {
    await DatabaseService.ensureInitialized();
    connection = await DatabaseService.getConnection();

    console.log('🔧 Adicionando campo LONGITUDE...');

    const sql = `ALTER TABLE SETORES ADD (LONGITUDE NUMBER(11,8))`;
    await connection.execute(sql);
    await connection.commit();
    await connection.close();

    res.json({
      success: true,
      message: 'Campo LONGITUDE adicionado com sucesso!',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao adicionar campo LONGITUDE:', error);
    if (connection) {
      try {
        await connection.rollback();
        await connection.close();
      } catch (closeError) {
        console.error('Erro ao fechar conexão:', closeError);
      }
    }
    
    const errorMsg = (error as Error).message;
    if (errorMsg.includes('ORA-01430') || errorMsg.includes('already exists')) {
      res.json({
        success: true,
        message: 'Campo LONGITUDE já existe',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erro ao adicionar campo LONGITUDE',
        error: errorMsg,
        timestamp: new Date().toISOString()
      });
    }
  }
});

// POST /api/database/add-geolocation-fields - Adicionar campos de geolocalização na tabela SETORES
router.post('/add-geolocation-fields', async (req: Request, res: Response): Promise<void> => {
  let connection;
  const operations = [];
  const errors = [];

  try {
    await DatabaseService.ensureInitialized();
    connection = await DatabaseService.getConnection();

    console.log('🔧 Iniciando adição dos campos de geolocalização...');

    // 1. Verificar se os campos já existem
    const checkFieldsOperation = {
      name: 'CHECK_GEOLOCATION_FIELDS',
      description: 'Verificar se os campos LATITUDE e LONGITUDE já existem',
      sql: `
        SELECT COUNT(*) as FIELD_COUNT
        FROM USER_TAB_COLUMNS
        WHERE TABLE_NAME = 'SETORES'
        AND COLUMN_NAME IN ('LATITUDE', 'LONGITUDE')
      `
    };

    try {
      const checkResult = await connection.execute(checkFieldsOperation.sql) as OracleResult;
      const fieldCount = checkResult.rows?.[0]?.FIELD_COUNT || 0;
      
      operations.push({
        ...checkFieldsOperation,
        status: 'SUCCESS',
        result: `Encontrados ${fieldCount} campos de geolocalização existentes`
      });

      if (fieldCount >= 2) {
        await connection.close();
        res.json({
          success: true,
          message: 'Campos de geolocalização já existem na tabela SETORES',
          operations,
          timestamp: new Date().toISOString()
        });
        return;
      }
    } catch (error) {
      errors.push({
        operation: checkFieldsOperation.name,
        error: (error as Error).message
      });
    }

    // Aguardar um pouco para evitar conflitos de DDL
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Adicionar campo LATITUDE
    const addLatitudeOperation = {
      name: 'ADD_LATITUDE_FIELD',
      description: 'Adicionar campo LATITUDE',
      sql: `ALTER TABLE SETORES ADD (LATITUDE NUMBER(10,8))`
    };

    try {
      await connection.execute(addLatitudeOperation.sql);
      await connection.commit();
      operations.push({
        ...addLatitudeOperation,
        status: 'SUCCESS',
        result: 'Campo LATITUDE adicionado com sucesso'
      });
    } catch (error) {
      const errorMsg = (error as Error).message;
      if (errorMsg.includes('ORA-01430') || errorMsg.includes('already exists')) {
        operations.push({
          ...addLatitudeOperation,
          status: 'SKIPPED',
          result: 'Campo LATITUDE já existe'
        });
      } else {
        errors.push({
          operation: addLatitudeOperation.name,
          error: errorMsg
        });
      }
    }

    // Aguardar antes da próxima operação DDL
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Adicionar campo LONGITUDE
    const addLongitudeOperation = {
      name: 'ADD_LONGITUDE_FIELD',
      description: 'Adicionar campo LONGITUDE',
      sql: `ALTER TABLE SETORES ADD (LONGITUDE NUMBER(11,8))`
    };

    try {
      await connection.execute(addLongitudeOperation.sql);
      await connection.commit();
      operations.push({
        ...addLongitudeOperation,
        status: 'SUCCESS',
        result: 'Campo LONGITUDE adicionado com sucesso'
      });
    } catch (error) {
      const errorMsg = (error as Error).message;
      if (errorMsg.includes('ORA-01430') || errorMsg.includes('already exists')) {
        operations.push({
          ...addLongitudeOperation,
          status: 'SKIPPED',
          result: 'Campo LONGITUDE já existe'
        });
      } else {
        errors.push({
          operation: addLongitudeOperation.name,
          error: errorMsg
        });
      }
    }

    // Aguardar antes das próximas operações
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. Adicionar comentários nos campos
    const addCommentsOperations = [
      {
        name: 'ADD_LATITUDE_COMMENT',
        description: 'Adicionar comentário no campo LATITUDE',
        sql: `COMMENT ON COLUMN SETORES.LATITUDE IS 'Latitude da localização do setor (formato decimal)'`
      },
      {
        name: 'ADD_LONGITUDE_COMMENT',
        description: 'Adicionar comentário no campo LONGITUDE',
        sql: `COMMENT ON COLUMN SETORES.LONGITUDE IS 'Longitude da localização do setor (formato decimal)'`
      }
    ];

    for (const commentOp of addCommentsOperations) {
      try {
        await connection.execute(commentOp.sql);
        operations.push({
          ...commentOp,
          status: 'SUCCESS',
          result: 'Comentário adicionado com sucesso'
        });
      } catch (error) {
        errors.push({
          operation: commentOp.name,
          error: (error as Error).message
        });
      }
    }

    // 5. Criar índice de geolocalização
    const createIndexOperation = {
      name: 'CREATE_GEOLOCATION_INDEX',
      description: 'Criar índice para os campos de geolocalização',
      sql: `CREATE INDEX IDX_SETORES_GEOLOCATION ON SETORES(LATITUDE, LONGITUDE)`
    };

    try {
      await connection.execute(createIndexOperation.sql);
      operations.push({
        ...createIndexOperation,
        status: 'SUCCESS',
        result: 'Índice de geolocalização criado com sucesso'
      });
    } catch (error) {
      const errorMsg = (error as Error).message;
      if (errorMsg.includes('ORA-00955') || errorMsg.includes('already exists')) {
        operations.push({
          ...createIndexOperation,
          status: 'SKIPPED',
          result: 'Índice de geolocalização já existe'
        });
      } else {
        errors.push({
          operation: createIndexOperation.name,
          error: errorMsg
        });
      }
    }

    // 6. Verificar estrutura final
    const verifyStructureOperation = {
      name: 'VERIFY_FINAL_STRUCTURE',
      description: 'Verificar estrutura final da tabela SETORES',
      sql: `
        SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH, DATA_PRECISION, DATA_SCALE, NULLABLE
        FROM USER_TAB_COLUMNS
        WHERE TABLE_NAME = 'SETORES'
        AND COLUMN_NAME IN ('LATITUDE', 'LONGITUDE')
        ORDER BY COLUMN_NAME
      `
    };

    try {
      const verifyResult = await connection.execute(verifyStructureOperation.sql) as OracleResult;
      operations.push({
        ...verifyStructureOperation,
        status: 'SUCCESS',
        result: `Estrutura verificada: ${verifyResult.rows?.length || 0} campos de geolocalização encontrados`,
        data: verifyResult.rows
      });
    } catch (error) {
      errors.push({
        operation: verifyStructureOperation.name,
        error: (error as Error).message
      });
    }

    await connection.commit();
    await connection.close();

    // Preparar resumo
    const summary = {
      totalOperations: operations.length,
      successfulOperations: operations.filter(op => op.status === 'SUCCESS').length,
      skippedOperations: operations.filter(op => op.status === 'SKIPPED').length,
      failedOperations: errors.length
    };

    res.json({
      success: errors.length === 0,
      message: errors.length === 0 
        ? 'Campos de geolocalização adicionados com sucesso!' 
        : 'Alguns campos não puderam ser criados',
      summary,
      operations,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao adicionar campos de geolocalização:', error);
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
      message: 'Erro ao adicionar campos de geolocalização',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;