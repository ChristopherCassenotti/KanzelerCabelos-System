import type {
  FastifyInstance,
} from "fastify";

import { AssistenteController } from "../controllers/assistente.controller";

const assistenteController =
  new AssistenteController();

const BODY_LIMIT = 64 * 1024;

export async function assistenteRoutes(
  app: FastifyInstance,
  options: {
    controller?: AssistenteController;
  } = {},
) {
  const controller =
    options.controller ??
    assistenteController;

  app.post(
    "/mensagem",
    {
      bodyLimit: BODY_LIMIT,
    },
    (request, reply) => {
      return controller.mensagem(
        request,
        reply,
      );
    },
  );

  app.post(
    "/confirmar-contato",
    {
      bodyLimit: BODY_LIMIT,
    },
    (request, reply) => {
      return controller.confirmarContato(
        request,
        reply,
      );
    },
  );
}
