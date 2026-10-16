import {
  describe,
  expect,
  it,
} from "vitest";

import {
  distanciaHaversineKm,
  ordenarPorMenorDistancia,
} from "../services/ordem-rota.rules";

describe(
  "ordem-rota.rules",
  () => {
    it(
      "calcula a distância aproximada entre dois pontos",
      () => {
        const distancia =
          distanciaHaversineKm(
            {
              lat: 0,
              lng: 0,
            },
            {
              lat: 0,
              lng: 1,
            },
          );

        expect(
          distancia,
        ).toBeGreaterThan(
          111,
        );

        expect(
          distancia,
        ).toBeLessThan(
          112,
        );
      },
    );

    it(
      "ordena os pontos pelo vizinho mais próximo a partir da origem",
      () => {
        const ordem =
          ordenarPorMenorDistancia(
            {
              lat: 0,
              lng: 0,
            },
            [
              {
                id: "visita-3",
                lat: 0,
                lng: 0.03,
              },
              {
                id: "visita-1",
                lat: 0,
                lng: 0.01,
              },
              {
                id: "visita-2",
                lat: 0,
                lng: 0.02,
              },
            ],
          );

        expect(
          ordem,
        ).toEqual([
          "visita-1",
          "visita-2",
          "visita-3",
        ]);
      },
    );

    it(
      "não altera a lista original recebida",
      () => {
        const pontos = [
          {
            id: "visita-b",
            lat: 0,
            lng: 0.02,
          },
          {
            id: "visita-a",
            lat: 0,
            lng: 0.01,
          },
        ];

        const original =
          structuredClone(
            pontos,
          );

        ordenarPorMenorDistancia(
          {
            lat: 0,
            lng: 0,
          },
          pontos,
        );

        expect(
          pontos,
        ).toEqual(
          original,
        );
      },
    );
  },
);