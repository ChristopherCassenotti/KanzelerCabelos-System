import type { FastifyInstance } from "fastify";
import { CidadeController } from "../controllers/cidade.controller";

const cidadeController = new CidadeController();

export async function cidadeRoutes(app: FastifyInstance) {
  app.get("/", (request, reply) => {
    return cidadeController.index(request, reply);
  });
}