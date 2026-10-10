import { describe, expect, it, vi } from "vitest";

import { FotoService } from "../services/foto.service";

import type { ContatoRepository } from "../repositories/contato.repository";
import type { FotoRepository } from "../repositories/foto.repository";
import type { CompraRepository } from "../repositories/compra.repository";
import type { StorageService } from "../services/storage.service";

describe("FotoService", () => {
  it("vincula foto a uma compra válida", async () => {
    const create = vi.fn().mockResolvedValue({
      id: "foto-1",
      contatoId: "contato-1",
      compraId: "compra-1",
    });

    const uploadImage = vi.fn().mockResolvedValue({
      path: "contato-1/foto.jpg",
    });

    const service = new FotoService(
      {
        findById: vi.fn().mockResolvedValue({
          id: "contato-1",
          autorizouFoto: true,
        }),
      } as unknown as ContatoRepository,

      {
        create,
      } as unknown as FotoRepository,

      {
        uploadImage,
        deleteImage: vi.fn(),
      } as unknown as StorageService,

      {
        findByIdForContato:
          vi.fn().mockResolvedValue({
            id: "compra-1",
            contatoId: "contato-1",
          }),
      } as unknown as CompraRepository,
    );

    const resultado = await service.upload({
      contatoId: "contato-1",
      compraId: "compra-1",
      buffer: Buffer.from("foto"),
      mimetype: "image/jpeg",
      tipo: "antes",
    });

    expect(resultado.tipo).toBe(
      "sucesso",
    );

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        contatoId: "contato-1",
        compraId: "compra-1",
        tipo: "antes",
      }),
    );
  });

  it(
    "bloqueia compra de outro contato antes do upload",
    async () => {
      const uploadImage = vi.fn();

      const service = new FotoService(
        {
          findById:
            vi.fn().mockResolvedValue({
              id: "contato-1",
              autorizouFoto: true,
            }),
        } as unknown as ContatoRepository,

        {
          create: vi.fn(),
        } as unknown as FotoRepository,

        {
          uploadImage,
          deleteImage: vi.fn(),
        } as unknown as StorageService,

        {
          findByIdForContato:
            vi.fn().mockResolvedValue(
              null,
            ),
        } as unknown as CompraRepository,
      );

      const resultado =
        await service.upload({
          contatoId: "contato-1",

          compraId:
            "compra-outro-contato",

          buffer:
            Buffer.from("foto"),

          mimetype:
            "image/jpeg",
        });

      expect(
        resultado.tipo,
      ).toBe(
        "compra_invalida",
      );

      expect(
        uploadImage,
      ).not.toHaveBeenCalled();
    },
  );

  it(
    "não permite upload sem autorização da cliente",
    async () => {
      const uploadImage = vi.fn();

      const service = new FotoService(
        {
          findById:
            vi.fn().mockResolvedValue({
              id: "contato-1",
              autorizouFoto: false,
            }),
        } as unknown as ContatoRepository,

        {
          create: vi.fn(),
        } as unknown as FotoRepository,

        {
          uploadImage,
          deleteImage: vi.fn(),
        } as unknown as StorageService,

        {
          findByIdForContato:
            vi.fn(),
        } as unknown as CompraRepository,
      );

      const resultado =
        await service.upload({
          contatoId: "contato-1",

          tipo: "antes",

          buffer:
            Buffer.from("foto"),

          mimetype:
            "image/jpeg",
        });

      expect(
        resultado.tipo,
      ).toBe(
        "foto_nao_autorizada",
      );

      expect(
        uploadImage,
      ).not.toHaveBeenCalled();
    },
  );

  it(
    "continua permitindo foto sem compra vinculada",
    async () => {
      const create =
        vi.fn().mockResolvedValue({
          id: "foto-1",
        });

      const uploadImage =
        vi.fn().mockResolvedValue({
          path:
            "contato-1/foto.jpg",
        });

      const service = new FotoService(
        {
          findById:
            vi.fn().mockResolvedValue({
              id: "contato-1",
              autorizouFoto: true,
            }),
        } as unknown as ContatoRepository,

        {
          create,
        } as unknown as FotoRepository,

        {
          uploadImage,
          deleteImage: vi.fn(),
        } as unknown as StorageService,

        {
          findByIdForContato:
            vi.fn(),
        } as unknown as CompraRepository,
      );

      const resultado =
        await service.upload({
          contatoId: "contato-1",

          buffer:
            Buffer.from("foto"),

          mimetype:
            "image/jpeg",
        });

      expect(
        resultado.tipo,
      ).toBe(
        "sucesso",
      );

      expect(
        create,
      ).toHaveBeenCalledWith(
        expect.not.objectContaining({
          compraId:
            expect.anything(),
        }),
      );
    },
  );
});