import { useState } from 'react';
import { useToast } from './use-toast';
import { Coordenadas } from '../services/geocoding.service';

export interface EnderecoData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string; // cidade
  uf: string; // estado
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}

export interface EnderecoForm {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  coordenadas?: Coordenadas; // Adicionado para suportar coordenadas da BrasilAPI
}

export const useCep = () => {
  const [loading, setLoading] = useState(false);
  const [endereco, setEndereco] = useState<EnderecoForm>({
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  });
  const { notification, isOpen, showError, showSuccess, showInfo, showWarning, hideNotification } = useNotification();

  const formatCep = (cep: string): string => {
    // Remove tudo que não é número
    const numericCep = cep.replace(/\D/g, '');
    
    // Aplica a máscara XXXXX-XXX
    if (numericCep.length <= 5) {
      return numericCep;
    } else {
      return `${numericCep.slice(0, 5)}-${numericCep.slice(5, 8)}`;
    }
  };

  const validateCep = (cep: string): boolean => {
    // Remove caracteres não numéricos
    const numericCep = cep.replace(/\D/g, '');
    
    // Verifica se tem 8 dígitos
    if (numericCep.length !== 8) {
      return false;
    }
    
    // Verifica se não é uma sequência de números iguais
    const invalidCeps = [
      '00000000', '11111111', '22222222', '33333333',
      '44444444', '55555555', '66666666', '77777777',
      '88888888', '99999999'
    ];
    
    return !invalidCeps.includes(numericCep);
  };

  const buscarCep = async (cep: string): Promise<EnderecoForm | null> => {
    const numericCep = cep.replace(/\D/g, '');
    
    if (!validateCep(numericCep)) {
      showError("CEP inválido", "Por favor, digite um CEP válido com 8 dígitos.");
      return null;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${numericCep}/json/`);
      
      if (!response.ok) {
        throw new Error('Erro na consulta do CEP');
      }
      
      const data: EnderecoData = await response.json();
      
      if (data.cep === undefined || 'erro' in data) {
        showError("CEP não encontrado", "O CEP informado não foi encontrado. Verifique e tente novamente.");
        return null;
      }
      
      const enderecoFormatado: EnderecoForm = {
        cep: formatCep(data.cep),
        logradouro: data.logradouro || '',
        numero: '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || ''
      };
      
      setEndereco(enderecoFormatado);
      
      showInfo("CEP encontrado!", `Endereço carregado: ${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`);
      
      return enderecoFormatado;
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      showError("Erro na busca", "Não foi possível buscar o CEP. Verifique sua conexão e tente novamente.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const limparEndereco = () => {
    setEndereco({
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: ''
    });
  };

  const atualizarEndereco = (campo: keyof EnderecoForm, valor: string) => {
    setEndereco(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  return {
    endereco,
    loading,
    buscarCep,
    formatCep,
    validateCep,
    limparEndereco,
    atualizarEndereco,
    setEndereco
  };
};