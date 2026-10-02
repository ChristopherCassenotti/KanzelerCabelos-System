import type { FastifyInstance } from "fastify";

import { ContatoStatusController } from "../controllers/contato-status.controller";

const contatoStatusController =
  new ContatoStatusController();

export async function contatoStatusRoutes(
  app: FastifyInstance,
) {
  app.patch<{
    Params: {
      id: string;
    };
  }>("/:id/status", (request, reply) => {
    return contatoStatusController.update(
      request,
      reply,
    );
  });
}