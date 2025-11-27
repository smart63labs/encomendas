import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Package, QrCode, Search } from 'lucide-react';
import { api } from '@/lib/api';

interface SelectLacreMaloteModalProps {
  isOpen: boolean;
  onClose: () => void;
  setorOrigemId?: number | null;
  setorDestinoId?: number | null;
  onSelectLacre: (item: any) => void;
  onSelectMalote: (item: any) => void;
}

const SelectLacreMaloteModal: React.FC<SelectLacreMaloteModalProps> = ({
  isOpen,
  onClose,
  setorOrigemId,
  setorDestinoId,
  onSelectLacre,
  onSelectMalote,
}) => {
  // Wizard de dois passos: 1 = Malote, 2 = Lacre
  const [step, setStep] = useState<1 | 2>(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [lacres, setLacres] = useState<any[]>([]);
  const [malotes, setMalotes] = useState<any[]>([]);
  const [lacresTotal, setLacresTotal] = useState<number>(0);
  const [malotesTotal, setMalotesTotal] = useState<number>(0);
  const [setorNomesPorId, setSetorNomesPorId] = useState<Record<number, string>>({});
  const [origemSetorNome, setOrigemSetorNome] = useState<string | null>(null);
  const [selectedMalote, setSelectedMalote] = useState<any | null>(null);
  const [selectedLacre, setSelectedLacre] = useState<any | null>(null);
  const [hubSetorId, setHubSetorId] = useState<number | null>(null);
  const [vinculoSetorIdPorMalote, setVinculoSetorIdPorMalote] = useState<Record<string, number>>({});

  // Carregar HUB_SETOR_ID da categoria 'geral'
  useEffect(() => {
    const loadHubId = async () => {
      if (!isOpen) return;
      try {
        const resp = await api.getConfiguracoesPorCategoria('geral');
        const items = resp?.data?.data ?? resp?.data ?? [];
        const hubItem = Array.isArray(items)
          ? items.find((c: any) => (c.chave ?? c.CHAVE) === 'HUB_SETOR_ID')
          : null;
        let rawVal: any = hubItem ? (hubItem.valor ?? hubItem.VALOR ?? null) : null;
        // Alguns backends retornam objeto { valor: "..." }
        if (rawVal && typeof rawVal === 'object') rawVal = rawVal.valor ?? rawVal.value ?? null;
        const num = Number(rawVal);
        setHubSetorId(Number.isNaN(num) ? null : num);
      } catch (_) {
        setHubSetorId(null);
      }
    };
    loadHubId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Resolve o setor e o tipo de filtro (origem/destino) conforme a regra do HUB
  const resolveTargetFiltro = (): { id: number | null; tipo: 'origem' | 'destino' | null } => {
    const origemNum = setorOrigemId && !isNaN(Number(setorOrigemId)) ? Number(setorOrigemId) : null;
    const destinoNum = setorDestinoId && !isNaN(Number(setorDestinoId)) ? Number(setorDestinoId) : null;
    const hubNum = hubSetorId && !isNaN(Number(hubSetorId)) ? Number(hubSetorId) : null;

    // Sem origem definida, não conseguimos aplicar regra
    if (!origemNum) return { id: null, tipo: null };

    // Se HUB não estiver configurado, listar malotes do próprio remetente (origem)
    if (!hubNum) return { id: origemNum, tipo: 'origem' };

    // Regra:
    // - Quando o setor HUB for o remetente, mostrar malotes do setor destinatário
    // - Quando o remetente não for o setor HUB, mostrar malotes do próprio setor remetente
    if (origemNum === hubNum) {
      return { id: destinoNum ?? null, tipo: destinoNum ? 'destino' : null };
    }
    return { id: origemNum, tipo: 'origem' };
  };

  // Helpers para ordenar
  const getLacreNumero = (l: any) => {
    const raw = l?.codigo ?? l?.CODIGO ?? '';
    const match = String(raw).match(/\d+/);
    const n = match ? parseInt(match[0], 10) : (l?.id ?? l?.ID ?? 0);
    return Number.isNaN(n) ? 0 : n;
  };

  const reduceLacresToUsedPlusNext = (lista: any[]) => {
    const ordered = [...(lista || [])].sort((a, b) => getLacreNumero(a) - getLacreNumero(b));
    const statusOf = (l: any) => String(l?.STATUS ?? l?.status ?? '').toLowerCase().trim();
    const used = ordered.filter((l) => statusOf(l) !== 'disponivel');
    const available = ordered.filter((l) => statusOf(l) === 'disponivel');
    const maxUsed = used.length ? Math.max(...used.map(getLacreNumero)) : null;
    const next = available.length
      ? (maxUsed != null
          ? available.find((l) => getLacreNumero(l) > (maxUsed as number)) ?? available[0]
          : available[0])
      : null;
    return next ? [...used, next] : [...used];
  };

  const getMaloteNumero = (m: any) => {
    const raw = m?.numeroMalote ?? m?.NUMERO_MALOTE ?? m?.id ?? m?.ID ?? 0;
    const n = parseInt(String(raw).replace(/\D/g, ''), 10);
    return Number.isNaN(n) ? 0 : n;
  };
  const getMaloteSetorVinculoId = (m: any): number | null => {
    const val = (
      m?.setorDestinoId ?? m?.SETOR_DESTINO_ID ??
      m?.setorId ?? m?.SETOR_ID ??
      m?.setorOrigemId ?? m?.SETOR_ORIGEM_ID
    );
    const num = Number(val);
    return Number.isNaN(num) ? null : num;
  };

  const fetchLacres = async () => {
    setLoading(true);
    try {
      // Parâmetros base do request
      const baseParams: any = {
        page: 1,
      };
      if (search) baseParams.search = search;
      if (setorOrigemId) baseParams.setorId = Number(setorOrigemId);

      // Regra do fluxo: lacre aparece em tela e fica indisponível quando
      // SETOR_ID (lacre) = SETOR_ORIGEM_ID (encomenda) e STATUS='utilizado'.
      // Caso contrário, STATUS='utilizado' é tratado como disponível.
      // Portanto, quando há setor de origem, precisamos listar tanto 'atribuido' quanto 'utilizado/ultilizado'.
      let ordenadaLista: any[] = [];
      if (setorOrigemId) {
        // Alinhar com a regra consolidada do backend:
        // usar endpoint dedicado que considera uso único por setor
        const resp = await api.get('/lacres/disponiveis-por-setor', { setorId: Number(setorOrigemId), limit: 1000 });
        const lista = Array.isArray(resp?.data?.data) ? resp.data.data : Array.isArray(resp?.data) ? resp.data : [];
        setLacresTotal(lista.length);
        ordenadaLista = [...lista].sort((a, b) => getLacreNumero(a) - getLacreNumero(b));
        setLacres(reduceLacresToUsedPlusNext(ordenadaLista));
      } else {
        // Sem setor origem definido, listar lacres 'disponivel' da base geral
        const respTotal = await api.listLacres({ ...baseParams, limit: 1, status: 'disponivel' });
        const total = Number(respTotal?.data?.pagination?.total || (respTotal?.data?.data || []).length || 0);
        setLacresTotal(total);
        const limitCompleto = Math.max(total, 100);
        const respLista = await api.listLacres({ ...baseParams, limit: limitCompleto, status: 'disponivel' });
        const lista = respLista?.data?.data || [];
        ordenadaLista = [...lista].sort((a, b) => getLacreNumero(a) - getLacreNumero(b));
        setLacres(reduceLacresToUsedPlusNext(ordenadaLista));
      }

      // Ordenação já aplicada na construção das listas acima

      // Carregar nomes dos setores de origem dos lacres (cache por ID)
      const idsOrigem = Array.from(new Set((ordenadaLista || []).map((l: any) => Number(l.setorId || l.SETOR_ID)).filter((v: any) => !isNaN(v))));
      const faltando = idsOrigem.filter((id) => setorNomesPorId[id] === undefined);
      if (faltando.length > 0) {
        const updates: Record<number, string> = {};
        for (const id of faltando) {
          try {
            const r = await api.getSetorById(id);
            const s = r?.data?.data || r?.data || {};
            const nome = s.NOME_SETOR || s.nome_setor || s.SETOR || s.setor || String(id);
            updates[id] = String(nome);
          } catch (_) {
            updates[id] = String(id);
          }
        }
        setSetorNomesPorId((prev) => ({ ...prev, ...updates }));
      }
    } catch (e) {
      setLacres([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMalotes = async () => {
    setLoading(true);
    try {
      // Resolver setor alvo e tipo de filtro (origem/destino)
      const { id: targetSetorId, tipo: targetTipo } = resolveTargetFiltro();

      console.log('[SelectLacreMaloteModal] fetchMalotes - targetSetorId:', targetSetorId, 'targetTipo:', targetTipo);

      // Exigir setor alvo resolvido; sem isso, não listar malotes para evitar seleção indevida
      if (!targetSetorId || isNaN(Number(targetSetorId))) {
        console.log('[SelectLacreMaloteModal] fetchMalotes - setor alvo não resolvido, abortando');
        setLoading(false);
        // Não sobrescrever lista/total atuais para evitar exibição incorreta
        // (por exemplo, quando origem é HUB e destino ainda não foi escolhido)
        return;
      }

      // 1) Buscar todos os malotes vinculados ao setor alvo independentemente de origem/destino
      // Regra: quando remetente é HUB, setor alvo = destinatário; caso contrário, setor alvo = remetente
      const baseParams: any = { page: 1, limit: 1, status: 'todos' };
      baseParams.setorId = Number(targetSetorId);
      if (search) baseParams.search = search;
      const respBase1 = await api.listMalotes(baseParams);
      const totalTodos = Number(respBase1?.data?.pagination?.total || (respBase1?.data?.data || []).length || 0);
      setMalotesTotal(totalTodos);
      const respBaseAll = await api.listMalotes({ ...baseParams, limit: Math.max(totalTodos, 100) });
      let listaTodos: any[] = Array.isArray(respBaseAll?.data?.data) ? respBaseAll?.data?.data : [];

      // 2) Buscar "disponíveis" por eventos para identificar quem pode ser escolhido (usa origem/destino)
      const dispParams: any = { setorId: Number(targetSetorId) };
      if (targetTipo === 'destino') dispParams.setorDestinoId = Number(targetSetorId);
      else if (targetTipo === 'origem') dispParams.setorOrigemId = Number(targetSetorId);
      const respDisp = await api.listMalotesDisponiveis(dispParams);
      const listaDisp: any[] = Array.isArray(respDisp?.data?.data ?? respDisp?.data) ? (respDisp?.data?.data ?? respDisp?.data) : [];

      // 2.1) Buscar status por eventos para todos os malotes do setor (usa origem/destino)
      const statusParams: any = { setorId: Number(targetSetorId) };
      if (targetTipo === 'destino') statusParams.setorDestinoId = Number(targetSetorId);
      else if (targetTipo === 'origem') statusParams.setorOrigemId = Number(targetSetorId);
      console.log('[SelectLacreMaloteModal] Buscando status por eventos com params:', statusParams);
      const respStatusEv = await api.listMalotesStatusEventos(statusParams);
      const listaStatusEv: any[] = Array.isArray(respStatusEv?.data?.data ?? respStatusEv?.data) ? (respStatusEv?.data?.data ?? respStatusEv?.data) : [];
      console.log('[SelectLacreMaloteModal] Status por eventos recebidos:', listaStatusEv.length, 'malotes');

      // 3) Conjunto de chaves dos disponíveis (prioriza ID; fallback para número do malote)
      const toKey = (m: any) => (m.id ?? m.ID ?? null) ?? String(m.numeroMalote ?? m.NUMERO_MALOTE ?? '').padStart(4, '0');
      const dispSet = new Set<string>(listaDisp.map((m: any) => String(toKey(m))));

      // 3.1) Mapear status de evento por chave
      const evStatusMap = new Map<string, string>();
      for (const r of listaStatusEv) {
        const key = String((r.ID ?? r.id ?? null) ?? String(r.NUMERO_MALOTE ?? r.numeroMalote ?? '').padStart(4, '0'));
        const raw = r.STATUS_EVENTO ?? r.status_evento ?? null;
        const norm = raw ? String(raw).toLowerCase().trim() : null;
        if (key) {
          evStatusMap.set(key, norm || '');
          console.log('[SelectLacreMaloteModal] Mapeando status evento - key:', key, 'status:', norm, 'malote:', r.NUMERO_MALOTE ?? r.numeroMalote);
        }
      }

      // 4) Aplicar busca local por número se houver termo
      if (search) {
        const termo = String(search).trim();
        listaTodos = (listaTodos || []).filter((m: any) => String(m.numeroMalote || m.NUMERO_MALOTE || '').includes(termo));
      }

      // 5) Mesclar e normalizar status para habilitar "Escolher" onde estiver realmente disponível
      const completa = (listaTodos || []).map((m: any) => {
        const key = String(toKey(m));
        const isDisponivelEvento = dispSet.has(key);
        const statusEvento = evStatusMap.get(key) || '';
        const clone = { ...m } as any;
        clone.statusEvento = isDisponivelEvento ? 'disponivel' : statusEvento;
        clone.statusEventoLabel = isDisponivelEvento
          ? 'Disponível'
          : (statusEvento === 'em_transito' ? 'Em transito / Indisponível' : (statusEvento === 'indisponivel' ? 'Indisponível' : ''));
        
        console.log('[SelectLacreMaloteModal] Malote', m.NUMERO_MALOTE || m.numeroMalote, '- key:', key, 'isDisponivelEvento:', isDisponivelEvento, 'statusEvento:', statusEvento);
        
        return clone;
      });

      // Carregar nomes dos setores ORIGEM (cache simples por ID)
      const idsOrigemMalote = Array.from(new Set((completa || []).map((m: any) => getMaloteSetorVinculoId(m)).filter((v: any) => v !== null)));
      const faltando = idsOrigemMalote.filter((id) => setorNomesPorId[id] === undefined);
      if (faltando.length > 0) {
        const updates: Record<number, string> = {};
        for (const id of faltando) {
          try {
            const r = await api.getSetorById(id);
            const s = r?.data?.data || r?.data || {};
            const nome = s.NOME_SETOR || s.nome_setor || s.SETOR || s.setor || String(id);
            updates[id] = String(nome);
          } catch (_) {
            updates[id] = String(id);
          }
        }
        setSetorNomesPorId((prev) => ({ ...prev, ...updates }));
      }
      const ordenada = [...completa].sort((a, b) => getMaloteNumero(a) - getMaloteNumero(b));
      // Enriquecer vínculo do setor por malote quando faltante
      const vinculos: Record<string, number> = {};
      for (const m of ordenada) {
        const key = String((m.id ?? m.ID ?? null) ?? String(m.numeroMalote ?? m.NUMERO_MALOTE ?? '').padStart(4, '0'));
        const vincId = getMaloteSetorVinculoId(m);
        if (vincId == null) {
          try {
            const mid = m.id ?? m.ID;
            if (mid != null) {
              const det = await api.getMaloteById(mid);
              const dm = det?.data?.data || det?.data || {};
              const raw = dm.setorDestinoId ?? dm.SETOR_DESTINO_ID ?? dm.setorId ?? dm.SETOR_ID ?? dm.setorOrigemId ?? dm.SETOR_ORIGEM_ID;
              const num = Number(raw);
              if (!Number.isNaN(num)) vinculos[key] = num;
            }
          } catch (_) {}
        } else {
          vinculos[key] = vincId;
        }
      }
      if (Object.keys(vinculos).length > 0) setVinculoSetorIdPorMalote(vinculos);

      // Garantir nomes de setores para vínculos enriquecidos
      const idsVinculos = Array.from(new Set(Object.values(vinculos).filter((v) => !Number.isNaN(Number(v))))) as number[];
      const faltandoVincNomes = idsVinculos.filter((id) => setorNomesPorId[id] === undefined);
      if (faltandoVincNomes.length > 0) {
        const updates: Record<number, string> = {};
        for (const id of faltandoVincNomes) {
          try {
            const r = await api.getSetorById(id);
            const s = r?.data?.data || r?.data || {};
            const nome = s.NOME_SETOR || s.nome_setor || s.SETOR || s.setor || String(id);
            updates[id] = String(nome);
          } catch (_) {
            updates[id] = String(id);
          }
        }
        setSetorNomesPorId((prev) => ({ ...prev, ...updates }));
      }
      setMalotes(ordenada);
    } catch (e) {
      setMalotes([]);
    } finally {
      setLoading(false);
    }
  };

  // Buscar os totais independentemente do passo atual
  const fetchTotals = async () => {
    try {
      // Total de lacres alinhado à regra consolidada do backend
      if (setorOrigemId && !isNaN(Number(setorOrigemId))) {
        const resp = await api.get('/lacres/disponiveis-por-setor', { setorId: Number(setorOrigemId), limit: 1 });
        const data = Array.isArray(resp?.data?.data) ? resp.data.data : Array.isArray(resp?.data) ? resp.data : [];
        setLacresTotal(Number(data.length || 0));
      } else {
        // Sem setor origem: considerar apenas base geral de lacres disponíveis
        const respTotal = await api.listLacres({ page: 1, limit: 1, status: 'disponivel' });
        const total = Number(respTotal?.data?.pagination?.total || (respTotal?.data?.data || []).length || 0);
        setLacresTotal(total);
      }

      // Total de malotes vinculados ao setor alvo (independente de origem/destino)
      const maloteParams: any = { page: 1, limit: 1, status: 'todos' };
      const { id: targetSetorId } = resolveTargetFiltro();
      if (targetSetorId && !isNaN(Number(targetSetorId))) {
        maloteParams.setorId = Number(targetSetorId);
      }
      const respM = await api.listMalotes(maloteParams);
      const totalM = Number(respM?.data?.pagination?.total || (respM?.data?.data || []).length || 0);
      setMalotesTotal(totalM);
    } catch (_) {
      // Mantém os valores atuais em caso de erro
    }
  };

  useEffect(() => {
    if (!isOpen) {
      // Limpar dados ao fechar para garantir que serão recarregados na próxima abertura
      setMalotes([]);
      setLacres([]);
      return;
    }
    // Sempre começar pelo passo 1 (Malote) ao abrir
    setStep(1);
    setSelectedMalote(null);
    setSelectedLacre(null);
    // Buscar totais logo ao abrir, independente do passo
    fetchTotals();
    // Carregar malotes imediatamente ao abrir
    fetchMalotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Carrega conforme o passo atual (apenas quando muda de passo, não na abertura inicial)
  useEffect(() => {
    if (!isOpen) return;
    // Evitar recarregar na abertura inicial (já carregado no useEffect anterior)
    if (step === 1 && malotes.length === 0) return;
    if (step === 1) fetchMalotes();
    else fetchLacres();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Recarregar malotes e totais quando HUB_SETOR_ID, setorDestinoId ou setorOrigemId forem resolvidos/alterados
  useEffect(() => {
    if (!isOpen) return;
    // O impacto é no passo de malote
    if (step === 1) {
      fetchMalotes();
    }
    fetchTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hubSetorId, setorDestinoId, setorOrigemId]);

  // Buscar nome do setor de origem para o badge
  useEffect(() => {
    const carregarNomeOrigem = async () => {
      if (!isOpen) return;
      const id = Number(setorOrigemId);
      if (!id || Number.isNaN(id)) { setOrigemSetorNome(null); return; }
      try {
        const r = await api.getSetorById(id);
        const s = r?.data?.data || r?.data || {};
        const nome = s.NOME_SETOR || s.nome_setor || s.SETOR || s.setor || null;
        setOrigemSetorNome(nome);
      } catch (_) {
        setOrigemSetorNome(null);
      }
    };
    carregarNomeOrigem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, setorOrigemId]);

  // Atualiza os totais quando o setor muda (mesmo com modal aberto)
  useEffect(() => {
    if (!isOpen) return;
    fetchTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setorOrigemId]);

  const handleSearch = async () => {
    if (step === 2) await fetchLacres();
    else await fetchMalotes();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Selecionar Malote e Lacre</DialogTitle>
        </DialogHeader>
                  {typeof setorOrigemId === 'number' && (
            <Badge>
              {`Malote / Lacre : ${origemSetorNome || setorOrigemId}`}
            </Badge>
          )}
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="h-8 flex items-center gap-1">
            {step === 1 ? (
              <>
                <Package className="w-3 h-3" /> Passo 1: Escolher Malote
              </>
            ) : (
              <>
                <QrCode className="w-3 h-3" /> Passo 2: Escolher Lacre
              </>
            )}
          </Badge>
          <Badge variant="outline" className="h-8 flex items-center gap-1">
            {`Malotes: ${malotesTotal || malotes.length} • Lacres: ${lacresTotal || lacres.length}`}
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            <Input
              placeholder={step === 1 ? 'Buscar por número do malote' : 'Buscar por código do lacre'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-48"
            />
            <Button type="button" variant="outline" onClick={handleSearch} className="h-8">
              <Search className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div className="border rounded p-2 h-64 overflow-auto bg-white">
          {loading && (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          )}
          {!loading && step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {lacres.map((l) => {
                const lacreId = l.id ?? l.ID;
                const selectedLacreId = (selectedLacre?.id ?? selectedLacre?.ID);
                // Usar regra consolidada do backend: STATUS = 'disponivel'|'indisponivel'
                const statusLower = String(l.STATUS ?? l.status ?? '').toLowerCase().trim();
                const canSelect = statusLower === 'disponivel';
                const disabled = !canSelect;
                const statusLabel = (l.STATUS_LABEL ?? l.statusLabel ?? (canSelect ? 'Disponível' : 'Já usado / Indisponível')) as string;
                return (
                <div
                  key={lacreId}
                  className={`border rounded p-2 flex items-center justify-between ${
                    selectedLacreId === lacreId ? 'border-primary' : ''
                  }`}
                  onClick={() => { if (!disabled) setSelectedLacre(l); }}
                  aria-disabled={disabled}
                  tabIndex={disabled ? -1 : 0}
                  role="button"
                >
                  <div>
                    <div className="text-sm font-medium">{l.codigo || l.CODIGO}</div>
                    <div className="text-xs text-muted-foreground">
                      {(() => {
                        const idOrigem = Number(l.setorId || l.SETOR_ID);
                        const nomeOrigem = !isNaN(idOrigem) ? setorNomesPorId[idOrigem] : undefined;
                        const statusTxtRaw = l.status ?? l.STATUS ?? '';
                        return (
                          <>
                            {' '}Vinculado :  {nomeOrigem || idOrigem || '—'}
                            {' '}•{' '}
                            {canSelect ? (
                              <Badge
                                variant="outline"
                                className="ml-1 bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                              >
                                {statusLabel || 'Disponível'}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="ml-1 bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200"
                              >
                                {statusLabel || 'Já usado / Indisponível'}
                              </Badge>
                            )}
                          </>
                        );
                      })()}
                  </div>
                </div>
                  {!disabled && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setSelectedLacre(l)}
                    >
                      Escolher
                    </Button>
                  )}
                </div>
              );})}
              {lacres.length === 0 && (
                <div className="text-sm text-muted-foreground">Nenhum lacre encontrado.</div>
              )}
            </div>
          )}

          {!loading && step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {malotes.map((m) => {
                const mid = m.id ?? m.ID ?? m.numeroMalote ?? m.NUMERO_MALOTE;
                const selectedMid = (selectedMalote?.id ?? selectedMalote?.ID ?? selectedMalote?.numeroMalote ?? selectedMalote?.NUMERO_MALOTE);
                const statusTxt = m.status || m.STATUS || '';
                const s = String(statusTxt).toLowerCase().trim();
                // Regras por evento: priorizar statusEvento quando presente
                const evRaw = m.statusEvento ?? m.STATUS_EVENTO ?? '';
                const ev = String(evRaw).toLowerCase().trim();
                const isDisponivelEv = ev === 'disponivel';
                const isIndispEv = ev === 'indisponivel';
                // Nova regra: só pode selecionar quando vier do endpoint de disponíveis (ev === 'disponivel').
                const canSelect = isDisponivelEv;
                const unavailable = !canSelect;
                return (
                <div
                  key={mid}
                  className={`border rounded p-2 flex items-center justify-between ${
                    selectedMid === mid ? 'border-primary' : ''
                  }`}
                  onClick={() => { if (!unavailable) setSelectedMalote(m); }}
                  role="button"
                >
          <div>
            <div className="text-sm font-medium">Malote #{m.numeroMalote || m.NUMERO_MALOTE || m.id || m.ID}</div>
            <div className="text-xs text-muted-foreground">
              {(() => {
                const key = String((m.id ?? m.ID ?? null) ?? String(m.numeroMalote ?? m.NUMERO_MALOTE ?? '').padStart(4, '0'));
                const idOrigem = (vinculoSetorIdPorMalote[key] ?? getMaloteSetorVinculoId(m));
                const nomeOrigem = idOrigem != null ? setorNomesPorId[idOrigem] : undefined;
                const statusTxtRaw = m.status || m.STATUS || '—';
                const statusLower = String(statusTxtRaw).toLowerCase().trim();
                // Decidir badge: eventos primeiro; fallback para texto
                const evRawLocal = m.statusEvento ?? m.STATUS_EVENTO ?? '';
                const evLocal = String(evRawLocal).toLowerCase().trim();
                const evLabelRaw = m.statusEventoLabel ?? m.STATUS_EVENTO_LABEL ?? '';
                const evLabel = String(evLabelRaw || '').trim();
                const showIndisp = evLocal === 'indisponivel';
                const showDisponivel = evLocal === 'disponivel';
                return (
                  <>
                    Vinculado : {nomeOrigem || (idOrigem ?? '—')}
                    {' '}•{' '}
                    {(showDisponivel) ? (
                      <Badge
                        variant="outline"
                        className="ml-1 bg-green-100 text-green-800 border-green-300 hover:bg-green-200"
                      >
                        {evLabel || 'Disponível'}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="ml-1 bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200"
                      >
                        {evLabel || (showIndisp ? 'Em transito / Indisponível' : 'Indisponível')}
                      </Badge>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
                  {!unavailable && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setSelectedMalote(m)}
                    >
                      Escolher
                    </Button>
                  )}
                </div>
              );})}
              {malotes.length === 0 && (
                <div className="text-sm text-muted-foreground">Nenhum malote encontrado.</div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-3 flex items-center gap-2">
          <div className="ml-auto flex items-center gap-2">
            {step === 2 && (
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Anterior
              </Button>
            )}
            {step === 1 && (
              <Button type="button" onClick={() => setStep(2)} disabled={!selectedMalote}>
                Próximo
              </Button>
            )}
            {step === 2 && (
              <Button
                type="button"
                onClick={() => {
                  if (!selectedMalote || !selectedLacre) return;
                  onSelectMalote(selectedMalote);
                  onSelectLacre(selectedLacre);
                  onClose();
                }}
                disabled={!selectedMalote || !selectedLacre}
              >
                Concluir
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SelectLacreMaloteModal;
