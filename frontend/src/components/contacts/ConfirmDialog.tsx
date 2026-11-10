import { AlertTriangle, X } from "lucide-react";
import { useEffect, useState } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  strongConfirm?: boolean;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  strongConfirm = false,
  pending = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onCancel();
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [open, pending, onCancel]);

  if (!open) return null;

  const blocked = strongConfirm && typed !== "EXCLUIR";

  return (
    <div className="fixed inset-0 z-[1700] grid place-items-center bg-[#0e1a2b]/45 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--kanzler-line)] bg-white shadow-2xl">
        <div className="flex items-start gap-3 border-b border-[var(--kanzler-line)] px-5 py-4">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${destructive ? "bg-[var(--kanzler-red-soft)] text-[var(--kanzler-red)]" : "bg-[var(--kanzler-amber-soft)] text-[var(--kanzler-amber)]"}`}>
            <AlertTriangle size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="kanzler-display text-lg font-semibold">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--kanzler-muted)]">{description}</p>
          </div>
          <button type="button" onClick={onCancel} disabled={pending} className="grid h-8 w-8 place-items-center rounded-lg text-[var(--kanzler-muted)] hover:bg-[var(--kanzler-canvas)]">
            <X size={17} />
          </button>
        </div>

        {strongConfirm && (
          <div className="px-5 pt-4">
            <label className="text-[12px] font-semibold text-[var(--kanzler-ink)]">
              Digite <strong>EXCLUIR</strong> para confirmar
            </label>
            <input
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoFocus
              className="mt-2 w-full rounded-[10px] border border-[var(--kanzler-line)] px-3 py-2.5 outline-none focus:border-[var(--kanzler-blue)] focus:ring-4 focus:ring-[var(--kanzler-blue-soft)]"
            />
          </div>
        )}

        <div className="flex justify-end gap-2 px-5 py-4">
          <button type="button" onClick={onCancel} disabled={pending} className="rounded-[10px] border border-[var(--kanzler-line)] bg-white px-4 py-2.5 text-sm font-semibold hover:bg-[var(--kanzler-canvas)] disabled:opacity-50">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending || blocked}
            className={`rounded-[10px] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 ${destructive ? "bg-[var(--kanzler-red)] hover:bg-[#a72f2f]" : "bg-[var(--kanzler-blue)] hover:bg-[var(--kanzler-blue-dark)]"}`}
          >
            {pending ? "Processando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
