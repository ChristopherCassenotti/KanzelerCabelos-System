import { db } from "../prisma/db";
import type { CriarFotoModel } from "../models/foto.model";

export class FotoRepository {
    async create(data: CriarFotoModel) {
        return db.orm.public.Foto.create({
          contatoId: data.contatoId,
          tipo: data.tipo,
          url: data.url,
          thumbUrl: data.thumbUrl,
          ordem: data.ordem,
        });
    }

    async findByContatoId(contatoId: string) {
        return db.orm.public.Foto
          .where({
            contatoId,
          })
          .orderBy((foto) => foto.ordem.asc())
          .all();
    }
        
    async findByIdForContato(
      fotoId: string,
      contatoId: string,
    ) {
      return db.orm.public.Foto
        .where({
          contatoId,
        })
        .first({
          id: fotoId,
        });
    }

    async deleteByIdForContato(
      fotoId: string,
      contatoId: string,
    ) {
      return db.orm.public.Foto
        .where({
          id: fotoId,
          contatoId,
        })
        .delete();
    }
}