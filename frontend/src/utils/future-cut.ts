import type { FutureCutFormValues } from "../schemas/future-cut.schema";
import type { ContactDetail } from "../types/contact";
import type { FutureCut, FutureCutPayload, FutureCutPriority } from "../types/future-cut";

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
