import {
  ArrowDown,
  ArrowUp,
  Check,
  Clock3,
  Download,
  GripVertical,
  MapPin,
  MessageCircle,
  Navigation,
  Plus,
  Printer,
  RotateCcw,
  Route as RouteIcon,
  ShoppingBag,
  Trash2,
  Truck,
  Zap,
} from "lucide-react";
import { useState } from "react";
import type { RouteDay, RouteItem } from "../../types/schedule";

interface RouteDayPanelProps {
  route?: RouteDay | null;
  busy: boolean;
  draggedItemId?: string | null;
  onCreateTask: (title: string) => Promise<void>;
  onComplete: (item: RouteItem) => void;
  onRemove: (item: RouteItem) => void;
  onPostpone: (item: RouteItem) => void;
  onMove: (itemId: string, direction: -1 | 1) => void;
  onReorderDrop: (sourceId: string, targetId: string) => void;
  onDragItemChange: (itemId: string | null) => void;
  onOpenContact: (contactId: string) => void;
  onOptimize: () => void;
  onCalculateTimes: () => void;
  onOpenGoogleMaps: () => void;
  onExport: () => void;
  onPrint: () => void;
  onDropContact: (contactId: string) => void;
}

function whatsapp(phone?: string | null) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const normalized = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${normalized}`;
}

function maps(item: RouteItem) {
  const contact = item.contato;
  if (!contact) return null;
  const lat = Number(contact.lat);
  const lng = Number(contact.lng);
  const query = Number.isFinite(lat) && Number.isFinite(lng)
    ? `${lat},${lng}`
    : [contact.endereco, contact.cidade?.nome, contact.cidade?.uf].filter(Boolean).join(", ");
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
}

function resultLabel(item: RouteItem) {
  const labels: Record<string, string> = {
    comprou: "Comprou",
    nao_comprou: "Não comprou",
    nao_atendeu: "Não atendeu",
    remarcar: "Remarcar",
  };
  return item.resultado ? labels[item.resultado] ?? item.resultado : null;
}

export function RouteDayPanel({
  route,
  busy,
  draggedItemId,
  onCreateTask,
  onComplete,
  onRemove,
  onPostpone,
  onMove,
  onReorderDrop,
  onDragItemChange,
  onOpenContact,
  onOptimize,
  onCalculateTimes,
  onOpenGoogleMaps,
  onExport,
  onPrint,
  onDropContact,
}: RouteDayPanelProps) {
  const [task, setTask] = useState("");
  const items = [...(route?.itens ?? [])].sort((a, b) => a.ordem - b.ordem);
  const visits = items.filter((item) => item.tipo === "visita");
  const done = items.filter((item) => item.concluido).length;

  async function submitTask() {
    const title = task.trim();
    if (!title) return;
    await onCreateTask(title);
    setTask("");
  }

  return (
    <section
      className="agenda-print-main overflow-hidden rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white shadow-[var(--kanzler-shadow)]"
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes("application/x-kanzler-contact")) event.preventDefault();
      }}
      onDrop={(event) => {
        const contactId = event.dataTransfer.getData("application/x-kanzler-contact");
        if (contactId) {
          event.preventDefault();
          onDropContact(contactId);
        }
      }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--kanzler-line)] px-4 py-3.5">
        <div>
          <h2 className="kanzler-display text-[14.5px] font-semibold">Rota do dia</h2>
          <p className="mt-0.5 text-[11px] text-[var(--kanzler-muted-2)]">{visits.length} visitas · {done}/{items.length} concluídos</p>
        </div>
      </div>

      <div className="agenda-print-hide flex gap-2 border-b border-[var(--kanzler-line)] px-3 py-3">
        <input
          value={task}
          onChange={(event) => setTask(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void submitTask();
          }}
          placeholder="Adicionar tarefa (ex.: abastecer a van, passar no banco)"
          className="min-w-0 flex-1 rounded-[10px] border border-[var(--kanzler-line)] px-3 py-2 text-[12px] outline-none focus:border-[var(--kanzler-blue)]"
        />
        <button type="button" onClick={() => void submitTask()} disabled={busy || !task.trim()} className="inline-flex items-center gap-1.5 rounded-[10px] bg-[var(--kanzler-blue)] px-3 py-2 text-[12px] font-semibold text-white disabled:opacity-50">
          <Plus size={14} /> Tarefa
        </button>
      </div>

      <div className="min-h-[210px] p-2">
        {!route ? (
          <div className="grid min-h-[220px] place-items-center px-5 text-center">
            <div>
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[var(--kanzler-canvas)] text-[var(--kanzler-muted-2)]"><RouteIcon size={21} /></span>
              <h3 className="mt-3 text-[13.5px] font-semibold">Rota ainda não criada</h3>
              <p className="mt-1 max-w-[380px] text-[11.5px] text-[var(--kanzler-muted)]">Escolha o ponto de saída no resumo do dia e crie a rota. Ao usar + em uma cliente, a rota também pode ser criada automaticamente.</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="grid min-h-[220px] place-items-center px-5 text-center">
            <div>
              <Truck size={28} className="mx-auto text-[var(--kanzler-muted-2)]" />
              <h3 className="mt-2 text-[13.5px] font-semibold">Nenhuma visita neste dia</h3>
              <p className="mt-1 text-[11.5px] text-[var(--kanzler-muted)]">Arraste contatos de A agendar ou use o botão +.</p>
            </div>
          </div>
        ) : (
          items.map((item, index) => {
            const contact = item.contato;
            const wa = whatsapp(contact?.telefone);
            const map = maps(item);
            const visitNumber = item.tipo === "visita"
              ? items.slice(0, index + 1).filter((current) => current.tipo === "visita").length
              : null;

            return (
              <div
                key={item.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/x-kanzler-route-item", item.id);
                  event.dataTransfer.effectAllowed = "move";
                  onDragItemChange(item.id);
                }}
                onDragEnd={() => onDragItemChange(null)}
                onDragOver={(event) => {
                  if (event.dataTransfer.types.includes("application/x-kanzler-route-item")) event.preventDefault();
                }}
                onDrop={(event) => {
                  const sourceId = event.dataTransfer.getData("application/x-kanzler-route-item");
                  if (sourceId && sourceId !== item.id) {
                    event.preventDefault();
                    onReorderDrop(sourceId, item.id);
                  }
                }}
                className={[
                  "mb-2 flex flex-wrap items-center gap-2 rounded-xl border px-2.5 py-2.5 transition",
                  item.tipo === "tarefa" ? "border-dashed border-[var(--kanzler-line)] bg-[#fbfcfe]" : "border-[var(--kanzler-line)] bg-white",
                  item.concluido ? "opacity-65" : "",
                  draggedItemId === item.id ? "opacity-35" : "",
                ].join(" ")}
              >
                <GripVertical size={15} className="agenda-print-hide shrink-0 cursor-grab text-[var(--kanzler-muted-2)]" />
                <span className={[
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                  item.concluido ? "bg-[var(--kanzler-green)] text-white" : item.tipo === "tarefa" ? "bg-[#eef1f5] text-[var(--kanzler-muted)]" : "bg-[var(--kanzler-blue)] text-white",
                ].join(" ")}>
                  {item.concluido ? <Check size={13} /> : item.tipo === "tarefa" ? "T" : visitNumber}
                </span>

                <button type="button" onClick={() => onComplete(item)} disabled={busy || item.concluido} className="agenda-print-hide grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[var(--kanzler-line)] text-[var(--kanzler-muted)] disabled:opacity-40" title={item.concluido ? "Concluído" : "Concluir"}>
                  <Check size={13} />
                </button>

                <span className="w-[62px] shrink-0 rounded-lg border border-[var(--kanzler-line)] bg-white px-2 py-1.5 text-center text-[11px] font-semibold">
                  {item.hora?.slice(0, 5) ?? "--:--"}
                </span>

                <button type="button" onClick={() => contact && onOpenContact(contact.id)} disabled={!contact} className="min-w-[160px] flex-1 text-left">
                  <span className={[
                    "block truncate text-[12.5px] font-semibold",
                    item.concluido ? "line-through text-[var(--kanzler-muted)]" : "",
                  ].join(" ")}>
                    {item.tipo === "tarefa" ? item.titulo : contact?.nome}
                  </span>
                  <span className="block truncate text-[11px] text-[var(--kanzler-muted)]">
                    {item.tipo === "tarefa"
                      ? "Tarefa"
                      : [contact?.cidade?.nome, contact?.endereco || "sem endereço", contact?.telefone].filter(Boolean).join(" · ")}
                  </span>
                  {item.resultado && <span className="mt-1 inline-flex rounded-full bg-[var(--kanzler-canvas)] px-2 py-0.5 text-[10px] font-semibold text-[var(--kanzler-muted)]">{resultLabel(item)}</span>}
                </button>

                <div className="agenda-print-hide ml-auto flex flex-wrap justify-end gap-1.5">
                  <button type="button" onClick={() => onMove(item.id, -1)} disabled={busy || index === 0} className="grid h-7 w-7 place-items-center rounded-lg border border-[var(--kanzler-line)] text-[var(--kanzler-muted)] disabled:opacity-30" title="Subir"><ArrowUp size={13} /></button>
                  <button type="button" onClick={() => onMove(item.id, 1)} disabled={busy || index === items.length - 1} className="grid h-7 w-7 place-items-center rounded-lg border border-[var(--kanzler-line)] text-[var(--kanzler-muted)] disabled:opacity-30" title="Descer"><ArrowDown size={13} /></button>
                  {item.tipo === "visita" && !item.concluido && <button type="button" onClick={() => onComplete(item)} disabled={busy} className="grid h-7 w-7 place-items-center rounded-lg border border-[var(--kanzler-line)] text-[var(--kanzler-muted)]" title="Registrar resultado"><ShoppingBag size={13} /></button>}
                  {map && <a href={map} target="_blank" rel="noreferrer" className="grid h-7 w-7 place-items-center rounded-lg border border-[var(--kanzler-line)] text-[var(--kanzler-muted)]" title="Google Maps"><MapPin size={13} /></a>}
                  {wa && <a href={wa} target="_blank" rel="noreferrer" className="grid h-7 w-7 place-items-center rounded-lg border border-[var(--kanzler-line)] text-[var(--kanzler-green)]" title="WhatsApp"><MessageCircle size={13} /></a>}
                  {item.tipo === "visita" && !item.concluido && <button type="button" onClick={() => onPostpone(item)} disabled={busy} className="grid h-7 w-7 place-items-center rounded-lg border border-[var(--kanzler-line)] text-[var(--kanzler-muted)]" title="Adiar 1 dia"><RotateCcw size={13} /></button>}
                  <button type="button" onClick={() => onRemove(item)} disabled={busy} className="grid h-7 w-7 place-items-center rounded-lg border border-[var(--kanzler-line)] text-[var(--kanzler-red)]" title="Remover"><Trash2 size={13} /></button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="agenda-print-hide flex flex-wrap gap-2 border-t border-[var(--kanzler-line)] px-3 py-3">
        <button type="button" onClick={onOptimize} disabled={busy || visits.length < 2} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--kanzler-line)] px-2.5 py-2 text-[11.5px] font-semibold text-[var(--kanzler-ink)] disabled:opacity-40"><Zap size={13} /> Menor distância</button>
        <button type="button" onClick={onCalculateTimes} disabled={busy || visits.length === 0} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--kanzler-line)] px-2.5 py-2 text-[11.5px] font-semibold text-[var(--kanzler-ink)] disabled:opacity-40"><Clock3 size={13} /> Calcular horários</button>
        <button type="button" onClick={onOpenGoogleMaps} disabled={busy || visits.length === 0} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--kanzler-blue)] px-2.5 py-2 text-[11.5px] font-semibold text-white disabled:opacity-40"><Navigation size={13} /> Google Maps</button>
        <button type="button" onClick={onExport} disabled={busy || !route || items.length === 0} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--kanzler-line)] px-2.5 py-2 text-[11.5px] font-semibold text-[var(--kanzler-ink)] disabled:opacity-40"><Download size={13} /> Excel</button>
        <button type="button" onClick={onPrint} disabled={!route || items.length === 0} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--kanzler-line)] px-2.5 py-2 text-[11.5px] font-semibold text-[var(--kanzler-ink)] disabled:opacity-40"><Printer size={13} /> Imprimir</button>
      </div>
    </section>
  );
}
