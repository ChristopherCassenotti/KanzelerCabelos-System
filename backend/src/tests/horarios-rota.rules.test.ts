import "temporal-polyfill/full/global";

import {
  describe,
  expect,
  it,
} from "vitest";

import { calcularHorariosRota } from "../services/horarios-rota.rules";

describe("Cálculo de horários da rota", () => {
  it("calcula horários das visitas pela ordem", () => {
    const resultado =
      calcularHorariosRota({
        horaSaida:
          Temporal.PlainTime.from(
            "08:00",
          ),

        minutosPorVisita: 40,

        itens: [
          {
            id: "visita-1",
            tipo: "visita",
            ordem: 1,
          },
          {
            id: "visita-2",
            tipo: "visita",
            ordem: 2,
          },
          {
            id: "visita-3",
            tipo: "visita",
            ordem: 3,
          },
        ],
      });

    expect(
      resultado[0]?.hora?.toString(),
    ).toBe("08:10:00");

    expect(
      resultado[1]?.hora?.toString(),
    ).toBe("09:00:00");

    expect(
      resultado[2]?.hora?.toString(),
    ).toBe("09:50:00");
  });

  it("mantém horário manual de tarefa", () => {
    const resultado =
      calcularHorariosRota({
        horaSaida:
          Temporal.PlainTime.from(
            "08:00",
          ),

        minutosPorVisita: 40,

        itens: [
          {
            id: "tarefa-1",
            tipo: "tarefa",
            ordem: 1,
            hora:
              Temporal.PlainTime.from(
                "07:30",
              ),
          },

          {
            id: "visita-1",
            tipo: "visita",
            ordem: 2,
          },
        ],
      });

    expect(
      resultado[0]?.hora?.toString(),
    ).toBe("07:30:00");

    expect(
      resultado[1]?.hora?.toString(),
    ).toBe("08:10:00");
  });

  it("arredonda para múltiplos de 5 minutos", () => {
    const resultado =
      calcularHorariosRota({
        horaSaida:
          Temporal.PlainTime.from(
            "08:03",
          ),

        minutosPorVisita: 40,

        itens: [
          {
            id: "visita-1",
            tipo: "visita",
            ordem: 1,
          },
        ],
      });

    expect(
      resultado[0]?.hora?.toString(),
    ).toBe("08:15:00");
  });
});