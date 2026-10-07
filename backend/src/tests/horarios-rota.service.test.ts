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

describe("HorariosRotaService", () => {
  it("calcula e salva os horários da rota", async () => {
    const atualizarHorarios = vi
      .fn()
      .mockResolvedValue([
        {
          id: "visita-1",
          hora:
            Temporal.PlainTime.from(
              "08:10",
            ),
        },
        {
          id: "visita-2",
          hora:
            Temporal.PlainTime.from(
              "09:00",
            ),
        },
      ]);

    const diaRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "rota-1",

        horaSaida:
          Temporal.PlainTime.from(
            "08:00",
          ),

        minutosPorVisita: 40,
      }),
    } as unknown as DiaRotaRepository;

    const itemRepository = {
      findByDiaRotaId:
        vi.fn().mockResolvedValue([
          {
            id: "visita-1",
            tipo: "visita",
            ordem: 1,
            hora: null,
          },
          {
            id: "visita-2",
            tipo: "visita",
            ordem: 2,
            hora: null,
          },
        ]),

      atualizarHorarios,
    } as unknown as ItemRotaRepository;

    const service =
      new HorariosRotaService(
        diaRepository,
        itemRepository,
      );

    const resultado =
      await service.calcular("rota-1");

    expect(resultado.tipo).toBe(
      "sucesso",
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

    const service =
      new HorariosRotaService(
        {
          findById:
            vi.fn().mockResolvedValue(null),
        } as unknown as DiaRotaRepository,

        {
          atualizarHorarios,
        } as unknown as ItemRotaRepository,
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
  });

  it("não calcula rota sem itens", async () => {
    const atualizarHorarios = vi.fn();

    const service =
      new HorariosRotaService(
        {
          findById:
            vi.fn().mockResolvedValue({
              id: "rota-1",

              horaSaida:
                Temporal.PlainTime.from(
                  "08:00",
                ),

              minutosPorVisita: 40,
            }),
        } as unknown as DiaRotaRepository,

        {
          findByDiaRotaId:
            vi.fn().mockResolvedValue([]),

          atualizarHorarios,
        } as unknown as ItemRotaRepository,
      );

    const resultado =
      await service.calcular("rota-1");

    expect(resultado.tipo).toBe(
      "rota_sem_itens",
    );

    expect(
      atualizarHorarios,
    ).not.toHaveBeenCalled();
  });
});