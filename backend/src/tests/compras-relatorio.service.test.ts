import "temporal-polyfill/full/global";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { ComprasRelatorioService } from "../services/compras-relatorio.service";

import type { CompraRepository } from "../repositories/compra.repository";

describe(
  "ComprasRelatorioService",
  () => {
    it(
      "agrupa compras por cidade e por mês",
      async () => {
        const service =
          new ComprasRelatorioService(
            {
              findAllComContato:
                vi.fn().mockResolvedValue([
                  {
                    dataCorte:
                      Temporal.PlainDate.from(
                        "2026-09-10",
                      ),

                    valorPago:
                      "1000.00",

                    pesoG: 500,

                    contato: {
                      cidade: {
                        id: "videira",
                        nome: "Videira",
                        uf: "SC",
                      },
                    },
                  },

                  {
                    dataCorte:
                      Temporal.PlainDate.from(
                        "2026-09-20",
                      ),

                    valorPago:
                      "800.00",

                    pesoG: 400,

                    contato: {
                      cidade: {
                        id: "videira",
                        nome: "Videira",
                        uf: "SC",
                      },
                    },
                  },

                  {
                    dataCorte:
                      Temporal.PlainDate.from(
                        "2026-10-05",
                      ),

                    valorPago:
                      "1200.00",

                    pesoG: 600,

                    contato: {
                      cidade: {
                        id: "cacador",
                        nome: "Caçador",
                        uf: "SC",
                      },
                    },
                  },
                ]),
            } as unknown as CompraRepository,
          );

        const resultado =
          await service.buscar(
            "todo",
          );

        expect(
          resultado.porCidade,
        ).toEqual([
          {
            cidadeId: "videira",
            nome: "Videira",
            uf: "SC",
            compras: 2,
            totalPago: 1800,
            pesoCompradoG: 900,
          },
          {
            cidadeId: "cacador",
            nome: "Caçador",
            uf: "SC",
            compras: 1,
            totalPago: 1200,
            pesoCompradoG: 600,
          },
        ]);

        expect(
          resultado.porMes,
        ).toEqual([
          {
            mes: "2026-09",
            compras: 2,
            totalPago: 1800,
            pesoCompradoG: 900,
          },
          {
            mes: "2026-10",
            compras: 1,
            totalPago: 1200,
            pesoCompradoG: 600,
          },
        ]);
      },
    );
  },
);