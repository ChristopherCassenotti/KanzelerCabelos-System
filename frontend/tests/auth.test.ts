import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { http } from "../src/services/api/http";
import { rawHttp } from "../src/services/api/raw-http";
import { authStore } from "../src/services/auth/auth-store";
import { logout, refreshSession } from "../src/services/auth/auth.service";
import { queryClient } from "../src/services/api/query-client";

const session = { accessToken: "new-token", usuario: { id: "u", email: "test@example.com" }, expiresIn: 3600 };
function reject(config: InternalAxiosRequestConfig, status: number) {
  throw new AxiosError("HTTP error", undefined, config, undefined, {
    status, data: { error: `Erro ${status}` }, statusText: "error", headers: new AxiosHeaders(), config,
  });
}
beforeEach(() => { authStore.clear(); authStore.setSession("expired-token", session.usuario); });
afterEach(() => { vi.restoreAllMocks(); authStore.clear(); });

describe("sessao e retry HTTP", () => {
  it("deduplica refresh concorrente e envia o novo Bearer", async () => {
    const refresh = vi.spyOn(rawHttp, "post").mockResolvedValue({ data: session });
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      if (config.headers.get("Authorization") !== "Bearer new-token") return reject(config, 401);
      return { data: [], status: 200, statusText: "OK", config, headers: new AxiosHeaders() };
    });
    await Promise.all([http.get("/contatos", { adapter }), http.get("/cidades", { adapter })]);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(adapter).toHaveBeenCalledTimes(4);
  });
  it("nao encerra sessao quando o retry autenticado recebe 500", async () => {
    vi.spyOn(rawHttp, "post").mockResolvedValue({ data: session });
    let calls = 0;
    await expect(http.get("/contatos", { adapter: async (config) => reject(config, ++calls === 1 ? 401 : 500) })).rejects.toMatchObject({ status: 500 });
    expect(authStore.getSnapshot().accessToken).toBe("new-token");
  });
  it("refresh invalido limpa sessao e dados privados do cache", async () => {
    queryClient.setQueryData(["contacts"], [{ nome: "private" }]);
    vi.spyOn(rawHttp, "post").mockRejectedValue(new Error("expired"));
    await expect(refreshSession()).rejects.toThrow();
    expect(authStore.getSnapshot().accessToken).toBeNull();
    expect(queryClient.getQueryData(["contacts"])).toBeUndefined();
  });
  it("um refresh pendente nao reabre a sessao depois do logout", async () => {
    let resolve!: (value: { data: typeof session }) => void;
    vi.spyOn(rawHttp, "post").mockImplementation((url) => url === "/auth/refresh"
      ? new Promise((done) => { resolve = done; })
      : Promise.resolve({ data: null }));
    const pending = refreshSession();
    const result = pending.catch(() => null);
    await logout();
    resolve({ data: session });
    await result;
    expect(authStore.getSnapshot().accessToken).toBeNull();
  });
});
