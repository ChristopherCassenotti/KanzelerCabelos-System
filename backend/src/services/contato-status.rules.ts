export const STATUS_CONTATO = {
  LEAD: "lead",
  AVALIACAO_AGENDADA: "avaliacao_agendada",
  COMPRADO: "comprado",
  PERDIDO: "perdido",
} as const;

export type StatusContato =
  typeof STATUS_CONTATO[keyof typeof STATUS_CONTATO];

const TRANSICOES_PERMITIDAS: Record<
  StatusContato,
  StatusContato[]
> = {
  lead: [
    "avaliacao_agendada",
    "perdido",
  ],

  avaliacao_agendada: [
    "comprado",
    "perdido",
  ],

  comprado: [],

  perdido: [
    "lead",
  ],
};

export function podeAlterarStatus(
  atual: StatusContato,
  novo: StatusContato,
) {
  return TRANSICOES_PERMITIDAS[
    atual
  ].includes(novo);
}