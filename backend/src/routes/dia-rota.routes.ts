import type { FastifyInstance } from "fastify";

import { DiaRotaController } from "../controllers/dia-rota.controller";

const diaRotaController =
  new DiaRotaController();

export async function diaRotaRoutes(
  app: FastifyInstance,
) {
app.get<{
  Querystring: {
    de?: string;
    ate?: string;
  };
}>("/", (request, reply) => {
  return diaRotaController.index(
    request,
    reply,
  );
});

  app.post("/", (request, reply) => {
    return diaRotaController.create(
      request,
      reply,
    );
  });

  app.get<{
  Params: {
    id: string;
  };
}>("/:id", (request, reply) => {
  return diaRotaController.show(
    request,
    reply,
  );
});
app.patch<{
  Params: {
    id: string;
  };
}>("/:id", (request, reply) => {
  return diaRotaController.update(
    request,
    reply,
  );
});
}