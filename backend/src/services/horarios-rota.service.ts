import { DiaRotaRepository } from "../repositories/dia-rota.repository";
import { ItemRotaRepository } from "../repositories/item-rota.repository";

import { calcularHorariosRota } from "./horarios-rota.rules";
import {
  RoutingService,
  type PontoRota,
} from "./routing.service";

interface ItemComDeslocamento {
  id: string;
  tipo: string;
  ordem: number;
  hora: Temporal.PlainTime | null;
  minutosDeslocamento?: number;
}

export class HorariosRotaService {
  constructor(
    private readonly diaRotaRepository =
      new DiaRotaRepository(),

    private readonly itemRotaRepository =
      new ItemRotaRepository(),

    private readonly routingService =
      new RoutingService(),
  ) {}

  async calcular(diaRotaId: string) {
    const diaRota =
      await this.diaRotaRepository.findDetailedById(
        diaRotaId,
      );

    if (!diaRota) {
      return {
        tipo: "rota_nao_encontrada" as const,
      };
    }

    if (diaRota.itens.length === 0) {
      return {
        tipo: "rota_sem_itens" as const,
      };
    }

    const itensOrdenados =
      [...diaRota.itens].sort(
        (a, b) => a.ordem - b.ordem,
      );

    const visitas =
      itensOrdenados.filter(
        (item) => item.tipo === "visita",
      );

    const partidaValida =
      diaRota.partidaCidade.lat !== null &&
      diaRota.partidaCidade.lng !== null;

    const todasVisitasTemCoordenadas =
      visitas.every(
        (item) =>
          item.contato !== null &&
          item.contato.lat !== null &&
          item.contato.lng !== null,
      );

    let rotaCompleta:
      | Awaited<
          ReturnType<
            RoutingService["calcularRota"]
          >
        >
      | null = null;

    /*
     * Caminho principal:
     *
     * partida
     * → cliente 1
     * → cliente 2
     * → cliente 3
     *
     * Uma única chamada à Geoapify.
     */
    if (
      partidaValida &&
      todasVisitasTemCoordenadas &&
      visitas.length > 0
    ) {
      const pontos: PontoRota[] = [
        {
          lat: Number(
            diaRota.partidaCidade.lat,
          ),

          lng: Number(
            diaRota.partidaCidade.lng,
          ),
        },

        ...visitas.map((item) => ({
          lat: Number(
            item.contato!.lat,
          ),

          lng: Number(
            item.contato!.lng,
          ),
        })),
      ];

      try {
        rotaCompleta =
          await this.routingService.calcularRota({
            pontos,
          });

        /*
         * Precisamos de um trecho para cada visita:
         *
         * partida → visita 1
         * visita 1 → visita 2
         * etc.
         */
        if (
          rotaCompleta &&
          rotaCompleta.trechos.length !==
            visitas.length
        ) {
          rotaCompleta = null;
        }
      } catch {
        rotaCompleta = null;
      }
    }

    const itensComDeslocamento:
      ItemComDeslocamento[] = [];

    /*
     * Se a rota completa funcionar,
     * usamos os legs retornados pela mesma chamada.
     */
    if (rotaCompleta) {
      let indiceVisita = 0;

      for (const item of itensOrdenados) {
        if (item.tipo !== "visita") {
          itensComDeslocamento.push({
            id: item.id,
            tipo: item.tipo,
            ordem: item.ordem,
            hora: item.hora,
          });

          continue;
        }

        const trecho =
          rotaCompleta.trechos[
            indiceVisita
          ];

        itensComDeslocamento.push({
          id: item.id,
          tipo: item.tipo,
          ordem: item.ordem,
          hora: item.hora,

          minutosDeslocamento:
            trecho?.duracaoMin ?? 8,
        });

        indiceVisita++;
      }

await this.diaRotaRepository.atualizarMetricas(
  diaRotaId,
  rotaCompleta.distanciaKm.toFixed(2),
  rotaCompleta.duracaoMin,
  rotaCompleta.polyline6,
);
    } else {
      /*
       * Fallback.
       *
       * Mantemos o cálculo trecho por trecho
       * que já estava funcionando.
       */
      let pontoAtual: PontoRota | null =
        null;

      if (partidaValida) {
        pontoAtual = {
          lat: Number(
            diaRota.partidaCidade.lat,
          ),

          lng: Number(
            diaRota.partidaCidade.lng,
          ),
        };
      }

      let distanciaTotalKm = 0;
      let duracaoTotalMin = 0;

      let metricasCompletas = true;

      for (const item of itensOrdenados) {
        if (item.tipo !== "visita") {
          itensComDeslocamento.push({
            id: item.id,
            tipo: item.tipo,
            ordem: item.ordem,
            hora: item.hora,
          });

          continue;
        }

        let minutosDeslocamento = 8;
        let trechoCalculado = false;

        const contato = item.contato;

        if (
          pontoAtual &&
          contato &&
          contato.lat !== null &&
          contato.lng !== null
        ) {
          const destino: PontoRota = {
            lat: Number(contato.lat),
            lng: Number(contato.lng),
          };

          try {
            const trecho =
              await this.routingService.calcularTrecho(
                {
                  origem: pontoAtual,
                  destino,
                },
              );

            if (trecho) {
              minutosDeslocamento =
                trecho.duracaoMin;

              distanciaTotalKm +=
                trecho.distanciaKm;

              duracaoTotalMin +=
                trecho.duracaoMin;

              trechoCalculado = true;
            }
          } catch {
            minutosDeslocamento = 8;
          }

          pontoAtual = destino;
        }

        if (!trechoCalculado) {
          metricasCompletas = false;
        }

        itensComDeslocamento.push({
          id: item.id,
          tipo: item.tipo,
          ordem: item.ordem,
          hora: item.hora,
          minutosDeslocamento,
        });
      }

await this.diaRotaRepository.atualizarMetricas(
  diaRotaId,

  metricasCompletas
    ? distanciaTotalKm.toFixed(2)
    : null,

  metricasCompletas
    ? duracaoTotalMin
    : null,

  null,
);
    }

    const horarios =
      calcularHorariosRota({
        horaSaida:
          diaRota.horaSaida,

        minutosPorVisita:
          diaRota.minutosPorVisita,

        itens:
          itensComDeslocamento,
      });

    const itensAtualizados =
      await this.itemRotaRepository.atualizarHorarios(
        diaRotaId,
        horarios,
      );

    return {
      tipo: "sucesso" as const,
      itens: itensAtualizados,
    };
  }
}