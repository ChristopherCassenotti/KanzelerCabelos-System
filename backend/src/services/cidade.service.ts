import { CidadeRepository } from "../repositories/cidade.repository";

export interface CidadeResumo {
  id: string;
  nome: string;
  uf: string;
}

export type ResolucaoCidade =
  | {
      tipo: "encontrada";
      cidade: CidadeResumo;
    }
  | {
      tipo: "ambigua";
      opcoes: CidadeResumo[];
    }
  | {
      tipo: "nao_encontrada";
      sugestoes: CidadeResumo[];
    };

const LIMITE_OPCOES_CIDADE = 6;

export function normalizarNomeCidade(
  valor: string | null | undefined,
) {
  return (valor ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function paraResumo(cidade: {
  id: string;
  nome: string;
  uf: string;
}): CidadeResumo {
  return {
    id: cidade.id,
    nome: cidade.nome,
    uf: cidade.uf,
  };
}

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

  async findById(id: string): Promise<CidadeResumo | null> {
    const cidade = await this.cidadeRepository.findById(id);

    return cidade ? paraResumo(cidade) : null;
  }

  /**
   * Resolve o nome de uma cidade digitado pelo usuário para um registro real.
   * Só considera "encontrada" uma correspondência exata (sem acentos e
   * caixa); correspondências parciais viram opções para o usuário escolher.
   */
  async resolverPorNome(
    nome: string,
    uf?: string | null,
  ): Promise<ResolucaoCidade> {
    const busca = normalizarNomeCidade(nome);
    const ufBusca = (uf ?? "").trim().toUpperCase();

    if (busca.length === 0) {
      return {
        tipo: "nao_encontrada",
        sugestoes: [],
      };
    }

    const cidades = (await this.findAll()).map(paraResumo);

    const filtrarUf = (lista: CidadeResumo[]) =>
      ufBusca.length === 2
        ? lista.filter((cidade) => cidade.uf.toUpperCase() === ufBusca)
        : lista;

    const exatas = filtrarUf(
      cidades.filter(
        (cidade) => normalizarNomeCidade(cidade.nome) === busca,
      ),
    );

    if (exatas.length === 1) {
      return {
        tipo: "encontrada",
        cidade: exatas[0]!,
      };
    }

    if (exatas.length > 1) {
      return {
        tipo: "ambigua",
        opcoes: exatas.slice(0, LIMITE_OPCOES_CIDADE),
      };
    }

    const parciais = filtrarUf(
      cidades.filter((cidade) => {
        const nomeCidade = normalizarNomeCidade(cidade.nome);

        return (
          nomeCidade.includes(busca) ||
          (busca.length >= 4 && busca.includes(nomeCidade))
        );
      }),
    );

    if (parciais.length > 0) {
      return {
        tipo: "ambigua",
        opcoes: parciais.slice(0, LIMITE_OPCOES_CIDADE),
      };
    }

    return {
      tipo: "nao_encontrada",
      sugestoes: [],
    };
  }
}
