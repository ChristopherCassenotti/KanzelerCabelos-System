import { db } from "../prisma/db";
import type { CriarDiaRotaModel } from "../models/dia-rota.model";

export class DiaRotaRepository {
  async findByDate(data: Temporal.PlainDate) {
    return db.orm.public.DiaRota
      .where({
        data,
      })
      .first();
  }

  async create(data: CriarDiaRotaModel) {
    return db.orm.public.DiaRota.create({
      data: data.data,
      partidaCidadeId: data.partidaCidadeId,

      ...(data.horaSaida !== undefined
        ? { horaSaida: data.horaSaida }
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
            custoOutros: data.custoOutros,
          }
        : {}),
    });
  }
}