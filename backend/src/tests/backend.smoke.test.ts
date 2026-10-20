import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import { app } from "../app";

describe(
  "Backend - smoke test",
  () => {
    beforeAll(
      async () => {
        await app.ready();
      },
    );

    afterAll(
      async () => {
        await app.close();
      },
    );

    it(
      "responde o health check",
      async () => {
        const resposta =
          await app.inject({
            method: "GET",
            url: "/health",
          });

        expect(
          resposta.statusCode,
        ).toBe(200);
      },
    );

    it(
      "mantém a rota de login pública",
      async () => {
        const resposta =
          await app.inject({
            method: "POST",
            url: "/auth/login",
            payload: {},
          });

        expect(
          resposta.statusCode,
        ).toBe(400);
      },
    );

    it(
      "protege as principais rotas privadas",
      async () => {
        const rotas = [
          "/contatos",
          "/cidades",
          "/a-agendar",
          "/painel/resumo",
          "/mapa",
          "/relatorios/indicadores?periodo=30",
          "/export/contatos",
          "/export/relatorios?periodo=30",
          "/export/rota/11111111-1111-4111-8111-111111111111",
        ];

        for (
          const url of rotas
        ) {
          const resposta =
            await app.inject({
              method: "GET",
              url,
            });

          expect(
            resposta.statusCode,
            `Esperava 401 em ${url}, recebeu ${resposta.statusCode}`,
          ).toBe(401);
        }
      },
    );

    it(
      "retorna 404 para rota inexistente",
      async () => {
        const resposta =
          await app.inject({
            method: "GET",
            url:
              "/rota-que-nao-existe",
          });

        expect(
          resposta.statusCode,
        ).toBe(404);
      },
    );
  },
);