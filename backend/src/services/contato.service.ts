import type { CriarContatoInput } from "../schemas/contato.schema";
import { ContatoRepository } from "../repositories/contato.repository";
import type { CriarContatoModel } from "../models/contato.model";

export class ContatoService {
  constructor(
    private readonly contatoRepository = new ContatoRepository(),
  ) {}

  async create(data: CriarContatoInput) {
    const contato: CriarContatoModel = {
      nome: data.nome,
      cidadeId: data.cidadeId,

      telefone: data.telefone ?? null,
      endereco: data.endereco ?? null,
      origem: data.origem ?? null,

      natural: data.natural ?? null,

      cor: data.cor ?? null,
      textura: data.textura ?? null,
      quimica: data.quimica ?? null,

      comprimentoCm: data.comprimentoCm ?? null,

      observacoes: data.observacoes ?? null,
    };

    return this.contatoRepository.create(contato);
  }
}