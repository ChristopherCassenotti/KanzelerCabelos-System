import "temporal-polyfill/full/global";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { ConversaoCidadeRelatorioService } from "../services/conversao-cidade-relatorio.service";

import type { ContatoRepository } from "../repositories/contato.repository";

describe(
  "ConversaoCidadeRelatorioService",
  () => {
    it(
      "calcula conversão por cidade",
      async () => {
        const service =
          new ConversaoCidadeRelatorioService(
            {
              findAllComCompras:
                vi.fn()
                  .mockResolvedValue([
                    {
                      status:
                        "comprado",

                      dataPrimeiroContato:
                        Temporal.PlainDate.from(
                          "2026-10-01",
                        ),

                      dataAvaliacao:
                        Temporal.PlainDate.from(
                          "2026-10-03",
                        ),

                      cidade: {
                        id: "videira",
                        nome: "Videira",
                        uf: "SC",
                      },

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
                      status:
                        "perdido",

                      dataPrimeiroContato:
                        Temporal.PlainDate.from(
                          "2026-10-02",
                        ),

                      dataAvaliacao:
                        Temporal.PlainDate.from(
                          "2026-10-04",
                        ),

                      cidade: {
                        id: "videira",
                        nome: "Videira",
                        uf: "SC",
                      },

                      compras: [],
                    },

                    {
                      status:
                        "lead",

                      dataPrimeiroContato:
                        Temporal.PlainDate.from(
                          "2026-10-03",
                        ),

                      dataAvaliacao:
                        null,

                      cidade: {
                        id: "cacador",
                        nome: "Caçador",
                        uf: "SC",
                      },

                      compras: [],
                    },
                  ]),
            } as unknown as ContatoRepository,
          );

        const resultado =
          await service.buscar(
            "todo",
          );

        expect(
          resultado.porCidade,
        ).toEqual([
          {
            cidadeId:
              "videira",

            nome:
              "Videira",

            uf: "SC",

            contatos: 2,
            avaliacoes: 2,
            compras: 1,

            valorComprado: 1000,

            conversao: 50,
          },

          {
            cidadeId:
              "cacador",

            nome:
              "Caçador",

            uf: "SC",

            contatos: 1,
            avaliacoes: 0,
            compras: 0,

            valorComprado: 0,

            conversao: 0,
          },
        ]);

        expect(
          resultado.total,
        ).toEqual({
          contatos: 3,
          avaliacoes: 2,
          compras: 1,
          valorComprado: 1000,
          conversao: 33.33,
        });
      },
    );
  },
);