import "dotenv/config";

export const OPENAI_MODELO_PADRAO = "gpt-5.4-mini";

function inteiroPositivo(
  valor: string | undefined,
  padrao: number,
) {
  const numero = Number(valor);

  return Number.isInteger(numero) && numero > 0 ? numero : padrao;
}

const ESFORCOS = ["none", "minimal", "low", "medium"] as const;

function lerReasoningEffort(): ConfiguracaoAssistente["reasoningEffort"] {
  const valor = process.env["OPENAI_REASONING_EFFORT"]?.trim();

  if (valor === undefined) return "low";
  if (valor === "" || valor === "padrao") return null;

  return (ESFORCOS as readonly string[]).includes(valor)
    ? (valor as (typeof ESFORCOS)[number])
    : "low";
}

export interface ConfiguracaoAssistente {
  apiKey: string | null;
  modelo: string;
  timeoutMs: number;
  maxOutputTokens: number;
  /** Esforço de raciocínio para modelos que suportam (`gpt-5*`, `o*`). */
  reasoningEffort: "none" | "minimal" | "low" | "medium" | null;
  limitePorMinuto: number;
  limitePorHora: number;
}

/** Lida a cada uso para permitir configurar a chave sem reiniciar testes. */
export function lerConfiguracaoAssistente(): ConfiguracaoAssistente {
  const apiKey = process.env["OPENAI_API_KEY"]?.trim();

  return {
    apiKey: apiKey ? apiKey : null,
    modelo:
      process.env["OPENAI_MODEL"]?.trim() || OPENAI_MODELO_PADRAO,
    timeoutMs: inteiroPositivo(
      process.env["OPENAI_TIMEOUT_MS"],
      20_000,
    ),
    maxOutputTokens: inteiroPositivo(
      process.env["OPENAI_MAX_OUTPUT_TOKENS"],
      2_000,
    ),
    reasoningEffort: lerReasoningEffort(),
    limitePorMinuto: inteiroPositivo(
      process.env["ASSISTENTE_LIMITE_POR_MINUTO"],
      12,
    ),
    limitePorHora: inteiroPositivo(
      process.env["ASSISTENTE_LIMITE_POR_HORA"],
      150,
    ),
  };
}
