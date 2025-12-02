import { Router } from 'express';
import { UserModel } from '../models/user.model';
import { SetorModel } from '../models/setor.model';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.middleware';
import { DatabaseService } from '../config/database';
import { UserController } from '../controllers/user.controller';

const router = Router();
const userController = new UserController();

// Rota de login
router.post('/login', (req, res, next) => userController.login(req, res, next));

// Rota para listar usuários com dados organizacionais (setores)
router.get('/with-org-data', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const search = req.query.search as string;
    const setorId = req.query.setorId ? parseInt(req.query.setorId as string) : undefined;
    const ativo = req.query.ativo === 'true' ? true : req.query.ativo === 'false' ? false : undefined;

    // Separar filtros de paginação
    const filters: any = {};
    if (search) filters.searchTerm = search;
    if (setorId) filters.setorId = setorId;
    if (ativo !== undefined) filters.ativo = ativo;

    const pagination = {
      page,
      limit
    };

    const result = await UserModel.findAll(filters, pagination);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
});

router.get('/search-users-and-sectors', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const limitRaw = req.query.limit as any;
    const limit = Number(limitRaw) && !Number.isNaN(Number(limitRaw)) ? Number(limitRaw) : 50;

    if (!q || q.length < 2) {
      res.json({ success: true, data: [] });
      return;
    }

    // 1. Realizar ambas as buscas em paralelo
    const [usersResult, setoresResult] = await Promise.all([
      UserModel.searchByName(q, { page: 1, limit }),
      SetorModel.searchByName(q, { page: 1, limit })
    ]);

    // Normalizar resultados de usuários
    const foundUsers = (usersResult.data || []).map((u: any) => ({
      tipo: 'user',
      id: u.ID ?? u.id,
      nome: u.NOME ?? u.nome ?? u.NAME,
      numero_funcional: u.NUMERO_FUNCIONAL ?? u.matricula ?? u.MATRICULA,
      vinculo_funcional: u.VINCULO_FUNCIONAL ?? u.vinculo_funcional,
      setor_id: u.SETOR_ID ?? u.setor_id ?? u.setorId,
      setor: u.SETOR ?? u.setor ?? u.NOME_SETOR,
      orgao: u.ORGAO ?? u.orgao
    }));

    // Normalizar resultados de setores
    const foundSectors = (setoresResult.data || []).map((s: any) => {
      // Oracle retorna colunas em MAIÚSCULAS, mas precisamos garantir todos os casos
      const id = s.ID ?? s.id;
      const nomeSetor = s.NOME_SETOR ?? s.nome_setor ?? s.nomeSetor ?? '';
      const codigoSetor = s.CODIGO_SETOR ?? s.codigo_setor ?? s.codigoSetor ?? '';
      const orgao = s.ORGAO ?? s.orgao ?? '';
      const ativo = s.ATIVO ?? s.ativo ?? '1';

      return {
        tipo: 'sector',
        id,
        NOME_SETOR: nomeSetor,
        CODIGO_SETOR: codigoSetor,
        ORGAO: orgao,
        ATIVO: ativo
      };
    });

    // 2. Criar Map para agrupar por setor
    const sectorMap = new Map<string | number, {
      sectorInfo: any;
      matchedUsers: any[]; // Usuários encontrados pela busca
      showAllUsers: boolean; // true = setor encontrado, mostrar todos; false = apenas usuários encontrados
    }>();

    // 3. Processar setores encontrados (Critério 2)
    for (const s of foundSectors) {
      const sectorId = s.id;
      sectorMap.set(sectorId, {
        sectorInfo: s,
        matchedUsers: [],
        showAllUsers: true // Setor encontrado: mostrar TODOS os usuários
      });
    }

    // 4. Processar usuários encontrados (Critério 3)
    for (const u of foundUsers) {
      const sectorId = u.setor_id;

      // Ignorar usuários sem setor_id
      if (!sectorId) continue;

      if (sectorMap.has(sectorId)) {
        // Setor já existe no Map
        const entry = sectorMap.get(sectorId)!;

        // Se showAllUsers = false, acumular usuários encontrados
        // Se showAllUsers = true, não precisa acumular (vamos buscar todos depois)
        if (!entry.showAllUsers) {
          if (!entry.matchedUsers.some(existing => existing.id === u.id)) {
            entry.matchedUsers.push(u);
          }
        }
      } else {
        // Setor não existe no Map: criar entrada com showAllUsers = false
        // Precisamos buscar dados completos do setor
        try {
          const setorResponse = await SetorModel.findById(sectorId);
          const setorData = setorResponse;

          sectorMap.set(sectorId, {
            sectorInfo: {
              tipo: 'sector',
              id: setorData.ID ?? setorData.id ?? sectorId,
              NOME_SETOR: setorData.NOME_SETOR ?? setorData.nome_setor ?? u.setor ?? 'Setor não informado',
              CODIGO_SETOR: setorData.CODIGO_SETOR ?? setorData.codigo_setor,
              ORGAO: setorData.ORGAO ?? setorData.orgao ?? u.orgao,
              ATIVO: setorData.ATIVO ?? setorData.ativo
            },
            matchedUsers: [u],
            showAllUsers: false // Apenas usuários encontrados
          });
        } catch (err) {
          // Se não conseguir buscar o setor, usar dados do usuário
          sectorMap.set(sectorId, {
            sectorInfo: {
              tipo: 'sector',
              id: sectorId,
              NOME_SETOR: u.setor || 'Setor não informado',
              ORGAO: u.orgao || ''
            },
            matchedUsers: [u],
            showAllUsers: false
          });
        }
      }
    }

    // 5. Construir resposta final
    const finalData: any[] = [];
    const sectorsWithoutUsers: any[] = [];

    for (const [sectorId, entry] of sectorMap.entries()) {
      const { sectorInfo, matchedUsers, showAllUsers } = entry;

      // Adicionar cabeçalho do setor (não clicável)
      finalData.push({
        ...sectorInfo,
        isGroup: true
      });

      let usersToDisplay: any[] = [];

      if (showAllUsers) {
        // Critério 2: Setor encontrado - buscar TODOS os usuários ativos
        try {
          // Garantir que sectorId é number
          const numericSectorId = typeof sectorId === 'string' ? parseInt(sectorId, 10) : sectorId;

          const allUsersResult = await UserModel.findUsersWithSetor(
            { setor_id: numericSectorId },
            { page: 1, limit: 0 }
          );

          usersToDisplay = (allUsersResult.data || []).map((u: any) => ({
            tipo: 'user',
            isChildOfGroup: true,
            id: u.ID ?? u.id,
            nome: u.NOME ?? u.nome ?? u.NAME,
            numero_funcional: u.NUMERO_FUNCIONAL ?? u.matricula ?? u.MATRICULA,
            vinculo_funcional: u.VINCULO_FUNCIONAL ?? u.vinculo_funcional,
            setor_id: u.SETOR_ID ?? u.setor_id ?? u.setorId,
            setor: u.SETOR ?? u.setor ?? u.NOME_SETOR,
            orgao: u.ORGAO ?? u.orgao
          }));
        } catch (err) {
          console.error(`Erro ao buscar usuários do setor ${sectorId}:`, err);
        }
      } else {
        // Critério 3: Apenas usuários encontrados
        usersToDisplay = matchedUsers.map(u => ({
          ...u,
          isChildOfGroup: true
        }));
      }

      if (usersToDisplay.length === 0) {
        sectorsWithoutUsers.push({
          id: sectorInfo.id,
          nome_setor: sectorInfo.NOME_SETOR
        });
      }

      finalData.push(...usersToDisplay);
    }

    res.json({ success: true, data: finalData, sectorsWithoutUsers });
  } catch (error) {
    next(error);
  }
});

