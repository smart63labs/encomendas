import { Request, Response } from 'express';
import { DatabaseService } from '../config/database';

export interface ConfiguracaoGeral {
  id?: number;
  configuracaoId: number;
  nomeInstituicao: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  email: string;
  descricao: string;
  nomeSistema?: string;
  // Novos campos para dados do rodapé
  cidade?: string;
  emailContato?: string;
  siteUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  whatsapp?: string;
  logoHeaderUrl?: string;
  textoCopyright?: string;
  enderecoCompleto?: string;
  dataCriacao?: Date;
  dataAlteracao?: Date;
  usuarioCriacaoId?: number;
  usuarioAlteracaoId?: number;
  ativo?: boolean;
}

export class ConfiguracaoGeralController {
  /**
   * Busca configurações gerais por configuração ID
   */
  async buscarPorConfiguracaoId(req: Request, res: Response): Promise<void> {
    try {
      const { configuracaoId } = req.params;

      const configId = parseInt(configuracaoId, 10);
      if (isNaN(configId)) {
        res.status(400).json({
          success: false,
          message: 'ID de configuração inválido'
        });
        return;
      }

      const sql = `
        SELECT 
          ID,
          CONFIGURACAO_ID,
          NOME_INSTITUICAO,
          CNPJ,
          ENDERECO,
          TELEFONE,
          EMAIL,
          DESCRICAO,
          NOME_SISTEMA,
          CIDADE,
          EMAIL_CONTATO,
          SITE_URL,
          FACEBOOK_URL,
          INSTAGRAM_URL,
          TWITTER_URL,
          WHATSAPP,
          LOGO_HEADER_URL,
          TEXTO_COPYRIGHT,
          ENDERECO_COMPLETO,
          DATA_CRIACAO,
          DATA_ALTERACAO,
          USUARIO_CRIACAO_ID,
          USUARIO_ALTERACAO_ID,
          ATIVO
        FROM CONFIGURACOES_GERAL
        WHERE CONFIGURACAO_ID = :1 AND ATIVO = 'S'
        ORDER BY ID
      `;

      const result = await DatabaseService.executeQuery(sql, [configId]);

      if (!result.rows || result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Configurações gerais não encontradas'
        });
        return;
      }

      const row = result.rows[0];
      const configuracao: ConfiguracaoGeral = {
        id: row.ID,
        configuracaoId: row.CONFIGURACAO_ID,
        nomeInstituicao: row.NOME_INSTITUICAO,
        cnpj: row.CNPJ,
        endereco: row.ENDERECO,
        telefone: row.TELEFONE,
        email: row.EMAIL,
        descricao: row.DESCRICAO,
        nomeSistema: row.NOME_SISTEMA,
        // Novos campos do rodapé
        cidade: row.CIDADE,
        emailContato: row.EMAIL_CONTATO,
        siteUrl: row.SITE_URL,
        facebookUrl: row.FACEBOOK_URL,
        instagramUrl: row.INSTAGRAM_URL,
        twitterUrl: row.TWITTER_URL,
        whatsapp: row.WHATSAPP,
        logoHeaderUrl: row.LOGO_HEADER_URL,
        textoCopyright: row.TEXTO_COPYRIGHT,
        enderecoCompleto: row.ENDERECO_COMPLETO,
        dataCriacao: row.DATA_CRIACAO,
        dataAlteracao: row.DATA_ALTERACAO,
        usuarioCriacaoId: row.USUARIO_CRIACAO_ID,
        usuarioAlteracaoId: row.USUARIO_ALTERACAO_ID,
        ativo: row.ATIVO === 'S'
      };

      res.json({
        success: true,
        data: configuracao
      });

    } catch (error) {
      console.error('Erro ao buscar configurações gerais:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar configurações gerais'
      });
    }
  }

  /**
   * Cria ou atualiza configurações gerais
   */
  async salvar(req: Request, res: Response): Promise<void> {
    try {
      const { configuracaoId } = req.params;
      const {
        nomeInstituicao,
        cnpj,
        endereco,
        telefone,
        email,
        descricao,
        nomeSistema,
        // Novos campos do rodapé
        cidade,
        emailContato,
        siteUrl,
        facebookUrl,
        instagramUrl,
        twitterUrl,
        whatsapp,
        logoHeaderUrl,
        textoCopyright,
        enderecoCompleto
      } = req.body;

      const configId = parseInt(configuracaoId, 10);
      if (isNaN(configId)) {
        res.status(400).json({
          success: false,
          message: 'ID de configuração inválido'
        });
        return;
      }

      // Verificar se já existe configuração geral para este ID
      const sqlVerificar = `
        SELECT ID FROM CONFIGURACOES_GERAL 
        WHERE CONFIGURACAO_ID = :1 AND ATIVO = 'S'
      `;
      
      const resultVerificar = await DatabaseService.executeQuery(sqlVerificar, [configId]);
      
      let sql: string;
      let params: any[];
      
      if (resultVerificar.rows && resultVerificar.rows.length > 0) {
        // Atualizar registro existente
        const id = resultVerificar.rows[0].ID;
        sql = `
          UPDATE CONFIGURACOES_GERAL SET
            NOME_INSTITUICAO = :1,
            CNPJ = :2,
            ENDERECO = :3,
            TELEFONE = :4,
            EMAIL = :5,
            DESCRICAO = :6,
            NOME_SISTEMA = :7,
            CIDADE = :8,
            EMAIL_CONTATO = :9,
            SITE_URL = :10,
            FACEBOOK_URL = :11,
            INSTAGRAM_URL = :12,
            TWITTER_URL = :13,
            WHATSAPP = :14,
            LOGO_HEADER_URL = :15,
            TEXTO_COPYRIGHT = :16,
            ENDERECO_COMPLETO = :17,
            DATA_ALTERACAO = SYSDATE,
            USUARIO_ALTERACAO_ID = :18
          WHERE ID = :19
        `;
        params = [nomeInstituicao, cnpj, endereco, telefone, email, descricao, nomeSistema, cidade, emailContato, siteUrl, facebookUrl, instagramUrl, twitterUrl, whatsapp, logoHeaderUrl, textoCopyright, enderecoCompleto, req.user?.id || null, id];
      } else {
        // Criar novo registro
        sql = `
          INSERT INTO CONFIGURACOES_GERAL (
            CONFIGURACAO_ID,
            NOME_INSTITUICAO,
            CNPJ,
            ENDERECO,
            TELEFONE,
            EMAIL,
            DESCRICAO,
            NOME_SISTEMA,
            CIDADE,
            EMAIL_CONTATO,
            SITE_URL,
            FACEBOOK_URL,
            INSTAGRAM_URL,
            TWITTER_URL,
            WHATSAPP,
            LOGO_HEADER_URL,
            TEXTO_COPYRIGHT,
            ENDERECO_COMPLETO,
            USUARIO_CRIACAO_ID
          ) VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12, :13, :14, :15, :16, :17, :18, :19)
        `;
        params = [configId, nomeInstituicao, cnpj, endereco, telefone, email, descricao, nomeSistema, cidade, emailContato, siteUrl, facebookUrl, instagramUrl, twitterUrl, whatsapp, logoHeaderUrl, textoCopyright, enderecoCompleto, req.user?.id || null];
      }

      await DatabaseService.executeQuery(sql, params);

      res.json({
        success: true,
        message: 'Configurações gerais salvas com sucesso'
      });

    } catch (error) {
      console.error('Erro ao salvar configurações gerais:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao salvar configurações gerais'
      });
    }
  }
}