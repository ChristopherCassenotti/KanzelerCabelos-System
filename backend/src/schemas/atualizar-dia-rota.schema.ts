import { z } from "zod";

const valorMonetario = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Valor inválido");

export const atualizarDiaRotaSchema = z
  .object({
    partidaCidadeId: z.string().uuid().optional(),

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
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message:
        "Informe pelo menos um campo para atualizar",
    },
  );

export type AtualizarDiaRotaInput =
  z.infer<typeof atualizarDiaRotaSchema>;