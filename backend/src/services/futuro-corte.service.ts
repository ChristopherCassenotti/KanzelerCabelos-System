import type {
  AgendarAvaliacaoFuturoCorteInput,
  AtualizarFuturoCorteInput,
  ContatadoFuturoCorteInput,
  CriarFuturoCorteInput,
  ListarFuturosCortesQuery,
} from "../schemas/futuro-corte.schema";
import type { AtualizarFuturoCorteModel } from "../models/futuro-corte.model";

import { ContatoRepository } from "../repositories/contato.repository";
import { FuturoCorteRepository } from "../repositories/futuro-corte.repository";
import { VisitaRotaService } from "./visita-rota.service";

import {
  acrescentarObservacao,
  calcularSituacaoFuturoCorte,
  correspondeSituacao,
  futuroCorteAtivo,
  prepararFuturoCorte,
  type StatusFuturoCorte,
} from "./futuro-corte.rules";

function hojeSaoPaulo() {
  return Temporal.Now.plainDateISO(
    "America/Sao_Paulo",
  );
}

function comSituacao<
  T extends {
    status: StatusFuturoCorte;
    dataProximoContato: Temporal.PlainDate;
  },
>(
  futuroCorte: T,
  hoje: Temporal.PlainDate,
) {
  return {
    ...futuroCorte,
    ...calcularSituacaoFuturoCorte({
      status: futuroCorte.status,
      dataProximoContato:
        futuroCorte.dataProximoContato,
      hoje,
    }),
  };
}

function mesmoTexto(
  valor: string | null,
  filtro: string,
) {
  return (
    valor?.toLocaleLowerCase("pt-BR") ===
    filtro.toLocaleLowerCase("pt-BR")
  );
}

function dataOuNull(
  data: string | null | undefined,
) {
  return data
    ? Temporal.PlainDate.from(data)
    : null;
}

export class FuturoCorteService {
  constructor(
    private readonly futuroCorteRepository =
      new FuturoCorteRepository(),

    private readonly contatoRepository =
      new ContatoRepository(),

    private readonly visitaRotaService =
      new VisitaRotaService(),
  ) {}

  async listarPorContato(
    contatoId: string,
    hoje = hojeSaoPaulo(),
  ) {
    const contato =
      await this.contatoRepository.findById(
        contatoId,
      );

    if (!contato) {
      return null;
    }

    const futurosCortes =
      await this.futuroCorteRepository
        .findByContatoId(contatoId);

    return futurosCortes.map(
      (futuroCorte) =>
        comSituacao(futuroCorte, hoje),
    );
  }

  async criar(
    contatoId: string,
    data: CriarFuturoCorteInput,
    hoje = hojeSaoPaulo(),
  ) {
    const contato =
      await this.contatoRepository.findById(
        contatoId,
      );

    if (!contato) {
      return {
        tipo: "contato_nao_encontrado" as const,
      };
    }

    const ativo =
      await this.futuroCorteRepository
        .findAtivoByContatoId(contatoId);

    if (ativo) {
      return {
        tipo: "ja_existe_ativo" as const,
      };
    }

    const criado =
      await this.futuroCorteRepository.create({
        ...prepararFuturoCorte(data),
        contatoId,
      });

    if (!criado) {
      return {
        tipo: "ja_existe_ativo" as const,
      };
    }

    return {
      tipo: "sucesso" as const,
      futuroCorte:
        comSituacao(criado, hoje),
    };
  }

  async atualizar(
    id: string,
    data: AtualizarFuturoCorteInput,
    hoje = hojeSaoPaulo(),
  ) {
    const alteracoes: AtualizarFuturoCorteModel =
      {};

    if (data.dataPrevista !== undefined) {
      alteracoes.dataPrevista =
        dataOuNull(data.dataPrevista);
    }

    if (data.dataProximoContato !== undefined) {
      alteracoes.dataProximoContato =
        Temporal.PlainDate.from(
          data.dataProximoContato,
        );
    }

    if (data.comprimentoAtualCm !== undefined) {
      alteracoes.comprimentoAtualCm =
        data.comprimentoAtualCm;
    }

    if (
      data.comprimentoDesejadoCm !== undefined
    ) {
      alteracoes.comprimentoDesejadoCm =
        data.comprimentoDesejadoCm;
    }

    if (data.cor !== undefined) {
      alteracoes.cor = data.cor;
    }

    if (data.textura !== undefined) {
      alteracoes.textura = data.textura;
    }

    if (data.quimica !== undefined) {
      alteracoes.quimica = data.quimica;
    }

    if (data.natural !== undefined) {
      alteracoes.natural = data.natural;
    }

    if (data.observacoes !== undefined) {
      alteracoes.observacoes =
        data.observacoes;
    }

    if (data.prioridade !== undefined) {
      alteracoes.prioridade =
        data.prioridade;
    }

    return this.alterarAtivo(
      id,
      () => alteracoes,
      hoje,
    );
  }

