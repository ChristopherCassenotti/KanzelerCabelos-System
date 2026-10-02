import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { registrarCompraSchema } from "../schemas/compra.schema";
import { CompraService } from "../services/compra.service";

export class CompraController {
  constructor(
    private readonly compraService = new CompraService(),
  ) {}

  async create(
    request: FastifyRequest<{
      Params: {
        contatoId: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const result = registrarCompraSchema.safeParse(
      request.body,
    );

    if (!result.success) {
      return reply.status(400).send({
        error: "Dados inválidos",
        details: result.error.flatten(),
      });
    }

    const compra = await this.compraService.registrar(
      request.params.contatoId,
      result.data,
    );

    if (!compra) {
      return reply.status(404).send({
        error: "Contato não encontrado",
      });
    }

    return reply.status(201).send(compra);
  }

  async index(
    request: FastifyRequest<{
      Params: {
        contatoId: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const compras = await this.compraService.findByContatoId(
      request.params.contatoId,
    );
  
    if (!compras) {
      return reply.status(404).send({
        error: "Contato não encontrado",
      });
    }
  
    return reply.send(compras);
  }
}