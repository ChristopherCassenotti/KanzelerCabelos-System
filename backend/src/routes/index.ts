import type { FastifyInstance } from "fastify";
import { contatoRoutes } from "./contato.routes";
import { cidadeRoutes } from "./cidade.routes";
import { fotoRoutes } from "./foto.routes";
import { compraRoutes } from "./compra.routes";
import { recompraRoutes } from "./recompra.routes";
import { contatoStatusRoutes } from "./contato-status.routes";
import { diaRotaRoutes } from "./dia-rota.routes";
import { visitaRotaRoutes } from "./visita-rota.routes";
import { tarefaRotaRoutes } from "./tarefa-rota.routes";
import { itemRotaRoutes } from "./item-rota.routes";
import { remarcarVisitaRoutes } from "./remarcar-visita.routes";
import { horariosRotaRoutes } from "./horarios-rota.routes";
import { aAgendarRoutes } from "./a-agendar.routes";

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

  await app.register(diaRotaRoutes, {
    prefix: "/rotas",
  });

  await app.register(visitaRotaRoutes, {
    prefix: "/rotas",
  });

  await app.register(tarefaRotaRoutes, {
    prefix: "/rotas",
  });
  
  await app.register(itemRotaRoutes, {
    prefix: "/rotas",
  });

  await app.register(remarcarVisitaRoutes, {
    prefix: "/rotas",
  });
  
  await app.register(horariosRotaRoutes, {
      prefix: "/rotas",
  });
  
  await app.register(aAgendarRoutes, {
    prefix: "/a-agendar",
  });
}

