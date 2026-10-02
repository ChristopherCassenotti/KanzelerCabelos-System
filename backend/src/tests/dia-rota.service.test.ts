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

describe("DiaRotaService", () => {
  it("não cria rota para cidade inexistente", async () => {
    const diaRotaRepository = {
      findByDate: vi.fn(),
      create: vi.fn(),
    } as unknown as DiaRotaRepository;

    const cidadeRepository = {
      findById: vi.fn().mockResolvedValue(null),
    } as unknown as CidadeRepository;

    const service = new DiaRotaService(
      diaRotaRepository,
      cidadeRepository,
    );

    const resultado = await service.criar({
      data: "2026-10-10",
      partidaCidadeId:
        "11111111-1111-4111-8111-111111111111",
    });

    expect(resultado.tipo).toBe(
      "cidade_nao_encontrada",
    );

    expect(
      diaRotaRepository.create,
    ).not.toHaveBeenCalled();
  });

  it("não permite duas rotas na mesma data", async () => {
    const diaRotaRepository = {
      findByDate: vi.fn().mockResolvedValue({
        id: "rota-1",
      }),

      create: vi.fn(),
    } as unknown as DiaRotaRepository;

    const cidadeRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "cidade-1",
      }),
    } as unknown as CidadeRepository;

    const service = new DiaRotaService(
      diaRotaRepository,
      cidadeRepository,
    );

    const resultado = await service.criar({
      data: "2026-10-10",
      partidaCidadeId:
        "11111111-1111-4111-8111-111111111111",
    });

    expect(resultado.tipo).toBe(
      "data_ja_existe",
    );

    expect(
      diaRotaRepository.create,
    ).not.toHaveBeenCalled();
  });

  it("converte data e hora antes de salvar", async () => {
    const create = vi.fn().mockResolvedValue({
      id: "rota-1",
    });

    const diaRotaRepository = {
      findByDate: vi.fn().mockResolvedValue(null),
      create,
    } as unknown as DiaRotaRepository;

    const cidadeRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "cidade-1",
      }),
    } as unknown as CidadeRepository;

    const service = new DiaRotaService(
      diaRotaRepository,
      cidadeRepository,
    );

    const resultado = await service.criar({
      data: "2026-10-10",

      partidaCidadeId:
        "11111111-1111-4111-8111-111111111111",

      horaSaida: "07:30",
      minutosPorVisita: 45,
      custoCombustivel: "150.00",
    });

    expect(resultado.tipo).toBe("sucesso");

    const dados = create.mock.calls[0]?.[0];

    expect(
      dados.data.toString(),
    ).toBe("2026-10-10");

    expect(
      dados.horaSaida.toString(),
    ).toBe("07:30:00");

    expect(
      dados.minutosPorVisita,
    ).toBe(45);

    expect(
      dados.custoCombustivel,
    ).toBe("150.00");
  });
});