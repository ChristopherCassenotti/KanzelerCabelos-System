import { db } from "../prisma/db";
import type { CriarContatoModel, AtualizarContatoModel } from "../models/contato.model";

export class ContatoRepository {
  async create(data: CriarContatoModel) {
    return db.orm.public.Contato.create({
      nome: data.nome,
      cidadeId: data.cidadeId,

      telefone: data.telefone,
      endereco: data.endereco,
      origem: data.origem,

      natural: data.natural,

      cor: data.cor,
      textura: data.textura,
      quimica: data.quimica,

      comprimentoCm: data.comprimentoCm,

      observacoes: data.observacoes,
    });
  }

  async findAll() {
    return db.orm.public.Contato
      .where({
        deletedAt: null,
      })
      .orderBy((contato) => contato.createdAt.desc())
      .all();
  }

  async findById(id: string) {
    return db.orm.public.Contato
      .include("cidade")
      .where({
        deletedAt: null,
      })
      .first({
        id,
      });
  }

  async update(id: string, data: AtualizarContatoModel) {
    return db.orm.public.Contato
      .where({
        id,
        deletedAt: null,
      })
      .update(data);
  }

  async softDelete(id: string) {
    return db.orm.public.Contato
      .where({
        id,
        deletedAt: null,
      })
      .update({
        deletedAt: Temporal.Now.instant(),
      });
      
  } 
  
  async findCompradosComUltimaCompra() {
    return db.orm.public.Contato
      .include("cidade")
      .include("compras", (compras) =>
        compras
          .orderBy((compra) => compra.dataCorte.desc())
          .limit(1),
      )
      .where({
        status: "comprado",
        deletedAt: null,
      })
      .all();
  }

  async updateStatus(
    id: string,
    status: string,
    motivoPerda: string | null,
  ) {
    return db.orm.public.Contato
      .where({
        id,
        deletedAt: null,
      })
      .update({
        status,
        motivoPerda,
      });
  }

  async findAtivosParaAgendar() {
    return db.orm.public.Contato
      .include("cidade")
      .where({
        deletedAt: null,
      })
      .all();
  }
}



