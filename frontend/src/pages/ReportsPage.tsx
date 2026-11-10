import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Download,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HorizontalBarList } from "../components/reports/HorizontalBarList";
import { ReportMetricCard } from "../components/reports/ReportMetricCard";
import { ReportPanel } from "../components/reports/ReportPanel";
import {
  exportReports,
  getAveragePriceReport,
  getConversionCityReport,
  getOriginsLossesReport,
  getPurchaseDetailsReport,
  getPurchasesReport,
  getReportIndicators,
  getRepurchaseForecastReport,
  getTripsReport,
} from "../services/reports/reports.service";
import type { ReportPeriod } from "../types/report";
import {
  downloadReportBlob,
  normalizeRepurchaseForecast,
  reportCurrency,
  reportDate,
  reportDecimal,
  reportMonth,
  reportNumber,
  reportPercent,
  reportWeight,
} from "../utils/report";

const periodOptions: Array<{ value: ReportPeriod; label: string }> = [
  { value: "todo", label: "Todo o período" },
  { value: "mes_atual", label: "Este mês" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "365", label: "Últimos 12 meses" },
];

const validPeriods = new Set<ReportPeriod>(periodOptions.map((option) => option.value));

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível carregar este relatório";
}

function ReportsSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-label="Carregando relatórios">
      <div className="h-11 rounded-xl border border-[var(--kanzler-line)] bg-white" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-[118px] rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-[270px] rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white" />
        ))}
      </div>
      <div className="h-[320px] rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white" />
    </div>
  );
}

function TableEmpty({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-9 text-center text-[11.5px] text-[var(--kanzler-muted)]">
        {text}
      </td>
    </tr>
  );
}

