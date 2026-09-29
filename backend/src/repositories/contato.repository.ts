import { db } from "../prisma/db";
import type { CriarContatoModel } from "../models/contato.model";

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
}