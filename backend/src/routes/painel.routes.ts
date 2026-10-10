import type {
  FastifyInstance,
} from "fastify";

import { PainelController } from "../controllers/painel.controller";

const painelController =
  new PainelController();

export async function painelRoutes(
  app: FastifyInstance,
) {
  app.get(
    "/resumo",
    (request, reply) => {
      return painelController.resumo(
        request,
        reply,
      );
    },
  );
}