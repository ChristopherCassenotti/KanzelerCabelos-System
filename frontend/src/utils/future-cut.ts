import { hairOwnerPayload } from "./contact-form";
import type { FutureCutFormValues, NewFutureCutFormValues } from "../schemas/future-cut.schema";
import type { ContactDetail, ContactOverview } from "../types/contact";
import type { CreateContactWithFutureCutPayload, FutureCut, FutureCutPayload, FutureCutPriority } from "../types/future-cut";

export const priorityLabels: Record<FutureCutPriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

type SituationSource = Pick<FutureCut, "status" | "diasParaContato">;

export function futureCutLabel({ status, diasParaContato: days }: SituationSource) {
  if (status === "agendado") return "Avaliação agendada";
  if (status === "convertido") return "Convertido";
  if (status === "descartado") return "Descartado";
  if (days === null) return "-";

  const unit = Math.abs(days) === 1 ? "dia" : "dias";
  if (days < 0) return `CONTATO ATRASADO HÁ ${Math.abs(days)} ${unit.toUpperCase()}`;
  if (days === 0) return "Contato hoje";
  return `Contato em ${days} ${unit}`;
}

export function futureCutBadgeClass({ status, diasParaContato: days }: SituationSource) {
  if (status === "agendado") return "bg-[var(--kanzler-blue-soft)] text-[var(--kanzler-blue)]";
  if (days === null) return "bg-[#eef1f5] text-[var(--kanzler-muted)]";
  if (days < 0) return "bg-[var(--kanzler-red-soft)] text-[var(--kanzler-red)]";
  if (days <= 7) return "bg-[var(--kanzler-amber-soft)] text-[var(--kanzler-amber)]";
  return "bg-[#eef1f5] text-[var(--kanzler-muted)]";
}

export function futureCutHair(cut: Pick<FutureCut, "cor" | "textura" | "comprimentoAtualCm">) {
  return [cut.cor, cut.textura, cut.comprimentoAtualCm ? `${cut.comprimentoAtualCm} cm` : null]
    .filter(Boolean)
    .join(" · ");
}

export function isActiveFutureCut(cut: FutureCut) {
  return cut.status === "acompanhando" || cut.status === "agendado";
}

function naturalToForm(value: boolean | null): FutureCutFormValues["natural"] {
  if (value === null) return "";
  return value ? "true" : "false";
}

/** Novo interesse parte dos dados de cabelo já cadastrados no contato. */
export function futureCutToFormValues(cut: FutureCut | null, contact: ContactDetail): FutureCutFormValues {
  const hair = cut ?? contact;
  const currentLength = cut ? cut.comprimentoAtualCm : contact.comprimentoCm;

  return {
    dataPrevista: cut?.dataPrevista ?? "",
    dataProximoContato: cut?.dataProximoContato ?? "",
    comprimentoAtualCm: currentLength ? String(currentLength) : "",
    comprimentoDesejadoCm: cut?.comprimentoDesejadoCm ? String(cut.comprimentoDesejadoCm) : "",
    cor: hair.cor ?? "",
    textura: hair.textura ?? "",
    quimica: hair.quimica ?? "",
    natural: naturalToForm(hair.natural),
    prioridade: cut?.prioridade ?? "media",
    observacoes: cut?.observacoes ?? "",
  };
}

export function createEmptyNewFutureCutValues(): NewFutureCutFormValues {
  return {
    nome: "",
    telefone: "",
    cidadeId: "",
    origem: "",
    indicadoPor: "",
    cabeloDe: "",
    nomeDonoCabelo: "",
    idadeDonoCabelo: "",
    dataPrevista: "",
    dataProximoContato: "",
    comprimentoAtualCm: "",
    comprimentoDesejadoCm: "",
    cor: "",
    textura: "",
    quimica: "",
    natural: "",
    prioridade: "media",
    observacoes: "",
  };
}

/** Os dados do cabelo também ficam no contato; as observações, só no acompanhamento. */
export function formValuesToNewFutureCutPayload(values: NewFutureCutFormValues): CreateContactWithFutureCutPayload {
  const futuroCorte = formValuesToFutureCutPayload(values);

  return {
    contato: {
      nome: values.nome,
      cidadeId: values.cidadeId,
      ...(values.telefone ? { telefone: values.telefone } : {}),
      ...(values.origem ? { origem: values.origem } : {}),
      ...(values.indicadoPor ? { indicadoPor: values.indicadoPor } : {}),
      ...hairOwnerPayload(values, false),
      ...(futuroCorte.cor ? { cor: futuroCorte.cor } : {}),
      ...(futuroCorte.textura ? { textura: futuroCorte.textura } : {}),
      ...(futuroCorte.quimica ? { quimica: futuroCorte.quimica } : {}),
      ...(futuroCorte.natural !== null ? { natural: futuroCorte.natural } : {}),
      ...(futuroCorte.comprimentoAtualCm ? { comprimentoCm: futuroCorte.comprimentoAtualCm } : {}),
    },
    futuroCorte,
  };
}

function normalizeName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");
}

function phoneKey(value: string | null) {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length >= 8 ? digits.slice(-8) : null;
}

/** Mesmo critério do assistente: mesmo telefone, ou mesmo nome na mesma cidade. */
export function findSimilarContacts(
  contacts: ContactOverview[],
  { nome, telefone, cidadeId }: { nome: string; telefone: string; cidadeId: string },
) {
  const name = normalizeName(nome);
  const phone = phoneKey(telefone);

  return contacts
    .filter((contact) =>
      (phone !== null && phoneKey(contact.telefone) === phone) ||
      (name !== "" && cidadeId !== "" && contact.cidadeId === cidadeId && normalizeName(contact.nome) === name))
    .slice(0, 5);
}

export function formValuesToFutureCutPayload(values: FutureCutFormValues): FutureCutPayload {
  return {
    dataPrevista: values.dataPrevista || null,
    dataProximoContato: values.dataProximoContato,
    comprimentoAtualCm: values.comprimentoAtualCm ? Number(values.comprimentoAtualCm) : null,
    comprimentoDesejadoCm: values.comprimentoDesejadoCm ? Number(values.comprimentoDesejadoCm) : null,
    cor: values.cor || null,
    textura: values.textura || null,
    quimica: values.quimica || null,
    natural: values.natural === "" ? null : values.natural === "true",
    observacoes: values.observacoes || null,
    prioridade: values.prioridade,
  };
}
