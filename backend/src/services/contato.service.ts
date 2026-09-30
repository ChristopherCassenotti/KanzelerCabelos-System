import type { CriarContatoInput, AtualizarContatoInput } from "../schemas/contato.schema";
import { ContatoRepository } from "../repositories/contato.repository";
import type { CriarContatoModel, AtualizarContatoModel } from "../models/contato.model";

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

  async findAll() {
    return this.contatoRepository.findAll();
  }

  async findById(id: string) {
    return this.contatoRepository.findById(id);
  }

  async update(id: string, data: AtualizarContatoInput) {
    const contato: AtualizarContatoModel = {};

    if (data.nome !== undefined) {
      contato.nome = data.nome;
    }

    if (data.telefone !== undefined) {
      contato.telefone = data.telefone;
    }

    if (data.cidadeId !== undefined) {
      contato.cidadeId = data.cidadeId;
    }

    if (data.endereco !== undefined) {
      contato.endereco = data.endereco;
    }

    if (data.origem !== undefined) {
      contato.origem = data.origem;
    }

    if (data.natural !== undefined) {
      contato.natural = data.natural;
    }

    if (data.cor !== undefined) {
      contato.cor = data.cor;
    }

    if (data.textura !== undefined) {
      contato.textura = data.textura;
    }

    if (data.quimica !== undefined) {
      contato.quimica = data.quimica;
    }

    if (data.comprimentoCm !== undefined) {
      contato.comprimentoCm = data.comprimentoCm;
    }

    if (data.observacoes !== undefined) {
      contato.observacoes = data.observacoes;
    }

    return this.contatoRepository.update(id, contato);
  }

  async delete(id: string) {
    return this.contatoRepository.softDelete(id);
  }
}