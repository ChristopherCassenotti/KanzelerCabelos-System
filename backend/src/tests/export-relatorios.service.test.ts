import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import ExcelJS = require("exceljs");

import {
  ExportRelatoriosService,
} from "../services/export-relatorios.service";

import type {
  RelatorioService,
} from "../services/relatorio.service";

import type {
  ComprasRelatorioService,
} from "../services/compras-relatorio.service";

import type {
  PrecoMedioRelatorioService,
} from "../services/preco-medio-relatorio.service";

import type {
  OrigemPerdasRelatorioService,
} from "../services/origem-perdas-relatorio.service";

import type {
  ConversaoCidadeRelatorioService,
} from "../services/conversao-cidade-relatorio.service";

import type {
  PrevisaoRecompraRelatorioService,
} from "../services/previsao-recompra-relatorio.service";

import type {
  DetalhamentoComprasRelatorioService,
} from "../services/detalhamento-compras-relatorio.service";

import type {
  ResultadoViagemService,
} from "../services/resultado-viagem.service";

import type {
  DiaRotaRepository,
} from "../repositories/dia-rota.repository";

describe(
  "ExportRelatoriosService",
  () => {
    it(
      "gera o arquivo Excel com todas as abas dos relatórios",
      async () => {
        const indicadores =
          vi.fn().mockResolvedValue({
            totalComprado:
              "3500.00",

            ticketMedio:
              "1750.00",

            pesoCompradoG:
              800,

            precoMedioPorGrama:
              4.375,

            lucroRevenda:
              "1200.00",

            conversao:
              50,
          });

        const comprasBuscar =
          vi.fn().mockResolvedValue({
            porCidade: [
              {
                cidade:
                  "União da Vitória",
                quantidade:
                  2,
                valor:
                  "3500.00",
              },
            ],

            porMes: [
              {
                mes:
                  "2026-10",
                quantidade:
                  2,
                valor:
                  "3500.00",
              },
            ],
          });

        const precoMedioBuscar =
          vi.fn().mockResolvedValue({
            porCor: [
              {
                categoria:
                  "Castanho",
                precoMedioPorGrama:
                  4.5,
                quantidade:
                  2,
              },
            ],

            porTextura: [
              {
                categoria:
                  "Ondulado",
                precoMedioPorGrama:
                  4.5,
                quantidade:
                  2,
              },
            ],
          });

        const origemPerdasBuscar =
          vi.fn().mockResolvedValue({
            origens: [
              {
                origem:
                  "Instagram",
                contatos:
                  4,
                compras:
                  2,
                conversao:
                  50,
                valor:
                  "3500.00",
              },
            ],

            perdas: [
              {
                motivo:
                  "Preço",
                quantidade:
                  1,
              },
            ],
          });

        const conversaoBuscar =
          vi.fn().mockResolvedValue([
            {
              cidade:
                "União da Vitória",
              contatos:
                4,
              avaliacoes:
                3,
              compras:
                2,
              conversao:
                50,
            },
          ]);

        const previsaoBuscar =
          vi.fn().mockResolvedValue({
            cidades: [
              {
                cidade:
                  "União da Vitória",
                vencidas:
                  1,
                total:
                  3,
              },
            ],
          });

        const detalhamentoBuscar =
          vi.fn().mockResolvedValue([
            {
              nome:
                "Maria Teste",
              cidade:
                "União da Vitória",
              dataCorte:
                "2026-10-01",
              valorPago:
                "1800.00",
            },
          ]);

        const resultadoViagemBuscar =
          vi.fn().mockResolvedValue({
            data:
              "2026-10-01",

            cidades: [
              "União da Vitória",
            ],

            visitas:
              3,

            compras:
              1,

            pago:
              1800,

            custos:
              300,

            custoPorGrama:
              5.25,

            revenda:
              2500,

            resultado:
              400,

            pendentesRevenda:
              0,
          });

        const diaRotaFindAll =
          vi.fn().mockResolvedValue([
            {
              id:
                "rota-1",

              data:
                Temporal.PlainDate
                  .from(
                    "2026-10-01",
                  ),

              itens: [
                {
                  tipo:
                    "visita",
                },
              ],
            },
          ]);

const service =
  new ExportRelatoriosService(
    {
      indicadores,
    } as unknown as RelatorioService,

    {
      buscar:
        resultadoViagemBuscar,
    } as unknown as ResultadoViagemService,

    {
      findAll:
        diaRotaFindAll,
    } as unknown as DiaRotaRepository,

    {
      buscar:
        comprasBuscar,
    } as unknown as ComprasRelatorioService,

    {
      buscar:
        precoMedioBuscar,
    } as unknown as PrecoMedioRelatorioService,

    {
      buscar:
        origemPerdasBuscar,
    } as unknown as OrigemPerdasRelatorioService,

    {
      buscar:
        conversaoBuscar,
    } as unknown as ConversaoCidadeRelatorioService,

    {
      buscar:
        previsaoBuscar,
    } as unknown as PrevisaoRecompraRelatorioService,

    {
      buscar:
        detalhamentoBuscar,
    } as unknown as DetalhamentoComprasRelatorioService,
  );
  
const buffer =
  await service.gerar(
    "30",
  );

        const workbook =
          new ExcelJS.Workbook();

        const arquivo =
          buffer as unknown as Parameters<
            typeof workbook.xlsx.load
          >[0];

        await workbook.xlsx.load(
          arquivo,
        );

        expect(
          workbook.getWorksheet(
            "Resumo",
          ),
        ).toBeDefined();

        expect(
          workbook.getWorksheet(
            "Compras",
          ),
        ).toBeDefined();

        expect(
          workbook.getWorksheet(
            "Preço por grama",
          ),
        ).toBeDefined();

        expect(
          workbook.getWorksheet(
            "Origem e perdas",
          ),
        ).toBeDefined();

        expect(
          workbook.getWorksheet(
            "Conversão",
          ),
        ).toBeDefined();

        expect(
          workbook.getWorksheet(
            "Viagens",
          ),
        ).toBeDefined();

        expect(
          workbook.getWorksheet(
            "Previsão recompra",
          ),
        ).toBeDefined();

        expect(
          workbook.getWorksheet(
            "Detalhamento",
          ),
        ).toBeDefined();

        expect(
          indicadores,
        ).toHaveBeenCalledOnce();

        expect(
          comprasBuscar,
        ).toHaveBeenCalledOnce();

        expect(
          precoMedioBuscar,
        ).toHaveBeenCalledOnce();

        expect(
          origemPerdasBuscar,
        ).toHaveBeenCalledOnce();

        expect(
          conversaoBuscar,
        ).toHaveBeenCalledOnce();

        expect(
          previsaoBuscar,
        ).toHaveBeenCalledOnce();

        expect(
          detalhamentoBuscar,
        ).toHaveBeenCalledOnce();

        expect(
          resultadoViagemBuscar,
        ).toHaveBeenCalledWith(
          "rota-1",
        );
      },
    );
  },
);