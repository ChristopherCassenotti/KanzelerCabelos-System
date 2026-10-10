import { DiaRotaRepository } from "../repositories/dia-rota.repository";
import { CompraRepository } from "../repositories/compra.repository";

function arredondar(
  valor: number,
  casas = 2,
) {
  return Number(
    valor.toFixed(casas),
  );
}

export class ResultadoViagemService {
  constructor(
    private readonly diaRotaRepository =
      new DiaRotaRepository(),

    private readonly compraRepository =
      new CompraRepository(),
  ) {}

  async buscar(
    diaRotaId: string,
  ) {
    const rota =
      await this.diaRotaRepository.findDetailedById(
        diaRotaId,
      );

    if (!rota) {
      return null;
    }

    const visitas =
      rota.itens.filter(
        (item) =>
          item.tipo === "visita",
      );

    const comprasPorVisita =
      await Promise.all(
        visitas.map((visita) =>
          this.compraRepository.findByVisitaId(
            visita.id,
          ),
        ),
      );

    const compras =
      comprasPorVisita.flat();

    let totalPago = 0;
    let pesoCompradoG = 0;
    let totalRevenda = 0;

    let quantidadeRevendidas = 0;
    let quantidadeARevender = 0;

    for (const compra of compras) {
      totalPago += Number(
        compra.valorPago,
      );

      if (
        compra.pesoG !== null
      ) {
        pesoCompradoG +=
          compra.pesoG;
      }

      if (
        compra.valorRevenda !== null
      ) {
        totalRevenda += Number(
          compra.valorRevenda,
        );

        quantidadeRevendidas++;
      } else {
        quantidadeARevender++;
      }
    }

    const custos =
      Number(
        rota.custoCombustivel,
      ) +
      Number(
        rota.custoAlimentacao,
      ) +
      Number(
        rota.custoHospedagem,
      ) +
      Number(
        rota.custoOutros,
      );

    const custoPorGrama =
      pesoCompradoG > 0
        ? (
            totalPago +
            custos
          ) / pesoCompradoG
        : 0;

    const resultado =
      totalRevenda -
      totalPago -
      custos;

    const cidades =
      Array.from(
        new Set(
          visitas
            .map(
              (visita) =>
                visita.contato
                  ?.cidade.nome,
            )
            .filter(
              (
                cidade,
              ): cidade is string =>
                Boolean(cidade),
            ),
        ),
      );

    return {
      diaRotaId: rota.id,
      data: rota.data.toString(),

      cidades,

      visitas:
        visitas.length,

      compras:
        compras.length,

      pesoCompradoG,

      totalPago:
        arredondar(
          totalPago,
        ),

      custos:
        arredondar(custos),

      custoPorGrama:
        arredondar(
          custoPorGrama,
        ),

      totalRevenda:
        arredondar(
          totalRevenda,
        ),

      resultado:
        arredondar(
          resultado,
        ),

      quantidadeRevendidas,
      quantidadeARevender,
    };
  }
}