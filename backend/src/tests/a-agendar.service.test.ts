import "temporal-polyfill/full/global";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { AAgendarService } from "../services/a-agendar.service";

import type { ContatoRepository } from "../repositories/contato.repository";
import type { ItemRotaRepository } from "../repositories/item-rota.repository";
import type { RecompraService } from "../services/recompra.service";

describe("AAgendarService", () => {
  it("retorna somente contatos disponíveis para agendar", async () => {
    const contatoRepository = {
      findAtivosParaAgendar:
        vi.fn().mockResolvedValue([
          {
            id: "lead-1",
            nome: "Maria",
            status: "lead",
          },

          {
            id: "avaliacao-1",
            nome: "Ana",
            status: "avaliacao_agendada",
          },

          {
            id: "comprado-1",
            nome: "Carla",
            status: "comprado",
          },

          {
            id: "perdido-1",
            nome: "Julia",
            status: "perdido",
          },
        ]),
    } as unknown as ContatoRepository;

    const itemRotaRepository = {
      findVisitasAbertas:
        vi.fn().mockResolvedValue([
          {
            contatoId: "avaliacao-1",

            diaRota: {
              data:
                Temporal.PlainDate.from(
                  "2026-10-20",
                ),
            },
          },
        ]),
    } as unknown as ItemRotaRepository;

    const recompraService = {
      listarProntas:
        vi.fn().mockResolvedValue([
          {
            contatoId: "comprado-1",
            pronta: true,
            diasAte: 10,
          },
        ]),
    } as unknown as RecompraService;

    const service =
      new AAgendarService(
        contatoRepository,
        itemRotaRepository,
        recompraService,
      );

    const resultado =
      await service.listar(
        Temporal.PlainDate.from(
          "2026-10-07",
        ),
      );

    expect(
      resultado.map((item) => item.id),
    ).toEqual([
      "lead-1",
      "comprado-1",
    ]);

    expect(
      resultado[0]?.tipoAgendamento,
    ).toBe("lead");

    expect(
      resultado[1]?.tipoAgendamento,
    ).toBe("recompra");
  });

  it("gera contagens por tipo e cidade", async () => {
  const service =
    new AAgendarService(
      {} as ContatoRepository,
      {} as ItemRotaRepository,
      {} as RecompraService,
    );

  vi.spyOn(
    service,
    "listar",
  ).mockResolvedValue([
    {
      id: "1",
      cidadeId: "cidade-1",
      cidade: {
        nome: "Videira",
        uf: "SC",
      },
      tipoAgendamento: "lead",
      recompra: null,
    },
    {
      id: "2",
      cidadeId: "cidade-1",
      cidade: {
        nome: "Videira",
        uf: "SC",
      },
      tipoAgendamento: "recompra",
      recompra: null,
    },
    {
      id: "3",
      cidadeId: "cidade-2",
      cidade: {
        nome: "Caçador",
        uf: "SC",
      },
      tipoAgendamento: "lead",
      recompra: null,
    },
  ] as any);

  const resultado =
    await service.resumir(
      Temporal.PlainDate.from(
        "2026-10-07",
      ),
    );

  expect(resultado.total).toBe(3);

  expect(resultado.tipos).toEqual({
    lead: 2,
    avaliacao: 0,
    recompra: 1,
  });

  expect(resultado.cidades).toEqual([
    {
      cidadeId: "cidade-1",
      nome: "Videira",
      uf: "SC",
      quantidade: 2,
    },
    {
      cidadeId: "cidade-2",
      nome: "Caçador",
      uf: "SC",
      quantidade: 1,
    },
  ]);
});
});