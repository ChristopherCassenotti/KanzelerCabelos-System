import type { FastifyInstance } from "fastify";
import { ContatoController } from "../controllers/contato.controller";

const contatoController = new ContatoController();

export async function contatoRoutes(app: FastifyInstance) {
  app.get("/", (request, reply) => {
    return contatoController.index(request, reply);
  });
  
  app.get<{Params: {id: string;};}>("/:id", (request, reply) => {
    return contatoController.show(request, reply);
  });

  app.post("/", (request, reply) => {
    return contatoController.create(request, reply);
  });

  app.patch<{Params: {id: string;};}>("/:id", (request, reply) => {
    return contatoController.update(request, reply);
  });

  app.delete<{Params: {id: string;};}>("/:id", (request, replay) => {
    return contatoController.delete(request, replay);
  })
}