import "temporal-polyfill/full/global";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { OrigemPerdasRelatorioService } from "../services/origem-perdas-relatorio.service";

import type { ContatoRepository } from "../repositories/contato.repository";

describe(
  "OrigemPerdasRelatorioService",
  () => {
    it(
      "agrupa origem, conversão, valor e perdas",
      async () => {
        const service =
          new OrigemPerdasRelatorioService(
            {
              findAllComCompras:
                vi.fn()
                  .mockResolvedValue([
                    {
                      origem:
                        "Anúncio Meta",

                      status:
                        "comprado",

                      motivoPerda:
                        null,

                      dataPrimeiroContato:
                        Temporal.PlainDate.from(
                          "2026-10-01",
                        ),

                      dataAvaliacao:
                        null,

                      compras: [
                        {
                          dataCorte:
                            Temporal.PlainDate.from(
                              "2026-10-05",
                            ),

                          valorPago:
                            "1000.00",
                        },
                      ],
                    },

                    {
                      origem:
                        "Anúncio Meta",

                      status:
                        "perdido",

                      motivoPerda:
                        "Preço",

                      dataPrimeiroContato:
                        Temporal.PlainDate.from(
                          "2026-10-02",
                        ),

                      dataAvaliacao:
                        null,

                      compras: [],
                    },

                    {
                      origem:
                        "Indicação",

                      status:
                        "comprado",

                      motivoPerda:
                        null,

                      dataPrimeiroContato:
                        Temporal.PlainDate.from(
                          "2026-10-03",
                        ),

                      dataAvaliacao:
                        null,

                      compras: [
                        {
                          dataCorte:
                            Temporal.PlainDate.from(
                              "2026-10-06",
                            ),

                          valorPago:
                            "1500.00",
                        },
                      ],
                    },
                  ]),
            } as unknown as ContatoRepository,
          );

        const resultado =
          await service.buscar(
            "todo",
          );

        expect(
          resultado.porOrigem,
        ).toEqual([
          {
            origem:
              "Anúncio Meta",

            contatos: 2,
            compras: 1,
            conversao: 50,
            valorComprado: 1000,
          },

          {
            origem:
              "Indicação",

            contatos: 1,
            compras: 1,
            conversao: 100,
            valorComprado: 1500,
          },
        ]);

        expect(
          resultado.motivosPerda,
        ).toEqual([
          {
            motivo: "Preço",
            quantidade: 1,
          },
        ]);

        expect(
          resultado.totalContatos,
        ).toBe(3);
      },
    );
  },
);