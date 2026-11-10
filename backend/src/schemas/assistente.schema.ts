import { z } from "zod";
import { FORMAS_PAGAMENTO } from "./compra.schema";

/**
 * Valores canônicos usados pelos selects da ficha de contato no frontend.
 * A IA é orientada a normalizar para estes valores, mantendo filtros e
 * relatórios consistentes com cadastros manuais.
 */
export const ORIGENS_CONTATO = [
  "Anúncio Meta",
  "Indicação",
  "Perfil Instagram",
  "Van na rua",
  "WhatsApp direto",
  "Outro",
] as const;

export const CORES_CABELO = [
  "Preto",
  "Castanho escuro",
  "Castanho",
  "Castanho claro",
  "Loiro",
  "Ruivo",
  "Grisalho",
] as const;

export const TEXTURAS_CABELO = [
  "Liso",
  "Ondulado",
  "Cacheado",
  "Crespo",
] as const;

export const QUIMICAS_CABELO = [
  "Nenhuma",
  "Tintura",
  "Luzes/mechas",
  "Progressiva",
  "Alisamento",
] as const;

export const LIMITE_MENSAGEM = 2000;
export const LIMITE_HISTORICO = 10;
export const LIMITE_TEXTO_HISTORICO = 2000;
/** Mesmo limite do upload de fotos da ficha (`ContactPhotosSection`). */
export const LIMITE_FOTOS = 4;

const dataISO = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Data deve estar no formato YYYY-MM-DD",
  );

const valorMonetario = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Valor inválido");

const textoOpcional = (max: number) =>
  z.string().trim().max(max).nullable().default(null);

/**
 * Rascunho do contato em construção. Fica no navegador entre as mensagens
 * e é sempre revalidado pelo backend (inclusive a cidadeId).
 */
export const rascunhoContatoSchema = z
  .object({
    nome: textoOpcional(150),
    telefone: textoOpcional(30),
    cidadeId: z.uuid().nullable().default(null),
    cidadeNome: textoOpcional(120),
    cidadeUf: textoOpcional(2),
    endereco: textoOpcional(250),
    origem: textoOpcional(120),
    indicadoPor: textoOpcional(150),
    dataPrimeiroContato: dataISO.nullable().default(null),
    dataAvaliacao: dataISO.nullable().default(null),
    natural: z.boolean().nullable().default(null),
    cor: textoOpcional(80),
    textura: textoOpcional(80),
    quimica: textoOpcional(100),
    comprimentoCm: z
      .number()
      .int()
      .positive()
      .max(300)
      .nullable()
      .default(null),
    observacoes: textoOpcional(3000),
    autorizouFoto: z.boolean().default(false),

    // Compra (o contato só é cadastrado junto com a compra).
    /** Data do corte; vazia = hoje (America/Sao_Paulo) na confirmação. */
    dataCorte: dataISO.nullable().default(null),
    pesoG: z.number().int().positive().max(20_000).nullable().default(null),
    /** Valor em reais com ponto decimal, ex.: "1850.00". */
    valorPago: valorMonetario.nullable().default(null),
    formaPagamento: z.enum(FORMAS_PAGAMENTO).nullable().default(null),
    valorRevenda: valorMonetario.nullable().default(null),
    dataRevenda: dataISO.nullable().default(null),
    comprador: textoOpcional(150),
  })
  .strict();

export type RascunhoContato =
  z.infer<typeof rascunhoContatoSchema>;

export const mensagemHistoricoSchema = z
  .object({
    papel: z.enum(["usuario", "assistente"]),
    texto: z.string().max(LIMITE_TEXTO_HISTORICO),
  })
  .strict();

export type MensagemHistorico =
  z.infer<typeof mensagemHistoricoSchema>;

