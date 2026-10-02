interface CalcularRecompraInput {
  ultimoCorte: Temporal.PlainDate;
  cicloRecompraMeses: number;
  hoje: Temporal.PlainDate;
}

export function calcularRecompra({
  ultimoCorte,
  cicloRecompraMeses,
  hoje,
}: CalcularRecompraInput) {
  const proximaRecompra = ultimoCorte.add({
    months: cicloRecompraMeses,
  });

  const diferenca = hoje.until(proximaRecompra, {
    largestUnit: "days",
  });

  const diasAte = diferenca.days;

  return {
    proximaRecompra,
    diasAte,
    pronta: diasAte <= 30,
  };
}