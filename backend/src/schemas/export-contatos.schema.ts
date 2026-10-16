import { z } from "zod";

export const exportContatosQuerySchema =
  z.object({
    status: z
      .enum([
        "lead",
        "avaliacao_agendada",
        "comprado",
        "perdido",
      ])
      .optional(),

    cidadeId: z
      .string()
      .uuid()
      .optional(),

    origem: z
      .string()
      .trim()
      .min(1)
      .optional(),

    natural: z
      .enum(["true", "false"])
      .transform(
        (valor) =>
          valor === "true",
      )
      .optional(),
  });

export type ExportContatosQuery =
  z.infer<
    typeof exportContatosQuerySchema
  >;