import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { alterarStatusContatoSchema } from "../schemas/contato-status.schema";
import { ContatoStatusService } from "../services/contato-status.service";

export class ContatoStatusController {
  constructor(
    private readonly contatoStatusService =
      new ContatoStatusService(),
  ) {}

  async update(
    request: FastifyRequest<{
      Params: {
        id: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const resultadoSchema =
      alterarStatusContatoSchema.safeParse(
        request.body,
      );

    if (!resultadoSchema.success) {
      return reply.status(400).send({
        error: "Dados inválidos",
        details:
          resultadoSchema.error.flatten(),
      });
    }

    const resultado =
      await this.contatoStatusService.alterar(
        request.params.id,
        resultadoSchema.data.status,
        resultadoSchema.data.motivoPerda,
      );

    if (resultado.tipo === "nao_encontrado") {
      return reply.status(404).send({
        error: "Contato não encontrado",
      });
    }

    if (
      resultado.tipo ===
      "transicao_invalida"
    ) {
      return reply.status(409).send({
        error: "Transição de status inválida",
        statusAtual: resultado.statusAtual,
        novoStatus: resultado.novoStatus,
      });
    }

    if (
      resultado.tipo ===
      "motivo_obrigatorio"
    ) {
      return reply.status(400).send({
        error:
          "Motivo da perda é obrigatório",
      });
    }

    return reply.send(resultado.contato);
  }
}