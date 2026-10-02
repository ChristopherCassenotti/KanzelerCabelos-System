import type { FastifyInstance } from "fastify";
import { CompraController } from "../controllers/compra.controller";

const compraController = new CompraController();

export async function compraRoutes(
  app: FastifyInstance,
) {
  app.post<{Params: {contatoId: string;};}>("/:contatoId/compras", (request, reply) => {
    return compraController.create(request, reply);
  });

  app.get<{Params: {contatoId: string;};}>("/:contatoId/compras", (request, reply) => {
    return compraController.index(request, reply);
  });
}