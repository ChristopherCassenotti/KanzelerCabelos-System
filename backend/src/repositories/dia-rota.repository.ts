import { db } from "../prisma/db";
import type { CriarDiaRotaModel, AtualizarDiaRotaModel } from "../models/dia-rota.model";


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

  async findById(id: string) {
    return db.orm.public.DiaRota
      .where({
        id,
      })
      .first();
  }

  async findAll() {
    return db.orm.public.DiaRota
      .include("partidaCidade")
      .include("itens")
      .orderBy((rota) => rota.data.asc())
      .all();
  }

  async findByPeriod(
  de: Temporal.PlainDate,
  ate: Temporal.PlainDate,
) {
  return db.orm.public.DiaRota
    .include("partidaCidade")
    .include("itens")
    .where((rota) =>
      rota.data.gte(de),
    )
    .where((rota) =>
      rota.data.lte(ate),
    )
    .orderBy((rota) =>
      rota.data.asc(),
    )
    .all();
}
async findDetailedById(id: string) {
  return db.orm.public.DiaRota
    .include("partidaCidade")
    .include("itens", (itens) =>
      itens
        .include("contato", (contato) =>
          contato.include("cidade"),
        )
        .orderBy((item) =>
          item.ordem.asc(),
        ),
    )
    .where({
      id,
    })
    .first();
}
async update(
  id: string,
  data: AtualizarDiaRotaModel,
) {
  return db.orm.public.DiaRota
    .where({
      id,
    })
    .update(data);
}
}