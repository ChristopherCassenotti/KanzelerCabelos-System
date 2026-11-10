import { z } from "zod";

const optionalInteger = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d+$/.test(value), "Use um número inteiro")
  .refine((value) => value === "" || Number(value) >= 0, "Valor inválido");

const optionalMoney = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^\d+(?:[.,]\d{1,2})?$/.test(value),
    "Informe um valor válido",
  );

const requiredMoney = z
  .string()
  .trim()
  .min(1, "Informe o valor pago")
  .refine((value) => /^\d+(?:[.,]\d{1,2})?$/.test(value), "Informe um valor válido");

const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Data inválida");

export const purchaseFormSchema = z.object({
  dataCorte: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data do corte"),
  pesoG: optionalInteger,
  comprimentoCm: optionalInteger,
  cor: z.string().trim().max(80),
  textura: z.string().trim().max(80),
  quimica: z.string().trim().max(100),
  valorPago: requiredMoney,
  formaPagamento: z.enum(["Pix", "Dinheiro"]),
  valorRevenda: optionalMoney,
  dataRevenda: optionalDate,
  comprador: z.string().trim().max(150),
});

export type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;
