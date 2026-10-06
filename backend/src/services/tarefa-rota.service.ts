import type { CriarTarefaRotaInput } from "../schemas/tarefa-rota.schema";

import { DiaRotaRepository } from "../repositories/dia-rota.repository";
import { ItemRotaRepository } from "../repositories/item-rota.repository";

export class TarefaRotaService {
  constructor(
    private readonly itemRotaRepository =
      new ItemRotaRepository(),

    private readonly diaRotaRepository =
      new DiaRotaRepository(),
  ) {}

  async criar(
    diaRotaId: string,
    data: CriarTarefaRotaInput,
  ) {
    const diaRota =
      await this.diaRotaRepository.findById(
        diaRotaId,
      );

    if (!diaRota) {
      return {
        tipo: "rota_nao_encontrada" as const,
      };
    }

    const tarefa =
      await this.itemRotaRepository.criarTarefa({
        diaRotaId,
        titulo: data.titulo.trim(),

        ...(data.hora !== undefined
          ? {
              hora: Temporal.PlainTime.from(
                data.hora,
              ),
            }
          : {}),
      });

    return {
      tipo: "sucesso" as const,
      tarefa,
    };
  }
}