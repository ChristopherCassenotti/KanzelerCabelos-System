import { CheckCircle2, PhoneOff, RotateCcw, ShoppingBag, X } from "lucide-react";
import type { RouteItem, VisitResult } from "../../types/schedule";

interface VisitResultDialogProps {
  item: RouteItem | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: (result: VisitResult) => void;
}

const options: Array<{
  value: VisitResult;
  label: string;
  description: string;
  icon: typeof ShoppingBag;
  tone: string;
}> = [
  {
    value: "comprou",
    label: "Comprou",
    description: "Conclui a visita e prepara o registro da compra.",
    icon: ShoppingBag,
    tone: "text-[var(--kanzler-green)] bg-[var(--kanzler-green-soft)]",
  },
  {
    value: "nao_comprou",
    label: "Não comprou",
    description: "A visita foi realizada, mas não houve compra.",
    icon: CheckCircle2,
    tone: "text-[var(--kanzler-muted)] bg-[#eef1f5]",
  },
  {
    value: "nao_atendeu",
    label: "Não atendeu",
    description: "Marca a visita como concluída sem atendimento.",
    icon: PhoneOff,
    tone: "text-[var(--kanzler-red)] bg-[var(--kanzler-red-soft)]",
  },
  {
    value: "remarcar",
    label: "Remarcar",
    description: "Registra o resultado; o adiamento de data pode ser feito em seguida.",
    icon: RotateCcw,
    tone: "text-[var(--kanzler-amber)] bg-[var(--kanzler-amber-soft)]",
  },
];

export function VisitResultDialog({ item, busy, onClose, onConfirm }: VisitResultDialogProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[1600] grid place-items-center bg-[rgba(14,26,43,.5)] p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-[520px] overflow-hidden rounded-[16px] border border-[var(--kanzler-line)] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--kanzler-line)] px-5 py-4">
          <div>
            <h2 className="kanzler-display text-base font-semibold">Resultado da visita</h2>
            <p className="mt-1 text-[12px] text-[var(--kanzler-muted)]">{item.contato?.nome ?? "Cliente"}</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--kanzler-muted)] hover:bg-[var(--kanzler-canvas)] disabled:opacity-50" aria-label="Fechar">
            <X size={17} />
          </button>
        </div>

        <div className="grid gap-2 p-4">
          {options.map(({ value, label, description, icon: Icon, tone }) => (
            <button
              key={value}
              type="button"
              onClick={() => onConfirm(value)}
              disabled={busy}
              className="flex items-center gap-3 rounded-xl border border-[var(--kanzler-line)] px-3.5 py-3 text-left transition hover:border-[#cbd5e1] hover:bg-[#fbfcfe] disabled:opacity-50"
            >
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] ${tone}`}><Icon size={17} /></span>
              <span className="min-w-0">
                <strong className="block text-[13px]">{label}</strong>
                <span className="mt-0.5 block text-[11.5px] text-[var(--kanzler-muted)]">{description}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
