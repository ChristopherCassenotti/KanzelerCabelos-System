import { z } from "zod";

export const aAgendarQuerySchema = z.object({
  cidadeId: z.string().uuid().optional(),

  tipo: z
    .enum([
      "lead",
      "avaliacao",
      "recompra",
    ])
    .optional(),
});

export type AAgendarQuery =
  z.infer<typeof aAgendarQuerySchema>;