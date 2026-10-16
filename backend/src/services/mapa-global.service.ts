import { ContatoRepository } from "../repositories/contato.repository";
import { DiaRotaRepository } from "../repositories/dia-rota.repository";
import { calcularRecompra } from "./recompra.rules";
import { MapaRotaService } from "./mapa-rota.service";

export interface FiltrosMapaGlobal {
  status?: string;
  cidadeId?: string;
  soProntasRecompra?: boolean;
  dataRota?: Temporal.PlainDate;
}

export class MapaGlobalService {
  constructor(
    private readonly contatoRepository =
      new ContatoRepository(),

    private readonly diaRotaRepository =
      new DiaRotaRepository(),

    private readonly mapaRotaService =
      new MapaRotaService(),
  ) {}

  async buscar(
    filtros: FiltrosMapaGlobal = {},
    hoje = Temporal.Now.plainDateISO(
      "America/Sao_Paulo",
    ),
  ) {
    const contatos =
      await this.contatoRepository
        .findAllComCompras();

    const contatosMapa = contatos
      .map((contato) => {
        if (
          contato.lat === null ||
          contato.lng === null
        ) {
          return null;
        }

        const comprasOrdenadas =
          [...contato.compras].sort(
            (a, b) =>
              b.dataCorte
                .toString()
                .localeCompare(
                  a.dataCorte.toString(),
                ),
          );

        const ultimaCompra =
          comprasOrdenadas[0] ?? null;

        let recompra:
          | ReturnType<
              typeof calcularRecompra
            >
          | null = null;

        if (
          contato.status ===
            "comprado" &&
          ultimaCompra
        ) {
          recompra = calcularRecompra({
            ultimoCorte:
              ultimaCompra.dataCorte,

            cicloRecompraMeses:
              contato.cicloRecompraMeses,

            hoje,
          });
        }

        const statusMapa =
          contato.status ===
            "comprado" &&
          recompra?.pronta
            ? "recompra"
            : contato.status;

        return {
          id: contato.id,
          nome: contato.nome,
          telefone:
            contato.telefone,
          endereco:
            contato.endereco,

          status:
            contato.status,

          statusMapa,

          lat:
            Number(contato.lat),

          lng:
            Number(contato.lng),

          cidade: {
            id: contato.cidade.id,
            nome:
              contato.cidade.nome,
            uf: contato.cidade.uf,
          },

          recompra:
            ultimaCompra &&
            recompra
              ? {
                  ultimoCorte:
                    ultimaCompra
                      .dataCorte
                      .toString(),

                  cicloRecompraMeses:
                    contato
                      .cicloRecompraMeses,

                  ...recompra,
                }
              : null,
        };
      })
      .filter(
        (
          contato,
        ): contato is NonNullable<
          typeof contato
        > =>
          contato !== null,
      )
      .filter((contato) => {
        if (
          filtros.cidadeId &&
          contato.cidade.id !==
            filtros.cidadeId
        ) {
          return false;
        }

        if (
          filtros.status &&
          contato.statusMapa !==
            filtros.status
        ) {
          return false;
        }

        if (
          filtros.soProntasRecompra &&
          contato.statusMapa !==
            "recompra"
        ) {
          return false;
        }

        return true;
      });

    const cidadesMap = new Map<
      string,
      {
        id: string;
        nome: string;
        uf: string;
        total: number;
        lead: number;
        avaliacaoAgendada: number;
        comprado: number;
        recompra: number;
        perdido: number;
      }
    >();

    for (const contato of contatosMapa) {
      let cidade =
        cidadesMap.get(
          contato.cidade.id,
        );

      if (!cidade) {
        cidade = {
          id: contato.cidade.id,
          nome:
            contato.cidade.nome,
          uf: contato.cidade.uf,
          total: 0,
          lead: 0,
          avaliacaoAgendada: 0,
          comprado: 0,
          recompra: 0,
          perdido: 0,
        };

        cidadesMap.set(
          contato.cidade.id,
          cidade,
        );
      }

      cidade.total += 1;

      if (
        contato.statusMapa ===
        "lead"
      ) {
        cidade.lead += 1;
      }

      if (
        contato.statusMapa ===
        "avaliacao_agendada"
      ) {
        cidade.avaliacaoAgendada +=
          1;
      }

      if (
        contato.statusMapa ===
        "comprado"
      ) {
        cidade.comprado += 1;
      }

      if (
        contato.statusMapa ===
        "recompra"
      ) {
        cidade.recompra += 1;
      }

      if (
        contato.statusMapa ===
        "perdido"
      ) {
        cidade.perdido += 1;
      }
    }

    let rota = null;

    if (filtros.dataRota) {
      const diaRota =
        await this.diaRotaRepository
          .findByDate(
            filtros.dataRota,
          );

      if (diaRota) {
        rota =
          await this.mapaRotaService
            .buscar(
              diaRota.id,
            );
      }
    }

    return {
      total:
        contatosMapa.length,

      contatos:
        contatosMapa,

      cidades:
        Array.from(
          cidadesMap.values(),
        ).sort((a, b) =>
          a.nome.localeCompare(
            b.nome,
            "pt-BR",
          ),
        ),

      rota,
    };
  }
}