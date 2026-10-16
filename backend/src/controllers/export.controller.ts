import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  exportContatosQuerySchema,
} from "../schemas/export-contatos.schema";

import {
  ExportContatosService,
} from "../services/export-contatos.service";

export class ExportController {
  constructor(
    private readonly exportContatosService =
      new ExportContatosService(),
  ) {}

  async contatos(
    request: FastifyRequest<{
      Querystring: {
        status?: string;
        cidadeId?: string;
        origem?: string;
        natural?: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const resultadoSchema =
      exportContatosQuerySchema.safeParse(
        request.query,
      );

    if (!resultadoSchema.success) {
      return reply.status(400).send({
        error:
          "Filtros inválidos",
        details:
          resultadoSchema.error.flatten(),
      });
    }

    const resultado =
      await this.exportContatosService
        .gerar(
          resultadoSchema.data,
        );

    const arquivo =
      Buffer.from(
        resultado.buffer,
      );

    reply.header(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    reply.header(
      "Content-Disposition",
      'attachment; filename="contatos-kanzler.xlsx"',
    );

    reply.header(
      "X-Total-Registros",
      String(resultado.total),
    );

    return reply.send(
      arquivo,
    );
  }
}