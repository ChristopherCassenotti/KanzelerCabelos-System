import type { QueryClient } from "@tanstack/react-query";
import type {
  AssistantCity,
  AssistantConfirmPayload,
  AssistantConfirmResponse,
  AssistantContactDraft,
  AssistantCreatedContact,
  AssistantDuplicate,
  AssistantHistoryItem,
  AssistantMessagePayload,
  AssistantMessageResponse,
  AssistantPendingField,
  AssistantPhoto,
  AssistantStage,
} from "../types/assistant";
import { formatCurrency, formatPhone } from "./contact";

export const ASSISTANT_HISTORY_LIMIT = 10;
export const ASSISTANT_MESSAGE_MAX_LENGTH = 2000;

/** Mesmas regras do upload de fotos da ficha do contato. */
export const ASSISTANT_MAX_PHOTOS = 4;
export const ASSISTANT_MAX_PHOTO_SIZE = 10 * 1024 * 1024;
export const ASSISTANT_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const ASSISTANT_WELCOME = `Olá! Eu cadastro a cliente junto com a compra do cabelo.

Preencha as informações abaixo para realizar o cadastro:

*DADOS PESSOAIS*
Nome:
Email:
WhatsApp:
Cidade:
Endereço:

*ORIGEM DO CONTATO*
Como chegou:
Indicada por:
Data do primeiro contato:

*INFORMAÇÕES DO CABELO*
Cabelo natural:
Cor:
Textura:
Química:
Comprimento (cm):
Data da avaliação:

*INFORMAÇÕES DA COMPRA*
Data do corte:
Peso (g):
Valor pago (R$):
Forma de pagamento:
Preço por grama (R$):

*REVENDA (OPCIONAL)*
Valor de revenda (R$):
Data da revenda:
Comprador:`;

/** Query keys afetadas por um novo contato (mesmas usadas pelo cadastro manual). */
export const CONTACT_CREATED_QUERY_KEYS = [
  ["contacts"],
  ["dashboard"],
  ["repurchases"],
  ["reports"],
  ["map"],
  ["agenda"],
  ["photos"],
] as const;

export function invalidateAfterContactCreated(queryClient: QueryClient) {
  return Promise.all(
    CONTACT_CREATED_QUERY_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey: [...queryKey] })),
  );
}

export function getContactProfilePath(contactId: string) {
  return `/contatos?contato=${encodeURIComponent(contactId)}`;
}

export type RetryRequest =
  | { type: "message"; payload: AssistantMessagePayload }
  | { type: "confirm"; payload: AssistantConfirmPayload };

export interface PhotoUploadJob {
  contactId: string;
  photos: AssistantPhoto[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  tone: "default" | "error" | "success";
  notices: string[];
  /** Mensagens locais (ex.: erros) não são enviadas como histórico à IA. */
  includeInHistory: boolean;
  /** Fotos enviadas junto com a mensagem do usuário (somente exibição). */
  attachments?: AssistantPhoto[];
  createdContact?: AssistantCreatedContact;
  photoUpload?: PhotoUploadJob;
  retry?: RetryRequest;
}

export interface ChatState {
  messages: ChatMessage[];
  draft: AssistantContactDraft | null;
  /** Fotos do cadastro em andamento (enviadas após a confirmação). */
  photos: AssistantPhoto[];
  stage: AssistantStage | null;
  pendingFields: AssistantPendingField[];
  cityOptions: AssistantCity[];
  duplicates: AssistantDuplicate[];
  status: "idle" | "sending" | "confirming" | "uploading";
  /** Chave de idempotência da tentativa de cadastro do rascunho atual. */
  confirmationKey: string | null;
  editing: boolean;
}

export type ChatAction =
  | { type: "reset"; id: string }
  | { type: "message_started"; id: string; userText: string | null; attachments: AssistantPhoto[] }
  | { type: "message_succeeded"; id: string; response: AssistantMessageResponse; confirmationKey: string }
  | { type: "photos_attached"; id: string; replyId: string; attachments: AssistantPhoto[]; confirmationKey: string }
  | { type: "photo_removed"; photoId: string; confirmationKey: string }
  | { type: "confirm_started" }
  | { type: "confirm_succeeded"; id: string; result: AssistantConfirmResponse }
  | { type: "photo_status"; messageId: string; photoId: string; status: AssistantPhoto["status"] }
  | { type: "uploads_finished" }
  | { type: "duplicates_detected"; id: string; text: string; duplicates: AssistantDuplicate[] }
  | { type: "request_failed"; id: string; text: string; retry: RetryRequest | null }
  | { type: "edit_requested"; id: string }
  | { type: "cancel_requested"; id: string };

function assistantMessage(id: string, text: string, extra: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id,
    role: "assistant",
    text,
    tone: "default",
    notices: [],
    includeInHistory: true,
    ...extra,
  };
}

