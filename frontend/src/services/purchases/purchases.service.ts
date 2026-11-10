import { http } from "../api/http";
import type { PurchaseRecord, RegisterPurchasePayload } from "../../types/purchase";

export async function listPurchases(contactId: string) {
  const response = await http.get<PurchaseRecord[]>(`/contatos/${contactId}/compras`);
  return response.data;
}

export async function registerPurchase(contactId: string, payload: RegisterPurchasePayload) {
  const response = await http.post<PurchaseRecord>(`/contatos/${contactId}/compras`, payload);
  return response.data;
}
