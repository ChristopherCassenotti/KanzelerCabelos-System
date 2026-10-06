import "temporal-polyfill/full/global";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { VisitaRotaService } from "../services/visita-rota.service";

import type { ItemRotaRepository } from "../repositories/item-rota.repository";
import type { DiaRotaRepository } from "../repositories/dia-rota.repository";
import type { ContatoRepository } from "../repositories/contato.repository";

describe("VisitaRotaService", () => {
  it("agenda uma nova visita e altera lead para avaliação agendada", async () => {
    const salvarVisita = vi
      .fn()
      .mockResolvedValue({
        id: "visita-1",
      });

    const itemRepository = {
      findVisitasAbertasByContatoId:
        vi.fn().mockResolvedValue([]),

      salvarVisita,
    } as unknown as ItemRotaRepository;

    const diaRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "rota-1",
      }),
    } as unknown as DiaRotaRepository;

    const contatoRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "contato-1",
        status: "lead",
      }),
    } as unknown as ContatoRepository;

    const service = new VisitaRotaService(
      itemRepository,
      diaRepository,
      contatoRepository,
    );

    const resultado = await service.agendar(
      "rota-1",
      {
        contatoId:
          "11111111-1111-4111-8111-111111111111",
        hora: "09:30",
      },
    );

    expect(resultado.tipo).toBe(
      "visita_criada",
    );

    expect(salvarVisita).toHaveBeenCalledWith(
      expect.objectContaining({
        diaRotaId: "rota-1",

        contatoId:
          "11111111-1111-4111-8111-111111111111",

        alterarStatusParaAvaliacao: true,
      }),
    );
  });

  it("mantém cliente comprado como comprado", async () => {
    const salvarVisita = vi
      .fn()
      .mockResolvedValue({
        id: "visita-1",
      });

    const itemRepository = {
      findVisitasAbertasByContatoId:
        vi.fn().mockResolvedValue([]),

      salvarVisita,
    } as unknown as ItemRotaRepository;

    const service = new VisitaRotaService(
      itemRepository,

      {
        findById: vi.fn().mockResolvedValue({
          id: "rota-1",
        }),
      } as unknown as DiaRotaRepository,

      {
        findById: vi.fn().mockResolvedValue({
          id: "contato-1",
          status: "comprado",
        }),
      } as unknown as ContatoRepository,
    );

    await service.agendar("rota-1", {
      contatoId:
        "11111111-1111-4111-8111-111111111111",
    });

    expect(salvarVisita).toHaveBeenCalledWith(
      expect.objectContaining({
        alterarStatusParaAvaliacao: false,
      }),
    );
  });

  it("bloqueia contato perdido", async () => {
    const salvarVisita = vi.fn();

    const service = new VisitaRotaService(
      {
        findVisitasAbertasByContatoId:
          vi.fn(),
        salvarVisita,
      } as unknown as ItemRotaRepository,

      {
        findById: vi.fn().mockResolvedValue({
          id: "rota-1",
        }),
      } as unknown as DiaRotaRepository,

      {
        findById: vi.fn().mockResolvedValue({
          id: "contato-1",
          status: "perdido",
        }),
      } as unknown as ContatoRepository,
    );

    const resultado = await service.agendar(
      "rota-1",
      {
        contatoId:
          "11111111-1111-4111-8111-111111111111",
      },
    );

    expect(resultado.tipo).toBe(
        "contato_perdido",
    );

    expect(
      salvarVisita,
    ).not.toHaveBeenCalled();
    });
    
    it("move a visita futura existente em vez de criar outra", async () => {
      const salvarVisita = vi
        .fn()
        .mockResolvedValue({
          id: "visita-1",
        });

      const itemRepository = {
        findVisitasAbertasByContatoId:
          vi.fn().mockResolvedValue([
            {
              id: "visita-1",

              diaRota: {
                data: Temporal.PlainDate.from(
                  "2026-10-20",
                ),
              },
            },
          ]),

        salvarVisita,
      } as unknown as ItemRotaRepository;

      const diaRepository = {
        findById: vi.fn().mockResolvedValue({
          id: "rota-2",
        }),
      } as unknown as DiaRotaRepository;

      const contatoRepository = {
        findById: vi.fn().mockResolvedValue({
          id: "contato-1",
          status: "avaliacao_agendada",
        }),
      } as unknown as ContatoRepository;

      const service = new VisitaRotaService(
        itemRepository,
        diaRepository,
        contatoRepository,
      );

      const resultado = await service.agendar(
        "rota-2",
        {
          contatoId:
            "11111111-1111-4111-8111-111111111111",
          hora: "14:00",
        },
      );

      expect(resultado.tipo).toBe(
        "visita_movida",
      );

      expect(salvarVisita).toHaveBeenCalledWith(
        expect.objectContaining({
          diaRotaId: "rota-2",

          contatoId:
            "11111111-1111-4111-8111-111111111111",

          visitaExistenteId: "visita-1",

          alterarStatusParaAvaliacao: false,
        }),
      );
    });
});