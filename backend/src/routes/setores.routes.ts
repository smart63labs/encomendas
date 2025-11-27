import { Router, Request, Response } from 'express';
import { DatabaseService } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

interface OracleRow {
  [key: string]: any;
}

interface OracleResult {
  rows?: OracleRow[];
}

export interface Setor {
  id?: number;
  codigoSetor: string;
  nomeSetor: string;
  orgao?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  ativo?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const router = Router();

// GET /api/setores - Listar todos os setores
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    await DatabaseService.ensureInitialized();
    const connection = await DatabaseService.getConnection();
    
    const { page = 1, limit = 10, search = '', ativo = 'true' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    let whereClause = 'WHERE 1=1';
    const params: any = {};
    
    if (search) {
      whereClause += ` AND (UPPER(NOME_SETOR) LIKE UPPER(:search) OR UPPER(CODIGO_SETOR) LIKE UPPER(:search) OR UPPER(ORGAO) LIKE UPPER(:search))`;
      params.search = `%${search}%`;
    }
    
    if (ativo !== 'all') {
      whereClause += ` AND ATIVO = :ativo`;
      params.ativo = ativo === 'true' ? 1 : 0;
    }
    
    const countSql = `SELECT COUNT(*) as TOTAL FROM SETORES ${whereClause}`;
    const countResult = await connection.execute(countSql, params) as OracleResult;
    const total = countResult.rows?.[0]?.TOTAL || 0;
    
    const sql = `
      SELECT * FROM (
        SELECT s.*, ROW_NUMBER() OVER (ORDER BY s.NOME_SETOR) as RN
        FROM SETORES s
        ${whereClause}
      ) WHERE RN > :offset AND RN <= :limit_offset
    `;
    
    params.offset = offset;
    params.limit_offset = offset + Number(limit);
    
    const result = await connection.execute(sql, params) as OracleResult;
    
    // Converter ATIVO de string para boolean (Oracle retorna '0' ou '1' como string)
    const processedData = (result.rows || []).map(row => ({
      ...row,
      ATIVO: row.ATIVO === '1' || row.ATIVO === 1
    }));
    
    await connection.close();
    
    res.json({
      success: true,
      data: processedData,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Erro ao listar setores:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar setores',
      error: error.message
    });
  }
});

// GET /api/setores/:id - Buscar setor por ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await DatabaseService.ensureInitialized();
    const connection = await DatabaseService.getConnection();
    
    const { id } = req.params;
    
    const sql = 'SELECT * FROM SETORES WHERE ID = :id';
    const result = await connection.execute(sql, { id }) as OracleResult;
    
    await connection.close();
    
    if (!result.rows || result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Setor não encontrado'
      });
      return;
    }

    // Converter ATIVO de string para boolean (Oracle retorna '0' ou '1' como string)
    const processedSetor = {
      ...result.rows[0],
      ATIVO: result.rows[0].ATIVO === '1' || result.rows[0].ATIVO === 1
    };
    
    res.json({
      success: true,
      data: processedSetor
    });
  } catch (error: any) {
    console.error('Erro ao buscar setor:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar setor',
      error: error.message
    });
  }
});

// POST /api/setores - Criar novo setor
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    await DatabaseService.ensureInitialized();
    const connection = await DatabaseService.getConnection();
    
    const {
      codigoSetor,
      nomeSetor,
      orgao,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      cep,
      telefone,
      email,
      latitude,
      longitude,
      ativo = true
    }: Setor = req.body;
    
    // Normalizar código do setor (remover espaços extras)
    const codigoSetorNorm = String(codigoSetor || '').trim();
    
    if (!codigoSetorNorm || !nomeSetor) {
      res.status(400).json({
        success: false,
        message: 'Código do setor e nome são obrigatórios'
      });
      return;
    }
    
    // Verificar se o código já existe
    const checkSql = 'SELECT COUNT(*) as COUNT FROM SETORES WHERE CODIGO_SETOR = :codigo';
    const checkResult = await connection.execute(checkSql, { codigo: codigoSetorNorm }) as OracleResult;
    
    if (checkResult.rows?.[0]?.COUNT > 0) {
      await connection.close();
      res.status(400).json({
        success: false,
        message: 'Código do setor já existe'
      });
      return;
    }
    
    const sql = `
      INSERT INTO SETORES (
        CODIGO_SETOR, NOME_SETOR, ORGAO,
        LOGRADOURO, NUMERO, COMPLEMENTO, BAIRRO, CIDADE, ESTADO, CEP,
        TELEFONE, EMAIL, LATITUDE, LONGITUDE, ATIVO
      ) VALUES (
        :codigoSetor, :nomeSetor, :orgao,
        :logradouro, :numero, :complemento, :bairro, :cidade, :estado, :cep,
        :telefone, :email, :latitude, :longitude, :ativo
      )
    `;
    
    await connection.execute(sql, {
      codigoSetor: codigoSetorNorm,
      nomeSetor,
      orgao: orgao || null,
      logradouro: logradouro || null,
      numero: numero || null,
      complemento: complemento || null,
      bairro: bairro || null,
      cidade: cidade || null,
      estado: estado || null,
      cep: cep || null,
      telefone: telefone || null,
      email: email || null,
      latitude: latitude || null,
      longitude: longitude || null,
      ativo: ativo ? 1 : 0
    });
    
    await connection.commit();
    await connection.close();
    
    res.status(201).json({
      success: true,
      message: 'Setor criado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao criar setor:', error);
    const message = String(error?.message || '');
    if (message.includes('ORA-00001')) {
      // Violar PK/UNIQUE (ex.: ID fora de sincronia ou código duplicado)
      res.status(400).json({
        success: false,
        message: 'Registro já existe (violação de constraint única)',
        error: 'ORA-00001'
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Erro ao criar setor',
      error: error.message
    });
  }
});

