import { Menu } from "lucide-react";
import { GlobalSearch } from "../search/GlobalSearch";

interface TopbarProps {
  title: string;
  subtitle: string;
  onOpenSidebar: () => void;
}

export function Topbar({ title, subtitle, onOpenSidebar }: TopbarProps) {
  return (
    <header className="sticky top-0 z-[1030] border-b border-[var(--kanzler-line)] bg-white px-4 py-3.5 sm:px-5 min-[821px]:px-7">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-[var(--kanzler-line)] bg-white text-[var(--kanzler-ink)] transition hover:bg-[var(--kanzler-canvas)] min-[821px]:hidden"
          aria-label="Abrir menu"
        >
          <Menu size={18} />
        </button>

        <div className="min-w-0">
          <h1 className="kanzler-display truncate text-[18px] font-bold tracking-[-0.02em] text-[var(--kanzler-ink)] sm:text-[19px]">
            {title}
          </h1>
          <p className="hidden truncate text-[12.5px] text-[var(--kanzler-muted)] sm:block">{subtitle}</p>
        </div>

        <div className="ml-auto hidden sm:block">
          <GlobalSearch />
        </div>
      </div>

      <div className="mt-3 sm:hidden">
        <GlobalSearch />
      </div>
    </header>
  );
}
