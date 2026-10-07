import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { HorariosRotaService } from "../services/horarios-rota.service";

export class HorariosRotaController {
  constructor(
    private readonly horariosRotaService =
      new HorariosRotaService(),
  ) {}

  async calcular(
    request: FastifyRequest<{
      Params: {
        diaRotaId: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const resultado =
      await this.horariosRotaService.calcular(
        request.params.diaRotaId,
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
      "rota_sem_itens"
    ) {
      return reply.status(409).send({
        error: "Rota não possui itens",
      });
    }

    return reply.send({
      tipo: resultado.tipo,
      itens: resultado.itens,
    });
  }
}