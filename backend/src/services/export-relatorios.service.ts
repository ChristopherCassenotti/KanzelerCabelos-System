import ExcelJS = require("exceljs");

import { RelatorioService } from "./relatorio.service";
import { ComprasRelatorioService } from "./compras-relatorio.service";
import { PrecoMedioRelatorioService } from "./preco-medio-relatorio.service";
import { OrigemPerdasRelatorioService } from "./origem-perdas-relatorio.service";
import { ConversaoCidadeRelatorioService } from "./conversao-cidade-relatorio.service";
import { PrevisaoRecompraRelatorioService } from "./previsao-recompra-relatorio.service";
import { DetalhamentoComprasRelatorioService } from "./detalhamento-compras-relatorio.service";
import {ResultadoViagemService,} from "./resultado-viagem.service";
import {DiaRotaRepository,} from "../repositories/dia-rota.repository";

type PeriodoRelatorio =
  Parameters<
    RelatorioService["indicadores"]
  >[0];

function objeto(
  valor: unknown,
): valor is Record<
  string,
  unknown
> {
  return (
    typeof valor === "object" &&
    valor !== null &&
    !Array.isArray(valor)
  );
}

function valorCelula(
  valor: unknown,
): string | number | boolean {
  if (
    valor === null ||
    valor === undefined
  ) {
    return "";
  }

  if (
    typeof valor === "string" ||
    typeof valor === "number" ||
    typeof valor === "boolean"
  ) {
    return valor;
  }

  if (
    typeof valor === "bigint"
  ) {
    return Number(valor);
  }

  if (
    Array.isArray(valor)
  ) {
    return valor
      .map((item) =>
        valorCelula(item),
      )
      .join(", ");
  }

  if (objeto(valor)) {
    const texto =
      String(valor);

    if (
      texto !==
      "[object Object]"
    ) {
      return texto;
    }

    return JSON.stringify(
      valor,
    );
  }

  return String(valor);
}

function adicionarArray(
  planilha: ExcelJS.Worksheet,
  dados: unknown[],
) {
  if (dados.length === 0) {
    planilha.addRow([
      "Sem dados",
    ]);

    return;
  }

  const saoObjetos =
    dados.every(
      (item) =>
        objeto(item),
    );

  if (saoObjetos) {
    const chaves =
      Array.from(
        new Set(
          dados.flatMap(
            (item) =>
              Object.keys(
                item as Record<
                  string,
                  unknown
                >,
              ),
          ),
        ),
      );

    planilha.addRow(
      chaves,
    );

    planilha.getRow(
      planilha.rowCount,
    ).font = {
      bold: true,
    };

    for (
      const item of dados
    ) {
      const registro =
        item as Record<
          string,
          unknown
        >;

      planilha.addRow(
        chaves.map(
          (chave) =>
            valorCelula(
              registro[chave],
            ),
        ),
      );
    }

    return;
  }

  const saoArrays =
    dados.every(
      (item) =>
        Array.isArray(
          item,
        ),
    );

  if (saoArrays) {
    for (
      const linha of dados
    ) {
      planilha.addRow(
        (
          linha as unknown[]
        ).map(
          valorCelula,
        ),
      );
    }

    return;
  }

  for (
    const item of dados
  ) {
    planilha.addRow([
      valorCelula(item),
    ]);
  }
}

function adicionarDados(
  planilha: ExcelJS.Worksheet,
  dados: unknown,
) {
  if (
    Array.isArray(dados)
  ) {
    adicionarArray(
      planilha,
      dados,
    );

    return;
  }

  if (!objeto(dados)) {
    planilha.addRow([
      "Valor",
      valorCelula(dados),
    ]);

    return;
  }

  for (
    const [
      chave,
      valor,
    ] of Object.entries(
      dados,
    )
  ) {
    if (
      Array.isArray(valor)
    ) {
      if (
        planilha.rowCount >
        0
      ) {
        planilha.addRow([]);
      }

      const titulo =
        planilha.addRow([
          chave,
        ]);

      titulo.font = {
        bold: true,
      };

      adicionarArray(
        planilha,
        valor,
      );

      continue;
    }

    if (objeto(valor)) {
      planilha.addRow([
        chave,
        JSON.stringify(
          valor,
        ),
      ]);

      continue;
    }

    planilha.addRow([
      chave,
      valorCelula(
        valor,
      ),
    ]);
  }
}

function finalizarPlanilha(
  planilha: ExcelJS.Worksheet,
) {
  planilha.views = [
    {
      state: "frozen",
      ySplit: 1,
    },
  ];

  for (
    let indice = 1;
    indice <=
    planilha.columnCount;
    indice++
  ) {
    const coluna =
      planilha.getColumn(
        indice,
      );

    let largura = 12;

    coluna.eachCell(
      {
        includeEmpty: true,
      },
      (celula) => {
        const tamanho =
          String(
            celula.value ??
              "",
          ).length;

        largura =
          Math.max(
            largura,
            Math.min(
              tamanho + 2,
              45,
            ),
          );
      },
    );

    coluna.width =
      largura;
  }
}

