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

export class ComprasRelatorioService {
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

    const cidades = new Map<
      string,
      {
        cidadeId: string;
        nome: string;
        uf: string;
        compras: number;
        totalPago: number;
        pesoCompradoG: number;
      }
    >();

    const meses = new Map<
      string,
      {
        mes: string;
        compras: number;
        totalPago: number;
        pesoCompradoG: number;
      }
    >();

    for (const compra of compras) {
      const valorPago =
        Number(compra.valorPago);

      const peso =
        compra.pesoG ?? 0;

const contato = compra.contato;

if (!contato) {
  continue;
}

const cidade = contato.cidade;

      const cidadeAtual =
        cidades.get(cidade.id);

      if (cidadeAtual) {
        cidadeAtual.compras++;
        cidadeAtual.totalPago +=
          valorPago;
        cidadeAtual.pesoCompradoG +=
          peso;
      } else {
        cidades.set(
          cidade.id,
          {
            cidadeId: cidade.id,
            nome: cidade.nome,
            uf: cidade.uf,
            compras: 1,
            totalPago: valorPago,
            pesoCompradoG: peso,
          },
        );
      }

      const mes =
        `${compra.dataCorte.year}-` +
        String(
          compra.dataCorte.month,
        ).padStart(2, "0");

      const mesAtual =
        meses.get(mes);

      if (mesAtual) {
        mesAtual.compras++;
        mesAtual.totalPago +=
          valorPago;
        mesAtual.pesoCompradoG +=
          peso;
      } else {
        meses.set(mes, {
          mes,
          compras: 1,
          totalPago: valorPago,
          pesoCompradoG: peso,
        });
      }
    }

    return {
      periodo,

      porCidade:
        Array.from(
          cidades.values(),
        )
          .map((cidade) => ({
            ...cidade,
            totalPago:
              arredondar(
                cidade.totalPago,
              ),
          }))
          .sort(
            (a, b) =>
              b.totalPago -
              a.totalPago,
          ),

      porMes:
        Array.from(
          meses.values(),
        )
          .map((mes) => ({
            ...mes,
            totalPago:
              arredondar(
                mes.totalPago,
              ),
          }))
          .sort((a, b) =>
            a.mes.localeCompare(
              b.mes,
            ),
          ),
    };
  }
}