  async marcarContatado(
    id: string,
    data: ContatadoFuturoCorteInput,
    hoje = hojeSaoPaulo(),
  ) {
    const dataProximoContato =
      Temporal.PlainDate.from(
        data.dataProximoContato,
      );

    if (
      Temporal.PlainDate.compare(
        dataProximoContato,
        hoje,
      ) < 0
    ) {
      return {
        tipo: "data_no_passado" as const,
      };
    }

    const { observacao } = data;

    return this.alterarAtivo(
      id,
      (atual) => ({
        dataProximoContato,
        ultimoContatoEm:
          Temporal.Now.instant(),

        // Avaliação que não deu certo volta para o acompanhamento.
        status: "acompanhando",

        ...(observacao !== undefined
          ? {
              observacoes:
                acrescentarObservacao(
                  atual.observacoes,
                  observacao,
                  hoje,
                ),
            }
          : {}),
      }),
      hoje,
    );
  }

  async agendarAvaliacao(
    id: string,
    data: AgendarAvaliacaoFuturoCorteInput,
    hoje = hojeSaoPaulo(),
  ) {
    const atual =
      await this.futuroCorteRepository.findById(
        id,
      );

    if (!atual) {
      return {
        tipo: "nao_encontrado" as const,
      };
    }

    if (!futuroCorteAtivo(atual.status)) {
      return {
        tipo: "encerrado" as const,
      };
    }

    const agendamento =
      await this.visitaRotaService.agendar(
        data.diaRotaId,
        {
          contatoId: atual.contatoId,

          ...(data.hora !== undefined
            ? { hora: data.hora }
            : {}),
        },
        hoje,
        id,
      );

    if (!("visita" in agendamento)) {
      return agendamento;
    }

    return {
      tipo: "sucesso" as const,
      agendamento: agendamento.tipo,
      visita: agendamento.visita,

      futuroCorte: comSituacao(
        {
          ...atual,
          status: "agendado" as const,
        },
        hoje,
      ),
    };
  }

  async converter(
    id: string,
    hoje = hojeSaoPaulo(),
  ) {
    return this.alterarAtivo(
      id,
      () => ({ status: "convertido" }),
      hoje,
    );
  }

  async descartar(
    id: string,
    hoje = hojeSaoPaulo(),
  ) {
    return this.alterarAtivo(
      id,
      () => ({ status: "descartado" }),
      hoje,
    );
  }

  /** Sem filtro de status, retorna somente os ativos. */
  async listar(
    filtros: ListarFuturosCortesQuery = {},
    hoje = hojeSaoPaulo(),
  ) {
    const futurosCortes =
      await this.futuroCorteRepository
        .findAllComContato();

    return futurosCortes
      .filter((item) => {
        if (
          filtros.status
            ? item.status !== filtros.status
            : !futuroCorteAtivo(item.status)
        ) {
          return false;
        }

        if (
          filtros.situacao &&
          !correspondeSituacao(
            filtros.situacao,
            {
              status: item.status,
              dataProximoContato:
                item.dataProximoContato,
              hoje,
            },
          )
        ) {
          return false;
        }

        if (
          filtros.prioridade &&
          item.prioridade !==
            filtros.prioridade
        ) {
          return false;
        }

        if (
          filtros.cidadeId &&
          item.contato.cidadeId !==
            filtros.cidadeId
        ) {
          return false;
        }

        if (
          filtros.cor &&
          !mesmoTexto(item.cor, filtros.cor)
        ) {
          return false;
        }

        if (
          filtros.textura &&
          !mesmoTexto(
            item.textura,
            filtros.textura,
          )
        ) {
          return false;
        }

        if (
          filtros.natural !== undefined &&
          item.natural !== filtros.natural
        ) {
          return false;
        }

        if (
          filtros.comprimentoMin !== undefined &&
          (item.comprimentoAtualCm === null ||
            item.comprimentoAtualCm <
              filtros.comprimentoMin)
        ) {
          return false;
        }

        if (
          filtros.comprimentoMax !== undefined &&
          (item.comprimentoAtualCm === null ||
            item.comprimentoAtualCm >
              filtros.comprimentoMax)
        ) {
          return false;
        }

        return true;
      })
      .map((item) => comSituacao(item, hoje))
      .sort(
        (a, b) =>
          Temporal.PlainDate.compare(
            a.dataProximoContato,
            b.dataProximoContato,
          ) ||
          a.contato.nome.localeCompare(
            b.contato.nome,
            "pt-BR",
          ),
      );
  }

  async resumir(hoje = hojeSaoPaulo()) {
    const ativos =
      await this.listar({}, hoje);

    return {
      totalAtivos: ativos.length,

      proximos30Dias: ativos.filter(
        (item) =>
          item.diasParaContato !== null &&
          item.diasParaContato <= 30,
      ).length,
    };
  }

  private async alterarAtivo(
    id: string,
    montarAlteracoes: (atual: {
      observacoes: string | null;
    }) => AtualizarFuturoCorteModel,
    hoje: Temporal.PlainDate,
  ) {
    const atual =
      await this.futuroCorteRepository.findById(
        id,
      );

    if (!atual) {
      return {
        tipo: "nao_encontrado" as const,
      };
    }

    const atualizado =
      futuroCorteAtivo(atual.status)
        ? await this.futuroCorteRepository
            .updateAtivo(
              id,
              montarAlteracoes(atual),
            )
        : null;

    if (!atualizado) {
      return {
        tipo: "encerrado" as const,
      };
    }

    return {
      tipo: "sucesso" as const,
      futuroCorte:
        comSituacao(atualizado, hoje),
    };
  }
}