// PUT /api/setores/:id - Atualizar setor
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await DatabaseService.ensureInitialized();
    const connection = await DatabaseService.getConnection();
    
    const { id } = req.params;
    const {
      codigoSetor,
      nomeSetor,
      orgao,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      cep,
      telefone,
      email,
      ativo,
      latitude,
      longitude
    }: Setor = req.body;
    
    if (!codigoSetor || !nomeSetor) {
      res.status(400).json({
        success: false,
        message: 'Código do setor e nome são obrigatórios'
      });
      return;
    }
    
    // Verificar se o setor existe
    const checkSql = 'SELECT COUNT(*) as COUNT FROM SETORES WHERE ID = :id';
    const checkResult = await connection.execute(checkSql, { id }) as OracleResult;
    
    if (checkResult.rows?.[0]?.COUNT === 0) {
      await connection.close();
      res.status(404).json({
        success: false,
        message: 'Setor não encontrado'
      });
      return;
    }
    
    // Verificar se o código já existe em outro setor
    const checkCodeSql = 'SELECT COUNT(*) as COUNT FROM SETORES WHERE CODIGO_SETOR = :codigo AND ID != :id';
    const checkCodeResult = await connection.execute(checkCodeSql, { codigo: codigoSetor, id }) as OracleResult;
    
    if (checkCodeResult.rows?.[0]?.COUNT > 0) {
      await connection.close();
      res.status(400).json({
        success: false,
        message: 'Código do setor já existe em outro registro'
      });
      return;
    }
    
    // Buscar dados atuais do setor para preservar valores não enviados
    const getCurrentSql = 'SELECT * FROM SETORES WHERE ID = :id';
    const currentResult = await connection.execute(getCurrentSql, { id }) as OracleResult;
    const currentSetor = currentResult.rows?.[0] as any;

    const sql = `
      UPDATE SETORES SET
        CODIGO_SETOR = :codigoSetor,
        NOME_SETOR = :nomeSetor,
        ORGAO = :orgao,
        LOGRADOURO = :logradouro,
        NUMERO = :numero,
        COMPLEMENTO = :complemento,
        BAIRRO = :bairro,
        CIDADE = :cidade,
        ESTADO = :estado,
        CEP = :cep,
        TELEFONE = :telefone,
        EMAIL = :email,
        ATIVO = :ativo,
        LATITUDE = :latitude,
        LONGITUDE = :longitude,
        DATA_ATUALIZACAO = CURRENT_TIMESTAMP
      WHERE ID = :id
    `;
    
    await connection.execute(sql, {
      id,
      codigoSetor,
      nomeSetor,
      // Preservar valores existentes se não foram enviados ou estão vazios
      orgao: orgao !== undefined && orgao !== '' ? orgao : currentSetor?.ORGAO,
      logradouro: logradouro !== undefined && logradouro !== '' ? logradouro : currentSetor?.LOGRADOURO,
      numero: numero !== undefined && numero !== '' ? numero : currentSetor?.NUMERO,
      complemento: complemento !== undefined && complemento !== '' ? complemento : currentSetor?.COMPLEMENTO,
      bairro: bairro !== undefined && bairro !== '' ? bairro : currentSetor?.BAIRRO,
      cidade: cidade !== undefined && cidade !== '' ? cidade : currentSetor?.CIDADE,
      estado: estado !== undefined && estado !== '' ? estado : currentSetor?.ESTADO,
      cep: cep !== undefined && cep !== '' ? cep : currentSetor?.CEP,
      telefone: telefone !== undefined && telefone !== '' ? telefone : currentSetor?.TELEFONE,
      email: email !== undefined && email !== '' ? email : currentSetor?.EMAIL,
      ativo: ativo !== undefined ? (ativo ? 1 : 0) : currentSetor?.ATIVO,
      latitude: latitude !== undefined && latitude !== null ? latitude : currentSetor?.LATITUDE,
      longitude: longitude !== undefined && longitude !== null ? longitude : currentSetor?.LONGITUDE
    });
    
    await connection.commit();
    await connection.close();
    
    res.json({
      success: true,
      message: 'Setor atualizado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao atualizar setor:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar setor',
      error: error.message
    });
  }
});

