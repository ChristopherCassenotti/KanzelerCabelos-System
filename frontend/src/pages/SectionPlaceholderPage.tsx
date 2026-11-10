import type { LucideIcon } from "lucide-react";

interface SectionPlaceholderPageProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  nextStep: string;
}

export function SectionPlaceholderPage({
  icon: Icon,
  eyebrow,
  title,
  description,
  nextStep,
}: SectionPlaceholderPageProps) {
  return (
    <section className="rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white shadow-[var(--kanzler-shadow)]">
      <div className="p-5 sm:p-7">
        <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-[var(--kanzler-blue-soft)] text-[var(--kanzler-blue)]">
          <Icon size={19} />
        </div>

        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.11em] text-[var(--kanzler-blue)]">{eyebrow}</p>
        <h2 className="kanzler-display mt-1.5 text-xl font-bold tracking-[-0.025em] text-[var(--kanzler-ink)] sm:text-2xl">
          {title}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--kanzler-muted)]">{description}</p>

        <div className="mt-6 rounded-[12px] border border-[var(--kanzler-line)] bg-[var(--kanzler-canvas)] px-4 py-3.5 text-sm text-[var(--kanzler-muted)]">
          <strong className="font-semibold text-[var(--kanzler-ink)]">Próxima implementação:</strong> {nextStep}
        </div>
      </div>
    </section>
  );
}
