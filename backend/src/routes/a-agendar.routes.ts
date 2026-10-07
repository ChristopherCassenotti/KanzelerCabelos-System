import type { FastifyInstance } from "fastify";

import { AAgendarController } from "../controllers/a-agendar.controller";

const aAgendarController =
  new AAgendarController();

export async function aAgendarRoutes(
  app: FastifyInstance,
) {
app.get<{
  Querystring: {
    cidadeId?: string;
    tipo?: string;
  };
}>("/", (request, reply) => {
  return aAgendarController.index(
    request,
    reply,
  );
});

app.get(
  "/resumo",
  (request, reply) => {
    return aAgendarController.resumo(
      request,
      reply,
    );
  },
);
}