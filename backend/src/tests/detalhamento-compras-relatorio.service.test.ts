import "temporal-polyfill/full/global";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { DetalhamentoComprasRelatorioService } from "../services/detalhamento-compras-relatorio.service";

import type { CompraRepository } from "../repositories/compra.repository";

describe(
  "DetalhamentoComprasRelatorioService",
  () => {
    it(
      "retorna o detalhamento das compras",
      async () => {
        const service =
          new DetalhamentoComprasRelatorioService(
            {
              findAllComContato:
                vi.fn()
                  .mockResolvedValue([
                    {
                      id:
                        "compra-1",

                      dataCorte:
                        Temporal.PlainDate.from(
                          "2026-10-05",
                        ),

                      cor:
                        "Castanho",

                      textura:
                        "Ondulado",

                      quimica:
                        "Nenhuma",

                      comprimentoCm:
                        60,

                      pesoG:
                        500,

                      valorPago:
                        "1000.00",

                      formaPagamento:
                        "Pix",

                      valorRevenda:
                        "1600.00",

                      contato: {
                        id:
                          "contato-1",

                        nome:
                          "Maria",

                        cidade: {
                          id:
                            "videira",

                          nome:
                            "Videira",

                          uf:
                            "SC",
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

        expect(resultado).toEqual({
          periodo: "todo",

          total: 1,

          registros: [
            {
              compraId:
                "compra-1",

              contatoId:
                "contato-1",

              contato:
                "Maria",

              cidade: {
                id:
                  "videira",

                nome:
                  "Videira",

                uf:
                  "SC",
              },

              dataCorte:
                "2026-10-05",

              cor:
                "Castanho",

              textura:
                "Ondulado",

              quimica:
                "Nenhuma",

              comprimentoCm:
                60,

              pesoG:
                500,

              valorPago:
                1000,

              precoPorGrama:
                2,

              formaPagamento:
                "Pix",

              valorRevenda:
                1600,

              revendida:
                true,
            },
          ],
        });
      },
    );
  },
);