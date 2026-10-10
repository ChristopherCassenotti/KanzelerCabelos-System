import "temporal-polyfill/full/global";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { PainelService } from "../services/painel.service";

import type { ContatoRepository } from "../repositories/contato.repository";
import type { DiaRotaRepository } from "../repositories/dia-rota.repository";
import type { AAgendarService } from "../services/a-agendar.service";

describe("PainelService", () => {
  it("monta o resumo do painel", async () => {
    const service =
      new PainelService(
        {
          findAll:
            vi.fn().mockResolvedValue([
              {
                id: "1",
                status: "lead",
              },
              {
                id: "2",
                status:
                  "avaliacao_agendada",
              },
              {
                id: "3",
                status: "comprado",
              },
              {
                id: "4",
                status: "comprado",
              },
              {
                id: "5",
                status: "perdido",
              },
            ]),
        } as unknown as ContatoRepository,

        {
          resumir:
            vi.fn().mockResolvedValue({
              total: 3,

              tipos: {
                lead: 1,
                avaliacao: 1,
                recompra: 1,
              },

              cidades: [],
            }),
        } as unknown as AAgendarService,

        {
          findByPeriod:
            vi.fn().mockResolvedValue([
              { id: "rota-1" },
              { id: "rota-2" },
            ]),
        } as unknown as DiaRotaRepository,
      );

    const resultado =
      await service.resumo(
        Temporal.PlainDate.from(
          "2026-10-10",
        ),
      );

    expect(resultado).toEqual({
      contatos: {
        total: 5,
        lead: 1,
        avaliacaoAgendada: 1,
        comprado: 2,
        perdido: 1,
      },

      aAgendar: {
        total: 3,

        tipos: {
          lead: 1,
          avaliacao: 1,
          recompra: 1,
        },

        cidades: [],
      },

      rotas: {
        proximas30Dias: 2,
      },
    });
  });
});