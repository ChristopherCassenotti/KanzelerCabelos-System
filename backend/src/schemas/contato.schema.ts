import { z } from "zod";
import { dadosCompraSchema } from "./compra.schema";

export const criarContatoSchema = z.object({
  nome: z.string().min(2),
  telefone: z.string().optional(),
  cidadeId: z.string().uuid(),

  endereco: z.string().optional(),

  lat: z
    .number()
    .min(-90)
    .max(90)
    .optional(),

  lng: z
    .number()
    .min(-180)
    .max(180)
    .optional(),

  geoFonte: z.string().optional(),
  geoPlaceId: z.string().optional(),

  origem: z.string().optional(),
  indicadoPor: z
  .string()
  .trim()
  .max(150)
  .nullable()
  .optional(),
dataPrimeiroContato: z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Data deve estar no formato YYYY-MM-DD",
  )
  .optional(),

dataAvaliacao: z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Data deve estar no formato YYYY-MM-DD",
  )
  .optional(),
  natural: z.boolean().optional(),

  cor: z.string().optional(),
  textura: z.string().optional(),
  quimica: z.string().optional(),

  comprimentoCm: z
    .number()
    .int()
    .positive()
    .optional(),

  observacoes: z.string().optional(),
autorizouFoto: z
  .boolean()
  .optional(),
  
});

export type CriarContatoInput =
  z.infer<typeof criarContatoSchema>;

export const atualizarContatoSchema =
  criarContatoSchema
    .partial()
    .refine(
      (data) =>
        Object.keys(data).length > 0,
      {
        message:
          "Informe pelo menos um campo para atualizar",
      },
    );

export type AtualizarContatoInput =
  z.infer<typeof atualizarContatoSchema>;

/**
 * Cadastro operacional: a cliente só é cadastrada quando o cabelo é
 * comprado. Contato e compra são criados juntos, em uma transação.
 */
export const criarContatoComCompraSchema = z
  .object({
    contato: criarContatoSchema,
    compra: dadosCompraSchema,
  })
  .strict();

export type CriarContatoComCompraInput =
  z.infer<typeof criarContatoComCompraSchema>;
