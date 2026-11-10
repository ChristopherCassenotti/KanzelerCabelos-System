import { describe, expect, it, vi } from "vitest";

const post = vi.fn();

vi.mock("../src/services/api/http", () => ({ http: { post } }));

const { confirmAssistantContact, sendAssistantMessage } = await import("../src/services/assistant/assistant.service");

describe("assistant.service", () => {
  it("usa o cliente HTTP autenticado nos endpoints do assistente", async () => {
    post.mockResolvedValueOnce({ data: { resposta: "ok" } });
    post.mockResolvedValueOnce({ data: { contato: { id: "1" }, reaproveitado: false } });

    const payload = { mensagem: "oi", historico: [], rascunho: null };
    await expect(sendAssistantMessage(payload)).resolves.toEqual({ resposta: "ok" });

    const confirmPayload = {
      idempotencyKey: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      rascunho: {} as never,
      ignorarDuplicidade: false,
    };
    await expect(confirmAssistantContact(confirmPayload)).resolves.toMatchObject({ contato: { id: "1" } });

    expect(post).toHaveBeenNthCalledWith(1, "/assistente/mensagem", payload, expect.any(Object));
    expect(post).toHaveBeenNthCalledWith(2, "/assistente/confirmar-contato", confirmPayload, expect.any(Object));
  });
});
