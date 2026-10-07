import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { AAgendarService } from "../services/a-agendar.service";
import { aAgendarQuerySchema } from "../schemas/a-agendar.schema";

export class AAgendarController {
  constructor(
    private readonly aAgendarService =
      new AAgendarService(),
  ) {}

async index(
  request: FastifyRequest<{
    Querystring: {
      cidadeId?: string;
      tipo?: string;
    };
  }>,
  reply: FastifyReply,
) {
  const resultadoSchema =
    aAgendarQuerySchema.safeParse(
      request.query,
    );

  if (!resultadoSchema.success) {
    return reply.status(400).send({
      error: "Filtros inválidos",
      details:
        resultadoSchema.error.flatten(),
    });
  }

  const contatos =
    await this.aAgendarService.listar(
      undefined,
      resultadoSchema.data,
    );

  return reply.send(contatos);
}
async resumo(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const resumo =
    await this.aAgendarService.resumir();

  return reply.send(resumo);
}
}