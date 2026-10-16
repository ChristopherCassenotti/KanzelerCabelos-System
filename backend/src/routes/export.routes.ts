import type {
  FastifyInstance,
} from "fastify";

import {
  ExportController,
} from "../controllers/export.controller";

const exportController =
  new ExportController();

export async function exportRoutes(
  app: FastifyInstance,
) {
  app.get<{
    Querystring: {
      status?: string;
      cidadeId?: string;
      origem?: string;
      natural?: string;
    };
  }>(
    "/contatos",
    (request, reply) => {
      return exportController
        .contatos(
          request,
          reply,
        );
    },
  );
}