export function createInitialChatState(id: string): ChatState {
  return {
    messages: [assistantMessage(id, ASSISTANT_WELCOME, { includeInHistory: false })],
    draft: null,
    photos: [],
    stage: null,
    pendingFields: [],
    cityOptions: [],
    duplicates: [],
    status: "idle",
    confirmationKey: null,
    editing: false,
  };
}

/** Desativa botões de "tentar novamente" antigos ao iniciar nova requisição. */
function clearRetries(messages: ChatMessage[]) {
  return messages.map((message) => (message.retry ? { ...message, retry: undefined } : message));
}

function sameDraft(a: AssistantContactDraft | null, b: AssistantContactDraft | null) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function userMessage(id: string, text: string, attachments: AssistantPhoto[]): ChatMessage {
  return {
    id,
    role: "user",
    text,
    tone: "default",
    notices: [],
    includeInHistory: text.length > 0,
    ...(attachments.length > 0 ? { attachments } : {}),
  };
}

/** A quantidade de fotos faz parte da confirmação: mudou, nova tentativa de cadastro. */
function keyAfterPhotoChange(state: ChatState, newKey: string) {
  return state.draft ? newKey : state.confirmationKey;
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "reset":
      return createInitialChatState(action.id);

    case "message_started": {
      const messages = clearRetries(state.messages);

      return {
        ...state,
        status: "sending",
        photos: [...state.photos, ...action.attachments],
        messages:
          action.userText !== null || action.attachments.length > 0
            ? [...messages, userMessage(action.id, action.userText ?? "", action.attachments)]
            : messages,
      };
    }

    case "message_succeeded": {
      const { response } = action;
      const draftChanged = !sameDraft(state.draft, response.rascunho);
      const startedAnotherContact =
        state.draft?.nome != null && response.rascunho?.nome != null && state.draft.nome !== response.rascunho.nome;
      const lastUserAttachments = [...state.messages].reverse().find((message) => message.role === "user")?.attachments ?? [];
      // Novo contato: fotos anteriores eram do cadastro descartado; ficam só as desta mensagem.
      const photos =
        response.rascunho === null
          ? []
          : startedAnotherContact
            ? state.photos.filter((photo) => lastUserAttachments.some((item) => item.id === photo.id))
            : state.photos;

      return {
        ...state,
        status: "idle",
        editing: false,
        draft: response.rascunho,
        photos,
        stage: response.estado,
        pendingFields: response.pendencias,
        cityOptions: response.cidadeOpcoes,
        duplicates: response.possiveisDuplicados,
        confirmationKey:
          response.rascunho === null
            ? null
            : draftChanged || photos.length !== state.photos.length || !state.confirmationKey
              ? action.confirmationKey
              : state.confirmationKey,
        messages: [...state.messages, assistantMessage(action.id, response.resposta, { notices: response.avisos })],
      };
    }

    case "photos_attached": {
      const photos = [...state.photos, ...action.attachments];
      const reply = isDraftReady(state)
        ? `Fotos anexadas (${photos.length}). Confira o resumo e confirme o cadastro.`
        : state.draft
          ? `Fotos anexadas (${photos.length}). Continue com os dados do cadastro.`
          : `Fotos recebidas (${photos.length}). Agora me diga quem devo cadastrar (nome e cidade).`;

      return {
        ...state,
        photos,
        confirmationKey: keyAfterPhotoChange(state, action.confirmationKey),
        messages: [
          ...clearRetries(state.messages),
          userMessage(action.id, "", action.attachments),
          assistantMessage(action.replyId, reply, { includeInHistory: false }),
        ],
      };
    }

    case "photo_removed":
      return {
        ...state,
        photos: state.photos.filter((photo) => photo.id !== action.photoId),
        confirmationKey: keyAfterPhotoChange(state, action.confirmationKey),
      };

    case "confirm_started":
      return { ...state, status: "confirming", messages: clearRetries(state.messages) };

    case "confirm_succeeded": {
      const photos = state.photos.map((photo) => ({ ...photo, status: "pending" as const }));

      return {
        ...state,
        status: photos.length > 0 ? "uploading" : "idle",
        draft: null,
        photos: [],
        stage: null,
        pendingFields: [],
        cityOptions: [],
        duplicates: [],
        confirmationKey: null,
        editing: false,
        messages: [
          ...state.messages,
          assistantMessage(action.id, "Contato e compra cadastrados com sucesso", {
            tone: "success",
            includeInHistory: false,
            createdContact: action.result.contato,
            ...(photos.length > 0 ? { photoUpload: { contactId: action.result.contato.id, photos } } : {}),
          }),
        ],
      };
    }

    case "photo_status":
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.messageId && message.photoUpload
            ? {
                ...message,
                photoUpload: {
                  ...message.photoUpload,
                  photos: message.photoUpload.photos.map((photo) =>
                    photo.id === action.photoId ? { ...photo, status: action.status } : photo,
                  ),
                },
              }
            : message,
        ),
      };

    case "uploads_finished":
      return { ...state, status: "idle" };

    case "duplicates_detected":
      return {
        ...state,
        status: "idle",
        duplicates: action.duplicates,
        messages: [
          ...state.messages,
          assistantMessage(action.id, action.text, { tone: "error", includeInHistory: false }),
        ],
      };

    case "request_failed":
      return {
        ...state,
        status: "idle",
        messages: [
          ...state.messages,
          assistantMessage(action.id, action.text, {
            tone: "error",
            includeInHistory: false,
            ...(action.retry ? { retry: action.retry } : {}),
          }),
        ],
      };

    case "edit_requested":
      return {
        ...state,
        editing: true,
        messages: [
          ...state.messages,
          assistantMessage(
            action.id,
            "Sem problemas. Diga o que deseja alterar (por exemplo: \"o telefone é 42988887777\" ou \"ela é de Porto União\").",
          ),
        ],
      };

    case "cancel_requested":
      return {
        ...state,
        draft: null,
        photos: [],
        stage: "cancelado",
        pendingFields: [],
        cityOptions: [],
        duplicates: [],
        confirmationKey: null,
        editing: false,
        messages: [
          ...state.messages,
          assistantMessage(action.id, "Cadastro cancelado. Nada foi salvo.", { includeInHistory: false }),
        ],
      };
  }
}

