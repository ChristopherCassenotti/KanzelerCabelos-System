import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { CompraService } from "../services/compra.service";

import type { CompraRepository } from "../repositories/compra.repository";
import type { ItemRotaRepository } from "../repositories/item-rota.repository";
import type { ContatoRepository } from "../repositories/contato.repository";
import type { AuditoriaRepository } from "../repositories/auditoria.repository";

describe("CompraService", () => {
  it(
    "envia os dados corretamente para o repository",
    async () => {
      const registrar =
        vi.fn().mockResolvedValue({
          id: "compra-1",
        });

      const auditoriaCreate =
        vi.fn().mockResolvedValue({
          id: "auditoria-1",
        });

      const compraRepository = {
        registrar,
      } as unknown as CompraRepository;

      const itemRotaRepository = {
        findById: vi.fn(),
      } as unknown as ItemRotaRepository;

      const auditoriaRepository = {
        create: auditoriaCreate,
      } as unknown as AuditoriaRepository;

      const service =
        new CompraService(
          compraRepository,
          {} as ContatoRepository,
          itemRotaRepository,
          auditoriaRepository,
        );

      const resultado =
        await service.registrar(
          "contato-1",
          {
            dataCorte:
              "2026-10-01",
            pesoG: 420,
            comprimentoCm: 72,
            cor:
              "Castanho claro",
            textura:
              "Ondulado",
            quimica:
              "Nenhuma",
            valorPago:
              "1850.00",
            formaPagamento:
              "Pix",
          },
        );

      expect(
        resultado.tipo,
      ).toBe("sucesso");

      expect(
        registrar,
      ).toHaveBeenCalledOnce();

      expect(
        registrar,
      ).toHaveBeenCalledWith({
        contatoId:
          "contato-1",
        dataCorte:
          "2026-10-01",
        pesoG: 420,
        comprimentoCm: 72,
        cor:
          "Castanho claro",
        textura:
          "Ondulado",
        quimica:
          "Nenhuma",
        valorPago:
          "1850.00",
        formaPagamento:
          "Pix",
      });

      expect(
        auditoriaCreate,
      ).toHaveBeenCalledOnce();

      expect(
        auditoriaCreate,
      ).toHaveBeenCalledWith({
        usuarioId: null,
        acao:
          "compra_registrada",
        entidade:
          "compra",
        entidadeId:
          "compra-1",
        detalhes:
          JSON.stringify({
            contatoId:
              "contato-1",
            dataCorte:
              "2026-10-01",
            valorPago:
              "1850.00",
          }),
      });
    },
  );

  it(
    "não envia campos opcionais como undefined",
    async () => {
      const registrar =
        vi.fn().mockResolvedValue({
          id: "compra-1",
        });

      const auditoriaCreate =
        vi.fn().mockResolvedValue({
          id: "auditoria-1",
        });

      const compraRepository = {
        registrar,
      } as unknown as CompraRepository;

      const itemRotaRepository = {
        findById: vi.fn(),
      } as unknown as ItemRotaRepository;

      const auditoriaRepository = {
        create: auditoriaCreate,
      } as unknown as AuditoriaRepository;

      const service =
        new CompraService(
          compraRepository,
          {} as ContatoRepository,
          itemRotaRepository,
          auditoriaRepository,
        );

      await service.registrar(
        "contato-1",
        {
          dataCorte:
            "2026-10-01",
          valorPago:
            "900.00",
          formaPagamento:
            "Dinheiro",
        },
      );

      expect(
        registrar,
      ).toHaveBeenCalledWith({
        contatoId:
          "contato-1",
        dataCorte:
          "2026-10-01",
        valorPago:
          "900.00",
        formaPagamento:
          "Dinheiro",
      });

      const dadosEnviados =
        registrar.mock
          .calls[0]?.[0];

      expect(
        dadosEnviados,
      ).not.toHaveProperty(
        "visitaId",
      );

      expect(
        dadosEnviados,
      ).not.toHaveProperty(
        "pesoG",
      );

      expect(
        dadosEnviados,
      ).not.toHaveProperty(
        "comprimentoCm",
      );

      expect(
        dadosEnviados,
      ).not.toHaveProperty(
        "cor",
      );

      expect(
        dadosEnviados,
      ).not.toHaveProperty(
        "textura",
      );

      expect(
        dadosEnviados,
      ).not.toHaveProperty(
        "quimica",
      );
    },
  );

  it(
    "vincula a compra a uma visita válida",
    async () => {
      const registrar =
        vi.fn().mockResolvedValue({
          id: "compra-1",
        });

      const auditoriaCreate =
        vi.fn().mockResolvedValue({
          id: "auditoria-1",
        });

      const visitaId =
        "11111111-1111-4111-8111-111111111111";

      const service =
        new CompraService(
          {
            registrar,
          } as unknown as CompraRepository,

          {} as ContatoRepository,

          {
            findById:
              vi.fn().mockResolvedValue({
                id: visitaId,
                tipo:
                  "visita",
                contatoId:
                  "contato-1",
              }),
          } as unknown as ItemRotaRepository,

          {
            create:
              auditoriaCreate,
          } as unknown as AuditoriaRepository,
        );

      const resultado =
        await service.registrar(
          "contato-1",
          {
            visitaId,
            dataCorte:
              "2026-10-07",
            valorPago:
              "1800.00",
            formaPagamento:
              "Pix",
          },
        );

      expect(
        resultado.tipo,
      ).toBe("sucesso");

      expect(
        registrar,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          contatoId:
            "contato-1",
          visitaId,
        }),
      );

      expect(
        auditoriaCreate,
      ).toHaveBeenCalledOnce();
    },
  );

  it(
    "bloqueia visita de outro contato",
    async () => {
      const registrar =
        vi.fn();

      const auditoriaCreate =
        vi.fn();

      const visitaId =
        "11111111-1111-4111-8111-111111111111";

      const findById =
        vi.fn().mockResolvedValue({
          id: visitaId,
          tipo: "visita",
          contatoId:
            "outro-contato",
        });

      const compraRepository = {
        registrar,
      } as unknown as CompraRepository;

      const contatoRepository = {
        findById: vi.fn(),
      } as unknown as ContatoRepository;

      const itemRotaRepository = {
        findById,
      } as unknown as ItemRotaRepository;

      const auditoriaRepository = {
        create:
          auditoriaCreate,
      } as unknown as AuditoriaRepository;

      const service =
        new CompraService(
          compraRepository,
          contatoRepository,
          itemRotaRepository,
          auditoriaRepository,
        );

      const resultado =
        await service.registrar(
          "contato-1",
          {
            visitaId,
            dataCorte:
              "2026-10-07",
            valorPago:
              "1800.00",
            formaPagamento:
              "Pix",
          },
        );

      expect(
        findById,
      ).toHaveBeenCalledWith(
        visitaId,
      );

      expect(
        resultado.tipo,
      ).toBe(
        "visita_invalida",
      );

      expect(
        registrar,
      ).not.toHaveBeenCalled();

      expect(
        auditoriaCreate,
      ).not.toHaveBeenCalled();
    },
  );
});