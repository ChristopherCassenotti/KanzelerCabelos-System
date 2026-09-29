import type { FastifyInstance } from "fastify";
import { ContatoController } from "../controllers/contato.controller";

const contatoController = new ContatoController();

export async function contatoRoutes(app: FastifyInstance) {
  app.post("/", (request, reply) => {
    return contatoController.create(request, reply);
  });
}