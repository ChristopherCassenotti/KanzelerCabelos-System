import type { FastifyReply, FastifyRequest } from "fastify";
import { criarContatoSchema, atualizarContatoSchema } from "../schemas/contato.schema";
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
  
  async index(_request: FastifyRequest, reply: FastifyReply) {
    const contatos = await this.contatoService.findAll();

    return reply.send(contatos);
  }

  async show(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const contato = await this.contatoService.findById(request.params.id);

    if (!contato) {
      return reply.status(404).send({
        error: "Contato não encontrado",
      });
    }

    return reply.send(contato);
  }
  
  async update(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const result = atualizarContatoSchema.safeParse(request.body);

    if (!result.success) {
      return reply.status(400).send({
        error: "Dados inválidos",
        details: result.error.flatten(),
      });
    }

    const contato = await this.contatoService.update(
      request.params.id,
      result.data,
    );

    if (!contato) {
      return reply.status(404).send({
        error: "Contato não encontrado",
      });
    }

    return reply.send(contato);
  }

  async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const contato = await this.contatoService.delete(request.params.id);
  
    if (!contato) {
      return reply.status(404).send({
        error: "Contato não encontrado",
      });
    }
  
    return reply.status(204).send();
  }
}