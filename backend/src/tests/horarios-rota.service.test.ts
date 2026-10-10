import "temporal-polyfill/full/global";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { HorariosRotaService } from "../services/horarios-rota.service";

import type { DiaRotaRepository } from "../repositories/dia-rota.repository";
import type { ItemRotaRepository } from "../repositories/item-rota.repository";
import type { RoutingService } from "../services/routing.service";

describe("HorariosRotaService", () => {
it("calcula a rota completa em uma única chamada", async () => {
  const atualizarHorarios = vi
    .fn()
    .mockImplementation(
      async (_rotaId, horarios) =>
        horarios,
    );

  const atualizarMetricas = vi
    .fn()
    .mockResolvedValue({
      id: "rota-1",
    });

  const calcularRota = vi
    .fn()
    .mockResolvedValue({
      distanciaKm: 12,
      duracaoMin: 20,

      trechos: [
        {
          indice: 0,
          distanciaKm: 5,
          duracaoMin: 10,
          polyline6: null,
        },
        {
          indice: 1,
          distanciaKm: 7,
          duracaoMin: 10,
          polyline6: null,
        },
      ],

      polyline6: "rota-completa",
    });

  const calcularTrecho = vi.fn();

  const diaRepository = {
    findDetailedById:
      vi.fn().mockResolvedValue({
        id: "rota-1",

        horaSaida:
          Temporal.PlainTime.from(
            "08:00",
          ),

        minutosPorVisita: 40,

        partidaCidade: {
          lat: "-26.2300",
          lng: "-51.0800",
        },

        itens: [
          {
            id: "visita-1",
            tipo: "visita",
            ordem: 1,
            hora: null,

            contato: {
              lat: "-26.2400",
              lng: "-51.0900",
            },
          },

          {
            id: "visita-2",
            tipo: "visita",
            ordem: 2,
            hora: null,

            contato: {
              lat: "-26.2500",
              lng: "-51.1000",
            },
          },
        ],
      }),

    atualizarMetricas,
  } as unknown as DiaRotaRepository;

  const service =
    new HorariosRotaService(
      diaRepository,

      {
        atualizarHorarios,
      } as unknown as ItemRotaRepository,

      {
        calcularRota,
        calcularTrecho,
      } as unknown as RoutingService,
    );

  const resultado =
    await service.calcular("rota-1");

  expect(resultado.tipo).toBe(
    "sucesso",
  );

  expect(calcularRota)
    .toHaveBeenCalledOnce();

  expect(calcularRota)
    .toHaveBeenCalledWith({
      pontos: [
        {
          lat: -26.23,
          lng: -51.08,
        },
        {
          lat: -26.24,
          lng: -51.09,
        },
        {
          lat: -26.25,
          lng: -51.1,
        },
      ],
    });

  expect(calcularTrecho)
    .not.toHaveBeenCalled();

expect(
  atualizarMetricas,
).toHaveBeenCalledWith(
  "rota-1",
  "12.00",
  20,
  "rota-completa",
);

  const horarios =
    atualizarHorarios.mock.calls[0]?.[1];

  expect(
    horarios[0]?.hora?.toString(),
  ).toBe("08:10:00");

  expect(
    horarios[1]?.hora?.toString(),
  ).toBe("09:00:00");
});

  it("não calcula horários para rota inexistente", async () => {
    const atualizarHorarios = vi.fn();
    const calcularTrecho = vi.fn();

    const service =
      new HorariosRotaService(
        {
          findDetailedById:
            vi.fn().mockResolvedValue(
              null,
            ),
        } as unknown as DiaRotaRepository,

        {
          atualizarHorarios,
        } as unknown as ItemRotaRepository,

        {
          calcularTrecho,
        } as unknown as RoutingService,
      );

    const resultado =
      await service.calcular(
        "rota-inexistente",
      );

    expect(resultado.tipo).toBe(
      "rota_nao_encontrada",
    );

    expect(
      atualizarHorarios,
    ).not.toHaveBeenCalled();

    expect(
      calcularTrecho,
    ).not.toHaveBeenCalled();
  });

  it("não calcula rota sem itens", async () => {
    const atualizarHorarios = vi.fn();
    const calcularTrecho = vi.fn();

    const service =
      new HorariosRotaService(
        {
          findDetailedById:
            vi.fn().mockResolvedValue({
              id: "rota-1",

              horaSaida:
                Temporal.PlainTime.from(
                  "08:00",
                ),

              minutosPorVisita: 40,

              partidaCidade: {
                lat: "-26.2300",
                lng: "-51.0800",
              },

              itens: [],
            }),
        } as unknown as DiaRotaRepository,

        {
          atualizarHorarios,
        } as unknown as ItemRotaRepository,

        {
          calcularTrecho,
        } as unknown as RoutingService,
      );

    const resultado =
      await service.calcular(
        "rota-1",
      );

    expect(resultado.tipo).toBe(
      "rota_sem_itens",
    );

    expect(
      atualizarHorarios,
    ).not.toHaveBeenCalled();

    expect(
      calcularTrecho,
    ).not.toHaveBeenCalled();
  });

  it("tarefa não altera o ponto físico da rota", async () => {
    const atualizarMetricas = vi
      .fn()
      .mockResolvedValue({
        id: "rota-1",
      });

    const atualizarHorarios = vi
      .fn()
      .mockImplementation(
        async (_rotaId, horarios) =>
          horarios,
      );

    const calcularTrecho = vi
      .fn()
      .mockResolvedValueOnce({
        distanciaKm: 5,
        duracaoMin: 10,
      })
      .mockResolvedValueOnce({
        distanciaKm: 8,
        duracaoMin: 15,
      });

    const service =
      new HorariosRotaService(
        {
          findDetailedById:
            vi.fn().mockResolvedValue({
              id: "rota-1",

              horaSaida:
                Temporal.PlainTime.from(
                  "08:00",
                ),

              minutosPorVisita: 40,

              partidaCidade: {
                lat: "-26.2300",
                lng: "-51.0800",
              },

              itens: [
                {
                  id: "visita-1",
                  tipo: "visita",
                  ordem: 1,
                  hora: null,

                  contato: {
                    lat: "-26.2400",
                    lng: "-51.0900",
                  },
                },

                {
                  id: "tarefa-1",
                  tipo: "tarefa",
                  ordem: 2,

                  hora:
                    Temporal.PlainTime.from(
                      "09:30",
                    ),

                  contato: null,
                },

                {
                  id: "visita-2",
                  tipo: "visita",
                  ordem: 3,
                  hora: null,

                  contato: {
                    lat: "-26.2600",
                    lng: "-51.1100",
                  },
                },
              ],
            }),

          atualizarMetricas,
        } as unknown as DiaRotaRepository,

        {
          atualizarHorarios,
        } as unknown as ItemRotaRepository,

        {
          calcularTrecho,
        } as unknown as RoutingService,
      );

    await service.calcular("rota-1");

    expect(calcularTrecho)
      .toHaveBeenCalledTimes(2);

    expect(calcularTrecho)
      .toHaveBeenNthCalledWith(
        2,
        {
          origem: {
            lat: -26.24,
            lng: -51.09,
          },

          destino: {
            lat: -26.26,
            lng: -51.11,
          },
        },
      );

expect(
  atualizarMetricas,
).toHaveBeenCalledWith(
  "rota-1",
  "13.00",
  25,
  null,
);
  });
});