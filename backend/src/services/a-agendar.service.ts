import { ContatoRepository } from "../repositories/contato.repository";
import { ItemRotaRepository } from "../repositories/item-rota.repository";
import { RecompraService } from "./recompra.service";
import { FuturoCorteService } from "./futuro-corte.service";
import type { AAgendarQuery } from "../schemas/a-agendar.schema";

export class AAgendarService {
  constructor(
    private readonly contatoRepository =
      new ContatoRepository(),

    private readonly itemRotaRepository =
      new ItemRotaRepository(),

    private readonly recompraService =
      new RecompraService(),

    private readonly futuroCorteService =
      new FuturoCorteService(),
  ) {}

    async listar(
      hoje = Temporal.Now.plainDateISO(
        "America/Sao_Paulo",
      ),
      filtros: AAgendarQuery = {},
    ) {
    const [
      contatos,
      visitas,
      recompras,
      futurosCortes,
    ] =
      await Promise.all([
        this.contatoRepository
          .findAtivosParaAgendar(),

        this.itemRotaRepository
          .findVisitasAbertas(),

        this.recompraService
          .listarProntas(hoje),

        this.futuroCorteService
          .listar({}, hoje),
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

    const futuroCortePorContato = new Map(
      futurosCortes.map(
        ({ contato: _contato, ...futuroCorte }) => [
          futuroCorte.contatoId,
          futuroCorte,
        ],
      ),
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

    if (contato.status === "perdido") {
      return false;
    }

    const futuroCorte =
      futuroCortePorContato.get(
        contato.id,
      );

    if (futuroCorte?.prontoParaContato) {
      return true;
    }

    // Lead que só precisa de contato mais à frente fica fora da fila.
    if (contato.status === "lead") {
      return futuroCorte?.status !==
        "acompanhando";
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

    const ativo =
      futuroCortePorContato.get(
        contato.id,
      );

    const futuroCorte =
      ativo?.prontoParaContato
        ? ativo
        : null;

    return {
      ...contato,

      tipoAgendamento: futuroCorte
        ? ("futuro" as const)
        : contato.status === "comprado"
          ? ("recompra" as const)
          : contato.status ===
              "avaliacao_agendada"
            ? ("avaliacao" as const)
            : ("lead" as const),

      recompra: recompra ?? null,
      futuroCorte,
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
    futuro: 0,
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