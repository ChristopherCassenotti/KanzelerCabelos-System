import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { concluirItemRotaSchema } from "../schemas/concluir-item-rota.schema";
import { ItemRotaService } from "../services/item-rota.service";

export class ItemRotaController {
  constructor(
    private readonly itemRotaService =
      new ItemRotaService(),
  ) {}

  async concluir(
    request: FastifyRequest<{
      Params: {
        diaRotaId: string;
        itemId: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const resultadoSchema =
      concluirItemRotaSchema.safeParse(
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
      await this.itemRotaService.concluir(
        request.params.diaRotaId,
        request.params.itemId,
        resultadoSchema.data,
      );

    if (
      resultado.tipo ===
      "item_nao_encontrado"
    ) {
      return reply.status(404).send({
        error: "Item não encontrado",
      });
    }

    if (
      resultado.tipo ===
      "item_ja_concluido"
    ) {
      return reply.status(409).send({
        error: "Item já concluído",
      });
    }

    if (
      resultado.tipo ===
      "resultado_obrigatorio"
    ) {
      return reply.status(400).send({
        error:
          "Resultado é obrigatório para concluir uma visita",
      });
    }

    return reply.send({
      tipo: resultado.tipo,
      item: resultado.item,
      exigeRegistroCompra:
        resultado.exigeRegistroCompra,
    });
  }

  async remover(
      request: FastifyRequest<{
        Params: {
          diaRotaId: string;
          itemId: string;
        };
      }>,
      reply: FastifyReply,
    ) {
      const resultado =
        await this.itemRotaService.remover(
          request.params.diaRotaId,
          request.params.itemId,
        );
    
      if (
        resultado.tipo ===
        "item_nao_encontrado"
      ) {
        return reply.status(404).send({
          error: "Item não encontrado",
        });
      }
  
      return reply.status(204).send();
    }
}