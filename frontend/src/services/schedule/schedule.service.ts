import { http } from "../api/http";
import type { City } from "../../types/contact";
import type {
  AddVisitPayload,
  CompleteItemPayload,
  CreateRoutePayload,
  CreateTaskPayload,
  RouteDay,
  RouteMapDto,
  RouteOperationResult,
  ScheduleCandidate,
  ScheduleCandidateApi,
  ScheduleCandidateType,
  ScheduleSummary,
  UpdateRoutePayload,
} from "../../types/schedule";

function normalizeCandidate(item: ScheduleCandidateApi): ScheduleCandidate {
  if ("contato" in item) {
    return {
      ...item.contato,
      tipoAgendamento: item.tipoAgendamento,
      recompra: item.recompra,
    };
  }

  return item;
}

export async function listScheduleCandidates(filters: {
  cidadeId?: string;
  tipo?: ScheduleCandidateType;
} = {}) {
  const response = await http.get<ScheduleCandidateApi[]>("/a-agendar", {
    params: filters,
  });

  return response.data.map(normalizeCandidate);
}

export async function getScheduleSummary() {
  const response = await http.get<ScheduleSummary>("/a-agendar/resumo");
  return response.data;
}

export async function listRoutes(de: string, ate: string) {
  const response = await http.get<RouteDay[]>("/rotas", {
    params: { de, ate },
  });

  return response.data;
}

export async function getRoute(routeId: string) {
  const response = await http.get<RouteDay>(`/rotas/${routeId}`);
  return response.data;
}

export async function createRoute(payload: CreateRoutePayload) {
  const response = await http.post<RouteDay>("/rotas", payload);
  return response.data;
}

/** Rota do dia, criada com a cidade de partida padrão se ainda não existir. */
export async function ensureRouteForDate(date: string, cities: City[]) {
  const existing = (await listRoutes(date, date)).find((route) => route.data === date);
  if (existing) return existing;

  const defaultCity = cities.find((city) => city.nome === "União da Vitória") ?? cities[0];
  if (!defaultCity) throw new Error("Nenhuma cidade cadastrada para criar a rota.");

  return createRoute({
    data: date,
    partidaCidadeId: defaultCity.id,
    horaSaida: "08:00",
    minutosPorVisita: 40,
    custoCombustivel: "0.00",
    custoAlimentacao: "0.00",
    custoHospedagem: "0.00",
    custoOutros: "0.00",
  });
}

export async function updateRoute(routeId: string, payload: UpdateRoutePayload) {
  const response = await http.patch<{ tipo: string; rota: RouteDay }>(`/rotas/${routeId}`, payload);
  return response.data.rota;
}

export async function addVisit(routeId: string, payload: AddVisitPayload) {
  const response = await http.post<RouteOperationResult>(`/rotas/${routeId}/visitas`, payload);
  return response.data;
}

export async function createTask(routeId: string, payload: CreateTaskPayload) {
  const response = await http.post<RouteOperationResult>(`/rotas/${routeId}/tarefas`, payload);
  return response.data;
}

export async function completeRouteItem(routeId: string, itemId: string, payload: CompleteItemPayload) {
  const response = await http.patch<RouteOperationResult>(
    `/rotas/${routeId}/itens/${itemId}/concluir`,
    payload,
  );

  return response.data;
}

export async function removeRouteItem(routeId: string, itemId: string) {
  await http.delete(`/rotas/${routeId}/itens/${itemId}`);
}

export async function reorderRouteItems(routeId: string, itemIds: string[]) {
  const response = await http.patch<RouteOperationResult>(`/rotas/${routeId}/ordem`, {
    itemIds,
  });

  return response.data;
}

export async function postponeVisit(routeId: string, itemId: string) {
  const response = await http.patch<RouteOperationResult>(
    `/rotas/${routeId}/visitas/${itemId}/adiar`,
  );

  return response.data;
}

export async function calculateRouteTimes(routeId: string) {
  const response = await http.post<RouteOperationResult>(`/rotas/${routeId}/calcular-horarios`);
  return response.data;
}

export async function optimizeRoute(routeId: string) {
  const response = await http.post<RouteOperationResult>(
    `/rotas/${routeId}/itens/organizar-menor-distancia`,
  );

  return response.data;
}

export async function getRouteMap(routeId: string) {
  const response = await http.get<RouteMapDto>(`/rotas/${routeId}/mapa`);
  return response.data;
}

export async function exportRoute(routeId: string) {
  const response = await http.get<Blob>(`/export/rota/${routeId}`, {
    responseType: "blob",
  });

  return response.data;
}
