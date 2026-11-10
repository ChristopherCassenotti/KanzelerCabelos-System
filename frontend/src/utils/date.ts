function partsInSaoPaulo(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

export function getTomorrowInSaoPauloISO() {
  const { year, month, day } = partsInSaoPaulo(new Date());
  const tomorrow = new Date(Date.UTC(year, month - 1, day + 1, 12));

  return [
    tomorrow.getUTCFullYear(),
    String(tomorrow.getUTCMonth() + 1).padStart(2, "0"),
    String(tomorrow.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function getTodayInSaoPauloISO() {
  const { year, month, day } = partsInSaoPaulo(new Date());
  return [year, String(month).padStart(2, "0"), String(day).padStart(2, "0")].join("-");
}

export function addDaysToISO(iso: string, amount: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount, 12));

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function startOfWeekMondayISO(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  const weekday = date.getUTCDay();
  const offset = -((weekday + 6) % 7);
  return addDaysToISO(iso, offset);
}

export function formatBusinessDateLong(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  const text = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date);

  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatBusinessDateShort(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function formatWeekdayShort(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    timeZone: "UTC",
  })
    .format(new Date(Date.UTC(year, month - 1, day, 12)))
    .replace(".", "")
    .toUpperCase();
}

export function dayNumber(iso: string) {
  return Number(iso.slice(8, 10));
}