function inicioDoPeriodo(
  periodo: PeriodoRelatorio,
) {
  const hoje =
    Temporal.Now.plainDateISO(
      "America/Sao_Paulo",
    );

  if (
    periodo === undefined
  ) {
    return null;
  }

  switch (periodo) {
    case "30":
      return hoje.subtract({
        days: 29,
      });

    case "90":
      return hoje.subtract({
        days: 89,
      });

    case "365":
      return hoje.subtract({
        days: 364,
      });

    default:
      return hoje.with({
        day: 1,
      });
  }
}

export class ExportRelatoriosService {
  constructor(
    private readonly relatorioService =
      new RelatorioService(),
    
    private readonly resultadoViagemService =
      new ResultadoViagemService(),

    private readonly diaRotaRepository =
      new DiaRotaRepository(),
    private readonly comprasRelatorioService =
      new ComprasRelatorioService(),

    private readonly precoMedioRelatorioService =
      new PrecoMedioRelatorioService(),

    private readonly origemPerdasRelatorioService =
      new OrigemPerdasRelatorioService(),

    private readonly conversaoCidadeRelatorioService =
      new ConversaoCidadeRelatorioService(),

    private readonly previsaoRecompraRelatorioService =
      new PrevisaoRecompraRelatorioService(),

    private readonly detalhamentoComprasRelatorioService =
      new DetalhamentoComprasRelatorioService(),
  ) {}
  private async buscarViagens(
  periodo: PeriodoRelatorio,
) {
  const rotas =
    await this.diaRotaRepository
      .findAll();

  const hoje =
    Temporal.Now.plainDateISO(
      "America/Sao_Paulo",
    );

  const inicio =
    inicioDoPeriodo(
      periodo,
    );

  const rotasFiltradas =
    rotas.filter(
      (rota) => {
        if (
          Temporal.PlainDate.compare(
            rota.data,
            hoje,
          ) > 0
        ) {
          return false;
        }

        if (
          inicio &&
          Temporal.PlainDate.compare(
            rota.data,
            inicio,
          ) < 0
        ) {
          return false;
        }

        return rota.itens.some(
          (item) =>
            item.tipo ===
            "visita",
        );
      },
    );

  const viagens: Array<
    Record<string, unknown>
  > = [];

  for (
    const rota of
    rotasFiltradas
  ) {
    const resultado =
      await this
        .resultadoViagemService
        .buscar(
          rota.id,
        );

    if (!resultado) {
      continue;
    }

viagens.push({
  ...resultado,
});
  }

  return viagens;
}
  async gerar(
    periodo:
      PeriodoRelatorio,
  ) {
const [
  resumo,
  compras,
  precoMedio,
  origemPerdas,
  conversao,
  previsaoRecompra,
  detalhamento,
  viagens,
] = await Promise.all([
      this.relatorioService
        .indicadores(
          periodo,
        ),

      this.comprasRelatorioService
        .buscar(
          periodo,
        ),

      this.precoMedioRelatorioService
        .buscar(
          periodo,
        ),

      this.origemPerdasRelatorioService
        .buscar(
          periodo,
        ),

      this.conversaoCidadeRelatorioService
        .buscar(
          periodo,
        ),

      this.previsaoRecompraRelatorioService
        .buscar(),

      this.detalhamentoComprasRelatorioService
        .buscar(
          periodo,
        ),
        this.buscarViagens(
            periodo,
        ),
    ]);

    const workbook =
      new ExcelJS.Workbook();

    workbook.creator =
      "Kanzler Cabelos";

    workbook.created =
      new Date();

    const relatorios = [
      {
        nome: "Resumo",
        dados: resumo,
      },
      {
        nome: "Compras",
        dados: compras,
      },
      {
        nome:
          "Preço por grama",
        dados:
          precoMedio,
      },
      {
        nome:
          "Origem e perdas",
        dados:
          origemPerdas,
      },
      {
        nome:
          "Conversão",
        dados:
          conversao,
      },
      {
  nome:
    "Viagens",
  dados:
    viagens,
},
      {
        nome:
          "Previsão recompra",
        dados:
          previsaoRecompra,
      },
      {
        nome:
          "Detalhamento",
        dados:
          detalhamento,
      },
    ];

    for (
      const relatorio of
      relatorios
    ) {
      const planilha =
        workbook.addWorksheet(
          relatorio.nome,
        );

      adicionarDados(
        planilha,
        relatorio.dados,
      );

      finalizarPlanilha(
        planilha,
      );
    }

    return workbook.xlsx
      .writeBuffer();
  }
}