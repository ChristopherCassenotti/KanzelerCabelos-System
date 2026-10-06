import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { ItemRotaService } from "../services/item-rota.service";

import type { ItemRotaRepository } from "../repositories/item-rota.repository";

describe("ItemRotaService", () => {
  it("conclui uma tarefa sem resultado", async () => {
    const concluir = vi
      .fn()
      .mockResolvedValue({
        id: "item-1",
        concluido: true,
      });

    const repository = {
      findById: vi.fn().mockResolvedValue({
        id: "item-1",
        diaRotaId: "rota-1",
        tipo: "tarefa",
        concluido: false,
      }),

      concluir,
    } as unknown as ItemRotaRepository;

    const service =
      new ItemRotaService(repository);

    const resultado = await service.concluir(
      "rota-1",
      "item-1",
      {},
    );

    expect(resultado.tipo).toBe("sucesso");

    expect(concluir).toHaveBeenCalledWith(
      "item-1",
      null,
    );
  });

  it("exige resultado para concluir visita", async () => {
    const concluir = vi.fn();

    const repository = {
      findById: vi.fn().mockResolvedValue({
        id: "visita-1",
        diaRotaId: "rota-1",
        tipo: "visita",
        concluido: false,
      }),

      concluir,
    } as unknown as ItemRotaRepository;

    const service =
      new ItemRotaService(repository);

    const resultado = await service.concluir(
      "rota-1",
      "visita-1",
      {},
    );

    expect(resultado.tipo).toBe(
      "resultado_obrigatorio",
    );

    expect(
      concluir,
    ).not.toHaveBeenCalled();
  });

  it("conclui visita com resultado", async () => {
    const concluir = vi
      .fn()
      .mockResolvedValue({
        id: "visita-1",
        concluido: true,
        resultado: "nao_atendeu",
      });

    const repository = {
      findById: vi.fn().mockResolvedValue({
        id: "visita-1",
        diaRotaId: "rota-1",
        tipo: "visita",
        concluido: false,
      }),

      concluir,
    } as unknown as ItemRotaRepository;

    const service =
      new ItemRotaService(repository);

    const resultado = await service.concluir(
      "rota-1",
      "visita-1",
      {
        resultado: "nao_atendeu",
      },
    );

    expect(resultado.tipo).toBe("sucesso");

    expect(concluir).toHaveBeenCalledWith(
      "visita-1",
      "nao_atendeu",
    );
  });

  it("sinaliza registro de compra quando resultado for comprou", async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue({
        id: "visita-1",
        diaRotaId: "rota-1",
        tipo: "visita",
        concluido: false,
      }),

      concluir: vi.fn().mockResolvedValue({
        id: "visita-1",
        concluido: true,
        resultado: "comprou",
      }),
    } as unknown as ItemRotaRepository;

    const service =
      new ItemRotaService(repository);

    const resultado = await service.concluir(
      "rota-1",
      "visita-1",
      {
        resultado: "comprou",
      },
    );

    expect(resultado.tipo).toBe("sucesso");

    if (resultado.tipo === "sucesso") {
      expect(
        resultado.exigeRegistroCompra,
      ).toBe(true);
    }
  });

  it("não conclui item pertencente a outra rota", async () => {
    const concluir = vi.fn();

    const repository = {
      findById: vi.fn().mockResolvedValue({
        id: "item-1",
        diaRotaId: "outra-rota",
        tipo: "tarefa",
        concluido: false,
      }),

      concluir,
    } as unknown as ItemRotaRepository;

    const service =
      new ItemRotaService(repository);

    const resultado = await service.concluir(
      "rota-1",
      "item-1",
      {},
    );

    expect(resultado.tipo).toBe(
      "item_nao_encontrado",
    );

    expect(
      concluir,
    ).not.toHaveBeenCalled();
  });
  it("remove um item da rota", async () => {
  const deletar = vi
    .fn()
    .mockResolvedValue(undefined);

  const repository = {
    findById: vi.fn().mockResolvedValue({
      id: "item-1",
      diaRotaId: "rota-1",
      tipo: "visita",
    }),

    delete: deletar,
  } as unknown as ItemRotaRepository;

  const service =
    new ItemRotaService(repository);

  const resultado = await service.remover(
    "rota-1",
    "item-1",
  );

  expect(resultado.tipo).toBe("sucesso");

    expect(deletar).toHaveBeenCalledWith(
        "item-1",
      );
    });

    it("não remove item pertencente a outra rota", async () => {
      const deletar = vi.fn();

      const repository = {
        findById: vi.fn().mockResolvedValue({
          id: "item-1",
          diaRotaId: "rota-2",
        }),

        delete: deletar,
      } as unknown as ItemRotaRepository;

      const service =
        new ItemRotaService(repository);

      const resultado = await service.remover(
        "rota-1",
        "item-1",
      );

      expect(resultado.tipo).toBe(
        "item_nao_encontrado",
      );

      expect(deletar).not.toHaveBeenCalled();
    });
});