import { CompraRepository } from "../repositories/compra.repository";

type PeriodoRelatorio =
  | "todo"
  | "mes_atual"
  | "30"
  | "90"
  | "365";

function arredondar(
  valor: number,
) {
  return Number(
    valor.toFixed(2),
  );
}

export class DetalhamentoComprasRelatorioService {
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
        await this.compraRepository
          .findAllComContato();
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
        await this.compraRepository
          .findByPeriodComContato(
            de,
            hoje,
          );
    }

    const registros =
      compras
        .flatMap((compra) => {
          const contato =
            compra.contato;

          if (!contato) {
            return [];
          }

          const pesoG =
            compra.pesoG;

          const valorPago =
            Number(
              compra.valorPago,
            );

          const precoPorGrama =
            pesoG !== null &&
            pesoG > 0
              ? arredondar(
                  valorPago /
                    pesoG,
                )
              : null;

          return [
            {
              compraId:
                compra.id,

              contatoId:
                contato.id,

              contato:
                contato.nome,

              cidade: {
                id:
                  contato.cidade.id,

                nome:
                  contato.cidade.nome,

                uf:
                  contato.cidade.uf,
              },

              dataCorte:
                compra.dataCorte
                  .toString(),

              cor:
                compra.cor,

              textura:
                compra.textura,

              quimica:
                compra.quimica,

              comprimentoCm:
                compra.comprimentoCm,

              pesoG,

              valorPago:
                arredondar(
                  valorPago,
                ),

              precoPorGrama,

              formaPagamento:
                compra.formaPagamento,

              valorRevenda:
                compra.valorRevenda !==
                null
                  ? arredondar(
                      Number(
                        compra.valorRevenda,
                      ),
                    )
                  : null,

              revendida:
                compra.valorRevenda !==
                null,
            },
          ];
        })
        .sort(
          (a, b) =>
            b.dataCorte.localeCompare(
              a.dataCorte,
            ),
        );

    return {
      periodo,

      total:
        registros.length,

      registros,
    };
  }
}