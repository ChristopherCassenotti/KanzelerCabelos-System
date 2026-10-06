import { z } from "zod";

export const reordenarItensRotaSchema = z.object({
  itemIds: z
    .array(z.string().uuid())
    .min(1)
    .refine(
      (ids) =>
        new Set(ids).size === ids.length,
      {
        message:
          "Não podem existir itens duplicados",
      },
    ),
});

export type ReordenarItensRotaInput =
  z.infer<typeof reordenarItensRotaSchema>;