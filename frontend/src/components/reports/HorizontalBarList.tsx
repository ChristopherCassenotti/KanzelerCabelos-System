interface HorizontalBarItem {
  key: string;
  label: string;
  value: number;
  detail: string;
}

interface HorizontalBarListProps {
  items: HorizontalBarItem[];
  emptyText: string;
  tone?: "blue" | "amber" | "red";
}

const fillClasses = {
  blue: "bg-[var(--kanzler-blue)]",
  amber: "bg-[var(--kanzler-amber)]",
  red: "bg-[var(--kanzler-red)]",
};

export function HorizontalBarList({ items, emptyText, tone = "blue" }: HorizontalBarListProps) {
  const maxValue = Math.max(0, ...items.map((item) => item.value));

  if (!items.length) {
    return <div className="px-4 py-10 text-center text-[11.5px] text-[var(--kanzler-muted)]">{emptyText}</div>;
  }

  return (
    <div className="space-y-3 px-4 py-4">
      {items.map(
        (item, index) => {
        const width = maxValue > 0 ? Math.max(4, (item.value / maxValue) * 100) : 0;
        return (
          <div key={`${item.key}-${index}`} className="grid min-w-0 grid-cols-[105px_minmax(80px,1fr)_auto] items-center gap-3 sm:grid-cols-[125px_minmax(100px,1fr)_auto]">
            <span className="truncate text-[11px] text-[var(--kanzler-muted)]" title={item.label}>{item.label}</span>
            <span className="h-[7px] overflow-hidden rounded-full bg-[#f0f2f6]">
              <span className={`block h-full rounded-full ${fillClasses[tone]}`} style={{ width: `${width}%` }} />
            </span>
            <span className="whitespace-nowrap text-right text-[10.5px] font-semibold text-[var(--kanzler-ink)]">{item.detail}</span>
          </div>
        );
      })}
    </div>
  );
}