function TableShell({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function ReportsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawPeriod = searchParams.get("periodo") as ReportPeriod | null;
  const periodo: ReportPeriod = rawPeriod && validPeriods.has(rawPeriod) ? rawPeriod : "todo";
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const indicatorsQuery = useQuery({
    queryKey: ["reports", "indicators", periodo],
    queryFn: () => getReportIndicators(periodo),
  });
  const purchasesQuery = useQuery({
    queryKey: ["reports", "purchases", periodo],
    queryFn: () => getPurchasesReport(periodo),
  });
  const averagePriceQuery = useQuery({
    queryKey: ["reports", "average-price", periodo],
    queryFn: () => getAveragePriceReport(periodo),
  });
  const originLossQuery = useQuery({
    queryKey: ["reports", "origins-losses", periodo],
    queryFn: () => getOriginsLossesReport(periodo),
  });
  const conversionQuery = useQuery({
    queryKey: ["reports", "conversion-city", periodo],
    queryFn: () => getConversionCityReport(periodo),
  });
  const tripsQuery = useQuery({
    queryKey: ["reports", "trips", periodo],
    queryFn: () => getTripsReport(periodo),
  });
  const forecastQuery = useQuery({
    queryKey: ["reports", "repurchase-forecast"],
    queryFn: getRepurchaseForecastReport,
    staleTime: 30_000,
  });
  const detailsQuery = useQuery({
    queryKey: ["reports", "purchase-details", periodo],
    queryFn: () => getPurchaseDetailsReport(periodo),
  });

  const queries = [
    indicatorsQuery,
    purchasesQuery,
    averagePriceQuery,
    originLossQuery,
    conversionQuery,
    tripsQuery,
    forecastQuery,
    detailsQuery,
  ];

  const initialLoading = queries.every((query) => query.isPending);
  const hasError = queries.some((query) => query.isError);
  const isRefreshing = queries.some((query) => query.isFetching);

  const indicators = indicatorsQuery.data;
  const purchases = purchasesQuery.data;
  const averagePrice = averagePriceQuery.data;
  const originLoss = originLossQuery.data;
  const conversion = conversionQuery.data ?? [];
  const trips = tripsQuery.data?.viagens ?? [];
  const details = detailsQuery.data ?? [];
  const forecast = useMemo(
    () => normalizeRepurchaseForecast(forecastQuery.data),
    [forecastQuery.data],
  );

  const conversionTotals = useMemo(
    () => conversion.reduce(
      (acc, item) => ({
        contatos: acc.contatos + reportNumber(item.contatos),
        avaliacoes: acc.avaliacoes + reportNumber(item.avaliacoes),
        compras: acc.compras + reportNumber(item.compras),
      }),
      { contatos: 0, avaliacoes: 0, compras: 0 },
    ),
    [conversion],
  );

  const tripTotals = useMemo(
    () => trips.reduce(
      (acc, trip) => ({
        pago: acc.pago + reportNumber(trip.totalPago),
        custos: acc.custos + reportNumber(trip.custos),
        revenda: acc.revenda + reportNumber(trip.totalRevenda),
        resultado: acc.resultado + reportNumber(trip.resultado),
      }),
      { pago: 0, custos: 0, revenda: 0, resultado: 0 },
    ),
    [trips],
  );

  const purchasesByCity = [...(purchases?.porCidade ?? [])].sort((a, b) => reportNumber(b.valor) - reportNumber(a.valor));
  const purchasesByMonth = [...(purchases?.porMes ?? [])].sort((a, b) => a.mes.localeCompare(b.mes));
  const byColor = [...(averagePrice?.porCor ?? [])].sort((a, b) => reportNumber(b.precoMedioPorGrama) - reportNumber(a.precoMedioPorGrama));
  const byTexture = [...(averagePrice?.porTextura ?? [])].sort((a, b) => reportNumber(b.precoMedioPorGrama) - reportNumber(a.precoMedioPorGrama));
  const losses = [...(originLoss?.perdas ?? [])].sort((a, b) => b.quantidade - a.quantidade);
  const purchaseDetails = [...details].sort((a, b) => b.dataCorte.localeCompare(a.dataCorte));

  function changePeriod(value: ReportPeriod) {
    const next = new URLSearchParams(searchParams);
    if (value === "todo") next.delete("periodo");
    else next.set("periodo", value);
    setSearchParams(next, { replace: true });
  }

  async function refreshAll() {
    await Promise.all(queries.map((query) => query.refetch()));
  }

  async function handleExport() {
    setExportError(null);
    setExporting(true);
    try {
      const blob = await exportReports(periodo);
      downloadReportBlob(blob, "relatorios-kanzler.xlsx");
    } catch (error) {
      setExportError(errorMessage(error));
    } finally {
      setExporting(false);
    }
  }

  if (initialLoading) return <ReportsSkeleton />;

  return (
    <div className="space-y-4">
      <section className="rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white p-3 shadow-[var(--kanzler-shadow)] sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={periodo}
            onChange={(event) => changePeriod(event.target.value as ReportPeriod)}
            className="h-10 min-w-[180px] rounded-[10px] border border-[var(--kanzler-line)] bg-white px-3 text-[12px] font-medium text-[var(--kanzler-ink)] outline-none transition focus:border-[var(--kanzler-blue)]"
            aria-label="Período dos relatórios"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[var(--kanzler-line)] bg-white px-4 text-[11.5px] font-semibold text-[var(--kanzler-ink)] transition hover:bg-[var(--kanzler-canvas)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {exporting ? <LoaderCircle size={15} className="animate-spin" /> : <Download size={15} />}
            {exporting ? "Exportando..." : "Exportar relatórios (Excel)"}
          </button>

          <div className="flex items-center gap-3 sm:ml-auto">
            <span className="text-[10.5px] text-[var(--kanzler-muted)]">
              {indicators ? `${indicators.quantidadeCompras} compras` : "- compras"}
              {conversionTotals.contatos ? ` · ${conversionTotals.contatos} contatos no período` : ""}
            </span>
            <button
              type="button"
              onClick={refreshAll}
              disabled={isRefreshing}
              className="grid h-9 w-9 place-items-center rounded-[10px] border border-[var(--kanzler-line)] bg-white text-[var(--kanzler-muted)] transition hover:bg-[var(--kanzler-canvas)] disabled:opacity-50"
              aria-label="Atualizar relatórios"
            >
              <RefreshCw size={15} className={isRefreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </section>

      {hasError ? (
        <div className="flex flex-col gap-3 rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-[11.5px] text-amber-900 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-2.5">
            <AlertCircle size={17} className="shrink-0" />
            <span>Alguns relatórios não puderam ser carregados. Os dados disponíveis continuam visíveis.</span>
          </div>
          <button type="button" onClick={refreshAll} className="font-semibold underline underline-offset-2 sm:ml-auto">Tentar novamente</button>
        </div>
      ) : null}

      {exportError ? (
        <div className="flex items-center gap-2 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[11.5px] text-red-800">
          <AlertCircle size={16} />
          <span>{exportError}</span>
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <ReportMetricCard
          label="Total comprado"
          value={indicators ? reportCurrency(indicators.totalComprado) : "-"}
          foot={`${indicators?.quantidadeCompras ?? 0} cortes`}
        />
        <ReportMetricCard
          label="Ticket médio"
          value={indicators ? reportCurrency(indicators.ticketMedio) : "-"}
          foot="por cabelo"
        />
        <ReportMetricCard
          label="Peso comprado"
          value={indicators ? reportWeight(indicators.pesoCompradoG) : "-"}
          foot={indicators ? `${reportDecimal(indicators.pesoCompradoG, 0)} gramas` : "-"}
        />
        <ReportMetricCard
          label="Preço médio por grama"
          value={indicators ? `${reportCurrency(indicators.precoMedioPorGrama, 2)}/g` : "-"}
          foot="valor pago ÷ peso"
        />
        <ReportMetricCard
          label="Lucro na revenda"
          value={indicators ? reportCurrency(indicators.lucroRevenda) : "-"}
          foot="revenda − valor pago"
        />
        <ReportMetricCard
          label="Conversão geral"
          value={indicators ? reportPercent(indicators.conversao) : "-"}
          foot={`${conversionTotals.compras || indicators?.quantidadeCompras || 0} compras de ${conversionTotals.contatos || "-"} contatos`}
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <ReportPanel title="Compras por cidade" hint="valor e quantidade">
          <HorizontalBarList
            items={purchasesByCity.map((item) => ({
              key: item.cidade,
              label: item.cidade,
              value: reportNumber(item.valor),
              detail: `${reportCurrency(item.valor)} · ${item.quantidade}x`,
            }))}
            emptyText="Sem compras no período."
          />
        </ReportPanel>

        <ReportPanel title="Compras por mês" hint="evolução no tempo">
          <HorizontalBarList
            items={purchasesByMonth.map((item) => ({
              key: item.mes,
              label: reportMonth(item.mes),
              value: reportNumber(item.valor),
              detail: `${reportCurrency(item.valor)} · ${item.quantidade}x`,
            }))}
            emptyText="Sem compras no período."
          />
        </ReportPanel>

        <ReportPanel title="Preço médio por grama, por cor" hint="média ponderada">
          <HorizontalBarList
            tone="amber"
            items={byColor.map((item) => ({
              key: item.categoria,
              label: item.categoria,
              value: reportNumber(item.precoMedioPorGrama),
              detail: `${reportCurrency(item.precoMedioPorGrama, 2)}/g · ${item.quantidade}x`,
            }))}
            emptyText="Cadastre peso e valor para visualizar preço por grama."
          />
        </ReportPanel>

        <ReportPanel title="Preço médio por grama, por textura" hint="média ponderada">
          <HorizontalBarList
            tone="amber"
            items={byTexture.map((item) => ({
              key: item.categoria,
              label: item.categoria,
              value: reportNumber(item.precoMedioPorGrama),
              detail: `${reportCurrency(item.precoMedioPorGrama, 2)}/g · ${item.quantidade}x`,
            }))}
            emptyText="Sem dados de textura no período."
          />
        </ReportPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <ReportPanel title="Conversão por cidade" hint="contato até compra">
          <TableShell>
            <table className="w-full min-w-[610px] border-collapse text-[11px]">
              <thead className="bg-[#fafbfd] text-[10px] uppercase tracking-[0.045em] text-[var(--kanzler-muted)]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Cidade</th>
                  <th className="px-3 py-3 text-right font-semibold">Contatos</th>
                  <th className="px-3 py-3 text-right font-semibold">Avaliações</th>
                  <th className="px-3 py-3 text-right font-semibold">Compras</th>
                  <th className="px-4 py-3 text-right font-semibold">Conversão</th>
                </tr>
              </thead>
              <tbody>
                {conversion.length ? conversion.map(
                  (item, index) => (
                  <tr key={`${item.cidade}-${index}`} className="border-t border-[var(--kanzler-line)]">
                    <td className="px-4 py-3 font-medium text-[var(--kanzler-ink)]">{item.cidade}</td>
                    <td className="px-3 py-3 text-right text-[var(--kanzler-muted)]">{item.contatos}</td>
                    <td className="px-3 py-3 text-right text-[var(--kanzler-muted)]">{item.avaliacoes}</td>
                    <td className="px-3 py-3 text-right text-[var(--kanzler-muted)]">{item.compras}</td>
                    <td className="px-4 py-3 text-right font-semibold">{reportPercent(item.conversao)}</td>
                  </tr>
                )) : <TableEmpty colSpan={5} text="Sem dados de conversão no período." />}
              </tbody>
              {conversion.length ? (
                <tfoot className="border-t border-[var(--kanzler-line)] bg-[#fafbfd] font-semibold">
                  <tr>
                    <td className="px-4 py-3">Total</td>
                    <td className="px-3 py-3 text-right">{conversionTotals.contatos}</td>
                    <td className="px-3 py-3 text-right">{conversionTotals.avaliacoes}</td>
                    <td className="px-3 py-3 text-right">{conversionTotals.compras}</td>
                    <td className="px-4 py-3 text-right">
                      {conversionTotals.contatos ? reportPercent((conversionTotals.compras / conversionTotals.contatos) * 100) : "0%"}
                    </td>
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </TableShell>
        </ReportPanel>

        <div className="space-y-4">
          <ReportPanel title="De onde vêm os contatos" hint="origem e resultado">
            <TableShell>
              <table className="w-full min-w-[520px] border-collapse text-[10.5px]">
                <thead className="bg-[#fafbfd] text-[9.5px] uppercase tracking-[0.04em] text-[var(--kanzler-muted)]">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Origem</th>
                    <th className="px-2 py-3 text-right font-semibold">Contatos</th>
                    <th className="px-2 py-3 text-right font-semibold">Compras</th>
                    <th className="px-2 py-3 text-right font-semibold">Conversão</th>
                    <th className="px-4 py-3 text-right font-semibold">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {(originLoss?.origens ?? []).length ? originLoss!.origens.map((item) => (
                    <tr key={item.origem} className="border-t border-[var(--kanzler-line)]">
                      <td className="px-4 py-3 font-medium">{item.origem}</td>
                      <td className="px-2 py-3 text-right text-[var(--kanzler-muted)]">{item.contatos}</td>
                      <td className="px-2 py-3 text-right text-[var(--kanzler-muted)]">{item.compras}</td>
                      <td className="px-2 py-3 text-right">{reportPercent(item.conversao)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{reportCurrency(item.valor)}</td>
                    </tr>
                  )) : <TableEmpty colSpan={5} text="Sem dados de origem." />}
                </tbody>
              </table>
            </TableShell>
          </ReportPanel>

          <ReportPanel title="Motivos de perda" hint="por que não fechou">
            <HorizontalBarList
              tone="red"
              items={losses.map((item) => ({
                key: item.motivo,
                label: item.motivo,
                value: item.quantidade,
                detail: `${item.quantidade}x`,
              }))}
              emptyText="Nenhuma perda no período."
            />
          </ReportPanel>
        </div>
      </div>

      <ReportPanel title="Resultado por viagem" hint="compras do dia, custos da agenda e revenda">
        <TableShell>
          <table className="w-full min-w-[980px] border-collapse text-[10.5px]">
            <thead className="bg-[#fafbfd] text-[9.5px] uppercase tracking-[0.04em] text-[var(--kanzler-muted)]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Data</th>
                <th className="px-3 py-3 text-left font-semibold">Cidades</th>
                <th className="px-3 py-3 text-right font-semibold">Visitas</th>
                <th className="px-3 py-3 text-right font-semibold">Compras</th>
                <th className="px-3 py-3 text-right font-semibold">Pago em cabelo</th>
                <th className="px-3 py-3 text-right font-semibold">Custos</th>
                <th className="px-3 py-3 text-right font-semibold">Custo/g</th>
                <th className="px-3 py-3 text-right font-semibold">Revenda</th>
                <th className="px-4 py-3 text-right font-semibold">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {trips.length ? trips.map((trip) => (
                <tr
                  key={trip.diaRotaId}
                  onClick={() => navigate(`/agenda?data=${trip.data}`)}
                  className="cursor-pointer border-t border-[var(--kanzler-line)] transition hover:bg-[var(--kanzler-blue-soft)]/45"
                  title="Abrir este dia na agenda"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-semibold">{reportDate(trip.data)}</td>
                  <td className="px-3 py-3 text-[var(--kanzler-muted)]">{trip.cidades.join(", ") || "-"}</td>
                  <td className="px-3 py-3 text-right">{trip.visitas}</td>
                  <td className="px-3 py-3 text-right">{trip.compras}</td>
                  <td className="px-3 py-3 text-right font-medium">{reportCurrency(trip.totalPago)}</td>
                  <td className="px-3 py-3 text-right">{reportCurrency(trip.custos)}</td>
                  <td className="px-3 py-3 text-right">{reportNumber(trip.custoPorGrama) ? reportCurrency(trip.custoPorGrama, 2) : "-"}</td>
                  <td className="px-3 py-3 text-right">
                    <span className="font-medium">{reportCurrency(trip.totalRevenda)}</span>
                    {trip.quantidadeARevender ? <span className="mt-0.5 block text-[9.5px] text-[var(--kanzler-muted)]">{trip.quantidadeARevender} a revender</span> : null}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${reportNumber(trip.resultado) >= 0 ? "text-[var(--kanzler-green)]" : "text-[var(--kanzler-red)]"}`}>
                    {reportCurrency(trip.resultado)}
                  </td>
                </tr>
              )) : <TableEmpty colSpan={9} text="Nenhuma viagem registrada no período." />}
            </tbody>
            {trips.length ? (
              <tfoot className="border-t border-[var(--kanzler-line)] bg-[#fafbfd] font-semibold">
                <tr>
                  <td colSpan={4} className="px-4 py-3">Total ({trips.length} viagens)</td>
                  <td className="px-3 py-3 text-right">{reportCurrency(tripTotals.pago)}</td>
                  <td className="px-3 py-3 text-right">{reportCurrency(tripTotals.custos)}</td>
                  <td />
                  <td className="px-3 py-3 text-right">{reportCurrency(tripTotals.revenda)}</td>
                  <td className={`px-4 py-3 text-right ${tripTotals.resultado >= 0 ? "text-[var(--kanzler-green)]" : "text-[var(--kanzler-red)]"}`}>
                    {reportCurrency(tripTotals.resultado)}
                  </td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </TableShell>
        <p className="border-t border-[var(--kanzler-line)] px-4 py-3 text-[10px] text-[var(--kanzler-muted)]">
          Resultado = revenda − pago em cabelo − custos. Viagens com cabelo ainda não revendido podem aparecer negativas. Clique numa linha para abrir o dia na agenda.
        </p>
      </ReportPanel>

      <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
        <ReportPanel title="Previsão de recompra" hint="vencidas + próximos 3 meses">
          <TableShell>
            <table className="w-full min-w-[560px] border-collapse text-[10.5px]">
              <thead className="bg-[#fafbfd] text-[9.5px] uppercase tracking-[0.04em] text-[var(--kanzler-muted)]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Cidade</th>
                  <th className="px-3 py-3 text-right font-semibold">Vencidas</th>
                  {forecast.meses.map((month) => <th key={month} className="px-3 py-3 text-right font-semibold">{month}</th>)}
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {forecast.rows.length ? forecast.rows.map((row) => (
                  <tr key={row.cidade} className="border-t border-[var(--kanzler-line)]">
                    <td className="px-4 py-3 font-medium">{row.cidade}</td>
                    <td className="px-3 py-3 text-right">
                      {row.vencidas ? <span className="rounded-full bg-[var(--kanzler-red-soft)] px-2 py-1 font-semibold text-[var(--kanzler-red)]">{row.vencidas}</span> : "-"}
                    </td>
                    {row.meses.map((value, index) => <td key={`${row.cidade}-${index}`} className="px-3 py-3 text-right text-[var(--kanzler-muted)]">{value || "-"}</td>)}
                    <td className="px-4 py-3 text-right font-bold">{row.total}</td>
                  </tr>
                )) : <TableEmpty colSpan={6} text="Nenhuma recompra prevista para as próximas janelas." />}
              </tbody>
            </table>
          </TableShell>
          <p className="border-t border-[var(--kanzler-line)] px-4 py-3 text-[10px] text-[var(--kanzler-muted)]">
            Este bloco usa toda a base de compras e não muda com o filtro de período dos demais relatórios.
          </p>
        </ReportPanel>

        <ReportPanel title="Detalhamento das compras" hint={`${purchaseDetails.length} registros`}>
          <div className="max-h-[440px] overflow-auto">
            <table className="w-full min-w-[700px] border-collapse text-[10.5px]">
              <thead className="sticky top-0 z-10 bg-[#fafbfd] text-[9.5px] uppercase tracking-[0.04em] text-[var(--kanzler-muted)]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Contato</th>
                  <th className="px-3 py-3 text-left font-semibold">Cabelo</th>
                  <th className="px-3 py-3 text-right font-semibold">Peso</th>
                  <th className="px-3 py-3 text-right font-semibold">Pago</th>
                  <th className="px-3 py-3 text-right font-semibold">R$/g</th>
                  <th className="px-4 py-3 text-right font-semibold">Corte</th>
                </tr>
              </thead>
              <tbody>
                {purchaseDetails.length ? purchaseDetails.map((item) => (
                  <tr
                    key={item.compraId}
                    onClick={() => navigate(`/contatos?contato=${item.contatoId}`)}
                    className="cursor-pointer border-t border-[var(--kanzler-line)] transition hover:bg-[var(--kanzler-blue-soft)]/45"
                    title="Abrir ficha do contato"
                  >
                    <td className="px-4 py-3">
                      <span className="block font-semibold text-[var(--kanzler-ink)]">{item.nome}</span>
                      <span className="mt-0.5 block text-[9.5px] text-[var(--kanzler-muted)]">{item.cidade}</span>
                    </td>
                    <td className="px-3 py-3 text-[var(--kanzler-muted)]">
                      {[item.cor, item.textura, item.comprimentoCm ? `${item.comprimentoCm} cm` : null].filter(Boolean).join(" · ") || "-"}
                    </td>
                    <td className="px-3 py-3 text-right text-[var(--kanzler-muted)]">{item.pesoG ? `${item.pesoG} g` : "-"}</td>
                    <td className="px-3 py-3 text-right font-semibold">{reportCurrency(item.valorPago)}</td>
                    <td className="px-3 py-3 text-right text-[var(--kanzler-muted)]">{reportNumber(item.precoPorGrama) ? reportCurrency(item.precoPorGrama, 2) : "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-[var(--kanzler-muted)]">{reportDate(item.dataCorte)}</td>
                  </tr>
                )) : <TableEmpty colSpan={6} text="Sem compras no período." />}
              </tbody>
            </table>
          </div>
        </ReportPanel>
      </div>

      {queries.some((query) => query.isError) ? (
        <details className="rounded-[12px] border border-[var(--kanzler-line)] bg-white px-4 py-3 text-[10.5px] text-[var(--kanzler-muted)]">
          <summary className="cursor-pointer font-semibold text-[var(--kanzler-ink)]">Detalhes de carregamento</summary>
          <div className="mt-2 space-y-1">
            {queries.filter((query) => query.isError).map((query, index) => (
              <p key={index}>• {errorMessage(query.error)}</p>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
