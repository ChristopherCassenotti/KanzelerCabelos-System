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
import type { FuturoCorteService } from "../services/futuro-corte.service";

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
        {
          listar: vi.fn().mockResolvedValue([]),
        } as unknown as FuturoCorteService,
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

  it("mostra como futuro somente os prontos para contato", async () => {
    const contato = (id: string, status: string) => ({
      id,
      status,
      nome: id,
      cidadeId: "cidade-1",
      cidade: { nome: "Videira", uf: "SC" },
    });

    const futuro = (
      contatoId: string,
      prontoParaContato: boolean | null,
      status = "acompanhando",
    ) => ({
      contatoId,
      status,
      prontoParaContato,
      contato: {},
    });

    const service = new AAgendarService(
      {
        findAtivosParaAgendar:
          vi.fn().mockResolvedValue([
            contato("lead-pronto", "lead"),
            contato("lead-distante", "lead"),
            contato("lead-comum", "lead"),
            contato("comprado-pronto", "comprado"),
            contato("comprado-distante", "comprado"),
            contato("recompra-pronto", "comprado"),
            contato("recompra-distante", "comprado"),
            contato("perdido-pronto", "perdido"),
            contato("com-visita", "lead"),
            contato("agendado-vencido", "avaliacao_agendada"),
          ]),
      } as unknown as ContatoRepository,
      {
        findVisitasAbertas:
          vi.fn().mockResolvedValue([
            {
              contatoId: "com-visita",
              diaRota: {
                data: Temporal.PlainDate.from("2026-10-20"),
              },
            },
          ]),
      } as unknown as ItemRotaRepository,
      {
        listarProntas:
          vi.fn().mockResolvedValue([
            { contatoId: "recompra-pronto" },
            { contatoId: "recompra-distante" },
          ]),
      } as unknown as RecompraService,
      {
        listar: vi.fn().mockResolvedValue([
          futuro("lead-pronto", true),
          futuro("lead-distante", false),
          futuro("comprado-pronto", true),
          futuro("comprado-distante", false),
          futuro("recompra-pronto", true),
          futuro("recompra-distante", false),
          futuro("perdido-pronto", true),
          futuro("com-visita", true),
          futuro("agendado-vencido", null, "agendado"),
        ]),
      } as unknown as FuturoCorteService,
    );

    const hoje = Temporal.PlainDate.from("2026-10-07");
    const resultado = await service.listar(hoje);

    expect(
      resultado.map((item) => [item.id, item.tipoAgendamento]),
    ).toEqual([
      ["lead-pronto", "futuro"],
      ["lead-comum", "lead"],
      ["comprado-pronto", "futuro"],
      ["recompra-pronto", "futuro"],
      ["recompra-distante", "recompra"],
      ["agendado-vencido", "avaliacao"],
    ]);

    expect(
      await service.listar(hoje, { tipo: "futuro" }),
    ).toHaveLength(3);

    expect((await service.resumir(hoje)).tipos.futuro).toBe(3);
  });

  it("gera contagens por tipo e cidade", async () => {
  const service =
    new AAgendarService(
      {} as ContatoRepository,
      {} as ItemRotaRepository,
      {} as RecompraService,
      {} as FuturoCorteService,
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
    futuro: 0,
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