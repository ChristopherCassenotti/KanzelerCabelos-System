import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { criarDiaRotaSchema } from "../schemas/dia-rota.schema";
import { DiaRotaService } from "../services/dia-rota.service";
import { diaRotaQuerySchema } from "../schemas/dia-rota-query.schema";
import { atualizarDiaRotaSchema } from "../schemas/atualizar-dia-rota.schema";

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
  request: FastifyRequest<{
    Querystring: {
      de?: string;
      ate?: string;
    };
  }>,
  reply: FastifyReply,
) {
  const resultadoSchema =
    diaRotaQuerySchema.safeParse(
      request.query,
    );

  if (!resultadoSchema.success) {
    return reply.status(400).send({
      error: "Período inválido",
      details:
        resultadoSchema.error.flatten(),
    });
  }

  const rotas =
    await this.diaRotaService.listar(
      resultadoSchema.data,
    );

  return reply.send(rotas);
}
async show(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply,
) {
  const rota =
    await this.diaRotaService.buscarPorId(
      request.params.id,
    );

  if (!rota) {
    return reply.status(404).send({
      error: "Rota não encontrada",
    });
  }

  return reply.send(rota);
}
async update(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply,
) {
  const resultadoSchema =
    atualizarDiaRotaSchema.safeParse(
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
    await this.diaRotaService.atualizar(
      request.params.id,
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

  if (
    resultado.tipo ===
    "cidade_nao_encontrada"
  ) {
    return reply.status(404).send({
      error:
        "Cidade de partida não encontrada",
    });
  }

  return reply.send({
    tipo: resultado.tipo,
    rota: resultado.rota,
  });
}
}