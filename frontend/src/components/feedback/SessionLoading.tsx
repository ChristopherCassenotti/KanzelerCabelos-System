import { useAuth } from "../../contexts/AuthContext";

export function SessionLoading() {
  const { isReconnecting, retrySessionNow } = useAuth();

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--kanzler-canvas)] px-6">
      <div className="flex flex-col items-center gap-4 text-center" role="status" aria-live="polite">
        <span
          className="h-9 w-9 animate-spin rounded-full border-[3px] border-[var(--kanzler-blue-soft)] border-t-[var(--kanzler-blue)]"
          aria-hidden="true"
        />
        <div>
          <p className="kanzler-display text-sm font-semibold text-[var(--kanzler-ink)]">
            Kanzler Cabelos
          </p>
          <p className="mt-1 text-xs text-[var(--kanzler-muted)]">
            {isReconnecting
              ? "Sem conexão com o servidor. Sua sessão foi mantida; tentando reconectar..."
              : "Validando sua sessão..."}
          </p>
        </div>
        {isReconnecting && (
          <button
            type="button"
            onClick={retrySessionNow}
            className="rounded-[10px] border border-[var(--kanzler-line)] bg-white px-3.5 py-2 text-[13px] font-semibold text-[var(--kanzler-ink)] transition hover:bg-[var(--kanzler-canvas)]"
          >
            Tentar agora
          </button>
        )}
      </div>
    </main>
  );
}
