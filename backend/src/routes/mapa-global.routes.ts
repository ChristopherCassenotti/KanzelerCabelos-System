import type {
  FastifyInstance,
} from "fastify";

import { MapaGlobalController } from "../controllers/mapa-global.controller";

const mapaGlobalController =
  new MapaGlobalController();

export async function mapaGlobalRoutes(
  app: FastifyInstance,
) {
  app.get<{
    Querystring: {
      status?: string;
      cidadeId?: string;
      soProntasRecompra?: string;
      dataRota?: string;
    };
  }>(
    "/",
    (request, reply) => {
      return mapaGlobalController.index(
        request,
        reply,
      );
    },
  );
}