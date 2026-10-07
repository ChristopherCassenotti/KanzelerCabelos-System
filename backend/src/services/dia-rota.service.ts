import type { CriarDiaRotaInput } from "../schemas/dia-rota.schema";
import type { CriarDiaRotaModel } from "../models/dia-rota.model";

import { CidadeRepository } from "../repositories/cidade.repository";
import { DiaRotaRepository } from "../repositories/dia-rota.repository";
import type { DiaRotaQuery } from "../schemas/dia-rota-query.schema";
import type { AtualizarDiaRotaInput } from "../schemas/atualizar-dia-rota.schema";
import type { AtualizarDiaRotaModel } from "../models/dia-rota.model";

export class DiaRotaService {
  constructor(
    private readonly diaRotaRepository =
      new DiaRotaRepository(),

    private readonly cidadeRepository =
      new CidadeRepository(),
  ) {}

  async criar(data: CriarDiaRotaInput) {
    const cidade =
      await this.cidadeRepository.findById(
        data.partidaCidadeId,
      );

    if (!cidade) {
      return {
        tipo: "cidade_nao_encontrada" as const,
      };
    }

    const dataRota =
      Temporal.PlainDate.from(data.data);

    const existente =
      await this.diaRotaRepository.findByDate(
        dataRota,
      );

    if (existente) {
      return {
        tipo: "data_ja_existe" as const,
      };
    }

    const novoDia: CriarDiaRotaModel = {
      data: dataRota,
      partidaCidadeId: data.partidaCidadeId,

      ...(data.horaSaida !== undefined
        ? {
            horaSaida:
              Temporal.PlainTime.from(
                data.horaSaida,
              ),
          }
        : {}),

      ...(data.minutosPorVisita !== undefined
        ? {
            minutosPorVisita:
              data.minutosPorVisita,
          }
        : {}),

      ...(data.custoCombustivel !== undefined
        ? {
            custoCombustivel:
              data.custoCombustivel,
          }
        : {}),

      ...(data.custoAlimentacao !== undefined
        ? {
            custoAlimentacao:
              data.custoAlimentacao,
          }
        : {}),

      ...(data.custoHospedagem !== undefined
        ? {
            custoHospedagem:
              data.custoHospedagem,
          }
        : {}),

      ...(data.custoOutros !== undefined
        ? {
            custoOutros:
              data.custoOutros,
          }
        : {}),
    };

    const dia =
      await this.diaRotaRepository.create(
        novoDia,
      );

    return {
      tipo: "sucesso" as const,
      dia,
    };
  }

async listar(
  filtros: DiaRotaQuery = {},
) {
  if (!filtros.de && !filtros.ate) {
    return this.diaRotaRepository.findAll();
  }

  const hoje =
    Temporal.Now.plainDateISO(
      "America/Sao_Paulo",
    );

  const de = filtros.de
    ? Temporal.PlainDate.from(
        filtros.de,
      )
    : hoje;

  const ate = filtros.ate
    ? Temporal.PlainDate.from(
        filtros.ate,
      )
    : de;

  return this.diaRotaRepository.findByPeriod(
    de,
    ate,
  );
}
async buscarPorId(id: string) {
  return this.diaRotaRepository
    .findDetailedById(id);
}
async atualizar(
  id: string,
  data: AtualizarDiaRotaInput,
) {
  const rota =
    await this.diaRotaRepository.findById(id);

  if (!rota) {
    return {
      tipo: "rota_nao_encontrada" as const,
    };
  }

  if (data.partidaCidadeId !== undefined) {
    const cidade =
      await this.cidadeRepository.findById(
        data.partidaCidadeId,
      );

    if (!cidade) {
      return {
        tipo: "cidade_nao_encontrada" as const,
      };
    }
  }

  const atualizacao: AtualizarDiaRotaModel = {
    ...(data.partidaCidadeId !== undefined
      ? {
          partidaCidadeId:
            data.partidaCidadeId,
        }
      : {}),

    ...(data.horaSaida !== undefined
      ? {
          horaSaida:
            Temporal.PlainTime.from(
              data.horaSaida,
            ),
        }
      : {}),

    ...(data.minutosPorVisita !== undefined
      ? {
          minutosPorVisita:
            data.minutosPorVisita,
        }
      : {}),

    ...(data.custoCombustivel !== undefined
      ? {
          custoCombustivel:
            data.custoCombustivel,
        }
      : {}),

    ...(data.custoAlimentacao !== undefined
      ? {
          custoAlimentacao:
            data.custoAlimentacao,
        }
      : {}),

    ...(data.custoHospedagem !== undefined
      ? {
          custoHospedagem:
            data.custoHospedagem,
        }
      : {}),

    ...(data.custoOutros !== undefined
      ? {
          custoOutros:
            data.custoOutros,
        }
      : {}),
  };

  const atualizada =
    await this.diaRotaRepository.update(
      id,
      atualizacao,
    );

  return {
    tipo: "sucesso" as const,
    rota: atualizada,
  };
}
}