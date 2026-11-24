import { z } from "zod";

import {
  FILTROS_SITUACAO_FUTURO_CORTE,
  PRIORIDADES_FUTURO_CORTE,
  STATUS_FUTURO_CORTE,
} from "../services/futuro-corte.rules";

function dataExiste(valor: string) {
  try {
    Temporal.PlainDate.from(valor);
    return true;
  } catch {
    return false;
  }
}

const dataISO = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Data deve estar no formato YYYY-MM-DD",
  )
  .refine(dataExiste, "Data inválida");

const comprimento = z
  .number()
  .int()
  .positive();

export const futuroCorteIdSchema = z
  .string()
  .uuid();

export const criarFuturoCorteSchema = z.object({
  dataPrevista: dataISO.nullable().optional(),
  dataProximoContato: dataISO,

  comprimentoAtualCm:
    comprimento.nullable().optional(),

  comprimentoDesejadoCm:
    comprimento.nullable().optional(),

  cor: z.string().nullable().optional(),
  textura: z.string().nullable().optional(),
  quimica: z.string().nullable().optional(),

  natural: z.boolean().nullable().optional(),

  observacoes: z
    .string()
    .trim()
    .nullable()
    .optional(),

  prioridade: z
    .enum(PRIORIDADES_FUTURO_CORTE)
    .optional(),
});

export type CriarFuturoCorteInput =
  z.infer<typeof criarFuturoCorteSchema>;

export const atualizarFuturoCorteSchema =
  criarFuturoCorteSchema
    .partial()
    .refine(
      (data) =>
        Object.keys(data).length > 0,
      {
        message:
          "Informe pelo menos um campo para atualizar",
      },
    );

export type AtualizarFuturoCorteInput =
  z.infer<typeof atualizarFuturoCorteSchema>;

export const contatadoFuturoCorteSchema =
  z.object({
    dataProximoContato: dataISO,

    observacao: z
      .string()
      .trim()
      .min(1)
      .optional(),
  });

export type ContatadoFuturoCorteInput =
  z.infer<typeof contatadoFuturoCorteSchema>;

export const agendarAvaliacaoFuturoCorteSchema =
  z.object({
    diaRotaId: z.string().uuid(),

    hora: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):[0-5]\d$/,
        "Hora deve estar no formato HH:MM",
      )
      .optional(),
  });

export type AgendarAvaliacaoFuturoCorteInput =
  z.infer<
    typeof agendarAvaliacaoFuturoCorteSchema
  >;

const comprimentoQuery = z
  .string()
  .regex(/^\d+$/, "Comprimento inválido")
  .transform(Number);

export const listarFuturosCortesQuerySchema =
  z
    .object({
      situacao: z
        .enum(FILTROS_SITUACAO_FUTURO_CORTE)
        .optional(),

      prioridade: z
        .enum(PRIORIDADES_FUTURO_CORTE)
        .optional(),

      status: z
        .enum(STATUS_FUTURO_CORTE)
        .optional(),

      cidadeId: z.string().uuid().optional(),

      cor: z.string().trim().min(1).optional(),
      textura: z.string().trim().min(1).optional(),

      natural: z
        .enum(["true", "false"])
        .transform((valor) => valor === "true")
        .optional(),

      comprimentoMin: comprimentoQuery.optional(),
      comprimentoMax: comprimentoQuery.optional(),
    })
    .refine(
      (data) =>
        data.comprimentoMin === undefined ||
        data.comprimentoMax === undefined ||
        data.comprimentoMin <=
          data.comprimentoMax,
      {
        message:
          "Comprimento mínimo maior que o máximo",
      },
    );

export type ListarFuturosCortesQuery =
  z.infer<
    typeof listarFuturosCortesQuerySchema
  >;
