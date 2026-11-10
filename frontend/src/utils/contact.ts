import type { ContactDetail, ContactOverview, ContactPurchase, ContactStatus } from "../types/contact";

export const statusLabels: Record<ContactStatus, string> = {
  lead: "Lead",
  avaliacao_agendada: "Avaliação agendada",
  comprado: "Comprado",
  perdido: "Perdido",
};

export function isKnownContactStatus(status: string): status is ContactStatus {
  return ["lead", "avaliacao_agendada", "comprado", "perdido"].includes(status);
}

export function formatPhone(phone: string | null | undefined) {
  const digits = (phone ?? "").replace(/\D/g, "");

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return phone || "-";
}

export function buildWhatsAppUrl(phone: string | null | undefined) {
  let digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return null;
  if (!digits.startsWith("55") && (digits.length === 10 || digits.length === 11)) {
    digits = `55${digits}`;
  }
  return `https://wa.me/${digits}`;
}

export function buildMapsUrl(contact: ContactOverview | ContactDetail) {
  if (contact.lat !== null && contact.lng !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${contact.lat},${contact.lng}`)}`;
  }

  const destination = [
    contact.endereco,
    contact.cidade ? `${contact.cidade.nome} - ${contact.cidade.uf}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  if (!destination) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatCurrency(value: string | number | null | undefined) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number)) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(number);
}

export function formatDate(date: string | null | undefined) {
  if (!date) return "-";
  const [year, month, day] = date.slice(0, 10).split("-");
  if (!year || !month || !day) return date;
  return `${day}/${month}/${year}`;
}

export function latestPurchase(contact: ContactOverview | ContactDetail): ContactPurchase | null {
  return contact.compras[0] ?? null;
}

export function pricePerGram(purchase: ContactPurchase | null) {
  if (!purchase?.pesoG || purchase.pesoG <= 0) return null;
  const paid = Number(purchase.valorPago);
  if (!Number.isFinite(paid)) return null;
  return paid / purchase.pesoG;
}

export function repurchaseLabel(days: number) {
  if (days < 0) return `venceu há ${Math.abs(days)}d`;
  if (days === 0) return "vence hoje";
  return `vence em ${days}d`;
}
