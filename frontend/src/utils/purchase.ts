import type { ContactDetail } from "../types/contact";
import type { PurchaseFormValues } from "../schemas/purchase.schema";
import type { RegisterPurchasePayload } from "../types/purchase";
import { getTodayInSaoPauloISO } from "./date";

function normalizeMoney(value: string) {
  return value.replace(",", ".");
}

export function createPurchaseFormValues(
  contact: ContactDetail,
  defaultDate?: string,
): PurchaseFormValues {
  const latest = contact.compras[0] ?? null;

  return {
    dataCorte: defaultDate || getTodayInSaoPauloISO(),
    pesoG: "",
    comprimentoCm: latest?.comprimentoCm !== null && latest?.comprimentoCm !== undefined
      ? String(latest.comprimentoCm)
      : contact.comprimentoCm !== null
        ? String(contact.comprimentoCm)
        : "",
    cor: latest?.cor ?? contact.cor ?? "",
    textura: latest?.textura ?? contact.textura ?? "",
    quimica: latest?.quimica ?? contact.quimica ?? "",
    valorPago: "",
    formaPagamento: "Pix",
    valorRevenda: "",
    dataRevenda: "",
    comprador: "",
  };
}

export function purchaseFormToPayload(
  values: PurchaseFormValues,
  visitId?: string | null,
): RegisterPurchasePayload {
  return {
    ...(visitId ? { visitaId: visitId } : {}),
    dataCorte: values.dataCorte,
    ...(values.pesoG ? { pesoG: Number(values.pesoG) } : {}),
    ...(values.comprimentoCm ? { comprimentoCm: Number(values.comprimentoCm) } : {}),
    ...(values.cor ? { cor: values.cor } : {}),
    ...(values.textura ? { textura: values.textura } : {}),
    ...(values.quimica ? { quimica: values.quimica } : {}),
    valorPago: normalizeMoney(values.valorPago),
    formaPagamento: values.formaPagamento,
    ...(values.valorRevenda ? { valorRevenda: normalizeMoney(values.valorRevenda) } : {}),
    ...(values.dataRevenda ? { dataRevenda: values.dataRevenda } : {}),
    ...(values.comprador ? { comprador: values.comprador } : {}),
  };
}

export function calculatePurchasePricePerGram(valorPago: string, pesoG: string) {
  const paid = Number(normalizeMoney(valorPago));
  const weight = Number(pesoG);

  if (!Number.isFinite(paid) || !Number.isFinite(weight) || weight <= 0) return null;
  return paid / weight;
}
