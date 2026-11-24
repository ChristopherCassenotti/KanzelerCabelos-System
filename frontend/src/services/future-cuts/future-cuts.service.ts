import { http } from "../api/http";
import type {
  FutureCut,
  FutureCutContactedPayload,
  FutureCutFilters,
  FutureCutPayload,
  FutureCutWithContact,
  ScheduleFutureCutPayload,
} from "../../types/future-cut";

export async function listFutureCuts(filters: FutureCutFilters = {}) {
  const response = await http.get<FutureCutWithContact[]>("/futuros-cortes", { params: filters });
  return response.data;
}

export async function listContactFutureCuts(contactId: string) {
  const response = await http.get<FutureCut[]>(`/contatos/${contactId}/futuros-cortes`);
  return response.data;
}

export async function createFutureCut(contactId: string, payload: FutureCutPayload) {
  const response = await http.post<FutureCut>(`/contatos/${contactId}/futuros-cortes`, payload);
  return response.data;
}

export async function updateFutureCut(id: string, payload: FutureCutPayload) {
  const response = await http.patch<FutureCut>(`/futuros-cortes/${id}`, payload);
  return response.data;
}

export async function markFutureCutContacted(id: string, payload: FutureCutContactedPayload) {
  const response = await http.post<FutureCut>(`/futuros-cortes/${id}/contatado`, payload);
  return response.data;
}

export async function scheduleFutureCut(id: string, payload: ScheduleFutureCutPayload) {
  const response = await http.post<{ tipo: string; futuroCorte: FutureCut }>(
    `/futuros-cortes/${id}/agendar-avaliacao`,
    payload,
  );
  return response.data;
}

export async function closeFutureCut(id: string, action: "converter" | "descartar") {
  const response = await http.post<FutureCut>(`/futuros-cortes/${id}/${action}`);
  return response.data;
}
