interface ReportMetricCardProps {
  label: string;
  value: string;
  foot: string;
}

export function ReportMetricCard({ label, value, foot }: ReportMetricCardProps) {
  return (
    <article className="rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white px-4 py-4 shadow-[var(--kanzler-shadow)] sm:px-5">
      <p className="text-[11px] font-medium text-[var(--kanzler-muted)]">{label}</p>
      <p className="kanzler-display mt-1 text-[24px] font-bold leading-tight tracking-[-0.035em] text-[var(--kanzler-ink)] sm:text-[26px]">
        {value}
      </p>
      <p className="mt-1 text-[10.5px] text-[var(--kanzler-muted-2)]">{foot}</p>
    </article>
  );
}
