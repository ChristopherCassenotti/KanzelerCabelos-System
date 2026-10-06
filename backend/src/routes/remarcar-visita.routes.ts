import type { FastifyInstance } from "fastify";

import { RemarcarVisitaController } from "../controllers/remarcar-visita.controller";

const remarcarVisitaController =
  new RemarcarVisitaController();

export async function remarcarVisitaRoutes(
  app: FastifyInstance,
) {
  app.patch<{
    Params: {
      diaRotaId: string;
      itemId: string;
    };
  }>(
    "/:diaRotaId/visitas/:itemId/adiar",
    (request, reply) => {
      return remarcarVisitaController.adiar(
        request,
        reply,
      );
    },
  );
}