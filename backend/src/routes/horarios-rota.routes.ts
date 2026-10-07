import type { FastifyInstance } from "fastify";

import { HorariosRotaController } from "../controllers/horarios-rota.controller";

const horariosRotaController =
  new HorariosRotaController();

export async function horariosRotaRoutes(
  app: FastifyInstance,
) {
  app.post<{
    Params: {
      diaRotaId: string;
    };
  }>(
    "/:diaRotaId/calcular-horarios",
    (request, reply) => {
      return horariosRotaController.calcular(
        request,
        reply,
      );
    },
  );
}