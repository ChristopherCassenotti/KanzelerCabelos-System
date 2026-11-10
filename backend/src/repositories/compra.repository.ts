import { db } from "../prisma/db";
import type {
  DadosCompraModel,
  RegistrarCompraModel,
} from "../models/compra.model";

interface CaracteristicasCabelo {
  comprimentoCm: number | null;
  cor: string | null;
  textura: string | null;
  quimica: string | null;
}

/**
 * Colunas da compra. Características do cabelo não informadas na compra
 * herdam as do contato (retrato do cabelo no momento do corte).
 */
export function montarCompra(
  data: DadosCompraModel,
  contato: CaracteristicasCabelo,
) {
  return {
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

    valorRevenda: data.valorRevenda ?? null,
    dataRevenda:
      data.dataRevenda !== undefined
        ? Temporal.PlainDate.from(data.dataRevenda)
        : null,
    comprador: data.comprador ?? null,
  };
}

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
        ...montarCompra(data, contato),
        contatoId: data.contatoId,

        ...(data.visitaId !== undefined
          ? { visitaId: data.visitaId }
          : {}),
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
  
  async findByIdForContato(
  compraId: string,
  contatoId: string,
) {
  return db.orm.public.Compra
    .where({
      contatoId,
    })
    .first({
      id: compraId,
    });
}

async findAll() {
  return db.orm.public.Compra
    .orderBy(
      (compra) =>
        compra.dataCorte.desc(),
    )
    .all();
}

async findByPeriod(
  de: Temporal.PlainDate,
  ate: Temporal.PlainDate,
) {
  return db.orm.public.Compra
    .where((compra) =>
      compra.dataCorte.gte(de),
    )
    .where((compra) =>
      compra.dataCorte.lte(ate),
    )
    .orderBy(
      (compra) =>
        compra.dataCorte.desc(),
    )
    .all();
}

async findByVisitaId(
  visitaId: string,
) {
  return db.orm.public.Compra
    .where({
      visitaId,
    })
    .all();
}

async findAllComContato() {
  return db.orm.public.Compra
    .include("contato", (contato) =>
      contato.include("cidade"),
    )
    .orderBy(
      (compra) =>
        compra.dataCorte.asc(),
    )
    .all();
}

async findByPeriodComContato(
  de: Temporal.PlainDate,
  ate: Temporal.PlainDate,
) {
  return db.orm.public.Compra
    .include("contato", (contato) =>
      contato.include("cidade"),
    )
    .where((compra) =>
      compra.dataCorte.gte(de),
    )
    .where((compra) =>
      compra.dataCorte.lte(ate),
    )
    .orderBy(
      (compra) =>
        compra.dataCorte.asc(),
    )
    .all();
}
}