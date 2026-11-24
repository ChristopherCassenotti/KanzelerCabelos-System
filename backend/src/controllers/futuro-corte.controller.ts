import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";
import type { z } from "zod";

import {
  agendarAvaliacaoFuturoCorteSchema,
  atualizarFuturoCorteSchema,
  contatadoFuturoCorteSchema,
  criarFuturoCorteSchema,
  futuroCorteIdSchema,
  listarFuturosCortesQuerySchema,
} from "../schemas/futuro-corte.schema";
import { FuturoCorteService } from "../services/futuro-corte.service";

type RequestComId = FastifyRequest<{
  Params: {
    id: string;
  };
}>;

const ERROS = {
  contato_nao_encontrado: [
    404,
    "Contato não encontrado",
  ],
  nao_encontrado: [
    404,
    "Futuro corte não encontrado",
  ],
  rota_nao_encontrada: [
    404,
    "Rota não encontrada",
  ],
  ja_existe_ativo: [
    409,
    "Contato já possui um futuro corte ativo",
  ],
  encerrado: [
    409,
    "Futuro corte já foi encerrado",
  ],
  contato_perdido: [
    409,
    "Contato perdido não pode ser agendado",
  ],
  data_no_passado: [
    400,
    "A data do próximo contato deve ser hoje ou futura",
  ],
} as const;

function enviarErro(
  reply: FastifyReply,
  tipo: keyof typeof ERROS,
) {
  const [status, error] = ERROS[tipo];

  return reply.status(status).send({ error });
}

/** Valida o id da URL e o body; responde 400 e retorna null se inválido. */
function validar<T extends z.ZodType>(
  request: RequestComId,
  reply: FastifyReply,
  schema: T,
) {
  const id = futuroCorteIdSchema.safeParse(
    request.params.id,
  );

  if (!id.success) {
    reply.status(400).send({
      error: "Dados inválidos",
      details: id.error.flatten(),
    });

    return null;
  }

  const body = schema.safeParse(request.body);

  if (!body.success) {
    reply.status(400).send({
      error: "Dados inválidos",
      details: body.error.flatten(),
    });

    return null;
  }

  return { id: id.data, body: body.data };
}

function validarId(
  request: RequestComId,
  reply: FastifyReply,
) {
  const id = futuroCorteIdSchema.safeParse(
    request.params.id,
  );

  if (!id.success) {
    reply.status(400).send({
      error: "Dados inválidos",
      details: id.error.flatten(),
    });

    return null;
  }

  return id.data;
}

export class FuturoCorteController {
  constructor(
    private readonly futuroCorteService =
      new FuturoCorteService(),
  ) {}

  async indexContato(
    request: RequestComId,
    reply: FastifyReply,
  ) {
    const id = validarId(request, reply);

    if (id === null) {
      return reply;
    }

    const futurosCortes =
      await this.futuroCorteService
        .listarPorContato(id);

    if (!futurosCortes) {
      return enviarErro(
        reply,
        "contato_nao_encontrado",
      );
    }

    return reply.send(futurosCortes);
  }

  async create(
    request: RequestComId,
    reply: FastifyReply,
  ) {
    const dados = validar(
      request,
      reply,
      criarFuturoCorteSchema,
    );

    if (!dados) {
      return reply;
    }

    const resultado =
      await this.futuroCorteService.criar(
        dados.id,
        dados.body,
      );

    if (resultado.tipo !== "sucesso") {
      return enviarErro(reply, resultado.tipo);
    }

    return reply
      .status(201)
      .send(resultado.futuroCorte);
  }

  async index(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const query =
      listarFuturosCortesQuerySchema.safeParse(
        request.query,
      );

    if (!query.success) {
      return reply.status(400).send({
        error: "Filtros inválidos",
        details: query.error.flatten(),
      });
    }

    return reply.send(
      await this.futuroCorteService.listar(
        query.data,
      ),
    );
  }

  async update(
    request: RequestComId,
    reply: FastifyReply,
  ) {
    const dados = validar(
      request,
      reply,
      atualizarFuturoCorteSchema,
    );

    if (!dados) {
      return reply;
    }

    const resultado =
      await this.futuroCorteService.atualizar(
        dados.id,
        dados.body,
      );

    if (resultado.tipo !== "sucesso") {
      return enviarErro(reply, resultado.tipo);
    }

    return reply.send(resultado.futuroCorte);
  }

  async contatado(
    request: RequestComId,
    reply: FastifyReply,
  ) {
    const dados = validar(
      request,
      reply,
      contatadoFuturoCorteSchema,
    );

    if (!dados) {
      return reply;
    }

    const resultado =
      await this.futuroCorteService
        .marcarContatado(
          dados.id,
          dados.body,
        );

    if (resultado.tipo !== "sucesso") {
      return enviarErro(reply, resultado.tipo);
    }

    return reply.send(resultado.futuroCorte);
  }

  async agendarAvaliacao(
    request: RequestComId,
    reply: FastifyReply,
  ) {
    const dados = validar(
      request,
      reply,
      agendarAvaliacaoFuturoCorteSchema,
    );

    if (!dados) {
      return reply;
    }

    const resultado =
      await this.futuroCorteService
        .agendarAvaliacao(
          dados.id,
          dados.body,
        );

    if (resultado.tipo !== "sucesso") {
      return enviarErro(reply, resultado.tipo);
    }

    return reply
      .status(
        resultado.agendamento ===
          "visita_criada"
          ? 201
          : 200,
      )
      .send({
        tipo: resultado.agendamento,
        visita: resultado.visita,
        futuroCorte: resultado.futuroCorte,
      });
  }

  async converter(
    request: RequestComId,
    reply: FastifyReply,
  ) {
    const id = validarId(request, reply);

    if (id === null) {
      return reply;
    }

    const resultado =
      await this.futuroCorteService.converter(
        id,
      );

    if (resultado.tipo !== "sucesso") {
      return enviarErro(reply, resultado.tipo);
    }

    return reply.send(resultado.futuroCorte);
  }

  async descartar(
    request: RequestComId,
    reply: FastifyReply,
  ) {
    const id = validarId(request, reply);

    if (id === null) {
      return reply;
    }

    const resultado =
      await this.futuroCorteService.descartar(
        id,
      );

    if (resultado.tipo !== "sucesso") {
      return enviarErro(reply, resultado.tipo);
    }

    return reply.send(resultado.futuroCorte);
  }
}
