import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { ContatoService } from "../services/contato.service";

import type { ContatoRepository } from "../repositories/contato.repository";
import type { FotoRepository } from "../repositories/foto.repository";
import type { CompraRepository } from "../repositories/compra.repository";
import type { StorageService } from "../services/storage.service";
import type { RecompraService } from "../services/recompra.service";
import type { CidadeRepository } from "../repositories/cidade.repository";
import type { GeocodingService } from "../services/geocoding.service";

describe(
  "ContatoService - LGPD",
  () => {
    it(
      "remove fotos do storage e exclui o contato definitivamente",
      async () => {
        const hardDelete =
          vi.fn().mockResolvedValue({
            id: "contato-1",
          });

        const deleteImages =
          vi.fn().mockResolvedValue(
            undefined,
          );

        const service =
          new ContatoService(
            {
              findByIdIncludingDeleted:
                vi.fn()
                  .mockResolvedValue({
                    id: "contato-1",
                  }),

              hardDelete,
            } as unknown as ContatoRepository,

            {
              findByContatoId:
                vi.fn()
                  .mockResolvedValue([
                    {
                      id: "foto-1",
                      url:
                        "contato-1/a.jpg",
                    },
                    {
                      id: "foto-2",
                      url:
                        "contato-1/b.jpg",
                    },
                  ]),
            } as unknown as FotoRepository,

            {} as CompraRepository,

            {
              deleteImages,
            } as unknown as StorageService,

            {} as RecompraService,

            {} as CidadeRepository,

            {} as GeocodingService,
          );

        const resultado =
          await service
            .deleteDefinitivo(
              "contato-1",
            );

        expect(
          deleteImages,
        ).toHaveBeenCalledWith([
          "contato-1/a.jpg",
          "contato-1/b.jpg",
        ]);

        expect(
          hardDelete,
        ).toHaveBeenCalledWith(
          "contato-1",
        );

        expect(resultado).toEqual({
          id: "contato-1",
        });
      },
    );

    it(
      "não tenta excluir storage quando o contato não existe",
      async () => {
        const deleteImages =
          vi.fn();

        const hardDelete =
          vi.fn();

        const service =
          new ContatoService(
            {
              findByIdIncludingDeleted:
                vi.fn()
                  .mockResolvedValue(
                    null,
                  ),

              hardDelete,
            } as unknown as ContatoRepository,

            {
              findByContatoId:
                vi.fn(),
            } as unknown as FotoRepository,

            {} as CompraRepository,

            {
              deleteImages,
            } as unknown as StorageService,

            {} as RecompraService,

            {} as CidadeRepository,

            {} as GeocodingService,
          );

        const resultado =
          await service
            .deleteDefinitivo(
              "inexistente",
            );

        expect(resultado).toBeNull();

        expect(
          deleteImages,
        ).not.toHaveBeenCalled();

        expect(
          hardDelete,
        ).not.toHaveBeenCalled();
      },
    );
  },
);