// DELETE /api/setores/:id - Excluir setor (soft delete)
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await DatabaseService.ensureInitialized();
    const connection = await DatabaseService.getConnection();
    
    const { id } = req.params;
    
    // Verificar se o setor existe
    const checkSql = 'SELECT COUNT(*) as COUNT FROM SETORES WHERE ID = :id';
    const checkResult = await connection.execute(checkSql, { id }) as OracleResult;
    
    if (checkResult.rows?.[0]?.COUNT === 0) {
      await connection.close();
      res.status(404).json({
        success: false,
        message: 'Setor não encontrado'
      });
      return;
    }
    
    // Verificar se o setor está sendo usado em outras tabelas
    const checkUsageSql = `
      SELECT COUNT(*) as COUNT FROM (
        SELECT 1 FROM ENCOMENDAS WHERE SETOR_ORIGEM_ID = :id OR SETOR_DESTINO_ID = :id
        UNION ALL
        SELECT 1 FROM USUARIOS WHERE SETOR_ID = :id
      )
    `;
    const checkUsageResult = await connection.execute(checkUsageSql, { id }) as OracleResult;
    
    if (checkUsageResult.rows?.[0]?.COUNT > 0) {
      // Soft delete - apenas desativar
      const softDeleteSql = 'UPDATE SETORES SET ATIVO = 0, DATA_ATUALIZACAO = CURRENT_TIMESTAMP WHERE ID = :id';
      await connection.execute(softDeleteSql, { id });
      await connection.commit();
      await connection.close();
      
      res.json({
        success: true,
        message: 'Setor desativado com sucesso (possui registros vinculados)'
      });
      return;
    }
    
    // Hard delete - remover completamente
    const deleteSql = 'DELETE FROM SETORES WHERE ID = :id';
    await connection.execute(deleteSql, { id });
    
    await connection.commit();
    await connection.close();
    
    res.json({
      success: true,
      message: 'Setor excluído com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao excluir setor:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir setor',
      error: error.message
    });
  }
});

// PUT /api/setores/:id/geolocation - Atualizar coordenadas de geolocalização do setor
router.put('/:id/geolocation', async (req: Request, res: Response): Promise<void> => {
  try {
    await DatabaseService.ensureInitialized();
    const connection = await DatabaseService.getConnection();
    
    const { id } = req.params;
    const { latitude, longitude } = req.body;
    
    // Validar parâmetros
    if (!latitude || !longitude) {
      res.status(400).json({
        success: false,
        message: 'Latitude e longitude são obrigatórios'
      });
      return;
    }
    
    // Validar se são números válidos
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({
        success: false,
        message: 'Latitude e longitude devem ser números válidos'
      });
      return;
    }
    
    // Validar limites geográficos (Brasil aproximadamente)
    if (lat < -35 || lat > 5 || lng < -75 || lng > -30) {
      res.status(400).json({
        success: false,
        message: 'Coordenadas fora dos limites válidos para o Brasil'
      });
      return;
    }
    
    // Verificar se o setor existe
    const checkSql = 'SELECT COUNT(*) as COUNT FROM SETORES WHERE ID = :id';
    const checkResult = await connection.execute(checkSql, { id }) as OracleResult;
    
    if (checkResult.rows?.[0]?.COUNT === 0) {
      await connection.close();
      res.status(404).json({
        success: false,
        message: 'Setor não encontrado'
      });
      return;
    }
    
    // Atualizar coordenadas
    const updateSql = `
      UPDATE SETORES 
      SET LATITUDE = :latitude, 
          LONGITUDE = :longitude,
          DATA_ATUALIZACAO = CURRENT_TIMESTAMP
      WHERE ID = :id
    `;
    
    await connection.execute(updateSql, {
      latitude: lat,
      longitude: lng,
      id: id
    });
    
    await connection.commit();
    await connection.close();
    
    res.json({
      success: true,
      message: 'Coordenadas de geolocalização atualizadas com sucesso',
      data: {
        id: id,
        latitude: lat,
        longitude: lng
      }
    });
  } catch (error: any) {
    console.error('Erro ao atualizar geolocalização do setor:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar geolocalização do setor',
      error: error.message
    });
  }
});

