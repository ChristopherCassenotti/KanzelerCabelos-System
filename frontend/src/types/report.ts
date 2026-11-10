export type ReportPeriod = "todo" | "mes_atual" | "30" | "90" | "365";
export type ReportNumeric = number | string | null | undefined;

export interface ReportIndicators {
  periodo: string;
  totalComprado: ReportNumeric;
  quantidadeCompras: number;
  ticketMedio: ReportNumeric;
  pesoCompradoG: ReportNumeric;
  precoMedioPorGrama: ReportNumeric;
  lucroRevenda: ReportNumeric;
  conversao: ReportNumeric;
}

export interface PurchasesByCityReportItem {
  cidade: string;
  quantidade: number;
  valor: ReportNumeric;
}

export interface PurchasesByMonthReportItem {
  mes: string;
  quantidade: number;
  valor: ReportNumeric;
}

export interface PurchasesReport {
  periodo: string;
  porCidade: PurchasesByCityReportItem[];
  porMes: PurchasesByMonthReportItem[];
}

export interface AveragePriceItem {
  categoria: string;
  precoMedioPorGrama: ReportNumeric;
  quantidade: number;
}

export interface AveragePriceReport {
  porCor: AveragePriceItem[];
  porTextura: AveragePriceItem[];
}

export interface OriginReportItem {
  origem: string;
  contatos: number;
  compras: number;
  conversao: ReportNumeric;
  valor: ReportNumeric;
}

export interface LossReportItem {
  motivo: string;
  quantidade: number;
}

export interface OriginsLossesReport {
  origens: OriginReportItem[];
  perdas: LossReportItem[];
}

export interface ConversionCityReportItem {
  cidade: string;
  contatos: number;
  avaliacoes: number;
  compras: number;
  conversao: ReportNumeric;
  valor?: ReportNumeric;
}

export interface TripReportItem {
  diaRotaId: string;
  data: string;
  cidades: string[];
  visitas: number;
  compras: number;
  pesoCompradoG: ReportNumeric;
  totalPago: ReportNumeric;
  custos: ReportNumeric;
  custoPorGrama: ReportNumeric;
  totalRevenda: ReportNumeric;
  resultado: ReportNumeric;
  quantidadeRevendidas: number;
  quantidadeARevender: number;
}

export interface TripsReport {
  periodo: string;
  total: number;
  viagens: TripReportItem[];
}

export interface PurchaseDetailReportItem {
  compraId: string;
  contatoId: string;
  nome: string;
  cidade: string;
  dataCorte: string;
  cor: string | null;
  textura: string | null;
  comprimentoCm: number | null;
  pesoG: number | null;
  valorPago: ReportNumeric;
  precoPorGrama: ReportNumeric;
  valorRevenda: ReportNumeric;
  quimica?: string | null;
  formaPagamento?: string | null;
  dataRevenda?: string | null;
  comprador?: string | null;
}

export interface RepurchaseForecastNormalizedRow {
  cidade: string;
  vencidas: number;
  meses: number[];
  total: number;
}

export interface RepurchaseForecastNormalized {
  meses: string[];
  rows: RepurchaseForecastNormalizedRow[];
}
