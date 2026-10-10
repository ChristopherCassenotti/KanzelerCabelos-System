interface RoutingApiLeg {
  distance: number;
  time: number;
  polyline6?: string;
}

interface RoutingApiResult {
  distance: number;
  time: number;
  legs?: RoutingApiLeg[];
  polyline6?: string;
}

interface RoutingApiResponse {
  results: RoutingApiResult[];
}

export interface PontoRota {
  lat: number;
  lng: number;
}

export interface CalcularTrechoInput {
  origem: PontoRota;
  destino: PontoRota;
}

export interface CalcularTrechoResult {
  distanciaKm: number;
  duracaoMin: number;
}

export interface CalcularRotaInput {
  pontos: PontoRota[];
}

export interface TrechoRotaResult {
  indice: number;
  distanciaKm: number;
  duracaoMin: number;
  polyline6: string | null;
}

export interface CalcularRotaResult {
  distanciaKm: number;
  duracaoMin: number;

  trechos: TrechoRotaResult[];

  polyline6: string | null;
}

export class RoutingService {
  private getApiKey() {
    const apiKey =
      process.env["GEOAPIFY_API_KEY"];

    if (!apiKey) {
      throw new Error(
        "GEOAPIFY_API_KEY não configurada",
      );
    }

    return apiKey;
  }

  async calcularRota(
    input: CalcularRotaInput,
  ): Promise<CalcularRotaResult | null> {
    if (input.pontos.length < 2) {
      throw new Error(
        "Informe pelo menos dois pontos para calcular a rota",
      );
    }

    const apiKey = this.getApiKey();

    const url = new URL(
      "https://api.geoapify.com/v1/routing",
    );

    const waypoints = input.pontos
      .map(
        (ponto) =>
          `${ponto.lat},${ponto.lng}`,
      )
      .join("|");

    url.searchParams.set(
      "waypoints",
      waypoints,
    );

    url.searchParams.set(
      "mode",
      "drive",
    );

    url.searchParams.set(
      "format",
      "json",
    );

    url.searchParams.set(
      "units",
      "metric",
    );

    url.searchParams.set(
      "intermediate_waypoint_mode",
      "stopover",
    );

    url.searchParams.set(
      "details",
      "polyline6",
    );

    url.searchParams.set(
      "apiKey",
      apiKey,
    );

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Erro ao consultar rota: ${response.status}`,
      );
    }

    const data =
      (await response.json()) as RoutingApiResponse;

    const rota = data.results[0];

    if (!rota) {
      return null;
    }

    const trechos =
      rota.legs?.map(
        (leg, indice) => ({
          indice,

          distanciaKm:
            Math.round(
              (leg.distance / 1000) *
                100,
            ) / 100,

          duracaoMin:
            Math.ceil(
              leg.time / 60,
            ),

          polyline6:
            leg.polyline6 ?? null,
        }),
      ) ?? [];

    return {
      distanciaKm:
        Math.round(
          (rota.distance / 1000) * 100,
        ) / 100,

      duracaoMin:
        Math.ceil(
          rota.time / 60,
        ),

      trechos,

      polyline6:
        rota.polyline6 ?? null,
    };
  }

  async calcularTrecho(
    input: CalcularTrechoInput,
  ): Promise<CalcularTrechoResult | null> {
    const rota =
      await this.calcularRota({
        pontos: [
          input.origem,
          input.destino,
        ],
      });

    if (!rota) {
      return null;
    }

    return {
      distanciaKm:
        rota.distanciaKm,

      duracaoMin:
        rota.duracaoMin,
    };
  }
}