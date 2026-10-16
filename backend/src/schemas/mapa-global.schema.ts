import { z } from "zod";

export const mapaGlobalQuerySchema =
  z.object({
    status: z
      .enum([
        "lead",
        "avaliacao_agendada",
        "comprado",
        "recompra",
        "perdido",
      ])
      .optional(),

    cidadeId: z
      .string()
      .uuid()
      .optional(),

    soProntasRecompra: z
      .enum(["true", "false"])
      .transform(
        (valor) => valor === "true",
      )
      .optional(),

    dataRota: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Data deve estar no formato YYYY-MM-DD",
      )
      .optional(),
  });