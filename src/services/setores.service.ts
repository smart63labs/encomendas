import { normalizeText } from '@/lib/utils';
import { getApiBaseUrl } from '@/utils/api-url';

type AnySetor = Record<string, any>;

let setoresCache: AnySetor[] | null = null;
const enderecosCache: { [key: string]: string } = {};

async function carregarSetores(): Promise<AnySetor[]> {
  if (setoresCache) return setoresCache;
  const response = await fetch(`${getApiBaseUrl()}/setores?limit=1000`);
  if (!response.ok) throw new Error('Erro ao buscar setores');
  const data = await response.json();
  setoresCache = (data.data || data || []) as AnySetor[];
  return setoresCache;
}

function montarEndereco(setor: AnySetor): string {
  const logradouro = setor.LOGRADOURO || setor.logradouro || '';
  const numero = setor.NUMERO || setor.numero || '';
  const complemento = setor.COMPLEMENTO || setor.complemento || '';
  const bairro = setor.BAIRRO || setor.bairro || '';
  const cidade = setor.CIDADE || setor.cidade || '';
  const estado = setor.ESTADO || setor.estado || setor.UF || setor.uf || '';
  const cep = setor.CEP || setor.cep || '';

  let endereco = '';
  if (logradouro) {
    endereco += logradouro;
    if (numero && numero !== 's/n' && numero !== 'sem número') {
      endereco += `, ${numero}`;
    }
    if (complemento) {
      endereco += ` - ${complemento}`;
    }
  }

  if (bairro) {
    endereco += endereco ? `\n${bairro}` : bairro;
  }

  if (cidade && estado) {
    endereco += endereco ? `, ${cidade} - ${estado}` : `${cidade} - ${estado}`;
  }

  if (cep) {
    endereco += endereco ? `, CEP: ${cep}` : `CEP: ${cep}`;
  }

  return endereco || 'Endereço não disponível';
}

function resolveSetorByNome(nomeSetor: string, setores: AnySetor[]): AnySetor | undefined {
  const alvoNorm = normalizeText(String(nomeSetor || ''));
  return setores.find(s => {
    const candidatosNome = [s.NOME_SETOR, s.nome_setor, s.SETOR, s.setor, s.nome]
      .filter(Boolean)
      .map((v: any) => normalizeText(String(v)));
    const codigo = s.CODIGO_SETOR || s.codigo_setor || s.codigo || '';
    const codigoNorm = normalizeText(String(codigo || ''));
    const nomeMatch = candidatosNome.some((nNorm: string) => nNorm === alvoNorm || nNorm.includes(alvoNorm) || alvoNorm.includes(nNorm));
    const codigoMatch = !!codigo && (codigoNorm === alvoNorm || alvoNorm.includes(codigoNorm) || codigoNorm.includes(alvoNorm));
    return nomeMatch || codigoMatch;
  });
}

export async function getEnderecoSetor(nomeSetor: string): Promise<string> {
  if (!nomeSetor) return 'Endereço não disponível';
  if (enderecosCache[nomeSetor]) return enderecosCache[nomeSetor];

  try {
    const setores = await carregarSetores();
    const setor = resolveSetorByNome(nomeSetor, setores);
    if (setor) {
      const endereco = montarEndereco(setor);
      const aliases = [nomeSetor, setor.NOME_SETOR, setor.nome_setor, setor.SETOR, setor.setor].filter(Boolean);
      aliases.forEach((alias: any) => {
        enderecosCache[String(alias)] = endereco;
      });
      return endereco;
    }
  } catch (err) {
    console.error('Erro ao resolver setor:', err);
  }
  enderecosCache[nomeSetor] = 'Endereço não disponível';
  return enderecosCache[nomeSetor];
}

export function obterEnderecoSetorSync(nomeSetor: string): string {
  return enderecosCache[nomeSetor] || 'Carregando endereço...';
}

export async function precarregarEnderecosParaNomes(nomes: string[]): Promise<void> {
  const unicos = Array.from(new Set(nomes.filter(Boolean)));
  await Promise.all(unicos.map(getEnderecoSetor));
}

export function limparCacheSetores(): void {
  setoresCache = null;
}

export function getSetoresCache(): AnySetor[] | null {
  return setoresCache;
}