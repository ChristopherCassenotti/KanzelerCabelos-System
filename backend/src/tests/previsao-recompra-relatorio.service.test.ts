import "temporal-polyfill/full/global";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { PrevisaoRecompraRelatorioService } from "../services/previsao-recompra-relatorio.service";

import type { ContatoRepository } from "../repositories/contato.repository";

describe(
  "PrevisaoRecompraRelatorioService",
  () => {
    it(
      "agrupa vencidas e próximos três meses por cidade",
      async () => {
        const service =
          new PrevisaoRecompraRelatorioService(
            {
              findAllComCompras:
                vi.fn()
                  .mockResolvedValue([
                    {
                      status:
                        "comprado",

                      cicloRecompraMeses:
                        8,

                      cidade: {
                        id: "videira",
                        nome: "Videira",
                        uf: "SC",
                      },

                      compras: [
                        {
                          dataCorte:
                            Temporal.PlainDate.from(
                              "2026-01-01",
                            ),
                        },
                      ],
                    },

                    {
                      status:
                        "comprado",

                      cicloRecompraMeses:
                        8,

                      cidade: {
                        id: "videira",
                        nome: "Videira",
                        uf: "SC",
                      },

                      compras: [
                        {
                          dataCorte:
                            Temporal.PlainDate.from(
                              "2026-02-15",
                            ),
                        },
                      ],
                    },

                    {
                      status:
                        "comprado",

                      cicloRecompraMeses:
                        8,

                      cidade: {
                        id: "cacador",
                        nome: "Caçador",
                        uf: "SC",
                      },

                      compras: [
                        {
                          dataCorte:
                            Temporal.PlainDate.from(
                              "2026-03-20",
                            ),
                        },
                      ],
                    },

                    {
                      status:
                        "lead",

                      cicloRecompraMeses:
                        8,

                      cidade: {
                        id: "videira",
                        nome: "Videira",
                        uf: "SC",
                      },

                      compras: [],
                    },
                  ]),
            } as unknown as ContatoRepository,
          );

        const resultado =
          await service.buscar(
            Temporal.PlainDate.from(
              "2026-10-10",
            ),
          );

        expect(
          resultado.meses,
        ).toEqual([
          {
            mes: "2026-10",
            label: "Out/26",
          },
          {
            mes: "2026-11",
            label: "Nov/26",
          },
          {
            mes: "2026-12",
            label: "Dez/26",
          },
        ]);

        expect(
          resultado.porCidade,
        ).toEqual([
          {
            cidadeId:
              "videira",

            nome:
              "Videira",

            uf: "SC",

            vencidas: 1,

            previsoes: [
              {
                mes:
                  "2026-10",
                quantidade: 1,
              },
              {
                mes:
                  "2026-11",
                quantidade: 0,
              },
              {
                mes:
                  "2026-12",
                quantidade: 0,
              },
            ],

            total: 2,
          },

          {
            cidadeId:
              "cacador",

            nome:
              "Caçador",

            uf: "SC",

            vencidas: 0,

            previsoes: [
              {
                mes:
                  "2026-10",
                quantidade: 0,
              },
              {
                mes:
                  "2026-11",
                quantidade: 1,
              },
              {
                mes:
                  "2026-12",
                quantidade: 0,
              },
            ],

            total: 1,
          },
        ]);
      },
    );
  },
);