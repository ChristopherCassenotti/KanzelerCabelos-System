import { ContatoRepository } from "../repositories/contato.repository";

interface GrupoCidade {
  cidadeId: string;
  nome: string;
  uf: string;

  vencidas: number;

  meses: Map<
    string,
    number
  >;
}

const NOMES_MESES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

function chaveMes(
  data: Temporal.PlainDate,
) {
  return (
    `${data.year}-` +
    String(data.month)
      .padStart(2, "0")
  );
}

function labelMes(
  data: Temporal.PlainDate,
) {
  return (
    `${NOMES_MESES[data.month - 1]}/` +
    String(data.year)
      .slice(-2)
  );
}

export class PrevisaoRecompraRelatorioService {
  constructor(
    private readonly contatoRepository =
      new ContatoRepository(),
  ) {}

  async buscar(
    hoje =
      Temporal.Now.plainDateISO(
        "America/Sao_Paulo",
      ),
  ) {
    const contatos =
      await this.contatoRepository
        .findAllComCompras();

    const inicioMesAtual =
      hoje.with({
        day: 1,
      });

    const meses = [
      inicioMesAtual,
      inicioMesAtual.add({
        months: 1,
      }),
      inicioMesAtual.add({
        months: 2,
      }),
    ];

    const chavesMeses =
      meses.map(chaveMes);

    const cidades =
      new Map<
        string,
        GrupoCidade
      >();

    for (const contato of contatos) {
      if (
        contato.status !==
        "comprado"
      ) {
        continue;
      }

      if (!contato.cidade) {
        continue;
      }

      if (
        contato.compras.length === 0
      ) {
        continue;
      }

      const comprasOrdenadas =
        [...contato.compras]
          .sort(
            (a, b) =>
              Temporal.PlainDate.compare(
                b.dataCorte,
                a.dataCorte,
              ),
          );

      const ultimaCompra =
        comprasOrdenadas[0];

      if (!ultimaCompra) {
        continue;
      }

      const ciclo =
        contato.cicloRecompraMeses ??
        8;

      const proximaRecompra =
        ultimaCompra.dataCorte.add({
          months: ciclo,
        });

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

          vencidas: 0,

          meses:
            new Map(
              chavesMeses.map(
                (mes) => [
                  mes,
                  0,
                ],
              ),
            ),
        };

        cidades.set(
          cidade.id,
          grupo,
        );
      }

      if (
        Temporal.PlainDate.compare(
          proximaRecompra,
          hoje,
        ) < 0
      ) {
        grupo.vencidas++;
        continue;
      }

      const mesRecompra =
        chaveMes(
          proximaRecompra,
        );

      if (
        grupo.meses.has(
          mesRecompra,
        )
      ) {
        grupo.meses.set(
          mesRecompra,
          (
            grupo.meses.get(
              mesRecompra,
            ) ?? 0
          ) + 1,
        );
      }
    }

    const porCidade =
      Array.from(
        cidades.values(),
      )
        .map((cidade) => {
          const previsoes =
            chavesMeses.map(
              (mes) => ({
                mes,

                quantidade:
                  cidade.meses.get(
                    mes,
                  ) ?? 0,
              }),
            );

          const total =
            cidade.vencidas +
            previsoes.reduce(
              (
                soma,
                previsao,
              ) =>
                soma +
                previsao.quantidade,
              0,
            );

          return {
            cidadeId:
              cidade.cidadeId,

            nome:
              cidade.nome,

            uf:
              cidade.uf,

            vencidas:
              cidade.vencidas,

            previsoes,

            total,
          };
        })
        .filter(
          (cidade) =>
            cidade.total > 0,
        )
        .sort(
          (a, b) =>
            b.total -
            a.total,
        );

    return {
      meses:
        meses.map(
          (mes) => ({
            mes:
              chaveMes(mes),

            label:
              labelMes(mes),
          }),
        ),

      porCidade,
    };
  }
}