export const assistenteMensagemSchema = z
  .object({
    mensagem: z
      .string()
      .trim()
      .min(1, "Digite uma mensagem")
      .max(
        LIMITE_MENSAGEM,
        `A mensagem pode ter no máximo ${LIMITE_MENSAGEM} caracteres`,
      )
      .optional(),
    cidadeEscolhidaId: z.uuid().optional(),
    historico: z
      .array(mensagemHistoricoSchema)
      .max(50)
      .default([]),
    rascunho: rascunhoContatoSchema.nullable().default(null),
  })
  .strict()
  .refine(
    (data) =>
      data.mensagem !== undefined ||
      data.cidadeEscolhidaId !== undefined,
    {
      message: "Informe uma mensagem ou a cidade escolhida",
    },
  );

export type AssistenteMensagemInput =
  z.infer<typeof assistenteMensagemSchema>;

export const confirmarContatoAssistenteSchema = z
  .object({
    idempotencyKey: z.uuid(),
    rascunho: rascunhoContatoSchema,
    ignorarDuplicidade: z.boolean().default(false),
    /**
     * Fotos anexadas no chat que serão enviadas após o cadastro. Enviar foto
     * define o consentimento: com fotos `autorizouFoto = true`, sem fotos `false`.
     */
    quantidadeFotos: z
      .number()
      .int()
      .min(0)
      .max(LIMITE_FOTOS)
      .default(0),
  })
  .strict();

export type ConfirmarContatoAssistenteInput =
  z.infer<typeof confirmarContatoAssistenteSchema>;

/**
 * Campos que o usuário pode pedir para remover do rascunho ("tira o
 * telefone"). Nome e cidade são obrigatórios e só podem ser substituídos.
 */
export const CAMPOS_REMOVIVEIS = [
  "telefone",
  "endereco",
  "origem",
  "indicadoPor",
  "dataPrimeiroContato",
  "dataAvaliacao",
  "natural",
  "cor",
  "textura",
  "quimica",
  "comprimentoCm",
  "observacoes",
  "dataCorte",
  "pesoG",
  "valorRevenda",
  "dataRevenda",
  "comprador",
] as const;

export type CampoRemovivel =
  (typeof CAMPOS_REMOVIVEIS)[number];

export const INTENCOES_ASSISTENTE = [
  "criar_contato",
  "complementar_rascunho",
  "confirmar",
  "cancelar",
  "ajuda",
  "fora_do_escopo",
] as const;

export type IntencaoAssistente =
  (typeof INTENCOES_ASSISTENTE)[number];

/**
 * Formato de saída estruturada exigido do modelo. Todos os campos são
 * obrigatórios e anuláveis (requisito do modo strict); restrições de
 * formato são aplicadas depois, pelas regras do rascunho.
 */
export const interpretacaoIASchema = z
  .object({
    intencao: z.enum(INTENCOES_ASSISTENTE),
    campos: z
      .object({
        nome: z.string().nullable(),
        telefone: z.string().nullable(),
        cidade: z.string().nullable(),
        uf: z.string().nullable(),
        endereco: z.string().nullable(),
        origem: z.enum(ORIGENS_CONTATO).nullable(),
        indicadoPor: z.string().nullable(),
        dataPrimeiroContato: z.string().nullable(),
        dataAvaliacao: z.string().nullable(),
        natural: z.boolean().nullable(),
        cor: z.enum(CORES_CABELO).nullable(),
        textura: z.enum(TEXTURAS_CABELO).nullable(),
        quimica: z.enum(QUIMICAS_CABELO).nullable(),
        comprimentoCm: z.number().nullable(),
        observacoes: z.string().nullable(),
        dataCorte: z.string().nullable(),
        pesoG: z.number().nullable(),
        valorPago: z.number().nullable(),
        formaPagamento: z.enum(FORMAS_PAGAMENTO).nullable(),
        valorRevenda: z.number().nullable(),
        dataRevenda: z.string().nullable(),
        comprador: z.string().nullable(),
      })
      .strict(),
    camposRemovidos: z.array(z.enum(CAMPOS_REMOVIVEIS)),
  })
  .strict();

export type InterpretacaoIA =
  z.infer<typeof interpretacaoIASchema>;

export type CamposInterpretados =
  InterpretacaoIA["campos"];
