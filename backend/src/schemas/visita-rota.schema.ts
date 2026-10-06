import { z } from "zod";

export const agendarVisitaSchema = z.object({
  contatoId: z.string().uuid(),

  hora: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):[0-5]\d$/,
      "Hora deve estar no formato HH:MM",
    )
    .optional(),
});

export type AgendarVisitaInput =
  z.infer<typeof agendarVisitaSchema>;