import { DiaRotaRepository } from "../repositories/dia-rota.repository";
import { ItemRotaRepository } from "../repositories/item-rota.repository";

import { calcularHorariosRota } from "./horarios-rota.rules";

export class HorariosRotaService {
  constructor(
    private readonly diaRotaRepository =
      new DiaRotaRepository(),

    private readonly itemRotaRepository =
      new ItemRotaRepository(),
  ) {}

  async calcular(diaRotaId: string) {
    const diaRota =
      await this.diaRotaRepository.findById(
        diaRotaId,
      );

    if (!diaRota) {
      return {
        tipo: "rota_nao_encontrada" as const,
      };
    }

    const itens =
      await this.itemRotaRepository.findByDiaRotaId(
        diaRotaId,
      );

    if (itens.length === 0) {
      return {
        tipo: "rota_sem_itens" as const,
      };
    }

    const horarios = calcularHorariosRota({
      horaSaida: diaRota.horaSaida,

      minutosPorVisita:
        diaRota.minutosPorVisita,

      itens: itens.map((item) => ({
        id: item.id,
        tipo: item.tipo,
        ordem: item.ordem,
        hora: item.hora,
      })),
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