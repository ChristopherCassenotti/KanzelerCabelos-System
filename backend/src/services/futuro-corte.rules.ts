import type { CriarFuturoCorteModel } from "../models/futuro-corte.model";
import type { CriarFuturoCorteInput } from "../schemas/futuro-corte.schema";

export const PRIORIDADES_FUTURO_CORTE = [
  "baixa",
  "media",
  "alta",
] as const;

export type PrioridadeFuturoCorte =
  typeof PRIORIDADES_FUTURO_CORTE[number];

export const STATUS_FUTURO_CORTE = [
  "acompanhando",
  "agendado",
  "convertido",
  "descartado",
] as const;

export type StatusFuturoCorte =
  typeof STATUS_FUTURO_CORTE[number];

export type SituacaoContato =
  | "futuro"
  | "em_breve"
  | "hoje"
  | "atrasado";

export const STATUS_FUTURO_CORTE_ATIVOS = [
  "acompanhando",
  "agendado",
] as const;

export const FILTROS_SITUACAO_FUTURO_CORTE = [
  "atrasado",
  "hoje",
  "em_breve",
  "proximos_30_dias",
  "este_mes",
] as const;

export type FiltroSituacaoFuturoCorte =
  typeof FILTROS_SITUACAO_FUTURO_CORTE[number];

export function futuroCorteAtivo(
  status: StatusFuturoCorte,
) {
  return (
    status === "acompanhando" ||
    status === "agendado"
  );
}

/** Colunas do futuro corte com os valores padrão aplicados. */
export function prepararFuturoCorte(
  data: CriarFuturoCorteInput,
): Omit<CriarFuturoCorteModel, "contatoId"> {
  return {
    dataPrevista: data.dataPrevista
      ? Temporal.PlainDate.from(data.dataPrevista)
      : null,

    dataProximoContato:
      Temporal.PlainDate.from(
        data.dataProximoContato,
      ),

    comprimentoAtualCm:
      data.comprimentoAtualCm ?? null,

    comprimentoDesejadoCm:
      data.comprimentoDesejadoCm ?? null,

    cor: data.cor ?? null,
    textura: data.textura ?? null,
    quimica: data.quimica ?? null,
    natural: data.natural ?? null,

    observacoes:
      data.observacoes ?? null,

    prioridade:
      data.prioridade ?? "media",
  };
}

interface CalcularSituacaoInput {
  status: StatusFuturoCorte;
  dataProximoContato: Temporal.PlainDate;
  hoje: Temporal.PlainDate;
}

/**
 * "Pronto" e "atrasado" não são salvos: dependem só da data do próximo
 * contato em relação a hoje (data de São Paulo, sem hora).
 */
export function calcularSituacaoFuturoCorte({
  status,
  dataProximoContato,
  hoje,
}: CalcularSituacaoInput): {
  diasParaContato: number | null;
  situacaoContato: SituacaoContato | null;
  prontoParaContato: boolean | null;
} {
  if (status !== "acompanhando") {
    return {
      diasParaContato: null,
      situacaoContato: null,
      prontoParaContato: null,
    };
  }

  const diasParaContato =
    hoje.until(dataProximoContato, {
      largestUnit: "days",
    }).days;

  let situacaoContato: SituacaoContato =
    "futuro";

  if (diasParaContato < 0) {
    situacaoContato = "atrasado";
  } else if (diasParaContato === 0) {
    situacaoContato = "hoje";
  } else if (diasParaContato <= 7) {
    situacaoContato = "em_breve";
  }

  return {
    diasParaContato,
    situacaoContato,
    prontoParaContato:
      diasParaContato <= 0,
  };
}

/** Somente acompanhando; "próximos 30 dias" inclui os atrasados. */
export function correspondeSituacao(
  filtro: FiltroSituacaoFuturoCorte,
  futuroCorte: CalcularSituacaoInput,
) {
  const { diasParaContato, situacaoContato } =
    calcularSituacaoFuturoCorte(futuroCorte);

  if (diasParaContato === null) {
    return false;
  }

  if (filtro === "proximos_30_dias") {
    return diasParaContato <= 30;
  }

  if (filtro === "este_mes") {
    return (
      futuroCorte.dataProximoContato.year ===
        futuroCorte.hoje.year &&
      futuroCorte.dataProximoContato.month ===
        futuroCorte.hoje.month
    );
  }

  return situacaoContato === filtro;
}

/** Compra retroativa (corte anterior ao cadastro) não converte. */
export function compraConverteFuturoCorte(
  dataCorte: Temporal.PlainDate,
  criadoEm: Temporal.Instant,
) {
  const dataCriacao = criadoEm
    .toZonedDateTimeISO("America/Sao_Paulo")
    .toPlainDate();

  return (
    Temporal.PlainDate.compare(
      dataCorte,
      dataCriacao,
    ) >= 0
  );
}

export function acrescentarObservacao(
  atual: string | null,
  nova: string,
  hoje: Temporal.PlainDate,
) {
  const dia = String(hoje.day).padStart(2, "0");
  const mes = String(hoje.month).padStart(2, "0");

  const linha =
    `[${dia}/${mes}/${hoje.year}] ${nova}`;

  return atual
    ? `${atual}\n${linha}`
    : linha;
}
