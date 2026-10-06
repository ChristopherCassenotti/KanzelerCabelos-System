import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { agendarVisitaSchema } from "../schemas/visita-rota.schema";
import { VisitaRotaService } from "../services/visita-rota.service";

export class VisitaRotaController {
  constructor(
    private readonly visitaRotaService =
      new VisitaRotaService(),
  ) {}

  async create(
    request: FastifyRequest<{
      Params: {
        diaRotaId: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const resultadoSchema =
      agendarVisitaSchema.safeParse(
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
      await this.visitaRotaService.agendar(
        request.params.diaRotaId,
        resultadoSchema.data,
      );

    if (
      resultado.tipo ===
      "rota_nao_encontrada"
    ) {
      return reply.status(404).send({
        error: "Rota não encontrada",
      });
    }

    if (
      resultado.tipo ===
      "contato_nao_encontrado"
    ) {
      return reply.status(404).send({
        error: "Contato não encontrado",
      });
    }

    if (
      resultado.tipo ===
      "contato_perdido"
    ) {
      return reply.status(409).send({
        error:
          "Contato perdido não pode ser agendado",
      });
    }

    if (
      resultado.tipo ===
      "visita_movida"
    ) {
      return reply.status(200).send({
        tipo: resultado.tipo,
        visita: resultado.visita,
      });
    }

    return reply.status(201).send({
      tipo: resultado.tipo,
      visita: resultado.visita,
    });
  }
}