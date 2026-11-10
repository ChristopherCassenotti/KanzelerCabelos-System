import Fastify from "fastify";
import cookie from "@fastify/cookie";
import { AuthApiError, AuthRetryableFetchError } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthController } from "../controllers/auth.controller";
import {
  AUTH_COOKIE_MAX_AGE_SEGUNDOS,
  lerOpcoesCookieAuth,
  lerOrigensFrontend,
} from "../config/auth-cookie";
import { requireAuth } from "../middlewares/auth.middleware";
import { AuthService, classificarErroAuth } from "../services/auth.service";

const SESSAO = {
  usuario: { id: "u1", email: "a@b.c" },
  accessToken: "access",
  refreshToken: "refresh-novo",
  expiresIn: 3600,
};

async function servidorAuth(authService: Partial<AuthService>) {
  const app = Fastify();
  await app.register(cookie);
  const controller = new AuthController(authService as AuthService, lerOpcoesCookieAuth({}));
  app.post("/auth/login", (req, reply) => controller.login(req, reply));
  app.post("/auth/refresh", (req, reply) => controller.refresh(req, reply));
  app.post("/auth/logout", (req, reply) => controller.logout(req, reply));
  await app.ready();
  return app;
}

function setCookie(headers: Record<string, unknown>) {
  const valor = headers["set-cookie"];
  return Array.isArray(valor) ? valor.join("\n") : String(valor ?? "");
}

describe("classificarErroAuth", () => {
  it("falha de rede/5xx/429 é temporária; recusa do Supabase é definitiva", () => {
    expect(classificarErroAuth(new AuthRetryableFetchError("fetch failed", 0))).toBe("indisponivel");
    expect(classificarErroAuth(new AuthApiError("boom", 500, "unexpected_failure"))).toBe("indisponivel");
    expect(classificarErroAuth(new AuthApiError("slow down", 429, "over_request_rate_limit"))).toBe("indisponivel");
    expect(classificarErroAuth(new AuthApiError("Invalid Refresh Token", 400, "refresh_token_not_found"))).toBe("invalido");
    expect(classificarErroAuth(new AuthApiError("bad jwt", 403, "bad_jwt"))).toBe("invalido");
  });
});

describe("AuthController - sessão persistente", () => {
  it("login grava cookie HttpOnly de longa duração", async () => {
    const app = await servidorAuth({ login: vi.fn().mockResolvedValue(SESSAO) });
    const resposta = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "ana@kanzler.com", senha: "x" },
    });

    const cookieGravado = setCookie(resposta.headers);
    expect(resposta.statusCode).toBe(200);
    expect(cookieGravado).toContain("kanzler_refresh_token=refresh-novo");
    expect(cookieGravado).toContain("HttpOnly");
    expect(cookieGravado).toContain(`Max-Age=${AUTH_COOKIE_MAX_AGE_SEGUNDOS}`);
    expect(AUTH_COOKIE_MAX_AGE_SEGUNDOS).toBe(400 * 24 * 60 * 60);
    expect(resposta.json()).not.toHaveProperty("refreshToken");
    await app.close();
  });

  it("refresh renova o cookie (sessão deslizante)", async () => {
    const app = await servidorAuth({ refresh: vi.fn().mockResolvedValue({ tipo: "sucesso", dados: SESSAO }) });
    const resposta = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      cookies: { kanzler_refresh_token: "refresh-antigo" },
    });

    expect(resposta.statusCode).toBe(200);
    expect(setCookie(resposta.headers)).toContain(`Max-Age=${AUTH_COOKIE_MAX_AGE_SEGUNDOS}`);
    expect(resposta.json()).toMatchObject({ accessToken: "access", expiresIn: 3600 });
    await app.close();
  });

  it("falha temporária no refresh responde 503 e NÃO apaga o cookie", async () => {
    const app = await servidorAuth({ refresh: vi.fn().mockResolvedValue({ tipo: "indisponivel" }) });
    const resposta = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      cookies: { kanzler_refresh_token: "refresh-antigo" },
    });

    expect(resposta.statusCode).toBe(503);
    expect(resposta.headers["set-cookie"]).toBeUndefined();
    expect(resposta.json()).toMatchObject({ code: "auth_indisponivel" });
    await app.close();
  });

  it("sessão recusada responde 401 e apaga o cookie", async () => {
    const app = await servidorAuth({ refresh: vi.fn().mockResolvedValue({ tipo: "invalido" }) });
    const resposta = await app.inject({
      method: "POST",
      url: "/auth/refresh",
      cookies: { kanzler_refresh_token: "revogado" },
    });

    expect(resposta.statusCode).toBe(401);
    expect(setCookie(resposta.headers)).toMatch(/kanzler_refresh_token=;.*Expires=Thu, 01 Jan 1970/);
    await app.close();
  });

  it("logout apaga o cookie", async () => {
    const app = await servidorAuth({});
    const resposta = await app.inject({ method: "POST", url: "/auth/logout" });

    expect(resposta.statusCode).toBe(204);
    expect(setCookie(resposta.headers)).toContain("kanzler_refresh_token=;");
    await app.close();
  });
});

