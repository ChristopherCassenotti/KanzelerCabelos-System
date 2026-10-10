import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  RelatorioService,
} from "../services/relatorio.service";

import type {
  CompraRepository,
} from "../repositories/compra.repository";

import type {
  ContatoRepository,
} from "../repositories/contato.repository";

describe(
  "RelatorioService",
  () => {
    it(
      "calcula os indicadores financeiros",
      async () => {
        const compraRepository = {
          findAll:
            vi.fn().mockResolvedValue([
              {
                id: "compra-1",
                valorPago: "1000",
                pesoG: 500,
                valorRevenda: "1600",
              },
              {
                id: "compra-2",
                valorPago: "800",
                pesoG: 400,
                valorRevenda: null,
              },
              {
                id: "compra-3",
                valorPago: "300",
                pesoG: null,
                valorRevenda: null,
              },
            ]),

          findByPeriod:
            vi.fn(),
        } as unknown as CompraRepository;

        const contatoRepository = {
          findAllComCompras:
            vi.fn().mockResolvedValue([
              {
                id: "contato-1",

                dataPrimeiroContato:
                  Temporal.PlainDate.from(
                    "2026-10-01",
                  ),

                dataAvaliacao: null,

                compras: [
                  {
                    dataCorte:
                      Temporal.PlainDate.from(
                        "2026-10-05",
                      ),
                  },
                ],
              },
              {
                id: "contato-2",

                dataPrimeiroContato:
                  Temporal.PlainDate.from(
                    "2026-10-02",
                  ),

                dataAvaliacao: null,

                compras: [
                  {
                    dataCorte:
                      Temporal.PlainDate.from(
                        "2026-10-06",
                      ),
                  },
                ],
              },
              {
                id: "contato-3",

                dataPrimeiroContato:
                  Temporal.PlainDate.from(
                    "2026-10-03",
                  ),

                dataAvaliacao: null,

                compras: [],
              },
              {
                id: "contato-4",

                dataPrimeiroContato:
                  Temporal.PlainDate.from(
                    "2026-10-04",
                  ),

                dataAvaliacao: null,

                compras: [],
              },
            ]),
        } as unknown as ContatoRepository;

        const service =
          new RelatorioService(
            compraRepository,
            contatoRepository,
          );

        const resultado =
          await service.indicadores(
            "todo",
            Temporal.PlainDate.from(
              "2026-10-10",
            ),
          );

        expect(resultado).toEqual({
          periodo: "todo",

          quantidadeCompras: 3,

          totalPago: 2100,

          ticketMedio: 700,

          pesoCompradoG: 900,

          precoMedioPorGrama: 2,

          lucroRevenda: 600,

          quantidadeRevendidas: 1,

          quantidadeARevender: 2,

          totalContatos: 4,

          contatosComCompra: 2,

          conversaoGeral: 50,
        });

        expect(
          compraRepository.findAll,
        ).toHaveBeenCalledOnce();

        expect(
          contatoRepository
            .findAllComCompras,
        ).toHaveBeenCalledOnce();
      },
    );

    it(
      "usa o período dos últimos 30 dias",
      async () => {
        const findByPeriod =
          vi.fn().mockResolvedValue(
            [],
          );

        const compraRepository = {
          findAll:
            vi.fn(),

          findByPeriod,
        } as unknown as CompraRepository;

        const contatoRepository = {
          findAllComCompras:
            vi.fn().mockResolvedValue(
              [],
            ),
        } as unknown as ContatoRepository;

        const service =
          new RelatorioService(
            compraRepository,
            contatoRepository,
          );

        const hoje =
          Temporal.PlainDate.from(
            "2026-10-10",
          );

        const resultado =
          await service.indicadores(
            "30",
            hoje,
          );

        expect(
          findByPeriod,
        ).toHaveBeenCalledWith(
          Temporal.PlainDate.from(
            "2026-09-11",
          ),
          Temporal.PlainDate.from(
            "2026-10-10",
          ),
        );

        expect(resultado).toEqual({
          periodo: "30",

          quantidadeCompras: 0,

          totalPago: 0,

          ticketMedio: 0,

          pesoCompradoG: 0,

          precoMedioPorGrama: 0,

          lucroRevenda: 0,

          quantidadeRevendidas: 0,

          quantidadeARevender: 0,

          totalContatos: 0,

          contatosComCompra: 0,

          conversaoGeral: 0,
        });
      },
    );
  },
);