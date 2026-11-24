import type { City, ContactListItem } from "./contact";

export type FutureCutPriority = "baixa" | "media" | "alta";
export type FutureCutStatus = "acompanhando" | "agendado" | "convertido" | "descartado";
export type FutureCutSituation = "futuro" | "em_breve" | "hoje" | "atrasado";
export type FutureCutSituationFilter = "atrasado" | "hoje" | "em_breve" | "proximos_30_dias" | "este_mes";

export interface FutureCut {
  id: string;
  contatoId: string;
  dataPrevista: string | null;
  dataProximoContato: string;
  comprimentoAtualCm: number | null;
  comprimentoDesejadoCm: number | null;
  cor: string | null;
  textura: string | null;
  quimica: string | null;
  natural: boolean | null;
  observacoes: string | null;
  prioridade: FutureCutPriority;
  status: FutureCutStatus;
  ultimoContatoEm: string | null;
  createdAt: string;
  updatedAt: string;
  diasParaContato: number | null;
  situacaoContato: FutureCutSituation | null;
  prontoParaContato: boolean | null;
}

export interface FutureCutWithContact extends FutureCut {
  contato: ContactListItem & { cidade: City };
}

export interface FutureCutPayload {
  dataPrevista: string | null;
  dataProximoContato: string;
  comprimentoAtualCm: number | null;
  comprimentoDesejadoCm: number | null;
  cor: string | null;
  textura: string | null;
  quimica: string | null;
  natural: boolean | null;
  observacoes: string | null;
  prioridade: FutureCutPriority;
}

export interface FutureCutContactedPayload {
  dataProximoContato: string;
  observacao?: string;
}

export interface ScheduleFutureCutPayload {
  diaRotaId: string;
  hora?: string;
}

export interface FutureCutFilters {
  situacao?: FutureCutSituationFilter;
  prioridade?: FutureCutPriority;
  status?: FutureCutStatus;
  cidadeId?: string;
  cor?: string;
  textura?: string;
  natural?: boolean;
  comprimentoMin?: number;
  comprimentoMax?: number;
}
