import { z } from "zod";

export const alterarStatusContatoSchema = z.object({
  status: z.enum([
    "lead",
    "avaliacao_agendada",
    "comprado",
    "perdido",
  ]),

  motivoPerda: z
    .string()
    .trim()
    .min(3)
    .optional(),
});

export type AlterarStatusContatoInput =
  z.infer<typeof alterarStatusContatoSchema>;