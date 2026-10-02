import "temporal-polyfill/full/global";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { RecompraService } from "../services/recompra.service";

import type { ContatoRepository } from "../repositories/contato.repository";
import type { CompraRepository } from "../repositories/compra.repository";

describe("RecompraService", () => {
  it("retorna somente clientes prontas para recompra", async () => {
    const contatoRepository = {
      findCompradosComUltimaCompra: vi
        .fn()
        .mockResolvedValue([
          {
            id: "contato-1",
            nome: "Maria",
            telefone: "49999999999",
            cicloRecompraMeses: 8,

            cidade: {
              nome: "Videira",
              uf: "SC",
            },

            compras: [
              {
                id: "compra-1",
                dataCorte:
                  Temporal.PlainDate.from(
                    "2025-12-20",
                  ),
              },
            ],
          },

          {
            id: "contato-2",
            nome: "Fernanda",
            telefone: "49988888888",
            cicloRecompraMeses: 8,

            cidade: {
              nome: "Caçador",
              uf: "SC",
            },

            compras: [
              {
                id: "compra-2",
                dataCorte:
                  Temporal.PlainDate.from(
                    "2026-03-01",
                  ),
              },
            ],
          },
        ]),
    } as unknown as ContatoRepository;

    const service = new RecompraService(
      {} as CompraRepository,
      contatoRepository,
    );

    const resultado =
      await service.listarProntas(
        Temporal.PlainDate.from(
          "2026-08-15",
        ),
      );

    expect(resultado).toHaveLength(1);

    expect(resultado[0]?.nome).toBe(
      "Maria",
    );

    expect(resultado[0]?.diasAte).toBe(5);
    expect(resultado[0]?.pronta).toBe(true);
  });
});