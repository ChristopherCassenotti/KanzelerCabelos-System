import { z } from "zod";

const requiredDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data");

const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Data inválida");

const optionalLength = z
  .string()
  .trim()
  .refine((value) => value === "" || (/^\d+$/.test(value) && Number(value) > 0), "Use um número inteiro maior que zero");

export const futureCutFormSchema = z.object({
  dataPrevista: optionalDate,
  dataProximoContato: requiredDate,
  comprimentoAtualCm: optionalLength,
  comprimentoDesejadoCm: optionalLength,
  cor: z.string().trim().max(80),
  textura: z.string().trim().max(80),
  quimica: z.string().trim().max(100),
  natural: z.enum(["", "true", "false"]),
  prioridade: z.enum(["baixa", "media", "alta"]),
  observacoes: z.string().trim().max(3000),
});

export type FutureCutFormValues = z.infer<typeof futureCutFormSchema>;

export const futureCutContactedSchema = z.object({
  dataProximoContato: requiredDate,
  observacao: z.string().trim().max(1000),
});

export type FutureCutContactedValues = z.infer<typeof futureCutContactedSchema>;
