import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { MapaGlobalService } from "../services/mapa-global.service";

describe(
  "MapaGlobalService",
  () => {
    it(
      "retorna apenas contatos com localização válida",
      async () => {
        const contatoRepository = {
          findAllComCompras:
            vi.fn().mockResolvedValue([
              {
                id: "contato-1",
                nome: "Ana",
                telefone: "42999999999",
                endereco: "Rua A",
                status: "lead",
                lat: "10",
                lng: "20",
                cicloRecompraMeses: 8,
                cidade: {
                  id: "cidade-1",
                  nome: "União da Vitória",
                  uf: "PR",
                },
                compras: [],
              },
              {
                id: "contato-2",
                nome: "Maria",
                telefone: null,
                endereco: null,
                status: "lead",
                lat: null,
                lng: null,
                cicloRecompraMeses: 8,
                cidade: {
                  id: "cidade-1",
                  nome: "União da Vitória",
                  uf: "PR",
                },
                compras: [],
              },
            ]),
        };

        const service =
          new MapaGlobalService(
            contatoRepository as any,
            {} as any,
            {} as any,
          );

        const resultado =
          await service.buscar(
            {},
            Temporal.PlainDate.from(
              "2026-10-16",
            ),
          );

        expect(
          resultado.total,
        ).toBe(1);

        expect(
          resultado.contatos[0]?.id,
        ).toBe("contato-1");
      },
    );

    it(
      "marca contato comprado como recompra quando estiver pronto",
      async () => {
        const contatoRepository = {
          findAllComCompras:
            vi.fn().mockResolvedValue([
              {
                id: "contato-1",
                nome: "Ana",
                telefone: null,
                endereco: null,
                status: "comprado",
                lat: "-26.2",
                lng: "-51.0",
                cicloRecompraMeses: 8,
                cidade: {
                  id: "cidade-1",
                  nome: "União da Vitória",
                  uf: "PR",
                },
                compras: [
                  {
                    id: "compra-1",
                    dataCorte:
                      Temporal.PlainDate.from(
                        "2026-01-01",
                      ),
                  },
                ],
              },
            ]),
        };

        const service =
          new MapaGlobalService(
            contatoRepository as any,
            {} as any,
            {} as any,
          );

        const resultado =
          await service.buscar(
            {},
            Temporal.PlainDate.from(
              "2026-10-16",
            ),
          );

        expect(
          resultado.contatos[0]
            ?.status,
        ).toBe("comprado");

        expect(
          resultado.contatos[0]
            ?.statusMapa,
        ).toBe("recompra");

        expect(
          resultado.cidades[0]
            ?.recompra,
        ).toBe(1);
      },
    );

    it(
      "filtra somente contatos prontos para recompra",
      async () => {
        const contatoRepository = {
          findAllComCompras:
            vi.fn().mockResolvedValue([
              {
                id: "contato-1",
                nome: "Pronta",
                telefone: null,
                endereco: null,
                status: "comprado",
                lat: "-26.2",
                lng: "-51.0",
                cicloRecompraMeses: 8,
                cidade: {
                  id: "cidade-1",
                  nome: "União da Vitória",
                  uf: "PR",
                },
                compras: [
                  {
                    id: "compra-1",
                    dataCorte:
                      Temporal.PlainDate.from(
                        "2026-01-01",
                      ),
                  },
                ],
              },
              {
                id: "contato-2",
                nome: "Lead",
                telefone: null,
                endereco: null,
                status: "lead",
                lat: "-26.3",
                lng: "-51.1",
                cicloRecompraMeses: 8,
                cidade: {
                  id: "cidade-2",
                  nome: "Porto União",
                  uf: "SC",
                },
                compras: [],
              },
            ]),
        };

        const service =
          new MapaGlobalService(
            contatoRepository as any,
            {} as any,
            {} as any,
          );

        const resultado =
          await service.buscar(
            {
              soProntasRecompra:
                true,
            },
            Temporal.PlainDate.from(
              "2026-10-16",
            ),
          );

        expect(
          resultado.total,
        ).toBe(1);

        expect(
          resultado.contatos[0]
            ?.nome,
        ).toBe("Pronta");
      },
    );

    it(
      "inclui a rota quando uma data for informada",
      async () => {
        const contatoRepository = {
          findAllComCompras:
            vi.fn().mockResolvedValue(
              [],
            ),
        };

        const diaRotaRepository = {
          findByDate:
            vi.fn().mockResolvedValue({
              id: "rota-1",
            }),
        };

        const mapaRotaService = {
          buscar:
            vi.fn().mockResolvedValue({
              id: "rota-1",
              paradas: [],
            }),
        };

        const service =
          new MapaGlobalService(
            contatoRepository as any,
            diaRotaRepository as any,
            mapaRotaService as any,
          );

        const data =
          Temporal.PlainDate.from(
            "2026-10-20",
          );

        const resultado =
          await service.buscar({
            dataRota: data,
          });

        expect(
          diaRotaRepository
            .findByDate,
        ).toHaveBeenCalledWith(
          data,
        );

        expect(
          mapaRotaService.buscar,
        ).toHaveBeenCalledWith(
          "rota-1",
        );

        expect(
          resultado.rota,
        ).toEqual({
          id: "rota-1",
          paradas: [],
        });
      },
    );
  },
);