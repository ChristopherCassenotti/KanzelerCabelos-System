export const DEFAULT_PRIVATE_ROUTE = "/painel";

export interface LoginRedirectState {
  from?: string;
}

/**
 * Destino após o login, vindo da rota privada que exigiu autenticação.
 * Aceita só caminhos internos (evita redirecionamento aberto) e nunca /login.
 */
export function resolvePostLoginTarget(state: unknown): string | null {
  const from = (state as LoginRedirectState | null)?.from;

  if (typeof from !== "string" || !from.startsWith("/") || from.startsWith("//")) return null;
  if (from === "/login" || from.startsWith("/login?") || from.startsWith("/login#")) return null;

  return from;
}

export function buildLoginRedirectState(location: { pathname: string; search: string; hash: string }): LoginRedirectState {
  return { from: `${location.pathname}${location.search}${location.hash}` };
}
