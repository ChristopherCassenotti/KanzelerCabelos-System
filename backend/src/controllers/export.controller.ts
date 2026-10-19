import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  exportContatosQuerySchema,
} from "../schemas/export-contatos.schema";

import {
  ExportRotaService,
} from "../services/export-rota.service";

import {
  relatorioIndicadoresQuerySchema,
} from "../schemas/relatorio.schema";

import {
  ExportRelatoriosService,
} from "../services/export-relatorios.service";

import {
  ExportContatosService,
} from "../services/export-contatos.service";

export class ExportController {
  constructor(
    private readonly exportContatosService =
      new ExportContatosService(),
    
    private readonly exportRelatoriosService =
      new ExportRelatoriosService(),

    private readonly exportRotaService =
      new ExportRotaService(),
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

  async relatorios(
  request: FastifyRequest<{
    Querystring: {
      periodo?: string;
    };
  }>,
  reply: FastifyReply,
) {
  const resultadoSchema =
    relatorioIndicadoresQuerySchema
      .safeParse(
        request.query,
      );

  if (
    !resultadoSchema.success
  ) {
    return reply
      .status(400)
      .send({
        error:
          "Período inválido",
        details:
          resultadoSchema
            .error
            .flatten(),
      });
  }

  const buffer =
    await this
      .exportRelatoriosService
      .gerar(
        resultadoSchema
          .data
          .periodo,
      );

  const arquivo =
    Buffer.from(
      buffer,
    );

  reply.header(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );

  reply.header(
    "Content-Disposition",
    'attachment; filename="relatorios-kanzler.xlsx"',
  );

  return reply.send(
    arquivo,
  );
}

async rota(
  request: FastifyRequest<{
    Params: {
      diaRotaId: string;
    };
  }>,
  reply: FastifyReply,
) {
  const resultado =
    await this.exportRotaService
      .gerar(
        request.params.diaRotaId,
      );

  if (!resultado) {
    return reply
      .status(404)
      .send({
        error:
          "Rota não encontrada",
      });
  }

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
    `attachment; filename="rota-kanzler-${resultado.data}.xlsx"`,
  );

  return reply.send(
    arquivo,
  );
}
}