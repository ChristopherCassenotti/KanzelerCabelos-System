import type { ContactPurchase } from "./contact";

export interface RegisterPurchasePayload {
  visitaId?: string;
  dataCorte: string;
  pesoG?: number;
  comprimentoCm?: number;
  cor?: string;
  textura?: string;
  quimica?: string;
  valorPago: string;
  formaPagamento: "Pix" | "Dinheiro";
  valorRevenda?: string;
  dataRevenda?: string;
  comprador?: string;
}

export type PurchaseRecord = ContactPurchase;