export function buildHistory(messages: ChatMessage[]): AssistantHistoryItem[] {
  return messages
    .filter((message) => message.includeInHistory)
    .slice(-ASSISTANT_HISTORY_LIMIT)
    .map((message) => ({
      papel: message.role === "user" ? "usuario" : "assistente",
      texto: message.text.slice(0, ASSISTANT_MESSAGE_MAX_LENGTH),
    }));
}

export function isDraftReady(state: ChatState) {
  return (
    state.draft !== null &&
    state.draft.cidadeId !== null &&
    state.pendingFields.length === 0 &&
    state.cityOptions.length === 0 &&
    !state.editing
  );
}

export function canSendMessage(state: ChatState, text: string, attachmentCount = 0) {
  const trimmed = text.trim();

  return (
    state.status === "idle" &&
    trimmed.length <= ASSISTANT_MESSAGE_MAX_LENGTH &&
    (trimmed.length > 0 || attachmentCount > 0)
  );
}

export interface PhotoSelection {
  accepted: File[];
  errors: string[];
}

/** Valida arquivos escolhidos considerando as fotos já anexadas ao cadastro. */
export function validatePhotoSelection(files: File[], alreadyAttached: number): PhotoSelection {
  const accepted: File[] = [];
  const errors = new Set<string>();

  for (const file of files) {
    if (!(ASSISTANT_PHOTO_TYPES as readonly string[]).includes(file.type)) {
      errors.add("Use fotos JPG, PNG ou WebP.");
    } else if (file.size > ASSISTANT_MAX_PHOTO_SIZE) {
      errors.add("Cada foto pode ter no máximo 10 MB.");
    } else if (alreadyAttached + accepted.length >= ASSISTANT_MAX_PHOTOS) {
      errors.add(`Cada cadastro aceita no máximo ${ASSISTANT_MAX_PHOTOS} fotos.`);
    } else {
      accepted.push(file);
    }
  }

  return { accepted, errors: [...errors] };
}

export function pendingUploads(job: PhotoUploadJob) {
  return job.photos.filter((photo) => photo.status !== "uploaded");
}

