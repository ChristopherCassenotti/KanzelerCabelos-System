import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

interface FutureCutModalShellProps {
  title: string;
  description: string;
  submitLabel: string;
  pending: boolean;
  error: string | null;
  wide?: boolean;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => unknown;
}

export const inputClass = "w-full rounded-[10px] border border-[var(--kanzler-line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--kanzler-blue)] focus:ring-4 focus:ring-[var(--kanzler-blue-soft)] disabled:bg-[var(--kanzler-canvas)]";
export const errorClass = "mt-1 text-[11.5px] text-[var(--kanzler-red)]";

export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="mb-1.5 block text-[12px] font-semibold text-[var(--kanzler-ink)]">
      {children} {required && <span className="text-[var(--kanzler-red)]">*</span>}
    </span>
  );
}

export function FutureCutModalShell({
  title,
  description,
  submitLabel,
  pending,
  error,
  wide = false,
  children,
  onClose,
  onSubmit,
}: FutureCutModalShellProps) {
  useEffect(() => {
    // Captura antes da ficha, para o Esc fechar só o modal.
    const listener = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      if (!pending) onClose();
    };
    window.addEventListener("keydown", listener, true);
    return () => window.removeEventListener("keydown", listener, true);
  }, [pending, onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-[#0e1a2b]/45 p-3 backdrop-blur-[1px] sm:p-6">
      <div className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl border border-[var(--kanzler-line)] bg-white shadow-2xl ${wide ? "max-w-[760px]" : "max-w-md"}`}>
        <div className="flex items-center justify-between border-b border-[var(--kanzler-line)] px-5 py-4 sm:px-6">
          <div>
            <h2 className="kanzler-display text-lg font-semibold text-[var(--kanzler-ink)]">{title}</h2>
            <p className="mt-0.5 text-[12px] text-[var(--kanzler-muted)]">{description}</p>
          </div>
          <button type="button" onClick={onClose} disabled={pending} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[var(--kanzler-muted)] hover:bg-[var(--kanzler-canvas)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {children}
            {error && (
              <div className="mt-4 rounded-[10px] border border-[#f2caca] bg-[var(--kanzler-red-soft)] px-3 py-2.5 text-sm text-[var(--kanzler-red)]">
                {error}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-[var(--kanzler-line)] bg-white px-5 py-4 sm:px-6">
            <button type="button" onClick={onClose} disabled={pending} className="rounded-[10px] border border-[var(--kanzler-line)] bg-white px-4 py-2.5 text-sm font-semibold hover:bg-[var(--kanzler-canvas)] disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={pending} className="rounded-[10px] bg-[var(--kanzler-blue)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--kanzler-blue-dark)] disabled:opacity-50">
              {pending ? "Salvando..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
