import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { PainelService } from "../services/painel.service";

export class PainelController {
  constructor(
    private readonly painelService =
      new PainelService(),
  ) {}

  async resumo(
    _request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const resumo =
      await this.painelService.resumo();

    return reply.send(resumo);
  }
}