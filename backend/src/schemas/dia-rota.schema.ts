import { z } from "zod";

const valorMonetario = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Valor inválido");

export const criarDiaRotaSchema = z.object({
  data: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Data deve estar no formato YYYY-MM-DD",
    ),

  partidaCidadeId: z.string().uuid(),

  horaSaida: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):[0-5]\d$/,
      "Hora deve estar no formato HH:MM",
    )
    .optional(),

  minutosPorVisita: z
    .number()
    .int()
    .positive()
    .optional(),

  custoCombustivel: valorMonetario.optional(),
  custoAlimentacao: valorMonetario.optional(),
  custoHospedagem: valorMonetario.optional(),
  custoOutros: valorMonetario.optional(),
});

export type CriarDiaRotaInput =
  z.infer<typeof criarDiaRotaSchema>;