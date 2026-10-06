import type { FastifyInstance } from "fastify";

import { VisitaRotaController } from "../controllers/visita-rota.controller";

const visitaRotaController =
  new VisitaRotaController();

export async function visitaRotaRoutes(
  app: FastifyInstance,
) {
  app.post<{
    Params: {
      diaRotaId: string;
    };
  }>(
    "/:diaRotaId/visitas",
    (request, reply) => {
      return visitaRotaController.create(
        request,
        reply,
      );
    },
  );
}