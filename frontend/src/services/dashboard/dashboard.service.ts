import { http } from "../api/http";
import type {
  DashboardRoute,
  DashboardSummary,
  MonthlyIndicators,
  PurchasesReport,
  ReadyRepurchase,
} from "../../types/dashboard";

export async function getDashboardSummary() {
  const response = await http.get<DashboardSummary>("/painel/resumo");
  return response.data;
}

export async function getReadyRepurchases() {
  const response = await http.get<ReadyRepurchase[]>("/recompras/prontas");
  return response.data;
}

export async function getCurrentMonthIndicators() {
  const response = await http.get<MonthlyIndicators>("/relatorios/indicadores", {
    params: { periodo: "mes_atual" },
  });

  return response.data;
}

export async function getCurrentMonthPurchasesReport() {
  const response = await http.get<PurchasesReport>("/relatorios/compras", {
    params: { periodo: "mes_atual" },
  });

  return response.data;
}

export async function getRoutesBetween(de: string, ate: string) {
  const response = await http.get<DashboardRoute[]>("/rotas", {
    params: { de, ate },
  });

  return response.data;
}