/**
 * Rota temporária para corrigir status de usuários
 * Ativa todos os usuários vinculados a setores ativos
 */
router.post('/fix-active-status', async (req, res) => {
  try {
    const sql = `
      UPDATE USUARIOS u 
      SET u.USUARIO_ATIVO = 1 
      WHERE EXISTS (
        SELECT 1 FROM SETORES s 
        WHERE s.ID = u.SETOR_ID 
        AND (s.ATIVO = 1 OR s.ATIVO = '1')
      )
    `;

    await DatabaseService.executeQuery(sql);

    res.json({ success: true, message: 'Usuários de setores ativos foram ativados com sucesso.' });
  } catch (error) {
    console.error('Erro ao corrigir status:', error);
    res.status(500).json({ success: false, message: 'Erro ao executar correção', error });
  }
});

// Rota para listar usuários com paginação e filtros
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const setorId = req.query.setorId ? parseInt(req.query.setorId as string) : undefined;
    const ativo = req.query.ativo === 'true' ? true : req.query.ativo === 'false' ? false : undefined;

    const options: any = {
      page,
      limit,
      searchTerm: search,
      setorId,
      ativo
    };

    const result = await UserModel.findAll(options);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
});

// Rota para buscar usuário por ID
router.get('/:id(\\d+)', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'ID inválido' });
      return;
    }

    const user = await UserModel.findById(id);
    if (!user) {
      res.status(404).json({ success: false, error: 'Usuário não encontrado' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// Rota para criar usuário
router.post('/', async (req, res, next) => {
  try {
    const userData = req.body;

    // Validação básica
    if (!userData.nome || !userData.email || !userData.cpf) {
      res.status(400).json({ success: false, error: 'Nome, email e CPF são obrigatórios' });
      return;
    }

    const newUser = await UserModel.create(userData);
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    next(error);
  }
});

// Rota para atualizar usuário
router.put('/:id(\\d+)', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'ID inválido' });
      return;
    }

    const userData = req.body;
    const updatedUser = await UserModel.update(id, userData);

    if (!updatedUser) {
      res.status(404).json({ success: false, error: 'Usuário não encontrado' });
      return;
    }

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    next(error);
  }
});

