import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import type { AssistantContactDraft, AssistantMessageResponse } from "../src/types/assistant";
import {
  CONTACT_CREATED_QUERY_KEYS,
  buildHistory,
  canSendMessage,
  chatReducer,
  createInitialChatState,
  describeConfirmError,
  describeMessageError,
  draftSummaryRows,
  extractDuplicates,
  getContactProfilePath,
  invalidateAfterContactCreated,
  isDraftReady,
  type ChatState,
} from "../src/utils/assistant-chat";

const CONTACT_ID = "99999999-9999-4999-8999-999999999999";

function draft(overrides: Partial<AssistantContactDraft> = {}): AssistantContactDraft {
  return {
    nome: "Juliana Ferreira",
    telefone: "42999998888",
    cidadeId: "11111111-1111-4111-8111-111111111111",
    cidadeNome: "União da Vitória",
    cidadeUf: "PR",
    endereco: null,
    origem: "Indicação",
    indicadoPor: "Ana",
    dataPrimeiroContato: null,
    dataAvaliacao: null,
    natural: true,
    cor: "Castanho",
    textura: null,
    quimica: null,
    comprimentoCm: 60,
    observacoes: null,
    autorizouFoto: false,
    dataCorte: null,
    pesoG: 420,
    valorPago: "1850.00",
    formaPagamento: "Pix",
    valorRevenda: null,
    dataRevenda: null,
    comprador: null,
    ...overrides,
  };
}

function response(overrides: Partial<AssistantMessageResponse> = {}): AssistantMessageResponse {
  return {
    resposta: "Confira os dados abaixo. Posso cadastrar?",
    estado: "aguardando_confirmacao",
    rascunho: draft(),
    pendencias: [],
    cidadeOpcoes: [],
    possiveisDuplicados: [],
    avisos: [],
    ...overrides,
  };
}

function readyState(): ChatState {
  let state = createInitialChatState("m0");
  state = chatReducer(state, { type: "message_started", id: "m1", userText: "Cadastre a Juliana", attachments: [] });
  state = chatReducer(state, { type: "message_succeeded", id: "m2", response: response(), confirmationKey: "key-1" });
  return state;
}

describe("chatReducer", () => {
  it("bloqueia novo envio enquanto há requisição ativa", () => {
    const state = chatReducer(createInitialChatState("m0"), { type: "message_started", id: "m1", userText: "oi", attachments: [] });

    expect(state.status).toBe("sending");
    expect(canSendMessage(state, "outra")).toBe(false);
    expect(canSendMessage({ ...state, status: "idle" }, "   ")).toBe(false);
    expect(canSendMessage({ ...state, status: "idle" }, "a".repeat(2001))).toBe(false);
    expect(canSendMessage({ ...state, status: "idle" }, "ok")).toBe(true);
  });

  it("mostra o card somente com rascunho completo", () => {
    expect(isDraftReady(readyState())).toBe(true);

    const pending = chatReducer(createInitialChatState("m0"), {
      type: "message_succeeded",
      id: "m1",
      response: response({ estado: "coletando_dados", pendencias: ["cidade"], rascunho: draft({ cidadeId: null }) }),
      confirmationKey: "k",
    });

    expect(isDraftReady(pending)).toBe(false);
  });

  it("mantém a chave de idempotência enquanto o rascunho não muda e gera outra quando muda", () => {
    const state = readyState();
    expect(state.confirmationKey).toBe("key-1");

    const same = chatReducer(state, { type: "message_succeeded", id: "m3", response: response(), confirmationKey: "key-2" });
    expect(same.confirmationKey).toBe("key-1");

    const changed = chatReducer(state, {
      type: "message_succeeded",
      id: "m3",
      response: response({ rascunho: draft({ cidadeNome: "Porto União" }) }),
      confirmationKey: "key-2",
    });
    expect(changed.confirmationKey).toBe("key-2");
  });

  it("falha na confirmação não apresenta sucesso e preserva o rascunho para tentar de novo", () => {
    let state = chatReducer(readyState(), { type: "confirm_started" });
    const retryPayload = { idempotencyKey: "key-1", rascunho: draft(), ignorarDuplicidade: false };

    state = chatReducer(state, {
      type: "request_failed",
      id: "e1",
      text: describeConfirmError({ message: "boom", status: 500 }),
      retry: { type: "confirm", payload: retryPayload },
    });

    expect(state.status).toBe("idle");
    expect(state.draft).toEqual(draft());
    expect(state.confirmationKey).toBe("key-1");
    expect(state.messages.some((message) => message.tone === "success")).toBe(false);
    expect(state.messages.at(-1)).toMatchObject({ tone: "error", retry: { type: "confirm", payload: retryPayload } });

    const retrying = chatReducer(state, { type: "confirm_started" });
    expect(retrying.messages.some((message) => message.retry)).toBe(false);
  });

  it("erro da IA mantém conversa e rascunho", () => {
    const state = chatReducer(chatReducer(readyState(), { type: "message_started", id: "u", userText: "x", attachments: [] }), {
      type: "request_failed",
      id: "e",
      text: describeMessageError({ message: "O assistente está indisponível no momento.", status: 502 }),
      retry: null,
    });

    expect(state.draft).toEqual(draft());
    expect(state.messages.at(-1)?.text).toMatch(/indisponível/);
    expect(describeMessageError({ message: "Network Error", status: null })).toMatch(/foram mantidos/);
  });

  it("sucesso limpa o rascunho e guarda o contato criado com ID real", () => {
    const state = chatReducer(chatReducer(readyState(), { type: "confirm_started" }), {
      type: "confirm_succeeded",
      id: "s1",
      result: {
        contato: { id: CONTACT_ID, nome: "Juliana Ferreira", cidade: { id: "c", nome: "União da Vitória", uf: "PR" } },
        reaproveitado: false,
      },
    });

    expect(state.draft).toBeNull();
    expect(state.confirmationKey).toBeNull();
    expect(state.messages.at(-1)).toMatchObject({
      tone: "success",
      text: "Contato e compra cadastrados com sucesso",
      createdContact: { id: CONTACT_ID },
    });
  });

  it("duplicidade detectada no backend exige ação explícita", () => {
    const duplicates = [{ id: "c-1", nome: "Juliana", telefone: null, cidade: null, motivo: "nome_cidade" as const }];
    const error = { message: "Encontrei contatos parecidos", status: 409, details: { possiveisDuplicados: duplicates } };

    expect(extractDuplicates(error)).toEqual(duplicates);
    expect(extractDuplicates({ message: "x", status: 409 })).toBeNull();

    const state = chatReducer(readyState(), { type: "duplicates_detected", id: "d", text: error.message, duplicates });
    expect(state.duplicates).toEqual(duplicates);
    expect(isDraftReady(state)).toBe(true);
  });

  it("editar esconde o card; cancelar descarta o rascunho localmente", () => {
    const editing = chatReducer(readyState(), { type: "edit_requested", id: "e" });
    expect(isDraftReady(editing)).toBe(false);
    expect(editing.draft).not.toBeNull();

    const cancelled = chatReducer(readyState(), { type: "cancel_requested", id: "c" });
    expect(cancelled.draft).toBeNull();
    expect(cancelled.messages.at(-1)?.text).toMatch(/Nada foi salvo/);
  });

  it("nova conversa volta ao estado inicial", () => {
    const state = chatReducer(readyState(), { type: "reset", id: "r" });
    expect(state.draft).toBeNull();
    expect(state.messages).toHaveLength(1);
  });
});

