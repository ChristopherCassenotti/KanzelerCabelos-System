import { db } from "../prisma/db";

import type {
  CriarAuditoriaModel,
} from "../models/auditoria.model";

export class AuditoriaRepository {
  async create(
    data: CriarAuditoriaModel,
  ) {
    return db.orm.public.Auditoria
      .create({
        usuarioId:
          data.usuarioId,

        acao:
          data.acao,

        entidade:
          data.entidade,

        entidadeId:
          data.entidadeId,

        detalhes:
          data.detalhes,
      });
  }

  async findAll() {
    return db.orm.public.Auditoria
      .orderBy(
        (auditoria) =>
          auditoria.createdAt.desc(),
      )
      .all();
  }

  async findByEntidade(
    entidade: string,
    entidadeId: string,
  ) {
    return db.orm.public.Auditoria
      .where({
        entidade,
        entidadeId,
      })
      .orderBy(
        (auditoria) =>
          auditoria.createdAt.desc(),
      )
      .all();
  }
}