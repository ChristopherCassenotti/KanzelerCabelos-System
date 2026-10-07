import { ContatoRepository } from "../repositories/contato.repository";
import { ItemRotaRepository } from "../repositories/item-rota.repository";
import { RecompraService } from "./recompra.service";
import type { AAgendarQuery } from "../schemas/a-agendar.schema";

export class AAgendarService {
  constructor(
    private readonly contatoRepository =
      new ContatoRepository(),

    private readonly itemRotaRepository =
      new ItemRotaRepository(),

    private readonly recompraService =
      new RecompraService(),
  ) {}

    async listar(
      hoje = Temporal.Now.plainDateISO(
        "America/Sao_Paulo",
      ),
      filtros: AAgendarQuery = {},
    ) {
    const [contatos, visitas, recompras] =
      await Promise.all([
        this.contatoRepository
          .findAtivosParaAgendar(),

        this.itemRotaRepository
          .findVisitasAbertas(),

        this.recompraService
          .listarProntas(hoje),
      ]);

    const contatosComVisitaFutura =
      new Set<string>();

    for (const visita of visitas) {
      if (!visita.contatoId) {
        continue;
      }

      const futura =
        Temporal.PlainDate.compare(
          visita.diaRota.data,
          hoje,
        ) >= 0;

      if (futura) {
        contatosComVisitaFutura.add(
          visita.contatoId,
        );
      }
    }

    const recompraPorContato = new Map(
      recompras.map((recompra) => [
        recompra.contatoId,
        recompra,
      ]),
    );

    const resultado = contatos
  .filter((contato) => {
    if (
      contatosComVisitaFutura.has(
        contato.id,
      )
    ) {
      return false;
    }

    if (contato.status === "lead") {
      return true;
    }

    if (
      contato.status ===
      "avaliacao_agendada"
    ) {
      return true;
    }

    if (
      contato.status === "comprado"
    ) {
      return recompraPorContato.has(
        contato.id,
      );
    }

    return false;
  })
  .map((contato) => {
    const recompra =
      recompraPorContato.get(
        contato.id,
      );

    return {
      ...contato,

      tipoAgendamento:
        contato.status === "comprado"
          ? ("recompra" as const)
          : contato.status ===
              "avaliacao_agendada"
            ? ("avaliacao" as const)
            : ("lead" as const),

      recompra: recompra ?? null,
    };
  });

return resultado.filter((item) => {
  if (
    filtros.cidadeId &&
    item.cidadeId !== filtros.cidadeId
  ) {
    return false;
  }

  if (
    filtros.tipo &&
    item.tipoAgendamento !== filtros.tipo
  ) {
    return false;
  }

  return true;
});
  }
  async resumir(
  hoje = Temporal.Now.plainDateISO(
    "America/Sao_Paulo",
  ),
) {
  const contatos = await this.listar(
    hoje,
    {},
  );

  const tipos = {
    lead: 0,
    avaliacao: 0,
    recompra: 0,
  };

  const cidades = new Map<
    string,
    {
      cidadeId: string;
      nome: string;
      uf: string;
      quantidade: number;
    }
  >();

  for (const contato of contatos) {
    tipos[contato.tipoAgendamento]++;

    const cidadeAtual =
      cidades.get(contato.cidadeId);

    if (cidadeAtual) {
      cidadeAtual.quantidade++;
      continue;
    }

    cidades.set(contato.cidadeId, {
      cidadeId: contato.cidadeId,
      nome: contato.cidade.nome,
      uf: contato.cidade.uf,
      quantidade: 1,
    });
  }

  return {
    total: contatos.length,

    tipos,

    cidades: Array.from(
      cidades.values(),
    ).sort(
      (a, b) =>
        b.quantidade - a.quantidade ||
        a.nome.localeCompare(
          b.nome,
          "pt-BR",
        ),
    ),
  };
}
}