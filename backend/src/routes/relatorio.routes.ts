import type {
  FastifyInstance,
} from "fastify";

import { RelatorioController } from "../controllers/relatorio.controller";

const relatorioController =
  new RelatorioController();

export async function relatorioRoutes(
  app: FastifyInstance,
) {
  app.get<{
    Querystring: {
      periodo?: string;
    };
  }>(
    "/indicadores",
    (request, reply) => {
      return relatorioController.indicadores(
        request,
        reply,
      );
    },
  );

  app.get<{
  Params: {
    diaRotaId: string;
  };
}>(
  "/viagens/:diaRotaId",
  (request, reply) => {
    return relatorioController.viagem(
      request,
      reply,
    );
  },
);
app.get<{
  Querystring: {
    periodo?: string;
  };
}>(
  "/compras",
  (request, reply) => {
    return relatorioController.compras(
      request,
      reply,
    );
  },
);

app.get<{
  Querystring: {
    periodo?: string;
  };
}>(
  "/preco-medio",
  (request, reply) => {
    return relatorioController.precoMedio(
      request,
      reply,
    );
  },
);

app.get<{
  Querystring: {
    periodo?: string;
  };
}>(
  "/origens-perdas",
  (request, reply) => {
    return relatorioController.origemPerdas(
      request,
      reply,
    );
  },
);

app.get<{
  Querystring: {
    periodo?: string;
  };
}>(
  "/conversao-cidade",
  (request, reply) => {
    return relatorioController
      .conversaoCidade(
        request,
        reply,
      );
  },
);

app.get(
  "/previsao-recompra",
  (request, reply) => {
    return relatorioController
      .previsaoRecompra(
        request,
        reply,
      );
  },
);
}