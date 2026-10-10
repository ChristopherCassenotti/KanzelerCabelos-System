import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { GeocodingService } from "../services/geocoding.service";

describe("GeocodingService", () => {
  afterEach(() => {
    vi.restoreAllMocks();

    delete process.env[
      "GEOAPIFY_API_KEY"
    ];
  });

  it("retorna coordenadas e place id", async () => {
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
            lat: -26.23,
            lon: -51.08,

            formatted:
              "Rua Teste, 123, Paraná, Brasil",

            place_id:
              "place-123",
          },
        ],
      }),
    } as Response);

    const service =
      new GeocodingService();

    const resultado =
      await service.buscarEndereco(
        "Rua Teste, 123",
      );

    expect(resultado).toEqual({
      lat: -26.23,
      lng: -51.08,
      geoPlaceId: "place-123",
      enderecoFormatado:
        "Rua Teste, 123, Paraná, Brasil",
    });
  });

  it("retorna null quando não encontra endereço", async () => {
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
      new GeocodingService();

    const resultado =
      await service.buscarEndereco(
        "Endereço inexistente",
      );

    expect(resultado).toBeNull();
  });

  it("bloqueia quando a chave não está configurada", async () => {
    const service =
      new GeocodingService();

    await expect(
      service.buscarEndereco(
        "Rua Teste",
      ),
    ).rejects.toThrow(
      "GEOAPIFY_API_KEY não configurada",
    );
  });
});