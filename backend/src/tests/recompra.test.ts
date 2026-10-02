import "temporal-polyfill/full/global";
import { describe, expect, it } from "vitest";

import { calcularRecompra } from "../services/recompra.rules";

describe("Regra de recompra", () => {
  it("calcula a próxima recompra usando o ciclo informado", () => {
    const resultado = calcularRecompra({
      ultimoCorte: Temporal.PlainDate.from("2026-01-10"),
      cicloRecompraMeses: 8,
      hoje: Temporal.PlainDate.from("2026-02-01"),
    });

    expect(resultado.proximaRecompra.toString())
      .toBe("2026-09-10");

    expect(resultado.pronta).toBe(false);
  });

  it("considera pronta quando faltam 30 dias", () => {
    const resultado = calcularRecompra({
      ultimoCorte: Temporal.PlainDate.from("2026-01-10"),
      cicloRecompraMeses: 8,
      hoje: Temporal.PlainDate.from("2026-08-11"),
    });

    expect(resultado.diasAte).toBe(30);
    expect(resultado.pronta).toBe(true);
  });

  it("considera pronta quando a recompra já venceu", () => {
    const resultado = calcularRecompra({
      ultimoCorte: Temporal.PlainDate.from("2026-01-10"),
      cicloRecompraMeses: 8,
      hoje: Temporal.PlainDate.from("2026-09-20"),
    });

    expect(resultado.diasAte).toBeLessThan(0);
    expect(resultado.pronta).toBe(true);
  });

  it("trata corretamente mês com menos dias", () => {
    const resultado = calcularRecompra({
      ultimoCorte: Temporal.PlainDate.from("2026-01-31"),
      cicloRecompraMeses: 1,
      hoje: Temporal.PlainDate.from("2026-02-01"),
    });

    expect(resultado.proximaRecompra.toString())
      .toBe("2026-02-28");
  });
});