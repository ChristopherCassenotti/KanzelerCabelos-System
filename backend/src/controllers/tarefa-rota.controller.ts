import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { criarTarefaRotaSchema } from "../schemas/tarefa-rota.schema";
import { TarefaRotaService } from "../services/tarefa-rota.service";

export class TarefaRotaController {
  constructor(
    private readonly tarefaRotaService =
      new TarefaRotaService(),
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
      criarTarefaRotaSchema.safeParse(
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
      await this.tarefaRotaService.criar(
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

    return reply.status(201).send({
      tipo: resultado.tipo,
      tarefa: resultado.tarefa,
    });
  }
}