import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import ExcelJS = require("exceljs");

import {
  ExportRotaService,
} from "../services/export-rota.service";

import type {
  DiaRotaRepository,
} from "../repositories/dia-rota.repository";

describe(
  "ExportRotaService",
  () => {
    it(
      "gera Excel da rota com visita e tarefa",
      async () => {
        const diaRotaRepository = {
          findDetailedById:
            vi.fn()
              .mockResolvedValue({
                id:
                  "rota-1",

                data:
                  Temporal.PlainDate
                    .from(
                      "2026-10-20",
                    ),

                horaSaida:
                  Temporal.PlainTime
                    .from(
                      "08:00",
                    ),

                minutosPorVisita:
                  40,

                partidaCidade: {
                  nome:
                    "União da Vitória",
                  uf:
                    "PR",
                },

                itens: [
                  {
                    id:
                      "item-1",
                    ordem: 1,
                    tipo:
                      "visita",

                    hora:
                      Temporal.PlainTime
                        .from(
                          "09:15",
                        ),

                    concluido:
                      false,

                    titulo:
                      null,

                    contato: {
                      id:
                        "contato-1",

                      nome:
                        "Maria Teste",

                      telefone:
                        "42999999999",

                      endereco:
                        "Rua Teste, 123",

                      lat:
                        "-26.229700",

                      lng:
                        "-51.086700",

                      status:
                        "avaliacao_agendada",

                      cidade: {
                        nome:
                          "União da Vitória",
                        uf:
                          "PR",
                      },
                    },
                  },

                  {
                    id:
                      "item-2",
                    ordem: 2,
                    tipo:
                      "tarefa",

                    hora:
                      Temporal.PlainTime
                        .from(
                          "10:00",
                        ),

                    concluido:
                      true,

                    titulo:
                      "Abastecer a van",

                    contato:
                      null,
                  },
                ],
              }),
        } as unknown as DiaRotaRepository;

        const service =
          new ExportRotaService(
            diaRotaRepository,
          );

        const resultado =
          await service.gerar(
            "rota-1",
          );

        expect(
          resultado,
        ).not.toBeNull();

        if (!resultado) {
          throw new Error(
            "Exportação não gerada",
          );
        }

        expect(
          resultado.data,
        ).toBe(
          "2026-10-20",
        );

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
            "Rota",
          );

        expect(
          planilha,
        ).toBeDefined();

        if (!planilha) {
          throw new Error(
            "Planilha Rota não encontrada",
          );
        }

        expect(
          planilha.getCell(
            "A1",
          ).value,
        ).toBe(
          "Ordem",
        );

        expect(
          planilha.getCell(
            "D2",
          ).value,
        ).toBe(
          "Maria Teste",
        );

        expect(
          planilha.getCell(
            "E2",
          ).value,
        ).toBe(
          "União da Vitória",
        );

        expect(
          planilha.getCell(
            "I2",
          ).value,
        ).toBe(
          "Não",
        );

        expect(
          String(
            planilha.getCell(
              "J2",
            ).value,
          ),
        ).toContain(
          "google.com/maps",
        );

        expect(
          planilha.getCell(
            "C3",
          ).value,
        ).toBe(
          "Tarefa",
        );

        expect(
          planilha.getCell(
            "D3",
          ).value,
        ).toBe(
          "Abastecer a van",
        );

        expect(
          planilha.getCell(
            "I3",
          ).value,
        ).toBe(
          "Sim",
        );
      },
    );

    it(
      "retorna null quando a rota não existe",
      async () => {
        const diaRotaRepository = {
          findDetailedById:
            vi.fn()
              .mockResolvedValue(
                null,
              ),
        } as unknown as DiaRotaRepository;

        const service =
          new ExportRotaService(
            diaRotaRepository,
          );

        const resultado =
          await service.gerar(
            "rota-inexistente",
          );

        expect(
          resultado,
        ).toBeNull();
      },
    );
  },
);