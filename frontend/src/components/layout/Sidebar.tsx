import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Map,
  Plus,
  Scissors,
  Sparkles,
  Truck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getTomorrowInSaoPauloISO } from "../../utils/date";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navigation = [
  { to: "/painel", label: "Painel", icon: LayoutDashboard },
  { to: "/contatos", label: "Contatos", icon: UsersRound },
  { to: "/agenda", label: "Agenda e rotas", icon: CalendarDays },
  { to: "/mapa", label: "Mapa", icon: Map },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/assistente", label: "Assistente IA", icon: Sparkles },
];

function navClass({ isActive }: { isActive: boolean }) {
  return [
    "flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] font-medium transition",
    isActive
      ? "bg-[var(--kanzler-blue)] text-white"
      : "text-[#b9c4d6] hover:bg-[var(--kanzler-navy-2)] hover:text-white",
  ].join(" ");
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  }

  function goToNewContact() {
    onClose();
    navigate("/contatos?novo=1");
  }

  function goToTomorrowRoute() {
    onClose();
    navigate(`/agenda?data=${getTomorrowInSaoPauloISO()}`);
  }

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-[1035] bg-[rgba(14,26,43,0.48)] backdrop-blur-[1px] min-[821px]:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-[1040] flex w-[244px] flex-col bg-[var(--kanzler-navy)] text-white shadow-2xl transition-transform duration-200 min-[821px]:translate-x-0 min-[821px]:shadow-none",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        aria-label="Navegação principal"
      >
        <div className="border-b border-white/[0.08] px-[22px] pb-[18px] pt-[22px]">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-[var(--kanzler-blue)] to-[#5b8cff] text-white">
              <Scissors size={18} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="kanzler-display truncate text-[16px] font-bold leading-none">Kanzler Cabelos</p>
              <p className="mt-1 text-[11px] tracking-[0.03em] text-[var(--kanzler-muted-2)]">Gestão de Compra</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white min-[821px]:hidden"
              aria-label="Fechar menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3.5">
          <p className="px-3 pb-1.5 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#5e6e85]">
            Operação
          </p>

          <div className="space-y-0.5">
            {navigation.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={navClass} onClick={onClose}>
                <Icon size={17} className="shrink-0 opacity-80" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>

          <p className="px-3 pb-1.5 pt-5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#5e6e85]">
            Atalhos
          </p>

          <div className="space-y-0.5">
            <button
              type="button"
              onClick={goToNewContact}
              className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[13.5px] font-medium text-[#b9c4d6] transition hover:bg-[var(--kanzler-navy-2)] hover:text-white"
            >
              <Plus size={17} className="opacity-80" />
              Nova compra
            </button>

            <button
              type="button"
              onClick={goToTomorrowRoute}
              className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[13.5px] font-medium text-[#b9c4d6] transition hover:bg-[var(--kanzler-navy-2)] hover:text-white"
            >
              <Truck size={17} className="opacity-80" />
              Rota de amanhã
            </button>
          </div>
        </nav>

        <div className="border-t border-white/[0.08] px-4 py-4">
          <div className="flex items-center gap-2.5 rounded-[10px] bg-white/[0.04] px-2.5 py-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.08] text-[#9fb0c8]">
              <UserRound size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-[#aebbd0]">Sessão ativa</p>
              <p className="truncate text-[10px] text-[#66758c]">{usuario?.email || usuario?.id}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-medium text-[#7f8fa7] transition hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
          >
            <LogOut size={14} />
            {isLoggingOut ? "Saindo..." : "Sair do sistema"}
          </button>
        </div>
      </aside>
    </>
  );
}