// Rota para inativar usuário (exclusão lógica)
router.delete('/:id(\\d+)', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'ID inválido' });
      return;
    }

    const deleted = await UserModel.delete(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Usuário não encontrado' });
      return;
    }

    res.json({ success: true, message: 'Usuário inativado com sucesso' });
  } catch (error) {
    next(error);
  }
});

// Rota de debug para verificar usuário por CPF
router.get('/debug-user-cpf/:cpf', async (req, res) => {
  try {
    const cpf = req.params.cpf;
    const oracledb = require('oracledb');

    const connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    const result = await connection.execute(
      `SELECT ID, NOME, E_MAIL, CPF, SENHA, USUARIO_ATIVO 
       FROM USUARIOS 
       WHERE REGEXP_REPLACE(TO_CHAR(CPF), '[^0-9]', '') = :cpf`,
      { cpf: cpf.replace(/\D/g, '') }
    );

    await connection.close();

    if (!result.rows || result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Usuário não encontrado por CPF' });
      return;
    }

    const row = result.rows[0];
    const info = {
      id: row.ID,
      nome: row.NOME,
      email: row.E_MAIL,
      cpf: row.CPF,
      ativo: row.USUARIO_ATIVO,
      senha_hash: row.SENHA ? row.SENHA.substring(0, 20) + '...' : 'NULL',
      senha_length: row.SENHA ? row.SENHA.length : 0,
      is_bcrypt: row.SENHA && row.SENHA.startsWith('$2')
    };

    res.json({ success: true, data: info });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Verificar senha contra hash armazenado (debug)
router.post('/debug-check-password', async (req, res) => {
  try {
    const { cpf, senha } = req.body || {};
    if (!cpf || !senha) {
      res.status(400).json({ success: false, error: 'CPF e senha são obrigatórios' });
      return;
    }

    const oracledb = require('oracledb');
    const bcrypt = require('bcrypt');

    const cpfDigits = String(cpf).replace(/\D/g, '');
    const connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    const result = await connection.execute(
      `SELECT ID, NOME, E_MAIL, CPF, SENHA, USUARIO_ATIVO
       FROM USUARIOS
       WHERE REGEXP_REPLACE(TO_CHAR(CPF), '[^0-9]', '') = :cpf_digits`,
      { cpf_digits: cpfDigits }
    );
    await connection.close();

    if (!result.rows || result.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Usuário não encontrado por CPF' });
      return;
    }

    const row = result.rows[0];
    const stored = String(row.SENHA || '');
    const isBcrypt = /^\$2[aby]\$/.test(stored);
    const normalized = stored.startsWith('$2y$') ? ('$2b$' + stored.slice(4)) : stored;

    let matches = false;
    let checkType = 'unknown';
    if (isBcrypt) {
      checkType = 'bcrypt';
      matches = await bcrypt.compare(senha, normalized);
    } else if (/^[a-fA-F0-9]{32}$/.test(stored)) {
      checkType = 'md5';
      const crypto = require('crypto');
      const digest = crypto.createHash('md5').update(senha).digest('hex');
      matches = digest.toLowerCase() === stored.toLowerCase();
    } else if (/^[a-fA-F0-9]{40}$/.test(stored)) {
      checkType = 'sha1';
      const crypto = require('crypto');
      const digest = crypto.createHash('sha1').update(senha).digest('hex');
      matches = digest.toLowerCase() === stored.toLowerCase();
    } else if (/^[a-fA-F0-9]{64}$/.test(stored)) {
      checkType = 'sha256';
      const crypto = require('crypto');
      const digest = crypto.createHash('sha256').update(senha).digest('hex');
      matches = digest.toLowerCase() === stored.toLowerCase();
    } else {
      checkType = 'plain';
      matches = senha === stored.trim();
    }

    res.json({
      success: true,
      data: {
        id: row.ID,
        cpf: row.CPF,
        usuario_ativo: row.USUARIO_ATIVO,
        senha_length: stored.length,
        check_type: checkType,
        prefix: stored.slice(0, 4),
        matches
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Resetar senha por CPF (apenas em desenvolvimento)
router.post('/debug-reset-password-cpf', async (req, res) => {
  try {
    const { cpf, novaSenha } = req.body || {};
    if (!cpf || !novaSenha) {
      res.status(400).json({ success: false, error: 'CPF e novaSenha são obrigatórios' });
      return;
    }

    const oracledb = require('oracledb');
    const bcrypt = require('bcrypt');
    const cpfDigits = String(cpf).replace(/\D/g, '');

    // Validação básica de senha (compatível com validatePassword do modelo)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(novaSenha)) {
      res.status(400).json({ success: false, error: 'Nova senha não atende aos critérios de segurança' });
      return;
    }

    const hashed = await bcrypt.hash(novaSenha, 12);

    const connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECT_STRING
    });

    const updateResult = await connection.execute(
      `UPDATE USUARIOS
       SET SENHA = :senha
       WHERE REGEXP_REPLACE(TO_CHAR(CPF), '[^0-9]', '') = :cpf_digits`,
      { senha: hashed, cpf_digits: cpfDigits },
      { autoCommit: true }
    );

    await connection.close();

    if (updateResult.rowsAffected === 0) {
      res.status(404).json({ success: false, error: 'Usuário não encontrado por CPF' });
      return;
    }

    res.json({ success: true, data: { cpf: cpfDigits, rowsAffected: updateResult.rowsAffected } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Testar autenticação local por CPF (apenas em desenvolvimento)
router.post('/debug-authenticate-cpf', async (req, res) => {
  try {
    const { cpf, senha } = req.body || {};
    if (!cpf || !senha) {
      res.status(400).json({ success: false, error: 'CPF e senha são obrigatórios' });
      return;
    }

    const authResult = await UserModel.authenticate({ cpf, senha });

    // Se o método não lançar erro, consideramos sucesso e retornamos dados relevantes
    res.json({
      success: true,
      data: {
        id: authResult.user.id,
        nome: authResult.user.nome,
        email: authResult.user.email,
        token_gerado: !!authResult.token
      }
    });

  } catch (error) {
    // Capturar erro de autenticação e retornar detalhes
    res.status(401).json({
      success: false,
      error: (error as Error).message,
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    });
  }
});

// Testar autenticação local por CPF via QUERY (apenas em desenvolvimento)
router.get('/debug-authenticate-cpf-q', async (req, res) => {
  try {
    const cpf = String(req.query.cpf || '').trim();
    const senha = String(req.query.senha || '').trim();

    if (!cpf || !senha) {
      res.status(400).json({ success: false, error: 'CPF e senha são obrigatórios via query' });
      return;
    }

    const authResult = await UserModel.authenticate({ cpf, senha });

    res.json({
      success: true,
      data: {
        id: authResult.user.id,
        nome: authResult.user.nome,
        email: authResult.user.email,
        token_gerado: !!authResult.token
      }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      error: (error as Error).message
    });
  }
});

export default router;
// Status de senha do usuário logado
router.get('/password-status', authMiddleware, (req, res, next) => userController.passwordStatus(req as AuthenticatedRequest, res, next));
