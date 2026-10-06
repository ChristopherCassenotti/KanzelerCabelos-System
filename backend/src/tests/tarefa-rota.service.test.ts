import "temporal-polyfill/full/global";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { TarefaRotaService } from "../services/tarefa-rota.service";

import type { DiaRotaRepository } from "../repositories/dia-rota.repository";
import type { ItemRotaRepository } from "../repositories/item-rota.repository";

describe("TarefaRotaService", () => {
  it("não cria tarefa em rota inexistente", async () => {
    const itemRepository = {
      criarTarefa: vi.fn(),
    } as unknown as ItemRotaRepository;

    const diaRepository = {
      findById: vi.fn().mockResolvedValue(null),
    } as unknown as DiaRotaRepository;

    const service = new TarefaRotaService(
      itemRepository,
      diaRepository,
    );

    const resultado = await service.criar(
      "rota-inexistente",
      {
        titulo: "Abastecer a van",
      },
    );

    expect(resultado.tipo).toBe(
      "rota_nao_encontrada",
    );

    expect(
      itemRepository.criarTarefa,
    ).not.toHaveBeenCalled();
  });

  it("cria tarefa com título e horário", async () => {
    const criarTarefa = vi
      .fn()
      .mockResolvedValue({
        id: "tarefa-1",
      });

    const service = new TarefaRotaService(
      {
        criarTarefa,
      } as unknown as ItemRotaRepository,

      {
        findById: vi.fn().mockResolvedValue({
          id: "rota-1",
        }),
      } as unknown as DiaRotaRepository,
    );

    const resultado = await service.criar(
      "rota-1",
      {
        titulo: "Abastecer a van",
        hora: "07:30",
      },
    );

    expect(resultado.tipo).toBe("sucesso");

    const dados =
      criarTarefa.mock.calls[0]?.[0];

    expect(dados.diaRotaId).toBe("rota-1");
    expect(dados.titulo).toBe(
      "Abastecer a van",
    );

    expect(
      dados.hora.toString(),
    ).toBe("07:30:00");
  });
});