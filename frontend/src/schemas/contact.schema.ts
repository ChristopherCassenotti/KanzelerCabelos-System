import { z } from "zod";
import { purchaseFormSchema } from "./purchase.schema";

const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Data inválida");

export const contactFormSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome completo").max(150),
  telefone: z.string().trim().max(30),
  cidadeId: z.string().trim().min(1, "Selecione a cidade"),
  endereco: z.string().trim().max(250),
  origem: z.string().trim().max(120),
  indicadoPor: z.string().trim().max(150),
  dataPrimeiroContato: optionalDate,
  dataAvaliacao: optionalDate,
  natural: z.enum(["", "true", "false"]),
  cor: z.string().trim().max(80),
  textura: z.string().trim().max(80),
  quimica: z.string().trim().max(100),
  comprimentoCm: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d+$/.test(value), "Use um número inteiro")
    .refine((value) => value === "" || Number(value) >= 0, "Valor inválido"),
  autorizouFoto: z.boolean(),
  observacoes: z.string().trim().max(3000),
});

export const contactStatusSchema = z
  .object({
    status: z.enum(["lead", "avaliacao_agendada", "comprado", "perdido"]),
    motivoPerda: z.string().trim().max(500),
  })
  .superRefine((value, context) => {
    if (value.status === "perdido" && value.motivoPerda.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["motivoPerda"],
        message: "Informe o motivo da perda",
      });
    }
  });

export type ContactFormValues = z.infer<typeof contactFormSchema>;
export type ContactStatusValues = z.infer<typeof contactStatusSchema>;

/**
 * Cadastro operacional: a cliente é cadastrada junto com a compra do cabelo.
 * Cor, textura, química e comprimento ficam na parte do cabelo (contato) e a
 * compra os herda no backend.
 */
export const contactWithPurchaseFormSchema = contactFormSchema.extend(
  purchaseFormSchema.pick({
    dataCorte: true,
    pesoG: true,
    valorPago: true,
    formaPagamento: true,
    valorRevenda: true,
    dataRevenda: true,
    comprador: true,
  }).shape,
);

export type ContactWithPurchaseFormValues = z.infer<typeof contactWithPurchaseFormSchema>;
