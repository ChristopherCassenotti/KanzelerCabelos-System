import type { AgendarVisitaInput } from "../schemas/visita-rota.schema";

import { ContatoRepository } from "../repositories/contato.repository";
import { DiaRotaRepository } from "../repositories/dia-rota.repository";
import { ItemRotaRepository } from "../repositories/item-rota.repository";

export class VisitaRotaService {
  constructor(
    private readonly itemRotaRepository =
      new ItemRotaRepository(),

    private readonly diaRotaRepository =
      new DiaRotaRepository(),

    private readonly contatoRepository =
      new ContatoRepository(),
  ) {}

  async agendar(
    diaRotaId: string,
    data: AgendarVisitaInput,
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

    const contato =
      await this.contatoRepository.findById(
        data.contatoId,
      );

    if (!contato) {
      return {
        tipo: "contato_nao_encontrado" as const,
      };
    }

    if (contato.status === "perdido") {
      return {
        tipo: "contato_perdido" as const,
      };
    }

    const hoje = Temporal.Now.plainDateISO(
      "America/Sao_Paulo",
    );

    const visitas =
      await this.itemRotaRepository
        .findVisitasAbertasByContatoId(
          data.contatoId,
        );

    const visitaFutura = visitas.find(
      (visita) =>
        Temporal.PlainDate.compare(
          visita.diaRota.data,
          hoje,
        ) >= 0,
    );

    const visita =
      await this.itemRotaRepository.salvarVisita({
        diaRotaId,
        contatoId: data.contatoId,

        alterarStatusParaAvaliacao:
          contato.status === "lead",

        ...(visitaFutura !== undefined
          ? {
              visitaExistenteId:
                visitaFutura.id,
            }
          : {}),

        ...(data.hora !== undefined
          ? {
              hora: Temporal.PlainTime.from(
                data.hora,
              ),
            }
          : {}),
      });

    return {
      tipo: visitaFutura
        ? ("visita_movida" as const)
        : ("visita_criada" as const),

      visita,
    };
  }
}