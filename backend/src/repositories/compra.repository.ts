import { db } from "../prisma/db";
import type { RegistrarCompraModel } from "../models/compra.model";

export class CompraRepository {
  async registrar(data: RegistrarCompraModel) {
    return db.transaction(async (tx) => {
      const contato = await tx.orm.public.Contato
        .where({
          deletedAt: null,
        })
        .first({
          id: data.contatoId,
        });

      if (!contato) {
        return null;
      }

      const compra = await tx.orm.public.Compra.create({
        contatoId: data.contatoId,

        dataCorte: Temporal.PlainDate.from(data.dataCorte),

        pesoG: data.pesoG ?? null,

        comprimentoCm:
          data.comprimentoCm ?? contato.comprimentoCm,

        cor:
          data.cor ?? contato.cor,

        textura:
          data.textura ?? contato.textura,

        quimica:
          data.quimica ?? contato.quimica,

        valorPago: data.valorPago,
        formaPagamento: data.formaPagamento,

        valorRevenda: null,
        dataRevenda: null,
        comprador: null,
      });

      await tx.orm.public.Contato
        .where({
          id: data.contatoId,
          deletedAt: null,
        })
        .update({
          status: "comprado",
        });

      return compra;
    });
  }

  async findByContatoId(contatoId: string) {
    return db.orm.public.Compra
      .where({
        contatoId,
      })
      .orderBy((compra) => compra.dataCorte.desc())
      .all();
  }

  async findLatestByContatoId(contatoId: string) {
    return db.orm.public.Compra
      .where({
        contatoId,
      })
      .orderBy((compra) => compra.dataCorte.desc())
      .first();
  }
}