// POST /api/setores/import-csv - Importar setores do arquivo CSV
router.post('/import-csv', async (req: Request, res: Response): Promise<void> => {
  let connection;
  
  try {
    await DatabaseService.ensureInitialized();
    connection = await DatabaseService.getConnection();
    
    const csvFilePath = path.join(__dirname, '..', '..', '..', 'docs', 'SETORES_NORMALIZADO_PROCESSADO.CSV');
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(csvFilePath)) {
      res.status(400).json({
        success: false,
        message: 'Arquivo CSV não encontrado',
        path: csvFilePath
      });
      return;
    }
    
    // Ler o arquivo CSV
    let csvContent = fs.readFileSync(csvFilePath, 'utf8'); // Ler como UTF-8
    
    // Remover BOM se existir
    if (csvContent.charCodeAt(0) === 0xFEFF) {
      csvContent = csvContent.slice(1);
    }
    
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length <= 1) {
      res.status(400).json({
        success: false,
        message: 'Arquivo CSV vazio ou sem dados'
      });
      return;
    }
    
    // Processar cabeçalho
    const headers = lines[0].split(';').map(h => h.trim());
    console.log('Cabeçalhos encontrados:', headers);
    
    let insertedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    // Processar cada linha de dados
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(';').map(v => v.trim());
        
        if (values.length !== headers.length) {
          errors.push(`Linha ${i + 1}: Número de colunas inconsistente`);
          errorCount++;
          continue;
        }
        
        // Mapear valores para campos
        const setor = {
          id: values[0] ? parseInt(values[0]) : null,
          codigoSetor: values[1] || '',
          nomeSetor: values[2] || '',
          orgao: values[3] || null,
          ativo: values[4] === '1' ? 1 : 0,
          createdAt: values[5] || null,
          updatedAt: values[6] || null,
          logradouro: values[7] || null,
          numero: values[8] || null,
          complemento: values[9] || null,
          bairro: values[10] || null,
          cidade: values[11] || null,
          estado: values[12] || null,
          cep: values[13] || null,
          telefone: values[14] || null,
          email: values[15] || null,
          latitude: values[16] ? parseFloat(values[16]) : null,
          longitude: values[17] ? parseFloat(values[17]) : null
        };
        
        // Validar campos obrigatórios
        if (!setor.codigoSetor || !setor.nomeSetor) {
          errors.push(`Linha ${i + 1}: Código do setor e nome são obrigatórios`);
          errorCount++;
          continue;
        }
        
        // Verificar se já existe
        const checkSql = 'SELECT COUNT(*) as COUNT FROM SETORES WHERE CODIGO_SETOR = :codigo';
        const checkResult = await connection.execute(checkSql, { codigo: setor.codigoSetor }) as OracleResult;
        
        if (checkResult.rows?.[0]?.COUNT > 0) {
          skippedCount++;
          continue;
        }
        
        // Inserir no banco
        const insertSql = `
          INSERT INTO SETORES (
            ID, CODIGO_SETOR, NOME_SETOR, ORGAO, ATIVO, CREATED_AT, UPDATED_AT,
            LOGRADOURO, NUMERO, COMPLEMENTO, BAIRRO, CIDADE, ESTADO, CEP,
            TELEFONE, EMAIL, LATITUDE, LONGITUDE
          ) VALUES (
            :id, :codigoSetor, :nomeSetor, :orgao, :ativo, 
            COALESCE(TO_TIMESTAMP(:createdAt, 'YYYY-MM-DD HH24:MI:SS'), CURRENT_TIMESTAMP),
            COALESCE(TO_TIMESTAMP(:updatedAt, 'YYYY-MM-DD HH24:MI:SS'), CURRENT_TIMESTAMP),
            :logradouro, :numero, :complemento, :bairro, :cidade, :estado, :cep,
            :telefone, :email, :latitude, :longitude
          )
        `;
        
        await connection.execute(insertSql, {
          id: setor.id,
          codigoSetor: setor.codigoSetor,
          nomeSetor: setor.nomeSetor,
          orgao: setor.orgao,
          ativo: setor.ativo,
          createdAt: setor.createdAt,
          updatedAt: setor.updatedAt,
          logradouro: setor.logradouro,
          numero: setor.numero,
          complemento: setor.complemento,
          bairro: setor.bairro,
          cidade: setor.cidade,
          estado: setor.estado,
          cep: setor.cep,
          telefone: setor.telefone,
          email: setor.email,
          latitude: setor.latitude,
          longitude: setor.longitude
        });
        
        insertedCount++;
        
      } catch (error: any) {
        errors.push(`Linha ${i + 1}: ${error.message}`);
        errorCount++;
      }
    }
    
    // Commit das transações
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Importação concluída',
      data: {
        totalLines: lines.length - 1,
        inserted: insertedCount,
        skipped: skippedCount,
        errors: errorCount,
        errorDetails: errors.slice(0, 10) // Mostrar apenas os primeiros 10 erros
      }
    });
    
  } catch (error: any) {
    console.error('Erro ao importar CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao importar arquivo CSV',
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

export default router;