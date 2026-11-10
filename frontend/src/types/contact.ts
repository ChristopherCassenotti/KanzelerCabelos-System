import type { RegisterPurchasePayload } from "./purchase";
export type ContactStatus = "lead" | "avaliacao_agendada" | "comprado" | "perdido";

export interface City {
  id: string;
  nome: string;
  uf: string;
  lat?: string | number | null;
  lng?: string | number | null;
}

export interface ContactListItem {
  id: string;
  nome: string;
  telefone: string | null;
  cidadeId: string;
  endereco: string | null;
  lat: string | number | null;
  lng: string | number | null;
  geoFonte: string | null;
  geoPlaceId: string | null;
  status: ContactStatus | string;
  motivoPerda: string | null;
  origem: string | null;
  indicadoPor: string | null;
  dataPrimeiroContato: string | null;
  dataAvaliacao: string | null;
  autorizouFoto: boolean;
  natural: boolean | null;
  cor: string | null;
  textura: string | null;
  quimica: string | null;
  comprimentoCm: number | null;
  cicloRecompraMeses: number;
  observacoes: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt: string | null;
}

export interface ContactPhoto {
  id: string;
  contatoId: string;
  compraId?: string | null;
  tipo?: string | null;
  url?: string;
  signedUrl?: string;
  thumbUrl?: string | null;
  ordem?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactPurchase {
  id: string;
  contatoId: string;
  visitaId?: string | null;
  dataCorte: string;
  pesoG?: number | null;
  comprimentoCm?: number | null;
  cor?: string | null;
  textura?: string | null;
  quimica?: string | null;
  valorPago: string | number;
  formaPagamento: string;
  valorRevenda?: string | number | null;
  dataRevenda?: string | null;
  comprador?: string | null;
}

export interface ContactRepurchase {
  proximaRecompra: string;
  diasAte: number;
  pronta: boolean;
}

export interface ContactDetail extends ContactListItem {
  cidade: City;
  fotos: ContactPhoto[];
  compras: ContactPurchase[];
  recompra: ContactRepurchase | null;
}

export interface ContactOverview extends ContactListItem {
  cidade: City | null;
  compras: ContactPurchase[];
  recompra: ContactRepurchase | null;
  fotos: ContactPhoto[];
}

export interface ContactSearchCity {
  id?: string;
  nome: string;
  uf: string;
}

export interface ContactSearchResult {
  id: string;
  nome: string;
  telefone: string | null;
  endereco: string | null;
  status: ContactStatus | string;
  cidadeId: string;
  cidade: ContactSearchCity;
}

export interface ContactPayload {
  nome: string;
  cidadeId: string;
  telefone?: string;
  endereco?: string;
  origem?: string;
  indicadoPor?: string;
  dataPrimeiroContato?: string;
  dataAvaliacao?: string;
  autorizouFoto?: boolean;
  natural?: boolean;
  cor?: string;
  textura?: string;
  quimica?: string;
  comprimentoCm?: number;
  observacoes?: string;
}

export type UpdateContactPayload = Partial<ContactPayload>;

export interface CreateContactWithPurchasePayload {
  contato: ContactPayload;
  compra: Omit<RegisterPurchasePayload, "visitaId">;
}

export interface CreateContactWithPurchaseResponse {
  contato: ContactListItem;
  compra: ContactPurchase;
}

export interface ChangeContactStatusPayload {
  status: ContactStatus;
  motivoPerda?: string;
}

export interface ContactExportFilters {
  status?: ContactStatus;
  cidadeId?: string;
  origem?: string;
  natural?: boolean;
}
