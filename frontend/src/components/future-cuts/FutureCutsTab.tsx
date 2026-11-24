import { useQuery } from "@tanstack/react-query";
import { AlertCircle, RefreshCw, SearchX } from "lucide-react";
import { useState } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { listFutureCuts } from "../../services/future-cuts/future-cuts.service";
import type { City } from "../../types/contact";
import type { FutureCutFilters, FutureCutSituationFilter } from "../../types/future-cut";
import { formatDate, formatPhone, initials } from "../../utils/contact";
import { futureCutBadgeClass, futureCutHair, futureCutLabel, priorityLabels } from "../../utils/future-cut";
import { colors, textures } from "../../utils/hair-options";

interface FutureCutsTabProps {
  cities: City[];
  onOpenContact: (contactId: string) => void;
}

const situationFilters: Array<{ key: FutureCutSituationFilter; label: string }> = [
  { key: "este_mes", label: "Contato este mês" },
  { key: "atrasado", label: "Contato atrasado" },
  { key: "proximos_30_dias", label: "Próximos 30 dias" },
];

const selectClass = "rounded-[10px] border border-[var(--kanzler-line)] bg-white px-3 py-2.5 text-[13px] font-medium outline-none focus:border-[var(--kanzler-blue)]";

function chipClass(active: boolean) {
  return [
    "rounded-full border px-3 py-2 text-[12px] font-semibold transition",
    active
      ? "border-[var(--kanzler-navy)] bg-[var(--kanzler-navy)] text-white"
      : "border-[var(--kanzler-line)] bg-white text-[var(--kanzler-muted)] hover:text-[var(--kanzler-ink)]",
  ].join(" ");
}

function toLength(value: string) {
  return /^\d+$/.test(value) ? Number(value) : undefined;
}

export function FutureCutsTab({ cities, onOpenContact }: FutureCutsTabProps) {
  const [situation, setSituation] = useState<FutureCutSituationFilter | "">("");
  const [highPriority, setHighPriority] = useState(false);
  const [cityId, setCityId] = useState("");
  const [color, setColor] = useState("");
  const [texture, setTexture] = useState("");
  const [minLength, setMinLength] = useState("");
  const [maxLength, setMaxLength] = useState("");
  const lengths = useDebouncedValue(`${minLength}|${maxLength}`, 400);
  const [comprimentoMin, comprimentoMax] = lengths.split("|").map(toLength);

  const invalidRange = comprimentoMin !== undefined && comprimentoMax !== undefined && comprimentoMin > comprimentoMax;

  const filters: FutureCutFilters = {
    ...(situation ? { situacao: situation } : {}),
    ...(highPriority ? { prioridade: "alta" } : {}),
    ...(cityId ? { cidadeId: cityId } : {}),
    ...(color ? { cor: color } : {}),
    ...(texture ? { textura: texture } : {}),
    ...(comprimentoMin !== undefined ? { comprimentoMin } : {}),
    ...(comprimentoMax !== undefined ? { comprimentoMax } : {}),
  };

  const query = useQuery({
    queryKey: ["contacts", "future-cuts", "list", filters],
    queryFn: () => listFutureCuts(filters),
    enabled: !invalidRange,
  });

  const items = invalidRange ? [] : query.data ?? [];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {situationFilters.map(({ key, label }) => (
          <button key={key} type="button" onClick={() => setSituation(situation === key ? "" : key)} className={chipClass(situation === key)}>
            {label}
          </button>
        ))}
        <button type="button" onClick={() => setHighPriority(!highPriority)} className={chipClass(highPriority)}>
          Prioridade alta
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <select value={cityId} onChange={(event) => setCityId(event.target.value)} className={selectClass}>
          <option value="">Todas as cidades</option>
          {cities.map((city) => <option key={city.id} value={city.id}>{city.nome}</option>)}
        </select>
        <select value={color} onChange={(event) => setColor(event.target.value)} className={selectClass}>
          <option value="">Todas as cores</option>
          {colors.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <select value={texture} onChange={(event) => setTexture(event.target.value)} className={selectClass}>
          <option value="">Todas as texturas</option>
          {textures.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <input value={minLength} onChange={(event) => setMinLength(event.target.value)} inputMode="numeric" placeholder="Compr. mín. (cm)" aria-label="Comprimento mínimo" className={`${selectClass} w-36`} />
        <input value={maxLength} onChange={(event) => setMaxLength(event.target.value)} inputMode="numeric" placeholder="Compr. máx. (cm)" aria-label="Comprimento máximo" className={`${selectClass} w-36`} />
        <span className="ml-auto text-[12.5px] text-[var(--kanzler-muted)]">{items.length} futuro(s) corte(s)</span>
      </div>

      {(query.isError || invalidRange) && (
        <div className="flex flex-col gap-3 rounded-xl border border-[#f2caca] bg-[var(--kanzler-red-soft)] px-4 py-3 text-sm text-[var(--kanzler-red)] sm:flex-row sm:items-center">
          <span className="flex items-center gap-2">
            <AlertCircle size={17} />
            {invalidRange
              ? "O comprimento mínimo é maior que o máximo."
              : query.error instanceof Error ? query.error.message : "Não foi possível carregar os futuros cortes"}
          </span>
          {!invalidRange && (
            <button type="button" onClick={() => void query.refetch()} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 font-semibold sm:ml-auto">
              <RefreshCw size={14} /> Tentar novamente
            </button>
          )}
        </div>
      )}

      <section className="overflow-hidden rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white shadow-[var(--kanzler-shadow)]">
        {query.isPending && !invalidRange ? (
          <div className="space-y-px bg-[var(--kanzler-line)]">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-[66px] animate-pulse bg-white" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="grid min-h-[300px] place-items-center px-6 py-14 text-center">
            <div>
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--kanzler-canvas)] text-[var(--kanzler-muted-2)]"><SearchX size={22} /></span>
              <h2 className="kanzler-display mt-3 text-base font-semibold">Nenhum futuro corte encontrado</h2>
              <p className="mt-1 text-sm text-[var(--kanzler-muted)]">Ajuste os filtros ou adicione um interesse futuro na ficha do contato.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--kanzler-line)]">
            {items.map((item) => (
              <button key={item.id} type="button" onClick={() => onOpenContact(item.contatoId)} className="flex w-full flex-wrap items-center gap-3 px-4 py-3.5 text-left hover:bg-[#fbfcfe]">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--kanzler-blue-soft)] text-[11px] font-bold text-[var(--kanzler-blue)]">{initials(item.contato.nome)}</span>
                <span className="min-w-[160px] flex-1">
                  <span className="block truncate text-[13px] font-semibold">{item.contato.nome}</span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-[var(--kanzler-muted)]">{item.contato.cidade.nome} · {formatPhone(item.contato.telefone)}</span>
                </span>
                <span className="min-w-[160px] flex-1 text-[12px]">
                  <span className="block">{futureCutHair(item) || "-"}</span>
                  <span className="mt-0.5 block text-[11.5px] text-[var(--kanzler-muted)]">Prioridade {priorityLabels[item.prioridade].toLowerCase()} · corte {formatDate(item.dataPrevista)}</span>
                </span>
                <span className="text-[12px] font-semibold">{formatDate(item.dataProximoContato)}</span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${futureCutBadgeClass(item)}`}>{futureCutLabel(item)}</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
