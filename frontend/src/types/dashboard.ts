export type NumericLike = number | string | null | undefined;

export interface DashboardContactsSummary {
  total: number;
  lead: number;
  avaliacaoAgendada: number;
  comprado: number;
  perdido: number;
}

export interface DashboardScheduleCitySummary {
  cidadeId: string;
  nome: string;
  total: number;
}

export interface DashboardScheduleSummary {
  total: number;
  tipos: {
    lead: number;
    avaliacao: number;
    recompra: number;
  };
  cidades: DashboardScheduleCitySummary[];
}

export interface DashboardRouteContact {
  id: string;
  nome: string;
  telefone?: string | null;
  status?: string;
  cidade?: {
    id?: string;
    nome: string;
    uf?: string;
  } | null;
}

export interface DashboardRouteItem {
  id: string;
  tipo: "visita" | "tarefa" | string;
  titulo?: string | null;
  hora?: string | null;
  concluido?: boolean;
  contatoId?: string | null;
  contato?: DashboardRouteContact | null;
}

export interface DashboardRoute {
  id: string;
  data: string;
  horaSaida?: string | null;
  partidaCidadeId?: string;
  partidaCidade?: {
    id?: string;
    nome: string;
    uf?: string;
  } | null;
  itens?: DashboardRouteItem[];
}

export interface DashboardSummary {
  contatos: DashboardContactsSummary;
  aAgendar: DashboardScheduleSummary;
  rotas: {
    proximas30Dias: DashboardRoute[];
  };
}

export interface ReadyRepurchase {
  contatoId: string;
  nome: string;
  telefone: string | null;
  cidade: {
    id: string;
    nome: string;
    uf: string;
  };
  ultimaCompraId: string;
  ultimoCorte: string;
  cicloRecompraMeses: number;
  proximaRecompra: string;
  diasAte: number;
  pronta: boolean;
}

export interface MonthlyIndicators {
  periodo: string;
  totalComprado: NumericLike;
  quantidadeCompras: number;
  ticketMedio: NumericLike;
  pesoCompradoG: NumericLike;
  precoMedioPorGrama: NumericLike;
  lucroRevenda: NumericLike;
  conversao: NumericLike;
}

export interface PurchasesByCityItem {
  cidade: string;
  quantidade: number;
  valor: NumericLike;
}

export interface PurchasesByMonthItem {
  mes: string;
  quantidade: number;
  valor: NumericLike;
}

export interface PurchasesReport {
  periodo: string;
  porCidade: PurchasesByCityItem[];
  porMes: PurchasesByMonthItem[];
}
