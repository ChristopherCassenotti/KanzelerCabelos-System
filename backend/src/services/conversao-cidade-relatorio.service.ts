import { ContatoRepository } from "../repositories/contato.repository";

type PeriodoRelatorio =
  | "todo"
  | "mes_atual"
  | "30"
  | "90"
  | "365";

interface GrupoCidade {
  cidadeId: string;
  nome: string;
  uf: string;

  contatos: number;
  avaliacoes: number;
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

export class ConversaoCidadeRelatorioService {
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

    const cidades =
      new Map<
        string,
        GrupoCidade
      >();

    for (
      const contato
      of contatosDoPeriodo
    ) {
      if (!contato.cidade) {
        continue;
      }

      const cidade =
        contato.cidade;

      let grupo =
        cidades.get(
          cidade.id,
        );

      if (!grupo) {
        grupo = {
          cidadeId:
            cidade.id,

          nome:
            cidade.nome,

          uf:
            cidade.uf,

          contatos: 0,
          avaliacoes: 0,
          compras: 0,
          valorComprado: 0,
        };

        cidades.set(
          cidade.id,
          grupo,
        );
      }

      grupo.contatos++;

      const chegouAvaliacao =
        contato.status ===
          "avaliacao_agendada" ||
        contato.status ===
          "comprado" ||
        (
          contato.status ===
            "perdido" &&
          contato.dataAvaliacao !==
            null
        );

      if (chegouAvaliacao) {
        grupo.avaliacoes++;
      }

      if (
        contato.compras.length > 0
      ) {
        grupo.compras++;

        grupo.valorComprado +=
          contato.compras.reduce(
            (total, compra) =>
              total +
              Number(
                compra.valorPago,
              ),
            0,
          );
      }
    }

    const porCidade =
      Array.from(
        cidades.values(),
      )
        .map(
          (cidade) => ({
            ...cidade,

            conversao:
              cidade.contatos > 0
                ? arredondar(
                    (
                      cidade.compras /
                      cidade.contatos
                    ) * 100,
                  )
                : 0,

            valorComprado:
              arredondar(
                cidade.valorComprado,
              ),
          }),
        )
        .sort(
          (a, b) =>
            b.contatos -
            a.contatos,
        );

    const totais =
      porCidade.reduce(
        (
          total,
          cidade,
        ) => {
          total.contatos +=
            cidade.contatos;

          total.avaliacoes +=
            cidade.avaliacoes;

          total.compras +=
            cidade.compras;

          total.valorComprado +=
            cidade.valorComprado;

          return total;
        },
        {
          contatos: 0,
          avaliacoes: 0,
          compras: 0,
          valorComprado: 0,
        },
      );

    return {
      periodo,

      porCidade,

      total: {
        ...totais,

        valorComprado:
          arredondar(
            totais.valorComprado,
          ),

        conversao:
          totais.contatos > 0
            ? arredondar(
                (
                  totais.compras /
                  totais.contatos
                ) * 100,
              )
            : 0,
      },
    };
  }
}