describe("requireAuth", () => {
  afterEach(() => vi.restoreAllMocks());

  async function servidorProtegido() {
    const app = Fastify();
    app.decorateRequest("usuarioId", null);
    app.addHook("preHandler", requireAuth);
    app.get("/privado", async (req) => ({ usuarioId: req.usuarioId }));
    await app.ready();
    return app;
  }

  it("falha temporária do Supabase vira 503, não 401", async () => {
    vi.spyOn(AuthService.prototype, "validarToken").mockResolvedValue({ tipo: "indisponivel" });
    const app = await servidorProtegido();
    const resposta = await app.inject({ method: "GET", url: "/privado", headers: { authorization: "Bearer t" } });

    expect(resposta.statusCode).toBe(503);
    await app.close();
  });

  it("token inválido continua 401 e token válido passa", async () => {
    const validar = vi.spyOn(AuthService.prototype, "validarToken");
    validar.mockResolvedValueOnce({ tipo: "invalido" });
    validar.mockResolvedValueOnce({ tipo: "sucesso", dados: { id: "u1" } });
    const app = await servidorProtegido();

    const invalido = await app.inject({ method: "GET", url: "/privado", headers: { authorization: "Bearer t" } });
    const valido = await app.inject({ method: "GET", url: "/privado", headers: { authorization: "Bearer t" } });

    expect(invalido.statusCode).toBe(401);
    expect(valido.json()).toEqual({ usuarioId: "u1" });
    await app.close();
  });
});

describe("configuração do cookie", () => {
  it("padrão: lax; produção exige HTTPS", () => {
    expect(lerOpcoesCookieAuth({})).toMatchObject({ sameSite: "lax", secure: false, httpOnly: true, path: "/" });
    expect(lerOpcoesCookieAuth({ NODE_ENV: "production" })).toMatchObject({ sameSite: "lax", secure: true });
  });

  it("SameSite=None (front e API em sites diferentes) só com origens explícitas", () => {
    const aviso = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(lerOpcoesCookieAuth({ AUTH_COOKIE_SAMESITE: "none" })).toMatchObject({ sameSite: "lax" });
    expect(aviso).toHaveBeenCalled();
    expect(
      lerOpcoesCookieAuth({ AUTH_COOKIE_SAMESITE: "none", FRONTEND_ORIGINS: "https://app.exemplo.com" }),
    ).toMatchObject({ sameSite: "none", secure: true });
    expect(lerOpcoesCookieAuth({ AUTH_COOKIE_DOMAIN: ".exemplo.com" })).toMatchObject({ domain: ".exemplo.com" });

    aviso.mockRestore();
  });

  it("lê a lista de origens do frontend", () => {
    const original = process.env["FRONTEND_ORIGINS"];
    process.env["FRONTEND_ORIGINS"] = "https://a.com/, https://b.com";
    expect(lerOrigensFrontend()).toEqual(["https://a.com", "https://b.com"]);
    if (original === undefined) delete process.env["FRONTEND_ORIGINS"];
    else process.env["FRONTEND_ORIGINS"] = original;
  });
});
