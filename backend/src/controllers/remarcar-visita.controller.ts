import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { RemarcarVisitaService } from "../services/remarcar-visita.service";

export class RemarcarVisitaController {
  constructor(
    private readonly remarcarVisitaService =
      new RemarcarVisitaService(),
  ) {}

  async adiar(
    request: FastifyRequest<{
      Params: {
        diaRotaId: string;
        itemId: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const resultado =
      await this.remarcarVisitaService.adiarParaDiaSeguinte(
        request.params.diaRotaId,
        request.params.itemId,
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
      "item_nao_encontrado"
    ) {
      return reply.status(404).send({
        error: "Visita não encontrada",
      });
    }

    if (
      resultado.tipo ===
      "item_nao_visita"
    ) {
      return reply.status(409).send({
        error:
          "Somente visitas podem ser adiadas",
      });
    }

    return reply.send({
      tipo: resultado.tipo,
      visita: resultado.visita,
      novaData: resultado.novaData,
    });
  }
}