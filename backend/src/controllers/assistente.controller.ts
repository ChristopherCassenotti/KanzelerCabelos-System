import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  assistenteMensagemSchema,
  confirmarContatoAssistenteSchema,
} from "../schemas/assistente.schema";

import { AssistenteError } from "../services/assistente.errors";
import { AssistenteService } from "../services/assistente.service";

export class AssistenteController {
  constructor(
    private readonly assistenteService =
      new AssistenteService(),
  ) {}

  async mensagem(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const usuarioId = request.usuarioId;

    if (!usuarioId) {
      return reply.status(401).send({
        error: "Não autenticado",
      });
    }

    const result =
      assistenteMensagemSchema.safeParse(
        request.body,
      );

    if (!result.success) {
      return reply.status(400).send({
        error: "Dados inválidos",
        details:
          result.error.flatten(),
      });
    }

    try {
      const resposta =
        await this.assistenteService.processarMensagem(
          usuarioId,
          result.data,
        );

      return reply.send(resposta);
    } catch (error) {
      return this.responderErro(
        request,
        reply,
        error,
      );
    }
  }

  async confirmarContato(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const usuarioId = request.usuarioId;

    if (!usuarioId) {
      return reply.status(401).send({
        error: "Não autenticado",
      });
    }

    const result =
      confirmarContatoAssistenteSchema.safeParse(
        request.body,
      );

    if (!result.success) {
      return reply.status(400).send({
        error: "Dados inválidos",
        details:
          result.error.flatten(),
      });
    }

    try {
      const criado =
        await this.assistenteService.confirmarContato(
          usuarioId,
          result.data,
        );

      return reply
        .status(criado.reaproveitado ? 200 : 201)
        .send(criado);
    } catch (error) {
      return this.responderErro(
        request,
        reply,
        error,
      );
    }
  }

  private responderErro(
    request: FastifyRequest,
    reply: FastifyReply,
    error: unknown,
  ) {
    if (error instanceof AssistenteError) {
      if (
        error.codigo === "limite_excedido" &&
        typeof error.detalhes === "object" &&
        error.detalhes !== null &&
        "retryAfterSegundos" in error.detalhes
      ) {
        reply.header(
          "Retry-After",
          String(error.detalhes.retryAfterSegundos),
        );
      }

      return reply.status(error.statusCode).send({
        error: error.message,
        code: error.codigo,
        ...(error.detalhes !== undefined
          ? { details: error.detalhes }
          : {}),
      });
    }

    request.log.error(
      {
        tipo:
          error instanceof Error
            ? error.name
            : typeof error,
      },
      "assistente: erro inesperado",
    );

    return reply.status(500).send({
      error:
        "Não foi possível concluir a operação. Nada foi salvo; tente novamente.",
      code: "erro_interno",
    });
  }
}
