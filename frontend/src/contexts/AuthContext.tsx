import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react";
import { queryClient } from "../services/api/query-client";
import { authStore } from "../services/auth/auth-store";
import {
  isAccessTokenStale,
  isTransientAuthError,
  login as loginRequest,
  logout as logoutRequest,
  refreshSession,
} from "../services/auth/auth.service";
import type { LoginPayload } from "../types/auth";

interface AuthContextValue {
  usuario: ReturnType<typeof authStore.getSnapshot>["usuario"];
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  /** Restauração da sessão aguardando o servidor voltar (não é logout). */
  isReconnecting: boolean;
  retrySessionNow: () => void;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const snapshot = useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getSnapshot,
  );

  const [isInitializing, setIsInitializing] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const retryNowRef = useRef<(() => void) | null>(null);

  // Restaura a sessão a partir do cookie HttpOnly. Só desiste (tela de login)
  // quando o backend recusa a sessão; falhas temporárias são repetidas.
  useEffect(() => {
    let active = true;

    async function restore() {
      for (let attempt = 0; active; attempt += 1) {
        try {
          await refreshSession();
          break;
        } catch (error) {
          if (!isTransientAuthError(error)) break;
          if (!active) return;

          setIsReconnecting(true);
          await new Promise<void>((resolve) => {
            const timer = window.setTimeout(resolve, Math.min(1_000 * 2 ** attempt, 15_000));
            retryNowRef.current = () => {
              window.clearTimeout(timer);
              resolve();
            };
          });
          retryNowRef.current = null;
        }
      }

      if (active) {
        setIsReconnecting(false);
        setIsInitializing(false);
      }
    }

    void restore();

    return () => {
      active = false;
      retryNowRef.current?.();
    };
  }, []);

  // Ao voltar para a aba ou recuperar a conexão, renova o token se ele
  // expirou enquanto o navegador estava em segundo plano/suspenso.
  useEffect(() => {
    function renewIfStale() {
      if (document.visibilityState !== "visible") return;
      if (!authStore.getSnapshot().accessToken || !isAccessTokenStale()) return;
      void refreshSession().catch(() => undefined);
    }

    document.addEventListener("visibilitychange", renewIfStale);
    window.addEventListener("online", renewIfStale);
    window.addEventListener("focus", renewIfStale);

    return () => {
      document.removeEventListener("visibilitychange", renewIfStale);
      window.removeEventListener("online", renewIfStale);
      window.removeEventListener("focus", renewIfStale);
    };
  }, []);

  const retrySessionNow = useCallback(() => retryNowRef.current?.(), []);

  const login = useCallback(async (payload: LoginPayload) => {
    await loginRequest(payload);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Mesmo sem resposta do backend, a sessão local deve ser encerrada.
    } finally {
      authStore.clear();
      queryClient.clear();
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario: snapshot.usuario,
      accessToken: snapshot.accessToken,
      isAuthenticated: Boolean(snapshot.usuario && snapshot.accessToken),
      isInitializing,
      isReconnecting,
      retrySessionNow,
      login,
      logout,
    }),
    [snapshot, isInitializing, isReconnecting, retrySessionNow, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return context;
}
