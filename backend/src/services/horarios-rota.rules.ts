interface ItemHorario {
  id: string;
  tipo: string;
  ordem: number;
  hora?: Temporal.PlainTime | null;
}

interface CalcularHorariosInput {
  horaSaida: Temporal.PlainTime;
  minutosPorVisita: number;
  itens: ItemHorario[];
  minutosDeslocamento?: number;
}

function arredondarPara5Minutos(
  hora: Temporal.PlainTime,
) {
  const totalMinutos =
    hora.hour * 60 + hora.minute;

  const arredondado =
    Math.ceil(totalMinutos / 5) * 5;

  const horas =
    Math.floor(arredondado / 60) % 24;

  const minutos =
    arredondado % 60;

  return Temporal.PlainTime.from({
    hour: horas,
    minute: minutos,
  });
}

export function calcularHorariosRota({
  horaSaida,
  minutosPorVisita,
  itens,
  minutosDeslocamento = 8,
}: CalcularHorariosInput) {
  const ordenados = [...itens].sort(
    (a, b) => a.ordem - b.ordem,
  );

  let horarioAtual = horaSaida;

  return ordenados.map((item) => {
    if (item.tipo !== "visita") {
      return {
        id: item.id,
        hora: item.hora ?? null,
      };
    }

    const chegada = arredondarPara5Minutos(
      horarioAtual.add({
        minutes: minutosDeslocamento,
      }),
    );

    horarioAtual = chegada.add({
      minutes: minutosPorVisita,
    });

    return {
      id: item.id,
      hora: chegada,
    };
  });
}