export function describePhotoUpload(job: PhotoUploadJob) {
  const total = job.photos.length;
  const uploaded = job.photos.filter((photo) => photo.status === "uploaded").length;
  const failed = job.photos.filter((photo) => photo.status === "failed").length;
  const inProgress = job.photos.some((photo) => photo.status === "pending" || photo.status === "uploading");

  if (inProgress) return { tone: "progress" as const, text: `Enviando fotos... ${uploaded} de ${total}` };
  if (failed > 0) {
    return {
      tone: "error" as const,
      text: `${uploaded} de ${total} ${total === 1 ? "foto enviada" : "fotos enviadas"}. ${failed} não ${failed === 1 ? "foi enviada" : "foram enviadas"}.`,
    };
  }

  return { tone: "success" as const, text: total === 1 ? "1 foto enviada" : `${total} fotos enviadas` };
}

export function draftSummaryRows(draft: AssistantContactDraft, photoCount = 0) {
  const rows: Array<{ label: string; value: string }> = [];
  const push = (label: string, value: string | null) => {
    if (value !== null && value !== "") rows.push({ label, value });
  };

  push("Nome", draft.nome);
  push("Cidade", draft.cidadeNome ? `${draft.cidadeNome}${draft.cidadeUf ? ` - ${draft.cidadeUf}` : ""}` : null);
  push("Telefone", draft.telefone ? formatPhone(draft.telefone) : null);
  push("Endereço", draft.endereco);
  push("Origem", draft.origem);
  push("Indicado por", draft.indicadoPor);
  push("Primeiro contato", draft.dataPrimeiroContato ? formatISODate(draft.dataPrimeiroContato) : "Hoje (padrão)");
  push("Avaliação", draft.dataAvaliacao ? formatISODate(draft.dataAvaliacao) : null);
  push("Natural", draft.natural === null ? null : draft.natural ? "Sim" : "Não");
  push("Cor", draft.cor);
  push("Textura", draft.textura);
  push("Química", draft.quimica);
  push("Comprimento", draft.comprimentoCm === null ? null : `${draft.comprimentoCm} cm`);
  // O consentimento é definido pelo envio de fotos (regra do backend).
  push("Autorizou fotos", photoCount > 0 ? "Sim" : "Não");
  push("Observações", draft.observacoes);

  return rows;
}

/** Linhas da compra exibidas no card de confirmação. */
export function draftPurchaseRows(draft: AssistantContactDraft) {
  const rows: Array<{ label: string; value: string }> = [];
  const push = (label: string, value: string | null) => {
    if (value !== null && value !== "") rows.push({ label, value });
  };

  push("Data do corte", draft.dataCorte ? formatISODate(draft.dataCorte) : "Hoje (padrão)");
  push("Valor pago", draft.valorPago ? formatCurrency(draft.valorPago) : null);
  push("Forma de pagamento", draft.formaPagamento);
  push("Peso", draft.pesoG === null ? null : `${draft.pesoG} g`);
  push(
    "Preço por grama",
    draft.valorPago && draft.pesoG ? `${formatCurrency(Number(draft.valorPago) / draft.pesoG)}/g` : null,
  );
  push("Valor de revenda", draft.valorRevenda ? formatCurrency(draft.valorRevenda) : null);
  push("Data da revenda", draft.dataRevenda ? formatISODate(draft.dataRevenda) : null);
  push("Comprador", draft.comprador);

  return rows;
}

function formatISODate(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export interface ErrorLike {
  message: string;
  status: number | null;
  details?: unknown;
}

export function describeMessageError(error: ErrorLike) {
  if (error.status === null) {
    return "Não foi possível conectar ao servidor. Sua conversa, as fotos e os dados do cadastro foram mantidos.";
  }

  return error.message || "Não foi possível processar a mensagem. Os dados do cadastro foram mantidos.";
}

export function describeConfirmError(error: ErrorLike) {
  if (error.status === null || error.status >= 500) {
    return "Não foi possível confirmar o cadastro. Tente novamente — repetir esta mesma confirmação não cria contato duplicado.";
  }

  return `${error.message || "Não foi possível cadastrar o contato."} Nada foi salvo.`;
}

export function extractDuplicates(error: ErrorLike): AssistantDuplicate[] | null {
  if (error.status !== 409 || typeof error.details !== "object" || error.details === null) return null;

  const duplicates = (error.details as { possiveisDuplicados?: unknown }).possiveisDuplicados;

  return Array.isArray(duplicates) ? (duplicates as AssistantDuplicate[]) : null;
}
