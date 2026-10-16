import { z } from "zod";

export const buscaContatoQuerySchema =
  z.object({
    q: z
      .string()
      .trim()
      .min(
        1,
        "Informe um termo para busca",
      )
      .max(120),
  });

export type BuscaContatoQuery =
  z.infer<
    typeof buscaContatoQuerySchema
  >;