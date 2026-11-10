import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import Fastify from "fastify";
import { supabase } from "../config/supabase";
import { AuthService } from "../services/auth.service";
import { StorageService } from "../services/storage.service";
import { FotoService } from "../services/foto.service";
import { ContatoService } from "../services/contato.service";
import { FotoController } from "../controllers/foto.controller";
import type { ContatoRepository } from "../repositories/contato.repository";
import type { FotoRepository } from "../repositories/foto.repository";
import type { CompraRepository } from "../repositories/compra.repository";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function mockStorageHttp() {
  const calls: { path: string; headers: Headers }[] = [];
  const objects = new Set<string>();
  let failSigning = false;
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const path = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url).pathname;
    calls.push({ path, headers: new Headers(init?.headers) });
    const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
      status, headers: { "Content-Type": "application/json" },
    });
    if (path.endsWith("/auth/v1/token")) {
      return json({ access_token: "user-access-token", refresh_token: "user-refresh-token",
        expires_in: 3600, token_type: "bearer", user: { id: "user-1", email: "test@example.com" } });
    }
    if (path.includes("/object/sign/contatos-fotos/")) {
      const object = path.split("/object/sign/contatos-fotos/")[1]!;
      if (failSigning || !objects.has(object)) return json({ message: "Object not found", statusCode: "404" }, 400);
      return json({ signedURL: `/object/sign/contatos-fotos/${object}?token=example` });
    }
    if (path.includes("/object/contatos-fotos/")) {
      const object = path.split("/object/contatos-fotos/")[1]!;
      objects.add(object);
      return json({ Key: `contatos-fotos/${object}`, Id: "object-id" });
    }
    throw new Error(`Unexpected test request: ${path}`);
  }));
  return { calls, objects, fail: () => { failSigning = true; } };
}

describe("regressao de fotos e isolamento da autenticacao", () => {
  it("reproduz a substituicao de headers no antigo cliente compartilhado", async () => {
    const http = mockStorageHttp();
    const shared = createClient("https://example.supabase.co", "sb_secret_test", {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await shared.auth.signInWithPassword({ email: "test@example.com", password: "test" });
    await shared.storage.from("contatos-fotos").upload("contact/photo.webp", Buffer.from("test"));
    expect(http.calls.at(-1)?.headers.get("Authorization")).toBe("Bearer user-access-token");
    expect(http.calls.at(-1)?.headers.get("apikey")).toBe("sb_secret_test");
  });

  it("preserva a chave administrativa apos login e refresh", async () => {
    const http = mockStorageHttp();
    const auth = new AuthService();
    const storage = new StorageService();
    expect((await auth.login("test@example.com", "test"))?.accessToken).toBe("user-access-token");
    const uploaded = await storage.uploadImage({ contatoId: "contact", buffer: Buffer.from("test"), mimetype: "image/webp", extension: "webp" });
    await auth.refresh("user-refresh-token");
    expect(await storage.createSignedUrl(uploaded.path)).toContain(uploaded.path);
    const storageCalls = http.calls.filter((call) => call.path.startsWith("/storage/"));
    expect(storageCalls).toHaveLength(2);
    for (const call of storageCalls) {
      expect(call.headers.get("apikey")).toBe(process.env["SUPABASE_SECRET_KEY"]);
      expect(call.headers.get("Authorization")).not.toBe("Bearer user-access-token");
    }
    expect(() => supabase.auth.signInWithPassword).toThrow(/accessToken/);
  });

  it("mantem o caminho persistido em novas consultas e responde 500 quando a assinatura falha", async () => {
    const http = mockStorageHttp();
    const rows: { id: string; contatoId: string; url: string }[] = [];
    const contato = { findById: vi.fn().mockResolvedValue({ id: "contact", autorizouFoto: true }) } as unknown as ContatoRepository;
    const fotos = {
      create: vi.fn(async (data) => { const row = { ...data, id: "photo" }; rows.push(row); return row; }),
      findByContatoId: vi.fn(async () => rows),
    } as unknown as FotoRepository;
    const service = new FotoService(contato, fotos, new StorageService());
    await service.upload({ contatoId: "contact", buffer: Buffer.from("test"), mimetype: "image/webp" });
    expect(http.objects.has(rows[0]!.url)).toBe(true);
    const app = Fastify();
    const controller = new FotoController(new FotoService(contato, fotos, new StorageService()));
    app.get<{ Params: { contatoId: string } }>("/contatos/:contatoId/fotos", (req, reply) => controller.index(req, reply));
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        const response = await app.inject("/contatos/contact/fotos");
        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual([expect.objectContaining({ url: rows[0]!.url, signedUrl: expect.stringContaining(rows[0]!.url) })]);
      }
      http.fail();
      vi.spyOn(console, "error").mockImplementation(() => {});
      const response = await app.inject("/contatos/contact/fotos");
      expect(response.statusCode).toBe(500);
      expect(response.json()).not.toEqual([]);
      const detail = new ContatoService(contato, fotos, {
        findByContatoId: vi.fn().mockResolvedValue([]),
      } as unknown as CompraRepository, new StorageService());
      await expect(detail.findById("contact")).rejects.toThrow("Erro ao gerar URL da foto");
      expect(rows).toHaveLength(1);
      expect(http.objects.size).toBe(1);
    } finally {
      await app.close();
    }
  });
});
