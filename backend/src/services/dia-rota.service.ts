import type { CriarDiaRotaInput } from "../schemas/dia-rota.schema";
import type { CriarDiaRotaModel } from "../models/dia-rota.model";

import { CidadeRepository } from "../repositories/cidade.repository";
import { DiaRotaRepository } from "../repositories/dia-rota.repository";

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

  async listar() {
    return this.diaRotaRepository.findAll();
  }
}