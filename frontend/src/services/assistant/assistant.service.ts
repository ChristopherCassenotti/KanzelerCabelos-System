import { http } from "../api/http";
import type {
  AssistantConfirmPayload,
  AssistantConfirmResponse,
  AssistantMessagePayload,
  AssistantMessageResponse,
} from "../../types/assistant";

const ASSISTANT_TIMEOUT_MS = 45_000;

export async function sendAssistantMessage(payload: AssistantMessagePayload) {
  const response = await http.post<AssistantMessageResponse>("/assistente/mensagem", payload, {
    timeout: ASSISTANT_TIMEOUT_MS,
  });

  return response.data;
}

export async function confirmAssistantContact(payload: AssistantConfirmPayload) {
  const response = await http.post<AssistantConfirmResponse>("/assistente/confirmar-contato", payload, {
    timeout: ASSISTANT_TIMEOUT_MS,
  });

  return response.data;
}
