import type { FastifyInstance } from "fastify";
import { contatoRoutes } from "./contato.routes";
import { cidadeRoutes } from "./cidade.routes";
import { fotoRoutes } from "./foto.routes";
import { compraRoutes } from "./compra.routes";
import { recompraRoutes } from "./recompra.routes";
import { contatoStatusRoutes } from "./contato-status.routes";

export async function routes(app: FastifyInstance) {
  await app.register(cidadeRoutes, {
    prefix: "/cidades",
  });

  await app.register(contatoRoutes, {
    prefix: "/contatos",
  });

  await app.register(fotoRoutes, {
    prefix: "/contatos",
  });

  await app.register(compraRoutes, {
    prefix: "/contatos",
  });
  
  await app.register(recompraRoutes, {
    prefix: "/recompras",
  });

  await app.register(contatoStatusRoutes, {
    prefix: "/contatos",
  });
}

