import "temporal-polyfill/full/global";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { RemarcarVisitaService } from "../services/remarcar-visita.service";

import type { ItemRotaRepository } from "../repositories/item-rota.repository";
import type { DiaRotaRepository } from "../repositories/dia-rota.repository";

describe("RemarcarVisitaService", () => {
  it("move a visita para o dia seguinte", async () => {
    const remarcar = vi
      .fn()
      .mockResolvedValue({
        id: "visita-1",
        diaRotaId: "rota-2",
        concluido: false,
        resultado: "remarcar",
      });

    const itemRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "visita-1",
        diaRotaId: "rota-1",
        tipo: "visita",
        concluido: true,
      }),

      remarcar,
    } as unknown as ItemRotaRepository;

    const diaRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "rota-1",

        data:
          Temporal.PlainDate.from(
            "2026-10-15",
          ),

        partidaCidadeId: "cidade-1",

        horaSaida:
          Temporal.PlainTime.from(
            "08:00",
          ),

        minutosPorVisita: 40,
      }),

      findByDate: vi.fn().mockResolvedValue({
        id: "rota-2",

        data:
          Temporal.PlainDate.from(
            "2026-10-16",
          ),
      }),

      create: vi.fn(),
    } as unknown as DiaRotaRepository;

    const service =
      new RemarcarVisitaService(
        itemRepository,
        diaRepository,
      );

    const resultado =
      await service.adiarParaDiaSeguinte(
        "rota-1",
        "visita-1",
      );

    expect(resultado.tipo).toBe(
      "sucesso",
    );

    expect(remarcar).toHaveBeenCalledWith(
      "visita-1",
      "rota-2",
    );

    if (resultado.tipo === "sucesso") {
      expect(
        resultado.novaData.toString(),
      ).toBe("2026-10-16");
    }
  });

  it("cria o próximo dia de rota quando ainda não existir", async () => {
    const criarDia = vi
      .fn()
      .mockResolvedValue({
        id: "rota-nova",
      });

    const remarcar = vi.fn();

    const service =
      new RemarcarVisitaService(
        {
          findById:
            vi.fn().mockResolvedValue({
              id: "visita-1",
              diaRotaId: "rota-1",
              tipo: "visita",
            }),

          remarcar,
        } as unknown as ItemRotaRepository,

        {
          findById:
            vi.fn().mockResolvedValue({
              id: "rota-1",

              data:
                Temporal.PlainDate.from(
                  "2026-10-15",
                ),

              partidaCidadeId: "cidade-1",

              horaSaida:
                Temporal.PlainTime.from(
                  "08:00",
                ),

              minutosPorVisita: 40,
            }),

          findByDate:
            vi.fn().mockResolvedValue(null),

          create: criarDia,
        } as unknown as DiaRotaRepository,
      );

    await service.adiarParaDiaSeguinte(
      "rota-1",
      "visita-1",
    );

    expect(criarDia).toHaveBeenCalledWith({
      data:
        Temporal.PlainDate.from(
          "2026-10-16",
        ),

      partidaCidadeId: "cidade-1",

      horaSaida:
        Temporal.PlainTime.from(
          "08:00",
        ),

      minutosPorVisita: 40,
    });

    expect(remarcar).toHaveBeenCalledWith(
      "visita-1",
      "rota-nova",
    );
  });

  it("não permite adiar uma tarefa", async () => {
    const remarcar = vi.fn();

    const service =
      new RemarcarVisitaService(
        {
          findById:
            vi.fn().mockResolvedValue({
              id: "tarefa-1",
              diaRotaId: "rota-1",
              tipo: "tarefa",
            }),

          remarcar,
        } as unknown as ItemRotaRepository,

        {
          findById:
            vi.fn().mockResolvedValue({
              id: "rota-1",

              data:
                Temporal.PlainDate.from(
                  "2026-10-15",
                ),
            }),
        } as unknown as DiaRotaRepository,
      );

    const resultado =
      await service.adiarParaDiaSeguinte(
        "rota-1",
        "tarefa-1",
      );

    expect(resultado.tipo).toBe(
      "item_nao_visita",
    );

    expect(remarcar).not.toHaveBeenCalled();
  });
});