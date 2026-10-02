import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { RecompraService } from "../services/recompra.service";

export class RecompraController {
  constructor(
    private readonly recompraService = new RecompraService(),
  ) {}

  async index(
    _request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const contatos =
      await this.recompraService.listarProntas();

    return reply.send(contatos);
  }
}