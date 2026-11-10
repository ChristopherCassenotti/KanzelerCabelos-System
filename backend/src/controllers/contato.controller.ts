import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  criarContatoSchema,
  criarContatoComCompraSchema,
  atualizarContatoSchema,
} from "../schemas/contato.schema";

import { buscaContatoQuerySchema } from "../schemas/busca-contato.schema";

import { ContatoService } from "../services/contato.service";
import { CidadeService } from "../services/cidade.service";

export class ContatoController {
  constructor(
    private readonly contatoService =
      new ContatoService(),
    private readonly cidadeService =
      new CidadeService(),
  ) {}

  async create(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const result =
      criarContatoSchema.safeParse(
        request.body,
      );

    if (!result.success) {
      return reply.status(400).send({
        error: "Dados inválidos",
        details:
          result.error.flatten(),
      });
    }

    const contato =
      await this.contatoService.create(
        result.data,
      );

    return reply
      .status(201)
      .send(contato);
  }

  async createComCompra(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const result =
      criarContatoComCompraSchema.safeParse(
        request.body,
      );

    if (!result.success) {
      return reply.status(400).send({
        error: "Dados inválidos",
        details:
          result.error.flatten(),
      });
    }

    const cidade =
      await this.cidadeService.findById(
        result.data.contato.cidadeId,
      );

    if (!cidade) {
      return reply.status(422).send({
        error:
          "Cidade não encontrada",
      });
    }

    const criado =
      await this.contatoService.createComCompra(
        result.data,
        request.usuarioId,
      );

    return reply
      .status(201)
      .send(criado);
  }

  async index(
    _request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const contatos =
      await this.contatoService.findAll();

    return reply.send(contatos);
  }

  async buscar(
    request: FastifyRequest<{
      Querystring: {
        q?: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const resultadoSchema =
      buscaContatoQuerySchema.safeParse(
        request.query,
      );

    if (!resultadoSchema.success) {
      return reply.status(400).send({
        error:
          "Termo de busca inválido",
        details:
          resultadoSchema.error.flatten(),
      });
    }

    const contatos =
      await this.contatoService.buscar(
        resultadoSchema.data.q,
      );

    return reply.send({
      total:
        contatos.length,
      contatos,
    });
  }

  async show(
    request: FastifyRequest<{
      Params: {
        id: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const contato =
      await this.contatoService.findById(
        request.params.id,
      );

    if (!contato) {
      return reply.status(404).send({
        error:
          "Contato não encontrado",
      });
    }

    return reply.send(contato);
  }

  async update(
    request: FastifyRequest<{
      Params: {
        id: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const result =
      atualizarContatoSchema.safeParse(
        request.body,
      );

    if (!result.success) {
      return reply.status(400).send({
        error:
          "Dados inválidos",
        details:
          result.error.flatten(),
      });
    }

    const contato =
      await this.contatoService.update(
        request.params.id,
        result.data,
      );

    if (!contato) {
      return reply.status(404).send({
        error:
          "Contato não encontrado",
      });
    }

    return reply.send(contato);
  }

  async delete(
    request: FastifyRequest<{
      Params: {
        id: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const contato =
      await this.contatoService.delete(
      request.params.id,
      request.usuarioId,
    );

    if (!contato) {
      return reply.status(404).send({
        error:
          "Contato não encontrado",
      });
    }

    return reply
      .status(204)
      .send();
  }

  async deleteDefinitivo(
    request: FastifyRequest<{
      Params: {
        id: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const contato =
    await this.contatoService
    .deleteDefinitivo(
      request.params.id,
      request.usuarioId,
    );

    if (!contato) {
      return reply.status(404).send({
        error:
          "Contato não encontrado",
      });
    }

    return reply
      .status(204)
      .send();
  }
}