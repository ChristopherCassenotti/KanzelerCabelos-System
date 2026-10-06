import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { criarDiaRotaSchema } from "../schemas/dia-rota.schema";
import { DiaRotaService } from "../services/dia-rota.service";

export class DiaRotaController {
  constructor(
    private readonly diaRotaService =
      new DiaRotaService(),
  ) {}

  async create(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const resultadoSchema =
      criarDiaRotaSchema.safeParse(
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
      await this.diaRotaService.criar(
        resultadoSchema.data,
      );

    if (
      resultado.tipo ===
      "cidade_nao_encontrada"
    ) {
      return reply.status(404).send({
        error: "Cidade de partida não encontrada",
      });
    }

    if (
      resultado.tipo ===
      "data_ja_existe"
    ) {
      return reply.status(409).send({
        error:
          "Já existe uma rota cadastrada para esta data",
      });
    }

    return reply
      .status(201)
      .send(resultado.dia);
  }

  async index(
      _request: FastifyRequest,
      reply: FastifyReply,
    ) {
      const rotas =
        await this.diaRotaService.listar();

      return reply.send(rotas);
    }
}