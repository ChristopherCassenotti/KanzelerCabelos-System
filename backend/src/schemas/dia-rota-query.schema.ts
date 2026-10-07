import { z } from "zod";

const dataSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Data deve estar no formato YYYY-MM-DD",
  );

export const diaRotaQuerySchema = z
  .object({
    de: dataSchema.optional(),
    ate: dataSchema.optional(),
  })
  .refine(
    (data) =>
      !data.de ||
      !data.ate ||
      data.de <= data.ate,
    {
      message:
        "A data inicial não pode ser maior que a final",
    },
  );

export type DiaRotaQuery =
  z.infer<typeof diaRotaQuerySchema>;