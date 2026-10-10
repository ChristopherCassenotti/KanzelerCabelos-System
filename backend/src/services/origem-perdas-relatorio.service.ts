import { ContatoRepository } from "../repositories/contato.repository";

type PeriodoRelatorio =
  | "todo"
  | "mes_atual"
  | "30"
  | "90"
  | "365";

interface GrupoOrigem {
  contatos: number;
  compras: number;
  valorComprado: number;
}

function arredondar(
  valor: number,
) {
  return Number(
    valor.toFixed(2),
  );
}

export class OrigemPerdasRelatorioService {
  constructor(
    private readonly contatoRepository =
      new ContatoRepository(),
  ) {}

  async buscar(
    periodo: PeriodoRelatorio,
    hoje =
      Temporal.Now.plainDateISO(
        "America/Sao_Paulo",
      ),
  ) {
    const contatos =
      await this.contatoRepository
        .findAllComCompras();

    let de:
      | Temporal.PlainDate
      | null = null;

    if (periodo !== "todo") {
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
    }

    const contatosDoPeriodo =
      contatos.filter(
        (contato) => {
          let dataBase =
            contato.dataPrimeiroContato ??
            contato.dataAvaliacao;

          if (!dataBase) {
            const datasCompra =
              contato.compras
                .map(
                  (compra) =>
                    compra.dataCorte,
                )
                .sort(
                  (a, b) =>
                    Temporal.PlainDate.compare(
                      a,
                      b,
                    ),
                );

            dataBase =
              datasCompra[0] ?? null;
          }

          if (!dataBase) {
            return periodo === "todo";
          }

          if (periodo === "todo") {
            return true;
          }

          if (!de) {
            return false;
          }

          return (
            Temporal.PlainDate.compare(
              dataBase,
              de,
            ) >= 0 &&
            Temporal.PlainDate.compare(
              dataBase,
              hoje,
            ) <= 0
          );
        },
      );

    const origens =
      new Map<
        string,
        GrupoOrigem
      >();

    const perdas =
      new Map<string, number>();

    for (
      const contato
      of contatosDoPeriodo
    ) {
      const origem =
        contato.origem?.trim() ||
        "Não informado";

      let grupoOrigem =
        origens.get(origem);

      if (!grupoOrigem) {
        grupoOrigem = {
          contatos: 0,
          compras: 0,
          valorComprado: 0,
        };

        origens.set(
          origem,
          grupoOrigem,
        );
      }

      grupoOrigem.contatos++;

      if (
        contato.compras.length > 0
      ) {
        grupoOrigem.compras++;

        grupoOrigem.valorComprado +=
          contato.compras.reduce(
            (total, compra) =>
              total +
              Number(
                compra.valorPago,
              ),
            0,
          );
      }

      if (
        contato.status ===
        "perdido"
      ) {
        const motivo =
          contato.motivoPerda
            ?.trim() ||
          "Não informado";

        perdas.set(
          motivo,
          (perdas.get(motivo) ??
            0) + 1,
        );
      }
    }

    const porOrigem =
      Array.from(
        origens.entries(),
      )
        .map(
          ([origem, grupo]) => ({
            origem,

            contatos:
              grupo.contatos,

            compras:
              grupo.compras,

            conversao:
              grupo.contatos > 0
                ? arredondar(
                    (
                      grupo.compras /
                      grupo.contatos
                    ) * 100,
                  )
                : 0,

            valorComprado:
              arredondar(
                grupo.valorComprado,
              ),
          }),
        )
        .sort(
          (a, b) =>
            b.contatos -
            a.contatos,
        );

    const motivosPerda =
      Array.from(
        perdas.entries(),
      )
        .map(
          ([
            motivo,
            quantidade,
          ]) => ({
            motivo,
            quantidade,
          }),
        )
        .sort(
          (a, b) =>
            b.quantidade -
            a.quantidade,
        );

    return {
      periodo,

      totalContatos:
        contatosDoPeriodo.length,

      porOrigem,

      motivosPerda,
    };
  }
}