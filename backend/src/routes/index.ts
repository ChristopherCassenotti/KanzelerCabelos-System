import type { FastifyInstance } from "fastify";
import { contatoRoutes } from "./contato.routes";
import { cidadeRoutes } from "./cidade.routes";

export async function routes(app: FastifyInstance) {
  await app.register(cidadeRoutes, {
    prefix: "/cidades",
  });

  await app.register(contatoRoutes, {
    prefix: "/contatos",
  });
}