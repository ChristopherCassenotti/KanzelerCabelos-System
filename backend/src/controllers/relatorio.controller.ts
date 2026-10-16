import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { relatorioIndicadoresQuerySchema } from "../schemas/relatorio.schema";
import { RelatorioService } from "../services/relatorio.service";
import { ResultadoViagemService } from "../services/resultado-viagem.service";
import { ComprasRelatorioService } from "../services/compras-relatorio.service";
import { PrecoMedioRelatorioService } from "../services/preco-medio-relatorio.service";
import { OrigemPerdasRelatorioService } from "../services/origem-perdas-relatorio.service";
import { ConversaoCidadeRelatorioService } from "../services/conversao-cidade-relatorio.service";
import { PrevisaoRecompraRelatorioService } from "../services/previsao-recompra-relatorio.service";
import { DetalhamentoComprasRelatorioService } from "../services/detalhamento-compras-relatorio.service";

export class RelatorioController {
  constructor(
    private readonly relatorioService =
      new RelatorioService(),

    private readonly resultadoViagemService =
      new ResultadoViagemService(),

    private readonly comprasRelatorioService =
      new ComprasRelatorioService(),

    private readonly precoMedioRelatorioService =
      new PrecoMedioRelatorioService(),

    private readonly origemPerdasRelatorioService =
      new OrigemPerdasRelatorioService(),

    private readonly conversaoCidadeRelatorioService =
      new ConversaoCidadeRelatorioService(),

    private readonly previsaoRecompraRelatorioService =
      new PrevisaoRecompraRelatorioService(),

    private readonly detalhamentoComprasRelatorioService =
      new DetalhamentoComprasRelatorioService(),
  ) {}

  async indicadores(
    request: FastifyRequest<{
      Querystring: {
        periodo?: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const resultadoSchema =
      relatorioIndicadoresQuerySchema.safeParse(
        request.query,
      );

    if (!resultadoSchema.success) {
      return reply.status(400).send({
        error: "Período inválido",
        details:
          resultadoSchema.error.flatten(),
      });
    }

    const resultado =
      await this.relatorioService.indicadores(
        resultadoSchema.data.periodo,
      );

    return reply.send(resultado);
  }

  async viagens(
    request: FastifyRequest<{
      Querystring: {
        periodo?: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const resultadoSchema =
      relatorioIndicadoresQuerySchema.safeParse(
        request.query,
      );

    if (!resultadoSchema.success) {
      return reply.status(400).send({
        error: "Período inválido",
        details:
          resultadoSchema.error.flatten(),
      });
    }

    const resultado =
      await this.resultadoViagemService.listar(
        resultadoSchema.data.periodo,
      );

    return reply.send(
      resultado,
    );
  }

  async viagem(
    request: FastifyRequest<{
      Params: {
        diaRotaId: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const resultado =
      await this.resultadoViagemService.buscar(
        request.params.diaRotaId,
      );

    if (!resultado) {
      return reply.status(404).send({
        error:
          "Rota não encontrada",
      });
    }

    return reply.send(
      resultado,
    );
  }

  async compras(
    request: FastifyRequest<{
      Querystring: {
        periodo?: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const resultadoSchema =
      relatorioIndicadoresQuerySchema.safeParse(
        request.query,
      );

    if (!resultadoSchema.success) {
      return reply.status(400).send({
        error: "Período inválido",
        details:
          resultadoSchema.error.flatten(),
      });
    }

    const resultado =
      await this.comprasRelatorioService.buscar(
        resultadoSchema.data.periodo,
      );

    return reply.send(
      resultado,
    );
  }

  async precoMedio(
    request: FastifyRequest<{
      Querystring: {
        periodo?: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const resultadoSchema =
      relatorioIndicadoresQuerySchema.safeParse(
        request.query,
      );

    if (!resultadoSchema.success) {
      return reply.status(400).send({
        error: "Período inválido",
        details:
          resultadoSchema.error.flatten(),
      });
    }

    const resultado =
      await this.precoMedioRelatorioService.buscar(
        resultadoSchema.data.periodo,
      );

    return reply.send(
      resultado,
    );
  }

  async origemPerdas(
    request: FastifyRequest<{
      Querystring: {
        periodo?: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const resultadoSchema =
      relatorioIndicadoresQuerySchema.safeParse(
        request.query,
      );

    if (!resultadoSchema.success) {
      return reply.status(400).send({
        error: "Período inválido",
        details:
          resultadoSchema.error.flatten(),
      });
    }

    const resultado =
      await this.origemPerdasRelatorioService.buscar(
        resultadoSchema.data.periodo,
      );

    return reply.send(
      resultado,
    );
  }

  async conversaoCidade(
    request: FastifyRequest<{
      Querystring: {
        periodo?: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const resultadoSchema =
      relatorioIndicadoresQuerySchema.safeParse(
        request.query,
      );

    if (!resultadoSchema.success) {
      return reply.status(400).send({
        error: "Período inválido",
        details:
          resultadoSchema.error.flatten(),
      });
    }

    const resultado =
      await this.conversaoCidadeRelatorioService.buscar(
        resultadoSchema.data.periodo,
      );

    return reply.send(
      resultado,
    );
  }

  async previsaoRecompra(
    _request: FastifyRequest,
    reply: FastifyReply,
  ) {
    const resultado =
      await this.previsaoRecompraRelatorioService.buscar();

    return reply.send(
      resultado,
    );
  }

  async detalhamentoCompras(
    request: FastifyRequest<{
      Querystring: {
        periodo?: string;
      };
    }>,
    reply: FastifyReply,
  ) {
    const resultadoSchema =
      relatorioIndicadoresQuerySchema.safeParse(
        request.query,
      );

    if (!resultadoSchema.success) {
      return reply.status(400).send({
        error: "Período inválido",
        details:
          resultadoSchema.error.flatten(),
      });
    }

    const resultado =
      await this.detalhamentoComprasRelatorioService.buscar(
        resultadoSchema.data.periodo,
      );

    return reply.send(
      resultado,
    );
  }
}