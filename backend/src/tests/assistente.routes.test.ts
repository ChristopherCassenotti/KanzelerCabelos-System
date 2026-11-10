import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { app } from "../app";
import { AssistenteController } from "../controllers/assistente.controller";
import { assistenteRoutes } from "../routes/assistente.routes";
import { AssistenteError } from "../services/assistente.errors";
import type { AssistenteService } from "../services/assistente.service";

const RASCUNHO = {
  nome: "Juliana Ferreira",
  cidadeId: "11111111-1111-4111-8111-111111111111",
};

describe("Assistente - autenticação", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(["/assistente/mensagem", "/assistente/confirmar-contato"])(
    "%s exige autenticação (401)",
    async (url) => {
      const semToken = await app.inject({
        method: "POST",
        url,
        payload: { mensagem: "oi" },
      });

      expect(semToken.statusCode).toBe(401);

      const tokenMalformado = await app.inject({
        method: "POST",
        url,
        headers: { authorization: "Basic abc" },
        payload: { mensagem: "oi" },
      });

      expect(tokenMalformado.statusCode).toBe(401);
    },
  );
});

describe("Assistente - rotas", () => {
  const processarMensagem = vi.fn();
  const confirmarContato = vi.fn();

  const service = {
    processarMensagem,
    confirmarContato,
  } as unknown as AssistenteService;

  const servidor = Fastify();

  beforeAll(async () => {
    servidor.decorateRequest("usuarioId", null);
    servidor.addHook("preHandler", async (request) => {
      request.usuarioId = "usuario-1";
    });

    await servidor.register(assistenteRoutes, {
      prefix: "/assistente",
      controller: new AssistenteController(service),
    });

    await servidor.ready();
  });

  afterAll(async () => {
    await servidor.close();
  });

  it("rejeita mensagem longa demais sem chamar o serviço", async () => {
    const resposta = await servidor.inject({
      method: "POST",
      url: "/assistente/mensagem",
      payload: { mensagem: "a".repeat(2001) },
    });

    expect(resposta.statusCode).toBe(400);
    expect(processarMensagem).not.toHaveBeenCalled();
  });

  it("rejeita corpo vazio e campos desconhecidos", async () => {
    for (const payload of [{}, { mensagem: "oi", acao: "excluir" }]) {
      const resposta = await servidor.inject({
        method: "POST",
        url: "/assistente/mensagem",
        payload,
      });

      expect(resposta.statusCode).toBe(400);
    }

    expect(processarMensagem).not.toHaveBeenCalled();
  });

  it("rejeita payload acima do limite de tamanho", async () => {
    const resposta = await servidor.inject({
      method: "POST",
      url: "/assistente/mensagem",
      payload: { mensagem: "oi", historico: [{ papel: "usuario", texto: "x".repeat(70_000) }] },
    });

    expect(resposta.statusCode).toBe(413);
  });

  it("encaminha a mensagem do usuário autenticado", async () => {
    processarMensagem.mockResolvedValueOnce({ resposta: "ok", estado: "ajuda" });

    const resposta = await servidor.inject({
      method: "POST",
      url: "/assistente/mensagem",
      payload: { mensagem: "  oi  " },
    });

    expect(resposta.statusCode).toBe(200);
    expect(processarMensagem).toHaveBeenCalledWith("usuario-1", {
      mensagem: "oi",
      historico: [],
      rascunho: null,
    });
  });

  it("confirmação exige chave de idempotência UUID", async () => {
    const resposta = await servidor.inject({
      method: "POST",
      url: "/assistente/confirmar-contato",
      payload: { idempotencyKey: "123", rascunho: RASCUNHO },
    });

    expect(resposta.statusCode).toBe(400);
    expect(confirmarContato).not.toHaveBeenCalled();
  });

  it("confirmação retorna 201 com o ID real e 200 quando reaproveitada", async () => {
    const criado = {
      contato: { id: "99999999-9999-4999-8999-999999999999", nome: "Juliana Ferreira", cidade: {} },
      reaproveitado: false,
    };

    confirmarContato
      .mockResolvedValueOnce(criado)
      .mockResolvedValueOnce({ ...criado, reaproveitado: true });

    const payload = {
      idempotencyKey: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      rascunho: RASCUNHO,
    };

    const primeira = await servidor.inject({ method: "POST", url: "/assistente/confirmar-contato", payload });
    const segunda = await servidor.inject({ method: "POST", url: "/assistente/confirmar-contato", payload });

    expect(primeira.statusCode).toBe(201);
    expect(primeira.json().contato.id).toBe(criado.contato.id);
    expect(segunda.statusCode).toBe(200);
  });

  it("mapeia erros do assistente para status e mensagens seguras", async () => {
    processarMensagem.mockRejectedValueOnce(
      new AssistenteError("limite_excedido", "Muitas mensagens", 429, { retryAfterSegundos: 30 }),
    );

    const limite = await servidor.inject({
      method: "POST",
      url: "/assistente/mensagem",
      payload: { mensagem: "oi" },
    });

    expect(limite.statusCode).toBe(429);
    expect(limite.headers["retry-after"]).toBe("30");
    expect(limite.json()).toMatchObject({ code: "limite_excedido" });

    processarMensagem.mockRejectedValueOnce(new Error("detalhe interno sk-secret"));

    const inesperado = await servidor.inject({
      method: "POST",
      url: "/assistente/mensagem",
      payload: { mensagem: "oi" },
    });

    expect(inesperado.statusCode).toBe(500);
    expect(inesperado.body).not.toContain("sk-secret");
  });
});
