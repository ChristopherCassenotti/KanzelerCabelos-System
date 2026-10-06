import type { FastifyInstance } from "fastify";

import { DiaRotaController } from "../controllers/dia-rota.controller";

const diaRotaController =
  new DiaRotaController();

export async function diaRotaRoutes(
  app: FastifyInstance,
) {
  app.get("/", (request, reply) => {
    return diaRotaController.index(
      request,
      reply,
    );
  });

  app.post("/", (request, reply) => {
    return diaRotaController.create(
      request,
      reply,
    );
  });
}