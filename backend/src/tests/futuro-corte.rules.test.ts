import "temporal-polyfill/full/global";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  acrescentarObservacao,
  calcularSituacaoFuturoCorte,
  compraConverteFuturoCorte,
  correspondeSituacao,
} from "../services/futuro-corte.rules";
import { FuturoCorteService } from "../services/futuro-corte.service";

import type { ContatoRepository } from "../repositories/contato.repository";
import type { FuturoCorteRepository } from "../repositories/futuro-corte.repository";
import type { VisitaRotaService } from "../services/visita-rota.service";

const hoje = Temporal.PlainDate.from("2026-11-24");

function calcular(
  dias: number,
  status: "acompanhando" | "agendado" | "convertido" | "descartado" = "acompanhando",
) {
  return calcularSituacaoFuturoCorte({
    status,
    dataProximoContato: hoje.add({ days: dias }),
    hoje,
  });
}

describe("calcularSituacaoFuturoCorte", () => {
  it.each([
    [87, "futuro", false],
    [8, "futuro", false],
    [7, "em_breve", false],
    [1, "em_breve", false],
    [0, "hoje", true],
    [-1, "atrasado", true],
    [-4, "atrasado", true],
  ])("%i dias => %s", (dias, situacaoContato, prontoParaContato) => {
    expect(calcular(dias)).toEqual({
      diasParaContato: dias,
      situacaoContato,
      prontoParaContato,
    });
  });

  it.each(["agendado", "convertido", "descartado"] as const)(
    "retorna null para status %s",
    (status) => {
      expect(calcular(-4, status)).toEqual({
        diasParaContato: null,
        situacaoContato: null,
        prontoParaContato: null,
      });
    },
  );

  it("conta em dias mesmo passando de meses", () => {
    expect(calcular(400).diasParaContato).toBe(400);
  });
});

describe("correspondeSituacao", () => {
  const corresponde = (
    filtro: Parameters<typeof correspondeSituacao>[0],
    data: string,
  ) =>
    correspondeSituacao(filtro, {
      status: "acompanhando",
      dataProximoContato: Temporal.PlainDate.from(data),
      hoje,
    });

  it("próximos 30 dias inclui atrasados e o limite", () => {
    expect(corresponde("proximos_30_dias", "2026-01-01")).toBe(true);
    expect(corresponde("proximos_30_dias", "2026-12-24")).toBe(true);
    expect(corresponde("proximos_30_dias", "2026-12-25")).toBe(false);
  });

  it("este mês usa o mês-calendário", () => {
    expect(corresponde("este_mes", "2026-11-01")).toBe(true);
    expect(corresponde("este_mes", "2026-11-30")).toBe(true);
    expect(corresponde("este_mes", "2026-12-01")).toBe(false);
    expect(corresponde("este_mes", "2025-11-24")).toBe(false);
  });
});

describe("regras auxiliares", () => {
  it("compra retroativa não converte (data de criação em São Paulo)", () => {
    // 01:30Z do dia 25 ainda é dia 24 em São Paulo.
    const criadoEm = Temporal.Instant.from("2026-11-25T01:30:00Z");

    expect(compraConverteFuturoCorte(Temporal.PlainDate.from("2026-11-24"), criadoEm)).toBe(true);
    expect(compraConverteFuturoCorte(Temporal.PlainDate.from("2026-11-23"), criadoEm)).toBe(false);
  });

  it("acrescenta a observação com data", () => {
    expect(acrescentarObservacao("Antiga", "Nova", hoje)).toBe("Antiga\n[24/11/2026] Nova");
    expect(acrescentarObservacao(null, "Nova", hoje)).toBe("[24/11/2026] Nova");
  });
});

describe("virada do dia em São Paulo", () => {
  afterEach(() => vi.restoreAllMocks());

  const service = new FuturoCorteService(
    {
      findAllComContato: async () => [
        {
          id: "f1",
          status: "acompanhando",
          dataProximoContato: Temporal.PlainDate.from("2026-11-25"),
          contato: { nome: "Maria" },
        },
      ],
    } as unknown as FuturoCorteRepository,
    {} as ContatoRepository,
    {} as VisitaRotaService,
  );

  it.each([
    ["2026-11-25T02:59:59Z", 1, "em_breve", false],
    ["2026-11-25T03:00:00Z", 0, "hoje", true],
    ["2026-11-26T02:59:59Z", 0, "hoje", true],
    ["2026-11-26T03:00:00Z", -1, "atrasado", true],
  ])("%s", async (instante, dias, situacao, pronto) => {
    vi.spyOn(Temporal.Now, "plainDateISO").mockImplementation((fuso) =>
      Temporal.Instant.from(instante)
        .toZonedDateTimeISO(fuso ?? "UTC")
        .toPlainDate(),
    );

    const [item] = await service.listar();

    expect(item).toMatchObject({
      diasParaContato: dias,
      situacaoContato: situacao,
      prontoParaContato: pronto,
    });
  });
});
