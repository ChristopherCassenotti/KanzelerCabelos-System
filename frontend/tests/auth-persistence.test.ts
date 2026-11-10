import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildLoginRedirectState, resolvePostLoginTarget } from "../src/components/auth/redirect";
import { ApiError, normalizeApiError } from "../src/services/api/errors";
import { http } from "../src/services/api/http";
import { queryClient } from "../src/services/api/query-client";
import { rawHttp } from "../src/services/api/raw-http";
import { authStore } from "../src/services/auth/auth-store";
import { isAccessTokenStale, isTransientAuthError, logout, refreshSession } from "../src/services/auth/auth.service";

const session = { accessToken: "new-token", usuario: { id: "u", email: "test@example.com" }, expiresIn: 3600 };

function httpError(config: InternalAxiosRequestConfig, status: number) {
  return new AxiosError("HTTP error", undefined, config, undefined, {
    status,
    data: { error: `Erro ${status}` },
    statusText: "error",
    headers: new AxiosHeaders(),
    config,
  });
}

function networkError() {
  return new AxiosError("Network Error", "ERR_NETWORK", { headers: new AxiosHeaders() } as InternalAxiosRequestConfig);
}

beforeEach(() => {
  authStore.clear();
  authStore.setSession("expired-token", session.usuario);
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.spyOn(rawHttp, "post").mockResolvedValue({ data: null });
  await logout();
  vi.restoreAllMocks();
});

describe("classificação de erros", () => {
  it("rede, timeout, 5xx e 429 são temporários; 401/400 não", () => {
    expect(normalizeApiError(networkError()).transient).toBe(true);
    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
    expect(normalizeApiError(httpError(config, 503)).transient).toBe(true);
    expect(normalizeApiError(httpError(config, 429)).transient).toBe(true);
    expect(normalizeApiError(httpError(config, 401)).transient).toBe(false);
    expect(normalizeApiError(httpError(config, 400)).transient).toBe(false);
    expect(isTransientAuthError(new ApiError("x", 401))).toBe(false);
  });
});

describe("sessão persistente", () => {
  it("servidor fora do ar no refresh NÃO desloga e não apaga o cache", async () => {
    queryClient.setQueryData(["contacts"], [{ nome: "private" }]);
    vi.spyOn(rawHttp, "post").mockRejectedValue(networkError());

    const error = await refreshSession().catch((e: unknown) => e);

    expect(isTransientAuthError(error)).toBe(true);
    expect(authStore.getSnapshot().accessToken).toBe("expired-token");
    expect(queryClient.getQueryData(["contacts"])).toEqual([{ nome: "private" }]);
  });

  it("503 do backend no refresh também mantém a sessão", async () => {
    vi.spyOn(rawHttp, "post").mockImplementation(async (url) => {
      throw httpError({ url, headers: new AxiosHeaders() } as InternalAxiosRequestConfig, 503);
    });

    await expect(refreshSession()).rejects.toMatchObject({ status: 503, transient: true });
    expect(authStore.getSnapshot().accessToken).toBe("expired-token");
  });

  it("401 de requisição + refresh indisponível: erro para a tela, usuário segue logado", async () => {
    vi.spyOn(rawHttp, "post").mockRejectedValue(networkError());

    await expect(
      http.get("/contatos", { adapter: async (config) => Promise.reject(httpError(config, 401)) }),
    ).rejects.toMatchObject({ transient: true });
    expect(authStore.getSnapshot().accessToken).toBe("expired-token");
  });

  it("refresh recusado (401) é o único caso que desloga", async () => {
    vi.spyOn(rawHttp, "post").mockImplementation(async (url) => {
      throw httpError({ url, headers: new AxiosHeaders() } as InternalAxiosRequestConfig, 401);
    });

    await expect(refreshSession()).rejects.toMatchObject({ status: 401 });
    expect(authStore.getSnapshot().accessToken).toBeNull();
  });

  it("renova o token automaticamente antes de expirar", async () => {
    vi.useFakeTimers();
    const post = vi
      .spyOn(rawHttp, "post")
      .mockResolvedValueOnce({ data: { ...session, accessToken: "token-1", expiresIn: 600 } })
      .mockResolvedValueOnce({ data: { ...session, accessToken: "token-2", expiresIn: 600 } });

    await refreshSession();
    expect(authStore.getSnapshot().accessToken).toBe("token-1");
    expect(isAccessTokenStale()).toBe(false);

    // 600 s de validade, renovação 2 min antes: aos 480 s.
    await vi.advanceTimersByTimeAsync(479_000);
    expect(post).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(post).toHaveBeenCalledTimes(2);
    expect(authStore.getSnapshot().accessToken).toBe("token-2");
  });

  it("falha temporária na renovação automática tenta de novo sem deslogar", async () => {
    vi.useFakeTimers();
    const post = vi
      .spyOn(rawHttp, "post")
      .mockResolvedValueOnce({ data: { ...session, accessToken: "token-1", expiresIn: 180 } })
      .mockRejectedValueOnce(networkError())
      .mockResolvedValueOnce({ data: { ...session, accessToken: "token-3", expiresIn: 3600 } });

    await refreshSession();
    await vi.advanceTimersByTimeAsync(61_000); // renovação aos 60 s falha
    expect(authStore.getSnapshot().accessToken).toBe("token-1");
    await vi.advanceTimersByTimeAsync(31_000); // nova tentativa 30 s depois
    expect(post).toHaveBeenCalledTimes(3);
    expect(authStore.getSnapshot().accessToken).toBe("token-3");
  });

  it("logout manual encerra a sessão e cancela a renovação automática", async () => {
    vi.useFakeTimers();
    const post = vi.spyOn(rawHttp, "post").mockResolvedValue({ data: { ...session, expiresIn: 600 } });

    await refreshSession();
    post.mockClear();
    await logout();

    expect(authStore.getSnapshot().accessToken).toBeNull();
    expect(post).toHaveBeenCalledWith("/auth/logout");
    await vi.advanceTimersByTimeAsync(3_600_000);
    expect(post).toHaveBeenCalledTimes(1);
  });
});

describe("redirecionamento de rotas", () => {
  it("preserva caminho, query e hash da rota privada", () => {
    const state = buildLoginRedirectState({ pathname: "/contatos", search: "?contato=abc&compra=1", hash: "#fotos" });
    expect(resolvePostLoginTarget(state)).toBe("/contatos?contato=abc&compra=1#fotos");
  });

  it("ignora destinos externos ou o próprio login", () => {
    expect(resolvePostLoginTarget({ from: "https://evil.com" })).toBeNull();
    expect(resolvePostLoginTarget({ from: "//evil.com/x" })).toBeNull();
    expect(resolvePostLoginTarget({ from: "/login" })).toBeNull();
    expect(resolvePostLoginTarget({ from: "/login?x=1" })).toBeNull();
    expect(resolvePostLoginTarget(null)).toBeNull();
    expect(resolvePostLoginTarget({ from: "/agenda?data=2026-10-24" })).toBe("/agenda?data=2026-10-24");
  });
});
