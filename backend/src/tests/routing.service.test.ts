import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { RoutingService } from "../services/routing.service";

describe("RoutingService", () => {
  afterEach(() => {
    vi.restoreAllMocks();

    delete process.env[
      "GEOAPIFY_API_KEY"
    ];
  });

  it("retorna distância e duração da rota", async () => {
    process.env[
      "GEOAPIFY_API_KEY"
    ] = "chave-teste";

    vi.spyOn(
      globalThis,
      "fetch",
    ).mockResolvedValue({
      ok: true,
      status: 200,

      json: async () => ({
        results: [
          {
            distance: 15420,
            time: 1260,
          },
        ],
      }),
    } as Response);

    const service =
      new RoutingService();

    const resultado =
      await service.calcularTrecho({
        origem: {
          lat: -26.23,
          lng: -51.08,
        },

        destino: {
          lat: -26.30,
          lng: -51.15,
        },
      });

    expect(resultado).toEqual({
      distanciaKm: 15.42,
      duracaoMin: 21,
    });
  });

  it("retorna null quando nenhuma rota é encontrada", async () => {
    process.env[
      "GEOAPIFY_API_KEY"
    ] = "chave-teste";

    vi.spyOn(
      globalThis,
      "fetch",
    ).mockResolvedValue({
      ok: true,
      status: 200,

      json: async () => ({
        results: [],
      }),
    } as Response);

    const service =
      new RoutingService();

    const resultado =
      await service.calcularTrecho({
        origem: {
          lat: -26.23,
          lng: -51.08,
        },

        destino: {
          lat: -26.30,
          lng: -51.15,
        },
      });

    expect(resultado).toBeNull();
  });

  it("bloqueia sem chave configurada", async () => {
    const service =
      new RoutingService();

    await expect(
      service.calcularTrecho({
        origem: {
          lat: -26.23,
          lng: -51.08,
        },

        destino: {
          lat: -26.30,
          lng: -51.15,
        },
      }),
    ).rejects.toThrow(
      "GEOAPIFY_API_KEY não configurada",
    );
  });
});