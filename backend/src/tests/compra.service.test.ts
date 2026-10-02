import { describe, expect, it, vi } from "vitest";

import { CompraService } from "../services/compra.service";
import type { CompraRepository } from "../repositories/compra.repository";

describe("CompraService", () => {
  it("envia os dados corretamente para o repository", async () => {
    const registrar = vi.fn().mockResolvedValue({
      id: "compra-1",
    });

    const compraRepository = {
      registrar,
    } as unknown as CompraRepository;

    const service = new CompraService(compraRepository);

    await service.registrar("contato-1", {
      dataCorte: "2026-10-01",
      pesoG: 420,
      comprimentoCm: 72,
      cor: "Castanho claro",
      textura: "Ondulado",
      quimica: "Nenhuma",
      valorPago: "1850.00",
      formaPagamento: "Pix",
    });

    expect(registrar).toHaveBeenCalledOnce();

    expect(registrar).toHaveBeenCalledWith({
      contatoId: "contato-1",
      dataCorte: "2026-10-01",
      pesoG: 420,
      comprimentoCm: 72,
      cor: "Castanho claro",
      textura: "Ondulado",
      quimica: "Nenhuma",
      valorPago: "1850.00",
      formaPagamento: "Pix",
    });
  });

  it("não envia campos opcionais como undefined", async () => {
    const registrar = vi.fn().mockResolvedValue({
      id: "compra-1",
    });

    const compraRepository = {
      registrar,
    } as unknown as CompraRepository;

    const service = new CompraService(compraRepository);

    await service.registrar("contato-1", {
      dataCorte: "2026-10-01",
      valorPago: "900.00",
      formaPagamento: "Dinheiro",
    });

    expect(registrar).toHaveBeenCalledWith({
      contatoId: "contato-1",
      dataCorte: "2026-10-01",
      valorPago: "900.00",
      formaPagamento: "Dinheiro",
    });

    const dadosEnviados = registrar.mock.calls[0]?.[0];

    expect(dadosEnviados).not.toHaveProperty("pesoG");
    expect(dadosEnviados).not.toHaveProperty("comprimentoCm");
    expect(dadosEnviados).not.toHaveProperty("cor");
    expect(dadosEnviados).not.toHaveProperty("textura");
    expect(dadosEnviados).not.toHaveProperty("quimica");
  });
});