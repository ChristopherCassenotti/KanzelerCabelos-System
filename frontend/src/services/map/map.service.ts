import { http } from "../api/http";
import type { GlobalMapFilters, GlobalMapResponse } from "../../types/map";

export async function getGlobalMap(filters: GlobalMapFilters = {}) {
  const response = await http.get<GlobalMapResponse>("/mapa", {
    params: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.cidadeId ? { cidadeId: filters.cidadeId } : {}),
      ...(filters.soProntasRecompra !== undefined
        ? { soProntasRecompra: String(filters.soProntasRecompra) }
        : {}),
      ...(filters.dataRota ? { dataRota: filters.dataRota } : {}),
    },
  });

  return response.data;
}
