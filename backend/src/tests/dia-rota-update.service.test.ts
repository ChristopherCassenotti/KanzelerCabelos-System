import "temporal-polyfill/full/global";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { DiaRotaService } from "../services/dia-rota.service";

import type { DiaRotaRepository } from "../repositories/dia-rota.repository";
import type { CidadeRepository } from "../repositories/cidade.repository";

describe("DiaRotaService - atualização", () => {
  it("atualiza configurações da rota", async () => {
    const update = vi
      .fn()
      .mockResolvedValue({
        id: "rota-1",
      });

    const service = new DiaRotaService(
      {
        findById:
          vi.fn().mockResolvedValue({
            id: "rota-1",
          }),

        update,
      } as unknown as DiaRotaRepository,

      {
        findById:
          vi.fn().mockResolvedValue({
            id: "cidade-1",
          }),
      } as unknown as CidadeRepository,
    );

    const resultado =
      await service.atualizar(
        "rota-1",
        {
          partidaCidadeId:
            "11111111-1111-4111-8111-111111111111",

          horaSaida: "07:00",
          minutosPorVisita: 45,
          custoCombustivel: "200.00",
        },
      );

    expect(resultado.tipo).toBe(
      "sucesso",
    );

    const dados =
      update.mock.calls[0]?.[1];

    expect(
      dados.horaSaida.toString(),
    ).toBe("07:00:00");

    expect(
      dados.minutosPorVisita,
    ).toBe(45);

    expect(
      dados.custoCombustivel,
    ).toBe("200.00");
  });

  it("não atualiza rota inexistente", async () => {
    const update = vi.fn();

    const service = new DiaRotaService(
      {
        findById:
          vi.fn().mockResolvedValue(null),

        update,
      } as unknown as DiaRotaRepository,

      {} as CidadeRepository,
    );

    const resultado =
      await service.atualizar(
        "rota-inexistente",
        {
          minutosPorVisita: 50,
        },
      );

    expect(resultado.tipo).toBe(
      "rota_nao_encontrada",
    );

    expect(update).not.toHaveBeenCalled();
  });

  it("não aceita cidade de partida inexistente", async () => {
    const update = vi.fn();

    const service = new DiaRotaService(
      {
        findById:
          vi.fn().mockResolvedValue({
            id: "rota-1",
          }),

        update,
      } as unknown as DiaRotaRepository,

      {
        findById:
          vi.fn().mockResolvedValue(null),
      } as unknown as CidadeRepository,
    );

    const resultado =
      await service.atualizar(
        "rota-1",
        {
          partidaCidadeId:
            "11111111-1111-4111-8111-111111111111",
        },
      );

    expect(resultado.tipo).toBe(
      "cidade_nao_encontrada",
    );

    expect(update).not.toHaveBeenCalled();
  });
});