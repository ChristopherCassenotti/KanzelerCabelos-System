import { z } from "zod";

export const concluirItemRotaSchema = z.object({
  resultado: z
    .enum([
      "comprou",
      "nao_comprou",
      "nao_atendeu",
    ])
    .optional(),
});

export type ConcluirItemRotaInput =
  z.infer<typeof concluirItemRotaSchema>;