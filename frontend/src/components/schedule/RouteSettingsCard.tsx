import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import type { City } from "../../types/contact";
import type { RouteDay, RouteMapDto, RouteSettingsDraft } from "../../types/schedule";

interface RouteSettingsCardProps {
  route?: RouteDay | null;
  routeMap?: RouteMapDto | null;
  cities: City[];
  selectedDate: string;
  busy: boolean;
  onSave: (draft: RouteSettingsDraft) => Promise<void>;
}

function moneyValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "0" || value === 0) return "";
  return String(value);
}

function initialDraft(route: RouteDay | null | undefined, cities: City[]): RouteSettingsDraft {
  const defaultCity = cities.find((city) => city.nome === "União da Vitória") ?? cities[0];

  return {
    partidaCidadeId: route?.partidaCidadeId ?? defaultCity?.id ?? "",
    horaSaida: route?.horaSaida?.slice(0, 5) ?? "08:00",
    minutosPorVisita: route?.minutosPorVisita ?? 40,
    custoCombustivel: moneyValue(route?.custoCombustivel),
    custoAlimentacao: moneyValue(route?.custoAlimentacao),
    custoHospedagem: moneyValue(route?.custoHospedagem),
    custoOutros: moneyValue(route?.custoOutros),
  };
}

function currency(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(parsed) ? parsed : 0);
}

function durationLabel(minutes: number | null | undefined) {
  const value = Number(minutes ?? 0);
  const hours = Math.floor(value / 60);
  const mins = Math.round(value % 60);
  return `≈ ${hours}h${String(mins).padStart(2, "0")}`;
}

export function RouteSettingsCard({ route, routeMap, cities, selectedDate, busy, onSave }: RouteSettingsCardProps) {
  const [draft, setDraft] = useState<RouteSettingsDraft>(() => initialDraft(route, cities));

  useEffect(() => {
    setDraft(initialDraft(route, cities));
  }, [route, cities, selectedDate]);

  const cityNames = Array.from(new Set((routeMap?.paradas ?? []).map((stop) => stop.contato.cidade?.nome).filter(Boolean)));
  const costs = [draft.custoCombustivel, draft.custoAlimentacao, draft.custoHospedagem, draft.custoOutros]
    .reduce((sum, value) => sum + (Number(value) || 0), 0);

  function update<K extends keyof RouteSettingsDraft>(key: K, value: RouteSettingsDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white shadow-[var(--kanzler-shadow)]">
        <div className="border-b border-[var(--kanzler-line)] px-4 py-3.5">
          <h2 className="kanzler-display text-[14.5px] font-semibold">Resumo do dia</h2>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[10px] bg-[var(--kanzler-canvas)] px-3 py-2.5">
              <p className="text-[10.5px] text-[var(--kanzler-muted)]">Distância estimada</p>
              <p className="kanzler-display mt-0.5 text-[15px] font-semibold">≈ {Number(routeMap?.distanciaKm ?? route?.distanciaKm ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km</p>
            </div>
            <div className="rounded-[10px] bg-[var(--kanzler-canvas)] px-3 py-2.5">
              <p className="text-[10.5px] text-[var(--kanzler-muted)]">Tempo de estrada</p>
              <p className="kanzler-display mt-0.5 text-[15px] font-semibold">{durationLabel(routeMap?.duracaoMin ?? route?.duracaoMin)}</p>
            </div>
            <div className="rounded-[10px] bg-[var(--kanzler-canvas)] px-3 py-2.5">
              <p className="text-[10.5px] text-[var(--kanzler-muted)]">Cidades</p>
              <p className="truncate text-[12px] font-semibold" title={cityNames.join(", ")}>{cityNames.join(", ") || "-"}</p>
            </div>
            <div className="rounded-[10px] bg-[var(--kanzler-canvas)] px-3 py-2.5">
              <p className="text-[10.5px] text-[var(--kanzler-muted)]">Custos</p>
              <p className="kanzler-display mt-0.5 text-[15px] font-semibold">{currency(costs)}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="col-span-2 text-[11px] font-semibold text-[var(--kanzler-muted)]">
              Ponto de saída
              <select
                value={draft.partidaCidadeId}
                onChange={(event) => update("partidaCidadeId", event.target.value)}
                className="mt-1.5 w-full rounded-[10px] border border-[var(--kanzler-line)] bg-white px-3 py-2.5 text-[12.5px] outline-none focus:border-[var(--kanzler-blue)]"
              >
                <option value="">Selecione</option>
                {cities.map((city) => <option key={city.id} value={city.id}>{city.nome} - {city.uf}</option>)}
              </select>
            </label>

            <label className="text-[11px] font-semibold text-[var(--kanzler-muted)]">
              Saída às
              <input type="time" value={draft.horaSaida} onChange={(event) => update("horaSaida", event.target.value)} className="mt-1.5 w-full rounded-[10px] border border-[var(--kanzler-line)] px-3 py-2.5 text-[12.5px] outline-none focus:border-[var(--kanzler-blue)]" />
            </label>

            <label className="text-[11px] font-semibold text-[var(--kanzler-muted)]">
              Min. por visita
              <input type="number" min={10} step={5} value={draft.minutosPorVisita} onChange={(event) => update("minutosPorVisita", Number(event.target.value))} className="mt-1.5 w-full rounded-[10px] border border-[var(--kanzler-line)] px-3 py-2.5 text-[12.5px] outline-none focus:border-[var(--kanzler-blue)]" />
            </label>
          </div>

          <button
            type="button"
            onClick={() => void onSave(draft)}
            disabled={busy || !draft.partidaCidadeId}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[var(--kanzler-blue)] px-3 py-2.5 text-[12px] font-semibold text-white hover:bg-[var(--kanzler-blue-dark)] disabled:opacity-50"
          >
            <Save size={14} /> {route ? "Salvar configurações" : "Criar rota deste dia"}
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white shadow-[var(--kanzler-shadow)]">
        <div className="border-b border-[var(--kanzler-line)] px-4 py-3.5">
          <h2 className="kanzler-display text-[14.5px] font-semibold">Custos da viagem</h2>
          <p className="mt-0.5 text-[10.5px] text-[var(--kanzler-muted-2)]">entram no relatório de viagens</p>
        </div>

        <div className="grid grid-cols-2 gap-3 p-4">
          {([
            ["custoCombustivel", "Combustível"],
            ["custoAlimentacao", "Alimentação"],
            ["custoHospedagem", "Hospedagem"],
            ["custoOutros", "Outros"],
          ] as const).map(([key, label]) => (
            <label key={key} className="text-[11px] font-semibold text-[var(--kanzler-muted)]">
              {label} (R$)
              <input type="number" min={0} step={10} value={draft[key]} onChange={(event) => update(key, event.target.value)} placeholder="0" className="mt-1.5 w-full rounded-[10px] border border-[var(--kanzler-line)] px-3 py-2.5 text-[12.5px] outline-none focus:border-[var(--kanzler-blue)]" />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
