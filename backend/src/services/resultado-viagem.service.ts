import { DiaRotaRepository } from "../repositories/dia-rota.repository";
import { CompraRepository } from "../repositories/compra.repository";

import type { PeriodoRelatorio } from "./relatorio.service";

function arredondar(
  valor: number,
  casas = 2,
) {
  return Number(
    valor.toFixed(casas),
  );
}

type RotaDetalhada =
  NonNullable<
    Awaited<
      ReturnType<
        DiaRotaRepository["findDetailedById"]
      >
    >
  >;

export class ResultadoViagemService {
  constructor(
    private readonly diaRotaRepository =
      new DiaRotaRepository(),

    private readonly compraRepository =
      new CompraRepository(),
  ) {}

  private async calcular(
    rota: RotaDetalhada,
  ) {
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

      data:
        rota.data.toString(),

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
        arredondar(
          custos,
        ),

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

  async buscar(
    diaRotaId: string,
  ) {
    const rota =
      await this.diaRotaRepository
        .findDetailedById(
          diaRotaId,
        );

    if (!rota) {
      return null;
    }

    return this.calcular(
      rota,
    );
  }

  async listar(
    periodo: PeriodoRelatorio,
    hoje =
      Temporal.Now.plainDateISO(
        "America/Sao_Paulo",
      ),
  ) {
    let rotas;

    if (periodo === "todo") {
      rotas =
        await this.diaRotaRepository
          .findAllDetailed();
    } else {
      let de: Temporal.PlainDate;

      switch (periodo) {
        case "mes_atual":
          de = hoje.with({
            day: 1,
          });
          break;

        case "30":
          de = hoje.subtract({
            days: 29,
          });
          break;

        case "90":
          de = hoje.subtract({
            days: 89,
          });
          break;

        case "365":
          de = hoje.subtract({
            days: 364,
          });
          break;
      }

      rotas =
        await this.diaRotaRepository
          .findDetailedByPeriod(
            de,
            hoje,
          );
    }

    const rotasComVisitas =
      rotas.filter(
        (rota) =>
          rota.itens.some(
            (item) =>
              item.tipo ===
              "visita",
          ),
      );

    const viagens =
      await Promise.all(
        rotasComVisitas.map(
          (rota) =>
            this.calcular(
              rota,
            ),
        ),
      );

    return {
      periodo,
      total: viagens.length,
      viagens,
    };
  }
}