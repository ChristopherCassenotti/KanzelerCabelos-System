import { db } from "../prisma/db";

export class CidadeRepository {
  async findAll() {
    const query = db.sql.public.cidades
      .select("id", "nome", "uf", "lat", "lng")
      .build();

    return db.runtime().query(query);
  }

  async findById(id: string) {
  return db.orm.public.Cidade
    .where({
      id,
    })
    .first();
}
}