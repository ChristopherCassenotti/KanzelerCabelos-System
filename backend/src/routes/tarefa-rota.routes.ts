import type { FastifyInstance } from "fastify";

import { TarefaRotaController } from "../controllers/tarefa-rota.controller";

const tarefaRotaController =
  new TarefaRotaController();

export async function tarefaRotaRoutes(
  app: FastifyInstance,
) {
  app.post<{
    Params: {
      diaRotaId: string;
    };
  }>(
    "/:diaRotaId/tarefas",
    (request, reply) => {
      return tarefaRotaController.create(
        request,
        reply,
      );
    },
  );
}