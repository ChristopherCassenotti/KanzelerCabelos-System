import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AgendaInbox } from "../components/schedule/AgendaInbox";
import { ConfirmDialog } from "../components/contacts/ConfirmDialog";
import { PurchaseFormModal } from "../components/purchases/PurchaseFormModal";
import { RouteDayPanel } from "../components/schedule/RouteDayPanel";
import { RouteMapCard } from "../components/schedule/RouteMapCard";
import { RouteSettingsCard } from "../components/schedule/RouteSettingsCard";
import { VisitResultDialog } from "../components/schedule/VisitResultDialog";
import { getContact, listCities } from "../services/contacts/contacts.service";
import {
  addVisit,
  calculateRouteTimes,
  completeRouteItem,
  createRoute,
  createTask,
  exportRoute,
  getRoute,
  getRouteMap,
  getScheduleSummary,
  listRoutes,
  listScheduleCandidates,
  optimizeRoute,
  postponeVisit,
  removeRouteItem,
  reorderRouteItems,
  updateRoute,
} from "../services/schedule/schedule.service";
import type {
  RouteDay,
  RouteItem,
  RouteMapDto,
  RouteSettingsDraft,
  ScheduleCandidate,
  ScheduleCandidateType,
  VisitResult,
} from "../types/schedule";
import {
  addDaysToISO,
  dayNumber,
  formatBusinessDateLong,
  formatWeekdayShort,
  getTodayInSaoPauloISO,
  getTomorrowInSaoPauloISO,
  startOfWeekMondayISO,
} from "../utils/date";

function isISODate(value: string | null) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}

function money(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00";
}

function routeVisitCount(route: RouteDay | undefined) {
  return (route?.itens ?? []).filter((item) => item.tipo === "visita").length;
}

