import { describe, expect, it } from "vitest";
import type { AssistantContactDraft, AssistantMessageResponse, AssistantPhoto } from "../src/types/assistant";
import {
  ASSISTANT_MAX_PHOTO_SIZE,
  canSendMessage,
  chatReducer,
  createInitialChatState,
  describePhotoUpload,
  draftSummaryRows,
  isDraftReady,
  pendingUploads,
  validatePhotoSelection,
  type ChatState,
} from "../src/utils/assistant-chat";

function draft(overrides: Partial<AssistantContactDraft> = {}): AssistantContactDraft {
  return {
    nome: "Juliana Ferreira",
    telefone: null,
    cidadeId: "11111111-1111-4111-8111-111111111111",
    cidadeNome: "União da Vitória",
    cidadeUf: "PR",
    endereco: null,
    origem: null,
    indicadoPor: null,
    dataPrimeiroContato: null,
    dataAvaliacao: null,
    natural: null,
    cor: null,
    textura: null,
    quimica: null,
    comprimentoCm: null,
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

function photo(id: string): AssistantPhoto {
  return { id, file: new File(["x"], `${id}.jpg`, { type: "image/jpeg" }), previewUrl: `blob:${id}`, status: "pending" };
}

function file(type: string, size = 10) {
  return new File([new Uint8Array(size)], "foto", { type });
}

/** Primeira mensagem já com texto + fotos, como o usuário pediu. */
function sentWithPhotos(photos: AssistantPhoto[]): ChatState {
  let state = createInitialChatState("w");
  state = chatReducer(state, {
    type: "message_started",
    id: "u1",
    userText: "Cadastre a Juliana Ferreira de União da Vitória",
    attachments: photos,
  });
  return chatReducer(state, { type: "message_succeeded", id: "a1", response: response(), confirmationKey: "k1" });
}

describe("fotos junto com a mensagem", () => {
  it("texto e fotos vão na mesma mensagem e ficam no cadastro em andamento", () => {
    let state = createInitialChatState("w");
    state = chatReducer(state, {
      type: "message_started",
      id: "u1",
      userText: "Cadastre a Juliana",
      attachments: [photo("p1"), photo("p2")],
    });

    const user = state.messages.at(-1);
    expect(user).toMatchObject({ role: "user", text: "Cadastre a Juliana" });
    expect(user?.attachments?.map((item) => item.id)).toEqual(["p1", "p2"]);
    expect(state.photos).toHaveLength(2);

    state = chatReducer(state, { type: "message_succeeded", id: "a1", response: response(), confirmationKey: "k1" });
    expect(isDraftReady(state)).toBe(true);
    expect(state.photos).toHaveLength(2);
  });

  it("erro da IA não perde as fotos anexadas", () => {
    let state = chatReducer(createInitialChatState("w"), {
      type: "message_started",
      id: "u1",
      userText: "Cadastre a Juliana",
      attachments: [photo("p1")],
    });
    state = chatReducer(state, { type: "request_failed", id: "e", text: "indisponível", retry: null });

    expect(state.photos.map((item) => item.id)).toEqual(["p1"]);
  });

  it("somente fotos são anexadas sem chamar a IA", () => {
    const state = chatReducer(createInitialChatState("w"), {
      type: "photos_attached",
      id: "u1",
      replyId: "a1",
      attachments: [photo("p1")],
      confirmationKey: "k",
    });

    expect(state.status).toBe("idle");
    expect(state.photos).toHaveLength(1);
    expect(state.messages.at(-1)?.text).toMatch(/me diga quem devo cadastrar/);
    expect(canSendMessage(createInitialChatState("w"), "", 1)).toBe(true);
    expect(canSendMessage(createInitialChatState("w"), "  ", 0)).toBe(false);
  });

  it("remover foto do card gera nova chave de confirmação", () => {
    const state = chatReducer(sentWithPhotos([photo("p1"), photo("p2")]), {
      type: "photo_removed",
      photoId: "p1",
      confirmationKey: "k2",
    });

    expect(state.photos.map((item) => item.id)).toEqual(["p2"]);
    expect(state.confirmationKey).toBe("k2");
  });

  it("começar outro contato descarta fotos do cadastro anterior", () => {
    let state = sentWithPhotos([photo("p1")]);
    state = chatReducer(state, {
      type: "message_started",
      id: "u2",
      userText: "Agora cadastre a Paula Lima",
      attachments: [photo("p2")],
    });
    state = chatReducer(state, {
      type: "message_succeeded",
      id: "a2",
      response: response({ rascunho: draft({ nome: "Paula Lima" }) }),
      confirmationKey: "k2",
    });

    expect(state.photos.map((item) => item.id)).toEqual(["p2"]);
  });

  it("cancelar descarta as fotos", () => {
    const state = chatReducer(sentWithPhotos([photo("p1")]), { type: "cancel_requested", id: "c" });
    expect(state.photos).toEqual([]);
  });

  it("consentimento no resumo: com fotos Sim, sem fotos Não", () => {
    expect(draftSummaryRows(draft(), 2).find((row) => row.label === "Autorizou fotos")?.value).toBe("Sim");
    expect(draftSummaryRows(draft(), 0).find((row) => row.label === "Autorizou fotos")?.value).toBe("Não");
  });
});

describe("envio das fotos após o cadastro", () => {
  it("confirmação com fotos passa a enviar as fotos com o ID real", () => {
    let state = chatReducer(sentWithPhotos([photo("p1"), photo("p2")]), { type: "confirm_started" });
    state = chatReducer(state, {
      type: "confirm_succeeded",
      id: "s1",
      result: { contato: { id: "contato-real", nome: "Juliana", cidade: { id: "c", nome: "União", uf: "PR" } }, reaproveitado: false },
    });

    const success = state.messages.at(-1);
    expect(state.status).toBe("uploading");
    expect(state.photos).toEqual([]);
    expect(success?.photoUpload?.contactId).toBe("contato-real");
    expect(success?.photoUpload?.photos).toHaveLength(2);
  });

  it("sem fotos, a confirmação termina sem etapa de upload", () => {
    let state = chatReducer(sentWithPhotos([]), { type: "confirm_started" });
    state = chatReducer(state, {
      type: "confirm_succeeded",
      id: "s1",
      result: { contato: { id: "x", nome: "Juliana", cidade: { id: "c", nome: "União", uf: "PR" } }, reaproveitado: false },
    });

    expect(state.status).toBe("idle");
    expect(state.messages.at(-1)?.photoUpload).toBeUndefined();
  });

  it("falha parcial informa e só reenvia as fotos que faltam", () => {
    let state = chatReducer(sentWithPhotos([photo("p1"), photo("p2")]), { type: "confirm_started" });
    state = chatReducer(state, {
      type: "confirm_succeeded",
      id: "s1",
      result: { contato: { id: "x", nome: "Juliana", cidade: { id: "c", nome: "União", uf: "PR" } }, reaproveitado: false },
    });
    state = chatReducer(state, { type: "photo_status", messageId: "s1", photoId: "p1", status: "uploaded" });
    state = chatReducer(state, { type: "photo_status", messageId: "s1", photoId: "p2", status: "failed" });
    state = chatReducer(state, { type: "uploads_finished" });

    const job = state.messages.at(-1)!.photoUpload!;
    expect(describePhotoUpload(job)).toEqual({ tone: "error", text: "1 de 2 fotos enviadas. 1 não foi enviada." });
    expect(pendingUploads(job).map((item) => item.id)).toEqual(["p2"]);
    expect(state.status).toBe("idle");
  });

  it("todas enviadas", () => {
    expect(
      describePhotoUpload({ contactId: "x", photos: [{ ...photo("a"), status: "uploaded" }, { ...photo("b"), status: "uploaded" }] }),
    ).toEqual({ tone: "success", text: "2 fotos enviadas" });
  });
});

describe("validatePhotoSelection", () => {
  it("aceita JPG/PNG/WebP até 10 MB e no máximo 4 por cadastro", () => {
    const result = validatePhotoSelection(
      [file("image/jpeg"), file("image/png"), file("image/gif"), file("image/webp", ASSISTANT_MAX_PHOTO_SIZE + 1), file("image/webp")],
      1,
    );

    expect(result.accepted).toHaveLength(3);
    expect(result.errors).toEqual(["Use fotos JPG, PNG ou WebP.", "Cada foto pode ter no máximo 10 MB."]);

    const excess = validatePhotoSelection([file("image/jpeg"), file("image/jpeg")], 3);
    expect(excess.accepted).toHaveLength(1);
    expect(excess.errors).toEqual(["Cada cadastro aceita no máximo 4 fotos."]);
  });
});
