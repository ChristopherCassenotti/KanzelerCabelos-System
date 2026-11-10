import type { City, ContactRepurchase, ContactStatus } from "./contact";
import type { RouteMapDto } from "./schedule";

export type MapStatus = ContactStatus | "recompra";

export interface MapContact {
  id: string;
  nome: string;
  telefone?: string | null;
  endereco?: string | null;
  status: ContactStatus | string;
  statusMapa: MapStatus | string;
  lat: string | number;
  lng: string | number;
  cidade: City;
  recompra?: ContactRepurchase | null;
}

export interface MapCitySummary {
  cidadeId: string;
  nome: string;
  uf?: string;
  total: number;
  lead?: number;
  avaliacaoAgendada?: number;
  comprado?: number;
  recompra?: number;
  perdido?: number;
}

export interface GlobalMapResponse {
  total: number;
  contatos: MapContact[];
  cidades: MapCitySummary[];
  rota?: RouteMapDto | null;
}

export interface GlobalMapFilters {
  status?: MapStatus;
  cidadeId?: string;
  soProntasRecompra?: boolean;
  dataRota?: string;
}
