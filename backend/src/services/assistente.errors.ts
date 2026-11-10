export type CodigoErroAssistente =
  | "assistente_nao_configurado"
  | "assistente_indisponivel"
  | "assistente_tempo_esgotado"
  | "assistente_resposta_invalida"
  | "limite_excedido"
  | "cidade_invalida"
  | "dados_invalidos"
  | "possivel_duplicidade"
  | "chave_reutilizada";

/** Erro de negócio do assistente com mensagem segura para o usuário. */
export class AssistenteError extends Error {
  constructor(
    readonly codigo: CodigoErroAssistente,
    message: string,
    readonly statusCode: number,
    readonly detalhes?: unknown,
  ) {
    super(message);
    this.name = "AssistenteError";
  }
}
