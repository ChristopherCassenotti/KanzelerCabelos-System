import { describe, expect, it } from "vitest";
import { registrarCompraSchema } from "../schemas/compra.schema";

describe("Validação de compra", () => {
  it("aceita uma compra válida", () => {
    const resultado = registrarCompraSchema.safeParse({
      dataCorte: "2026-10-01",
      pesoG: 420,
      comprimentoCm: 72,
      cor: "Castanho claro",
      textura: "Ondulado",
      quimica: "Nenhuma",
      valorPago: "1850.00",
      formaPagamento: "Pix",
    });

    expect(resultado.success).toBe(true);
  });

  it("rejeita data em formato inválido", () => {
    const resultado = registrarCompraSchema.safeParse({
      dataCorte: "01/10/2026",
      valorPago: "1850.00",
      formaPagamento: "Pix",
    });

    expect(resultado.success).toBe(false);
  });

  it("rejeita peso negativo", () => {
    const resultado = registrarCompraSchema.safeParse({
      dataCorte: "2026-10-01",
      pesoG: -100,
      valorPago: "1850.00",
      formaPagamento: "Pix",
    });

    expect(resultado.success).toBe(false);
  });

  it("rejeita forma de pagamento não permitida", () => {
    const resultado = registrarCompraSchema.safeParse({
      dataCorte: "2026-10-01",
      valorPago: "1850.00",
      formaPagamento: "Cheque",
    });

    expect(resultado.success).toBe(false);
  });

  it("rejeita valor monetário inválido", () => {
    const resultado = registrarCompraSchema.safeParse({
      dataCorte: "2026-10-01",
      valorPago: "1850,999",
      formaPagamento: "Pix",
    });

    expect(resultado.success).toBe(false);
  });
});