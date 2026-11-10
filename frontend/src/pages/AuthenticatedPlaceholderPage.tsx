import { LogOut, Scissors } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export function AuthenticatedPlaceholderPage() {
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

  return (
    <main className="min-h-screen bg-[var(--kanzler-canvas)] p-6 md:p-10">
      <section className="mx-auto max-w-5xl rounded-[var(--kanzler-radius)] border border-[var(--kanzler-line)] bg-white p-7 shadow-[var(--kanzler-shadow)] md:p-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--kanzler-blue)] text-white">
              <Scissors size={20} />
            </div>
            <div>
              <p className="kanzler-display font-bold text-[var(--kanzler-navy)]">Kanzler Cabelos</p>
              <p className="text-xs text-[var(--kanzler-muted)]">Sessão autenticada</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-[var(--kanzler-line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--kanzler-ink)] transition hover:bg-[var(--kanzler-canvas)] disabled:opacity-60"
          >
            <LogOut size={16} />
            {isLoggingOut ? "Saindo..." : "Sair"}
          </button>
        </div>

        <div className="mt-10 rounded-[var(--kanzler-radius)] bg-[var(--kanzler-blue-soft)] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--kanzler-blue)]">Etapa 2 concluída</p>
          <h1 className="kanzler-display mt-2 text-2xl font-bold tracking-[-0.025em] text-[var(--kanzler-navy)]">
            Autenticação pronta para integrar o layout principal
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--kanzler-muted)]">
            Usuário conectado: <strong className="text-[var(--kanzler-ink)]">{usuario?.email || usuario?.id}</strong>. Access token em memória, refresh por cookie HttpOnly, retry automático em 401 e logout já estão ativos.
          </p>
        </div>
      </section>
    </main>
  );
}
