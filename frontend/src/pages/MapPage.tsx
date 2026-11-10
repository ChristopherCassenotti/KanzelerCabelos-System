import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  LoaderCircle,
  MapPinned,
  RefreshCw,
  Route,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalMapCanvas, statusColors, statusLabels } from "../components/map/GlobalMapCanvas";
import { MapCitySidebar } from "../components/map/MapCitySidebar";
import { listCities } from "../services/contacts/contacts.service";
import { getGlobalMap } from "../services/map/map.service";
import { addVisit } from "../services/schedule/schedule.service";
import type { MapContact, MapStatus } from "../types/map";
import { getTodayInSaoPauloISO } from "../utils/date";

const statusOptions: Array<{ value: "" | MapStatus; label: string }> = [
  { value: "", label: "Todos os status" },
  { value: "lead", label: "Lead" },
  { value: "avaliacao_agendada", label: "Avaliação agendada" },
  { value: "comprado", label: "Comprado" },
  { value: "recompra", label: "Pronta p/ recompra" },
  { value: "perdido", label: "Perdido" },
];

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível carregar o mapa.";
}

export function MapPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = useMemo(() => getTodayInSaoPauloISO(), []);

  const [status, setStatus] = useState<"" | MapStatus>("");
  const [cityId, setCityId] = useState("");
  const [onlyRepurchase, setOnlyRepurchase] = useState(false);
  const [showRoute, setShowRoute] = useState(true);
  const [routeDate, setRouteDate] = useState(today);
  const [focusCityId, setFocusCityId] = useState<string | null>(null);
  const [busyContactId, setBusyContactId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const filters = useMemo(
    () => ({
      ...(status ? { status } : {}),
      ...(cityId ? { cidadeId: cityId } : {}),
      ...(onlyRepurchase ? { soProntasRecompra: true } : {}),
      ...(showRoute && routeDate ? { dataRota: routeDate } : {}),
    }),
    [status, cityId, onlyRepurchase, showRoute, routeDate],
  );

  const mapQuery = useQuery({
    queryKey: ["map", "global", filters],
    queryFn: () => getGlobalMap(filters),
    staleTime: 15_000,
  });

  const citiesQuery = useQuery({
    queryKey: ["cities"],
    queryFn: listCities,
    staleTime: 5 * 60_000,
  });

  const data = mapQuery.data;
  const contacts = data?.contatos ?? [];
  const citySummaries = data?.cidades ?? [];
  const route = showRoute ? data?.rota ?? null : null;
  const canAddToRoute = Boolean(showRoute && route?.id);

  function handleStatusChange(value: string) {
    const next = value as "" | MapStatus;
    setStatus(next);
    setFocusCityId(null);
    if (next && next !== "recompra") setOnlyRepurchase(false);
  }

  function handleOnlyRepurchase(checked: boolean) {
    setOnlyRepurchase(checked);
    setFocusCityId(null);
    if (checked) setStatus("");
  }

  function handleCityChange(value: string) {
    setCityId(value);
    setFocusCityId(value || null);
  }

  async function handleAddToRoute(contact: MapContact) {
    setFeedback(null);

    if (!canAddToRoute || !route) {
      navigate(`/agenda?data=${routeDate}`);
      return;
    }

    setBusyContactId(contact.id);
    try {
      await addVisit(route.id, { contatoId: contact.id });
      setFeedback({ tone: "success", text: `${contact.nome} foi adicionada/movida para a rota de ${routeDate}.` });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["map"] }),
        queryClient.invalidateQueries({ queryKey: ["routes"] }),
        queryClient.invalidateQueries({ queryKey: ["agenda"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["contacts"] }),
      ]);
    } catch (error) {
      setFeedback({ tone: "error", text: errorMessage(error) });
    } finally {
      setBusyContactId(null);
    }
  }

  const legend = (Object.keys(statusLabels) as MapStatus[]).map((mapStatus) => ({
    status: mapStatus,
    label: statusLabels[mapStatus],
    color: statusColors[mapStatus],
  }));

  return (
    <div className="space-y-4">
      <section className="rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white p-3 shadow-[var(--kanzler-shadow)] sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[180px_190px_auto_auto_170px]">
            <label className="sr-only" htmlFor="map-status">Status</label>
            <select
              id="map-status"
              value={status}
              onChange={(event) => handleStatusChange(event.target.value)}
              className="h-10 rounded-[10px] border border-[var(--kanzler-line)] bg-white px-3 text-[12px] font-medium text-[var(--kanzler-ink)] outline-none transition focus:border-[var(--kanzler-blue)]"
            >
              {statusOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>{option.label}</option>
              ))}
            </select>

            <label className="sr-only" htmlFor="map-city">Cidade</label>
            <select
              id="map-city"
              value={cityId}
              onChange={(event) => handleCityChange(event.target.value)}
              className="h-10 rounded-[10px] border border-[var(--kanzler-line)] bg-white px-3 text-[12px] font-medium text-[var(--kanzler-ink)] outline-none transition focus:border-[var(--kanzler-blue)]"
            >
              <option value="">Todas as cidades</option>
              {(citiesQuery.data ?? []).map((city) => (
                <option key={city.id} value={city.id}>{city.nome} - {city.uf}</option>
              ))}
            </select>

            <label className="flex h-10 items-center gap-2 rounded-[10px] border border-[var(--kanzler-line)] bg-white px-3 text-[11.5px] font-medium text-[var(--kanzler-ink)]">
              <input
                type="checkbox"
                checked={onlyRepurchase}
                onChange={(event) => handleOnlyRepurchase(event.target.checked)}
                className="h-4 w-4 accent-[var(--kanzler-blue)]"
              />
              Só prontas p/ recompra
            </label>

            <label className="flex h-10 items-center gap-2 rounded-[10px] border border-[var(--kanzler-line)] bg-white px-3 text-[11.5px] font-medium text-[var(--kanzler-ink)]">
              <input
                type="checkbox"
                checked={showRoute}
                onChange={(event) => setShowRoute(event.target.checked)}
                className="h-4 w-4 accent-[var(--kanzler-blue)]"
              />
              Mostrar rota de
            </label>

            <label className="relative">
              <span className="sr-only">Data da rota</span>
              <CalendarDays size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--kanzler-muted)]" />
              <input
                type="date"
                value={routeDate}
                onChange={(event) => {
                  setRouteDate(event.target.value);
                  setFocusCityId(null);
                }}
                className="h-10 w-full rounded-[10px] border border-[var(--kanzler-line)] bg-white pl-9 pr-3 text-[12px] font-medium text-[var(--kanzler-ink)] outline-none transition focus:border-[var(--kanzler-blue)]"
              />
            </label>
          </div>

          <div className="flex items-center justify-between gap-3 xl:justify-end">
            <span className="text-[11px] font-medium text-[var(--kanzler-muted)]">
              {mapQuery.isPending ? "Carregando..." : `${data?.total ?? 0} no mapa`}
            </span>
            <button
              type="button"
              onClick={() => mapQuery.refetch()}
              disabled={mapQuery.isFetching}
              className="grid h-9 w-9 place-items-center rounded-[10px] border border-[var(--kanzler-line)] bg-white text-[var(--kanzler-muted)] transition hover:bg-[var(--kanzler-canvas)] disabled:opacity-50"
              aria-label="Atualizar mapa"
            >
              <RefreshCw size={15} className={mapQuery.isFetching ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </section>

      {feedback ? (
        <div className={[
          "flex items-center gap-2 rounded-[12px] border px-4 py-3 text-[12px]",
          feedback.tone === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-red-200 bg-red-50 text-red-800",
        ].join(" ")}>
          {feedback.tone === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.text}</span>
          {busyContactId ? <LoaderCircle size={14} className="ml-auto animate-spin" /> : null}
        </div>
      ) : null}

      {mapQuery.isError ? (
        <section className="rounded-[var(--kanzler-radius)] border border-red-200 bg-red-50 p-5 text-red-800 shadow-[var(--kanzler-shadow)]">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <h2 className="kanzler-display font-semibold">Não foi possível carregar o mapa</h2>
              <p className="mt-1 text-[12px]">{errorMessage(mapQuery.error)}</p>
            </div>
            <button
              type="button"
              onClick={() => mapQuery.refetch()}
              className="rounded-lg border border-red-200 bg-white px-3 py-2 text-[11px] font-semibold"
            >
              Tentar novamente
            </button>
          </div>
        </section>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <section className="overflow-hidden rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white shadow-[var(--kanzler-shadow)]">
            <div className="relative h-[520px] bg-[#eef2f5] sm:h-[620px] xl:h-[680px]">
              <GlobalMapCanvas
                contacts={contacts}
                route={route}
                focusCityId={focusCityId}
                onOpenContact={(contactId) => navigate(`/contatos?contato=${contactId}`)}
                onAddToRoute={handleAddToRoute}
                canAddToRoute={canAddToRoute}
                busyContactId={busyContactId}
                loading={mapQuery.isPending}
              />

              {!mapQuery.isPending && contacts.length === 0 && !route ? (
                <div className="pointer-events-none absolute inset-0 z-[500] grid place-items-center bg-white/70 p-6 backdrop-blur-[1px]">
                  <div className="max-w-sm rounded-2xl border border-[var(--kanzler-line)] bg-white p-5 text-center shadow-lg">
                    <MapPinned size={28} className="mx-auto text-[var(--kanzler-muted-2)]" />
                    <h3 className="kanzler-display mt-3 font-semibold">Nenhum contato neste filtro</h3>
                    <p className="mt-1 text-[11.5px] text-[var(--kanzler-muted)]">
                      Altere status, cidade ou recompra para voltar a visualizar clientes no mapa.
                    </p>
                  </div>
                </div>
              ) : null}

              {showRoute && !mapQuery.isPending ? (
                <div className="pointer-events-none absolute right-3 top-3 z-[500] rounded-[10px] border border-white/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-2 text-[10.5px] font-semibold text-[var(--kanzler-ink)]">
                    <Route size={14} className="text-[var(--kanzler-blue)]" />
                    {route ? `Rota ${routeDate}` : `Sem rota em ${routeDate}`}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--kanzler-line)] px-4 py-3">
              {legend.map((item) => (
                <span key={item.status} className="inline-flex items-center gap-1.5 text-[10.5px] text-[var(--kanzler-muted)]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.label}
                </span>
              ))}
            </div>
          </section>

          <div className="space-y-4">
            <MapCitySidebar
              cities={citySummaries}
              activeCityId={focusCityId}
              onFocus={(nextCityId) => setFocusCityId((current) => current === nextCityId ? null : nextCityId)}
            />

            <section className="rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white p-4 shadow-[var(--kanzler-shadow)]">
              <div className="flex items-center gap-2">
                <Route size={16} className="text-[var(--kanzler-blue)]" />
                <h2 className="kanzler-display text-[13.5px] font-semibold">Rota selecionada</h2>
              </div>

              {!showRoute ? (
                <p className="mt-3 text-[11.5px] leading-5 text-[var(--kanzler-muted)]">
                  Ative “Mostrar rota de” para sobrepor o trajeto e habilitar adição direta de clientes.
                </p>
              ) : !route ? (
                <div className="mt-3 rounded-[10px] bg-[var(--kanzler-canvas)] p-3">
                  <p className="text-[11.5px] text-[var(--kanzler-muted)]">Nenhuma rota criada em {routeDate}.</p>
                  <button
                    type="button"
                    onClick={() => navigate(`/agenda?data=${routeDate}`)}
                    className="mt-2 text-[11px] font-semibold text-[var(--kanzler-blue)]"
                  >
                    Abrir agenda para criar →
                  </button>
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-[10px] bg-[var(--kanzler-canvas)] p-3">
                    <span className="block text-[9.5px] text-[var(--kanzler-muted-2)]">Saída</span>
                    <strong className="mt-1 block truncate">{route.partida.nome}</strong>
                  </div>
                  <div className="rounded-[10px] bg-[var(--kanzler-canvas)] p-3">
                    <span className="block text-[9.5px] text-[var(--kanzler-muted-2)]">Paradas</span>
                    <strong className="mt-1 block">{route.paradas.length}</strong>
                  </div>
                  <div className="rounded-[10px] bg-[var(--kanzler-canvas)] p-3">
                    <span className="block text-[9.5px] text-[var(--kanzler-muted-2)]">Distância</span>
                    <strong className="mt-1 block">{route.distanciaKm ? `${Number(route.distanciaKm).toFixed(1)} km` : "-"}</strong>
                  </div>
                  <div className="rounded-[10px] bg-[var(--kanzler-canvas)] p-3">
                    <span className="block text-[9.5px] text-[var(--kanzler-muted-2)]">Duração</span>
                    <strong className="mt-1 block">{route.duracaoMin ? `${route.duracaoMin} min` : "-"}</strong>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
