import { z } from "zod";

export const registrarCompraSchema = z.object({
  dataCorte: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),

  pesoG: z.number().int().positive().optional(),

  comprimentoCm: z.number().int().positive().optional(),
  cor: z.string().optional(),
  textura: z.string().optional(),
  quimica: z.string().optional(),

  valorPago: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Valor inválido"),

  formaPagamento: z.enum(["Pix", "Dinheiro"]),
});

export type RegistrarCompraInput = z.infer<typeof registrarCompraSchema>;