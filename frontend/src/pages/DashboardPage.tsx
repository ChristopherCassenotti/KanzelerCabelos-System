import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Bell,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  RefreshCw,
  Scissors,
  UsersRound,
} from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardCard } from "../components/dashboard/DashboardCard";
import {
  getCurrentMonthIndicators,
  getCurrentMonthPurchasesReport,
  getDashboardSummary,
  getReadyRepurchases,
  getRoutesBetween,
} from "../services/dashboard/dashboard.service";
import type { DashboardRoute, DashboardRouteItem, NumericLike } from "../types/dashboard";

const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";

function toNumber(value: NumericLike) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function formatCurrency(value: NumericLike) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function formatWeight(value: NumericLike) {
  const grams = toNumber(value);
  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
  }).format(grams / 1000)} kg`;
}

function parseBusinessDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(parseBusinessDate(iso));
}

function formatWeekday(iso: string) {
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(parseBusinessDate(iso));

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function getSaoPauloDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SAO_PAULO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function businessDateISO(offsetDays = 0) {
  const { year, month, day } = getSaoPauloDateParts();
  const date = new Date(Date.UTC(year, month - 1, day + offsetDays, 12));

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function currentMonthLabel() {
  const { year, month } = getSaoPauloDateParts();
  const date = new Date(Date.UTC(year, month - 1, 1, 12));

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    timeZone: "UTC",
  }).format(date);
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function repurchaseLabel(days: number) {
  if (days < 0) return `venceu há ${Math.abs(days)}d`;
  if (days === 0) return "vence hoje";
  return `vence em ${days}d`;
}

interface UpcomingVisit {
  routeId: string;
  date: string;
  item: DashboardRouteItem;
}

function extractUpcomingVisits(routes: DashboardRoute[]) {
  const visits: UpcomingVisit[] = [];

  for (const route of routes) {
    for (const item of route.itens ?? []) {
      if (item.tipo !== "visita" || item.concluido || !item.contato) continue;

      visits.push({
        routeId: route.id,
        date: route.data,
        item,
      });
    }
  }

  return visits.sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) return byDate;
    return (a.item.hora ?? "99:99").localeCompare(b.item.hora ?? "99:99");
  });
}

function PanelSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-label="Carregando painel">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-[142px] rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <div className="h-[270px] rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white" />
        <div className="h-[270px] rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white" />
      </div>
      <div className="h-[280px] rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white" />
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const today = useMemo(() => businessDateISO(0), []);
  const inSevenDays = useMemo(() => businessDateISO(7), []);

  const summaryQuery = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: getDashboardSummary,
  });

  const repurchasesQuery = useQuery({
    queryKey: ["repurchases", "ready"],
    queryFn: getReadyRepurchases,
  });

  const indicatorsQuery = useQuery({
    queryKey: ["reports", "indicators", "mes_atual"],
    queryFn: getCurrentMonthIndicators,
  });

  const purchasesQuery = useQuery({
    queryKey: ["reports", "purchases", "mes_atual"],
    queryFn: getCurrentMonthPurchasesReport,
  });

  const routesQuery = useQuery({
    queryKey: ["routes", today, inSevenDays],
    queryFn: () => getRoutesBetween(today, inSevenDays),
  });

  const queries = [summaryQuery, repurchasesQuery, indicatorsQuery, purchasesQuery, routesQuery];
  const isInitialLoading = queries.some((query) => query.isPending);
  const hasError = queries.some((query) => query.isError);
  const isRefreshing = queries.some((query) => query.isFetching);

  const summary = summaryQuery.data;
  const repurchases = repurchasesQuery.data ?? [];
  const indicators = indicatorsQuery.data;
  const purchases = purchasesQuery.data;
  const upcomingVisits = useMemo(() => extractUpcomingVisits(routesQuery.data ?? []), [routesQuery.data]);
  const topRepurchases = repurchases.slice(0, 5);
  const topVisits = upcomingVisits.slice(0, 6);
  const purchasesByCity = purchases?.porCidade ?? [];
  const maxCityValue = Math.max(0, ...purchasesByCity.map((item) => toNumber(item.valor)));
  const monthLabel = currentMonthLabel();

  async function refreshAll() {
    await Promise.all(queries.map((query) => query.refetch()));
  }

  if (isInitialLoading) {
    return <PanelSkeleton />;
  }

  return (
    <div className="space-y-4">
      {hasError && (
        <div className="flex flex-col gap-3 rounded-[12px] border border-[#f2caca] bg-[var(--kanzler-red-soft)] px-4 py-3 text-sm text-[var(--kanzler-red)] sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-2.5">
            <AlertCircle size={18} className="shrink-0" />
            <span>Parte dos dados do painel não pôde ser carregada. Os blocos disponíveis continuam visíveis.</span>
          </div>
          <button
            type="button"
            onClick={refreshAll}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e5adad] bg-white px-3 py-2 font-semibold text-[var(--kanzler-red)] sm:ml-auto"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            Tentar novamente
          </button>
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <DashboardCard
          icon={UsersRound}
          label="Contatos na base"
          value={String(summary?.contatos.total ?? 0)}
          footnote={`${summary?.contatos.lead ?? 0} leads · ${summary?.aAgendar.total ?? 0} a agendar`}
          tone="navy"
        />
        <DashboardCard
          icon={CalendarDays}
          label="Visitas nos próximos 7 dias"
          value={String(upcomingVisits.length)}
          footnote={`${routesQuery.data?.length ?? 0} dias de rota no período`}
          tone="blue"
        />
        <DashboardCard
          icon={Scissors}
          label={`Cortes em ${monthLabel}`}
          value={String(indicators?.quantidadeCompras ?? 0)}
          footnote={`${summary?.contatos.comprado ?? 0} contatos comprados no total`}
          tone="green"
        />
        <DashboardCard
          icon={CircleDollarSign}
          label={`Pago em ${monthLabel}`}
          value={formatCurrency(indicators?.totalComprado)}
          footnote={`${formatWeight(indicators?.pesoCompradoG)} de cabelo`}
          tone="green"
        />
        <DashboardCard
          icon={Bell}
          label="Para recompra"
          value={String(repurchases.length)}
          footnote="vencidas ou vencendo em até 30 dias"
          tone="amber"
        />
      </section>

      <section className="overflow-hidden rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white shadow-[var(--kanzler-shadow)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--kanzler-line)] px-4 py-3.5 sm:px-[18px]">
          <div>
            <h2 className="kanzler-display text-[14.5px] font-semibold text-[var(--kanzler-ink)]">Funil atual</h2>
            <p className="mt-0.5 text-[11.5px] text-[var(--kanzler-muted-2)]">resumo da base e fila operacional</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/contatos")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--kanzler-line)] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--kanzler-ink)] transition hover:bg-[var(--kanzler-canvas)]"
          >
            Ver contatos
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-px bg-[var(--kanzler-line)] sm:grid-cols-3 xl:grid-cols-5">
          {[
            ["Leads", summary?.contatos.lead ?? 0, "text-[#5a6675]", "bg-[#eef1f5]"],
            ["Avaliações", summary?.contatos.avaliacaoAgendada ?? 0, "text-[var(--kanzler-blue)]", "bg-[var(--kanzler-blue-soft)]"],
            ["Comprados", summary?.contatos.comprado ?? 0, "text-[var(--kanzler-green)]", "bg-[var(--kanzler-green-soft)]"],
            ["Perdidos", summary?.contatos.perdido ?? 0, "text-[var(--kanzler-red)]", "bg-[var(--kanzler-red-soft)]"],
            ["A agendar", summary?.aAgendar.total ?? 0, "text-[var(--kanzler-amber)]", "bg-[var(--kanzler-amber-soft)]"],
          ].map(([label, value, textClass, bgClass]) => (
            <div key={String(label)} className="bg-white px-4 py-4 sm:px-5">
              <div className={`inline-flex rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${String(textClass)} ${String(bgClass)}`}>
                {String(label)}
              </div>
              <p className="kanzler-display mt-2 text-2xl font-bold tracking-[-0.035em] text-[var(--kanzler-ink)]">{String(value)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.08fr_.92fr]">
        <article className="overflow-hidden rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white shadow-[var(--kanzler-shadow)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--kanzler-line)] px-4 py-3.5 sm:px-[18px]">
            <h2 className="kanzler-display text-[14.5px] font-semibold text-[var(--kanzler-ink)]">Prontos para recompra</h2>
            <span className="text-[11.5px] text-[var(--kanzler-muted-2)]">o cabelo cresce, a cliente volta a vender</span>
          </div>

          {topRepurchases.length === 0 ? (
            <div className="px-5 py-14 text-center text-sm text-[var(--kanzler-muted)]">Nenhuma cliente pronta para recompra.</div>
          ) : (
            <div className="divide-y divide-[var(--kanzler-line)] px-2 py-1 sm:px-3">
              {topRepurchases.map((item) => {
                const late = item.diasAte <= 0;

                return (
                  <button
                    key={item.contatoId}
                    type="button"
                    onClick={() => navigate(`/contatos?contato=${item.contatoId}`)}
                    className="flex w-full items-center gap-3 rounded-[10px] px-2 py-3 text-left transition hover:bg-[var(--kanzler-canvas)]"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--kanzler-blue-soft)] text-[11px] font-bold text-[var(--kanzler-blue)]">
                      {initials(item.nome)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold text-[var(--kanzler-ink)]">{item.nome}</span>
                      <span className="block truncate text-[12px] text-[var(--kanzler-muted)]">
                        {item.cidade.nome} · último corte {formatShortDate(item.ultimoCorte)}
                      </span>
                    </span>
                    <span
                      className={[
                        "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        late
                          ? "bg-[var(--kanzler-red-soft)] text-[var(--kanzler-red)]"
                          : "bg-[var(--kanzler-amber-soft)] text-[var(--kanzler-amber)]",
                      ].join(" ")}
                    >
                      {repurchaseLabel(item.diasAte)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </article>

        <article className="overflow-hidden rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white shadow-[var(--kanzler-shadow)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--kanzler-line)] px-4 py-3.5 sm:px-[18px]">
            <h2 className="kanzler-display text-[14.5px] font-semibold text-[var(--kanzler-ink)]">Próximas visitas</h2>
            <button
              type="button"
              onClick={() => navigate("/agenda")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--kanzler-line)] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--kanzler-ink)] transition hover:bg-[var(--kanzler-canvas)]"
            >
              Abrir agenda
              <ChevronRight size={14} />
            </button>
          </div>

          {topVisits.length === 0 ? (
            <div className="grid min-h-[230px] place-items-center px-5 py-12 text-center text-sm text-[var(--kanzler-muted)]">
              Nenhuma visita nos próximos 7 dias.
            </div>
          ) : (
            <div className="divide-y divide-[var(--kanzler-line)] px-2 py-1 sm:px-3">
              {topVisits.map(({ routeId, date, item }) => (
                <button
                  key={`${routeId}-${item.id}`}
                  type="button"
                  onClick={() => navigate(`/agenda?data=${date}`)}
                  className="flex w-full items-center gap-3 rounded-[10px] px-2 py-3 text-left transition hover:bg-[var(--kanzler-canvas)]"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] bg-[var(--kanzler-blue-soft)] text-[var(--kanzler-blue)]">
                    <CalendarDays size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-[var(--kanzler-ink)]">{item.contato?.nome}</span>
                    <span className="block truncate text-[12px] text-[var(--kanzler-muted)]">
                      {item.contato?.cidade?.nome ?? "Cidade não informada"} · {formatWeekday(date)}
                    </span>
                  </span>
                  <span className="shrink-0 text-[12px] font-semibold text-[var(--kanzler-muted)]">
                    {item.hora ? item.hora.slice(0, 5) : "a definir"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="overflow-hidden rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white shadow-[var(--kanzler-shadow)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--kanzler-line)] px-4 py-3.5 sm:px-[18px]">
          <h2 className="kanzler-display text-[14.5px] font-semibold text-[var(--kanzler-ink)]">Valor comprado por cidade</h2>
          <span className="text-[11.5px] text-[var(--kanzler-muted-2)]">mês atual · valor pago em cabelo</span>
        </div>

        {purchasesByCity.length === 0 ? (
          <div className="px-5 py-14 text-center text-sm text-[var(--kanzler-muted)]">Sem compras registradas no mês atual.</div>
        ) : (
          <div className="space-y-3 px-4 py-4 sm:px-[18px]">
            {purchasesByCity.slice(0, 10).map((item) => {
              const value = toNumber(item.valor);
              const width = maxCityValue > 0 ? Math.max(2, (value / maxCityValue) * 100) : 0;

              return (
                <div key={item.cidade} className="grid grid-cols-[minmax(90px,135px)_1fr_auto] items-center gap-3">
                  <span className="truncate text-[12.5px] text-[var(--kanzler-muted)]">{item.cidade}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-[var(--kanzler-canvas)]">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-[var(--kanzler-blue)] to-[#5b8cff]"
                      style={{ width: `${width}%` }}
                    />
                  </span>
                  <span className="kanzler-display whitespace-nowrap text-[12.5px] font-semibold text-[var(--kanzler-ink)]">
                    {formatCurrency(value)} · {item.quantidade}x
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
