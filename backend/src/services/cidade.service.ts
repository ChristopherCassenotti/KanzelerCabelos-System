import { CidadeRepository } from "../repositories/cidade.repository";

export class CidadeService {
  constructor(
    private readonly cidadeRepository = new CidadeRepository(),
  ) {}

  async findAll() {
    const cidades = await this.cidadeRepository.findAll();

    return cidades.sort((a, b) =>
      String(a.nome).localeCompare(String(b.nome), "pt-BR"),
    );
  }
}