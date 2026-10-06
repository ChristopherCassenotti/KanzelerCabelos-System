import { DiaRotaRepository } from "../repositories/dia-rota.repository";
import { ItemRotaRepository } from "../repositories/item-rota.repository";

export class RemarcarVisitaService {
  constructor(
    private readonly itemRotaRepository =
      new ItemRotaRepository(),

    private readonly diaRotaRepository =
      new DiaRotaRepository(),
  ) {}

  async adiarParaDiaSeguinte(
    diaRotaId: string,
    itemId: string,
  ) {
    const diaAtual =
      await this.diaRotaRepository.findById(
        diaRotaId,
      );

    if (!diaAtual) {
      return {
        tipo: "rota_nao_encontrada" as const,
      };
    }

    const item =
      await this.itemRotaRepository.findById(
        itemId,
      );

    if (
      !item ||
      item.diaRotaId !== diaRotaId
    ) {
      return {
        tipo: "item_nao_encontrado" as const,
      };
    }

    if (item.tipo !== "visita") {
      return {
        tipo: "item_nao_visita" as const,
      };
    }

    const dataSeguinte =
      diaAtual.data.add({
        days: 1,
      });

    let proximoDia =
      await this.diaRotaRepository.findByDate(
        dataSeguinte,
      );

    if (!proximoDia) {
      proximoDia =
        await this.diaRotaRepository.create({
          data: dataSeguinte,

          partidaCidadeId:
            diaAtual.partidaCidadeId,

          horaSaida:
            diaAtual.horaSaida,

          minutosPorVisita:
            diaAtual.minutosPorVisita,
        });
    }

    const visita =
      await this.itemRotaRepository.remarcar(
        itemId,
        proximoDia.id,
      );

    return {
      tipo: "sucesso" as const,
      visita,
      novaData: dataSeguinte,
    };
  }
}