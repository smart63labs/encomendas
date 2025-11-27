/**
   * Mapeia uma linha do banco para o objeto Encomenda
   */
  private async mapRowToEncomenda(row: any): Promise<IEncomenda> {
    // Função auxiliar para tratar campos que podem ser JSON ou texto estruturado
    const parseDescricaoField = async (field: any): Promise<string> => {
      if (!field) return '';
      
      // Converter para string primeiro
      let fieldStr = '';
      if (typeof field === 'string') {
        fieldStr = field;
      } else if (field && typeof field === 'object' && field.constructor?.name === 'Lob') {
        // Se for um objeto Lob do Oracle, ler o conteúdo
        try {
          const chunks: Buffer[] = [];
          field.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          });
          
          await new Promise((resolve, reject) => {
            field.on('end', resolve);
            field.on('error', reject);
          });
          
          fieldStr = Buffer.concat(chunks).toString('utf8');
        } catch (e) {
          console.log('Erro ao ler Lob:', e);
          fieldStr = '[Erro ao ler descrição]';
        }
      } else if (field && typeof field === 'object') {
        // Para outros objetos, tentar toString
        fieldStr = field.toString ? field.toString() : '[Objeto não conversível]';
      } else {
        fieldStr = String(field);
      }
      
      // Se for uma string que contém informações estruturadas, extrair apenas a descrição relevante
      if (fieldStr.includes('Descrição:') || fieldStr.includes('Descricao do Conteudo')) {
        const lines = fieldStr.split('\n');
        const descricaoLine = lines.find(line => 
          line.includes('Descrição:') || line.includes('Descricao do Conteudo')
        );
        if (descricaoLine) {
          return descricaoLine.split('=')[1]?.trim() || descricaoLine.split(':')[1]?.trim() || fieldStr;
        }
      }
      
      return fieldStr;
    };

    // Função auxiliar para tratar campos QR Code
    const parseQrCodeField = (field: any): string => {
      if (!field) return '';
      if (typeof field === 'string') {
        try {
          // Se for um JSON válido, converte para string formatada
          const parsed = JSON.parse(field);
          return JSON.stringify(parsed, null, 2);
        } catch {
          // Se não for JSON, retorna como string
          return field;
        }
      }
      if (typeof field === 'object') {
        try {
          return JSON.stringify(field, null, 2);
        } catch (error) {
          // Se houver erro de estrutura circular, retorna uma representação segura
          return '[Dados do QR Code não disponíveis]';
        }
      }
      return String(field);
    };

    return {
      id: Number(row.ID) || 0,
      numeroEncomenda: String(row.NUMERO_ENCOMENDA || ''),
      descricao: await parseDescricaoField(row.DESCRICAO),
      status: String(row.STATUS || 'pendente'),
      dataCriacao: row.DATA_CRIACAO ? new Date(row.DATA_CRIACAO) : undefined,
      dataAtualizacao: row.DATA_ATUALIZACAO ? new Date(row.DATA_ATUALIZACAO) : undefined,
      usuarioOrigemId: Number(row.USUARIO_ORIGEM_ID) || 0,
      usuarioDestinoId: Number(row.USUARIO_DESTINO_ID) || 0,
      setorOrigemId: Number(row.SETOR_ORIGEM_ID) || 0,
      setorDestinoId: Number(row.SETOR_DESTINO_ID) || 0,
      remetente: String(row.REMETENTE_NOME || 'Usuário não encontrado'),
      destinatario: String(row.DESTINATARIO_NOME || 'Usuário não encontrado'),
      setorOrigem: String(row.SETOR_ORIGEM_NOME || 'Setor não encontrado'),
      setorDestino: String(row.SETOR_DESTINO_NOME || 'Setor não encontrado'),
      codigoLacreMalote: String(row.CODIGO_LACRE_MALOTE || ''),
      qrCode: parseQrCodeField(row.QR_CODE),
      urgente: Number(row.URGENTE) === 1
    };
  }