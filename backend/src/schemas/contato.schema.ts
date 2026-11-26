import { z } from "zod";
import { dadosCompraSchema } from "./compra.schema";
import { criarFuturoCorteSchema } from "./futuro-corte.schema";

/** De quem é o cabelo quando não é da própria pessoa cadastrada. */
export const CABELO_DE = ["filha", "filho", "outro"] as const;

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

  // null = o cabelo é da própria pessoa.
  cabeloDe: z.enum(CABELO_DE).nullable().optional(),
  nomeDonoCabelo: z.string().trim().max(150).nullable().optional(),
  idadeDonoCabelo: z.number().int().min(0).max(120).nullable().optional(),

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

/**
 * Pessoa que ainda não vendeu o cabelo: o contato entra como lead junto com
 * o futuro corte, em uma transação.
 */
export const criarContatoComFuturoCorteSchema = z
  .object({
    contato: criarContatoSchema,
    futuroCorte: criarFuturoCorteSchema,
  })
  .strict();

export type CriarContatoComFuturoCorteInput =
  z.infer<typeof criarContatoComFuturoCorteSchema>;

export type CriarContatoComCompraInput =
  z.infer<typeof criarContatoComCompraSchema>;
