import type { FastifyReply, FastifyRequest } from "fastify";
import { CidadeService } from "../services/cidade.service";

export class CidadeController {
  constructor(
    private readonly cidadeService = new CidadeService(),
  ) {}

  async index(_request: FastifyRequest, reply: FastifyReply) {
    const cidades = await this.cidadeService.findAll();

    return reply.send(cidades);
  }
}