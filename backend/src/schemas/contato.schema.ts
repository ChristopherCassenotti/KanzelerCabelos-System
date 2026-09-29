import { z } from "zod";

export const criarContatoSchema = z.object({
  nome: z.string().min(2),
  telefone: z.string().optional(),
  cidadeId: z.string().uuid(),

  endereco: z.string().optional(),
  origem: z.string().optional(),

  natural: z.boolean().optional(),

  cor: z.string().optional(),
  textura: z.string().optional(),
  quimica: z.string().optional(),

  comprimentoCm: z.number().int().positive().optional(),

  observacoes: z.string().optional(),
});

export type CriarContatoInput = z.infer<typeof criarContatoSchema>;