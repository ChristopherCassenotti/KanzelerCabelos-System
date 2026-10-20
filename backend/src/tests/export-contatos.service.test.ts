import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import ExcelJS = require("exceljs");

import {
  ExportContatosService,
} from "../services/export-contatos.service";

import type {
  ContatoRepository,
} from "../repositories/contato.repository";

describe(
  "ExportContatosService",
  () => {
    it(
      "gera Excel com os dados do contato e da última compra",
      async () => {
        const contatoRepository = {
          findAllParaExportacao:
            vi.fn()
              .mockResolvedValue([
                {
                  id:
                    "contato-1",

                  nome:
                    "Maria Teste",

                  telefone:
                    "42999999999",

                  cidadeId:
                    "cidade-1",

                  endereco:
                    "Rua Teste, 123",

                  status:
                    "comprado",

                  origem:
                    "Instagram",

                  indicadoPor:
                    "Ana",

                  dataPrimeiroContato:
                    Temporal.PlainDate
                      .from(
                        "2026-01-10",
                      ),

                  dataAvaliacao:
                    Temporal.PlainDate
                      .from(
                        "2026-01-15",
                      ),

                  autorizouFoto:
                    true,

                  natural:
                    true,

                  cor:
                    "Castanho",

                  textura:
                    "Ondulado",

                  quimica:
                    "Nenhuma",

                  comprimentoCm:
                    70,

                  cicloRecompraMeses:
                    8,

                  observacoes:
                    "Cliente teste",

                  motivoPerda:
                    null,

                  lat:
                    "-26.229700",

                  lng:
                    "-51.086700",

                  cidade: {
                    id:
                      "cidade-1",

                    nome:
                      "União da Vitória",

                    uf:
                      "PR",
                  },

                  fotos: [
                    {
                      id:
                        "foto-1",
                    },
                    {
                      id:
                        "foto-2",
                    },
                  ],

                  compras: [
                    {
                      id:
                        "compra-1",

                      dataCorte:
                        Temporal.PlainDate
                          .from(
                            "2026-02-20",
                          ),

                      pesoG:
                        400,

                      comprimentoCm:
                        72,

                      cor:
                        "Castanho claro",

                      textura:
                        "Ondulado",

                      quimica:
                        "Nenhuma",

                      valorPago:
                        "2000.00",

                      formaPagamento:
                        "Pix",

                      valorRevenda:
                        "3000.00",
                    },
                  ],
                },
              ]),
        } as unknown as ContatoRepository;

        const service =
          new ExportContatosService(
            contatoRepository,
          );

        const resultado =
          await service.gerar();

        expect(
          resultado.total,
        ).toBe(1);

        const workbook =
          new ExcelJS.Workbook();

        const arquivo =
          resultado.buffer as unknown as Parameters<
            typeof workbook.xlsx.load
          >[0];

        await workbook.xlsx.load(
          arquivo,
        );

        const planilha =
          workbook.getWorksheet(
            "Contatos",
          );

        expect(
          planilha,
        ).toBeDefined();

        if (!planilha) {
          throw new Error(
            "Planilha Contatos não encontrada",
          );
        }

        expect(
          planilha.getCell(
            "A1",
          ).value,
        ).toBe(
          "Nome",
        );

        expect(
          planilha.getCell(
            "A2",
          ).value,
        ).toBe(
          "Maria Teste",
        );

        expect(
          planilha.getCell(
            "C2",
          ).value,
        ).toBe(
          "União da Vitória",
        );

        expect(
          planilha.getCell(
            "K2",
          ).value,
        ).toBe(
          "2026-02-20",
        );

        expect(
          planilha.getCell(
            "Q2",
          ).value,
        ).toBe(
          400,
        );

        expect(
          planilha.getCell(
            "R2",
          ).value,
        ).toBe(
          2000,
        );

        expect(
          planilha.getCell(
            "S2",
          ).value,
        ).toBe(
          5,
        );

        expect(
          planilha.getCell(
            "V2",
          ).value,
        ).toBe(
          "2026-10-20",
        );

        expect(
          planilha.getCell(
            "X2",
          ).value,
        ).toBe(
          2,
        );
      },
    );

    it(
      "respeita os filtros da exportação",
      async () => {
        const contatoRepository = {
          findAllParaExportacao:
            vi.fn()
              .mockResolvedValue([
                {
                  id:
                    "contato-1",

                  nome:
                    "Comprada",

                  cidadeId:
                    "cidade-1",

                  status:
                    "comprado",

                  origem:
                    "Instagram",

                  natural:
                    true,

                  telefone:
                    null,

                  endereco:
                    null,

                  indicadoPor:
                    null,

                  dataPrimeiroContato:
                    null,

                  dataAvaliacao:
                    null,

                  cor:
                    null,

                  textura:
                    null,

                  quimica:
                    null,

                  comprimentoCm:
                    null,

                  cicloRecompraMeses:
                    8,

                  observacoes:
                    null,

                  motivoPerda:
                    null,

                  lat:
                    null,

                  lng:
                    null,

                  cidade: {
                    nome:
                      "União da Vitória",
                    uf:
                      "PR",
                  },

                  fotos: [],

                  compras: [],
                },

                {
                  id:
                    "contato-2",

                  nome:
                    "Lead",

                  cidadeId:
                    "cidade-2",

                  status:
                    "lead",

                  origem:
                    "Indicação",

                  natural:
                    false,

                  telefone:
                    null,

                  endereco:
                    null,

                  indicadoPor:
                    null,

                  dataPrimeiroContato:
                    null,

                  dataAvaliacao:
                    null,

                  cor:
                    null,

                  textura:
                    null,

                  quimica:
                    null,

                  comprimentoCm:
                    null,

                  cicloRecompraMeses:
                    8,

                  observacoes:
                    null,

                  motivoPerda:
                    null,

                  lat:
                    null,

                  lng:
                    null,

                  cidade: {
                    nome:
                      "Porto União",
                    uf:
                      "SC",
                  },

                  fotos: [],

                  compras: [],
                },
              ]),
        } as unknown as ContatoRepository;

        const service =
          new ExportContatosService(
            contatoRepository,
          );

        const resultado =
          await service.gerar({
            status:
              "comprado",
          });

        expect(
          resultado.total,
        ).toBe(1);
      },
    );
  },
);