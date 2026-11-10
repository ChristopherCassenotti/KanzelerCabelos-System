import { http } from "../api/http";
import type {
  AveragePriceReport,
  ConversionCityReportItem,
  OriginsLossesReport,
  PurchaseDetailReportItem,
  PurchasesReport,
  ReportIndicators,
  ReportPeriod,
  TripsReport,
} from "../../types/report";

function periodParams(periodo: ReportPeriod) {
  return { periodo };
}

export async function getReportIndicators(periodo: ReportPeriod) {
  const response = await http.get<ReportIndicators>("/relatorios/indicadores", {
    params: periodParams(periodo),
  });
  return response.data;
}

export async function getPurchasesReport(periodo: ReportPeriod) {
  const response = await http.get<PurchasesReport>("/relatorios/compras", {
    params: periodParams(periodo),
  });
  return response.data;
}

export async function getAveragePriceReport(periodo: ReportPeriod) {
  const response = await http.get<AveragePriceReport>("/relatorios/preco-medio", {
    params: periodParams(periodo),
  });
  return response.data;
}

export async function getOriginsLossesReport(periodo: ReportPeriod) {
  const response = await http.get<OriginsLossesReport>("/relatorios/origens-perdas", {
    params: periodParams(periodo),
  });
  return response.data;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function toReportNumeric(
  value: unknown,
): number | string {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim() !== ""
  ) {
    return value;
  }

  return 0;
}

function extractArray(
  value: unknown,
  keys: string[],
): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return [];
  }

  for (const key of keys) {
    const candidate =
      value[key];

    if (
      Array.isArray(
        candidate,
      )
    ) {
      return candidate;
    }
  }

  return [];
}

function normalizeConversionCity(
  value: unknown,
): ConversionCityReportItem[] {
  return extractArray(
    value,
    [
      "cidades",
      "porCidade",
      "dados",
      "itens",
      "rows",
      "conversao",
    ],
  )
    .filter(isRecord)
    .map((item) => ({
      cidade:
        String(
          item.cidade ??
          item.nome ??
          "",
        ).trim(),

      contatos:
        Number(
          item.contatos ??
          0,
        ),

      avaliacoes:
        Number(
          item.avaliacoes ??
          0,
        ),

      compras:
        Number(
          item.compras ??
          0,
        ),

      conversao:
        toReportNumeric(
          item.conversao,
        ),
      
      valor:
        toReportNumeric(
          item.valor,
        ),
    }))
    .filter(
      (item) =>
        item.cidade.length >
        0,
    );
}

function normalizePurchaseDetails(
  value: unknown,
): PurchaseDetailReportItem[] {
  return extractArray(
    value,
    [
      "compras",
      "detalhamento",
      "dados",
      "itens",
      "rows",
    ],
  )
    .filter(isRecord)
    .map((item) => ({
      compraId:
        String(
          item.compraId ??
          item.id ??
          "",
        ),

      contatoId:
        String(
          item.contatoId ??
          "",
        ),

      nome:
        String(
          item.nome ??
          "",
        ),

      cidade:
        String(
          item.cidade ??
          "",
        ),

      dataCorte:
        String(
          item.dataCorte ??
          "",
        ),

      cor:
        item.cor == null
          ? null
          : String(item.cor),

      textura:
        item.textura == null
          ? null
          : String(
              item.textura,
            ),

      comprimentoCm:
        item.comprimentoCm ==
        null
          ? null
          : Number(
              item.comprimentoCm,
            ),

      pesoG:
        item.pesoG == null
          ? null
          : Number(
              item.pesoG,
            ),

      valorPago:
        toReportNumeric(
          item.valorPago,
        ),
      
      precoPorGrama:
        toReportNumeric(
          item.precoPorGrama,
        ),
      
      valorRevenda:
        item.valorRevenda ==
        null
          ? null
          : toReportNumeric(
              item.valorRevenda,
          ),

      quimica:
        item.quimica == null
          ? null
          : String(
              item.quimica,
            ),

      formaPagamento:
        item.formaPagamento ==
        null
          ? null
          : String(
              item.formaPagamento,
            ),

      dataRevenda:
        item.dataRevenda ==
        null
          ? null
          : String(
              item.dataRevenda,
            ),

      comprador:
        item.comprador == null
          ? null
          : String(
              item.comprador,
            ),
    }))
    .filter(
      (item) =>
        item.compraId.length >
        0,
    );
}

export async function getConversionCityReport(
  periodo: ReportPeriod,
) {
  const response =
    await http.get<unknown>(
      "/relatorios/conversao-cidade",
      {
        params:
          periodParams(periodo),
      },
    );

  return normalizeConversionCity(
    response.data,
  );
}
export async function getTripsReport(periodo: ReportPeriod) {
  const response = await http.get<TripsReport>("/relatorios/viagens", {
    params: periodParams(periodo),
  });
  return response.data;
}

export async function getRepurchaseForecastReport() {
  const response = await http.get<unknown>("/relatorios/previsao-recompra");
  return response.data;
}

export async function getPurchaseDetailsReport(
  periodo: ReportPeriod,
) {
  const response =
    await http.get<unknown>(
      "/relatorios/detalhamento-compras",
      {
        params:
          periodParams(periodo),
      },
    );

  return normalizePurchaseDetails(
    response.data,
  );
}

export async function exportReports(periodo: ReportPeriod) {
  const response = await http.get<Blob>("/export/relatorios", {
    params: periodParams(periodo),
    responseType: "blob",
  });
  return response.data;
}
