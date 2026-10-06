import type { FastifyInstance } from "fastify";

import { ItemRotaController } from "../controllers/item-rota.controller";

const itemRotaController =
  new ItemRotaController();

export async function itemRotaRoutes(
  app: FastifyInstance,
) {
  app.patch<{
    Params: {
      diaRotaId: string;
      itemId: string;
    };
  }>(
    "/:diaRotaId/itens/:itemId/concluir",
    (request, reply) => {
      return itemRotaController.concluir(
        request,
        reply,
      );
    },
  );

    app.delete<{
      Params: {
        diaRotaId: string;
        itemId: string;
      };
    }>(
      "/:diaRotaId/itens/:itemId",
      (request, reply) => {
        return itemRotaController.remover(
          request,
          reply,
        );
      },
    );
}