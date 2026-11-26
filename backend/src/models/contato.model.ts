import type { CABELO_DE } from "../schemas/contato.schema";

export type CabeloDe = (typeof CABELO_DE)[number];

export interface CriarContatoModel {
  nome: string;
  cidadeId: string;

  telefone: string | null;
  endereco: string | null;

  lat: string | null;
  lng: string | null;
  geoFonte: string | null;
  geoPlaceId: string | null;

  origem: string | null;
  indicadoPor: string | null;
  dataPrimeiroContato:
    Temporal.PlainDate | null;

  dataAvaliacao:
    Temporal.PlainDate | null;

  autorizouFoto: boolean;

  natural: boolean | null;

  cor: string | null;
  textura: string | null;
  quimica: string | null;

  comprimentoCm: number | null;

  cabeloDe: CabeloDe | null;
  nomeDonoCabelo: string | null;
  idadeDonoCabelo: number | null;

  observacoes: string | null;
}

export interface AtualizarContatoModel {
  nome?: string;
  telefone?: string | null;
  cidadeId?: string;
  endereco?: string | null;

  autorizouFoto?: boolean;

  lat?: string | null;
  lng?: string | null;
  geoFonte?: string | null;
  geoPlaceId?: string | null;

  origem?: string | null;
  indicadoPor?: string | null;
  dataPrimeiroContato?:
    Temporal.PlainDate | null;

  dataAvaliacao?:
    Temporal.PlainDate | null;

  natural?: boolean | null;

  cor?: string | null;
  textura?: string | null;
  quimica?: string | null;

  comprimentoCm?: number | null;

  cabeloDe?: CabeloDe | null;
  nomeDonoCabelo?: string | null;
  idadeDonoCabelo?: number | null;

  observacoes?: string | null;
}