function buildGoogleMapsRoute(routeMap: RouteMapDto | null | undefined) {
  if (!routeMap) return null;

  const originLat = Number(routeMap.partida.lat);
  const originLng = Number(routeMap.partida.lng);
  const origin = Number.isFinite(originLat) && Number.isFinite(originLng)
    ? `${originLat},${originLng}`
    : `${routeMap.partida.nome}, ${routeMap.partida.uf}, Brasil`;

  const stops = routeMap.paradas
    .filter((stop) => !stop.concluido)
    .map((stop) => {
      const lat = Number(stop.contato.lat);
      const lng = Number(stop.contato.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return `${lat},${lng}`;
      return [stop.contato.endereco, stop.contato.cidade?.nome, stop.contato.cidade?.uf]
        .filter(Boolean)
        .join(", ");
    })
    .filter(Boolean);

  if (stops.length === 0) return null;

  const params = new URLSearchParams({
    api: "1",
    origin,
    destination: origin,
    travelmode: "driving",
  });

  params.set("waypoints", stops.join("|"));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function AgendaPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const today = useMemo(() => getTodayInSaoPauloISO(), []);
  const selectedDate = isISODate(searchParams.get("data")) ? searchParams.get("data")! : today;
  const weekStart = startOfWeekMondayISO(selectedDate);
  const weekEnd = addDaysToISO(weekStart, 6);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDaysToISO(weekStart, index)), [weekStart]);

  const [candidateType, setCandidateType] = useState<"todos" | ScheduleCandidateType>("todos");
  const [candidateCityId, setCandidateCityId] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);
  const [visitDialogItem, setVisitDialogItem] = useState<RouteItem | null>(null);
  const [removeItem, setRemoveItem] = useState<RouteItem | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [pendingPurchase, setPendingPurchase] = useState<{ contactId: string; visitId: string } | null>(null);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);

  const routesQuery = useQuery({
    queryKey: ["routes", "week", weekStart, weekEnd],
    queryFn: () => listRoutes(weekStart, weekEnd),
  });

  const citiesQuery = useQuery({ queryKey: ["cities"], queryFn: listCities });
  const scheduleSummaryQuery = useQuery({ queryKey: ["agenda", "summary"], queryFn: getScheduleSummary });
  const candidatesQuery = useQuery({
    queryKey: ["agenda", "candidates", candidateType, candidateCityId],
    queryFn: () => listScheduleCandidates({
      ...(candidateType !== "todos" ? { tipo: candidateType } : {}),
      ...(candidateCityId ? { cidadeId: candidateCityId } : {}),
    }),
  });

  const purchaseContactQuery = useQuery({
    queryKey: ["contacts", "detail", pendingPurchase?.contactId],
    queryFn: () => getContact(pendingPurchase!.contactId),
    enabled: Boolean(pendingPurchase?.contactId),
    staleTime: 10_000,
  });

  const selectedRouteSummary = useMemo(
    () => (routesQuery.data ?? []).find((route) => route.data === selectedDate) ?? null,
    [routesQuery.data, selectedDate],
  );

  const routeDetailQuery = useQuery({
    queryKey: ["routes", "detail", selectedRouteSummary?.id],
    queryFn: () => getRoute(selectedRouteSummary!.id),
    enabled: Boolean(selectedRouteSummary?.id),
  });

  const routeMapQuery = useQuery({
    queryKey: ["routes", "map", selectedRouteSummary?.id],
    queryFn: () => getRouteMap(selectedRouteSummary!.id),
    enabled: Boolean(selectedRouteSummary?.id),
    retry: 1,
  });

  const route = routeDetailQuery.data ?? selectedRouteSummary;
  const routeMap = routeMapQuery.data ?? null;
  const cities = citiesQuery.data ?? [];
  const candidates = candidatesQuery.data ?? [];
  const defaultCity = cities.find((city) => city.nome === "União da Vitória") ?? cities[0];
  const pageLoading = routesQuery.isPending || citiesQuery.isPending;

  function selectDate(date: string) {
    const next = new URLSearchParams(searchParams);
    next.set("data", date);
    setSearchParams(next);
    setPendingPurchase(null);
    setPurchaseModalOpen(false);
    setFeedback(null);
  }

  async function invalidateAgenda() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["routes"] }),
      queryClient.invalidateQueries({ queryKey: ["agenda"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["contacts"] }),
      queryClient.invalidateQueries({ queryKey: ["repurchases"] }),
      queryClient.invalidateQueries({ queryKey: ["reports"] }),
    ]);
  }

  async function refreshSelectedRoute() {
    await Promise.all([
      routesQuery.refetch(),
      selectedRouteSummary?.id ? routeDetailQuery.refetch() : Promise.resolve(),
      selectedRouteSummary?.id ? routeMapQuery.refetch() : Promise.resolve(),
      candidatesQuery.refetch(),
      scheduleSummaryQuery.refetch(),
    ]);
  }

  async function ensureRouteForDate(date: string) {
    const existing = (routesQuery.data ?? []).find((current) => current.data === date);
    if (existing) return existing;

    if (!defaultCity) throw new Error("Nenhuma cidade cadastrada para criar a rota.");

    const created = await createRoute({
      data: date,
      partidaCidadeId: defaultCity.id,
      horaSaida: "08:00",
      minutosPorVisita: 40,
      custoCombustivel: "0.00",
      custoAlimentacao: "0.00",
      custoHospedagem: "0.00",
      custoOutros: "0.00",
    });

    await routesQuery.refetch();
    return created;
  }

  async function withBusy<T>(key: string, action: () => Promise<T>, success?: string) {
    setBusy(key);
    setFeedback(null);
    try {
      const result = await action();
      if (success) setFeedback({ tone: "success", text: success });
      return result;
    } catch (error) {
      setFeedback({ tone: "error", text: errorMessage(error) });
      throw error;
    } finally {
      setBusy(null);
    }
  }

  async function handleAddContact(contactId: string, date = selectedDate) {
    try {
      await withBusy(`add:${contactId}`, async () => {
        const targetRoute = await ensureRouteForDate(date);
        await addVisit(targetRoute.id, { contatoId: contactId });
        await invalidateAgenda();
      }, date === selectedDate ? "Cliente adicionada à rota." : "Cliente movida para o dia selecionado.");
      if (date !== selectedDate) selectDate(date);
    } catch {
      // erro já exibido por withBusy
    }
  }

  async function handleSaveSettings(draft: RouteSettingsDraft) {
    try {
      await withBusy("settings", async () => {
        const payload = {
          partidaCidadeId: draft.partidaCidadeId,
          horaSaida: draft.horaSaida,
          minutosPorVisita: draft.minutosPorVisita,
          custoCombustivel: money(draft.custoCombustivel),
          custoAlimentacao: money(draft.custoAlimentacao),
          custoHospedagem: money(draft.custoHospedagem),
          custoOutros: money(draft.custoOutros),
        };

        if (route?.id) {
          await updateRoute(route.id, payload);
        } else {
          await createRoute({ data: selectedDate, ...payload });
        }

        await invalidateAgenda();
      }, route ? "Configurações da rota salvas." : "Rota criada para este dia.");
    } catch {
      // erro já exibido
    }
  }

  async function handleCreateTask(title: string) {
    try {
      await withBusy("task", async () => {
        const targetRoute = route ?? await ensureRouteForDate(selectedDate);
        await createTask(targetRoute.id, { titulo: title });
        await invalidateAgenda();
      }, "Tarefa adicionada.");
    } catch {
      // erro já exibido
    }
  }

  async function handleComplete(item: RouteItem) {
    if (!route) return;
    if (item.tipo === "visita") {
      setVisitDialogItem(item);
      return;
    }

    try {
      await withBusy(`complete:${item.id}`, async () => {
        await completeRouteItem(route.id, item.id, {});
        await invalidateAgenda();
      }, "Tarefa concluída.");
    } catch {
      // erro já exibido
    }
  }

  async function handleVisitResult(result: VisitResult) {
    const item = visitDialogItem;
    if (!route || !item) return;

    try {
      if (result === "remarcar") {
        const response = await withBusy(`result:${item.id}`, async () => {
          const moved = await postponeVisit(route.id, item.id);
          await invalidateAgenda();
          return moved;
        });
        setFeedback({
          tone: "success",
          text: `Visita remarcada${response?.novaData ? ` para ${response.novaData}` : " para o dia seguinte"}.`,
        });
      } else {
        await withBusy(`result:${item.id}`, async () => {
          const response = await completeRouteItem(route.id, item.id, { resultado: result });
          await invalidateAgenda();

          if (result === "comprou" && item.contato?.id && (response.exigeRegistroCompra ?? true)) {
            setPendingPurchase({ contactId: item.contato.id, visitId: item.id });
            setPurchaseModalOpen(true);
          }
        }, result === "comprou" ? "Visita concluída. Registre agora a compra." : "Resultado da visita salvo.");
      }
      setVisitDialogItem(null);
    } catch {
      // erro já exibido
    }
  }

  async function handleRemoveItem() {
    if (!route || !removeItem) return;
    const item = removeItem;
    try {
      await withBusy(`remove:${item.id}`, async () => {
        await removeRouteItem(route.id, item.id);
        await invalidateAgenda();
      }, item.tipo === "visita" ? "Visita removida da rota." : "Tarefa removida.");
      setRemoveItem(null);
    } catch {
      // erro já exibido
    }
  }

  async function handlePostpone(item: RouteItem) {
    if (!route) return;
    try {
      const response = await withBusy(`postpone:${item.id}`, async () => {
        const result = await postponeVisit(route.id, item.id);
        await invalidateAgenda();
        return result;
      });
      setFeedback({ tone: "success", text: `Visita adiada${response?.novaData ? ` para ${response.novaData}` : " para o dia seguinte"}.` });
    } catch {
      // erro já exibido
    }
  }

  async function persistOrder(itemIds: string[], message?: string) {
    if (!route) return;
    try {
      await withBusy("order", async () => {
        await reorderRouteItems(route.id, itemIds);
        await invalidateAgenda();
      }, message);
    } catch {
      // erro já exibido
    }
  }

  function handleMove(itemId: string, direction: -1 | 1) {
    const items = [...(route?.itens ?? [])].sort((a, b) => a.ordem - b.ordem);
    const index = items.findIndex((item) => item.id === itemId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    void persistOrder(items.map((item) => item.id));
  }

  function handleReorderDrop(sourceId: string, targetId: string) {
    const items = [...(route?.itens ?? [])].sort((a, b) => a.ordem - b.ordem);
    const sourceIndex = items.findIndex((item) => item.id === sourceId);
    const targetIndex = items.findIndex((item) => item.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [moved] = items.splice(sourceIndex, 1);
    items.splice(targetIndex, 0, moved);
    void persistOrder(items.map((item) => item.id), "Ordem da rota atualizada.");
  }

  async function handleOptimize() {
    if (!route) return;
    try {
      await withBusy("optimize", async () => {
        await optimizeRoute(route.id);
        await invalidateAgenda();
      }, "Rota organizada pela menor distância.");
    } catch {
      // erro já exibido
    }
  }

  async function handleCalculateTimes() {
    if (!route) return;
    try {
      await withBusy("times", async () => {
        await calculateRouteTimes(route.id);
        await invalidateAgenda();
      }, "Horários calculados e salvos.");
    } catch {
      // erro já exibido
    }
  }

  async function handleExport() {
    if (!route) return;
    try {
      await withBusy("export", async () => {
        const blob = await exportRoute(route.id);
        downloadBlob(blob, `rota-kanzler-${selectedDate}.xlsx`);
      }, "Planilha da rota gerada.");
    } catch {
      // erro já exibido
    }
  }

  function handleGoogleMaps() {
    const url = buildGoogleMapsRoute(routeMap);
    if (!url) {
      setFeedback({ tone: "info", text: "O mapa ainda não possui paradas suficientes para abrir a rota no Google Maps." });
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (pageLoading) {
    return (
      <div className="grid min-h-[420px] place-items-center">
        <div className="text-center text-sm text-[var(--kanzler-muted)]">
          <LoaderCircle size={26} className="mx-auto mb-3 animate-spin text-[var(--kanzler-blue)]" />
          Carregando agenda...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="agenda-print-hide space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => selectDate(addDaysToISO(selectedDate, -7))} className="grid h-9 w-9 place-items-center rounded-[10px] border border-[var(--kanzler-line)] bg-white"><ChevronLeft size={16} /></button>
          <button type="button" onClick={() => selectDate(today)} className="rounded-[10px] border border-[var(--kanzler-line)] bg-white px-3 py-2 text-[12px] font-semibold">Hoje</button>
          <button type="button" onClick={() => selectDate(getTomorrowInSaoPauloISO())} className="rounded-[10px] border border-[var(--kanzler-line)] bg-white px-3 py-2 text-[12px] font-semibold">Amanhã</button>
          <button type="button" onClick={() => selectDate(addDaysToISO(selectedDate, 7))} className="grid h-9 w-9 place-items-center rounded-[10px] border border-[var(--kanzler-line)] bg-white"><ChevronRight size={16} /></button>
          <h2 className="kanzler-display ml-1 text-[18px] font-bold">{formatBusinessDateLong(selectedDate)}</h2>
          <label className="ml-auto inline-flex items-center gap-2 rounded-[10px] border border-[var(--kanzler-line)] bg-white px-3 py-2 text-[12px]">
            <CalendarDays size={14} className="text-[var(--kanzler-muted)]" />
            <input type="date" value={selectedDate} onChange={(event) => selectDate(event.target.value)} className="outline-none" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
          {weekDays.map((date) => {
            const routeOfDay = (routesQuery.data ?? []).find((current) => current.data === date);
            const count = routeVisitCount(routeOfDay);
            const active = date === selectedDate;
            return (
              <button
                key={date}
                type="button"
                onClick={() => selectDate(date)}
                onDragOver={(event) => {
                  if (event.dataTransfer.types.includes("application/x-kanzler-contact")) event.preventDefault();
                }}
                onDrop={(event) => {
                  const contactId = event.dataTransfer.getData("application/x-kanzler-contact");
                  if (contactId) {
                    event.preventDefault();
                    void handleAddContact(contactId, date);
                  }
                }}
                className={[
                  "min-w-0 rounded-xl border bg-white px-3 py-2.5 text-left transition",
                  active ? "border-[var(--kanzler-blue)] shadow-[0_0_0_3px_var(--kanzler-blue-soft)]" : "border-[var(--kanzler-line)] hover:border-[#cbd5e1]",
                  date < today ? "opacity-70" : "",
                ].join(" ")}
              >
                <span className="block text-[10px] font-semibold tracking-[0.05em] text-[var(--kanzler-muted)]">{formatWeekdayShort(date)} {date === today && <strong className="ml-1 rounded-full bg-[var(--kanzler-blue)] px-1.5 py-0.5 text-[8px] text-white">HOJE</strong>}</span>
                <span className="kanzler-display block text-[19px] font-bold leading-6">{dayNumber(date)}</span>
                <span className="block truncate text-[10.5px] text-[var(--kanzler-muted)]">{count ? `${count} visita${count > 1 ? "s" : ""}` : "livre"}</span>
              </button>
            );
          })}
        </div>
      </section>

      {feedback && (
        <div className={[
          "agenda-print-hide flex items-center gap-2 rounded-xl border px-4 py-3 text-[12px]",
          feedback.tone === "error" ? "border-[#f2caca] bg-[var(--kanzler-red-soft)] text-[var(--kanzler-red)]" : feedback.tone === "success" ? "border-[#bee6d2] bg-[var(--kanzler-green-soft)] text-[var(--kanzler-green)]" : "border-[#cbd8f7] bg-[var(--kanzler-blue-soft)] text-[var(--kanzler-blue)]",
        ].join(" ")}>
          {feedback.tone === "error" ? <AlertCircle size={16} /> : <RefreshCw size={15} />}
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="ml-auto text-[11px] font-semibold">Fechar</button>
        </div>
      )}

      {pendingPurchase && (
        <div className="agenda-print-hide flex flex-col gap-3 rounded-xl border border-[#bee6d2] bg-[var(--kanzler-green-soft)] px-4 py-3 text-[12px] text-[var(--kanzler-green)] sm:flex-row sm:items-center">
          <span className="flex items-center gap-2"><ShoppingBag size={16} /> A visita foi marcada como compra. O registro financeiro é uma operação separada.</span>
          <button
            type="button"
            onClick={() => setPurchaseModalOpen(true)}
            className="rounded-lg bg-[var(--kanzler-green)] px-3 py-2 font-semibold text-white sm:ml-auto"
          >
            Registrar compra agora
          </button>
        </div>
      )}

      {(routesQuery.isError || citiesQuery.isError) && (
        <div className="agenda-print-hide flex items-center gap-3 rounded-xl border border-[#f2caca] bg-[var(--kanzler-red-soft)] px-4 py-3 text-[12px] text-[var(--kanzler-red)]">
          <AlertCircle size={16} /> Não foi possível carregar toda a agenda.
          <button type="button" onClick={() => void Promise.all([routesQuery.refetch(), citiesQuery.refetch()])} className="ml-auto rounded-lg bg-white px-3 py-1.5 font-semibold">Tentar novamente</button>
        </div>
      )}

      <div className="grid items-start gap-4 2xl:grid-cols-[300px_minmax(0,1fr)_360px]">
        <div className="agenda-print-hide 2xl:block">
          <AgendaInbox
            candidates={candidates}
            summary={scheduleSummaryQuery.data}
            selectedType={candidateType}
            selectedCityId={candidateCityId}
            loading={candidatesQuery.isFetching || scheduleSummaryQuery.isPending}
            busyContactId={busy?.startsWith("add:") ? busy.slice(4) : null}
            onTypeChange={setCandidateType}
            onCityChange={setCandidateCityId}
            onAdd={(candidate: ScheduleCandidate) => void handleAddContact(candidate.id)}
            onOpenContact={(contactId) => navigate(`/contatos?contato=${contactId}`)}
            onRefresh={() => void Promise.all([candidatesQuery.refetch(), scheduleSummaryQuery.refetch()])}
          />
        </div>

        <div className="min-w-0">
          {(routeDetailQuery.isFetching || busy) && (
            <div className="agenda-print-hide mb-2 flex items-center gap-2 text-[10.5px] text-[var(--kanzler-muted)]">
              <LoaderCircle size={12} className="animate-spin" /> Atualizando rota...
            </div>
          )}
          <RouteDayPanel
            route={route}
            busy={Boolean(busy)}
            draggedItemId={draggedItemId}
            onCreateTask={handleCreateTask}
            onComplete={handleComplete}
            onRemove={setRemoveItem}
            onPostpone={(item) => void handlePostpone(item)}
            onMove={handleMove}
            onReorderDrop={handleReorderDrop}
            onDragItemChange={setDraggedItemId}
            onOpenContact={(contactId) => navigate(`/contatos?contato=${contactId}`)}
            onOptimize={() => void handleOptimize()}
            onCalculateTimes={() => void handleCalculateTimes()}
            onOpenGoogleMaps={handleGoogleMaps}
            onExport={() => void handleExport()}
            onPrint={() => window.print()}
            onDropContact={(contactId) => void handleAddContact(contactId)}
          />
        </div>

        <aside className="agenda-print-hide grid gap-4 lg:grid-cols-2 2xl:grid-cols-1">
          <RouteMapCard routeMap={routeMap} loading={routeMapQuery.isFetching} />
          <RouteSettingsCard
            route={route}
            routeMap={routeMap}
            cities={cities}
            selectedDate={selectedDate}
            busy={Boolean(busy)}
            onSave={handleSaveSettings}
          />
        </aside>
      </div>

      <PurchaseFormModal
        open={Boolean(pendingPurchase) && purchaseModalOpen}
        contact={purchaseContactQuery.data ?? null}
        visitId={pendingPurchase?.visitId ?? null}
        defaultDate={selectedDate}
        onClose={() => setPurchaseModalOpen(false)}
        onSuccess={async () => {
          setPurchaseModalOpen(false);
          setPendingPurchase(null);
          setFeedback({ tone: "success", text: "Compra registrada. Status, recompra, painel e relatórios foram atualizados." });
          await refreshSelectedRoute();
        }}
      />

      <VisitResultDialog
        item={visitDialogItem}
        busy={Boolean(busy)}
        onClose={() => setVisitDialogItem(null)}
        onConfirm={(result) => void handleVisitResult(result)}
      />

      <ConfirmDialog
        open={Boolean(removeItem)}
        title="Remover da rota?"
        description={removeItem?.tipo === "visita" ? "A visita será retirada deste dia, mas o contato continuará na base." : "A tarefa será removida deste dia de rota."}
        confirmLabel="Remover"
        destructive
        pending={Boolean(busy?.startsWith("remove:"))}
        onCancel={() => setRemoveItem(null)}
        onConfirm={() => void handleRemoveItem()}
      />

      <div className="agenda-print-only hidden">
        <h1 className="kanzler-display text-2xl font-bold">Rota de {formatBusinessDateLong(selectedDate)}</h1>
        <p className="mt-1 text-sm">Saída: {route?.partidaCidade?.nome ?? routeMap?.partida.nome ?? "-"} · {routeVisitCount(route ?? undefined)} visitas</p>
      </div>
    </div>
  );
}
