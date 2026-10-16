import { db } from "../prisma/db";
import type { CriarContatoModel, AtualizarContatoModel } from "../models/contato.model";

export class ContatoRepository {
  async create(data: CriarContatoModel) {
    return db.orm.public.Contato.create({
      nome: data.nome,
      cidadeId: data.cidadeId,
      
      telefone: data.telefone,
      endereco: data.endereco,
      
      lat: data.lat,
      lng: data.lng,
      geoFonte: data.geoFonte,
      geoPlaceId: data.geoPlaceId,
      
origem: data.origem,
indicadoPor: data.indicadoPor,

dataPrimeiroContato:
  data.dataPrimeiroContato,

dataAvaliacao:
  data.dataAvaliacao,
      natural: data.natural,
      autorizouFoto:
  data.autorizouFoto,
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

async findAllComCompras() {
  return db.orm.public.Contato
    .include("cidade")
    .include("compras")
    .where({
      deletedAt: null,
    })
    .orderBy(
      (contato) =>
        contato.nome.asc(),
    )
    .all();
}

async findByIdIncludingDeleted(
  id: string,
) {
  return db.orm.public.Contato
    .first({
      id,
    });
}

async hardDelete(
  id: string,
) {
  return db.transaction(
    async (tx) => {
      const contato =
        await tx.orm.public.Contato
          .first({
            id,
          });

      if (!contato) {
        return null;
      }

      const fotos =
        await tx.orm.public.Foto
          .where({
            contatoId: id,
          })
          .all();

      for (const foto of fotos) {
        await tx.orm.public.Foto
          .where({
            id: foto.id,
          })
          .delete();
      }

      const compras =
        await tx.orm.public.Compra
          .where({
            contatoId: id,
          })
          .all();

      for (const compra of compras) {
        await tx.orm.public.Compra
          .where({
            id: compra.id,
          })
          .delete();
      }

      const visitas =
        await tx.orm.public.ItemRota
          .where({
            contatoId: id,
          })
          .all();

      for (const visita of visitas) {
        await tx.orm.public.ItemRota
          .where({
            id: visita.id,
          })
          .delete();
      }

      await tx.orm.public.Contato
        .where({
          id,
        })
        .delete();

      return contato;
    },
  );
}
async findAllComCidade() {
  return db.orm.public.Contato
    .include("cidade")
    .where({
      deletedAt: null,
    })
    .orderBy(
      (contato) =>
        contato.nome.asc(),
    )
    .all();
}

async findAllParaExportacao() {
  return db.orm.public.Contato
    .include("cidade")
    .include("fotos")
    .include(
      "compras",
      (compras) =>
        compras.orderBy(
          (compra) =>
            compra.dataCorte.desc(),
        ),
    )
    .where({
      deletedAt: null,
    })
    .orderBy(
      (contato) =>
        contato.nome.asc(),
    )
    .all();
}
}