describe("buildHistory", () => {
  it("envia somente mensagens da conversa, limitadas às últimas 10", () => {
    let state = createInitialChatState("m0");

    for (let index = 0; index < 8; index += 1) {
      state = chatReducer(state, { type: "message_started", id: `u${index}`, userText: `msg ${index}`, attachments: [] });
      state = chatReducer(state, {
        type: "message_succeeded",
        id: `a${index}`,
        response: response({ resposta: `resp ${index}` }),
        confirmationKey: "k",
      });
    }

    state = chatReducer(state, { type: "request_failed", id: "err", text: "erro local", retry: null });

    const history = buildHistory(state.messages);
    expect(history).toHaveLength(10);
    expect(history.some((item) => item.texto === "erro local")).toBe(false);
    expect(history.at(-1)).toEqual({ papel: "assistente", texto: "resp 7" });
    expect(history[0]?.papel).toBe("usuario");
  });
});

describe("integração com a aplicação", () => {
  it("invalida os caches de contatos, painel, recompra, relatórios, mapa e agenda", async () => {
    const queryClient = new QueryClient();
    const spy = vi.spyOn(queryClient, "invalidateQueries");

    await invalidateAfterContactCreated(queryClient);

    const keys = spy.mock.calls.map(([filters]) => filters?.queryKey);
    expect(keys).toEqual(CONTACT_CREATED_QUERY_KEYS.map((key) => [...key]));
    expect(keys).toEqual(
      expect.arrayContaining([["contacts"], ["dashboard"], ["repurchases"], ["reports"]]),
    );
  });

  it("Abrir ficha aponta para a rota de contatos com o UUID", () => {
    expect(getContactProfilePath(CONTACT_ID)).toBe(`/contatos?contato=${CONTACT_ID}`);
  });

  it("resumo diferencia natural não informado e mostra fotos desmarcadas", () => {
    const rows = draftSummaryRows(draft({ natural: null }));

    expect(rows.find((row) => row.label === "Natural")).toBeUndefined();
    expect(rows.find((row) => row.label === "Autorizou fotos")?.value).toBe("Não");
    expect(rows.find((row) => row.label === "Comprimento")?.value).toBe("60 cm");
    expect(draftSummaryRows(draft({ natural: false })).find((row) => row.label === "Natural")?.value).toBe("Não");
  });
});
