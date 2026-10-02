import { CompraRepository } from "../repositories/compra.repository";
import { calcularRecompra } from "./recompra.rules";
import { ContatoRepository } from "../repositories/contato.repository";

export class RecompraService {
  constructor(
    private readonly compraRepository = new CompraRepository(),
    private readonly contatoRepository = new ContatoRepository(),
  ) {}

  async calcular(
    contatoId: string,
    cicloRecompraMeses: number,
  ) {
    const ultimaCompra =
      await this.compraRepository.findLatestByContatoId(
        contatoId,
      );

    if (!ultimaCompra) {
      return null;
    }

    const hoje = Temporal.Now.plainDateISO(
      "America/Sao_Paulo",
    );

    const calculo = calcularRecompra({
      ultimoCorte: ultimaCompra.dataCorte,
      cicloRecompraMeses,
      hoje,
    });

    return {
      ultimaCompraId: ultimaCompra.id,
      ultimoCorte: ultimaCompra.dataCorte,
      cicloRecompraMeses,
      ...calculo,
        };
    }

    async listarProntas(hoje = Temporal.Now.plainDateISO("America/Sao_Paulo",),) {
      const contatos =
        await this.contatoRepository.findCompradosComUltimaCompra();

      const prontas = contatos
        .map((contato) => {
          const ultimaCompra = contato.compras[0];

          if (!ultimaCompra) {
            return null;
          }

          const calculo = calcularRecompra({
            ultimoCorte: ultimaCompra.dataCorte,
            cicloRecompraMeses:
              contato.cicloRecompraMeses,
            hoje,
          });

          if (!calculo.pronta) {
            return null;
          }

          return {
            contatoId: contato.id,
            nome: contato.nome,
            telefone: contato.telefone,
            cidade: contato.cidade,

            ultimaCompraId: ultimaCompra.id,
            ultimoCorte: ultimaCompra.dataCorte,

            cicloRecompraMeses:
              contato.cicloRecompraMeses,

            ...calculo,
          };
        })
        .filter(
          (
            item,
          ): item is NonNullable<typeof item> =>
            item !== null,
        );

      return prontas.sort(
        (a, b) => a.diasAte - b.diasAte,
      );
    }
}