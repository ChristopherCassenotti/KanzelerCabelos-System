import type { FastifyInstance } from "fastify";

import { RecompraController } from "../controllers/recompra.controller";

const recompraController = new RecompraController();

export async function recompraRoutes(
  app: FastifyInstance,
) {
  app.get("/prontas", (request, reply) => {
    return recompraController.index(
      request,
      reply,
    );
  });
}