import type { ConcluirItemRotaInput } from "../schemas/concluir-item-rota.schema";

import { ItemRotaRepository } from "../repositories/item-rota.repository";
import { DiaRotaRepository } from "../repositories/dia-rota.repository";

import {
  ordenarPorMenorDistancia,
} from "./ordem-rota.rules";

export class ItemRotaService {
  constructor(
    private readonly itemRotaRepository =
      new ItemRotaRepository(),

    private readonly diaRotaRepository =
      new DiaRotaRepository(),
  ) {}

  async concluir(
    diaRotaId: string,
    itemId: string,
    data: ConcluirItemRotaInput,
  ) {
    const item =
      await this.itemRotaRepository.findById(
        itemId,
      );

    if (
      !item ||
      item.diaRotaId !== diaRotaId
    ) {
      return {
        tipo:
          "item_nao_encontrado" as const,
      };
    }

    if (item.concluido) {
      return {
        tipo:
          "item_ja_concluido" as const,
      };
    }

    if (
      item.tipo === "visita" &&
      data.resultado === undefined
    ) {
      return {
        tipo:
          "resultado_obrigatorio" as const,
      };
    }

    const resultado =
      item.tipo === "visita"
        ? data.resultado!
        : null;

    const atualizado =
      await this.itemRotaRepository.concluir(
        itemId,
        resultado,
      );

    return {
      tipo: "sucesso" as const,

      item:
        atualizado,

      exigeRegistroCompra:
        item.tipo ===
          "visita" &&
        resultado ===
          "comprou",
    };
  }

  async remover(
    diaRotaId: string,
    itemId: string,
  ) {
    const item =
      await this.itemRotaRepository.findById(
        itemId,
      );

    if (
      !item ||
      item.diaRotaId !== diaRotaId
    ) {
      return {
        tipo:
          "item_nao_encontrado" as const,
      };
    }

    await this.itemRotaRepository.delete(
      itemId,
    );

    return {
      tipo: "sucesso" as const,
    };
  }

  async reordenar(
    diaRotaId: string,
    itemIds: string[],
  ) {
    const itens =
      await this.itemRotaRepository
        .findByDiaRotaId(
          diaRotaId,
        );

    if (
      itens.length === 0
    ) {
      return {
        tipo:
          "rota_sem_itens" as const,
      };
    }

    if (
      itemIds.length !==
      itens.length
    ) {
      return {
        tipo:
          "ordem_invalida" as const,
      };
    }

    const idsAtuais =
      new Set(
        itens.map(
          (item) =>
            item.id,
        ),
      );

    const todosPertencemARota =
      itemIds.every(
        (id) =>
          idsAtuais.has(id),
      );

    if (
      !todosPertencemARota
    ) {
      return {
        tipo:
          "ordem_invalida" as const,
      };
    }

    const itensOrdenados =
      await this.itemRotaRepository.reordenar(
        diaRotaId,
        itemIds,
      );

    return {
      tipo: "sucesso" as const,
      itens:
        itensOrdenados,
    };
  }

  async organizarPorMenorDistancia(
    diaRotaId: string,
  ) {
    const rota =
      await this.diaRotaRepository
        .findDetailedById(
          diaRotaId,
        );

    if (!rota) {
      return {
        tipo:
          "rota_nao_encontrada" as const,
      };
    }

    if (
      rota.itens.length === 0
    ) {
      return {
        tipo:
          "rota_sem_itens" as const,
      };
    }

    const visitasPendentes =
      rota.itens.filter(
        (item) =>
          item.tipo ===
            "visita" &&
          !item.concluido,
      );

    if (
      visitasPendentes.length <
      2
    ) {
      return {
        tipo:
          "visitas_insuficientes" as const,
      };
    }

    const partidaLat =
      rota.partidaCidade.lat;

    const partidaLng =
      rota.partidaCidade.lng;

    if (
      partidaLat === null ||
      partidaLng === null
    ) {
      return {
        tipo:
          "partida_sem_localizacao" as const,
      };
    }

    const origem = {
      lat:
        Number(
          partidaLat,
        ),

      lng:
        Number(
          partidaLng,
        ),
    };

    if (
      !Number.isFinite(
        origem.lat,
      ) ||
      !Number.isFinite(
        origem.lng,
      )
    ) {
      return {
        tipo:
          "partida_sem_localizacao" as const,
      };
    }

    const pontosVisitas: {
      id: string;
      lat: number;
      lng: number;
    }[] = [];

    for (
      const visita
      of visitasPendentes
    ) {
      const contato =
        visita.contato;

      if (!contato) {
        return {
          tipo:
            "visita_sem_localizacao" as const,

          itemId:
            visita.id,

          contatoId:
            visita.contatoId,
        };
      }

      const latBruto =
        contato.lat ??
        contato.cidade.lat;

      const lngBruto =
        contato.lng ??
        contato.cidade.lng;

      if (
        latBruto === null ||
        lngBruto === null
      ) {
        return {
          tipo:
            "visita_sem_localizacao" as const,

          itemId:
            visita.id,

          contatoId:
            contato.id,
        };
      }

      const lat =
        Number(
          latBruto,
        );

      const lng =
        Number(
          lngBruto,
        );

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
      ) {
        return {
          tipo:
            "visita_sem_localizacao" as const,

          itemId:
            visita.id,

          contatoId:
            contato.id,
        };
      }

      pontosVisitas.push({
        id:
          visita.id,
        lat,
        lng,
      });
    }

    const ordemVisitas =
      ordenarPorMenorDistancia(
        origem,
        pontosVisitas,
      );

    const itensConcluidos =
      rota.itens.filter(
        (item) =>
          item.concluido,
      );

    const tarefasPendentes =
      rota.itens.filter(
        (item) =>
          item.tipo ===
            "tarefa" &&
          !item.concluido,
      );

    const tarefasAntesSaida =
      tarefasPendentes.filter(
        (item) =>
          item.hora !== null &&
          Temporal.PlainTime.compare(
            item.hora,
            rota.horaSaida,
          ) < 0,
      );

    const tarefasDepois =
      tarefasPendentes.filter(
        (item) =>
          !tarefasAntesSaida.some(
            (tarefa) =>
              tarefa.id ===
              item.id,
          ),
      );

    const itemIds = [
      ...itensConcluidos.map(
        (item) =>
          item.id,
      ),

      ...tarefasAntesSaida.map(
        (item) =>
          item.id,
      ),

      ...ordemVisitas,

      ...tarefasDepois.map(
        (item) =>
          item.id,
      ),
    ];

    const itensOrdenados =
      await this.itemRotaRepository
        .reordenar(
          diaRotaId,
          itemIds,
        );

    return {
      tipo:
        "sucesso" as const,

      itens:
        itensOrdenados,
    };
  }
}