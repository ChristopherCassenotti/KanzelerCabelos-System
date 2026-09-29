import type { FastifyReply, FastifyRequest } from "fastify";
import { criarContatoSchema } from "../schemas/contato.schema";
import { ContatoService } from "../services/contato.service";

export class ContatoController {
  constructor(
    private readonly contatoService = new ContatoService(),
  ) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const result = criarContatoSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        error: "Dados inválidos",
        details: result.error.flatten(),
      });
    }

    const contato = await this.contatoService.create(result.data);

    return reply.status(201).send(contato);
  }
}