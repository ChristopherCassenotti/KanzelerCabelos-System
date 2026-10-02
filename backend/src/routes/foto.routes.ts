import type { FastifyInstance } from "fastify";
import { FotoController } from "../controllers/foto.controller";

const fotoController = new FotoController();

export async function fotoRoutes(app: FastifyInstance) {
  app.post<{Params: {contatoId: string;};}>("/:contatoId/fotos", (request, reply) => {
    return fotoController.upload(request, reply);
  });

  app.get<{Params: {contatoId: string;};}>("/:contatoId/fotos", (request, reply) => {
    return fotoController.index(request, reply);
  });

  app.delete<{Params: {contatoId: string; fotoId: string;};}>("/:contatoId/fotos/:fotoId", (request, reply) => {
    return fotoController.delete(request, reply);
  });
}