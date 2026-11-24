import type {
  PrioridadeFuturoCorte,
  StatusFuturoCorte,
} from "../services/futuro-corte.rules";

export interface CriarFuturoCorteModel {
  contatoId: string;

  dataPrevista:
    Temporal.PlainDate | null;

  dataProximoContato:
    Temporal.PlainDate;

  comprimentoAtualCm: number | null;
  comprimentoDesejadoCm: number | null;

  cor: string | null;
  textura: string | null;
  quimica: string | null;

  natural: boolean | null;

  observacoes: string | null;

  prioridade: PrioridadeFuturoCorte;
}

export type AtualizarFuturoCorteModel =
  Partial<
    Omit<
      CriarFuturoCorteModel,
      "contatoId"
    >
  > & {
    status?: StatusFuturoCorte;
    ultimoContatoEm?: Temporal.Instant;
  };
