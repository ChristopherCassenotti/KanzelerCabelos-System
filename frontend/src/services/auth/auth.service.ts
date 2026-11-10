import { ApiError, normalizeApiError } from "../api/errors";
import { queryClient } from "../api/query-client";
import { rawHttp } from "../api/raw-http";
import type { AuthSessionResponse, LoginPayload } from "../../types/auth";
import { authStore } from "./auth-store";

/**
 * Sessão persistente:
 * - o refresh token fica só no cookie HttpOnly (validade deslizante no backend);
 * - o access token fica em memória e é renovado antes de expirar;
 * - a sessão local só é descartada em logout ou quando o backend recusa a
 *   sessão de forma definitiva (401). Falhas temporárias (rede, 5xx) não
 *   deslogam: a renovação é tentada de novo.
 */

let refreshInFlight: Promise<AuthSessionResponse> | null = null;

// Incrementado no logout: respostas de refresh iniciadas antes dele são descartadas.
let sessionEpoch = 0;

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let accessTokenExpiresAt: number | null = null;

/** Renova com esta antecedência antes de o access token expirar. */
const REFRESH_MARGIN_MS = 2 * 60 * 1000;
const TRANSIENT_RETRY_MS = 30 * 1000;
const LOCK_NAME = "kanzler-auth-refresh";

type AuthBroadcast = { type: "logout" } | { type: "login" };

const channel: BroadcastChannel | null =
  typeof BroadcastChannel === "function" ? new BroadcastChannel("kanzler-auth") : null;

// Em Node (testes) o canal manteria o processo vivo.
(channel as unknown as { unref?: () => void } | null)?.unref?.();

export function isTransientAuthError(error: unknown) {
  return error instanceof ApiError && error.transient;
}

function clearRefreshTimer() {
  if (refreshTimer !== null) clearTimeout(refreshTimer);
  refreshTimer = null;
}

function scheduleRefresh(delayMs: number) {
  clearRefreshTimer();
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    void refreshSession().catch((error) => {
      if (isTransientAuthError(error) && authStore.getSnapshot().accessToken) {
        scheduleRefresh(TRANSIENT_RETRY_MS);
      }
    });
  }, Math.max(delayMs, 1_000));
}

function aplicarSessao(sessao: AuthSessionResponse) {
  authStore.setSession(sessao.accessToken, sessao.usuario);

  const lifetimeMs = Math.max(sessao.expiresIn, 0) * 1000;
  accessTokenExpiresAt = Date.now() + lifetimeMs;
  scheduleRefresh(lifetimeMs - REFRESH_MARGIN_MS);

  return sessao;
}

function encerrarSessaoLocal() {
  clearRefreshTimer();
  accessTokenExpiresAt = null;
  authStore.clear();
  queryClient.clear();
}

/** O access token em memória já expirou ou está perto disso. */
export function isAccessTokenStale(now = Date.now()) {
  return accessTokenExpiresAt === null || accessTokenExpiresAt - now <= REFRESH_MARGIN_MS;
}

/** Serializa renovações entre abas: o refresh token do Supabase é rotativo. */
function withCrossTabLock<T>(task: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  return locks?.request ? (locks.request(LOCK_NAME, task) as Promise<T>) : task();
}

export async function login(payload: LoginPayload) {
  try {
    const { data } = await rawHttp.post<AuthSessionResponse>("/auth/login", payload);
    sessionEpoch += 1;
    const sessao = aplicarSessao(data);
    channel?.postMessage({ type: "login" } satisfies AuthBroadcast);
    return sessao;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export function refreshSession() {
  if (refreshInFlight) return refreshInFlight;

  const epoch = sessionEpoch;

  const promise = withCrossTabLock(async () => {
    try {
      const { data } = await rawHttp.post<AuthSessionResponse>("/auth/refresh");

      if (epoch !== sessionEpoch) {
        throw new ApiError("Sessão encerrada", 401);
      }

      return aplicarSessao(data);
    } catch (error) {
      const normalized = normalizeApiError(error);

      // Falha temporária mantém a sessão; só a recusa definitiva limpa.
      // Também não limpa se outra sessão começou enquanto o refresh rodava.
      if (!normalized.transient && epoch === sessionEpoch) encerrarSessaoLocal();

      throw normalized;
    }
  }).finally(() => {
    if (refreshInFlight === promise) refreshInFlight = null;
  });

  refreshInFlight = promise;
  return promise;
}

export async function logout() {
  sessionEpoch += 1;
  refreshInFlight = null;
  clearRefreshTimer();

  try {
    await rawHttp.post("/auth/logout");
  } catch (error) {
    const normalized = normalizeApiError(error);

    if (normalized.status !== 401) {
      throw normalized;
    }
  } finally {
    encerrarSessaoLocal();
    channel?.postMessage({ type: "logout" } satisfies AuthBroadcast);
  }
}

// Mantém as abas abertas coerentes com login/logout feitos em outra aba.
channel?.addEventListener("message", (event: MessageEvent<AuthBroadcast>) => {
  if (event.data?.type === "logout") {
    sessionEpoch += 1;
    refreshInFlight = null;
    encerrarSessaoLocal();
  } else if (event.data?.type === "login" && !authStore.getSnapshot().accessToken) {
    void refreshSession().catch(() => undefined);
  }
});
