import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { ContatoStatusService } from "../services/contato-status.service";

import type { ContatoRepository } from "../repositories/contato.repository";

describe("ContatoStatusService", () => {
  it("exige motivo ao marcar como perdido", async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue({
        id: "contato-1",
        status: "lead",
      }),

      updateStatus: vi.fn(),
    } as unknown as ContatoRepository;

    const service =
      new ContatoStatusService(repository);

    const resultado = await service.alterar(
      "contato-1",
      "perdido",
    );

    expect(resultado.tipo).toBe(
      "motivo_obrigatorio",
    );

    expect(
      repository.updateStatus,
    ).not.toHaveBeenCalled();
  });

  it("salva o motivo ao marcar como perdido", async () => {
    const updateStatus = vi
      .fn()
      .mockResolvedValue({
        id: "contato-1",
        status: "perdido",
      });

    const repository = {
      findById: vi.fn().mockResolvedValue({
        id: "contato-1",
        status: "lead",
      }),

      updateStatus,
    } as unknown as ContatoRepository;

    const service =
      new ContatoStatusService(repository);

    const resultado = await service.alterar(
      "contato-1",
      "perdido",
      "Não teve interesse",
    );

    expect(resultado.tipo).toBe("sucesso");

    expect(updateStatus).toHaveBeenCalledWith(
      "contato-1",
      "perdido",
      "Não teve interesse",
    );
  });

  it("bloqueia transição inválida", async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue({
        id: "contato-1",
        status: "lead",
      }),

      updateStatus: vi.fn(),
    } as unknown as ContatoRepository;

    const service =
      new ContatoStatusService(repository);

    const resultado = await service.alterar(
      "contato-1",
      "comprado",
    );

    expect(resultado.tipo).toBe(
      "transicao_invalida",
    );

    expect(
      repository.updateStatus,
    ).not.toHaveBeenCalled();
  });

  it("limpa motivo ao perdido voltar para lead", async () => {
    const updateStatus = vi
      .fn()
      .mockResolvedValue({
        id: "contato-1",
        status: "lead",
      });

    const repository = {
      findById: vi.fn().mockResolvedValue({
        id: "contato-1",
        status: "perdido",
      }),

      updateStatus,
    } as unknown as ContatoRepository;

    const service =
      new ContatoStatusService(repository);

    await service.alterar(
      "contato-1",
      "lead",
    );

    expect(updateStatus).toHaveBeenCalledWith(
      "contato-1",
      "lead",
      null,
    );
  });
});