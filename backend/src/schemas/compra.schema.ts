import { z } from "zod";

const dataISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD");

const valorMonetario = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Valor inválido");

export const FORMAS_PAGAMENTO = ["Pix", "Dinheiro"] as const;

/** Dados da compra em si (sem vínculo com contato/visita). */
export const dadosCompraSchema = z.object({
  dataCorte: dataISO,

  pesoG: z.number().int().positive().optional(),

  comprimentoCm: z.number().int().positive().optional(),
  cor: z.string().optional(),
  textura: z.string().optional(),
  quimica: z.string().optional(),

  valorPago: valorMonetario,

  formaPagamento: z.enum(FORMAS_PAGAMENTO),

  valorRevenda: valorMonetario.optional(),
  dataRevenda: dataISO.optional(),
  comprador: z.string().trim().min(1).max(150).optional(),
});

export type DadosCompraInput = z.infer<typeof dadosCompraSchema>;

export const registrarCompraSchema = dadosCompraSchema.extend({
  visitaId: z.string().uuid().optional(),
});

export type RegistrarCompraInput = z.infer<typeof registrarCompraSchema>;
