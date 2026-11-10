import type {
  RepurchaseForecastNormalized,
  RepurchaseForecastNormalizedRow,
  ReportNumeric,
} from "../types/report";

export function reportNumber(value: ReportNumeric | unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

export function reportCurrency(value: ReportNumeric | unknown, fractionDigits = 0) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(reportNumber(value));
}

export function reportDecimal(value: ReportNumeric | unknown, fractionDigits = 2) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(reportNumber(value));
}

export function reportPercent(value: ReportNumeric | unknown) {
  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(reportNumber(value))}%`;
}

export function reportWeight(value: ReportNumeric | unknown) {
  const grams = reportNumber(value);
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(grams / 1000)} kg`;
}

export function reportDate(iso: string | null | undefined) {
  if (!iso) return "-";
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function reportMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return monthKey;
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  })
    .format(new Date(Date.UTC(year, month - 1, 1, 12)))
    .replace(". de ", "/")
    .replace(" de ", "/")
    .replace(".", "");
}

export function downloadReportBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstArray(...values: unknown[]) {
  return values.find(Array.isArray) as unknown[] | undefined;
}

function monthLabelsFallback() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const year = Number(values.year);
  const month = Number(values.month);

  return [0, 1, 2].map((offset) => {
    const date = new Date(Date.UTC(year, month - 1 + offset, 1, 12));
    return new Intl.DateTimeFormat("pt-BR", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    })
      .format(date)
      .replace(". de ", "/")
      .replace(" de ", "/")
      .replace(".", "");
  });
}

function monthLabel(value: unknown, index: number) {
  if (typeof value === "string" && value.trim()) return value;
  if (isRecord(value)) {
    for (const key of ["label", "lbl", "nome", "mes", "titulo"]) {
      if (typeof value[key] === "string" && String(value[key]).trim()) return String(value[key]);
    }
  }
  return monthLabelsFallback()[index] ?? `Mês ${index + 1}`;
}

function monthValue(value: unknown) {
  if (typeof value === "number" || typeof value === "string") return reportNumber(value);
  if (!isRecord(value)) return 0;
  for (const key of ["quantidade", "total", "valor", "count", "qtd"]) {
    if (value[key] !== undefined) return reportNumber(value[key]);
  }
  return 0;
}

function normalizeForecastRow(row: unknown, descriptors: unknown[]): RepurchaseForecastNormalizedRow | null {
  if (!isRecord(row)) return null;

  const cidade = String(row.cidade ?? row.nome ?? row.city ?? "").trim();
  if (!cidade) return null;

  const vencidas = reportNumber(row.vencidas ?? row.venc ?? row.atrasadas ?? row.overdue);
  const directMonths = firstArray(row.meses, row.proximosMeses, row.janelas, row.valores);

  let meses: number[] = [];
  if (directMonths) {
    meses = directMonths.slice(0, 3).map(monthValue);
  } else if (descriptors.length) {
    meses = descriptors.slice(0, 3).map((descriptor, index) => {
      if (isRecord(descriptor)) {
        const key = descriptor.key ?? descriptor.chave ?? descriptor.id;
        if (typeof key === "string" && row[key] !== undefined) return reportNumber(row[key]);
      }
      return reportNumber(row[`mes${index + 1}`] ?? row[`m${index + 1}`]);
    });
  } else {
    meses = [
      reportNumber(row.mesAtual ?? row.mes1 ?? row.m1),
      reportNumber(row.proximoMes ?? row.mes2 ?? row.m2),
      reportNumber(row.segundoMes ?? row.mes3 ?? row.m3),
    ];
  }

  while (meses.length < 3) meses.push(0);
  const calculado = vencidas + meses.reduce((sum, value) => sum + value, 0);
  const total = row.total !== undefined ? reportNumber(row.total) : calculado;

  return { cidade, vencidas, meses: meses.slice(0, 3), total };
}

export function normalizeRepurchaseForecast(raw: unknown): RepurchaseForecastNormalized {
  const fallbackLabels = monthLabelsFallback();

  if (Array.isArray(raw)) {
    return {
      meses: fallbackLabels,
      rows: raw.map((row) => normalizeForecastRow(row, [])).filter((row): row is RepurchaseForecastNormalizedRow => Boolean(row)),
    };
  }

  if (!isRecord(raw)) return { meses: fallbackLabels, rows: [] };

  const descriptors = firstArray(raw.meses, raw.meses3, raw.proximosMeses, raw.janelas) ?? [];
  let rowsRaw = firstArray(raw.cidades, raw.itens, raw.previsao, raw.dados, raw.rows, raw.porCidade) ?? [];

  if (!rowsRaw.length && isRecord(raw.porCidade)) {
    rowsRaw = Object.entries(raw.porCidade).map(([cidade, value]) => ({
      cidade,
      ...(isRecord(value) ? value : { total: value }),
    }));
  }

  const labels = [0, 1, 2].map((index) => monthLabel(descriptors[index], index));
  const rows = rowsRaw
    .map((row) => normalizeForecastRow(row, descriptors))
    .filter((row): row is RepurchaseForecastNormalizedRow => Boolean(row))
    .sort((a, b) => b.total - a.total || a.cidade.localeCompare(b.cidade, "pt-BR"));

  return { meses: labels, rows };
}
