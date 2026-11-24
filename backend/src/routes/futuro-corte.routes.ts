import type { FastifyInstance } from "fastify";

import { FuturoCorteController } from "../controllers/futuro-corte.controller";

const futuroCorteController =
  new FuturoCorteController();

interface ParamsId {
  Params: {
    id: string;
  };
}

export async function contatoFuturoCorteRoutes(
  app: FastifyInstance,
) {
  app.get<ParamsId>(
    "/:id/futuros-cortes",
    (request, reply) =>
      futuroCorteController.indexContato(
        request,
        reply,
      ),
  );

  app.post<ParamsId>(
    "/:id/futuros-cortes",
    (request, reply) =>
      futuroCorteController.create(
        request,
        reply,
      ),
  );
}

export async function futuroCorteRoutes(
  app: FastifyInstance,
) {
  app.get("/", (request, reply) =>
    futuroCorteController.index(
      request,
      reply,
    ),
  );

  app.patch<ParamsId>(
    "/:id",
    (request, reply) =>
      futuroCorteController.update(
        request,
        reply,
      ),
  );

  app.post<ParamsId>(
    "/:id/contatado",
    (request, reply) =>
      futuroCorteController.contatado(
        request,
        reply,
      ),
  );

  app.post<ParamsId>(
    "/:id/agendar-avaliacao",
    (request, reply) =>
      futuroCorteController.agendarAvaliacao(
        request,
        reply,
      ),
  );

  app.post<ParamsId>(
    "/:id/converter",
    (request, reply) =>
      futuroCorteController.converter(
        request,
        reply,
      ),
  );

  app.post<ParamsId>(
    "/:id/descartar",
    (request, reply) =>
      futuroCorteController.descartar(
        request,
        reply,
      ),
  );
}
