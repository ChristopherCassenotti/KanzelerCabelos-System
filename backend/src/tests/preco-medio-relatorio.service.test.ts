import "temporal-polyfill/full/global";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { PrecoMedioRelatorioService } from "../services/preco-medio-relatorio.service";

import type { CompraRepository } from "../repositories/compra.repository";

describe(
  "PrecoMedioRelatorioService",
  () => {
    it(
      "calcula preço médio ponderado por cor e textura",
      async () => {
        const service =
          new PrecoMedioRelatorioService(
            {
              findAll:
                vi.fn().mockResolvedValue([
                  {
                    valorPago:
                      "1000.00",

                    pesoG: 500,

                    cor:
                      "Castanho",

                    textura:
                      "Ondulado",
                  },

                  {
                    valorPago:
                      "600.00",

                    pesoG: 200,

                    cor:
                      "Castanho",

                    textura:
                      "Liso",
                  },

                  {
                    valorPago:
                      "900.00",

                    pesoG: 300,

                    cor:
                      "Loiro",

                    textura:
                      "Ondulado",
                  },
                ]),
            } as unknown as CompraRepository,
          );

        const resultado =
          await service.buscar(
            "todo",
          );

        expect(
          resultado.porCor,
        ).toEqual([
          {
            cor: "Loiro",
            compras: 1,
            pesoG: 300,
            totalPago: 900,
            precoMedioPorGrama: 3,
          },

          {
            cor: "Castanho",
            compras: 2,
            pesoG: 700,
            totalPago: 1600,
            precoMedioPorGrama: 2.29,
          },
        ]);

        expect(
          resultado.porTextura,
        ).toEqual([
          {
            textura: "Liso",
            compras: 1,
            pesoG: 200,
            totalPago: 600,
            precoMedioPorGrama: 3,
          },

          {
            textura: "Ondulado",
            compras: 2,
            pesoG: 800,
            totalPago: 1900,
            precoMedioPorGrama: 2.38,
          },
        ]);
      },
    );
  },
);