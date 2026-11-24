import { db } from "../prisma/db";

import type {
  AtualizarFuturoCorteModel,
  CriarFuturoCorteModel,
} from "../models/futuro-corte.model";

import { STATUS_FUTURO_CORTE_ATIVOS } from "../services/futuro-corte.rules";

/** 23505: o índice parcial garante um único futuro corte ativo. */
function violouUnicidade(
  error: unknown,
): boolean {
  let atual = error;

  while (atual instanceof Error) {
    if (
      "sqlState" in atual &&
      atual.sqlState === "23505"
    ) {
      return true;
    }

    atual = atual.cause;
  }

  return false;
}

export class FuturoCorteRepository {
  /** Retorna null se o contato já tiver um futuro corte ativo. */
  async create(data: CriarFuturoCorteModel) {
    try {
      return await db.orm.public.FuturoCorte
        .create({ ...data });
    } catch (error) {
      if (violouUnicidade(error)) {
        return null;
      }

      throw error;
    }
  }

  async findById(id: string) {
    const futuroCorte =
      await db.orm.public.FuturoCorte
        .include("contato")
        .where({ id })
        .first();

    if (
      !futuroCorte?.contato ||
      futuroCorte.contato.deletedAt !== null
    ) {
      return null;
    }

    const { contato: _contato, ...dados } =
      futuroCorte;

    return dados;
  }

  async findByContatoId(contatoId: string) {
    return db.orm.public.FuturoCorte
      .where({ contatoId })
      .orderBy(
        (futuroCorte) =>
          futuroCorte.createdAt.desc(),
      )
      .all();
  }

  async findAtivoByContatoId(
    contatoId: string,
  ) {
    return db.orm.public.FuturoCorte
      .where({ contatoId })
      .where((futuroCorte) =>
        futuroCorte.status.in([
          ...STATUS_FUTURO_CORTE_ATIVOS,
        ]),
      )
      .first();
  }

  async findAllComContato() {
    const futurosCortes =
      await db.orm.public.FuturoCorte
        .include("contato", (contato) =>
          contato.include("cidade"),
        )
        .orderBy(
          (futuroCorte) =>
            futuroCorte.dataProximoContato.asc(),
        )
        .all();

    return futurosCortes.flatMap(
      ({ contato, ...futuroCorte }) =>
        contato && contato.deletedAt === null
          ? [{ ...futuroCorte, contato }]
          : [],
    );
  }

  /** Só altera se ainda estiver ativo (null se foi encerrado antes). */
  async updateAtivo(
    id: string,
    data: AtualizarFuturoCorteModel,
  ) {
    return db.orm.public.FuturoCorte
      .where({ id })
      .where((futuroCorte) =>
        futuroCorte.status.in([
          ...STATUS_FUTURO_CORTE_ATIVOS,
        ]),
      )
      .update(data);
  }
}
