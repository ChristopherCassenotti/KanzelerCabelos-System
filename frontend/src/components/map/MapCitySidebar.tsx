import { MapPin } from "lucide-react";
import type { MapCitySummary } from "../../types/map";

interface MapCitySidebarProps {
  cities: MapCitySummary[];
  activeCityId?: string | null;
  onFocus: (cityId: string) => void;
}

function cityBreakdown(city: MapCitySummary) {
  const parts: string[] = [];
  if (city.lead) parts.push(`${city.lead} lead${city.lead === 1 ? "" : "s"}`);
  if (city.avaliacaoAgendada) parts.push(`${city.avaliacaoAgendada} avaliação${city.avaliacaoAgendada === 1 ? "" : "ões"}`);
  if (city.comprado) parts.push(`${city.comprado} compra${city.comprado === 1 ? "" : "s"}`);
  if (city.recompra) parts.push(`${city.recompra} recompra${city.recompra === 1 ? "" : "s"}`);
  if (city.perdido) parts.push(`${city.perdido} perdido${city.perdido === 1 ? "" : "s"}`);
  return parts.join(" · ") || "Sem classificação";
}

export function MapCitySidebar({ cities, activeCityId, onFocus }: MapCitySidebarProps) {
  const ordered = [...cities].sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, "pt-BR"));

  return (
    <aside className="overflow-hidden rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white shadow-[var(--kanzler-shadow)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--kanzler-line)] px-4 py-3.5">
        <h2 className="kanzler-display text-[14px] font-semibold">Por cidade</h2>
        <span className="text-[10px] text-[var(--kanzler-muted-2)]">clique para aproximar</span>
      </div>

      {ordered.length === 0 ? (
        <div className="px-4 py-10 text-center text-[12px] text-[var(--kanzler-muted)]">
          Nenhuma cidade com contatos neste filtro.
        </div>
      ) : (
        <div className="max-h-[660px] divide-y divide-[var(--kanzler-line)] overflow-y-auto">
          {ordered.map((city) => (
            <button
              key={city.cidadeId}
              type="button"
              onClick={() => onFocus(city.cidadeId)}
              className={[
                "flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[var(--kanzler-canvas)]",
                activeCityId === city.cidadeId ? "bg-[var(--kanzler-blue-soft)]" : "bg-white",
              ].join(" ")}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--kanzler-canvas)] text-[var(--kanzler-muted)]">
                <MapPin size={14} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-semibold text-[var(--kanzler-ink)]">
                  {city.nome}{city.uf ? ` - ${city.uf}` : ""}
                </span>
                <span className="mt-0.5 block line-clamp-2 text-[10.5px] leading-4 text-[var(--kanzler-muted)]">
                  {cityBreakdown(city)}
                </span>
              </span>
              <span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-[#eef2f6] px-1.5 text-[10.5px] font-semibold text-[var(--kanzler-muted)]">
                {city.total}
              </span>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
