const axios = require('axios');

// Configuração da API
const API_BASE_URL = 'http://localhost:3001/api';

// Dados dos 5 usuários fictícios
const usuarios = [
  {
    nome: 'Larissa Gomes Andrade',
    email: 'larissa.andrade2@protocolo.gov.br',
    senha: 'Senha123@',
    cpf: '50958697485',
    cargo: 'Analista de Marketing',
    departamento: 'Marketing',
    perfil: 'USER',
    ativo: 1,
    sexo: 'F',
    estadoCivil: 'SOLTEIRO',
    dataNascimento: '1990-05-15',
    rg: '123456789',
    numeroFuncional: 12345,
    vinculoFuncional: 'CLT',
    setorId: 1,
    orgao: 'Secretaria Municipal',
    setor: 'Marketing',
    lotacao: 'Sede'
  },
  {
    nome: 'Vinícius Barros Almeida',
    email: 'vinicius.almeida2@protocolo.gov.br',
    senha: 'Senha456@',
    cpf: '33815015189',
    cargo: 'Coordenador de Logística',
    departamento: 'Logística',
    perfil: 'USER',
     ativo: 1,
     sexo: 'M',
    estadoCivil: 'CASADO',
    dataNascimento: '1985-08-22',
    rg: '987654321',
    numeroFuncional: 12346,
    vinculoFuncional: 'ESTATUTARIO',
    setorId: 2,
    orgao: 'Secretaria Municipal',
    setor: 'Logística',
    lotacao: 'Sede'
  },
  {
    nome: 'Fernanda Ribeiro Nunes',
    email: 'fernanda.nunes2@protocolo.gov.br',
    senha: 'Senha789@',
    cpf: '74879234443',
    cargo: 'Especialista em Ouvidoria',
    departamento: 'Ouvidoria',
    perfil: 'USER',
     ativo: 1,
     sexo: 'F',
     estadoCivil: 'DIVORCIADO',
    dataNascimento: '1988-12-10',
    rg: '456789123',
    numeroFuncional: 12347,
    vinculoFuncional: 'CLT',
    setorId: 3,
    orgao: 'Secretaria Municipal',
    setor: 'Ouvidoria',
    lotacao: 'Sede'
  },
  {
    nome: 'Rafael Costa Mendes',
    email: 'rafael.mendes2@protocolo.gov.br',
    senha: 'Senha101@',
    cpf: '92413922660',
    cargo: 'Agente de Segurança',
    departamento: 'Segurança',
    perfil: 'USER',
     ativo: 1,
     sexo: 'M',
     estadoCivil: 'SOLTEIRO',
    dataNascimento: '1992-03-18',
    rg: '789123456',
    numeroFuncional: 12348,
    vinculoFuncional: 'TERCEIRIZADO',
    setorId: 4,
    orgao: 'Secretaria Municipal',
    setor: 'Segurança',
    lotacao: 'Sede'
  },
  {
    nome: 'Beatriz Martins Lopes',
    email: 'beatriz.lopes2@protocolo.gov.br',
    senha: 'Senha202@',
    cpf: '96699295209',
    cargo: 'Pesquisadora',
    departamento: 'Pesquisa',
    perfil: 'USER',
     ativo: 1,
     sexo: 'F',
     estadoCivil: 'CASADO',
    dataNascimento: '1987-11-25',
    rg: '321654987',
    numeroFuncional: 12349,
    vinculoFuncional: 'CLT',
    setorId: 5,
    orgao: 'Secretaria Municipal',
    setor: 'Pesquisa',
    lotacao: 'Sede'
  }
];

// Função para adicionar usuários
async function adicionarUsuarios() {
  console.log('🚀 Iniciando adição de usuários via API...');
  
  let sucessos = 0;
  let erros = 0;
  
  for (const usuario of usuarios) {
    try {
      console.log(`\n📝 Criando usuário: ${usuario.nome}`);
      
      const response = await axios.post(`${API_BASE_URL}/users`, usuario, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      if (response.data.success) {
        console.log(`✅ Usuário ${usuario.nome} criado com sucesso!`);
        console.log(`   ID: ${response.data.data.id}`);
        console.log(`   Email: ${response.data.data.email}`);
        sucessos++;
      } else {
        console.log(`❌ Erro ao criar usuário ${usuario.nome}:`, response.data.message);
        erros++;
      }
      
    } catch (error) {
      console.log(`❌ Erro ao criar usuário ${usuario.nome}:`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        const errorData = error.response.data;
        console.log(`   Mensagem: ${errorData?.message || errorData?.error || 'Erro desconhecido'}`);
        if (errorData?.details) {
          console.log(`   Detalhes: ${JSON.stringify(errorData.details, null, 2)}`);
        }
        if (errorData?.errors) {
          console.log(`   Erros: ${JSON.stringify(errorData.errors, null, 2)}`);
        }
      } else if (error.request) {
        console.log('   Erro de conexão - verifique se o servidor está rodando');
      } else {
        console.log(`   Erro: ${error.message}`);
      }
      erros++;
    }
    
    // Pausa maior entre as requisições para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n📊 Resumo da operação:');
  console.log(`✅ Sucessos: ${sucessos}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`📝 Total: ${usuarios.length}`);
  
  if (sucessos === usuarios.length) {
    console.log('\n🎉 Todos os usuários foram criados com sucesso!');
  } else if (sucessos > 0) {
    console.log('\n⚠️  Alguns usuários foram criados, mas houve erros.');
  } else {
    console.log('\n💥 Nenhum usuário foi criado. Verifique os erros acima.');
  }
}

// Executar o script
adicionarUsuarios().catch(error => {
  console.error('💥 Erro fatal:', error.message);
  process.exit(1);
});