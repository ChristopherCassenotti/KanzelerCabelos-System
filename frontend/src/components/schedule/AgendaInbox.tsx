import { Plus, RefreshCw, UsersRound } from "lucide-react";
import type {
  ScheduleCandidate,
  ScheduleCandidateType,
  ScheduleSummary,
} from "../../types/schedule";

interface AgendaInboxProps {
  candidates: ScheduleCandidate[];
  summary?: ScheduleSummary;
  selectedType: "todos" | ScheduleCandidateType;
  selectedCityId: string;
  loading: boolean;
  busyContactId?: string | null;
  onTypeChange: (type: "todos" | ScheduleCandidateType) => void;
  onCityChange: (cityId: string) => void;
  onAdd: (candidate: ScheduleCandidate) => void;
  onOpenContact: (contactId: string) => void;
  onRefresh: () => void;
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function typeLabel(candidate: ScheduleCandidate) {
  if (candidate.tipoAgendamento === "recompra") {
    const days = candidate.recompra?.diasAte;
    if (typeof days === "number") {
      if (days < 0) return `Recompra vencida há ${Math.abs(days)}d`;
      if (days === 0) return "Recompra vence hoje";
      return `Recompra em ${days}d`;
    }
    return "Recompra";
  }

  if (candidate.tipoAgendamento === "avaliacao") {
    return candidate.dataAvaliacao ? "Avaliação agendada" : "Avaliação sem data";
  }

  return "Lead";
}

function typeClass(type: ScheduleCandidateType) {
  if (type === "recompra") return "text-[var(--kanzler-amber)]";
  if (type === "avaliacao") return "text-[var(--kanzler-blue)]";
  return "text-[var(--kanzler-muted)]";
}

export function AgendaInbox({
  candidates,
  summary,
  selectedType,
  selectedCityId,
  loading,
  busyContactId,
  onTypeChange,
  onCityChange,
  onAdd,
  onOpenContact,
  onRefresh,
}: AgendaInboxProps) {
  const cities = summary?.cidades ?? [];
  const total = summary?.total ?? candidates.length;

  const chips: Array<{
    key: "todos" | ScheduleCandidateType;
    label: string;
    count: number;
  }> = [
    { key: "todos", label: "Todos", count: total },
    { key: "lead", label: "Leads", count: summary?.tipos.lead ?? 0 },
    { key: "avaliacao", label: "Avaliações", count: summary?.tipos.avaliacao ?? 0 },
    { key: "recompra", label: "Recompra", count: summary?.tipos.recompra ?? 0 },
  ];

  return (
    <section className="overflow-hidden rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white shadow-[var(--kanzler-shadow)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--kanzler-line)] px-4 py-3.5">
        <div>
          <h2 className="kanzler-display text-[14.5px] font-semibold">A agendar</h2>
          <p className="mt-0.5 text-[11.5px] text-[var(--kanzler-muted-2)]">{total} contatos elegíveis</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--kanzler-line)] text-[var(--kanzler-muted)] hover:bg-[var(--kanzler-canvas)] disabled:opacity-50"
          title="Atualizar A agendar"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="space-y-2 border-b border-[var(--kanzler-line)] px-3 py-3">
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onTypeChange(chip.key)}
              className={[
                "rounded-full border px-2.5 py-1.5 text-[11.5px] font-semibold transition",
                selectedType === chip.key
                  ? "border-[var(--kanzler-navy)] bg-[var(--kanzler-navy)] text-white"
                  : "border-[var(--kanzler-line)] bg-white text-[var(--kanzler-muted)] hover:text-[var(--kanzler-ink)]",
              ].join(" ")}
            >
              {chip.label} <span className="ml-1 opacity-70">{chip.count}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onCityChange("")}
            className={[
              "rounded-full border px-2.5 py-1.5 text-[11.5px] font-semibold transition",
              !selectedCityId
                ? "border-[var(--kanzler-navy)] bg-[var(--kanzler-navy)] text-white"
                : "border-[var(--kanzler-line)] bg-white text-[var(--kanzler-muted)]",
            ].join(" ")}
          >
            Todas as cidades
          </button>

          {cities.map((city) => {
            const count = city.quantidade ?? city.total ?? 0;
            return (
              <button
                key={city.cidadeId}
                type="button"
                onClick={() => onCityChange(city.cidadeId)}
                className={[
                  "rounded-full border px-2.5 py-1.5 text-[11.5px] font-semibold transition",
                  selectedCityId === city.cidadeId
                    ? "border-[var(--kanzler-navy)] bg-[var(--kanzler-navy)] text-white"
                    : "border-[var(--kanzler-line)] bg-white text-[var(--kanzler-muted)]",
                ].join(" ")}
              >
                {city.nome} <span className="ml-1 opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-h-[620px] overflow-y-auto p-1.5">
        {loading ? (
          <div className="space-y-1.5 p-1.5">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="h-[58px] animate-pulse rounded-[10px] bg-[var(--kanzler-canvas)]" />
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="grid min-h-[180px] place-items-center px-5 py-8 text-center">
            <div>
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[var(--kanzler-canvas)] text-[var(--kanzler-muted-2)]">
                <UsersRound size={19} />
              </span>
              <p className="mt-3 text-[13px] font-semibold">Nada para agendar</p>
              <p className="mt-1 text-[11.5px] text-[var(--kanzler-muted)]">Ajuste os filtros ou atualize a fila.</p>
            </div>
          </div>
        ) : (
          candidates.map((candidate) => (
            <div
              key={candidate.id}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData("application/x-kanzler-contact", candidate.id);
                event.dataTransfer.effectAllowed = "move";
              }}
              className="group flex items-center gap-2.5 rounded-[10px] border border-transparent px-2.5 py-2.5 transition hover:border-[var(--kanzler-line)] hover:bg-[var(--kanzler-canvas)]"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--kanzler-blue-soft)] text-[10.5px] font-bold text-[var(--kanzler-blue)]">
                {initials(candidate.nome)}
              </span>
              <button type="button" onClick={() => onOpenContact(candidate.id)} className="min-w-0 flex-1 text-left">
                <span className="block truncate text-[12.5px] font-semibold">{candidate.nome}</span>
                <span className="block truncate text-[11.5px] text-[var(--kanzler-muted)]">
                  {candidate.cidade.nome} · <strong className={typeClass(candidate.tipoAgendamento)}>{typeLabel(candidate)}</strong>
                </span>
              </button>
              <button
                type="button"
                onClick={() => onAdd(candidate)}
                disabled={busyContactId === candidate.id}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#c9d8ff] bg-[var(--kanzler-blue-soft)] text-[var(--kanzler-blue)] transition hover:bg-[var(--kanzler-blue)] hover:text-white disabled:opacity-50"
                title="Adicionar à rota selecionada"
              >
                <Plus size={15} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-[var(--kanzler-line)] px-4 py-2.5 text-[10.5px] text-[var(--kanzler-muted-2)]">
        No desktop, arraste para a rota ou para outro dia da semana. No celular, use o botão +.
      </div>
    </section>
  );
}
