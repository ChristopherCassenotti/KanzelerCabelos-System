import { CompraRepository } from "../repositories/compra.repository";
import { ContatoRepository } from "../repositories/contato.repository";

export type PeriodoRelatorio =
  | "todo"
  | "mes_atual"
  | "30"
  | "90"
  | "365";

function arredondar(
  valor: number,
  casas = 2,
) {
  return Number(
    valor.toFixed(casas),
  );
}

function inicioPeriodo(
  periodo: PeriodoRelatorio,
  hoje: Temporal.PlainDate,
) {
  switch (periodo) {
    case "todo":
      return null;

    case "mes_atual":
      return hoje.with({
        day: 1,
      });

    case "30":
      return hoje.subtract({
        days: 29,
      });

    case "90":
      return hoje.subtract({
        days: 89,
      });

    case "365":
      return hoje.subtract({
        days: 364,
      });
  }
}

export class RelatorioService {
  constructor(
    private readonly compraRepository =
      new CompraRepository(),

    private readonly contatoRepository =
      new ContatoRepository(),
  ) {}

  async indicadores(
    periodo: PeriodoRelatorio,
    hoje =
      Temporal.Now.plainDateISO(
        "America/Sao_Paulo",
      ),
  ) {
    const de =
      inicioPeriodo(
        periodo,
        hoje,
      );

    const [compras, contatos] =
      await Promise.all([
        de === null
          ? this.compraRepository
              .findAll()
          : this.compraRepository
              .findByPeriod(
                de,
                hoje,
              ),

        this.contatoRepository
          .findAllComCompras(),
      ]);

    const contatosPeriodo =
      contatos.filter(
        (contato) => {
          if (periodo === "todo") {
            return true;
          }

          let dataBase =
            contato.dataPrimeiroContato ??
            contato.dataAvaliacao ??
            null;

          if (
            dataBase === null &&
            contato.compras.length > 0
          ) {
            let primeiraCompra =
              contato.compras[0]
                ?.dataCorte ??
              null;

            for (
              const compra
              of contato.compras
            ) {
              if (
                primeiraCompra === null ||
                Temporal.PlainDate
                  .compare(
                    compra.dataCorte,
                    primeiraCompra,
                  ) < 0
              ) {
                primeiraCompra =
                  compra.dataCorte;
              }
            }

            dataBase =
              primeiraCompra;
          }

          if (
            dataBase === null ||
            de === null
          ) {
            return false;
          }

          return (
            Temporal.PlainDate
              .compare(
                dataBase,
                de,
              ) >= 0 &&
            Temporal.PlainDate
              .compare(
                dataBase,
                hoje,
              ) <= 0
          );
        },
      );

    const totalContatos =
      contatosPeriodo.length;

    const contatosComCompra =
      contatosPeriodo.filter(
        (contato) =>
          contato.compras.length > 0,
      ).length;

    const conversaoGeral =
      totalContatos > 0
        ? (
            contatosComCompra /
            totalContatos
          ) * 100
        : 0;

    const quantidadeCompras =
      compras.length;

    let totalPago = 0;
    let pesoCompradoG = 0;

    let valorComPeso = 0;

    let lucroRevenda = 0;
    let quantidadeRevendidas = 0;
    let quantidadeARevender = 0;

    for (const compra of compras) {
      const valorPago =
        Number(
          compra.valorPago,
        );

      totalPago += valorPago;

      if (
        compra.pesoG !== null &&
        compra.pesoG > 0
      ) {
        pesoCompradoG +=
          compra.pesoG;

        valorComPeso +=
          valorPago;
      }

      if (
        compra.valorRevenda !== null
      ) {
        lucroRevenda +=
          Number(
            compra.valorRevenda,
          ) - valorPago;

        quantidadeRevendidas++;
      } else {
        quantidadeARevender++;
      }
    }

    const ticketMedio =
      quantidadeCompras > 0
        ? totalPago /
          quantidadeCompras
        : 0;

    const precoMedioPorGrama =
      pesoCompradoG > 0
        ? valorComPeso /
          pesoCompradoG
        : 0;

    return {
      periodo,

      quantidadeCompras,

      totalPago:
        arredondar(
          totalPago,
        ),

      ticketMedio:
        arredondar(
          ticketMedio,
        ),

      pesoCompradoG,

      precoMedioPorGrama:
        arredondar(
          precoMedioPorGrama,
        ),

      lucroRevenda:
        arredondar(
          lucroRevenda,
        ),

      quantidadeRevendidas,
      quantidadeARevender,

      totalContatos,
      contatosComCompra,

      conversaoGeral:
        arredondar(
          conversaoGeral,
        ),
    };
  }
}