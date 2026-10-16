import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { mapaGlobalQuerySchema } from "../schemas/mapa-global.schema";
import { MapaGlobalService } from "../services/mapa-global.service";

export class MapaGlobalController {
  constructor(
    private readonly mapaGlobalService =
      new MapaGlobalService(),
  ) {}

  async index(
    request: FastifyRequest<{
      Querystring: {
        status?: string;
        cidadeId?: string;
        soProntasRecompra?: string;
        dataRota?: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const resultado =
      mapaGlobalQuerySchema.safeParse(
        request.query,
      );

    if (!resultado.success) {
      return reply.status(400).send({
        error:
          "Filtros do mapa inválidos",
        details:
          resultado.error.flatten(),
      });
    }

    const filtros = {
      ...(resultado.data.status !==
      undefined
        ? {
            status:
              resultado.data.status,
          }
        : {}),

      ...(resultado.data.cidadeId !==
      undefined
        ? {
            cidadeId:
              resultado.data.cidadeId,
          }
        : {}),

      ...(resultado.data
        .soProntasRecompra !==
      undefined
        ? {
            soProntasRecompra:
              resultado.data
                .soProntasRecompra,
          }
        : {}),

      ...(resultado.data.dataRota !==
      undefined
        ? {
            dataRota:
              Temporal.PlainDate.from(
                resultado.data.dataRota,
              ),
          }
        : {}),
    };

    const mapa =
      await this.mapaGlobalService.buscar(
        filtros,
      );

    return reply.send(mapa);
  }
}