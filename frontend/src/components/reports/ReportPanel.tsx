import type { ReactNode } from "react";

interface ReportPanelProps {
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function ReportPanel({ title, hint, children, className = "" }: ReportPanelProps) {
  return (
    <section className={`min-w-0 overflow-hidden rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white shadow-[var(--kanzler-shadow)] ${className}`}>
      <header className="flex min-h-12 items-center justify-between gap-3 border-b border-[var(--kanzler-line)] px-4 py-3">
        <h2 className="kanzler-display text-[13px] font-semibold text-[var(--kanzler-ink)]">{title}</h2>
        {hint ? <span className="text-right text-[10px] text-[var(--kanzler-muted-2)]">{hint}</span> : null}
      </header>
      {children}
    </section>
  );
}
