import "temporal-polyfill/full/global";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { ResultadoViagemService } from "../services/resultado-viagem.service";

import type { DiaRotaRepository } from "../repositories/dia-rota.repository";
import type { CompraRepository } from "../repositories/compra.repository";

describe(
  "ResultadoViagemService",
  () => {
    it(
      "calcula o resultado financeiro da viagem",
      async () => {
        const service =
          new ResultadoViagemService(
            {
              findDetailedById:
                vi.fn().mockResolvedValue({
                  id: "rota-1",

                  data:
                    Temporal.PlainDate.from(
                      "2026-10-10",
                    ),

                  custoCombustivel:
                    "100.00",

                  custoAlimentacao:
                    "50.00",

                  custoHospedagem:
                    "0.00",

                  custoOutros:
                    "20.00",

                  itens: [
                    {
                      id: "visita-1",
                      tipo: "visita",

                      contato: {
                        cidade: {
                          nome: "Videira",
                        },
                      },
                    },

                    {
                      id: "visita-2",
                      tipo: "visita",

                      contato: {
                        cidade: {
                          nome: "Caçador",
                        },
                      },
                    },
                  ],
                }),
            } as unknown as DiaRotaRepository,

            {
              findByVisitaId:
                vi.fn()
                  .mockResolvedValueOnce([
                    {
                      valorPago:
                        "1000.00",
                      pesoG: 500,
                      valorRevenda:
                        "1600.00",
                    },
                  ])
                  .mockResolvedValueOnce([
                    {
                      valorPago:
                        "800.00",
                      pesoG: 400,
                      valorRevenda:
                        null,
                    },
                  ]),
            } as unknown as CompraRepository,
          );

        const resultado =
          await service.buscar(
            "rota-1",
          );

        expect(resultado).toEqual({
          diaRotaId: "rota-1",
          data: "2026-10-10",

          cidades: [
            "Videira",
            "Caçador",
          ],

          visitas: 2,
          compras: 2,

          pesoCompradoG: 900,

          totalPago: 1800,

          custos: 170,

          custoPorGrama: 2.19,

          totalRevenda: 1600,

          resultado: -370,

          quantidadeRevendidas: 1,
          quantidadeARevender: 1,
        });
      },
    );
  },
);