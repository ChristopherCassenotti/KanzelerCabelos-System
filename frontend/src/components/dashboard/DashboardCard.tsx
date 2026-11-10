import type { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  footnote: string;
  tone?: "navy" | "blue" | "green" | "amber";
}

const toneClasses = {
  navy: "bg-[#e7ecf5] text-[var(--kanzler-navy-3)]",
  blue: "bg-[var(--kanzler-blue-soft)] text-[var(--kanzler-blue)]",
  green: "bg-[var(--kanzler-green-soft)] text-[var(--kanzler-green)]",
  amber: "bg-[var(--kanzler-amber-soft)] text-[var(--kanzler-amber)]",
} as const;

export function DashboardCard({
  icon: Icon,
  label,
  value,
  footnote,
  tone = "navy",
}: DashboardCardProps) {
  return (
    <article className="min-w-0 rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white p-4 shadow-[var(--kanzler-shadow)] sm:p-[17px]">
      <div className={`grid h-8 w-8 place-items-center rounded-[9px] ${toneClasses[tone]}`}>
        <Icon size={17} strokeWidth={2} />
      </div>

      <p className="mt-3 text-[12px] font-medium text-[var(--kanzler-muted)]">{label}</p>
      <p className="kanzler-display mt-1 truncate text-[25px] font-bold leading-none tracking-[-0.04em] text-[var(--kanzler-ink)]">
        {value}
      </p>
      <p className="mt-2 min-h-[17px] text-[11.5px] leading-[17px] text-[var(--kanzler-muted-2)]">{footnote}</p>
    </article>
  );
}
