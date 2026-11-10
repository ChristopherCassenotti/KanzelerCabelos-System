import type { City, ContactRepurchase, ContactStatus } from "./contact";

export type ScheduleCandidateType = "lead" | "avaliacao" | "recompra";
export type RouteItemType = "visita" | "tarefa";
export type VisitResult = "comprou" | "nao_comprou" | "nao_atendeu" | "remarcar";

export interface ScheduleCandidateContact {
  id: string;
  nome: string;
  telefone?: string | null;
  cidadeId: string;
  endereco?: string | null;
  lat?: string | number | null;
  lng?: string | number | null;
  status: ContactStatus | string;
  dataAvaliacao?: string | null;
  cidade: City;
}

export interface ScheduleCandidate extends ScheduleCandidateContact {
  tipoAgendamento: ScheduleCandidateType;
  recompra: ContactRepurchase | null;
}

export interface ScheduleCandidateNested {
  contato: ScheduleCandidateContact;
  tipoAgendamento: ScheduleCandidateType;
  recompra: ContactRepurchase | null;
}

export type ScheduleCandidateApi = ScheduleCandidate | ScheduleCandidateNested;

export interface ScheduleSummaryCity {
  cidadeId: string;
  nome: string;
  uf?: string;
  quantidade?: number;
  total?: number;
}

export interface ScheduleSummary {
  total: number;
  tipos: {
    lead: number;
    avaliacao: number;
    recompra: number;
  };
  cidades: ScheduleSummaryCity[];
}

export interface RouteContact {
  id: string;
  nome: string;
  telefone?: string | null;
  endereco?: string | null;
  lat?: string | number | null;
  lng?: string | number | null;
  status?: ContactStatus | string;
  cidade?: City | null;
}

export interface RouteItem {
  id: string;
  diaRotaId: string;
  tipo: RouteItemType | string;
  contatoId?: string | null;
  titulo?: string | null;
  ordem: number;
  hora?: string | null;
  concluido: boolean;
  resultado?: VisitResult | string | null;
  contato?: RouteContact | null;
}

export interface RouteDay {
  id: string;
  data: string;
  partidaCidadeId: string;
  horaSaida: string;
  minutosPorVisita: number;
  custoCombustivel: string | number;
  custoAlimentacao: string | number;
  custoHospedagem: string | number;
  custoOutros: string | number;
  distanciaKm?: string | number | null;
  duracaoMin?: number | null;
  rotaPolyline?: string | null;
  partidaCidade?: City | null;
  itens: RouteItem[];
}

export interface CreateRoutePayload {
  data: string;
  partidaCidadeId: string;
  horaSaida?: string;
  minutosPorVisita?: number;
  custoCombustivel?: string;
  custoAlimentacao?: string;
  custoHospedagem?: string;
  custoOutros?: string;
}

export type UpdateRoutePayload = Partial<Omit<CreateRoutePayload, "data">>;

export interface AddVisitPayload {
  contatoId: string;
  hora?: string;
}

export interface CreateTaskPayload {
  titulo: string;
  hora?: string;
}

export interface CompleteItemPayload {
  resultado?: VisitResult;
}

export interface RouteOperationResult {
  tipo: string;
  itens?: RouteItem[];
  item?: RouteItem;
  tarefa?: RouteItem;
  visita?: RouteItem;
  exigeRegistroCompra?: boolean;
  novaData?: string;
}

export interface RouteMapStop {
  ordem: number;
  hora?: string | null;
  concluido?: boolean;
  resultado?: VisitResult | string | null;
  contato: RouteContact;
}

export interface RouteMapDto {
  id: string;
  data: string;
  horaSaida: string;
  partida: City;
  distanciaKm?: string | number | null;
  duracaoMin?: number | null;
  rotaPolyline?: string | null;
  paradas: RouteMapStop[];
}

export interface RouteSettingsDraft {
  partidaCidadeId: string;
  horaSaida: string;
  minutosPorVisita: number;
  custoCombustivel: string;
  custoAlimentacao: string;
  custoHospedagem: string;
  custoOutros: string;
}
