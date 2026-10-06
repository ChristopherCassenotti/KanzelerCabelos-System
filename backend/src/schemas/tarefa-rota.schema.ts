import { z } from "zod";

export const criarTarefaRotaSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(2, "Título é obrigatório")
    .max(150),

  hora: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):[0-5]\d$/,
      "Hora deve estar no formato HH:MM",
    )
    .optional(),
});

export type CriarTarefaRotaInput =
  z.infer<typeof criarTarefaRotaSchema>;