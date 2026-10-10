import { CompraRepository } from "../repositories/compra.repository";

type PeriodoRelatorio =
  | "todo"
  | "mes_atual"
  | "30"
  | "90"
  | "365";

interface GrupoPreco {
  compras: number;
  totalPago: number;
  pesoG: number;
}

function arredondar(
  valor: number,
) {
  return Number(
    valor.toFixed(2),
  );
}

export class PrecoMedioRelatorioService {
  constructor(
    private readonly compraRepository =
      new CompraRepository(),
  ) {}

  async buscar(
    periodo: PeriodoRelatorio,
    hoje =
      Temporal.Now.plainDateISO(
        "America/Sao_Paulo",
      ),
  ) {
    let compras;

    if (periodo === "todo") {
      compras =
        await this.compraRepository.findAll();
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

      compras =
        await this.compraRepository.findByPeriod(
          de,
          hoje,
        );
    }

    const cores =
      new Map<string, GrupoPreco>();

    const texturas =
      new Map<string, GrupoPreco>();

    for (const compra of compras) {
      if (
        compra.pesoG === null ||
        compra.pesoG <= 0
      ) {
        continue;
      }

      const valorPago =
        Number(compra.valorPago);

      const peso =
        compra.pesoG;

      if (compra.cor) {
        const grupo =
          cores.get(compra.cor);

        if (grupo) {
          grupo.compras++;
          grupo.totalPago +=
            valorPago;
          grupo.pesoG += peso;
        } else {
          cores.set(
            compra.cor,
            {
              compras: 1,
              totalPago: valorPago,
              pesoG: peso,
            },
          );
        }
      }

      if (compra.textura) {
        const grupo =
          texturas.get(
            compra.textura,
          );

        if (grupo) {
          grupo.compras++;
          grupo.totalPago +=
            valorPago;
          grupo.pesoG += peso;
        } else {
          texturas.set(
            compra.textura,
            {
              compras: 1,
              totalPago: valorPago,
              pesoG: peso,
            },
          );
        }
      }
    }

    return {
      periodo,

      porCor:
        Array.from(
          cores.entries(),
        )
          .map(
            ([cor, grupo]) => ({
              cor,

              compras:
                grupo.compras,

              pesoG:
                grupo.pesoG,

              totalPago:
                arredondar(
                  grupo.totalPago,
                ),

              precoMedioPorGrama:
                arredondar(
                  grupo.totalPago /
                    grupo.pesoG,
                ),
            }),
          )
          .sort(
            (a, b) =>
              b.precoMedioPorGrama -
              a.precoMedioPorGrama,
          ),

      porTextura:
        Array.from(
          texturas.entries(),
        )
          .map(
            ([textura, grupo]) => ({
              textura,

              compras:
                grupo.compras,

              pesoG:
                grupo.pesoG,

              totalPago:
                arredondar(
                  grupo.totalPago,
                ),

              precoMedioPorGrama:
                arredondar(
                  grupo.totalPago /
                    grupo.pesoG,
                ),
            }),
          )
          .sort(
            (a, b) =>
              b.precoMedioPorGrama -
              a.precoMedioPorGrama,
          ),
    };
  }
}