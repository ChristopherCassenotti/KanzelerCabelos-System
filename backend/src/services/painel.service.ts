import { ContatoRepository } from "../repositories/contato.repository";
import { DiaRotaRepository } from "../repositories/dia-rota.repository";

import { AAgendarService } from "./a-agendar.service";
import { FuturoCorteService } from "./futuro-corte.service";

export class PainelService {
  constructor(
    private readonly contatoRepository =
      new ContatoRepository(),

    private readonly aAgendarService =
      new AAgendarService(),

    private readonly diaRotaRepository =
      new DiaRotaRepository(),

    private readonly futuroCorteService =
      new FuturoCorteService(),
  ) {}

  async resumo(
    hoje = Temporal.Now.plainDateISO(
      "America/Sao_Paulo",
    ),
  ) {
    const ate =
      hoje.add({
        days: 30,
      });

    const [
      contatos,
      aAgendar,
      proximasRotas,
      futurosCortes,
    ] = await Promise.all([
      this.contatoRepository.findAll(),

      this.aAgendarService.resumir(
        hoje,
      ),

      this.diaRotaRepository.findByPeriod(
        hoje,
        ate,
      ),

      this.futuroCorteService.resumir(
        hoje,
      ),
    ]);

    const status = {
      lead: 0,
      avaliacaoAgendada: 0,
      comprado: 0,
      perdido: 0,
    };

    for (const contato of contatos) {
      switch (contato.status) {
        case "lead":
          status.lead++;
          break;

        case "avaliacao_agendada":
          status.avaliacaoAgendada++;
          break;

        case "comprado":
          status.comprado++;
          break;

        case "perdido":
          status.perdido++;
          break;
      }
    }

    return {
      contatos: {
        total: contatos.length,
        ...status,
      },

      aAgendar: {
        total: aAgendar.total,
        tipos: aAgendar.tipos,
        cidades: aAgendar.cidades,
      },

      rotas: {
        proximas30Dias:
          proximasRotas.length,
      },

      futurosCortes,
    };
  }
}