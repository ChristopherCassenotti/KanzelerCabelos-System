import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { normalizeApiError } from "../services/api/errors";
import { confirmAssistantContact, sendAssistantMessage } from "../services/assistant/assistant.service";
import { uploadContactPhoto } from "../services/photos/photos.service";
import type { AssistantCity, AssistantConfirmPayload, AssistantMessagePayload, AssistantPhoto } from "../types/assistant";
import {
  buildHistory,
  chatReducer,
  createInitialChatState,
  describeConfirmError,
  describeMessageError,
  extractDuplicates,
  invalidateAfterContactCreated,
  pendingUploads,
  type PhotoUploadJob,
  type RetryRequest,
} from "../utils/assistant-chat";

/** UUID v4; `crypto.randomUUID` só existe em contexto seguro (HTTPS/localhost). */
export function createUuid() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function createAttachedPhoto(file: File): AssistantPhoto {
  return { id: createUuid(), file, previewUrl: URL.createObjectURL(file), status: "pending" };
}

export function useAssistantChat() {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(chatReducer, undefined, () => createInitialChatState(createUuid()));
  // Trava síncrona: impede duas requisições no mesmo tick (duplo clique/Enter).
  const inFlight = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  // URLs de pré-visualização criadas nesta conversa (liberadas ao reiniciar/sair).
  const previewUrls = useRef(new Set<string>());

  const releasePreviews = useCallback(() => {
    for (const url of previewUrls.current) URL.revokeObjectURL(url);
    previewUrls.current.clear();
  }, []);

  useEffect(() => releasePreviews, [releasePreviews]);

  const trackPreviews = useCallback((photos: AssistantPhoto[]) => {
    for (const photo of photos) previewUrls.current.add(photo.previewUrl);
  }, []);

  const runMessage = useCallback(
    async (payload: AssistantMessagePayload, userText: string | null, attachments: AssistantPhoto[] = []) => {
      if (inFlight.current) return;
      inFlight.current = true;
      trackPreviews(attachments);
      dispatch({ type: "message_started", id: createUuid(), userText, attachments });

      try {
        const response = await sendAssistantMessage(payload);
        dispatch({ type: "message_succeeded", id: createUuid(), response, confirmationKey: createUuid() });
      } catch (error) {
        const apiError = normalizeApiError(error);
        dispatch({
          type: "request_failed",
          id: createUuid(),
          text: describeMessageError(apiError),
          // Reenviar mensagem é seguro: esta etapa nunca grava no banco.
          retry: apiError.status === 400 || apiError.status === 401 ? null : { type: "message", payload },
        });
      } finally {
        inFlight.current = false;
      }
    },
    [trackPreviews],
  );

  /** Envia fotos já com o contato criado; só reenvia as que ainda não subiram. */
  const runUploads = useCallback(
    async (messageId: string, job: PhotoUploadJob) => {
      for (const photo of pendingUploads(job)) {
        dispatch({ type: "photo_status", messageId, photoId: photo.id, status: "uploading" });

        try {
          await uploadContactPhoto(job.contactId, { file: photo.file });
          dispatch({ type: "photo_status", messageId, photoId: photo.id, status: "uploaded" });
        } catch {
          dispatch({ type: "photo_status", messageId, photoId: photo.id, status: "failed" });
        }
      }

      dispatch({ type: "uploads_finished" });
      await invalidateAfterContactCreated(queryClient);
    },
    [queryClient],
  );

  const runConfirm = useCallback(
    async (payload: AssistantConfirmPayload) => {
      if (inFlight.current) return;
      inFlight.current = true;
      const photos = stateRef.current.photos;
      dispatch({ type: "confirm_started" });

      try {
        const result = await confirmAssistantContact(payload);
        const messageId = createUuid();
        dispatch({ type: "confirm_succeeded", id: messageId, result });
        await invalidateAfterContactCreated(queryClient);

        if (photos.length > 0) {
          await runUploads(messageId, { contactId: result.contato.id, photos });
        }
      } catch (error) {
        const apiError = normalizeApiError(error);
        const duplicates = extractDuplicates(apiError);

        if (duplicates) {
          dispatch({ type: "duplicates_detected", id: createUuid(), text: apiError.message, duplicates });
        } else {
          const retryable = apiError.status === null || apiError.status >= 500 || apiError.status === 429;
          dispatch({
            type: "request_failed",
            id: createUuid(),
            text: describeConfirmError(apiError),
            // A mesma chave de idempotência garante que repetir não duplica.
            retry: retryable ? { type: "confirm", payload } : null,
          });
        }
      } finally {
        inFlight.current = false;
      }
    },
    [queryClient, runUploads],
  );

  const sendMessage = useCallback(
    (text: string, attachments: AssistantPhoto[] = []) => {
      const current = stateRef.current;
      const mensagem = text.trim();

      // Só fotos: anexa ao cadastro sem chamar a IA (as fotos nunca vão para a IA).
      if (mensagem.length === 0) {
        if (attachments.length === 0 || inFlight.current || current.status !== "idle") return Promise.resolve();
        trackPreviews(attachments);
        dispatch({
          type: "photos_attached",
          id: createUuid(),
          replyId: createUuid(),
          attachments,
          confirmationKey: createUuid(),
        });
        return Promise.resolve();
      }

      return runMessage(
        { mensagem, historico: buildHistory(current.messages), rascunho: current.draft },
        mensagem,
        attachments,
      );
    },
    [runMessage, trackPreviews],
  );

  const chooseCity = useCallback(
    (city: AssistantCity) => {
      const current = stateRef.current;

      return runMessage(
        { cidadeEscolhidaId: city.id, historico: buildHistory(current.messages), rascunho: current.draft },
        `${city.nome} - ${city.uf}`,
      );
    },
    [runMessage],
  );

  const confirm = useCallback(() => {
    const current = stateRef.current;

    if (!current.draft || !current.confirmationKey) return Promise.resolve();

    return runConfirm({
      idempotencyKey: current.confirmationKey,
      rascunho: current.draft,
      // Só chega aqui com duplicados quando o aviso já foi exibido no resumo.
      ignorarDuplicidade: current.duplicates.length > 0,
      quantidadeFotos: current.photos.length,
    });
  }, [runConfirm]);

  const retry = useCallback(
    (request: RetryRequest) =>
      request.type === "message" ? runMessage(request.payload, null) : runConfirm(request.payload),
    [runConfirm, runMessage],
  );

  const retryUploads = useCallback(
    async (messageId: string, job: PhotoUploadJob) => {
      if (inFlight.current) return;
      inFlight.current = true;

      try {
        await runUploads(messageId, job);
      } finally {
        inFlight.current = false;
      }
    },
    [runUploads],
  );

  const removePhoto = useCallback((photoId: string) => {
    if (stateRef.current.status !== "idle") return;
    dispatch({ type: "photo_removed", photoId, confirmationKey: createUuid() });
  }, []);

  const edit = useCallback(() => dispatch({ type: "edit_requested", id: createUuid() }), []);
  const cancel = useCallback(() => dispatch({ type: "cancel_requested", id: createUuid() }), []);
  const reset = useCallback(() => {
    if (inFlight.current) return;
    releasePreviews();
    dispatch({ type: "reset", id: createUuid() });
  }, [releasePreviews]);

  return { state, sendMessage, chooseCity, confirm, retry, retryUploads, removePhoto, edit, cancel, reset };
}
