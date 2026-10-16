import type {
  FastifyInstance,
} from "fastify";

import { ContatoController } from "../controllers/contato.controller";

const contatoController =
  new ContatoController();

export async function contatoRoutes(
  app: FastifyInstance,
) {
  app.get(
    "/",
    (request, reply) => {
      return contatoController.index(
        request,
        reply,
      );
    },
  );

  app.get<{
    Querystring: {
      q?: string;
    };
  }>(
    "/busca",
    (request, reply) => {
      return contatoController.buscar(
        request,
        reply,
      );
    },
  );

  app.get<{
    Params: {
      id: string;
    };
  }>(
    "/:id",
    (request, reply) => {
      return contatoController.show(
        request,
        reply,
      );
    },
  );

  app.post(
    "/",
    (request, reply) => {
      return contatoController.create(
        request,
        reply,
      );
    },
  );

  app.patch<{
    Params: {
      id: string;
    };
  }>(
    "/:id",
    (request, reply) => {
      return contatoController.update(
        request,
        reply,
      );
    },
  );

  app.delete<{
    Params: {
      id: string;
    };
  }>(
    "/:id",
    (request, reply) => {
      return contatoController.delete(
        request,
        reply,
      );
    },
  );

  app.delete<{
    Params: {
      id: string;
    };
  }>(
    "/:id/definitivo",
    (request, reply) => {
      return contatoController
        .deleteDefinitivo(
          request,
          reply,
        );
    },
  );
}