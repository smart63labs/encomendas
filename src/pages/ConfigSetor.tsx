import React, { useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Settings, Truck, CheckCircle, UserCheck, Bookmark, Link, AlertTriangle, Trash2, Check, Users, Package, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useSetores } from "@/components/configuracoes/hooks/useSetores";
import { ConfigUsuariosTab } from "@/components/configuracoes/tabs/ConfigUsuariosTab";

const ConfigSetor: React.FC = () => {
  const { user } = useAuth();
  const setorId = useMemo(() => {
    const raw = (user as any)?.setor_id ?? (user as any)?.setorId ?? (user as any)?.SETOR_ID;
    const num = Number(raw);
    return Number.isNaN(num) ? null : num;
  }, [user]);
  const setorNome = useMemo(() => {
    return (
      (user as any)?.setor ??
      (user as any)?.SETOR ??
      (user as any)?.nome_setor ??
      (user as any)?.NOME_SETOR ??
      ""
    );
  }, [user]);

  const [malotes, setMalotes] = useState<any[]>([]);
  const [lacres, setLacres] = useState<any[]>([]);
  const [malotesDispKeys, setMalotesDispKeys] = useState<Set<string>>(new Set());
  const [malotesStatusEventoMap, setMalotesStatusEventoMap] = useState<Map<string, string>>(new Map());
  const [searchTermMalote, setSearchTermMalote] = useState("");
  const [statusFilterMalote, setStatusFilterMalote] = useState("todos");
  const [currentPageMalote, setCurrentPageMalote] = useState(1);
  const [itemsPerPageMalote] = useState(8);
  const [lacreFilters, setLacreFilters] = useState<{ status: string; busca: string }>({ status: "todos", busca: "" });
  const [kanbanPage, setKanbanPage] = useState<Record<string, number>>({ disponiveis: 1, atribuidos: 1, utilizados: 1, destruidos: 1 });
  const itemsPerPageKanban = 5;
  const [loading, setLoading] = useState(false);
  const [showDestruirLacreModal, setShowDestruirLacreModal] = useState(false);
  const [showSolicitarLacresModal, setShowSolicitarLacresModal] = useState(false);
  const [lacreSelecionadoId, setLacreSelecionadoId] = useState<string>("");
  const [justificativaDestruicao, setJustificativaDestruicao] = useState("");
  const [solicitacaoQuantidade, setSolicitacaoQuantidade] = useState<number>(0);
  const [solicitacaoJustificativa, setSolicitacaoJustificativa] = useState("");
  const { setoresData, fetchSetores } = useSetores();

  useEffect(() => {
    fetchSetores();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!setorId) return;
      setLoading(true);
      try {
        const respMalotes = await api.listMalotes({ page: 1, limit: 1000, status: 'todos', setorId });
        const rM: any = (respMalotes as any)?.data;
        const malotesData = Array.isArray(rM?.data?.data)
          ? rM.data.data
          : Array.isArray(rM?.data?.items)
            ? rM.data.items
            : Array.isArray(rM?.data?.rows)
              ? rM.data.rows
              : Array.isArray(rM?.data)
                ? rM.data
                : Array.isArray(rM?.items)
                  ? rM.items
                  : Array.isArray(rM?.rows)
                    ? rM.rows
                    : Array.isArray(rM)
                      ? rM
                      : [];
        const respLacres = await api.listLacres({ page: 1, limit: 1000, setorId });
        const rL: any = (respLacres as any)?.data;
        const lacresData = Array.isArray(rL?.data?.data)
          ? rL.data.data
          : Array.isArray(rL?.data?.items)
            ? rL.data.items
            : Array.isArray(rL?.data?.rows)
              ? rL.data.rows
              : Array.isArray(rL?.data)
                ? rL.data
                : Array.isArray(rL?.items)
                  ? rL.items
                  : Array.isArray(rL?.rows)
                    ? rL.rows
                    : Array.isArray(rL)
                      ? rL
                      : [];
        setMalotes(malotesData);
        // Buscar disponíveis e status de eventos alinhado à regra consolidada
        const dispParams: any = { setorId };
        const respDisp = await api.listMalotesDisponiveis(dispParams);
        const listaDisp: any[] = Array.isArray(respDisp?.data?.data ?? respDisp?.data) ? (respDisp?.data?.data ?? respDisp?.data) : [];
        const toKey = (m: any) => String((m.id ?? m.ID ?? null) ?? String(m.numeroMalote ?? m.NUMERO_MALOTE ?? '').padStart(4, '0'));
        const dispSet = new Set<string>(listaDisp.map((m: any) => toKey(m)));
        setMalotesDispKeys(dispSet);

        const statusParams: any = { setorId };
        const respStatusEv = await api.listMalotesStatusEventos(statusParams);
        const listaStatusEv: any[] = Array.isArray(respStatusEv?.data?.data ?? respStatusEv?.data) ? (respStatusEv?.data?.data ?? respStatusEv?.data) : [];
        const evMap = new Map<string, string>();
        for (const r of listaStatusEv) {
          const key = String((r.ID ?? r.id ?? null) ?? String(r.NUMERO_MALOTE ?? r.numeroMalote ?? '').padStart(4, '0'));
          const raw = r.STATUS_EVENTO ?? r.status_evento ?? r.STATUS ?? r.status ?? '';
          evMap.set(key, String(raw).toLowerCase().trim());
        }
        setMalotesStatusEventoMap(evMap);
        setLacres(lacresData);
      } catch (_) {
        setMalotes([]);
        setLacres([]);
        setMalotesDispKeys(new Set());
        setMalotesStatusEventoMap(new Map());
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [setorId]);

  const normalizeStatus = (s: any) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const toMaloteKey = (m: any) => String((m.id ?? m.ID ?? null) ?? String(m.numeroMalote ?? m.NUMERO_MALOTE ?? '').padStart(4, '0'));
  const getMaloteStatusKey = (m: any) => {
    const key = toMaloteKey(m);
    const ev = malotesStatusEventoMap.get(key) || '';
    if (['em_transito','indisponivel'].includes(ev)) return ev;
    if (malotesDispKeys.has(key)) return 'disponivel';
    if (ev) return ev;
    return normalizeStatus(m.status ?? m.STATUS ?? m.situacao ?? m.SITUACAO ?? '');
  };
  const isMaloteDisponivel = (key: string) => ['disponivel', 'disponível'].includes(key);
  const isMaloteEmTransito = (key: string) => ['em_transito', 'transito', 'em transito', 'em trânsito', 'indisponivel', 'indisponível'].includes(key);
  const maloteStatusLabels: Record<string, string> = { disponivel: 'DISPONÍVEL', 'em_transito': 'INDISPONÍVEL / EM TRÂNSITO', indisponivel: 'INDISPONÍVEL / EM TRÂNSITO' };
  const getMaloteBadgeVisual = (m: any) => {
    const key = getMaloteStatusKey(m);
    if (isMaloteDisponivel(key)) {
      return { label: 'Disponível', classes: 'bg-accent-green text-white', icon: CheckCircle };
    }
    return { label: 'Em Trânsito', classes: 'bg-accent-orange text-white', icon: Truck };
  };
  const lacreStatusLabels: Record<string, string> = {
    disponivel: 'DISPONÍVEL',
    atribuido: 'ATRIBUÍDO',
    reservado: 'RESERVADO',
    vinculado: 'VINCULADO',
    utilizado: 'UTILIZADO',
    extraviado: 'EXTRAVIADO',
    danificado: 'DANIFICADO',
    destruido: 'DESTRUÍDO'
  };
  const getLacreBadgeVisual = (l: any) => {
    const k = getStatusKey(l);
    switch (k) {
      case 'disponivel':
        return { label: lacreStatusLabels['disponivel'], classes: 'bg-accent-green text-white', icon: CheckCircle };
      case 'atribuido':
        return { label: lacreStatusLabels['disponivel'], classes: 'bg-accent-green text-white', icon: CheckCircle };
      case 'reservado':
        return { label: lacreStatusLabels['reservado'], classes: 'bg-primary text-primary-foreground', icon: Bookmark };
      case 'vinculado':
        return { label: lacreStatusLabels['vinculado'], classes: 'bg-primary text-primary-foreground', icon: Link };
      case 'utilizado':
        return { label: lacreStatusLabels['utilizado'], classes: 'bg-blue-500 text-white', icon: Check };
      case 'extraviado':
        return { label: lacreStatusLabels['extraviado'], classes: 'bg-accent-red text-white', icon: AlertTriangle };
      case 'danificado':
        return { label: lacreStatusLabels['danificado'], classes: 'bg-accent-red text-white', icon: AlertTriangle };
      case 'destruido':
        return { label: lacreStatusLabels['destruido'], classes: 'bg-accent-red text-white', icon: Trash2 };
      default:
        return { label: String(k || '-').toUpperCase(), classes: 'bg-muted text-foreground', icon: Check };
    }
  };
  const destruirLacre = async () => {
    try {
      const l = availableLacres.find((x: any) => String(x.id ?? x.ID) === lacreSelecionadoId);
      const lid = l ? (l.id ?? l.ID) : null;
      if (!lid) return;
      await api.updateLacre(lid, { status: 'destruido', motivoDestruicao: justificativaDestruicao });
      const resp = await api.listLacres({ page: 1, limit: 1000, setorId });
      const rL: any = (resp as any)?.data;
      const lacresData = Array.isArray(rL?.data?.data)
        ? rL.data.data
        : Array.isArray(rL?.data)
          ? rL.data
          : Array.isArray(rL)
            ? rL
            : [];
      setLacres(lacresData);
      setShowDestruirLacreModal(false);
      setLacreSelecionadoId("");
      setJustificativaDestruicao("");
    } catch (_) {}
  };
  const solicitarLacres = async () => {
    try {
      await api.post('/lacres/solicitacao', { setorId, quantidade: solicitacaoQuantidade, justificativa: solicitacaoJustificativa });
      setShowSolicitarLacresModal(false);
      setSolicitacaoQuantidade(0);
      setSolicitacaoJustificativa("");
    } catch (_) {}
  };
  const getStatusKey = (l: any) => normalizeStatus(l.status ?? l.STATUS ?? '');
  const filteredLacres = useMemo(() => {
    let list = [...lacres].filter(l => String(l.setorId ?? l.SETOR_ID ?? '').trim() === String(setorId));
    const term = lacreFilters.busca.toLowerCase();
    if (term) list = list.filter(l => String(l.codigo ?? l.CODIGO ?? '').toLowerCase().includes(term) || String(l.loteNumero ?? l.LOTE_NUMERO ?? '').toLowerCase().includes(term));
    const k = lacreFilters.status;
    if (k !== 'todos') {
      if (k === 'disponiveis') {
        list = list.filter(l => ['disponivel','atribuido'].includes(getStatusKey(l)));
      } else if (k === 'utilizados') {
        list = list.filter(l => getStatusKey(l) === 'utilizado');
      } else if (k === 'destruidos') {
        list = list.filter(l => ['destruido','extraviado','danificado'].includes(getStatusKey(l)));
      }
    }
    list.sort((a, b) => {
      const av = String(a.codigo ?? a.CODIGO ?? a.loteNumero ?? a.LOTE_NUMERO ?? '').replace(/\D/g, '');
      const bv = String(b.codigo ?? b.CODIGO ?? b.loteNumero ?? b.LOTE_NUMERO ?? '').replace(/\D/g, '');
      const an = av ? Number(av) : Number.MAX_SAFE_INTEGER;
      const bn = bv ? Number(bv) : Number.MAX_SAFE_INTEGER;
      if (an !== bn) return an - bn;
      const as = String(a.codigo ?? a.CODIGO ?? '');
      const bs = String(b.codigo ?? b.CODIGO ?? '');
      return as.localeCompare(bs);
    });
    return list;
  }, [lacres, setorId, lacreFilters]);
  const availableLacres = useMemo(() => filteredLacres.filter(l => ['disponivel','atribuido'].includes(getStatusKey(l))), [filteredLacres]);
  const splitGrouped = useMemo(() => {
    const disponiveis = filteredLacres.filter(l => ['disponivel','atribuido'].includes(getStatusKey(l)));
    const atribuidos = filteredLacres.filter(l => ['atribuido','reservado','vinculado'].includes(getStatusKey(l)));
    const utilizados = filteredLacres.filter(l => getStatusKey(l) === 'utilizado');
    const destruidos = filteredLacres.filter(l => ['destruido','extraviado','danificado'].includes(getStatusKey(l)));
    return { disponiveis, atribuidos, utilizados, destruidos };
  }, [filteredLacres]);
  const paged = (arr: any[], key: keyof typeof splitGrouped) => {
    const pageKey = String(key);
    const page = kanbanPage[pageKey] || 1;
    const start = (page - 1) * itemsPerPageKanban;
    return arr.slice(start, start + itemsPerPageKanban);
  };
  const changePage = (key: keyof typeof splitGrouped, dir: 1 | -1) => {
    const pageKey = String(key);
    const total = splitGrouped[key].length;
    const maxPage = Math.max(1, Math.ceil(total / itemsPerPageKanban));
    const next = Math.min(maxPage, Math.max(1, (kanbanPage[pageKey] || 1) + dir));
    setKanbanPage(prev => ({ ...prev, [pageKey]: next }));
  };

  const filteredMalotes = useMemo(() => {
    const s = String(setorId);
    let list = [...malotes].filter((m) => {
      const origem = m.setorOrigemId ?? m.SETOR_ORIGEM_ID ?? m.setor_id_origem ?? m.SETOR_ID_ORIGEM;
      const destino = m.setorDestinoId ?? m.SETOR_DESTINO_ID ?? m.setor_id_destino ?? m.SETOR_ID_DESTINO;
      const atual = m.setorId ?? m.SETOR_ID;
      return [origem, destino, atual].some((v) => String(v ?? '').trim() === s);
    });
    const term = searchTermMalote.trim().toLowerCase();
    if (term) {
      list = list.filter(m => String(m.numeroMalote ?? m.NUMERO_MALOTE ?? '').toLowerCase().includes(term));
    }
    if (statusFilterMalote !== 'todos') {
      if (statusFilterMalote === 'disponiveis') {
        list = list.filter((m: any) => isMaloteDisponivel(getMaloteStatusKey(m)));
      } else if (statusFilterMalote === 'transito') {
        list = list.filter((m: any) => isMaloteEmTransito(getMaloteStatusKey(m)));
      }
    }
    list.sort((a, b) => {
      const av = String(a.numeroMalote ?? a.NUMERO_MALOTE ?? a.id ?? a.ID ?? '').replace(/\D/g, '');
      const bv = String(b.numeroMalote ?? b.NUMERO_MALOTE ?? b.id ?? b.ID ?? '').replace(/\D/g, '');
      const an = av ? Number(av) : Number.MAX_SAFE_INTEGER;
      const bn = bv ? Number(bv) : Number.MAX_SAFE_INTEGER;
      return an - bn;
    });
    return list;
  }, [malotes, setorId, searchTermMalote, statusFilterMalote, malotesDispKeys, malotesStatusEventoMap]);
  const totalPagesMalote = Math.max(1, Math.ceil(filteredMalotes.length / itemsPerPageMalote));
  const startIndexMalote = (currentPageMalote - 1) * itemsPerPageMalote;
  const endIndexMalote = Math.min(startIndexMalote + itemsPerPageMalote, filteredMalotes.length);
  const paginatedMalotes = filteredMalotes.slice(startIndexMalote, endIndexMalote);

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Configurações do Setor</h1>
            <p className="text-sm text-muted-foreground">Informações de Malotes e Lacres vinculados ao seu setor</p>
          </div>
          {setorNome && <Badge variant="secondary" className="text-xs">{String(setorNome)}</Badge>}
        </div>

        <Tabs defaultValue="malotes">
          <TabsList className="mb-4">
            <TabsTrigger value="malotes"><Package className="w-4 h-4 mr-1" /> Malotes</TabsTrigger>
            <TabsTrigger value="lacres"><FileText className="w-4 h-4 mr-1" /> Lacres</TabsTrigger>
            <TabsTrigger value="usuarios"><Users className="w-4 h-4 mr-1" /> Usuários</TabsTrigger>
          </TabsList>

          <TabsContent value="malotes">
            <Card className="card-govto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" /> Gerenciamento de Malotes
                    </CardTitle>
                    <CardDescription>Malotes vinculados ao seu setor</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por Nº do malote"
                        value={searchTermMalote}
                        onChange={(e) => { setSearchTermMalote(e.target.value); setCurrentPageMalote(1); }}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Select value={statusFilterMalote} onValueChange={(v) => { setStatusFilterMalote(v); setCurrentPageMalote(1); }}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="disponiveis">Disponíveis</SelectItem>
                        <SelectItem value="transito">Em trânsito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {loading ? (
                  <div className="text-sm text-muted-foreground">Carregando...</div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm text-muted-foreground">Exibindo {paginatedMalotes.length} de {filteredMalotes.length} malotes</p>
                      {(searchTermMalote || statusFilterMalote !== 'todos') && (
                        <button className="border rounded px-3 h-8" onClick={() => { setSearchTermMalote(''); setStatusFilterMalote('todos'); setCurrentPageMalote(1); }}>Limpar filtros</button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {paginatedMalotes.map((m: any) => (
                        <Card key={m.id ?? m.ID ?? m.numeroMalote ?? m.NUMERO_MALOTE} className="border">
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="text-sm font-bold text-primary">Malote {m.numeroMalote ?? m.NUMERO_MALOTE ?? '-'}</div>
                                <div className="text-xs text-muted-foreground">Origem: {m.setorOrigemNome ?? m.SETOR_ORIGEM_NOME ?? '-'}</div>
                                <div className="text-xs text-muted-foreground">Destino: {m.setorDestinoNome ?? m.SETOR_DESTINO_NOME ?? '-'}</div>
                              </div>
                              {(() => {
                                const v = getMaloteBadgeVisual(m);
                                const Icon = v.icon;
                                return (
                                  <Badge className={`text-[11px] px-2 py-1 ${v.classes} flex items-center gap-1`}>
                                    <Icon className="w-3 h-3" />
                                    {v.label}
                                  </Badge>
                                );
                              })()}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {paginatedMalotes.length === 0 && (
                        <div className="text-sm text-muted-foreground">Nenhum malote encontrado.</div>
                      )}
                    </div>

                    {totalPagesMalote > 1 && (
                      <div className="flex items-center justify-between px-2 py-2 border-t mt-4 flex-wrap gap-2">
                        <div className="text-xs text-muted-foreground">
                          Mostrando {filteredMalotes.length === 0 ? 0 : startIndexMalote + 1} a {endIndexMalote} de {filteredMalotes.length}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button className="border rounded px-2 h-8" onClick={() => setCurrentPageMalote(prev => Math.max(prev - 1, 1))} disabled={currentPageMalote === 1}>Anterior</button>
                          <div className="flex items-center gap-1 flex-wrap">
                            {Array.from({ length: totalPagesMalote }).map((_, i) => (
                              <button key={i} className={`border rounded px-2 h-8 ${currentPageMalote === i + 1 ? 'bg-primary text-white' : ''}`} onClick={() => setCurrentPageMalote(i + 1)}>{i + 1}</button>
                            ))}
                          </div>
                          <button className="border rounded px-2 h-8" onClick={() => setCurrentPageMalote(prev => Math.min(prev + 1, totalPagesMalote))} disabled={currentPageMalote === totalPagesMalote}>Próximo</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lacres">
            <Card className="card-govto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Settings className="w-5 h-5" /> Gerenciamento de Lacres
                    </CardTitle>
                    <CardDescription>
                      Mantenha o controle sobre lacres disponiveis, atribuidos, utilizados e Destruidos
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button className="btn-govto-secondary h-9" onClick={() => setShowDestruirLacreModal(true)}>Destruir Lacre</Button>
                    <Button className="btn-govto-orange h-9" onClick={() => setShowSolicitarLacresModal(true)}>Solicitar Lacres</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por código ou lote"
                        value={lacreFilters.busca}
                        onChange={(e) => setLacreFilters(prev => ({ ...prev, busca: e.target.value }))}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Select value={lacreFilters.status} onValueChange={(v) => setLacreFilters(prev => ({ ...prev, status: v }))}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="disponiveis">Disponíveis</SelectItem>
                        <SelectItem value="utilizados">Utilizados</SelectItem>
                        <SelectItem value="destruidos">Destruídos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                  <Card className="border">
                  <CardHeader>
                    <CardTitle className="text-base">Disponíveis ({splitGrouped.disponiveis.length})</CardTitle>
                    <CardDescription>Lacres livres para utilização</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-sm text-muted-foreground">Carregando...</div>
                    ) : (
                      <div className="space-y-2">
                          {paged(splitGrouped.disponiveis, 'disponiveis').map((l: any) => (
                            <div key={l.id ?? l.ID ?? l.codigo ?? l.CODIGO} className="border rounded p-2 flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium">{l.codigo ?? l.CODIGO ?? "-"}</div>
                                <div className="text-xs text-muted-foreground">Lote: {l.loteNumero ?? l.LOTE_NUMERO ?? "-"}</div>
                              </div>
                              {(() => {
                                const v = getLacreBadgeVisual(l);
                                const Icon = v.icon;
                                return (
                                  <Badge className={`text-[11px] px-2 py-1 ${v.classes} flex items-center gap-1`}>
                                    <Icon className="w-3 h-3" />
                                    {v.label}
                                  </Badge>
                                );
                              })()}
                            </div>
                          ))}
                          {splitGrouped.disponiveis.length === 0 && (
                            <div className="text-sm text-muted-foreground">Nenhum item</div>
                          )}
                          {splitGrouped.disponiveis.length > itemsPerPageKanban && (
                            <div className="flex items-center justify-between mt-2">
                              <button className="border rounded px-2 h-8" onClick={() => changePage('disponiveis', -1)}>Anterior</button>
                              <span className="text-xs text-muted-foreground">Página {(kanbanPage['disponiveis']||1)} de {Math.ceil(splitGrouped.disponiveis.length / itemsPerPageKanban)}</span>
                              <button className="border rounded px-2 h-8" onClick={() => changePage('disponiveis', 1)}>Próxima</button>
                            </div>
                          )}
                        </div>
                      )}
                  </CardContent>
                  </Card>

                  <Card className="border">
                    <CardHeader>
                      <CardTitle className="text-base">Utilizados ({splitGrouped.utilizados.length})</CardTitle>
                      <CardDescription>Lacres já utilizados</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="text-sm text-muted-foreground">Carregando...</div>
                      ) : (
                        <div className="space-y-2">
                          {paged(splitGrouped.utilizados, 'utilizados').map((l: any) => (
                            <div key={l.id ?? l.ID ?? l.codigo ?? l.CODIGO} className="border rounded p-2 flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium">{l.codigo ?? l.CODIGO ?? "-"}</div>
                                <div className="text-xs text-muted-foreground">Lote: {l.loteNumero ?? l.LOTE_NUMERO ?? "-"}</div>
                              </div>
                              {(() => {
                                const v = getLacreBadgeVisual(l);
                                const Icon = v.icon;
                                return (
                                  <Badge className={`text-[11px] px-2 py-1 ${v.classes} flex items-center gap-1`}>
                                    <Icon className="w-3 h-3" />
                                    {v.label}
                                  </Badge>
                                );
                              })()}
                            </div>
                          ))}
                          {splitGrouped.utilizados.length === 0 && (
                            <div className="text-sm text-muted-foreground">Nenhum item</div>
                          )}
                          {splitGrouped.utilizados.length > itemsPerPageKanban && (
                            <div className="flex items-center justify-between mt-2">
                              <button className="border rounded px-2 h-8" onClick={() => changePage('utilizados', -1)}>Anterior</button>
                              <span className="text-xs text-muted-foreground">Página {(kanbanPage['utilizados']||1)} de {Math.ceil(splitGrouped.utilizados.length / itemsPerPageKanban)}</span>
                              <button className="border rounded px-2 h-8" onClick={() => changePage('utilizados', 1)}>Próxima</button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border">
                    <CardHeader>
                      <CardTitle className="text-base">Destruídos ({splitGrouped.destruidos.length})</CardTitle>
                      <CardDescription>Lacres eliminados do ciclo</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="text-sm text-muted-foreground">Carregando...</div>
                      ) : (
                        <div className="space-y-2">
                          {paged(splitGrouped.destruidos, 'destruidos').map((l: any) => (
                            <div key={l.id ?? l.ID ?? l.codigo ?? l.CODIGO} className="border rounded p-2 flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium">{l.codigo ?? l.CODIGO ?? "-"}</div>
                                <div className="text-xs text-muted-foreground">Lote: {l.loteNumero ?? l.LOTE_NUMERO ?? "-"}</div>
                              </div>
                              {(() => {
                                const v = getLacreBadgeVisual(l);
                                const Icon = v.icon;
                                return (
                                  <Badge className={`text-[11px] px-2 py-1 ${v.classes} flex items-center gap-1`}>
                                    <Icon className="w-3 h-3" />
                                    {v.label}
                                  </Badge>
                                );
                              })()}
                            </div>
                          ))}
                          {splitGrouped.destruidos.length === 0 && (
                            <div className="text-sm text-muted-foreground">Nenhum item</div>
                          )}
                          {splitGrouped.destruidos.length > itemsPerPageKanban && (
                            <div className="flex items-center justify-between mt-2">
                              <button className="border rounded px-2 h-8" onClick={() => changePage('destruidos', -1)}>Anterior</button>
                              <span className="text-xs text-muted-foreground">Página {(kanbanPage['destruidos']||1)} de {Math.ceil(splitGrouped.destruidos.length / itemsPerPageKanban)}</span>
                              <button className="border rounded px-2 h-8" onClick={() => changePage('destruidos', 1)}>Próxima</button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                <Dialog open={showDestruirLacreModal} onOpenChange={setShowDestruirLacreModal}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Destruir Lacre</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm">Selecione o lacre disponível</label>
                        <Select value={lacreSelecionadoId} onValueChange={setLacreSelecionadoId}>
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder="Escolher lacre" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableLacres.map((l: any) => (
                              <SelectItem key={l.id ?? l.ID} value={String(l.id ?? l.ID)}>
                                {String(l.codigo ?? l.CODIGO ?? '-')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm">Justificativa</label>
                        <Input value={justificativaDestruicao} onChange={(e) => setJustificativaDestruicao(e.target.value)} placeholder="Descreva o motivo" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button className="btn-govto-secondary" onClick={() => setShowDestruirLacreModal(false)}>Cancelar</Button>
                      <Button className="btn-govto-primary" onClick={destruirLacre} disabled={!lacreSelecionadoId || !justificativaDestruicao}>Confirmar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog open={showSolicitarLacresModal} onOpenChange={setShowSolicitarLacresModal}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Solicitar Lacres</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm">Quantidade</label>
                        <Input type="number" min={0} value={String(solicitacaoQuantidade)} onChange={(e) => setSolicitacaoQuantidade(Number(e.target.value))} />
                      </div>
                      <div>
                        <label className="text-sm">Justificativa</label>
                        <Input value={solicitacaoJustificativa} onChange={(e) => setSolicitacaoJustificativa(e.target.value)} placeholder="Descreva a necessidade" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button className="btn-govto-secondary" onClick={() => setShowSolicitarLacresModal(false)}>Cancelar</Button>
                      <Button className="btn-govto-primary" onClick={solicitarLacres} disabled={!solicitacaoQuantidade || !solicitacaoJustificativa}>Enviar solicitação</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usuarios">
            <ConfigUsuariosTab
              setoresData={setoresData}
              limitToSetorId={setorId ?? undefined}
              limitToSetorName={setorNome ? String(setorNome) : undefined}
              readOnly={true}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ConfigSetor;
